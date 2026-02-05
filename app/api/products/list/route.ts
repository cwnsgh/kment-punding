import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/api/cafe24Api";
import { logger } from "@/lib/utils/logger";
import { config } from "@/lib/config/env";

/**
 * GET /api/products/list
 * 카페24 상품 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mallId = searchParams.get("mall_id");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!mallId) {
      return NextResponse.json(
        { error: "mall_id 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    logger.info("상품 목록 조회 시작", { mallId, limit, offset });

    // 유효한 액세스 토큰 가져오기
    const accessToken = await getValidAccessToken(mallId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "유효한 토큰을 가져올 수 없습니다." },
        { status: 401 }
      );
    }

    // 카페24 상품 목록 API 호출
    const cafe24Response = await fetch(
      `https://${mallId}.${config.cafe24.baseUrl}/api/v2/admin/products?offset=${offset}&limit=${limit}&fields=product_no,product_code,product_name,price,retail_price,display,selling`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Cafe24-Api-Version": config.cafe24.apiVersion,
        },
      }
    );

    if (!cafe24Response.ok) {
      const errorText = await cafe24Response.text();
      logger.error("카페24 상품 API 호출 실패", {
        mallId,
        status: cafe24Response.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: `카페24 API 오류: ${cafe24Response.status}` },
        { status: cafe24Response.status }
      );
    }

    const cafe24Data = await cafe24Response.json();
    const products = (cafe24Data.products || []).map((product: any) => ({
      product_no: product.product_no?.toString() || "",
      product_code: product.product_code || "",
      product_name: product.product_name || "",
      price: parseFloat(product.price || "0"),
      retail_price: parseFloat(product.retail_price || "0"),
      display: product.display === "T",
      selling: product.selling === "T",
    }));

    logger.info("상품 목록 조회 성공", {
      mallId,
      count: products.length,
      total: cafe24Data.count?.total || products.length,
    });

    return NextResponse.json({
      products,
      count: {
        total: cafe24Data.count?.total || products.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    logger.error("상품 목록 조회 중 오류", { error });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
