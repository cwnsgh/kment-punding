"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGE_TYPE = "preview-html" as const;
const HEIGHT_MESSAGE_TYPE = "iframe-content-height" as const;

let lastReceivedHtml = "";

export default function PreviewWindowPage() {
  const [srcdoc, setSrcdoc] = useState<string>(() => lastReceivedHtml);
  const [iframeHeight, setIframeHeight] = useState<number>(2000);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (lastReceivedHtml) setSrcdoc(lastReceivedHtml);

    const handler = (e: MessageEvent) => {
      if (e.data?.type === MESSAGE_TYPE && typeof e.data.html === "string") {
        lastReceivedHtml = e.data.html;
        setSrcdoc(e.data.html);
        setIframeHeight(2000);
      }
      if (e.data?.type === HEIGHT_MESSAGE_TYPE && typeof e.data.height === "number" && e.data.height > 0) {
        setIframeHeight(Math.max(e.data.height + 24, 800));
      }
    };
    window.addEventListener("message", handler);

    const sendReady = () => {
      if (window.opener) {
        window.opener.postMessage({ type: "preview-ready" }, window.location.origin);
      }
    };
    sendReady();
    const t1 = window.setTimeout(sendReady, 150);
    const t2 = window.setTimeout(sendReady, 400);
    const t3 = window.setTimeout(sendReady, 800);

    return () => {
      window.removeEventListener("message", handler);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-100 relative">
      <div className="w-full max-w-[1230px] mx-auto flex-shrink-0 px-3 py-2 bg-gray-200 text-xs text-gray-600 border-b border-gray-300">
        description 미리보기 · 웹 (편집 창에서 수정하면 실시간 반영)
      </div>
      <div className="w-full max-w-[1230px] mx-auto flex-1 bg-white overflow-auto">
        <iframe
          ref={iframeRef}
          title="미리보기"
          srcDoc={srcdoc}
          style={{ width: "100%", minHeight: iframeHeight, height: iframeHeight, border: 0, display: "block" }}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
      {!srcdoc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 text-sm pointer-events-none">
          편집 창에서 「미리보기 새 창으로」를 누르면 여기에 표시됩니다.
        </div>
      )}
    </div>
  );
}
