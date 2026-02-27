"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./dashboard.module.css";
import {
  descriptionTemplates,
  getDescriptionTemplateById,
  fillTemplate,
} from "@/lib/dashboard/descriptionTemplates";

type EditMode = "A" | "B" | "C" | "raw";

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
  const [editMode, setEditMode] = useState<EditMode>("raw");
  const [templateFormValues, setTemplateFormValues] = useState<Record<string, string>>({});
  const [savingProductNo, setSavingProductNo] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewWindowRef = useRef<Window | null>(null);
  const [previewWindowProductNo, setPreviewWindowProductNo] = useState<string | null>(null);
  const previewProductNoRef = useRef<string | null>(null);
  const previewHtmlRef = useRef<string>("");

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
      setEditMode("raw");
      setTemplateFormValues({});
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

  const getDescriptionToSave = (productNo: string): string => {
    if (editMode === "raw") {
      return (
        editedDescriptions[productNo] ??
        selectedProductDetail?.description ??
        ""
      );
    }
    const template = getDescriptionTemplateById(editMode);
    if (!template) return editedDescriptions[productNo] ?? "";
    return fillTemplate(template.html, templateFormValues);
  };

  const saveDescription = async (productNo: string) => {
    const description = getDescriptionToSave(productNo);
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

  const sendPreviewToWindow = (productNo: string, htmlOverride?: string) => {
    const win = previewWindowRef.current;
    if (!win || win.closed) return;
    const html =
      htmlOverride ??
      (previewHtmlRef.current ||
        editedDescriptions[productNo] ??
        (selectedProductNo === productNo ? selectedProductDetail?.description : undefined) ??
        "");
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
      <div className={styles.noMallWrap}>
        <div className={styles.noMallCard}>
          <div className={styles.noMallIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className={styles.noMallTitle}>쇼핑몰 정보가 없습니다</h1>
          <p className={styles.noMallText}>
            mall_id 쿼리로 접속해 주세요.
            <br />
            <code className={styles.noMallCode}>/dashboard?mall_id=스토어아이디</code>
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

  const selectedTemplate = editMode !== "raw" ? getDescriptionTemplateById(editMode) : null;
  const previewHtml =
    p && selectedTemplate
      ? fillTemplate(selectedTemplate.html, templateFormValues)
      : currentText;
  if (p) previewHtmlRef.current = previewHtml;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>상품 Description 편집</h1>
          <p className={styles.subtitle}>
            쇼핑몰 <span className={styles.subtitleMall}>{mallId}</span>
          </p>
        </div>
      </header>

      <main className={styles.main}>
        {p ? (
          <div className={styles.sectionStack}>
            <button type="button" onClick={backToList} className={styles.backBtn}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              목록으로
            </button>

            {saveError && (
              <div className={styles.errorBox}>
                <span>⚠</span>
                <span>저장 오류: {saveError}</span>
              </div>
            )}

            <section className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderInfo}>
                  <h2 className={styles.detailTitle}>{p.productName}</h2>
                  <p className={styles.detailNo}>#{p.productNo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => saveDescription(p.productNo)}
                  disabled={isSaving}
                  className={styles.saveBtn}
                >
                  {isSaving ? "저장 중…" : "저장하기"}
                </button>
              </div>

              <div className={styles.templatePickerWrap}>
                <span className={styles.templatePickerLabel}>작성 방식</span>
                <div className={styles.templatePickerBtns}>
                  {descriptionTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setEditMode(t.id)}
                      className={editMode === t.id ? styles.templateBtnActive : styles.templateBtn}
                    >
                      {t.id}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditMode("raw")}
                    className={editMode === "raw" ? styles.templateBtnActive : styles.templateBtn}
                  >
                    HTML 직접 편집
                  </button>
                </div>
              </div>

              <div className={styles.detailBody}>
                <div className={styles.editorBlock}>
                  {editMode === "raw" ? (
                    <>
                      <label className={styles.label}>HTML 편집</label>
                      <textarea
                        value={currentText}
                        onChange={(e) =>
                          setEditedDescriptions((prev) => ({
                            ...prev,
                            [p.productNo]: e.target.value,
                          }))
                        }
                        className={styles.textarea}
                        placeholder="상품 상세 설명 HTML을 입력하세요"
                        spellCheck={false}
                      />
                    </>
                  ) : selectedTemplate ? (
                    <>
                      <label className={styles.label}>
                        템플릿 {selectedTemplate.id} – {selectedTemplate.name}
                      </label>
                      <p className={styles.templateDesc}>{selectedTemplate.description}</p>
                      <div className={styles.templateForm}>
                        {selectedTemplate.fields.map((field) => (
                          <div key={field.key} className={styles.templateField}>
                            <label className={styles.templateFieldLabel}>{field.label}</label>
                            {field.type === "textarea" ? (
                              <textarea
                                value={templateFormValues[field.key] ?? ""}
                                onChange={(e) =>
                                  setTemplateFormValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className={styles.templateTextarea}
                                placeholder={field.placeholder}
                                rows={4}
                              />
                            ) : (
                              <input
                                type={field.type === "url" ? "url" : "text"}
                                value={templateFormValues[field.key] ?? ""}
                                onChange={(e) =>
                                  setTemplateFormValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className={styles.templateInput}
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <div className={styles.previewBlock}>
                  <div className={styles.previewHeader}>
                    <label className={styles.label}>미리보기</label>
                    <button
                      type="button"
                      onClick={() => openPreviewInNewWindow(p.productNo)}
                      className={styles.previewLink}
                    >
                      새 창에서 보기
                    </button>
                  </div>
                  <div className={styles.previewFrameWrap}>
                    <iframe
                      key={`preview-${p.productNo}-${previewHtml}`}
                      title="description 미리보기"
                      srcDoc={buildPreviewDocument(previewHtml)}
                      className={styles.previewIframe}
                      sandbox="allow-same-origin allow-scripts"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className={styles.listStack}>
            <section className={styles.searchCard}>
              <h2 className={styles.searchTitle}>상품 조회</h2>
              <p className={styles.searchDesc}>
                최근 상품을 불러오거나, 검색어로 쇼핑몰 전체에서 검색한 뒤 원하는 상품을 클릭하면 편집 화면으로 이동합니다.
              </p>
              <div className={styles.searchRow}>
                <button
                  type="button"
                  onClick={() => loadProducts()}
                  disabled={loading}
                  className={styles.loadBtn}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner} />
                      불러오는 중…
                    </>
                  ) : (
                    "상품 불러오기 (최근 50개)"
                  )}
                </button>
                <div className={styles.searchInputRow}>
                  <div className={styles.searchInputWrap}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && runMallSearch()}
                      placeholder="상품번호 또는 상품명 입력 후 검색"
                      className={styles.searchInput}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={runMallSearch}
                    disabled={loading}
                    className={styles.searchBtn}
                  >
                    쇼핑몰 전체 검색
                  </button>
                </div>
              </div>
              <p className={styles.searchHint}>
                전체 검색 시 최대 100건까지 표시됩니다. 이미 불러온 목록은 입력란에 필터로도 적용됩니다.
              </p>
            </section>

            {error && (
              <div className={styles.warnBox}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {products.length > 0 && (
              <>
                {filteredProducts.length > 0 ? (
                  <section className={styles.tableCard}>
                    <div className={styles.tableHead}>
                      <h2 className={styles.tableHeadTitle}>
                        상품 목록
                        <span className={styles.tableHeadCount}>
                          {filteredProducts.length}
                          {products.length !== filteredProducts.length && ` / ${products.length}`}건
                        </span>
                      </h2>
                    </div>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead className={styles.thead}>
                          <tr>
                            <th className={`${styles.th} ${styles.thNo}`}>상품번호</th>
                            <th className={styles.th}>상품명</th>
                            <th className={styles.thArrow} aria-hidden />
                          </tr>
                        </thead>
                        <tbody className={styles.tbody}>
                          {filteredProducts.map((item) => (
                            <tr
                              key={item.productNo}
                              onClick={() => openProductDetail(item.productNo)}
                            >
                              <td className={`${styles.td} ${styles.tdNo}`}>#{item.productNo}</td>
                              <td className={`${styles.td} ${styles.tdName}`}>{item.productName}</td>
                              <td className={`${styles.td} ${styles.tdArrow}`}>
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {detailLoading && (
                      <div className={styles.loadingBar}>
                        <span className={`${styles.spinner} ${styles.spinnerDark}`} />
                        상품 정보 불러오는 중…
                      </div>
                    )}
                  </section>
                ) : (
                  <div className={styles.emptyCard}>
                    <p className={styles.emptyText}>검색 결과가 없습니다. 검색어를 바꿔 보세요.</p>
                  </div>
                )}
              </>
            )}

            {products.length === 0 && !loading && !error && (
              <div className={`${styles.emptyCard} ${styles.emptyCardDashed}`}>
                <div className={styles.emptyIcon}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <p className={`${styles.emptyText} ${styles.emptyTextStrong}`}>상품 목록이 비어 있습니다</p>
                <p className={styles.emptyTextSmall}>「상품 불러오기」 또는 검색 후 「쇼핑몰 전체 검색」을 눌러 주세요.</p>
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
        <div className={styles.fallbackWrap}>
          <div className={styles.fallbackInner}>
            <span className={`${styles.spinner} ${styles.spinnerDark} ${styles.spinnerSm}`} />
            <span>로딩 중…</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
