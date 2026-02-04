import { NextRequest, NextResponse } from "next/server";
import { cafe24Scopes } from "@/lib/constants/cafe24Scopes";
import { supabaseAdmin } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mall_id = searchParams.get("mall_id");
  const state = searchParams.get("state"); // 클라이언트에서 생성한 state 받기

  console.log("🚀 OAuth 권한 요청 시작", {
    mall_id,
    client_id: process.env.CAFE24_CLIENT_ID?.slice(0, 10) + "...",
    redirect_uri: process.env.CAFE24_REDIRECT_URI,
    hasState: !!state,
  });

  if (!mall_id) {
    console.error("❌ mall_id 파라미터 누락");
    return NextResponse.json(
      { error: "Missing mall_id parameter" },
      { status: 400 }
    );
  }

  if (!state) {
    console.error("❌ state 파라미터 누락");
    return NextResponse.json(
      { error: "Missing state parameter" },
      { status: 400 }
    );
  }

  // state 값 검증 (mall_id:랜덤문자열 형식 확인)
  if (!state.startsWith(`${mall_id}:`)) {
    console.error("❌ State 형식이 올바르지 않음:", state);
    return NextResponse.json(
      { error: "Invalid state format" },
      { status: 400 }
    );
  }

  // state 값을 DB에 저장 (만료 시간 10분) - 검증용
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin.schema("punding").from("oauth_states").insert({
    state,
    mall_id,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ State 저장 실패:", {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: error,
    });
    return NextResponse.json(
      { 
        error: "Failed to save state",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        code: error.code,
      },
      { status: 500 }
    );
  }

  console.log("🔐 State 저장 완료:", {
    state: state.slice(0, 20) + "...",
  });

  // OAuth 권한 요청 URL 생성
  const authorizeUrl = new URL(
    `https://${mall_id}.cafe24api.com/api/v2/oauth/authorize`
  );

  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", process.env.CAFE24_CLIENT_ID!);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    process.env.CAFE24_REDIRECT_URI!
  );
  authorizeUrl.searchParams.set("state", state); // 안전한 state 사용
  authorizeUrl.searchParams.set("scope", cafe24Scopes.join(" ")); // 필수 scope 추가

  console.log("🔗 카페24 권한 페이지로 리다이렉트:", authorizeUrl.toString());

  // 권한 요청 페이지로 리다이렉트
  return NextResponse.redirect(authorizeUrl.toString());
}
