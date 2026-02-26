"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const PREVIEW_MESSAGE_TYPE = "preview-html" as const;

function escapeForSrcdoc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

function buildPreviewDocument(html: string): string {
  if (!html || typeof html !== "string") html = "";
  const raw = html;
  const styleBlocks: string[] = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/\s*style\s*>/gi;
  let bodyContent = raw.replace(styleRegex, (_, inner) => {
    styleBlocks.push("<style>" + inner + "</style>");
    return "";
  });
  bodyContent = bodyContent.trim() || "";
  if (!bodyContent) bodyContent = "<span style='color:#9ca3af'>(없음)</span>";
  const headStyles = styleBlocks.join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${escapeForSrcdoc(headStyles)}</head><body style="margin:0;min-height:100%">${escapeForSrcdoc(bodyContent)}</body></html>`;
}

type ProductItem = {
  productNo: string;
  productName: string;
  description?: string;
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const mallId = searchParams.get("mall_id") ?? "";

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});
  const [savingProductNo, setSavingProductNo] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewWindowRef = useRef<Window | null>(null);
  const [previewWindowProductNo, setPreviewWindowProductNo] = useState<string | null>(null);
  const previewProductNoRef = useRef<string | null>(null);

  const loadProducts = async () => {
    if (!mallId.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products/list?mall_id=${encodeURIComponent(mallId.trim())}&limit=10`
      );
      const data = await res.json();
      const list = (data.products || []).slice(0, 10) as {
        product_no: string;
        product_name: string;
      }[];
      if (list.length === 0) {
        setProducts([]);
        setError(data.error || "상품이 없습니다.");
        setLoading(false);
        return;
      }

      const withDescription: ProductItem[] = [];
      for (const p of list) {
        try {
          const detailRes = await fetch(
            `/api/products/detail?mall_id=${encodeURIComponent(mallId.trim())}&product_no=${encodeURIComponent(p.product_no)}`
          );
          const detail = await detailRes.json();
          const desc = detail?.description ?? "";
          withDescription.push({
            productNo: p.product_no,
            productName: p.product_name || `상품 #${p.product_no}`,
            description: desc,
          });
        } catch {
          withDescription.push({
            productNo: p.product_no,
            productName: p.product_name || `상품 #${p.product_no}`,
            description: undefined,
          });
        }
      }

      setProducts(withDescription);
      setEditedDescriptions((prev) => {
        const next = { ...prev };
        withDescription.forEach((p) => {
          next[p.productNo] = p.description ?? "";
        });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 실패");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const saveDescription = async (productNo: string) => {
    const description = editedDescriptions[productNo] ?? products.find((p) => p.productNo === productNo)?.description ?? "";
    setSaveError(null);
    setSavingProductNo(productNo);
    try {
      const res = await fetch(`/api/products/${productNo}/description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mall_id: mallId, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "저장 실패");
        return;
      }
      setEditedDescriptions((prev) => ({ ...prev, [productNo]: description }));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장 중 오류");
    } finally {
      setSavingProductNo(null);
    }
  };

  const sendPreviewToWindow = (productNo: string) => {
    const win = previewWindowRef.current;
    if (!win || win.closed) return;
    const html =
      editedDescriptions[productNo] ??
      products.find((p) => p.productNo === productNo)?.description ??
      "";
    win.postMessage(
      { type: PREVIEW_MESSAGE_TYPE, html: buildPreviewDocument(html) },
      window.location.origin
    );
  };

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const productNo = previewProductNoRef.current;
      if (
        e.data?.type === "preview-ready" &&
        e.source === previewWindowRef.current &&
        productNo
      ) {
        sendPreviewToWindow(productNo);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (previewWindowProductNo && previewWindowRef.current && !previewWindowRef.current.closed) {
      sendPreviewToWindow(previewWindowProductNo);
    }
  }, [editedDescriptions, previewWindowProductNo]);

  const openPreviewInNewWindow = (productNo: string) => {
    if (previewWindowRef.current && !previewWindowRef.current.closed) {
      previewWindowRef.current.focus();
      previewProductNoRef.current = productNo;
      setPreviewWindowProductNo(productNo);
      sendPreviewToWindow(productNo);
      return;
    }
    previewProductNoRef.current = productNo;
    setPreviewWindowProductNo(productNo);
    const win = window.open(
      "/dashboard/preview",
      "description-preview",
      "width=900,height=700,scrollbars=yes,resizable=yes"
    );
    if (win) {
      previewWindowRef.current = win;
      window.setTimeout(() => sendPreviewToWindow(productNo), 800);
    }
  };

  if (!mallId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            쇼핑몰 정보가 없습니다
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            mall_id 쿼리로 접속해 주세요. (예: /dashboard?mall_id=스토어아이디)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1230px] mx-auto w-full">
        <div className="mb-6 flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            description 포맷 테스트
          </h1>
          <span className="text-xs text-gray-500">({mallId})</span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          상품 목록을 불러온 뒤 description을 편집·미리보기하고 저장할 수 있습니다.
        </p>

        <div className="mb-6">
          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "불러오는 중…" : "상품 불러오기"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            저장 오류: {saveError}
          </div>
        )}

        <div className="space-y-6">
          {products.map((p) => {
            const currentText =
              editedDescriptions[p.productNo] ?? p.description ?? "";
            const isSaving = savingProductNo === p.productNo;
            return (
              <div
                key={p.productNo}
                className="border border-gray-200 rounded-lg bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900">
                      {p.productName}
                    </span>
                    <span className="text-xs text-gray-500">#{p.productNo}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveDescription(p.productNo)}
                    disabled={isSaving}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSaving ? "저장 중…" : "저장"}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      description (편집 가능)
                    </label>
                    <textarea
                      value={currentText}
                      onChange={(e) =>
                        setEditedDescriptions((prev) => ({
                          ...prev,
                          [p.productNo]: e.target.value,
                        }))
                      }
                      className="w-full min-h-[360px] max-h-[520px] px-3 py-2 border border-gray-200 rounded-md font-mono text-xs overflow-auto whitespace-pre-wrap break-words bg-gray-50 text-gray-900 resize-y"
                      placeholder="(없음)"
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-xs font-medium text-gray-700">
                        미리보기 (style 포함, iframe 격리)
                      </label>
                      <button
                        type="button"
                        onClick={() => openPreviewInNewWindow(p.productNo)}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        미리보기 새 창으로
                      </button>
                    </div>
                    <div className="w-full min-h-[360px] max-h-[520px] border border-gray-200 rounded-md overflow-hidden bg-white">
                      <iframe
                        key={`preview-${p.productNo}-${currentText}`}
                        title="description 미리보기"
                        srcDoc={buildPreviewDocument(currentText)}
                        className="w-full h-full min-h-[360px] border-0 block"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && !loading && !error && (
          <p className="text-sm text-gray-500">
            「상품 불러오기」를 누르면 현재 쇼핑몰 상품이 나열됩니다.
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-sm text-gray-500">로딩 중…</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
