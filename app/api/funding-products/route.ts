import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/utils/logger";
import { getValidAccessToken, getProductInfo, getProductSalesCount } from "@/lib/api/cafe24Api";

/**
 * GET /api/funding-products
 * 펀딩 상품 목록 조회
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mallId = searchParams.get("mall_id");

  if (!mallId) {
    return NextResponse.json(
      { error: "mall_id 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .schema("punding")
      .from("funding_products")
      .select("*")
      .eq("mall_id", mallId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("펀딩 상품 목록 조회 실패", { mallId, error });
      return NextResponse.json(
        { error: "펀딩 상품 목록을 가져올 수 없습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    logger.error("펀딩 상품 목록 조회 중 오류", { mallId, error });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/funding-products
 * 펀딩 상품 등록
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mall_id,
      product_no,
      initial_price,
      price_steps = [],
      display_multiplier = 1.0,
      include_cancellations = false,
    } = body;

    if (!mall_id || !product_no || !initial_price) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 카페24에서 상품 정보 조회
    let productName = "";
    try {
      const product = await getProductInfo(mall_id, product_no);
      productName = product.product_name || "";
    } catch (error) {
      logger.warn("상품 정보 조회 실패 (계속 진행)", { mall_id, product_no, error });
    }

    // 펀딩 상품 등록
    const { data, error } = await supabaseAdmin
      .schema("punding")
      .from("funding_products")
      .insert({
        mall_id,
        product_no: product_no.toString(),
        product_name: productName,
        initial_price,
        price_steps,
        display_multiplier,
        include_cancellations,
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      logger.error("펀딩 상품 등록 실패", { mall_id, product_no, error });
      return NextResponse.json(
        { error: "펀딩 상품을 등록할 수 없습니다.", details: error.message },
        { status: 500 }
      );
    }

    logger.info("펀딩 상품 등록 성공", { mall_id, product_no, id: data.id });

    return NextResponse.json({ product: data });
  } catch (error) {
    logger.error("펀딩 상품 등록 중 오류", { error });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
