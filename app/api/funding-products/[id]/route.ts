import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/utils/logger";
import { getValidAccessToken, updateProductPrice, getProductSalesCount } from "@/lib/api/cafe24Api";

/**
 * GET /api/funding-products/[id]
 * 펀딩 상품 상세 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { data, error } = await supabaseAdmin
      .schema("punding")
      .from("funding_products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      logger.error("펀딩 상품 조회 실패", { id, error });
      return NextResponse.json(
        { error: "펀딩 상품을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    logger.error("펀딩 상품 조회 중 오류", { id, error });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/funding-products/[id]
 * 펀딩 상품 설정 업데이트
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // 업데이트 가능한 필드만 추출
    const {
      enabled,
      initial_price,
      price_steps,
      display_multiplier,
      include_cancellations,
      manual_sales_override,
    } = body;

    const updateData: any = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (initial_price !== undefined) updateData.initial_price = initial_price;
    if (price_steps !== undefined) updateData.price_steps = price_steps;
    if (display_multiplier !== undefined)
      updateData.display_multiplier = display_multiplier;
    if (include_cancellations !== undefined)
      updateData.include_cancellations = include_cancellations;
    if (manual_sales_override !== undefined)
      updateData.manual_sales_override = manual_sales_override;

    const { data, error } = await supabaseAdmin
      .schema("punding")
      .from("funding_products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("펀딩 상품 업데이트 실패", { id, error });
      return NextResponse.json(
        { error: "펀딩 상품을 업데이트할 수 없습니다." },
        { status: 500 }
      );
    }

    logger.info("펀딩 상품 업데이트 성공", { id });

    return NextResponse.json({ product: data });
  } catch (error) {
    logger.error("펀딩 상품 업데이트 중 오류", { error });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/funding-products/[id]
 * 펀딩 상품 삭제
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabaseAdmin
      .schema("punding")
      .from("funding_products")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("펀딩 상품 삭제 실패", { id, error });
      return NextResponse.json(
        { error: "펀딩 상품을 삭제할 수 없습니다." },
        { status: 500 }
      );
    }

    logger.info("펀딩 상품 삭제 성공", { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("펀딩 상품 삭제 중 오류", { error });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
