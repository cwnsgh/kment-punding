"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductNo, setSelectedProductNo] = useState<string | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.trim().toLowerCase();
    return products.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) ||
        item.productNo.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});
  const [savingProductNo, setSavingProductNo] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewWindowRef = useRef<Window | null>(null);
  const [previewWindowProductNo, setPreviewWindowProductNo] = useState<string | null>(null);
  const previewProductNoRef = useRef<string | null>(null);

  const loadProducts = async (searchKeyword?: string) => {
    if (!mallId.trim()) return;
    setError(null);
    setSelectedProductNo(null);
    setSelectedProductDetail(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        mall_id: mallId.trim(),
        limit: searchKeyword ? "100" : "50",
      });
      if (searchKeyword?.trim()) {
        const trimmed = searchKeyword.trim();
        params.set("product_name", trimmed);
        if (/^\d+$/.test(trimmed)) params.set("product_no", trimmed);
      }
      const res = await fetch(`/api/products/list?${params.toString()}`);
      const data = await res.json();
      const list = (data.products || []) as {
        product_no: string;
        product_name: string;
      }[];
      const max = searchKeyword ? 100 : 50;
      const sliced = list.slice(0, max);
      if (sliced.length === 0) {
        setProducts([]);
        setError(
          searchKeyword
            ? "검색 결과가 없습니다. 다른 검색어로 시도해 보세요."
            : data.error || "상품이 없습니다."
        );
        setLoading(false);
        return;
      }
      setProducts(
        sliced.map((p) => ({
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

  const runMallSearch = () => {
    loadProducts(searchQuery.trim() || undefined);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
          <h1 className="text-lg font-semibold text-slate-800 mb-2">
            쇼핑몰 정보가 없습니다
          </h1>
          <p className="text-sm text-slate-500">
            mall_id 쿼리로 접속해 주세요.
            <br />
            <span className="font-mono text-slate-600">/dashboard?mall_id=스토어아이디</span>
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto w-full">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
            Description 포맷 테스트
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            쇼핑몰 <span className="font-medium text-slate-600">{mallId}</span>
          </p>
        </header>

        {p ? (
          /* 상세 뷰: 한 상품 description 편집 */
          <>
            <div className="mb-5">
              <button
                type="button"
                onClick={backToList}
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span aria-hidden>←</span> 목록으로
              </button>
            </div>
            {saveError && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                저장 오류: {saveError}
              </div>
            )}
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-medium text-slate-800 truncate">
                    {p.productName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    #{p.productNo}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => saveDescription(p.productNo)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {isSaving ? "저장 중…" : "저장"}
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wider">
                    Description (편집)
                  </label>
                  <textarea
                    value={currentText}
                    onChange={(e) =>
                      setEditedDescriptions((prev) => ({
                        ...prev,
                        [p.productNo]: e.target.value,
                      }))
                    }
                    className="w-full min-h-[360px] max-h-[520px] px-4 py-3 rounded-xl border border-slate-200 font-mono text-xs overflow-auto whitespace-pre-wrap break-words bg-slate-50/80 text-slate-800 resize-y focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-shadow"
                    placeholder="(없음)"
                    spellCheck={false}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-xs font-medium text-slate-600 uppercase tracking-wider">
                      미리보기
                    </label>
                    <button
                      type="button"
                      onClick={() => openPreviewInNewWindow(p.productNo)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      새 창으로 열기
                    </button>
                  </div>
                  <div className="w-full min-h-[360px] max-h-[520px] rounded-xl border border-slate-200 overflow-hidden bg-white">
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
          /* 목록 뷰: 검색 + 상품 목록 */
          <>
            <p className="text-sm text-slate-600 mb-6">
              상품 목록을 불러온 뒤 검색하거나, 편집할 상품을 클릭하면 description 수정
              페이지로 이동합니다.
            </p>
            <div className="mb-6 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <button
                  type="button"
                  onClick={() => loadProducts()}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {loading ? "불러오는 중…" : "상품 불러오기"}
                </button>
                <div className="relative flex-1 max-w-md flex gap-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runMallSearch()}
                    placeholder="상품번호 또는 상품명 (전체 검색 시 입력 후 버튼 클릭)"
                    className="flex-1 min-w-0 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400/20 focus:border-slate-400 outline-none transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={runMallSearch}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    쇼핑몰 전체 검색
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                「상품 불러오기」: 최근 상품 50개 · 「쇼핑몰 전체 검색」: 검색어로 쇼핑몰 전체에서 검색 (최대 100건)
              </p>
            </div>
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                {error}
              </div>
            )}
            {products.length > 0 && (
              <>
                {filteredProducts.length > 0 ? (
                  <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200">
                            <th className="px-5 py-3.5 font-medium text-slate-600">
                              상품번호
                            </th>
                            <th className="px-5 py-3.5 font-medium text-slate-600">
                              상품명
                            </th>
                            <th className="w-10 px-2" aria-hidden />
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((item) => (
                            <tr
                              key={item.productNo}
                              onClick={() => openProductDetail(item.productNo)}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                              <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                                #{item.productNo}
                              </td>
                              <td className="px-5 py-3.5 text-slate-800 font-medium">
                                {item.productName}
                              </td>
                              <td className="px-2 text-slate-400 group-hover:text-slate-600">
                                <span aria-hidden>→</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {detailLoading && (
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-slate-600 text-sm">
                        상품 정보 불러오는 중…
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-10 text-center">
                    <p className="text-slate-500 text-sm">
                      검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
                    </p>
                  </div>
                )}
              </>
            )}
            {products.length === 0 && !loading && !error && (
              <div className="rounded-2xl bg-white border border-slate-200/80 p-10 text-center">
                <p className="text-sm text-slate-500">
                  「상품 불러오기」를 누르면 현재 쇼핑몰 상품이 나열됩니다.
                </p>
              </div>
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-sm text-slate-500">로딩 중…</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
