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
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md rounded-2xl bg-white p-10 shadow-lg border border-slate-200/80">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-2">
            쇼핑몰 정보가 없습니다
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            mall_id 쿼리로 접속해 주세요.
            <br />
            <code className="mt-2 inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-mono">/dashboard?mall_id=스토어아이디</code>
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 to-slate-50 text-slate-800">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-800 tracking-tight">
              상품 Description 편집
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              쇼핑몰 <span className="font-medium text-slate-600">{mallId}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {p ? (
          /* ---------- 상세 뷰 ---------- */
          <div className="space-y-4">
            <button
              type="button"
              onClick={backToList}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              목록으로
            </button>

            {saveError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                <span className="shrink-0 text-red-500">⚠</span>
                <span>저장 오류: {saveError}</span>
              </div>
            )}

            <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 sm:px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-800 truncate pr-2">
                    {p.productName}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">#{p.productNo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => saveDescription(p.productNo)}
                  disabled={isSaving}
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-all active:scale-[0.98]"
                >
                  {isSaving ? "저장 중…" : "저장하기"}
                </button>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    HTML 편집
                  </label>
                  <textarea
                    value={currentText}
                    onChange={(e) =>
                      setEditedDescriptions((prev) => ({
                        ...prev,
                        [p.productNo]: e.target.value,
                      }))
                    }
                    className="w-full min-h-[380px] max-h-[560px] px-4 py-3 rounded-xl border border-slate-200 font-mono text-[13px] leading-relaxed overflow-auto whitespace-pre-wrap break-words bg-slate-50/50 text-slate-800 resize-y placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 outline-none transition-shadow"
                    placeholder="상품 상세 설명 HTML을 입력하세요"
                    spellCheck={false}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      미리보기
                    </label>
                    <button
                      type="button"
                      onClick={() => openPreviewInNewWindow(p.productNo)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                    >
                      새 창에서 보기
                    </button>
                  </div>
                  <div className="w-full min-h-[380px] max-h-[560px] rounded-xl border border-slate-200 overflow-hidden bg-white shadow-inner">
                    <iframe
                      key={`preview-${p.productNo}-${currentText}`}
                      title="description 미리보기"
                      srcDoc={buildPreviewDocument(currentText)}
                      className="w-full h-full min-h-[380px] border-0 block"
                      sandbox="allow-same-origin allow-scripts"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          /* ---------- 목록 뷰 ---------- */
          <div className="space-y-6">
            <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-4 sm:p-5">
              <h2 className="text-sm font-medium text-slate-700 mb-3">상품 조회</h2>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                최근 상품을 불러오거나, 검색어로 쇼핑몰 전체에서 검색한 뒤 원하는 상품을 클릭하면 편집 화면으로 이동합니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => loadProducts()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      불러오는 중…
                    </>
                  ) : (
                    "상품 불러오기 (최근 50개)"
                  )}
                </button>
                <div className="flex-1 flex flex-col sm:flex-row gap-2 min-w-0">
                  <div className="relative flex-1 min-w-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && runMallSearch()}
                      placeholder="상품번호 또는 상품명 입력 후 검색"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300/50 focus:border-slate-300 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={runMallSearch}
                    disabled={loading}
                    className="shrink-0 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    쇼핑몰 전체 검색
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">
                전체 검색 시 최대 100건까지 표시됩니다. 이미 불러온 목록은 입력란에 필터로도 적용됩니다.
              </p>
            </section>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                <span className="shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {products.length > 0 && (
              <>
                {filteredProducts.length > 0 ? (
                  <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <h2 className="text-sm font-medium text-slate-700">
                        상품 목록
                        <span className="ml-2 text-slate-500 font-normal">
                          {filteredProducts.length}
                          {products.length !== filteredProducts.length && ` / ${products.length}`}건
                        </span>
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50/80">
                            <th className="px-4 sm:px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">
                              상품번호
                            </th>
                            <th className="px-4 sm:px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              상품명
                            </th>
                            <th className="w-12 px-2" aria-hidden />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.map((item) => (
                            <tr
                              key={item.productNo}
                              onClick={() => openProductDetail(item.productNo)}
                              className="cursor-pointer transition-colors hover:bg-emerald-50/80 active:bg-emerald-100/50 group"
                            >
                              <td className="px-4 sm:px-5 py-3.5 font-mono text-sm text-slate-500">
                                #{item.productNo}
                              </td>
                              <td className="px-4 sm:px-5 py-3.5 text-sm font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">
                                {item.productName}
                              </td>
                              <td className="px-2 text-slate-300 group-hover:text-emerald-500 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {detailLoading && (
                      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-slate-600 text-sm flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        상품 정보 불러오는 중…
                      </div>
                    )}
                  </section>
                ) : (
                  <div className="rounded-2xl bg-white border border-slate-200/80 p-12 text-center">
                    <p className="text-slate-500 text-sm">
                      검색 결과가 없습니다. 검색어를 바꿔 보세요.
                    </p>
                  </div>
                )}
              </>
            )}

            {products.length === 0 && !loading && !error && (
              <div className="rounded-2xl bg-white border border-slate-200/80 border-dashed p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">상품 목록이 비어 있습니다</p>
                <p className="mt-1 text-xs text-slate-400">「상품 불러오기」 또는 검색 후 「쇼핑몰 전체 검색」을 눌러 주세요.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-100/80 to-slate-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="inline-block w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span className="text-sm">로딩 중…</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
