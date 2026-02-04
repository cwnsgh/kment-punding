"use client";

import { useState } from "react";

export default function AuthorizePage() {
  const [mallId, setMallId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthorize = async () => {
    if (!mallId.trim()) {
      alert("쇼핑몰 ID를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // State 생성 (mall_id:랜덤문자열)
      const randomString = Math.random().toString(36).substring(2, 15);
      const state = `${mallId}:${randomString}`;

      // 인증 시작
      const authorizeUrl = `/api/oauth/authorize?mall_id=${encodeURIComponent(
        mallId
      )}&state=${encodeURIComponent(state)}`;

      window.location.href = authorizeUrl;
    } catch (error) {
      console.error("인증 시작 실패:", error);
      alert("인증 시작에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          카페24 인증 시작
        </h1>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="mall_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              쇼핑몰 ID
            </label>
            <input
              id="mall_id"
              type="text"
              value={mallId}
              onChange={(e) => setMallId(e.target.value)}
              placeholder="예: yourshop"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              쇼핑몰 URL의 도메인 부분만 입력하세요 (예: yourshop.cafe24.com → yourshop)
            </p>
          </div>

          <button
            onClick={handleAuthorize}
            disabled={loading || !mallId.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "인증 중..." : "인증 시작"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600">
            <strong>주의:</strong> 카페24 개발자센터에서 앱을 등록하고 Client ID,
            Client Secret을 발급받아 환경 변수에 설정해야 합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
