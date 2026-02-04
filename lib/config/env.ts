/**
 * 환경변수 검증 및 설정
 */

export function validateEnv() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY", // 서버 사이드용
    "CAFE24_CLIENT_ID",
    "CAFE24_CLIENT_SECRET",
    "CAFE24_REDIRECT_URI",
    "JWT_SECRET",
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// 환경변수 타입 안전성을 위한 설정
// 빌드 시점에는 환경 변수가 없을 수 있으므로 기본값 제공
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "", // 서버 사이드용 (RLS 우회)
  },
  cafe24: {
    clientId: process.env.CAFE24_CLIENT_ID || "",
    clientSecret: process.env.CAFE24_CLIENT_SECRET || "",
    redirectUri: process.env.CAFE24_REDIRECT_URI || "",
    apiVersion: process.env.CAFE24_API_VERSION || "2025-06-01",
    baseUrl: process.env.CAFE24_BASE_URL || "cafe24api.com",
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    isProduction: process.env.NODE_ENV === "production",
  },
};

// 환경변수 검증은 런타임에만 실행 (API 호출 시점)
// 빌드 시점에는 검증하지 않음
