"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionCreating, setSessionCreating] = useState(false);

  const mall_id = searchParams.get("mall_id");
  const user_name = searchParams.get("user_name");
  const shop_no = searchParams.get("shop_no");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // 클라이언트 사이드에서 state 생성 (Cafe24 요구사항)
  const generateState = (mallId: string): string => {
    // 브라우저의 crypto API 사용 (클라이언트 사이드)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${mallId}:${randomHex}`;
  };

  useEffect(() => {
    if (!mall_id) {
      setLoading(false);
      return;
    }

    // OAuth 인증이 필요한 경우 (서버에서 리다이렉트)
    const oauthRequired = searchParams.get("oauth_required");
    if (oauthRequired === "true") {
      // 클라이언트 사이드에서 state 생성 후 OAuth 인증 시작
      const state = generateState(mall_id);
      window.location.href = `/api/oauth/authorize?mall_id=${mall_id}&state=${encodeURIComponent(
        state
      )}`;
      return;
    }

    // 카페24 앱 실행 감지: 추가 파라미터가 있는 경우
    const timestamp = searchParams.get("timestamp");
    const hmac = searchParams.get("hmac");
    const user_id = searchParams.get("user_id");

    // 카페24에서 제공하는 추가 파라미터가 있으면 세션 생성
    if (timestamp && (hmac || user_id)) {
      console.log("🔄 카페24 앱 실행 감지, 세션 생성 시작");
      createSessionFromCafe24();
    } else {
      setLoading(false);
    }
  }, [mall_id]);

  // 카페24 앱 실행 시 세션 생성
  const createSessionFromCafe24 = async () => {
    try {
      setSessionCreating(true);
      console.log("🔐 카페24 세션 생성 API 호출 시작");

      // 서버에서 리다이렉트를 반환하므로, window.location으로 직접 호출
      // 이렇게 하면 쿠키가 제대로 설정되고 리다이렉트도 자동으로 따라감
      const apiUrl = `/api/auth/session-from-cafe24?${searchParams.toString()}`;
      console.log("🔄 세션 생성 API 호출:", apiUrl);
      window.location.href = apiUrl;
      // 리다이렉트가 자동으로 처리되므로 여기서 리턴
      return;
    } catch (error) {
      console.error("❌ 카페24 세션 생성 중 오류:", error);
      setSessionCreating(false);
      setLoading(false);
    }
  };

  const handleAuthorize = () => {
    if (mall_id) {
      // 클라이언트 사이드에서 state 생성
      const state = generateState(mall_id);
      window.location.href = `/api/oauth/authorize?mall_id=${mall_id}&state=${encodeURIComponent(
        state
      )}`;
    }
  };

  if (loading || sessionCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">
            {sessionCreating ? "세션 생성 중..." : "로딩 중..."}
          </h2>
          <p className="text-gray-600 mt-2">
            {sessionCreating
              ? "카페24 인증 정보를 확인하고 세션을 생성하고 있습니다."
              : "쇼핑몰 정보를 확인하고 있습니다."}
          </p>
          {sessionCreating && (
            <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요...</p>
          )}
        </div>
      </div>
    );
  }

  if (!mall_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류</h1>
          <p className="text-gray-600">쇼핑몰 정보가 없습니다.</p>
          <p className="text-gray-600 mt-2">
            카페24 앱스토어에서 다시 실행해주세요.
          </p>
        </div>
      </div>
    );
  }

  // OAuth 에러가 발생한 경우
  if (error === "oauth_failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900">권한 요청 실패</h1>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">에러 내용:</h3>
            <p className="text-red-700 text-sm">
              {error_description || "알 수 없는 오류가 발생했습니다."}
            </p>
          </div>

          <button
            onClick={handleAuthorize}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            다시 권한 요청하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Kment Punding</h1>
        <p className="text-gray-600 mb-6">카페24 펀딩/예약 판매 앱</p>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">몰 ID</p>
            <p className="text-lg font-mono font-semibold text-gray-900 mt-1">
              {mall_id}
            </p>
          </div>
          <div className="mt-8">
            <a
              href="/authorize"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              수동 인증 시작
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
