"use client";

import { useEffect, useState } from "react";

const MESSAGE_TYPE = "preview-html" as const;

let lastReceivedHtml = "";

export default function PreviewWindowPage() {
  const [srcdoc, setSrcdoc] = useState<string>(() => lastReceivedHtml);

  useEffect(() => {
    if (lastReceivedHtml) setSrcdoc(lastReceivedHtml);

    const handler = (e: MessageEvent) => {
      if (e.data?.type === MESSAGE_TYPE && typeof e.data.html === "string") {
        lastReceivedHtml = e.data.html;
        setSrcdoc(e.data.html);
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
        description 미리보기 (편집 창에서 수정하면 실시간 반영)
      </div>
      <div className="w-full max-w-[1230px] mx-auto flex-1 min-h-0 bg-white">
        <iframe
          title="미리보기"
          srcDoc={srcdoc}
          className="w-full h-full min-h-[70vh] border-0 block bg-white"
          sandbox="allow-same-origin"
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
