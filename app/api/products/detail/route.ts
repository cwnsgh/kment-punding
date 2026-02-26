import { NextRequest, NextResponse } from "next/server";
import { getProductInfo } from "@/lib/api/cafe24Api";
import { getValidAccessToken } from "@/lib/api/cafe24Api";
import { logger } from "@/lib/utils/logger";

/**
 * GET /api/products/detail?mall_id=xxx&product_no=yyy
 * 상품 상세(description 등) 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mallId = searchParams.get("mall_id");
    const productNo = searchParams.get("product_no");

    if (!mallId || !productNo) {
      return NextResponse.json(
        { error: "mall_id, product_no 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(mallId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "유효한 토큰을 가져올 수 없습니다." },
        { status: 401 }
      );
    }

    const product = await getProductInfo(mallId, productNo, accessToken);

    return NextResponse.json({
      product_no: productNo,
      product_name: product?.product_name ?? "",
      description: product?.description ?? "",
      mobile_description: product?.mobile_description ?? "",
      summary_description: product?.summary_description ?? "",
      simple_description: product?.simple_description ?? "",
    });
  } catch (error) {
    logger.error("상품 상세 조회 오류", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "상품 정보를 가져올 수 없습니다.",
      },
      { status: 500 }
    );
  }
}
