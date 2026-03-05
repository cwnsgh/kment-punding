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
  id: "A" | "B" | "C" | "D" | "E";
  name: string;
  description: string;
  fields: TemplateField[];
  html: string;
};

type ThemeId = "A" | "B" | "C" | "D" | "E";

/** 공통 필드: 5개 섹션에 필요한 입력값 */
const COMMON_FIELDS: TemplateField[] = [
  {
    key: "sec1_imageUrl",
    label: "섹션1 이미지 URL",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec1_text",
    label: "섹션1 글자",
    type: "textarea",
    placeholder: "이미지 옆에 표시할 텍스트",
  },
  {
    key: "sec2_text",
    label: "섹션2 글자",
    type: "textarea",
    placeholder: "섹션2 텍스트",
  },
  {
    key: "sec2_imageUrl",
    label: "섹션2 이미지 URL",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec3_items",
    label: "섹션3 드롭다운 (한 줄에 하나, 제목::내용)",
    type: "textarea",
    placeholder: "상세스펙::재질, 사이즈 등\n배송안내::배송 기간 및 방법",
  },
  {
    key: "sec4_videoUrl",
    label: "섹션4 동영상 URL",
    type: "url",
    placeholder: "YouTube 또는 Vimeo 링크",
  },
  {
    key: "sec5_title",
    label: "섹션5 제목 (비우면 '자주 묻는 질문', 내용 없으면 섹션 숨김)",
    type: "text",
    placeholder: "예: QnA, 자주 묻는 질문",
  },
  {
    key: "sec5_qa",
    label: "섹션5 Q&A (한 줄에 하나, 질문::답변)",
    type: "textarea",
    placeholder:
      "교환 가능한가요?::7일 이내 미개봉 시 가능합니다\n재고 있나요?::실시간 재고는 문의 주세요",
  },
];

/** 템플릿 E 전용 필드: 이미지 참고 4섹션 (텍스트+이미지 / 3원형카드 / 불릿+이미지 / 이미지+아코디언) + Q&A */
const FIELDS_E: TemplateField[] = [
  {
    key: "sec1_heading1",
    label: "섹션1 제목1",
    type: "text",
    placeholder: "예: Easiest Retinol Ever",
  },
  {
    key: "sec1_text1",
    label: "섹션1 본문1",
    type: "textarea",
    placeholder: "첫 번째 블록 본문",
  },
  {
    key: "sec1_heading2",
    label: "섹션1 제목2",
    type: "text",
    placeholder: "예: Gentle Daily Firming",
  },
  {
    key: "sec1_text2",
    label: "섹션1 본문2",
    type: "textarea",
    placeholder: "두 번째 블록 본문",
  },
  {
    key: "sec1_imageUrl",
    label: "섹션1 이미지 (오른쪽)",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec2_1_imageUrl",
    label: "섹션2-1 원형 이미지",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec2_1_title",
    label: "섹션2-1 제목",
    type: "text",
    placeholder: "예: Boosts Bounce",
  },
  {
    key: "sec2_1_text",
    label: "섹션2-1 설명",
    type: "textarea",
    placeholder: "한 줄 설명",
  },
  {
    key: "sec2_2_imageUrl",
    label: "섹션2-2 원형 이미지",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec2_2_title",
    label: "섹션2-2 제목",
    type: "text",
    placeholder: "예: Soothes",
  },
  {
    key: "sec2_2_text",
    label: "섹션2-2 설명",
    type: "textarea",
    placeholder: "한 줄 설명",
  },
  {
    key: "sec2_3_imageUrl",
    label: "섹션2-3 원형 이미지",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec2_3_title",
    label: "섹션2-3 제목",
    type: "text",
    placeholder: "예: Balances",
  },
  {
    key: "sec2_3_text",
    label: "섹션2-3 설명",
    type: "textarea",
    placeholder: "한 줄 설명",
  },
  {
    key: "sec3_title",
    label: "섹션3 제목",
    type: "text",
    placeholder: "예: Clinical Results After 4 Weeks",
  },
  {
    key: "sec3_bullets",
    label: "섹션3 불릿 (한 줄에 하나)",
    type: "textarea",
    placeholder: "항목1\n항목2\n항목3",
  },
  {
    key: "sec3_footnote",
    label: "섹션3 각주",
    type: "text",
    placeholder: "출처·면책 문구",
  },
  {
    key: "sec3_imageUrl",
    label: "섹션3 이미지 (오른쪽)",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec4_imageUrl",
    label: "섹션4 이미지 (왼쪽)",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec4_heading",
    label: "섹션4 제목",
    type: "text",
    placeholder: "예: Key Ingredients",
  },
  {
    key: "sec4_items",
    label: "섹션4 아코디언 (제목::내용 한 줄씩)",
    type: "textarea",
    placeholder: "성분명::설명\n...",
  },
  {
    key: "sec4_linkText",
    label: "섹션4 링크 글자",
    type: "text",
    placeholder: "예: Full Ingredient List",
  },
  {
    key: "sec4_linkUrl",
    label: "섹션4 링크 URL",
    type: "url",
    placeholder: "https://...",
  },
  {
    key: "sec5_qa",
    label: "섹션5 Q&A (질문::답변 한 줄씩)",
    type: "textarea",
    placeholder: "질문::답변\n...",
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
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
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
  const ytMatch = u.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (ytMatch) src = `https://www.youtube.com/embed/${ytMatch[1]}`;
  else if (vimeoMatch) src = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (!src) return "";
  return `<div class="pd-video-wrap"><iframe src="${src}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
}

/** 섹션5: "질문::답변" 한 줄씩 → Q&A HTML */
export function sec5QaToHtml(text: string): string {
  if (!text || !text.trim()) return "";
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim());
  return lines
    .map((line) => {
      const sep = line.indexOf("::");
      const q = sep >= 0 ? line.slice(0, sep).trim() : line.trim();
      const a = sep >= 0 ? line.slice(sep + 2).trim() : "";
      return `<div class="pd-qa-item"><div class="pd-qa-q">${escapeHtml(q)}</div><div class="pd-qa-a">${escapeHtml(a).replace(/\n/g, "<br>")}</div></div>`;
    })
    .join("\n");
}

/** 한 줄당 하나 → <ul><li> HTML (템플릿 E 섹션3용) */
export function bulletsToHtml(text: string): string {
  if (!text || !text.trim()) return "";
  const items = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => `<li>${escapeHtml(l.trim())}</li>`)
    .join("");
  return `<ul class="pd-bullet-list">${items}</ul>`;
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
<section class="pd-sec pd-sec5 {{sec5_section_class}}" data-reveal>
  <h3 class="pd-sec5-title">{{sec5_title}}</h3>
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
<section class="pd-sec pd-sec5 pd-sec5-b {{sec5_section_class}}" data-reveal>
  <p class="pd-sec-label">FAQ</p>
  <h3 class="pd-sec5-title">{{sec5_title}}</h3>
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
<section class="pd-sec pd-sec5 pd-sec5-c {{sec5_section_class}}" data-reveal>
  <span class="pd-sec-c-label">{{sec5_title}}</span>
  <div class="pd-qa-list">{{sec5_qa}}</div>
</section>`;
}

/** 테마 A: 밝고 심플, E처럼 세련된 연한 크림 톤 */
function getThemeStylesA(): string {
  return `
.pd-detail-wrap { width: 100%; max-width: 1230px; margin: 0 auto; }
.pd-detail.pd-theme-a {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  width: 100%; margin: 0; padding: 0;
  color: #374151; background: #fcfaf9; line-height: 1.65;
}
.pd-detail.pd-theme-a .pd-sec { padding: 48px 24px; border-bottom: 1px solid #ebe8e6; }
.pd-detail.pd-theme-a .pd-sec:last-child { border-bottom: none; }
.pd-detail.pd-theme-a .pd-sec1-inner,
.pd-detail.pd-theme-a .pd-sec2-inner { display: flex; align-items: center; gap: 40px; flex-wrap: wrap; }
.pd-detail.pd-theme-a .pd-sec1-img,
.pd-detail.pd-theme-a .pd-sec2-img { flex: 1 1 320px; border-radius: 12px; overflow: hidden; }
.pd-detail.pd-theme-a .pd-sec1-img img,
.pd-detail.pd-theme-a .pd-sec2-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #f5f5f4;
}
.pd-detail.pd-theme-a .pd-sec1-text,
.pd-detail.pd-theme-a .pd-sec2-text {
  flex: 1 1 320px; font-size: 0.9375rem; color: #4b5563; line-height: 1.7; white-space: pre-wrap;
}
.pd-detail.pd-theme-a .pd-sec3-title,
.pd-detail.pd-theme-a .pd-sec4-title,
.pd-detail.pd-theme-a .pd-sec5-title {
  margin: 0 0 20px; font-size: 1.125rem; font-weight: 600; color: #111;
}
.pd-detail.pd-theme-a .pd-accordion-item {
  border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 10px; overflow: hidden; transition: border-color 0.2s;
}
.pd-detail.pd-theme-a .pd-accordion-item:hover { border-color: #d1d5db; }
.pd-detail.pd-theme-a .pd-accordion-head {
  width: 100%; padding: 16px 20px; text-align: left; font-size: 0.9375rem; font-weight: 600; color: #111;
  background: transparent; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
}
.pd-detail.pd-theme-a .pd-accordion-head::after { content: '▼'; font-size: 0.6rem; color: #9ca3af; }
.pd-detail.pd-theme-a .pd-accordion-item[data-open] .pd-accordion-head::after { content: '▲'; }
.pd-detail.pd-theme-a .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-a .pd-accordion-body-inner { padding: 0 20px 20px; line-height: 1.65; color: #4b5563; font-size: 0.9375rem; border-top: none; }
.pd-detail.pd-theme-a .pd-video-wrap {
  position: relative; width: 100%; padding-bottom: 56.25%; height: 0; border-radius: 12px; overflow: hidden; background: #0a0a0a;
}
.pd-detail.pd-theme-a .pd-video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.pd-detail.pd-theme-a .pd-qa-item { padding: 18px 0; border-bottom: 1px solid #e5e7eb; }
.pd-detail.pd-theme-a .pd-qa-item:last-child { border-bottom: none; }
.pd-detail.pd-theme-a .pd-qa-q { font-weight: 600; color: #111; margin-bottom: 8px; font-size: 0.9375rem; }
.pd-detail.pd-theme-a .pd-qa-a { font-size: 0.9375rem; color: #4b5563; line-height: 1.65; }
.pd-detail.pd-theme-a .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-a .pd-sec { opacity: 0; transform: translateY(18px); transition: opacity 0.5s ease, transform 0.5s ease; }
.pd-detail.pd-theme-a .pd-sec5-hidden { display: none; }
`;
}

/** 테마 B: 프리미엄 상세 – E처럼 세련된 여백·타이포·이미지 크기 */
function getThemeStylesB(): string {
  return `
.pd-detail-wrap { width: 100%; max-width: 1230px; margin: 0 auto; }
.pd-detail.pd-theme-b {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  width: 100%; margin: 0; padding: 0;
  color: #374151;
  background: linear-gradient(180deg, #fcfaf9 0%, #fff 15%);
  line-height: 1.65;
}
.pd-detail.pd-theme-b .pd-sec  { padding: 60px 24px; }
.pd-detail.pd-theme-b .pd-sec-label {
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase;
  color: #9ca3af; margin: 0 0 8px;
}
.pd-detail.pd-theme-b .pd-sec1-b { padding-top: 0; }
.pd-detail.pd-theme-b .pd-sec1-hero {
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.04); margin-bottom: 24px;
}
.pd-detail.pd-theme-b .pd-sec1-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #f5f5f4;
}
.pd-detail.pd-theme-b .pd-sec1-card {
  background: #fff; border-radius: 12px; padding: 28px 26px;
  border: 1px solid #ebe8e6; box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.pd-detail.pd-theme-b .pd-sec1-text {
  white-space: pre-wrap; font-size: 0.9375rem; color: #4b5563; line-height: 1.7;
}
.pd-detail.pd-theme-b .pd-sec2-b { padding-top: 24px; }
.pd-detail.pd-theme-b .pd-sec2-inner {
  display: flex; align-items: center; gap: 40px; flex-wrap: wrap;
}
.pd-detail.pd-theme-b .pd-sec2-text-wrap {
  flex: 1 1 320px; border-left: 3px solid #e5e7eb; padding-left: 20px;
}
.pd-detail.pd-theme-b .pd-sec2-text {
  white-space: pre-wrap; font-size: 0.9375rem; color: #4b5563; line-height: 1.7;
}
.pd-detail.pd-theme-b .pd-sec2-img {
  flex: 1 1 320px; border-radius: 16px; overflow: hidden;
  box-shadow: 0 2px 16px rgba(0,0,0,0.04);
}
.pd-detail.pd-theme-b .pd-sec2-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #f5f5f4;
}
.pd-detail.pd-theme-b .pd-sec3-title,
.pd-detail.pd-theme-b .pd-sec4-title,
.pd-detail.pd-theme-b .pd-sec5-title {
  margin: 0 0 20px; font-size: 1.125rem; font-weight: 600; color: #111; letter-spacing: -0.01em;
}
.pd-detail.pd-theme-b .pd-accordion-item {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 10px;
  overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s;
}
.pd-detail.pd-theme-b .pd-accordion-item:hover { border-color: #d1d5db; }
.pd-detail.pd-theme-b .pd-accordion-item[data-open] { box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
.pd-detail.pd-theme-b .pd-accordion-head {
  width: 100%; padding: 18px 20px; text-align: left; font-size: 0.9375rem; font-weight: 600;
  color: #111; background: transparent; border: none; cursor: pointer;
  display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;
}
.pd-detail.pd-theme-b .pd-accordion-head:hover { background: #fcfaf9; }
.pd-detail.pd-theme-b .pd-accordion-head::after { content: '▼'; font-size: 0.6rem; color: #9ca3af; margin-left: 10px; flex-shrink: 0; }
.pd-detail.pd-theme-b .pd-accordion-item[data-open] .pd-accordion-head::after { content: '▲'; color: #111; }
.pd-detail.pd-theme-b .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-b .pd-accordion-body-inner {
  padding: 0 20px 20px; line-height: 1.65; color: #4b5563; font-size: 0.9375rem; border-top: none;
}
.pd-detail.pd-theme-b .pd-video-wrap {
  position: relative; width: 100%; padding-bottom: 56.25%; height: 0;
  border-radius: 16px; overflow: hidden; background: #0a0a0a; box-shadow: 0 2px 16px rgba(0,0,0,0.06);
}
.pd-detail.pd-theme-b .pd-video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.pd-detail.pd-theme-b .pd-qa-item {
  background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 22px; margin-bottom: 10px;
  transition: border-color 0.2s;
}
.pd-detail.pd-theme-b .pd-qa-item:last-child { margin-bottom: 0; }
.pd-detail.pd-theme-b .pd-qa-item:hover { border-color: #d1d5db; }
.pd-detail.pd-theme-b .pd-qa-q {
  font-weight: 600; color: #111; font-size: 0.9375rem; margin-bottom: 10px; padding-left: 14px; border-left: 3px solid #e5e7eb;
}
.pd-detail.pd-theme-b .pd-qa-a { font-size: 0.9375rem; color: #4b5563; line-height: 1.65; padding-left: 14px; }
.pd-detail.pd-theme-b .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-b .pd-sec { opacity: 0; transform: translateY(18px); transition: opacity 0.5s ease, transform 0.5s ease; }
`;
}

/** 테마 C: 미니멀 에디토리얼 – E처럼 세련된 좁은 단, 세리프, 블랙/화이트 */
function getThemeStylesC(): string {
  return `
.pd-detail-wrap { width: 100%; max-width: 1230px; margin: 0 auto; }
.pd-detail.pd-theme-c {
  font-family: Georgia, 'Times New Roman', 'Malgun Gothic', serif;
  width: 100%; margin: 0; padding: 0;
  color: #111; background: #fcfaf9; line-height: 1.65;
}
.pd-detail.pd-theme-c .pd-sec  { padding: 60px 24px; }
.pd-detail.pd-theme-c .pd-sec-c-label {
  display: block; font-family: 'Pretendard', 'Malgun Gothic', sans-serif;
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: #6b7280; margin-bottom: 20px;
}
.pd-detail.pd-theme-c .pd-sec1-c { padding-top: 0; }
.pd-detail.pd-theme-c .pd-sec1-img { margin-bottom: 32px; border-radius: 12px; overflow: hidden; }
.pd-detail.pd-theme-c .pd-sec1-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #f5f5f4;
}
.pd-detail.pd-theme-c .pd-sec1-text {
  font-family: Georgia, 'Times New Roman', 'Malgun Gothic', serif;
  white-space: pre-wrap; font-size: 0.9375rem; color: #4b5563; line-height: 1.7;
  padding-top: 24px; border-top: 1px solid #e5e7eb;
}
.pd-detail.pd-theme-c .pd-sec2-c .pd-sec2-text,
.pd-detail.pd-theme-c .pd-sec2-text {
  font-family: Georgia, 'Times New Roman', 'Malgun Gothic', serif;
  white-space: pre-wrap; font-size: 0.9375rem; color: #4b5563; line-height: 1.7;
  margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;
}
.pd-detail.pd-theme-c .pd-sec2-img { border-radius: 12px; overflow: hidden; }
.pd-detail.pd-theme-c .pd-sec2-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #f5f5f4;
}
.pd-detail.pd-theme-c .pd-accordion-item {
  border-bottom: 1px solid #e5e7eb; margin-bottom: 0;
}
.pd-detail.pd-theme-c .pd-accordion-head {
  width: 100%; padding: 18px 0; text-align: left; font-size: 0.9375rem; font-weight: 600;
  color: #111; background: transparent; border: none; cursor: pointer;
  display: flex; justify-content: space-between; align-items: center; transition: color 0.2s;
}
.pd-detail.pd-theme-c .pd-accordion-head:hover { color: #4b5563; }
.pd-detail.pd-theme-c .pd-accordion-head::after { content: '▼'; font-size: 0.6rem; color: #9ca3af; flex-shrink: 0; margin-left: 12px; }
.pd-detail.pd-theme-c .pd-accordion-item[data-open] .pd-accordion-head::after { content: '▲'; }
.pd-detail.pd-theme-c .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-c .pd-accordion-body-inner {
  padding: 0 0 20px; line-height: 1.65; color: #4b5563; font-size: 0.9375rem; border-top: none;
}
.pd-detail.pd-theme-c .pd-video-wrap {
  position: relative; width: 100%; padding-bottom: 56.25%; height: 0;
  border-radius: 12px; overflow: hidden; background: #0a0a0a; margin-top: 8px;
}
.pd-detail.pd-theme-c .pd-video-wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.pd-detail.pd-theme-c .pd-qa-item { padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
.pd-detail.pd-theme-c .pd-qa-item:last-child { border-bottom: none; }
.pd-detail.pd-theme-c .pd-qa-q { font-weight: 600; color: #111; font-size: 0.9375rem; margin-bottom: 8px; }
.pd-detail.pd-theme-c .pd-qa-a { font-size: 0.9375rem; color: #4b5563; line-height: 1.65; }
.pd-detail.pd-theme-c .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-c .pd-sec { opacity: 0; transform: translateY(18px); transition: opacity 0.5s ease, transform 0.5s ease; }
.pd-detail.pd-theme-c .pd-sec5-hidden { display: none; }
`;
}

/** 템플릿 D 전용: 이쁜 꾸민 버전 (동일 플레이스홀더·클래스명 유지) */
function getSectionsHtmlD(): string {
  return `
<section class="pd-sec pd-sec1 pd-sec1-d" data-reveal>
  <div class="pd-sec1-d-hero">
    <div class="pd-sec1-img"><img src="{{sec1_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  </div>
  <div class="pd-sec1-d-card"><div class="pd-sec1-text">{{sec1_text}}</div></div>
</section>
<section class="pd-sec pd-sec2 pd-sec2-d" data-reveal>
  <div class="pd-sec2-inner">
    <div class="pd-sec2-d-card"><div class="pd-sec2-text">{{sec2_text}}</div></div>
    <div class="pd-sec2-img"><img src="{{sec2_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  </div>
</section>
<section class="pd-sec pd-sec3 pd-sec3-d" data-reveal>
  <span class="pd-sec-d-label">상세 정보</span>
  <div class="pd-accordion">{{sec3_items}}</div>
</section>
<section class="pd-sec pd-sec4 pd-sec4-d" data-reveal>
  <span class="pd-sec-d-label">동영상</span>
  {{sec4_videoEmbed}}
</section>
<section class="pd-sec pd-sec5 pd-sec5-d {{sec5_section_class}}" data-reveal>
  <span class="pd-sec-d-label">{{sec5_title}}</span>
  <div class="pd-qa-list">{{sec5_qa}}</div>
</section>`;
}

/** 템플릿 E: 참고 이미지 4섹션 (텍스트+이미지 / 3원형 / 불릿+이미지 / 이미지+아코디언) + Q&A */
function getSectionsHtmlE(): string {
  return `
<section class="pd-sec pd-e-sec1" data-reveal>
  <div class="pd-e-sec1-inner">
    <div class="pd-e-sec1-texts">
      <div class="pd-e-block"><h3 class="pd-e-heading">{{sec1_heading1}}</h3><div class="pd-e-body">{{sec1_text1}}</div></div>
      <div class="pd-e-block"><h3 class="pd-e-heading">{{sec1_heading2}}</h3><div class="pd-e-body">{{sec1_text2}}</div></div>
    </div>
    <div class="pd-e-sec1-img"><img src="{{sec1_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  </div>
</section>
<section class="pd-sec pd-e-sec2" data-reveal>
  <div class="pd-e-sec2-grid">
    <div class="pd-e-circle-card"><div class="pd-e-circle-img"><img src="{{sec2_1_imageUrl}}" alt="" onerror="this.style.display='none'"/></div><h4 class="pd-e-circle-title">{{sec2_1_title}}</h4><p class="pd-e-circle-text">{{sec2_1_text}}</p></div>
    <div class="pd-e-circle-card"><div class="pd-e-circle-img"><img src="{{sec2_2_imageUrl}}" alt="" onerror="this.style.display='none'"/></div><h4 class="pd-e-circle-title">{{sec2_2_title}}</h4><p class="pd-e-circle-text">{{sec2_2_text}}</p></div>
    <div class="pd-e-circle-card"><div class="pd-e-circle-img"><img src="{{sec2_3_imageUrl}}" alt="" onerror="this.style.display='none'"/></div><h4 class="pd-e-circle-title">{{sec2_3_title}}</h4><p class="pd-e-circle-text">{{sec2_3_text}}</p></div>
  </div>
</section>
<section class="pd-sec pd-e-sec3" data-reveal>
  <div class="pd-e-sec3-inner">
    <div class="pd-e-sec3-left">
      <h3 class="pd-e-sec3-title">{{sec3_title}}</h3>
      {{sec3_bullets}}
      <p class="pd-e-footnote">{{sec3_footnote}}</p>
    </div>
    <div class="pd-e-sec3-img"><img src="{{sec3_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
  </div>
</section>
<section class="pd-sec pd-e-sec4" data-reveal>
  <div class="pd-e-sec4-inner">
    <div class="pd-e-sec4-img"><img src="{{sec4_imageUrl}}" alt="" onerror="this.style.display='none'"/></div>
    <div class="pd-e-sec4-right">
      <h3 class="pd-e-sec4-heading">{{sec4_heading}}</h3>
      <div class="pd-accordion">{{sec4_items}}</div>
      <a href="{{sec4_linkUrl}}" class="pd-e-link" target="_blank" rel="noopener">{{sec4_linkText}}</a>
    </div>
  </div>
</section>
<section class="pd-sec pd-e-sec5 {{sec5_section_class}}" data-reveal>
  <h3 class="pd-e-sec5-title">{{sec5_title}}</h3>
  <div class="pd-qa-list">{{sec5_qa}}</div>
</section>`;
}

/** 테마 D: 이쁘게 꾸민 – E처럼 세련된 로즈·민트, 이미지 크기 통일 */
function getThemeStylesD(): string {
  return `
.pd-detail-wrap { width: 100%; max-width: 1230px; margin: 0 auto; }
.pd-detail.pd-theme-d {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  width: 100%; margin: 0; padding: 0 20px 48px;
  color: #4b5563;
  background: linear-gradient(180deg, #fef7f7 0%, #fcfaf9 20%, #f7fdf9 100%);
  line-height: 1.65;
}
.pd-detail.pd-theme-d .pd-sec { padding: 60px 24px; }
.pd-detail.pd-theme-d .pd-sec-d-label {
  display: inline-block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.15em;
  text-transform: uppercase; color: #db2777; margin-bottom: 16px; padding-bottom: 6px;
  border-bottom: 2px solid #fbcfe8;
}
.pd-detail.pd-theme-d .pd-sec1-d { padding-top: 0; }
.pd-detail.pd-theme-d .pd-sec1-d-hero {
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 4px 20px rgba(219, 39, 119, 0.06); margin-bottom: 28px;
}
.pd-detail.pd-theme-d .pd-sec1-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #fdf2f8;
}
.pd-detail.pd-theme-d .pd-sec1-d-card {
  background: linear-gradient(135deg, #fff 0%, #fef7f7 100%);
  border-radius: 16px; padding: 28px 26px; border: 1px solid #fbcfe8;
  box-shadow: 0 2px 8px rgba(219, 39, 119, 0.04);
}
.pd-detail.pd-theme-d .pd-sec1-text {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  white-space: pre-wrap; font-size: 0.9375rem; color: #5f4a5a; line-height: 1.7;
}
.pd-detail.pd-theme-d .pd-sec2-d .pd-sec2-inner {
  display: flex; align-items: center; gap: 40px; flex-wrap: wrap;
}
.pd-detail.pd-theme-d .pd-sec2-d-card {
  flex: 1 1 320px;
  background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
  border-radius: 16px; padding: 26px 24px; border: 1px solid #bbf7d0;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.04);
}
.pd-detail.pd-theme-d .pd-sec2-text {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  white-space: pre-wrap; font-size: 0.9375rem; color: #14532d; line-height: 1.7;
}
.pd-detail.pd-theme-d .pd-sec2-img {
  flex: 1 1 320px; border-radius: 16px; overflow: hidden;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.06);
}
.pd-detail.pd-theme-d .pd-sec2-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #ecfdf5;
}
.pd-detail.pd-theme-d .pd-accordion-item {
  background: #fff;
  border: 1px solid #fecdd3;
  border-radius: 14px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.04);
  transition: box-shadow 0.25s, border-color 0.25s;
}
.pd-detail.pd-theme-d .pd-accordion-item:hover {
  border-color: #f9a8d4;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.08);
}
.pd-detail.pd-theme-d .pd-accordion-item[data-open] {
  border-color: #f9a8d4;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.1);
}
.pd-detail.pd-theme-d .pd-accordion-head {
  width: 100%;
  padding: 18px 20px;
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #831843;
  background: linear-gradient(180deg, #fff 0%, #fdf2f8 100%);
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}
.pd-detail.pd-theme-d .pd-accordion-head:hover { background: #fce7f3; }
.pd-detail.pd-theme-d .pd-accordion-head::after {
  content: '▼';
  font-size: 0.6rem;
  color: #e11d48;
  margin-left: 10px;
  flex-shrink: 0;
  transition: color 0.2s;
}
.pd-detail.pd-theme-d .pd-accordion-item[data-open] .pd-accordion-head::after {
  content: '▲';
}
.pd-detail.pd-theme-d .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-d .pd-accordion-body-inner {
  padding: 0 20px 20px;
  line-height: 1.75;
  color: #5f4a5a;
  font-size: 0.9375rem;
  border-top: none;
  background: #fff;
}
.pd-detail.pd-theme-d .pd-video-wrap {
  position: relative; width: 100%; padding-bottom: 56.25%; height: 0;
  border-radius: 16px; overflow: hidden; background: #0a0a0a;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-top: 8px;
}
.pd-detail.pd-theme-d .pd-video-wrap iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.pd-detail.pd-theme-d .pd-qa-item {
  background: linear-gradient(135deg, #fff 0%, #fdf2f8 100%);
  border: 1px solid #fecdd3;
  border-radius: 14px;
  padding: 20px 22px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.pd-detail.pd-theme-d .pd-qa-item:last-child { margin-bottom: 0; }
.pd-detail.pd-theme-d .pd-qa-item:hover {
  border-color: #f9a8d4;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.08);
}
.pd-detail.pd-theme-d .pd-qa-q {
  font-weight: 700;
  color: #831843;
  font-size: 0.9375rem;
  margin-bottom: 10px;
}
.pd-detail.pd-theme-d .pd-qa-a {
  font-size: 0.9375rem;
  color: #5f4a5a;
  line-height: 1.75;
}
.pd-detail.pd-theme-d .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-d .pd-sec {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.pd-detail.pd-theme-d .pd-sec5-hidden { display: none; }
`;
}

/** 테마 E: 참고 이미지 스타일 – 2열, 원형 카드, 불릿, 아코디언 */
function getThemeStylesE(): string {
  return `
.pd-detail-wrap { width: 100%; max-width: 1230px; margin: 0 auto; }
.pd-detail.pd-theme-e {
  font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  width: 100%; margin: 0; padding: 0 ;
  color: #374151; background: #fcfaf9; line-height: 1.65;
}
.pd-detail.pd-theme-e .pd-sec  { padding: 60px 24px; }
.pd-detail.pd-theme-e .pd-e-sec1-inner {
  display: flex; align-items: center; gap: 48px; flex-wrap: wrap;
}
.pd-detail.pd-theme-e .pd-e-sec1-texts { flex: 1 1 360px; }
.pd-detail.pd-theme-e .pd-e-block { margin-bottom: 28px; }
.pd-detail.pd-theme-e .pd-e-block:last-child { margin-bottom: 0; }
.pd-detail.pd-theme-e .pd-e-heading {
  font-size: 1.25rem; font-weight: 700; color: #111; margin: 0 0 10px;
}
.pd-detail.pd-theme-e .pd-e-body {
  font-size: 0.9375rem; color: #4b5563; white-space: pre-wrap; line-height: 1.7;
}
.pd-detail.pd-theme-e .pd-e-sec1-img {
  flex: 1 1 360px; border-radius: 12px; overflow: hidden;
}
.pd-detail.pd-theme-e .pd-e-sec1-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #f5f5f4;
}
.pd-detail.pd-theme-e .pd-e-sec2-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;
  max-width: 900px; margin: 0 auto;
}
@media (max-width: 768px) {
  .pd-detail.pd-theme-e .pd-e-sec2-grid { grid-template-columns: 1fr; }
}
.pd-detail.pd-theme-e .pd-e-circle-card { text-align: center; }
.pd-detail.pd-theme-e .pd-e-circle-img {
  width: 180px; height: 180px; margin: 0 auto 16px; border-radius: 50%;
  overflow: hidden; background: #f5f5f4;
}
.pd-detail.pd-theme-e .pd-e-circle-img img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.pd-detail.pd-theme-e .pd-e-circle-title {
  font-size: 1rem; font-weight: 700; color: #111; margin: 0 0 8px;
}
.pd-detail.pd-theme-e .pd-e-circle-text {
  font-size: 0.875rem; color: #6b7280; line-height: 1.5; margin: 0;
}
.pd-detail.pd-theme-e .pd-e-sec3-inner {
  display: flex; align-items: center; gap: 40px; flex-wrap: wrap;
}
.pd-detail.pd-theme-e .pd-e-sec3-left { flex: 1 1 380px; }
.pd-detail.pd-theme-e .pd-e-sec3-title {
  font-size: 1.25rem; font-weight: 700; color: #111; margin: 0 0 16px;
}
.pd-detail.pd-theme-e .pd-bullet-list {
  margin: 0 0 12px; padding-left: 1.25rem; color: #374151; font-size: 0.9375rem; line-height: 1.7;
}
.pd-detail.pd-theme-e .pd-e-footnote {
  font-size: 0.8125rem; color: #6b7280; margin: 12px 0 0; line-height: 1.5;
}
.pd-detail.pd-theme-e .pd-e-sec3-img {
  flex: 1 1 340px; border-radius: 12px; overflow: hidden;
}
.pd-detail.pd-theme-e .pd-e-sec3-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 400px;
  object-fit: contain; object-position: center; display: block; background: #fafafa;
}
.pd-detail.pd-theme-e .pd-e-sec4-inner {
  display: flex; align-items: center; gap: 40px; flex-wrap: wrap;
}
.pd-detail.pd-theme-e .pd-e-sec4-img {
  flex: 1 1 400px; border-radius: 12px; overflow: hidden;
}
.pd-detail.pd-theme-e .pd-e-sec4-img img {
  width: 100%; max-width: 100%; height: auto; max-height: 480px;
  object-fit: contain; object-position: center; display: block; background: #fafafa;
}
.pd-detail.pd-theme-e .pd-e-sec4-right { flex: 1 1 340px; }
.pd-detail.pd-theme-e .pd-e-sec4-heading {
  font-size: 1.125rem; font-weight: 600; color: #111; margin: 0 0 16px;
}
.pd-detail.pd-theme-e .pd-accordion-item {
  border-bottom: 1px solid #e5e7eb; margin-bottom: 0;
}
.pd-detail.pd-theme-e .pd-accordion-head {
  width: 100%; padding: 14px 0; text-align: left; font-size: 0.9375rem; font-weight: 600;
  color: #111; background: transparent; border: none; cursor: pointer;
  display: flex; justify-content: space-between; align-items: center;
}
.pd-detail.pd-theme-e .pd-accordion-head::after { content: '▼'; font-size: 0.6rem; color: #9ca3af; }
.pd-detail.pd-theme-e .pd-accordion-item[data-open] .pd-accordion-head::after { content: '▲'; }
.pd-detail.pd-theme-e .pd-accordion-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.pd-detail.pd-theme-e .pd-accordion-body-inner {
  padding: 0 0 14px; font-size: 0.9375rem; color: #4b5563; line-height: 1.6; border-top: none;
}
.pd-detail.pd-theme-e .pd-e-link {
  display: inline-block; margin-top: 12px; font-size: 0.875rem; color: #059669; text-decoration: underline;
}
.pd-detail.pd-theme-e .pd-e-sec5-title {
  font-size: 1.125rem; font-weight: 600; color: #111; margin: 0 0 16px;
}
.pd-detail.pd-theme-e .pd-qa-item { padding: 16px 0; border-bottom: 1px solid #e5e7eb; }
.pd-detail.pd-theme-e .pd-qa-item:last-child { border-bottom: none; }
.pd-detail.pd-theme-e .pd-qa-q { font-weight: 600; color: #111; margin-bottom: 6px; font-size: 0.9375rem; }
.pd-detail.pd-theme-e .pd-qa-a { font-size: 0.9375rem; color: #4b5563; line-height: 1.6; }
.pd-detail.pd-theme-e .pd-sec[data-visible] { opacity: 1; transform: translateY(0); }
.pd-detail.pd-theme-e .pd-sec {
  opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease;
}
.pd-detail.pd-theme-e .pd-sec5-hidden { display: none; }
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
    case "D":
      return getThemeStylesD();
    case "E":
      return getThemeStylesE();
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
  const themeClass =
    theme === "A"
      ? "pd-theme-a"
      : theme === "B"
        ? "pd-theme-b"
        : theme === "C"
          ? "pd-theme-c"
          : theme === "D"
            ? "pd-theme-d"
            : "pd-theme-e";
  const sectionsHtml =
    theme === "B"
      ? getSectionsHtmlB()
      : theme === "C"
        ? getSectionsHtmlC()
        : theme === "D"
          ? getSectionsHtmlD()
          : theme === "E"
            ? getSectionsHtmlE()
            : getSectionsHtml();
  return `<style>${getThemeStyles(theme)}</style><div class="pd-detail-wrap"><div class="pd-detail ${themeClass}">${sectionsHtml}</div></div><script>${getScript()}</script>`;
}

function getTemplateA(): DescriptionTemplate {
  return {
    id: "A",
    name: "템플릿 A – 심플 라이트",
    description:
      "밝고 깔끔한 그레이 톤, 5개 섹션(이미지+글, 글+이미지, 드롭다운, 동영상, Q&A)",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("A"),
  };
}

function getTemplateB(): DescriptionTemplate {
  return {
    id: "B",
    name: "템플릿 B – 프리미엄 상세",
    description:
      "여백·카드·타이포가 정돈된 상세 페이지. 히어로 이미지, 세로 악센트, 아코디언·Q&A 카드형.",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("B"),
  };
}

function getTemplateC(): DescriptionTemplate {
  return {
    id: "C",
    name: "템플릿 C – 미니멀 에디토리얼",
    description:
      "좁은 단, 세리프, 블랙/화이트. 이미지·텍스트 세로 배치, 아코디언·Q&A 심플 라인.",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("C"),
  };
}

function getTemplateD(): DescriptionTemplate {
  return {
    id: "D",
    name: "템플릿 D – 이쁘게 꾸민",
    description: "로즈·민트 그라데이션, 둥근 카드, 섹션 라벨. 상세·Q&A 카드형.",
    fields: [...COMMON_FIELDS],
    html: buildFullHtml("D"),
  };
}

function getTemplateE(): DescriptionTemplate {
  return {
    id: "E",
    name: "템플릿 E – 뷰티 4섹션",
    description:
      "2열(텍스트+이미지), 3개 원형 카드, 불릿+이미지, 이미지+아코디언, Q&A. max-width 1230px.",
    fields: [...FIELDS_E],
    html: buildFullHtml("E"),
  };
}

/** 스펙 텍스트 → 테이블 행 (기존 호환용, 현재 템플릿에서는 미사용) */
export function specsTextToTableRows(specsText: string): string {
  if (!specsText || !specsText.trim()) return "";
  const rows = specsText
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim());
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
  options?: { specsToTable?: (specsText: string) => string },
): string {
  let out = html;

  const sec3 =
    values.sec3_items != null ? sec3ItemsToAccordion(values.sec3_items) : "";
  const sec4Embed =
    values.sec4_videoUrl != null ? getVideoEmbedHtml(values.sec4_videoUrl) : "";
  const sec5 = values.sec5_qa != null ? sec5QaToHtml(values.sec5_qa) : "";
  const hasSec5 = (values.sec5_qa ?? "").trim() !== "";
  const sec5SectionClass = hasSec5 ? "" : "pd-sec5-hidden";
  const sec5Title =
    values.sec5_title != null && String(values.sec5_title).trim() !== ""
      ? escapeHtml(String(values.sec5_title).trim())
      : "자주 묻는 질문";
  const sec3Bullets =
    values.sec3_bullets != null ? bulletsToHtml(values.sec3_bullets) : "";
  const sec4Items =
    values.sec4_items != null ? sec3ItemsToAccordion(values.sec4_items) : "";

  const replacements: Array<{ place: string; value: string }> = [
    { place: "{{sec3_items}}", value: sec3 },
    { place: "{{sec4_videoEmbed}}", value: sec4Embed },
    { place: "{{sec5_qa}}", value: sec5 },
    { place: "{{sec5_section_class}}", value: sec5SectionClass },
    { place: "{{sec5_title}}", value: sec5Title },
    { place: "{{sec3_bullets}}", value: sec3Bullets },
    { place: "{{sec4_items}}", value: sec4Items },
  ];

  for (const { place, value } of replacements) {
    out = out.split(place).join(value);
  }

  for (const [key, value] of Object.entries(values)) {
    const place = `{{${key}}}`;
    if (!out.includes(place)) continue;
    if (key === "specs" && options?.specsToTable) {
      out = out.replace(
        new RegExp(place.replace(/[{}]/g, "\\$&"), "g"),
        options.specsToTable(value),
      );
      continue;
    }
    if (
      [
        "sec3_items",
        "sec4_videoUrl",
        "sec5_qa",
        "sec5_title",
        "sec3_bullets",
        "sec4_items",
      ].includes(key)
    )
      continue;
    out = out.split(place).join(escapeHtml(value));
  }

  out = out.replace(/\{\{[^}]+\}\}/g, "");
  return out;
}

const TEMPLATES: DescriptionTemplate[] = [
  getTemplateA(),
  getTemplateB(),
  getTemplateC(),
  getTemplateD(),
  getTemplateE(),
];

export const descriptionTemplates = TEMPLATES;

export function getDescriptionTemplateById(
  id: "A" | "B" | "C" | "D" | "E",
): DescriptionTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export type ParsedDescription = {
  templateId: "A" | "B" | "C" | "D" | "E" | null;
  values: Record<string, string>;
};

/**
 * 저장된 description HTML에서 템플릿 ID와 필드값 역추출.
 * 브라우저에서만 DOMParser 사용. 서버에서는 마커만 보고 templateId 추정, values는 빈 객체.
 */
export function parseDescriptionToValues(html: string): ParsedDescription {
  if (!html || typeof html !== "string")
    return { templateId: null, values: {} };

  const trimmed = html.trim();
  let templateId: "A" | "B" | "C" | "D" | "E" | null = null;

  const markerMatch = trimmed.match(/<!--\s*kment-tpl:(A|B|C|D|E)\s*-->/);
  if (markerMatch) templateId = markerMatch[1] as "A" | "B" | "C" | "D" | "E";
  else if (trimmed.includes("pd-theme-a")) templateId = "A";
  else if (trimmed.includes("pd-theme-b")) templateId = "B";
  else if (trimmed.includes("pd-theme-c")) templateId = "C";
  else if (trimmed.includes("pd-theme-d")) templateId = "D";
  else if (trimmed.includes("pd-theme-e")) templateId = "E";

  const values: Record<string, string> = {};
  if (!templateId) return { templateId: null, values: {} };

  if (typeof DOMParser === "undefined") return { templateId, values };

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (templateId === "E") {
      const sec1 = doc.querySelector(".pd-e-sec1");
      if (sec1) {
        const h1 = sec1.querySelectorAll(".pd-e-heading");
        const b1 = sec1.querySelectorAll(".pd-e-body");
        values.sec1_heading1 = (h1[0]?.textContent ?? "").trim();
        values.sec1_text1 = (b1[0]?.textContent ?? "").trim();
        values.sec1_heading2 = (h1[1]?.textContent ?? "").trim();
        values.sec1_text2 = (b1[1]?.textContent ?? "").trim();
        const img = sec1.querySelector(".pd-e-sec1-img img");
        values.sec1_imageUrl = (img?.getAttribute("src") ?? "").trim();
      }
      const sec2Grid = doc.querySelector(".pd-e-sec2-grid");
      if (sec2Grid) {
        const cards = sec2Grid.querySelectorAll(".pd-e-circle-card");
        [0, 1, 2].forEach((i) => {
          const card = cards[i];
          if (card) {
            const img = card.querySelector(".pd-e-circle-img img");
            const title = card.querySelector(".pd-e-circle-title");
            const text = card.querySelector(".pd-e-circle-text");
            values[`sec2_${i + 1}_imageUrl`] = (
              img?.getAttribute("src") ?? ""
            ).trim();
            values[`sec2_${i + 1}_title`] = (title?.textContent ?? "").trim();
            values[`sec2_${i + 1}_text`] = (text?.textContent ?? "").trim();
          }
        });
      }
      const sec3 = doc.querySelector(".pd-e-sec3");
      if (sec3) {
        const titleEl = sec3.querySelector(".pd-e-sec3-title");
        values.sec3_title = (titleEl?.textContent ?? "").trim();
        const bullets = sec3.querySelectorAll(".pd-bullet-list li");
        values.sec3_bullets = Array.from(bullets)
          .map((li) => (li.textContent ?? "").trim())
          .filter(Boolean)
          .join("\n");
        const footnote = sec3.querySelector(".pd-e-footnote");
        values.sec3_footnote = (footnote?.textContent ?? "").trim();
        const img = sec3.querySelector(".pd-e-sec3-img img");
        values.sec3_imageUrl = (img?.getAttribute("src") ?? "").trim();
      }
      const sec4 = doc.querySelector(".pd-e-sec4");
      if (sec4) {
        const img = sec4.querySelector(".pd-e-sec4-img img");
        values.sec4_imageUrl = (img?.getAttribute("src") ?? "").trim();
        const heading = sec4.querySelector(".pd-e-sec4-heading");
        values.sec4_heading = (heading?.textContent ?? "").trim();
        const accordionItems = sec4.querySelectorAll(".pd-accordion-item");
        const lines: string[] = [];
        accordionItems.forEach((item) => {
          const head = item.querySelector(".pd-accordion-head");
          const bodyInner = item.querySelector(".pd-accordion-body-inner");
          const title = (head?.textContent ?? "").trim();
          const body = (bodyInner?.textContent ?? "")
            .trim()
            .replace(/\r?\n/g, "\n");
          lines.push(`${title}::${body}`);
        });
        values.sec4_items = lines.join("\n");
        const link = sec4.querySelector(".pd-e-link");
        values.sec4_linkText = (link?.textContent ?? "").trim();
        values.sec4_linkUrl = (link?.getAttribute("href") ?? "").trim();
      }
      const sec5 = doc.querySelector(".pd-e-sec5");
      if (sec5) {
        const titleEl = sec5.querySelector(".pd-e-sec5-title");
        values.sec5_title = (titleEl?.textContent ?? "").trim();
        const qaItems = sec5.querySelectorAll(".pd-qa-item");
        const qaLines: string[] = [];
        qaItems.forEach((item) => {
          const q = item.querySelector(".pd-qa-q");
          const a = item.querySelector(".pd-qa-a");
          qaLines.push(
            `${(q?.textContent ?? "").trim()}::${(a?.textContent ?? "").trim()}`,
          );
        });
        values.sec5_qa = qaLines.join("\n");
      }
      return { templateId, values };
    }

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
      const body = (bodyInner?.textContent ?? "")
        .trim()
        .replace(/\r?\n/g, "\n");
      sec3Lines.push(`${title}::${body}`);
    });
    values.sec3_items = sec3Lines.join("\n");

    const iframeSrc = (sec4Iframe?.getAttribute("src") ?? "").trim();
    if (iframeSrc) {
      const yt = iframeSrc.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      const vimeo = iframeSrc.match(/(?:player\.)?vimeo\.com\/video\/(\d+)/);
      if (yt) values.sec4_videoUrl = `https://www.youtube.com/watch?v=${yt[1]}`;
      else if (vimeo)
        values.sec4_videoUrl = `https://vimeo.com/video/${vimeo[1]}`;
      else values.sec4_videoUrl = iframeSrc;
    } else {
      values.sec4_videoUrl = "";
    }

    const qaItems = doc.querySelectorAll(".pd-qa-item");
    const sec5Lines: string[] = [];
    qaItems.forEach((item) => {
      const q = item.querySelector(".pd-qa-q");
      const a = item.querySelector(".pd-qa-a");
      sec5Lines.push(
        `${(q?.textContent ?? "").trim()}::${(a?.textContent ?? "").trim()}`,
      );
    });
    values.sec5_qa = sec5Lines.join("\n");

    if (templateId === "A" || templateId === "B") {
      const sec5TitleEl = doc.querySelector(".pd-sec5 .pd-sec5-title");
      values.sec5_title = (sec5TitleEl?.textContent ?? "").trim();
    } else if (templateId === "C") {
      const sec5Label = doc.querySelector(".pd-sec5-c .pd-sec-c-label");
      values.sec5_title = (sec5Label?.textContent ?? "").trim();
    } else if (templateId === "D") {
      const sec5Label = doc.querySelector(".pd-sec5-d .pd-sec-d-label");
      values.sec5_title = (sec5Label?.textContent ?? "").trim();
    }
  } catch {
    return { templateId, values };
  }

  return { templateId, values };
}
