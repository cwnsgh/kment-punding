-- ============================================
-- Supabase PostgREST에 punding 스키마 노출 설정
-- ============================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.

-- PostgREST 설정 확인 (현재 노출된 스키마)
SELECT current_setting('app.settings.db_schema', true);

-- punding 스키마를 PostgREST에 노출
-- 주의: 이 설정은 Supabase 대시보드의 Database → Settings에서도 변경 가능합니다.
-- 또는 Supabase 프로젝트 설정에서 "Exposed schemas"에 "punding" 추가

-- 방법 1: Supabase 대시보드에서 설정
-- 1. Database → Settings → API Settings
-- 2. "Exposed schemas" 필드에 "public,punding" 입력
-- 3. Save

-- 방법 2: 직접 설정 (Supabase 관리자 권한 필요)
-- ALTER DATABASE postgres SET app.settings.db_schema = 'public,punding';

-- 권한 재설정 (확실하게 하기 위해)
GRANT USAGE ON SCHEMA punding TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA punding TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA punding TO service_role;

GRANT USAGE ON SCHEMA punding TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA punding TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA punding TO authenticated;

GRANT USAGE ON SCHEMA punding TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA punding TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA punding TO anon;
