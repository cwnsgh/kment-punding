import { NextRequest, NextResponse } from "next/server";

const MAX_URLS = 15;
const FETCH_TIMEOUT_MS = 10000;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB per image

/**
 * POST /api/proxy-images-for-capture
 * body: { urls: string[] }  (https 이미지 URL 목록)
 * 각 URL을 서버에서 fetch 후 data URL로 변환해 반환. 캡처 시 크로스오리진 이미지 표시용.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const urls = Array.isArray(body?.urls) ? body.urls : [];
    const list = urls
      .filter((u: unknown) => typeof u === "string" && u.startsWith("https://"))
      .slice(0, MAX_URLS);

    const result: Record<string, string> = {};

    for (const url of list) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "image/*" },
        });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) continue;

        const buf = await res.arrayBuffer();
        if (buf.byteLength > MAX_BODY_BYTES) continue;

        const b64 = Buffer.from(buf).toString("base64");
        const mime = contentType.split(";")[0].trim() || "image/png";
        result[url] = `data:${mime};base64,${b64}`;
      } catch {
        // skip failed URL
      }
    }

    return NextResponse.json({ dataUrls: result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "프록시 실패" },
      { status: 500 }
    );
  }
}
