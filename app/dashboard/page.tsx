"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import styles from "./dashboard.module.css";
import {
  descriptionTemplates,
  getDescriptionTemplateById,
  fillTemplate,
  parseDescriptionToValues,
} from "@/lib/dashboard/descriptionTemplates";

type EditMode = "A" | "B" | "C" | "D" | "E" | "raw";

const PREVIEW_MESSAGE_TYPE = "preview-html" as const;

/** 아코디언 "제목::내용" 텍스트 ↔ { title, content }[] */
function parseAccordionItems(text: string): { title: string; content: string }[] {
  if (!text || !String(text).trim()) return [];
  return String(text)
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const i = line.indexOf("::");
      const title = i >= 0 ? line.slice(0, i).trim() : line.trim();
      const content = i >= 0 ? line.slice(i + 2).trim() : "";
      return { title, content };
    });
}
function serializeAccordionItems(items: { title: string; content: string }[]): string {
  return items.map(({ title, content }) => `${title}::${content}`).join("\n");
}

function AccordionItemsEditor({
  value,
  onChange,
  fieldLabel,
  styles: s,
}: {
  value: string;
  onChange: (next: string) => void;
  fieldLabel: string;
  styles: { [k: string]: string };
}) {
  const items = parseAccordionItems(value);
  const update = (next: { title: string; content: string }[]) => {
    onChange(serializeAccordionItems(next));
  };
  const setItem = (index: number, part: "title" | "content", text: string) => {
    const next = [...items];
    if (!next[index]) next[index] = { title: "", content: "" };
    next[index] = { ...next[index], [part]: text };
    update(next);
  };
  const remove = (index: number) => {
    update(items.filter((_, i) => i !== index));
  };
  const add = () => {
    update([...items, { title: "", content: "" }]);
  };
  return (
    <div className={s.accordionItemsWrap}>
      {items.length === 0 ? (
        <p className={s.imageUploadHint}>
          아래 「항목 추가」로 제목·내용을 넣으면 아코디언으로 표시됩니다.
        </p>
      ) : null}
      {items.map((item, index) => (
        <div key={index} className={s.accordionItemRow}>
          <div className={s.accordionItemRowHead}>
            <input
              type="text"
              value={item.title}
              onChange={(e) => setItem(index, "title", e.target.value)}
              placeholder="제목"
              aria-label={`${fieldLabel} ${index + 1} 제목`}
            />
            <button type="button" onClick={() => remove(index)} className={s.accordionItemDel}>
              삭제
            </button>
          </div>
          <textarea
            value={item.content}
            onChange={(e) => setItem(index, "content", e.target.value)}
            placeholder="내용"
            rows={2}
            aria-label={`${fieldLabel} ${index + 1} 내용`}
          />
        </div>
      ))}
      <button type="button" onClick={add} className={s.accordionItemAdd}>
        + 항목 추가
      </button>
    </div>
  );
}

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
  const heightScript = escapeForSrcdoc(
    "<script>(function(){function sendHeight(){var h=Math.max(document.body.scrollHeight,document.body.offsetHeight,document.documentElement.scrollHeight);try{window.parent.postMessage({type:'iframe-content-height',height:h},'*');}catch(e){}}if(document.readyState==='complete')setTimeout(sendHeight,150);else window.addEventListener('load',function(){setTimeout(sendHeight,150);});setTimeout(sendHeight,500);})();</script>"
  );
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${escapeForSrcdoc(headStyles)}</head><body style="margin:0;min-height:100%">${escapeForSrcdoc(bodyContent)}${heightScript}</body></html>`;
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
  const [uploadingImageField, setUploadingImageField] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [capturingImage, setCapturingImage] = useState(false);

  const previewWindowRef = useRef<Window | null>(null);
  const [previewWindowProductNo, setPreviewWindowProductNo] = useState<string | null>(null);
  const previewProductNoRef = useRef<string | null>(null);
  const previewHtmlRef = useRef<string>("");

  const compressImageForUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxW = 2400;
        const maxH = 2400;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxW || h > maxH) {
          if (w > h) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          } else {
            w = Math.round((w * maxH) / h);
            h = maxH;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("파일 읽기 실패"));
          reader.readAsDataURL(file);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mime, 0.92);
        resolve(dataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("파일 읽기 실패"));
        reader.readAsDataURL(file);
      };
      img.src = url;
    });
  };

  const uploadImageToCafe24 = async (fieldKey: string, file: File) => {
    if (!file.type.startsWith("image/") || !mallId.trim()) return;
    setUploadError(null);
    setUploadingImageField(fieldKey);
    try {
      const base64 = await compressImageForUpload(file);
      const res = await fetch("/api/products/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mall_id: mallId.trim(), image: base64 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 413) throw new Error("이미지 용량이 너무 큽니다. 더 작은 사진을 선택하거나 압축 후 다시 시도해 주세요.");
        throw new Error(data.error || "업로드 실패");
      }
      const path = data.path;
      if (path) {
        setTemplateFormValues((prev) => ({ ...prev, [fieldKey]: path }));
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "이미지 업로드 실패");
    } finally {
      setUploadingImageField(null);
    }
  };

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

      const parsed = parseDescriptionToValues(desc);
      if (parsed.templateId) {
        setEditMode(parsed.templateId);
        setTemplateFormValues(parsed.values);
      } else {
        setEditMode("raw");
        setTemplateFormValues({});
      }
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
    const body = fillTemplate(template.html, templateFormValues);
    return `<!-- kment-tpl:${editMode} -->\n${body}`;
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
    const fallback =
      editedDescriptions[productNo] ??
      (selectedProductNo === productNo ? selectedProductDetail?.description : undefined) ??
      "";
    const html = htmlOverride ?? (previewHtmlRef.current || fallback);
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
  }, [editedDescriptions, previewWindowProductNo, templateFormValues, editMode]);

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

  const downloadPreviewAsImage = async (
    format: "png" | "jpeg",
    html: string,
    productName: string,
    expanded: boolean = false
  ) => {
    if (!html?.trim()) return;
    setCapturingImage(true);

    const imgUrls = [...html.matchAll(/<img[^>]+src=["'](https:\/\/[^"']+)["']/gi)].map(
      (m) => m[1]
    );
    const uniqueUrls = Array.from(new Set(imgUrls));
    let htmlForCapture = html;
    if (uniqueUrls.length > 0) {
      try {
        const res = await fetch("/api/proxy-images-for-capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: uniqueUrls }),
        });
        const data = await res.json();
        const dataUrls = data.dataUrls || {};
        for (const [url, dataUrl] of Object.entries(dataUrls)) {
          if (typeof dataUrl === "string") {
            htmlForCapture = htmlForCapture.split(url).join(dataUrl);
          }
        }
      } catch {
        // 캡처는 진행, 이미지만 빠질 수 있음
      }
    }

    const iframe = document.createElement("iframe");
    const iframeHeight = expanded ? 4000 : 900;
    const captureWidth = 1230;
    iframe.setAttribute(
      "style",
      `position:fixed;left:-9999px;width:${captureWidth}px;height:${iframeHeight}px;border:none;`
    );
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      setCapturingImage(false);
      return;
    }
    doc.open();
    doc.write(buildPreviewDocument(htmlForCapture));
    doc.close();

    const delay = expanded ? 800 : 600;
    window.setTimeout(() => {
      const docEl = iframe.contentDocument;
      const body = docEl?.body;
      if (!body) {
        document.body.removeChild(iframe);
        setCapturingImage(false);
        return;
      }
      if (expanded && docEl) {
        docEl.querySelectorAll(".pd-accordion-item").forEach((item) => {
          const panel = item.querySelector(".pd-accordion-body") as HTMLElement | null;
          if (panel) {
            panel.style.maxHeight = "none";
            item.setAttribute("data-open", "");
          }
        });
      }
      const doCapture = () => {
        html2canvas(body, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: body.scrollWidth,
          height: body.scrollHeight,
        })
          .then((canvas) => {
            const mime = format === "jpeg" ? "image/jpeg" : "image/png";
            const ext = format === "jpeg" ? "jpg" : "png";
            const nameSuffix = expanded ? "-펼침" : "";
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  document.body.removeChild(iframe);
                  setCapturingImage(false);
                  return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `상세-${productName.replace(/[/\\?*:|"]/g, "_").slice(0, 40)}${nameSuffix}.${ext}`;
                a.click();
                URL.revokeObjectURL(url);
                document.body.removeChild(iframe);
                setCapturingImage(false);
              },
              mime,
              format === "jpeg" ? 0.92 : undefined
            );
          })
          .catch(() => {
            document.body.removeChild(iframe);
            setCapturingImage(false);
          });
      };
      if (expanded) {
        window.setTimeout(doCapture, 450);
      } else {
        doCapture();
      }
    }, delay);
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
                        {uploadError && (
                          <div className={styles.errorBox} role="alert">
                            <span>업로드 오류: {uploadError}</span>
                          </div>
                        )}
                        {selectedTemplate.fields.map((field) => (
                          <div key={field.key} className={styles.templateField}>
                            <label className={styles.templateFieldLabel}>{field.label}</label>
                            {field.key === "sec3_items" || field.key === "sec4_items" ? (
                              <AccordionItemsEditor
                                value={templateFormValues[field.key] ?? ""}
                                onChange={(next) =>
                                  setTemplateFormValues((prev) => ({ ...prev, [field.key]: next }))
                                }
                                fieldLabel={field.label}
                                styles={styles}
                              />
                            ) : field.type === "textarea" ? (
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
                            ) : field.key.includes("imageUrl") ? (
                              <div className={styles.imageUploadWrap}>
                                <div
                                  className={`${styles.imageUploadDropzone} ${uploadingImageField === field.key ? styles.imageUploadDropzoneActive : ""}`}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const file = e.dataTransfer?.files?.[0];
                                    if (file) uploadImageToCafe24(field.key, file);
                                  }}
                                  onClick={() =>
                                    (document.getElementById(`file-${field.key}`) as HTMLInputElement)?.click()
                                  }
                                >
                                  {uploadingImageField === field.key
                                    ? "업로드 중…"
                                    : "이미지를 여기에 드래그하거나 클릭하여 선택"}
                                </div>
                                <input
                                  id={`file-${field.key}`}
                                  type="file"
                                  accept="image/*"
                                  className={styles.hidden}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadImageToCafe24(field.key, file);
                                    e.target.value = "";
                                  }}
                                />
                                <div className={styles.imageUploadInputWrap}>
                                  <input
                                    type="url"
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
                                  <span className={styles.imageUploadHint}>
                                    직접 URL 입력 또는 위에서 이미지 업로드. 저장하기를 누르기 전까지는 미리보기만 표시됩니다.
                                  </span>
                                  {(templateFormValues[field.key] ?? "").trim() ? (
                                    <div className={styles.imagePreviewThumb}>
                                      <span className={styles.imagePreviewLabel}>미리보기 (저장 시 반영)</span>
                                      <img
                                        src={templateFormValues[field.key] ?? ""}
                                        alt=""
                                        className={styles.imagePreviewImg}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
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
                    <label className={styles.label}>미리보기 (모바일)</label>
                    <div className={styles.previewHeaderBtns}>
                      <button
                        type="button"
                        onClick={() => openPreviewInNewWindow(p.productNo)}
                        className={styles.previewLink}
                      >
                        새 창에서 보기
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPreviewAsImage("png", previewHtml, p.productName)}
                        disabled={capturingImage}
                        className={styles.previewLink}
                      >
                        {capturingImage ? "변환 중…" : "PNG로 저장"}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPreviewAsImage("jpeg", previewHtml, p.productName)}
                        disabled={capturingImage}
                        className={styles.previewLink}
                      >
                        {capturingImage ? "변환 중…" : "JPEG로 저장"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadPreviewAsImage("png", previewHtml, p.productName, true)
                        }
                        disabled={capturingImage}
                        className={styles.previewLink}
                      >
                        {capturingImage ? "변환 중…" : "PNG로 저장 (펼침)"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadPreviewAsImage("jpeg", previewHtml, p.productName, true)
                        }
                        disabled={capturingImage}
                        className={styles.previewLink}
                      >
                        {capturingImage ? "변환 중…" : "JPEG로 저장 (펼침)"}
                      </button>
                    </div>
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
