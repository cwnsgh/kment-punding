// [DB] mall_id로 shops 테이블에서 상점 정보를 조회하는 함수
import { supabase } from "../db";
import { logger } from "@/lib/utils/logger";

// 간단한 메모리 캐시 (프로덕션에서는 Redis 사용 권장)
const shopCache = new Map();
const SHOP_CACHE_DURATION = 10 * 60 * 1000; // 10분

export async function getShopByMallId(mall_id: string) {
  // 캐시 확인
  const cached = shopCache.get(mall_id);
  if (cached && Date.now() - cached.timestamp < SHOP_CACHE_DURATION) {
    logger.info("캐시된 shop 정보 사용", { mall_id });
    return cached.data;
  }

  try {
    const { data, error } = await supabase
      .schema("punding")
      .from("shops")
      .select("*")
      .eq("mall_id", mall_id)
      .single();

    if (error) {
      logger.error("쇼핑몰 정보 조회 실패", { mall_id, error });
      return null;
    }

    // 캐시에 저장
    shopCache.set(mall_id, {
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    logger.error("쇼핑몰 정보 조회 중 예외 발생", { mall_id, error });
    return null;
  }
}

/**
 * 특정 mall_id의 shopCache를 무효화합니다.
 * 토큰 상태 변경 시 캐시 동기화를 위해 사용됩니다.
 */
export function invalidateShopCache(mall_id: string): void {
  if (shopCache.has(mall_id)) {
    shopCache.delete(mall_id);
    logger.debug("shopCache 무효화", { mall_id });
  }
}

/**
 * 전체 shopCache를 무효화합니다.
 * 긴급 상황이나 전체 초기화가 필요할 때 사용됩니다.
 */
export function invalidateAllShopCache(): void {
  const size = shopCache.size;
  shopCache.clear();
  logger.info("전체 shopCache 무효화", { clearedCount: size });
}
