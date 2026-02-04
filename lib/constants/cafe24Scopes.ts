// lib/constants/cafe24Scopes.ts
// 펀딩 기능에 필요한 카페24 권한
export const cafe24Scopes = [
  "mall.read_application",
  "mall.write_application",
  "mall.read_category",
  "mall.read_product",
  "mall.write_product", // 상품 가격 변경을 위해 필요
  "mall.read_order", // 주문 조회를 위해 필요
  "mall.read_store",
  "mall.read_analytics",
];
