/**
 * Next.js Middleware - 경로 보호
 * 대시보드 경로에 대한 인증 검증
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔒 대시보드 경로 보호
  if (pathname.startsWith("/dashboard")) {
    const session = await getSession(request);

    // 세션 없으면 홈으로 리다이렉트
    if (!session) {
      console.log("❌ [Middleware] 세션 없음, 홈으로 리다이렉트");
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "?error=unauthorized";
      return NextResponse.redirect(url);
    }

    // mall_id 파라미터와 세션 mall_id 비교
    const mallId = request.nextUrl.searchParams.get("mall_id");
    if (mallId && session.mall_id !== mallId) {
      console.log("❌ [Middleware] 권한 없는 mall_id 접근 시도", {
        sessionMallId: session.mall_id,
        requestedMallId: mallId,
      });
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "?error=unauthorized";
      return NextResponse.redirect(url);
    }

    console.log("✅ [Middleware] 인증 성공", {
      mall_id: session.mall_id,
      pathname,
    });
  }

  return NextResponse.next();
}

// Middleware가 실행될 경로 지정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
