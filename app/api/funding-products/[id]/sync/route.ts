import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/utils/logger";
import {
  getValidAccessToken,
  getProductSalesCount,
  updateProductPrice,
} from "@/lib/api/cafe24Api";

/**
 * POST /api/funding-products/[id]/sync
 * 펀딩 상품 판매량 동기화 및 가격 자동 조정
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 펀딩 상품 정보 조회
    const { data: product, error: fetchError } = await supabaseAdmin
      .schema("punding")
      .from("funding_products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !product) {
      logger.error("펀딩 상품 조회 실패", { id, error: fetchError });
      return NextResponse.json(
        { error: "펀딩 상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (!product.enabled) {
      return NextResponse.json({
        message: "펀딩이 비활성화되어 있습니다.",
        product,
      });
    }

    // 실제 판매량 조회
    const accessToken = await getValidAccessToken(product.mall_id);
    if (!accessToken) {
      return NextResponse.json(
        { error: "액세스 토큰을 가져올 수 없습니다." },
        { status: 500 }
      );
    }

    const actualSales = await getProductSalesCount(
      product.mall_id,
      product.product_no,
      product.include_cancellations,
      accessToken
    );

    // 표시 판매량 계산
    const displaySales = Math.floor(
      (product.manual_sales_override ?? actualSales) *
        parseFloat(product.display_multiplier.toString())
    );

    // 단계별 가격 확인 및 자동 조정
    const priceSteps = (product.price_steps as any[]) || [];
    let currentPrice = parseFloat(product.initial_price.toString());
    let appliedStep = null;

    // 목표 수량에 도달한 가장 높은 단계 찾기
    for (let i = priceSteps.length - 1; i >= 0; i--) {
      const step = priceSteps[i];
      if (displaySales >= step.target) {
        currentPrice = parseFloat(step.price.toString());
        appliedStep = step;
        break;
      }
    }

    // 가격이 변경되었으면 카페24에 반영
    let priceUpdated = false;
    if (currentPrice !== parseFloat(product.initial_price.toString())) {
      try {
        const success = await updateProductPrice(
          product.mall_id,
          product.product_no,
          currentPrice,
          accessToken
        );
        if (success) {
          priceUpdated = true;
          logger.info("가격 자동 조정 완료", {
            id,
            product_no: product.product_no,
            oldPrice: product.initial_price,
            newPrice: currentPrice,
            displaySales,
          });
        }
      } catch (error) {
        logger.error("가격 업데이트 실패", { id, error });
      }
    }

    // DB에 판매량 업데이트
    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .schema("punding")
      .from("funding_products")
      .update({
        current_sales: actualSales,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("판매량 업데이트 실패", { id, error: updateError });
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct || product,
      stats: {
        actualSales,
        displaySales,
        currentPrice,
        appliedStep,
        priceUpdated,
      },
    });
  } catch (error) {
    logger.error("펀딩 상품 동기화 중 오류", { error });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
