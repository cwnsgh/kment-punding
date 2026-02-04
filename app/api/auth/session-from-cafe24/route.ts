import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { logger } from "@/lib/utils/logger";
import { supabaseAdmin } from "@/lib/db";
import crypto from "crypto";

/**
 * 카페24 앱 실행 시 세션 생성 API
 *
 * 카페24에서 제공하는 URL 파라미터를 받아:
 * 1. HMAC 검증 (CAFE24_CLIENT_SECRET 사용)
 * 2. 세션 생성 (HttpOnly 쿠키)
 * 3. 대시보드로 리다이렉트
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 카페24 URL 파라미터 추출
    const auth_config = searchParams.get("auth_config");
    const is_multi_shop = searchParams.get("is_multi_shop");
    const mall_id = searchParams.get("mall_id");
    const user_id = searchParams.get("user_id");
    const user_name = searchParams.get("user_name");
    const shop_no = searchParams.get("shop_no");
    const timestamp = searchParams.get("timestamp");
    const hmac = searchParams.get("hmac");
    const lang = searchParams.get("lang");
    const nation = searchParams.get("nation");
    const user_type = searchParams.get("user_type");

    logger.info("🔐 카페24 세션 생성 요청 시작", {
      mall_id,
      user_id,
      timestamp: timestamp
        ? new Date(parseInt(timestamp) * 1000).toISOString()
        : null,
      hasHmac: !!hmac,
    });

    // 필수 파라미터 검증
    if (!mall_id) {
      logger.error("❌ mall_id 파라미터 누락");
      return NextResponse.json(
        {
          success: false,
          error: "mall_id parameter is required",
          code: "MISSING_MALL_ID",
        },
        { status: 400 }
      );
    }

    if (!user_id) {
      logger.error("❌ user_id 파라미터 누락");
      return NextResponse.json(
        {
          success: false,
          error: "user_id parameter is required",
          code: "MISSING_USER_ID",
        },
        { status: 400 }
      );
    }

    // 🔒 HMAC 검증
    if (hmac) {
      logger.info("🔐 HMAC 검증 시작");

      const clientSecret = process.env.CAFE24_CLIENT_SECRET;

      if (!clientSecret) {
        logger.error("❌ CAFE24_CLIENT_SECRET 환경변수가 설정되지 않음");
        return NextResponse.json(
          {
            success: false,
            error: "Server configuration error - CAFE24_CLIENT_SECRET not set",
            code: "MISSING_SECRET",
          },
          { status: 500 }
        );
      }

      // HMAC 검증 로직 (카페24 가이드 방식: 원본 쿼리 스트링 사용)
      const isValid = verifyHMAC(req.url, hmac, clientSecret);

      if (!isValid) {
        logger.error("❌ HMAC 검증 실패", {
          mall_id,
          user_id,
          hmacPrefix: hmac.substring(0, 10),
        });
        return NextResponse.json(
          {
            success: false,
            error: "Invalid HMAC - Request may be tampered with",
            code: "INVALID_HMAC",
          },
          { status: 401 }
        );
      }

      logger.info("✅ HMAC 검증 성공");
    } else {
      logger.warn("⚠️ HMAC 파라미터 없음 (개발 모드 - 보안 경고)");

      // 개발 환경에서만 HMAC 없이 진행 허용
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            success: false,
            error: "HMAC parameter is required in production",
            code: "MISSING_HMAC",
          },
          { status: 400 }
        );
      }
    }

    // 🔒 Replay Attack 방지: 타임스탬프 검증 (2시간 제한)
    // 카페24 개발자센터 보안 요구사항: 앱 실행 요청 시점부터 2시간 이상 지난 호출 무효 처리
    if (!timestamp) {
      logger.error(
        "❌ timestamp 파라미터 누락 (Replay Attack 방지를 위해 필수)"
      );
      return NextResponse.json(
        {
          success: false,
          error: "timestamp parameter is required for security",
          code: "MISSING_TIMESTAMP",
        },
        { status: 400 }
      );
    }

    const requestTime = parseInt(timestamp) * 1000;
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    const maxAge = 2 * 60 * 60 * 1000; // 2시간 (7200초)

    if (timeDiff > maxAge) {
      const timeDiffHours = Math.floor(timeDiff / 1000 / 60 / 60);
      logger.error("❌ Replay Attack 차단: 타임스탬프가 2시간 이상 지남", {
        requestTime: new Date(requestTime).toISOString(),
        currentTime: new Date(currentTime).toISOString(),
        timeDiffHours,
        timeDiffMinutes: Math.floor(timeDiff / 1000 / 60),
      });
      return NextResponse.json(
        {
          success: false,
          error:
            "Request timestamp is too old (more than 2 hours). This may be a replay attack.",
          code: "TIMESTAMP_TOO_OLD",
          timeDiffHours,
        },
        { status: 401 }
      );
    }

    logger.info("✅ 타임스탬프 검증 통과", {
      requestTime: new Date(requestTime).toISOString(),
      timeDiffMinutes: Math.floor(timeDiff / 1000 / 60),
    });

    // DB에서 쇼핑몰 정보 확인 (punding 스키마 사용)
    logger.info("📊 DB에서 쇼핑몰 정보 조회", { mall_id });

    const { data: shop, error: shopError } = await supabaseAdmin
      .schema("punding")
      .from("shops")
      .select("*")
      .eq("mall_id", mall_id)
      .single();

    // 🔒 처음 설치하는 사용자는 OAuth 인증 필요!
    if (shopError || !shop) {
      logger.warn("⚠️ DB에 쇼핑몰 정보 없음 - OAuth 인증 필요", {
        error: shopError?.message,
        mall_id,
      });

      // OAuth 인증 페이지로 리다이렉트 (클라이언트에서 state 생성하도록 루트로 리다이렉트)
      const oauthUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/?mall_id=${mall_id}&oauth_required=true`;

      logger.info("🔄 처음 설치 사용자 - OAuth 인증으로 리다이렉트", {
        oauthUrl,
      });

      return NextResponse.redirect(oauthUrl);
    }

    // 토큰이 있는지 확인
    if (!shop.access_token || !shop.refresh_token) {
      logger.warn("⚠️ 토큰이 없음 - OAuth 인증 필요", { mall_id });

      // OAuth 인증 페이지로 리다이렉트
      const oauthUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/?mall_id=${mall_id}&oauth_required=true`;

      return NextResponse.redirect(oauthUrl);
    }

    logger.info("✅ DB 쇼핑몰 정보 확인", {
      mall_id: shop.mall_id,
      enabled: shop.enabled,
      hasTokens: !!shop.access_token,
    });

    // 세션 생성
    logger.info("🎫 세션 생성 시작", { mall_id, user_id });

    const sessionToken = await createSession({
      mall_id,
      user_id: user_id || undefined,
      shop_no: shop_no || undefined,
    });

    logger.info("✅ 세션 생성 완료", { mall_id });

    // 응답 생성 (대시보드로 리다이렉트)
    const redirectUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/dashboard?mall_id=${mall_id}`;

    logger.info("🔄 대시보드로 리다이렉트", { redirectUrl });

    // 🔒 서버에서 직접 리다이렉트 (쿠키가 제대로 전달되도록)
    const response = NextResponse.redirect(redirectUrl);

    // 🔒 HttpOnly 쿠키 설정
    setSessionCookie(response, sessionToken);

    logger.info("✅ 세션 쿠키 설정 완료, 대시보드로 리다이렉트");

    return response;
  } catch (error) {
    logger.error("❌ 카페24 세션 생성 중 오류", { error });

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * HMAC 검증 함수
 *
 * 카페24 가이드 방식:
 * - 원본 쿼리 스트링에서 hmac 파라미터를 제외한 나머지를 그대로 사용
 * - 파라미터 재정렬하지 않고 원본 순서 유지
 * - 공유 비밀 키로 HMAC-SHA256 생성
 *
 * Java 가이드 로직:
 * String plain_query = query_string.substring(0, query_string.lastIndexOf("&"));
 */
function verifyHMAC(
  fullUrl: string,
  receivedHmac: string,
  secretKey: string
): boolean {
  try {
    // URL에서 쿼리 스트링 부분 추출
    const urlObj = new URL(fullUrl);
    const queryString = urlObj.search.substring(1); // '?' 제거

    // hmac 파라미터를 제외한 plain_query 생성
    // 마지막 '&hmac=...' 부분을 제거
    const lastIndexOfAmpersand = queryString.lastIndexOf("&hmac=");
    if (lastIndexOfAmpersand === -1) {
      logger.error("❌ HMAC 파라미터를 찾을 수 없음", {
        queryString: queryString.substring(0, 200),
      });
      return false;
    }

    const plain_query = queryString.substring(0, lastIndexOfAmpersand);

    // HMAC-SHA256 생성 (UTF-8 인코딩 사용)
    const computedHmac = crypto
      .createHmac("sha256", secretKey)
      .update(plain_query, "utf-8")
      .digest("base64");

    // 받은 HMAC은 URL 인코딩되어 있으므로 디코딩
    const decodedReceivedHmac = decodeURIComponent(receivedHmac);

    const isValid = computedHmac === decodedReceivedHmac;

    if (!isValid) {
      // ❌ 실패 시에만 상세 로그 출력
      logger.error("❌ HMAC 검증 실패 - 상세 정보", {
        plain_query: plain_query,
        receivedHmac: decodedReceivedHmac,
        computedHmac: computedHmac,
        match: false,
      });
    } else {
      // ✅ 성공 시 핵심 정보만 간단히 로깅
      logger.info("✅ HMAC 검증 성공", {
        plain_query: plain_query,
        paramCount: plain_query.split("&").length,
      });
    }

    return isValid;
  } catch (error) {
    logger.error("❌ HMAC 검증 중 오류", { error });
    return false;
  }
}
