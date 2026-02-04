-- ============================================
-- kment-punding 초기 데이터베이스 스키마 생성
-- ============================================
-- 이 파일을 새로운 Supabase 프로젝트에서 가장 먼저 실행하세요.

-- ============================================
-- 0. punding 스키마 생성
-- ============================================
CREATE SCHEMA IF NOT EXISTS punding;

-- ============================================
-- 1. shops 테이블 생성 (OAuth 토큰 관리)
-- ============================================
CREATE TABLE IF NOT EXISTS punding.shops (
  -- 기본 정보
  mall_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enabled BOOLEAN DEFAULT true,
  
  -- OAuth 토큰 정보
  user_id VARCHAR(255),
  shop_no VARCHAR(50) DEFAULT '1',
  scopes JSONB,
  issued_at TIMESTAMP WITH TIME ZONE,
  
  -- 쇼핑몰 상세 정보 (Cafe24 /admin/store API)
  shop_name VARCHAR(255),
  primary_domain VARCHAR(255),
  base_domain VARCHAR(255),
  country VARCHAR(100),
  country_code VARCHAR(10)
);

-- ============================================
-- 2. oauth_states 테이블 생성 (OAuth state 검증)
-- ============================================
CREATE TABLE IF NOT EXISTS punding.oauth_states (
  state TEXT PRIMARY KEY,
  mall_id TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. funding_products 테이블 생성 (펀딩 상품 설정)
-- ============================================
CREATE TABLE IF NOT EXISTS punding.funding_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mall_id TEXT NOT NULL REFERENCES punding.shops(mall_id) ON DELETE CASCADE,
  
  -- 상품 정보
  product_no TEXT NOT NULL, -- 카페24 상품번호
  product_name TEXT, -- 상품명 (캐시용, 카페24 API에서 가져옴)
  
  -- 펀딩 설정
  enabled BOOLEAN DEFAULT true, -- 활성화 여부
  initial_price NUMERIC(10, 2) NOT NULL, -- 초기 판매가
  
  -- 단계별 가격 설정
  -- 예: [{"target": 100, "price": 18000}, {"target": 200, "price": 15000}]
  price_steps JSONB DEFAULT '[]'::jsonb,
  
  -- 판매량 관리
  current_sales INTEGER DEFAULT 0, -- 실제 판매 수량 (카페24 API에서 가져옴)
  display_multiplier NUMERIC(5, 2) DEFAULT 1.0, -- 노출 배수 (기본값 1배)
  include_cancellations BOOLEAN DEFAULT false, -- 취소/환불 반영 여부
  manual_sales_override INTEGER, -- 수동 설정 판매량 (null이면 current_sales 사용)
  
  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약 조건: 같은 쇼핑몰에서 같은 상품번호는 중복 불가
  UNIQUE(mall_id, product_no)
);

-- ============================================ 
-- 4. 인덱스 생성 (성능 최적화)
-- ============================================
-- shops 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_shops_mall_id ON punding.shops(mall_id);
CREATE INDEX IF NOT EXISTS idx_shops_enabled ON punding.shops(enabled);
CREATE INDEX IF NOT EXISTS idx_shops_expires_at ON punding.shops(expires_at);

-- oauth_states 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_oauth_states_mall_id ON punding.oauth_states(mall_id);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON punding.oauth_states(expires_at);

-- funding_products 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_funding_products_mall_id ON punding.funding_products(mall_id);
CREATE INDEX IF NOT EXISTS idx_funding_products_product_no ON punding.funding_products(product_no);
CREATE INDEX IF NOT EXISTS idx_funding_products_enabled ON punding.funding_products(enabled);
CREATE INDEX IF NOT EXISTS idx_funding_products_mall_enabled ON punding.funding_products(mall_id, enabled);

-- ============================================
-- 5. 주석 추가 (문서화)
-- ============================================
COMMENT ON TABLE punding.shops IS '카페24 쇼핑몰 정보 및 OAuth 토큰 관리';
COMMENT ON TABLE punding.oauth_states IS 'OAuth 인증 state 검증용 임시 테이블';
COMMENT ON TABLE punding.funding_products IS '펀딩/예약 판매 상품 설정';

-- funding_products 컬럼 주석
COMMENT ON COLUMN punding.funding_products.id IS '펀딩 상품 고유 ID';
COMMENT ON COLUMN punding.funding_products.mall_id IS '쇼핑몰 ID (shops 테이블 참조)';
COMMENT ON COLUMN punding.funding_products.product_no IS '카페24 상품번호';
COMMENT ON COLUMN punding.funding_products.product_name IS '상품명 (캐시용)';
COMMENT ON COLUMN punding.funding_products.enabled IS '펀딩 기능 활성화 여부';
COMMENT ON COLUMN punding.funding_products.initial_price IS '초기 판매가';
COMMENT ON COLUMN punding.funding_products.price_steps IS '단계별 목표 수량과 가격 설정 (JSON 배열)';
COMMENT ON COLUMN punding.funding_products.current_sales IS '실제 판매 수량 (카페24 API에서 가져옴)';
COMMENT ON COLUMN punding.funding_products.display_multiplier IS '노출 배수 (예: 10배 설정 시 실제 30개 → 노출 300개)';
COMMENT ON COLUMN punding.funding_products.include_cancellations IS '취소/환불 건을 판매량에 반영할지 여부';
COMMENT ON COLUMN punding.funding_products.manual_sales_override IS '수동 설정 판매량 (null이면 current_sales 사용)';

-- ============================================
-- 6. updated_at 자동 업데이트 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- shops 테이블 트리거
CREATE TRIGGER update_shops_updated_at 
  BEFORE UPDATE ON punding.shops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- funding_products 테이블 트리거
CREATE TRIGGER update_funding_products_updated_at 
  BEFORE UPDATE ON punding.funding_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. oauth_states 자동 정리 함수 (만료된 state 삭제)
-- ============================================
CREATE OR REPLACE FUNCTION punding.cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM punding.oauth_states 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 완료 메시지
-- ============================================
-- ============================================
-- 8. 스키마 권한 설정
-- ============================================
-- authenticated 역할에 권한 부여
GRANT USAGE ON SCHEMA punding TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA punding TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA punding TO authenticated;

-- service_role 역할에 권한 부여 (서버 사이드 접근용)
GRANT USAGE ON SCHEMA punding TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA punding TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA punding TO service_role;

-- anon 역할에 권한 부여 (필요한 경우)
GRANT USAGE ON SCHEMA punding TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA punding TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA punding TO anon;

-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ kment-punding 초기 스키마 생성 완료!';
  RAISE NOTICE '📌 생성된 스키마: punding';
  RAISE NOTICE '📌 생성된 테이블: punding.shops, punding.oauth_states, punding.funding_products';
END $$;
