/**
 * 상품 description용 HTML 템플릿 A, B, C
 * 공통 구조: 섹션1(이미지-글) / 섹션2(글-이미지) / 섹션3(드롭다운) / 섹션4(동영상) / 섹션5(Q&A)
 * A, B, C는 같은 구조에 CSS만 다르게 적용. 각 섹션에 JS 효과(스크롤 페이드인, 아코디언) 적용.
 */

export type TemplateFieldType = "text" | "textarea" | "url";

export type TemplateField = {
  key: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
};

export type DescriptionTemplate = {
  id: "A" | "B" | "C";
  name: string;
  description: string;
  fields: TemplateField[];
  html: string;
};

type ThemeId = "A" | "B" | "C";

/** 공통 필드: 5개 섹션에 필요한 입력값 */
const COMMON_FIELDS: TemplateField[] = [
  { key: "sec1_imageUrl", label: "섹션1 이미지 URL", type: "url", placeholder: "https://..." },
  { key: "sec1_text", label: "섹션1 글자", type: "textarea", placeholder: "이미지 옆에 표시할 텍스트" },
  { key: "sec2_text", label: "섹션2 글자", type: "textarea", placeholder: "섹션2 텍스트" },
  { key: "sec2_imageUrl", label: "섹션2 이미지 URL", type: "url", placeholder: "https://..." },
  {
    key: "sec3_items",
    label: "섹션3 드롭다운 (한 줄에 하나, 제목::내용)",
    type: "textarea",
    placeholder: "상세스펙::재질, 사이즈 등\n배송안내::배송 기간 및 방법",
  },
  { key: "sec4_videoUrl", label: "섹션4 동영상 URL", type: "url", placeholder: "YouTube 또는 Vimeo 링크" },
  {
    key: "sec5_qa",
    label: "섹션5 Q&A (한 줄에 하나, 질문::답변)",
    type: "textarea",
    placeholder: "교환 가능한가요?::7일 이내 미개봉 시 가능합니다\n재고 있나요?::실시간 재고는 문의 주세요",
  },
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 섹션3: "제목::내용" 한 줄씩 → 아코디언 HTML */
export function sec3ItemsToAccordion(text: string): string {
  if (!text || !text.trim()) return "";
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  return lines
    .map((line) => {
      const sep = line.indexOf("::");
      const title = sep >= 0 ? line.slice(0, sep).trim() : line.trim();
      const body = sep >= 0 ? line.slice(sep + 2).trim() : "";
      return `<div class="pd-accordion-item" data-accordion>
  <button type="button" class="pd-accordion-head" aria-expanded="false">${escapeHtml(title)}</button>
  <div class="pd-accordion-body"><div class="pd-accordion-body-inner">${escapeHtml(body).replace(/\n/g, "<br>")}</div></div>
</div>`;
    })
    .join("\n");
}

/** YouTube / Vimeo URL → embed iframe HTML */
export function getVideoEmbedHtml(url: string): string {
  if (!url || !url.trim()) return "";
  const u = url.trim();
  let src = "";
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (ytMatch) src = `https://www.youtube.com/embed/${ytMatch[1]}`;
  else if (vimeoMatch) src = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (!src) return "";
  return `<div class="pd-video-wrap"><iframe src="${src}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
}

/** 섹션5: "질문::답변" 한 줄씩 → Q&A HTML */
export function sec5QaToHtml(text: string): string {
  if (!text || !text.trim()) return "";
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  return lines
    .map((line) => {
      const sep = line.indexOf("::");
      const q = sep >= 0 ? line.slice(0, sep).trim() : line.trim();
      const a = sep >= 0 ? line.slice(sep + 2).trim() : "";
      return `<div class="pd-qa-item"><div class="pd-qa-q">${escapeHtml(q)}</div><div class="pd-qa-a">${escapeHtml(a).replace(/\n/g, "<br>")}</div></div>`;
    })
    .join("\n");
}

/** 공통 5섹션 HTML (플레이스홀더 포함) */
function getSectionsHtml(): string {
  return `
<section class="pd-sec pd-sec1" data-reveal>
  <div class="pd-sec1-inner">
    <div class="pd-sec1-img"><img src="{{sec1_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
    <div class="pd-sec1-text">{{sec1_text}}</div>
  </div>
</section>
<section class="pd-sec pd-sec2" data-reveal>
  <div class="pd-sec2-inner">
    <div class="pd-sec2-text">{{sec2_text}}</div>
    <div class="pd-sec2-img"><img src="{{sec2_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  </div>
</section>
<section class="pd-sec pd-sec3" data-reveal>
  <h3 class="pd-sec3-title">상세 정보</h3>
  <div class="pd-accordion">{{sec3_items}}</div>
</section>
<section class="pd-sec pd-sec4" data-reveal>
  <h3 class="pd-sec4-title">동영상</h3>
  {{sec4_videoEmbed}}
</section>
<section class="pd-sec pd-sec5" data-reveal>
  <h3 class="pd-sec5-title">자주 묻는 질문</h3>
  <div class="pd-qa-list">{{sec5_qa}}</div>
</section>`;
}

/** 테마 A: 밝고 심플, 연한 그레이 톤 */
function getThemeStylesA(): string {
  return `
.pd-detail.pd-theme-a { font-family: 'Malgun Gothic', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 16px; color: #374151; }
.pd-detail.pd-theme-a .pd-sec { padding: 32px 0; border-bottom: 1px solid #e5e7eb; }
.pd-detail.pd-theme-a .pd-sec:last-child { border-bottom: none; }
.pd-detail.pd-theme-a .pd-sec1-inner,
.pd-detail.pd-theme-a .pd-sec2-inner { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.pd-detail.pd-theme-a .pd-sec1-img,
.pd-detail.pd-theme-a .pd-sec2-img { flex: 1 1 280px; }
.pd-detail.pd-theme-a .pd-sec1-img img,
.pd-detail.pd-theme-a .pd-sec2-img img { width: 100%; height: auto; border-radius: 8px; display: block; background: #f3f4f6; }
.pd-detail.pd-theme-a .pd-sec1-text,
.pd-detail.pd-theme-a .pd-sec2-text { flex: 1 1 280px; line-height: 1.7; white-space: pre-wrap; }
.pd-detail.pd-theme-a .pd-sec3-title,
.pd-detail.pd-theme-a .pd-sec4-title,
.pd-detail.pd-theme-a .pd-sec5-title { margin: 0 0 16px; font-size: 1.1rem; color: #111827; }
.pd-detail.pd-theme-a .pd-accordion-item { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
.pd-detail.pd-theme-a .pd-accordion-head { width: 100%; padding: 14px 16px; text-align: left; font-size: 1rem; font-weight: 600; color: #111827; background: #f9fafb; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.pd-detail.pd-theme-a .pd-accordion-head::after { content: '+'; font-size: 1.2rem; }
.pd-detail.pd-theme-a .pd-accordion-item[data-open] .pd-accordion-head::after { content: '−'; }
.pd-detail.pd-theme-a .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-a .pd-accordion-body-inner { padding: 16px; line-height: 1.6; color: #4b5563; border-top: 1px solid #e5e7eb; }
.pd-detail.pd-theme-a .pd-video-wrap { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; border-radius: 8px; overflow: hidden; background: #000; }
.pd-detail.pd-theme-a .pd-video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.pd-detail.pd-theme-a .pd-qa-item { border-bottom: 1px solid #e5e7eb; padding: 14px 0; }
.pd-detail.pd-theme-a .pd-qa-item:last-child { border-bottom: none; }
.pd-detail.pd-theme-a .pd-qa-q { font-weight: 600; color: #111827; margin-bottom: 6px; }
.pd-detail.pd-theme-a .pd-qa-a { font-size: 0.95rem; color: #6b7280; line-height: 1.6; }
.pd-detail.pd-theme-a .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-a .pd-sec { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease; }
`;
}

/** 테마 B: 강한 대비, 다크 악센트 */
function getThemeStylesB(): string {
  return `
.pd-detail.pd-theme-b { font-family: 'Malgun Gothic', sans-serif; max-width: 720px; margin: 0 auto; padding: 24px 16px; color: #1f2937; background: linear-gradient(180deg, #fefce8 0%, #fff 30%); }
.pd-detail.pd-theme-b .pd-sec { padding: 40px 0; border-bottom: 2px solid #fde68a; }
.pd-detail.pd-theme-b .pd-sec:last-child { border-bottom: none; }
.pd-detail.pd-theme-b .pd-sec1-inner,
.pd-detail.pd-theme-b .pd-sec2-inner { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
.pd-detail.pd-theme-b .pd-sec1-img,
.pd-detail.pd-theme-b .pd-sec2-img { flex: 1 1 280px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }
.pd-detail.pd-theme-b .pd-sec1-img img,
.pd-detail.pd-theme-b .pd-sec2-img img { width: 100%; height: auto; display: block; background: #fef3c7; }
.pd-detail.pd-theme-b .pd-sec1-text,
.pd-detail.pd-theme-b .pd-sec2-text { flex: 1 1 280px; line-height: 1.8; white-space: pre-wrap; font-size: 1.02rem; }
.pd-detail.pd-theme-b .pd-sec3-title,
.pd-detail.pd-theme-b .pd-sec4-title,
.pd-detail.pd-theme-b .pd-sec5-title { margin: 0 0 20px; font-size: 1.15rem; color: #92400e; border-left: 4px solid #f59e0b; padding-left: 12px; }
.pd-detail.pd-theme-b .pd-accordion-item { border: 2px solid #fde68a; border-radius: 12px; margin-bottom: 10px; overflow: hidden; background: #fffbeb; }
.pd-detail.pd-theme-b .pd-accordion-head { width: 100%; padding: 16px 18px; text-align: left; font-size: 1rem; font-weight: 700; color: #78350f; background: #fef3c7; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.pd-detail.pd-theme-b .pd-accordion-head::after { content: '▼'; font-size: 0.75rem; transition: transform 0.3s; }
.pd-detail.pd-theme-b .pd-accordion-item[data-open] .pd-accordion-head::after { transform: rotate(-180deg); }
.pd-detail.pd-theme-b .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.35s ease; }
.pd-detail.pd-theme-b .pd-accordion-body-inner { padding: 18px; line-height: 1.7; color: #57534e; border-top: 2px solid #fde68a; background: #fff; }
.pd-detail.pd-theme-b .pd-video-wrap { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
.pd-detail.pd-theme-b .pd-video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.pd-detail.pd-theme-b .pd-qa-item { border-bottom: 2px solid #fde68a; padding: 18px 0; }
.pd-detail.pd-theme-b .pd-qa-item:last-child { border-bottom: none; }
.pd-detail.pd-theme-b .pd-qa-q { font-weight: 700; color: #78350f; margin-bottom: 8px; font-size: 1.02rem; }
.pd-detail.pd-theme-b .pd-qa-a { font-size: 0.95rem; color: #57534e; line-height: 1.7; }
.pd-detail.pd-theme-b .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-b .pd-sec { opacity: 0; transform: translateY(24px); transition: opacity 0.55s ease, transform 0.55s ease; }
`;
}

/** 테마 C: 미니멀 블랙/화이트 */
function getThemeStylesC(): string {
  return `
.pd-detail.pd-theme-c { font-family: Georgia, 'Malgun Gothic', serif; max-width: 680px; margin: 0 auto; padding: 32px 20px; color: #171717; background: #fff; }
.pd-detail.pd-theme-c .pd-sec { padding: 36px 0; border-bottom: 1px solid #e5e5e5; }
.pd-detail.pd-theme-c .pd-sec:last-child { border-bottom: none; }
.pd-detail.pd-theme-c .pd-sec1-inner,
.pd-detail.pd-theme-c .pd-sec2-inner { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
.pd-detail.pd-theme-c .pd-sec1-img,
.pd-detail.pd-theme-c .pd-sec2-img { flex: 1 1 260px; }
.pd-detail.pd-theme-c .pd-sec1-img img,
.pd-detail.pd-theme-c .pd-sec2-img img { width: 100%; height: auto; display: block; background: #fafafa; }
.pd-detail.pd-theme-c .pd-sec1-text,
.pd-detail.pd-theme-c .pd-sec2-text { flex: 1 1 260px; line-height: 1.8; white-space: pre-wrap; font-size: 0.98rem; color: #404040; }
.pd-detail.pd-theme-c .pd-sec3-title,
.pd-detail.pd-theme-c .pd-sec4-title,
.pd-detail.pd-theme-c .pd-sec5-title { margin: 0 0 18px; font-size: 1rem; font-weight: 600; color: #171717; letter-spacing: 0.02em; text-transform: uppercase; }
.pd-detail.pd-theme-c .pd-accordion-item { border: 1px solid #e5e5e5; margin-bottom: 6px; }
.pd-detail.pd-theme-c .pd-accordion-head { width: 100%; padding: 16px 20px; text-align: left; font-size: 0.95rem; font-weight: 600; color: #171717; background: #fff; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
.pd-detail.pd-theme-c .pd-accordion-head:hover { background: #fafafa; }
.pd-detail.pd-theme-c .pd-accordion-head::after { content: '›'; font-size: 1.2rem; transform: rotate(90deg); transition: transform 0.3s; }
.pd-detail.pd-theme-c .pd-accordion-item[data-open] .pd-accordion-head::after { transform: rotate(-90deg); }
.pd-detail.pd-theme-c .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-c .pd-accordion-body-inner { padding: 16px 20px; line-height: 1.7; color: #525252; border-top: 1px solid #e5e5e5; font-size: 0.95rem; }
.pd-detail.pd-theme-c .pd-video-wrap { position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; background: #0a0a0a; }
.pd-detail.pd-theme-c .pd-video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.pd-detail.pd-theme-c .pd-qa-item { padding: 20px 0; border-bottom: 1px solid #e5e5e5; }
.pd-detail.pd-theme-c .pd-qa-item:last-child { border-bottom: none; }
.pd-detail.pd-theme-c .pd-qa-q { font-weight: 600; color: #171717; margin-bottom: 8px; font-size: 0.95rem; }
.pd-detail.pd-theme-c .pd-qa-a { font-size: 0.9rem; color: #525252; line-height: 1.75; }
.pd-detail.pd-theme-c .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-c .pd-sec { opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }
`;
}

function getThemeStyles(theme: ThemeId): string {
  switch (theme) {
    case "A":
      return getThemeStylesA();
    case "B":
      return getThemeStylesB();
    case "C":
      return getThemeStylesC();
  }
}

/** 아코디언 body 안쪽에 .pd-accordion-body-inner 래퍼 필요 (CSS에서 사용) */
/** 공통 JS: 스크롤 페이드인 + 아코디언 토글 */
function getScript(): string {
  return `
(function(){
  var secs = document.querySelectorAll('.pd-sec[data-reveal]');
  function reveal() {
    secs.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) el.setAttribute('data-visible', '');
    });
  }
  reveal();
  window.addEventListener('scroll', reveal);
  window.addEventListener('resize', reveal);

  document.querySelectorAll('.pd-accordion-item[data-accordion]').forEach(function(item) {
    var head = item.querySelector('.pd-accordion-head');
    var body = item.querySelector('.pd-accordion-body');
    if (!head || !body) return;
    head.addEventListener('click', function() {
      var open = item.hasAttribute('data-open');
      item.toggleAttribute('data-open', !open);
      head.setAttribute('aria-expanded', !open);
      body.style.maxHeight = open ? '0' : (body.scrollHeight + 'px');
    });
  });
})();
`;
}

function buildFullHtml(theme: ThemeId): string {
  const themeClass = theme === "A" ? "pd-theme-a" : theme === "B" ? "pd-theme-b" : "pd-theme-c";
  return `<style>${getThemeStyles(theme)}</style><div class="pd-detail ${themeClass}">${getSectionsHtml()}</div><script>${getScript()}</script>`;
}

function getTemplateA(): DescriptionTemplate {
  return {
    id: "A",
    name: "템플릿 A – 심플 라이트",
    description: "밝고 깔끔한 그레이 톤, 5개 섹션(이미지+글, 글+이미지, 드롭다운, 동영상, Q&A)",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("A"),
  };
}

function getTemplateB(): DescriptionTemplate {
  return {
    id: "B",
    name: "템플릿 B – 웜 악센트",
    description: "따뜻한 노란/앰버 악센트, 같은 5섹션 구조",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("B"),
  };
}

function getTemplateC(): DescriptionTemplate {
  return {
    id: "C",
    name: "템플릿 C – 미니멀 다크",
    description: "블랙/화이트 미니멀, 같은 5섹션 구조",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("C"),
  };
}

/** 스펙 텍스트 → 테이블 행 (기존 호환용, 현재 템플릿에서는 미사용) */
export function specsTextToTableRows(specsText: string): string {
  if (!specsText || !specsText.trim()) return "";
  const rows = specsText.trim().split(/\r?\n/).filter((line) => line.trim());
  return rows
    .map((line) => {
      const colon = line.indexOf(":");
      const label = colon > 0 ? line.slice(0, colon).trim() : line.trim();
      const value = colon > 0 ? line.slice(colon + 1).trim() : "";
      return `<tr style="border-bottom:1px solid #e5e7eb"><th style="text-align:left;padding:10px 12px;color:#6b7280;font-weight:500">${escapeHtml(label)}</th><td style="padding:10px 12px;color:#111827">${escapeHtml(value)}</td></tr>`;
    })
    .join("");
}

/**
 * 템플릿 HTML에서 {{key}} 플레이스홀더를 values로 치환.
 * sec3_items → 아코디언 HTML, sec4_videoUrl → sec4_videoEmbed로 iframe 생성, sec5_qa → Q&A HTML.
 */
export function fillTemplate(
  html: string,
  values: Record<string, string>,
  options?: { specsToTable?: (specsText: string) => string }
): string {
  let out = html;

  const sec3 = values.sec3_items != null ? sec3ItemsToAccordion(values.sec3_items) : "";
  const sec4Embed = values.sec4_videoUrl != null ? getVideoEmbedHtml(values.sec4_videoUrl) : "";
  const sec5 = values.sec5_qa != null ? sec5QaToHtml(values.sec5_qa) : "";

  const replacements: Array<{ place: string; value: string }> = [
    { place: "{{sec3_items}}", value: sec3 },
    { place: "{{sec4_videoEmbed}}", value: sec4Embed },
    { place: "{{sec5_qa}}", value: sec5 },
  ];

  for (const { place, value } of replacements) {
    out = out.split(place).join(value);
  }

  for (const [key, value] of Object.entries(values)) {
    const place = `{{${key}}}`;
    if (!out.includes(place)) continue;
    if (key === "specs" && options?.specsToTable) {
      out = out.replace(new RegExp(place.replace(/[{}]/g, "\\$&"), "g"), options.specsToTable(value));
      continue;
    }
    if (["sec3_items", "sec4_videoUrl", "sec5_qa"].includes(key)) continue;
    out = out.split(place).join(escapeHtml(value));
  }

  out = out.replace(/\{\{[^}]+\}\}/g, "");
  return out;
}

const TEMPLATES: DescriptionTemplate[] = [
  getTemplateA(),
  getTemplateB(),
  getTemplateC(),
];

export const descriptionTemplates = TEMPLATES;

export function getDescriptionTemplateById(id: "A" | "B" | "C"): DescriptionTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
