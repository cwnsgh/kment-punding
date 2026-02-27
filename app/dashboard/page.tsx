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

type ProductListItem = {
  productNo: string;
  productName: string;
};

type ProductItem = ProductListItem & {
  description?: string;
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const mallId = searchParams.get("mall_id") ?? "";

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductNo, setSelectedProductNo] = useState<string | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});
  const [savingProductNo, setSavingProductNo] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewWindowRef = useRef<Window | null>(null);
  const [previewWindowProductNo, setPreviewWindowProductNo] = useState<string | null>(null);
  const previewProductNoRef = useRef<string | null>(null);

  const loadProducts = async () => {
    if (!mallId.trim()) return;
    setError(null);
    setSelectedProductNo(null);
    setSelectedProductDetail(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/products/list?mall_id=${encodeURIComponent(mallId.trim())}&limit=50`
      );
      const data = await res.json();
      const list = (data.products || []).slice(0, 50) as {
        product_no: string;
        product_name: string;
      }[];
      if (list.length === 0) {
        setProducts([]);
        setError(data.error || "상품이 없습니다.");
        setLoading(false);
        return;
      }
      setProducts(
        list.map((p) => ({
          productNo: p.product_no,
          productName: p.product_name || `상품 #${p.product_no}`,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 실패");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const openProductDetail = async (productNo: string) => {
    const product = products.find((p) => p.productNo === productNo);
    if (!product) return;
    setDetailLoading(true);
    setSaveError(null);
    try {
      const detailRes = await fetch(
        `/api/products/detail?mall_id=${encodeURIComponent(mallId.trim())}&product_no=${encodeURIComponent(productNo)}`
      );
      const detail = await detailRes.json();
      const desc = detail?.description ?? "";
      const item: ProductItem = {
        ...product,
        description: desc,
      };
      setSelectedProductDetail(item);
      setSelectedProductNo(productNo);
      setEditedDescriptions((prev) => ({ ...prev, [productNo]: desc }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "상품 상세 조회 실패");
    } finally {
      setDetailLoading(false);
    }
  };

  const backToList = () => {
    setSelectedProductNo(null);
    setSelectedProductDetail(null);
  };

  const saveDescription = async (productNo: string) => {
    const description =
      editedDescriptions[productNo] ??
      selectedProductDetail?.description ??
      "";
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
      setSelectedProductDetail((prev) =>
        prev?.productNo === productNo ? { ...prev, description } : prev
      );
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
      (selectedProductNo === productNo ? selectedProductDetail?.description : undefined) ??
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

  const p = selectedProductDetail;
  const currentText = p
    ? editedDescriptions[p.productNo] ?? p.description ?? ""
    : "";
  const isSaving = p ? savingProductNo === p.productNo : false;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1230px] mx-auto w-full">
        <div className="mb-6 flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            description 포맷 테스트
          </h1>
          <span className="text-xs text-gray-500">({mallId})</span>
        </div>

        {p ? (
          /* 상세 뷰: 한 상품 description 편집 */
          <>
            <div className="mb-4">
              <button
                type="button"
                onClick={backToList}
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline flex items-center gap-1"
              >
                ← 목록으로
              </button>
            </div>
            {saveError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                저장 오류: {saveError}
              </div>
            )}
            <div className="border border-gray-200 rounded-lg bg-white p-4">
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
          </>
        ) : (
          /* 목록 뷰: 상품 목록만 표시 */
          <>
            <p className="text-sm text-gray-600 mb-4">
              상품 목록을 불러온 뒤, 편집할 상품을 클릭하면 description 수정
              페이지로 이동합니다.
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
            {products.length > 0 && (
              <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 font-medium text-gray-700">
                        상품번호
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-700">
                        상품명
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item) => (
                      <tr
                        key={item.productNo}
                        onClick={() => openProductDetail(item.productNo)}
                        className="border-b border-gray-100 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-500 font-mono">
                          #{item.productNo}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {item.productName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detailLoading && (
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 text-sm">
                    상품 정보 불러오는 중…
                  </div>
                )}
              </div>
            )}
            {products.length === 0 && !loading && !error && (
              <p className="text-sm text-gray-500">
                「상품 불러오기」를 누르면 현재 쇼핑몰 상품이 나열됩니다.
              </p>
            )}
          </>
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
