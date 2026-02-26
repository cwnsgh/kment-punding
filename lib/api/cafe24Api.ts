/**
 * 카페24 API 공통 유틸리티
 * 펀딩 기능에 필요한 API 호출 함수들
 */

import { config } from "@/lib/config/env";
import { logger } from "@/lib/utils/logger";
import { supabaseAdmin } from "@/lib/db";

export interface Cafe24ApiOptions {
  mallId: string;
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
  accessToken?: string;
}

export interface Cafe24ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * 카페24 API URL 생성
 */
export function createCafe24ApiUrl(mallId: string, endpoint: string): string {
  return `https://${mallId}.${config.cafe24.baseUrl}/api/v2/${endpoint}`;
}

/**
 * 카페24 API 기본 헤더 생성
 */
export function createCafe24ApiHeaders(
  accessToken?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": config.cafe24.apiVersion,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

/**
 * 카페24 API 호출 함수
 */
export async function callCafe24Api<T = any>(
  options: Cafe24ApiOptions
): Promise<Cafe24ApiResponse<T>> {
  const {
    mallId,
    endpoint,
    method = "GET",
    headers = {},
    body,
    accessToken,
  } = options;

  const url = createCafe24ApiUrl(mallId, endpoint);
  const apiHeaders = {
    ...createCafe24ApiHeaders(accessToken),
    ...headers,
  };

  logger.info("카페24 API 호출", {
    url,
    method,
    mallId,
    endpoint,
    hasAccessToken: !!accessToken,
  });

  try {
    const requestOptions: RequestInit = {
      method,
      headers: apiHeaders,
    };

    if (body && method !== "GET") {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("카페24 API 에러", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url,
        mallId,
        endpoint,
      });

      return {
        success: false,
        error: `카페24 API 에러: ${response.status} - ${errorText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    logger.info("카페24 API 응답 성공", {
      url,
      mallId,
      endpoint,
      hasData: !!data,
    });

    return {
      success: true,
      data,
    };
  } catch (error) {
    logger.error("카페24 API 호출 중 예외 발생", {
      error,
      url,
      mallId,
      endpoint,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    };
  }
}

/**
 * 액세스 토큰 갱신
 */
export async function refreshAccessToken(mallId: string): Promise<string | null> {
  try {
    const { data: shop, error } = await supabaseAdmin
      .schema("punding")
      .from("shops")
      .select("refresh_token, access_token")
      .eq("mall_id", mallId)
      .single();

    if (error || !shop) {
      logger.error("쇼핑몰 정보 조회 실패", { mallId, error });
      return null;
    }

    // Basic Auth 헤더 생성
    const credentials = btoa(
      `${config.cafe24.clientId}:${config.cafe24.clientSecret}`
    );

    const tokenRes = await fetch(
      `https://${mallId}.${config.cafe24.baseUrl}/api/v2/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: shop.refresh_token,
        }),
      }
    );

    const token = await tokenRes.json();

    if (!token.access_token) {
      logger.error("토큰 갱신 실패", {
        mallId,
        error: token.error,
        error_description: token.error_description,
      });
      return null;
    }

    // 새 토큰을 DB에 저장
    const expiresAt = token.expires_at
      ? new Date(token.expires_at).toISOString()
      : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 기본 2시간

    await supabaseAdmin
      .schema("punding")
      .from("shops")
      .update({
        access_token: token.access_token,
        refresh_token: token.refresh_token || shop.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("mall_id", mallId);

    logger.info("토큰 갱신 성공", { mallId });

    return token.access_token;
  } catch (error) {
    logger.error("토큰 갱신 중 오류", { mallId, error });
    return null;
  }
}

/**
 * 유효한 액세스 토큰 가져오기 (만료 시 자동 갱신)
 */
export async function getValidAccessToken(
  mallId: string
): Promise<string | null> {
  const { data: shop, error } = await supabaseAdmin
    .schema("punding")
    .from("shops")
    .select("access_token, expires_at")
    .eq("mall_id", mallId)
    .single();

  if (error || !shop) {
    logger.error("쇼핑몰 정보 조회 실패", { mallId, error });
    return null;
  }

  // 토큰 만료 시간 확인 (5분 여유)
  const expiresAt = new Date(shop.expires_at);
  const now = new Date();
  const buffer = 5 * 60 * 1000; // 5분

  if (expiresAt.getTime() - now.getTime() < buffer) {
    logger.info("토큰 만료 임박 - 갱신 필요", { mallId });
    return await refreshAccessToken(mallId);
  }

  return shop.access_token;
}

/**
 * 상품 정보 조회
 */
export async function getProductInfo(
  mallId: string,
  productNo: string,
  accessToken?: string
): Promise<any> {
  const token = accessToken || (await getValidAccessToken(mallId));
  if (!token) {
    throw new Error("액세스 토큰을 가져올 수 없습니다.");
  }

  const result = await callCafe24Api({
    mallId,
    endpoint: `admin/products/${productNo}`,
    method: "GET",
    accessToken: token,
  });

  if (!result.success || !result.data) {
    logger.error("상품 정보 조회 실패", {
      mallId,
      productNo,
      error: result.error,
      status: result.status,
    });
    throw new Error(result.error || "상품 정보를 가져올 수 없습니다.");
  }

  logger.info("상품 정보 조회 성공", {
    mallId,
    productNo,
    productName: result.data.product?.product_name,
  });

  return result.data.product;
}

/**
 * 상품 가격 업데이트
 */
export async function updateProductPrice(
  mallId: string,
  productNo: string,
  price: number,
  accessToken?: string
): Promise<boolean> {
  const token = accessToken || (await getValidAccessToken(mallId));
  if (!token) {
    throw new Error("액세스 토큰을 가져올 수 없습니다.");
  }

  const result = await callCafe24Api({
    mallId,
    endpoint: `admin/products/${productNo}`,
    method: "PUT",
    accessToken: token,
    body: {
      request: {
        product: {
          price: price.toString(),
        },
      },
    },
  });

  if (!result.success) {
    logger.error("상품 가격 업데이트 실패", {
      mallId,
      productNo,
      price,
      error: result.error,
      status: result.status,
    });
    return false;
  }

  logger.info("상품 가격 업데이트 성공", {
    mallId,
    productNo,
    price,
  });

  return true;
}

/**
 * 상품 description만 수정 (GET 전체 → description 교체 → PUT)
 */
export async function updateProductDescription(
  mallId: string,
  productNo: string,
  description: string,
  accessToken?: string
): Promise<boolean> {
  const token = accessToken || (await getValidAccessToken(mallId));
  if (!token) {
    throw new Error("액세스 토큰을 가져올 수 없습니다.");
  }

  const product = await getProductInfo(mallId, productNo, token);
  const request = { ...product, description };
  const result = await callCafe24Api({
    mallId,
    endpoint: `admin/products/${productNo}`,
    method: "PUT",
    accessToken: token,
    body: { shop_no: 1, request },
  });

  if (!result.success) {
    logger.error("상품 description 수정 실패", {
      mallId,
      productNo,
      error: result.error,
      status: result.status,
    });
    return false;
  }

  logger.info("상품 description 수정 성공", { mallId, productNo });
  return true;
}

/**
 * 주문 목록 조회 (판매량 계산용)
 */
export async function getOrders(
  mallId: string,
  options: {
    startDate?: string;
    endDate?: string;
    productNo?: string;
    includeCancelled?: boolean;
  } = {},
  accessToken?: string
): Promise<any[]> {
  const token = accessToken || (await getValidAccessToken(mallId));
  if (!token) {
    throw new Error("액세스 토큰을 가져올 수 없습니다.");
  }

  const { startDate, endDate, productNo, includeCancelled = false } = options;

  // 쿼리 파라미터 구성
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (productNo) params.append("product_no", productNo);
  if (!includeCancelled) {
    // 취소/환불 제외: 주문 상태 필터링
    params.append("status", "N1"); // 입금완료
    params.append("status", "N2"); // 배송준비중
    params.append("status", "N3"); // 배송중
    params.append("status", "N4"); // 배송완료
  }

  const endpoint = `admin/orders?${params.toString()}`;

  const result = await callCafe24Api({
    mallId,
    endpoint,
    method: "GET",
    accessToken: token,
  });

  if (!result.success || !result.data) {
    logger.error("주문 목록 조회 실패", {
      mallId,
      error: result.error,
      status: result.status,
    });
    return [];
  }

  return result.data.orders || [];
}

/**
 * 특정 상품의 판매 수량 계산
 */
export async function getProductSalesCount(
  mallId: string,
  productNo: string,
  includeCancelled: boolean = false,
  accessToken?: string
): Promise<number> {
  try {
    // 펀딩 시작일 이후의 주문만 조회 (나중에 funding_products 테이블에서 시작일 가져오기)
    const orders = await getOrders(
      mallId,
      {
        productNo,
        includeCancelled,
      },
      accessToken
    );

    // 주문에서 해당 상품의 수량 합산
    let totalQuantity = 0;
    for (const order of orders) {
      if (order.items) {
        for (const item of order.items) {
          if (item.product_no?.toString() === productNo) {
            totalQuantity += parseInt(item.quantity || "0", 10);
          }
        }
      }
    }

    logger.info("상품 판매 수량 계산", {
      mallId,
      productNo,
      totalQuantity,
      orderCount: orders.length,
      includeCancelled,
    });

    return totalQuantity;
  } catch (error) {
    logger.error("상품 판매 수량 계산 실패", {
      mallId,
      productNo,
      error,
    });
    return 0;
  }
}
