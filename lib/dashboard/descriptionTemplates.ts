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

/** 템플릿 B 전용: 프리미엄 상세 레이아웃 (동일 플레이스홀더·클래스명 유지) */
function getSectionsHtmlB(): string {
  return `
<section class="pd-sec pd-sec1 pd-sec1-b" data-reveal>
  <div class="pd-sec1-hero">
    <div class="pd-sec1-img"><img src="{{sec1_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  </div>
  <div class="pd-sec1-card"><div class="pd-sec1-text">{{sec1_text}}</div></div>
</section>
<section class="pd-sec pd-sec2 pd-sec2-b" data-reveal>
  <div class="pd-sec2-inner">
    <div class="pd-sec2-text-wrap"><div class="pd-sec2-text">{{sec2_text}}</div></div>
    <div class="pd-sec2-img"><img src="{{sec2_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  </div>
</section>
<section class="pd-sec pd-sec3 pd-sec3-b" data-reveal>
  <p class="pd-sec-label">Detail</p>
  <h3 class="pd-sec3-title">상세 정보</h3>
  <div class="pd-accordion">{{sec3_items}}</div>
</section>
<section class="pd-sec pd-sec4 pd-sec4-b" data-reveal>
  <p class="pd-sec-label">Video</p>
  <h3 class="pd-sec4-title">동영상</h3>
  {{sec4_videoEmbed}}
</section>
<section class="pd-sec pd-sec5 pd-sec5-b" data-reveal>
  <p class="pd-sec-label">FAQ</p>
  <h3 class="pd-sec5-title">자주 묻는 질문</h3>
  <div class="pd-qa-list">{{sec5_qa}}</div>
</section>`;
}

/** 템플릿 C 전용: 미니멀 에디토리얼 레이아웃 (동일 플레이스홀더·클래스명 유지) */
function getSectionsHtmlC(): string {
  return `
<section class="pd-sec pd-sec1 pd-sec1-c" data-reveal>
  <div class="pd-sec1-img"><img src="{{sec1_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  <div class="pd-sec1-text">{{sec1_text}}</div>
</section>
<section class="pd-sec pd-sec2 pd-sec2-c" data-reveal>
  <div class="pd-sec2-text">{{sec2_text}}</div>
  <div class="pd-sec2-img"><img src="{{sec2_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
</section>
<section class="pd-sec pd-sec3 pd-sec3-c" data-reveal>
  <span class="pd-sec-c-label">상세 정보</span>
  <div class="pd-accordion">{{sec3_items}}</div>
</section>
<section class="pd-sec pd-sec4 pd-sec4-c" data-reveal>
  <span class="pd-sec-c-label">동영상</span>
  {{sec4_videoEmbed}}
</section>
<section class="pd-sec pd-sec5 pd-sec5-c" data-reveal>
  <span class="pd-sec-c-label">자주 묻는 질문</span>
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

/** 테마 B: 프리미엄 상세 – 여백·타이포·카드로 정돈된 레이아웃 */
function getThemeStylesB(): string {
  return `
.pd-detail.pd-theme-b {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  max-width: 680px;
  margin: 0 auto;
  padding: 0 20px 48px;
  color: #374151;
  background: linear-gradient(180deg, #fafaf9 0%, #ffffff 12%);
  line-height: 1.65;
}
.pd-detail.pd-theme-b .pd-sec { padding: 48px 0; }
.pd-detail.pd-theme-b .pd-sec-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #a8a29e;
  margin: 0 0 6px;
}
.pd-detail.pd-theme-b .pd-sec1-b { padding-top: 0; }
.pd-detail.pd-theme-b .pd-sec1-hero {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  margin-bottom: 24px;
}
.pd-detail.pd-theme-b .pd-sec1-img img {
  width: 100%;
  height: auto;
  display: block;
  vertical-align: middle;
  background: #f5f5f4;
}
.pd-detail.pd-theme-b .pd-sec1-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #f0efed;
}
.pd-detail.pd-theme-b .pd-sec1-text {
  white-space: pre-wrap;
  font-size: 0.9375rem;
  color: #44403c;
  line-height: 1.75;
}
.pd-detail.pd-theme-b .pd-sec2-b { padding-top: 24px; }
.pd-detail.pd-theme-b .pd-sec2-inner {
  display: flex;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
}
.pd-detail.pd-theme-b .pd-sec2-text-wrap {
  flex: 1 1 280px;
  border-left: 3px solid #d6d3d1;
  padding-left: 20px;
}
.pd-detail.pd-theme-b .pd-sec2-text {
  white-space: pre-wrap;
  font-size: 0.9375rem;
  color: #44403c;
  line-height: 1.75;
}
.pd-detail.pd-theme-b .pd-sec2-img {
  flex: 1 1 280px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
}
.pd-detail.pd-theme-b .pd-sec2-img img {
  width: 100%;
  height: auto;
  display: block;
  background: #f5f5f4;
}
.pd-detail.pd-theme-b .pd-sec3-title,
.pd-detail.pd-theme-b .pd-sec4-title,
.pd-detail.pd-theme-b .pd-sec5-title {
  margin: 0 0 20px;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1c1917;
  letter-spacing: -0.01em;
}
.pd-detail.pd-theme-b .pd-accordion-item {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  margin-bottom: 10px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.pd-detail.pd-theme-b .pd-accordion-item:hover { border-color: #d6d3d1; }
.pd-detail.pd-theme-b .pd-accordion-item[data-open] { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.pd-detail.pd-theme-b .pd-accordion-head {
  width: 100%;
  padding: 18px 20px;
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1c1917;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}
.pd-detail.pd-theme-b .pd-accordion-head:hover { background: #fafaf9; }
.pd-detail.pd-theme-b .pd-accordion-head::after {
  content: '';
  width: 18px;
  height: 18px;
  border-right: 2px solid #a8a29e;
  border-bottom: 2px solid #a8a29e;
  transform: rotate(45deg);
  margin-left: 12px;
  flex-shrink: 0;
  transition: transform 0.25s ease, border-color 0.2s;
}
.pd-detail.pd-theme-b .pd-accordion-item[data-open] .pd-accordion-head::after {
  transform: rotate(-135deg);
  border-color: #1c1917;
}
.pd-detail.pd-theme-b .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-b .pd-accordion-body-inner {
  padding: 0 20px 20px;
  line-height: 1.7;
  color: #57534e;
  font-size: 0.9375rem;
  border-top: none;
}
.pd-detail.pd-theme-b .pd-video-wrap {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
  border-radius: 16px;
  overflow: hidden;
  background: #0c0c0c;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06);
}
.pd-detail.pd-theme-b .pd-video-wrap iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.pd-detail.pd-theme-b .pd-qa-item {
  background: #fff;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  padding: 20px 22px;
  margin-bottom: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.pd-detail.pd-theme-b .pd-qa-item:last-child { margin-bottom: 0; }
.pd-detail.pd-theme-b .pd-qa-item:hover { border-color: #d6d3d1; }
.pd-detail.pd-theme-b .pd-qa-q {
  font-weight: 600;
  color: #1c1917;
  font-size: 0.9375rem;
  margin-bottom: 10px;
  padding-left: 14px;
  border-left: 3px solid #d6d3d1;
}
.pd-detail.pd-theme-b .pd-qa-a {
  font-size: 0.875rem;
  color: #57534e;
  line-height: 1.7;
  padding-left: 14px;
}
.pd-detail.pd-theme-b .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-b .pd-sec {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
`;
}

/** 테마 C: 미니멀 에디토리얼 – 좁은 단, 세리프, 블랙/화이트 */
function getThemeStylesC(): string {
  return `
.pd-detail.pd-theme-c {
  font-family: Georgia, 'Times New Roman', 'Malgun Gothic', serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 0 24px 56px;
  color: #171717;
  background: #fff;
  line-height: 1.7;
}
.pd-detail.pd-theme-c .pd-sec { padding: 48px 0; }
.pd-detail.pd-theme-c .pd-sec-c-label {
  display: block;
  font-family: 'Malgun Gothic', sans-serif;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #737373;
  margin-bottom: 20px;
}
.pd-detail.pd-theme-c .pd-sec1-c { padding-top: 0; }
.pd-detail.pd-theme-c .pd-sec1-img {
  margin-bottom: 32px;
}
.pd-detail.pd-theme-c .pd-sec1-img img {
  width: 100%;
  height: auto;
  display: block;
  background: #fafafa;
}
.pd-detail.pd-theme-c .pd-sec1-text {
  white-space: pre-wrap;
  font-size: 0.9375rem;
  color: #404040;
  line-height: 1.8;
  padding-top: 24px;
  border-top: 1px solid #e5e5e5;
}
.pd-detail.pd-theme-c .pd-sec2-c .pd-sec2-text {
  white-space: pre-wrap;
  font-size: 0.9375rem;
  color: #404040;
  line-height: 1.8;
  margin-bottom: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e5e5;
}
.pd-detail.pd-theme-c .pd-sec2-img img {
  width: 100%;
  height: auto;
  display: block;
  background: #fafafa;
}
.pd-detail.pd-theme-c .pd-accordion-item {
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 0;
}
.pd-detail.pd-theme-c .pd-accordion-head {
  width: 100%;
  padding: 20px 0;
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #171717;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: color 0.2s;
}
.pd-detail.pd-theme-c .pd-accordion-head:hover { color: #404040; }
.pd-detail.pd-theme-c .pd-accordion-head::after {
  content: '+';
  font-size: 1rem;
  font-weight: 400;
  color: #a3a3a3;
  flex-shrink: 0;
  margin-left: 12px;
  transition: transform 0.25s ease;
}
.pd-detail.pd-theme-c .pd-accordion-item[data-open] .pd-accordion-head::after {
  content: '−';
  transform: none;
}
.pd-detail.pd-theme-c .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-c .pd-accordion-body-inner {
  padding: 0 0 20px;
  line-height: 1.75;
  color: #525252;
  font-size: 0.9375rem;
  border-top: none;
}
.pd-detail.pd-theme-c .pd-video-wrap {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  background: #0a0a0a;
  margin-top: 8px;
}
.pd-detail.pd-theme-c .pd-video-wrap iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.pd-detail.pd-theme-c .pd-qa-item {
  padding: 22px 0;
  border-bottom: 1px solid #e5e5e5;
}
.pd-detail.pd-theme-c .pd-qa-item:last-child { border-bottom: none; }
.pd-detail.pd-theme-c .pd-qa-q {
  font-weight: 600;
  color: #171717;
  font-size: 0.9375rem;
  margin-bottom: 8px;
}
.pd-detail.pd-theme-c .pd-qa-a {
  font-size: 0.9375rem;
  color: #525252;
  line-height: 1.75;
}
.pd-detail.pd-theme-c .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-c .pd-sec {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
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
  const sectionsHtml =
    theme === "B" ? getSectionsHtmlB() : theme === "C" ? getSectionsHtmlC() : getSectionsHtml();
  return `<style>${getThemeStyles(theme)}</style><div class="pd-detail ${themeClass}">${sectionsHtml}</div><script>${getScript()}</script>`;
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
    name: "템플릿 B – 프리미엄 상세",
    description: "여백·카드·타이포가 정돈된 상세 페이지. 히어로 이미지, 세로 악센트, 아코디언·Q&A 카드형.",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("B"),
  };
}

function getTemplateC(): DescriptionTemplate {
  return {
    id: "C",
    name: "템플릿 C – 미니멀 에디토리얼",
    description: "좁은 단, 세리프, 블랙/화이트. 이미지·텍스트 세로 배치, 아코디언·Q&A 심플 라인.",
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

export type ParsedDescription = {
  templateId: "A" | "B" | "C" | null;
  values: Record<string, string>;
};

/**
 * 저장된 description HTML에서 템플릿 ID와 필드값 역추출.
 * 브라우저에서만 DOMParser 사용. 서버에서는 마커만 보고 templateId 추정, values는 빈 객체.
 */
export function parseDescriptionToValues(html: string): ParsedDescription {
  if (!html || typeof html !== "string") return { templateId: null, values: {} };

  const trimmed = html.trim();
  let templateId: "A" | "B" | "C" | null = null;

  const markerMatch = trimmed.match(/<!--\s*kment-tpl:(A|B|C)\s*-->/);
  if (markerMatch) templateId = markerMatch[1] as "A" | "B" | "C";
  else if (trimmed.includes("pd-theme-a")) templateId = "A";
  else if (trimmed.includes("pd-theme-b")) templateId = "B";
  else if (trimmed.includes("pd-theme-c")) templateId = "C";

  const values: Record<string, string> = {};
  if (!templateId) return { templateId: null, values: {} };

  if (typeof DOMParser === "undefined") return { templateId, values };

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    const sec1Img = doc.querySelector(".pd-sec1-img img");
    const sec1Text = doc.querySelector(".pd-sec1-text");
    const sec2Text = doc.querySelector(".pd-sec2-text");
    const sec2Img = doc.querySelector(".pd-sec2-img img");
    const sec4Iframe = doc.querySelector(".pd-video-wrap iframe");

    values.sec1_imageUrl = (sec1Img?.getAttribute("src") ?? "").trim();
    values.sec1_text = (sec1Text?.textContent ?? "").trim();
    values.sec2_text = (sec2Text?.textContent ?? "").trim();
    values.sec2_imageUrl = (sec2Img?.getAttribute("src") ?? "").trim();

    const accordionItems = doc.querySelectorAll(".pd-accordion-item");
    const sec3Lines: string[] = [];
    accordionItems.forEach((item) => {
      const head = item.querySelector(".pd-accordion-head");
      const bodyInner = item.querySelector(".pd-accordion-body-inner");
      const title = (head?.textContent ?? "").trim();
      const body = (bodyInner?.textContent ?? "").trim().replace(/\r?\n/g, "\n");
      sec3Lines.push(`${title}::${body}`);
    });
    values.sec3_items = sec3Lines.join("\n");

    const iframeSrc = (sec4Iframe?.getAttribute("src") ?? "").trim();
    if (iframeSrc) {
      const yt = iframeSrc.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      const vimeo = iframeSrc.match(/(?:player\.)?vimeo\.com\/video\/(\d+)/);
      if (yt) values.sec4_videoUrl = `https://www.youtube.com/watch?v=${yt[1]}`;
      else if (vimeo) values.sec4_videoUrl = `https://vimeo.com/video/${vimeo[1]}`;
      else values.sec4_videoUrl = iframeSrc;
    } else {
      values.sec4_videoUrl = "";
    }

    const qaItems = doc.querySelectorAll(".pd-qa-item");
    const sec5Lines: string[] = [];
    qaItems.forEach((item) => {
      const q = item.querySelector(".pd-qa-q");
      const a = item.querySelector(".pd-qa-a");
      sec5Lines.push(`${(q?.textContent ?? "").trim()}::${(a?.textContent ?? "").trim()}`);
    });
    values.sec5_qa = sec5Lines.join("\n");
  } catch {
    return { templateId, values };
  }

  return { templateId, values };
}
