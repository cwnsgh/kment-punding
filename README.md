# Kment Punding (카페24 펀딩 앱)

카페24 쇼핑몰에서 펀딩/예약 판매 기능을 제공하는 앱입니다.

## 기능

- 예약 판매 진행
- 목표 수량 달성에 따른 가격 자동 변경 (STEP2, STEP3)
- 게이지바/달성율 실시간 표시
- 상품별 목표치 설정
- 주문 취소/환불 반영
- 실제 판매 수량과 노출 수량 분리

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 `.env.example`을 참고하여 설정하세요.

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

## 카페24 인증

1. 카페24 개발자센터에서 앱 등록
2. Client ID, Client Secret 발급
3. Redirect URI 설정: `https://your-domain.com/api/oauth/callback`
4. 환경 변수에 설정

## 인증 흐름

1. `/api/oauth/authorize?mall_id=xxx&state=xxx` - 인증 시작
2. 카페24 권한 승인 페이지로 리다이렉트
3. `/api/oauth/callback?code=xxx&state=xxx` - 인증 완료 후 토큰 저장
