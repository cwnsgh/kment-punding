/**
 * 서버 측 세션 관리 유틸리티
 * HttpOnly 쿠키 기반 인증 시스템
 */

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { logger } from "@/lib/utils/logger";

// JWT_SECRET 환경 변수 체크 (런타임에만)
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // 빌드 시점에는 에러를 던지지 않음
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET 환경 변수가 설정되지 않았습니다!");
    }
    return new TextEncoder().encode("dev-secret-key"); // 개발용 기본값
  }
  return new TextEncoder().encode(secret);
};

const COOKIE_NAME = "kment_punding_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export interface SessionData {
  mall_id: string;
  user_id?: string;
  shop_no?: string;
  iat: number;
  exp: number;
}

/**
 * JWT 토큰 생성
 */
export async function createSession(data: {
  mall_id: string;
  user_id?: string;
  shop_no?: string;
}): Promise<string> {
  const JWT_SECRET = getJwtSecret();
  
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

/**
 * JWT 토큰 검증
 */
export async function verifySession(
  token: string
): Promise<SessionData | null> {
  try {
    const JWT_SECRET = getJwtSecret();
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // 타입 안전성 검증
    if (
      typeof payload.mall_id === "string" &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number"
    ) {
      return payload as unknown as SessionData;
    }

    return null;
  } catch (error) {
    logger.error("세션 검증 실패", { error });
    return null;
  }
}

/**
 * 요청에서 세션 추출 및 검증
 */
export async function getSession(
  req: NextRequest
): Promise<SessionData | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return await verifySession(token);
}

/**
 * mall_id 권한 검증
 */
export async function verifyMallAccess(
  req: NextRequest,
  requestedMallId: string
): Promise<boolean> {
  const session = await getSession(req);

  if (!session) {
    logger.warn("세션 없음", { requestedMallId });
    return false;
  }

  if (session.mall_id !== requestedMallId) {
    logger.warn("권한 없는 mall_id 접근 시도", {
      sessionMallId: session.mall_id,
      requestedMallId,
    });
    return false;
  }

  return true;
}

/**
 * 응답에 세션 쿠키 설정
 */
export function setSessionCookie(
  response: NextResponse,
  token: string
): NextResponse {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true, // 🔒 JavaScript에서 접근 불가
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

/**
 * 세션 쿠키 삭제
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE_NAME);
  return response;
}

/**
 * 현재 세션의 mall_id 가져오기 (API 내부용)
 */
export async function getSessionMallId(
  req: NextRequest
): Promise<string | null> {
  const session = await getSession(req);
  return session?.mall_id || null;
}

/**
 * 권한 체크 미들웨어 헬퍼
 */
export async function requireAuth(
  req: NextRequest,
  requestedMallId?: string
): Promise<{ authorized: boolean; session: SessionData | null }> {
  const session = await getSession(req);

  if (!session) {
    return { authorized: false, session: null };
  }

  if (requestedMallId && session.mall_id !== requestedMallId) {
    return { authorized: false, session };
  }

  return { authorized: true, session };
}
