import { NextRequest, NextResponse } from "next/server";
import { updateProductDescription } from "@/lib/api/cafe24Api";
import { logger } from "@/lib/utils/logger";

/**
 * PUT /api/products/[productNo]/description
 * body: { mall_id: string, description: string }
 * 상품 전체 GET 후 description만 바꿔서 PUT
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ productNo: string }> }
) {
  try {
    const { productNo } = await params;
    const body = await req.json();
    const mallId = body.mall_id;
    const description =
      typeof body.description === "string" ? body.description : "";

    if (!mallId || !productNo) {
      return NextResponse.json(
        { error: "mall_id, product_no(경로) 가 필요합니다." },
        { status: 400 }
      );
    }

    const ok = await updateProductDescription(mallId, productNo, description);

    if (!ok) {
      return NextResponse.json(
        { error: "상품 description 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("상품 description 수정 오류", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "수정 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
