import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/api/cafe24Api";
import { logger } from "@/lib/utils/logger";
import { config } from "@/lib/config/env";

/**
 * POST /api/products/images
 * body: { mall_id: string, image: string } (image = base64, optional "data:image/...;base64," prefix)
 * 카페24 상품 이미지 업로드 API 호출 후 업로드된 URL(path) 반환
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mallId = body.mall_id?.trim();
    let imageBase64 = body.image;

    if (!mallId) {
      return NextResponse.json(
        { error: "mall_id가 필요합니다." },
        { status: 400 }
      );
    }
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "image (base64)가 필요합니다." },
        { status: 400 }
      );
    }
    // data:image/png;base64, 제거
    const base64Match = imageBase64.match(/^data:image\/[a-zA-Z+]+;base64,(.+)$/);
    if (base64Match) imageBase64 = base64Match[1];
    else imageBase64 = imageBase64.trim();

    const accessToken = await getValidAccessToken(mallId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "유효한 토큰을 가져올 수 없습니다." },
        { status: 401 }
      );
    }

    const payload = {
      requests: [{ image: imageBase64 }],
    };

    const url = `https://${mallId}.${config.cafe24.baseUrl}/api/v2/admin/products/images`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Cafe24-Api-Version": config.cafe24.apiVersion,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      logger.error("카페24 이미지 업로드 실패", { mallId, status: res.status, data });
      return NextResponse.json(
        { error: data.error?.message || data.error || `업로드 실패: ${res.status}` },
        { status: res.status >= 400 ? res.status : 500 }
      );
    }

    const images = data.images;
    const path = Array.isArray(images) && images[0]?.path ? images[0].path : null;
    if (!path) {
      logger.error("카페24 이미지 업로드 응답에 path 없음", { mallId, data });
      return NextResponse.json(
        { error: "업로드 응답에 이미지 경로가 없습니다." },
        { status: 500 }
      );
    }

    logger.info("카페24 이미지 업로드 성공", { mallId, path });
    return NextResponse.json({ path });
  } catch (e) {
    logger.error("이미지 업로드 중 오류", { error: e });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "업로드 중 오류" },
      { status: 500 }
    );
  }
}
