import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // OAuth 에러가 발생한 경우
  if (error) {
    logger.error("❌ OAuth 에러 발생", { error, error_description, state });
    return NextResponse.redirect(
      `/?error=oauth_failed&error_description=${encodeURIComponent(
        error_description || error
      )}&mall_id=${state?.split(":")[0] || ""}`
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  // 🔐 STATE 검증 - CSRF 공격 방지
  const { data: stateData, error: stateError } = await supabaseAdmin
    .schema("punding")
    .from("oauth_states")
    .select("*")
    .eq("state", state)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (stateError || !stateData) {
    logger.error("❌ State 검증 실패", { stateError, state });
    return NextResponse.json(
      { error: "Invalid or expired state parameter" },
      { status: 400 }
    );
  }

  // state에서 mall_id 추출
  const mall_id = stateData.mall_id;

  // 사용된 state 삭제 (재사용 방지)
  await supabaseAdmin.schema("punding").from("oauth_states").delete().eq("state", state);

  logger.info("✅ State 검증 성공", { mall_id });

  try {
    logger.info("🔐 OAuth Callback 처리 시작", { mall_id });

    // 1. 카페24 토큰 요청

    // Basic Auth 헤더 생성 (Client ID:Client Secret을 Base64로 인코딩)
    const credentials = btoa(
      `${process.env.CAFE24_CLIENT_ID}:${process.env.CAFE24_CLIENT_SECRET}`
    );

    const tokenRes = await fetch(
      `https://${mall_id}.cafe24api.com/api/v2/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.CAFE24_REDIRECT_URI!,
        }),
      }
    );

    const token = await tokenRes.json();

    if (!token.access_token) {
      logger.error("❌ 토큰 요청 실패", {
        status: tokenRes.status,
        error: token.error,
        error_description: token.error_description,
        mall_id,
      });
      return NextResponse.json(
        { error: "Failed to get access token", details: token },
        { status: 500 }
      );
    }

    logger.info("✅ 토큰 획득 성공", { mall_id, userId: token.user_id });

    // 2. 쇼핑몰 상세 정보 조회
    let storeInfo = null;
    try {
      const storeResponse = await fetch(
        `https://${mall_id}.cafe24api.com/api/v2/admin/store?shop_no=${
          token.shop_no || "1"
        }`,
        {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            "Content-Type": "application/json",
            "X-Cafe24-Api-Version":
              process.env.CAFE24_API_VERSION || "2025-06-01",
          },
        }
      );

      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        storeInfo = storeData.store;
        logger.info("✅ 쇼핑몰 정보 조회 성공", {
          mall_id,
          shop_name: storeInfo.shop_name,
        });
      } else {
        logger.warn("⚠️ 쇼핑몰 정보 조회 실패 (계속 진행)", {
          status: storeResponse.status,
          mall_id,
        });
      }
    } catch (storeError) {
      logger.warn("⚠️ 쇼핑몰 정보 조회 중 오류 (계속 진행)", {
        mall_id,
        error: storeError,
      });
    }

    // 3. Supabase에 저장

    // 타임존 처리 함수 (Cafe24는 타임존 없이 반환하므로 +09:00 추가)
    const addTimezone = (dateStr: string | undefined) => {
      if (!dateStr) return undefined;
      return dateStr.endsWith("Z") || dateStr.includes("+")
        ? dateStr
        : dateStr + "+09:00";
    };

    const { data, error: dbError } = await supabaseAdmin.schema("punding").from("shops").upsert({
      // 토큰 response에서 받은 정보
      mall_id: token.mall_id || mall_id,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: addTimezone(token.expires_at),
      refresh_expires_at: addTimezone(token.refresh_token_expires_at),
      user_id: token.user_id,
      shop_no: token.shop_no || "1",
      scopes: token.scopes,
      issued_at: addTimezone(token.issued_at),

      // admin/store API에서 받은 정보
      shop_name: storeInfo?.shop_name,
      primary_domain: storeInfo?.primary_domain,
      base_domain: storeInfo?.base_domain,
      country: storeInfo?.country,
      country_code: storeInfo?.country_code,

      // 앱 설정
      enabled: true,
      created_at: addTimezone(token.issued_at) || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      logger.error("❌ Supabase 저장 실패", { mall_id, error: dbError });
      return NextResponse.json(
        { error: "Failed to save to database", details: dbError },
        { status: 500 }
      );
    }

    logger.info("✅ Supabase 저장 성공", { mall_id });

    // 4. 성공 시 대시보드로 리다이렉트
    const redirectUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/dashboard?mall_id=${mall_id}`;

    logger.info("✅ OAuth Callback 완료 - 대시보드로 리다이렉트", { mall_id });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logger.error("❌ OAuth Callback 처리 중 오류", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
