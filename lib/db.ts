import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/lib/config/env";

/**
 * 클라이언트 사이드용 Supabase 클라이언트 (anon key)
 * 브라우저에서 사용할 때는 이 클라이언트를 사용하세요.
 */
export const supabase: SupabaseClient = createClient(
  config.supabase.url || "https://placeholder.supabase.co",
  config.supabase.anonKey || "placeholder-anon-key"
);

/**
 * 서버 사이드용 Supabase 클라이언트 (service role key)
 * ⚠️ 주의: 서버에서만 사용하세요! 절대 클라이언트에 노출되면 안 됩니다.
 * RLS 정책을 우회하므로 서버 사이드 API 라우트에서만 사용합니다.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  config.supabase.url || "https://placeholder.supabase.co",
  config.supabase.serviceRoleKey || "placeholder-service-role-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * punding 스키마를 사용하는 헬퍼 함수 (서버 사이드용)
 */
export function getPundingTable(tableName: string) {
  return supabaseAdmin.schema("punding").from(tableName);
}
