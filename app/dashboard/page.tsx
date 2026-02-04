"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// 동적 렌더링 강제 (useSearchParams 사용 시 필요)
export const dynamic = 'force-dynamic';

interface PriceStep {
  target: number;
  price: number;
}

interface FundingProduct {
  id: string;
  mall_id: string;
  product_no: string;
  product_name: string;
  enabled: boolean;
  initial_price: number;
  price_steps: PriceStep[];
  current_sales: number;
  display_multiplier: number;
  include_cancellations: boolean;
  manual_sales_override: number | null;
  created_at: string;
  updated_at: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const mallId = searchParams.get("mall_id");
  const [products, setProducts] = useState<FundingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FundingProduct | null>(null);

  // 펀딩 상품 목록 조회
  const fetchProducts = async () => {
    if (!mallId) return;

    try {
      const response = await fetch(`/api/funding-products?mall_id=${mallId}`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("상품 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mallId) {
      fetchProducts();
    }
  }, [mallId]);

  // 판매량 동기화
  const syncProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/funding-products/${productId}/sync`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        alert(`동기화 완료!\n실제 판매량: ${data.stats.actualSales}개\n표시 판매량: ${data.stats.displaySales}개${data.stats.priceUpdated ? "\n가격이 자동 조정되었습니다." : ""}`);
        fetchProducts();
      } else {
        alert(`동기화 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("동기화 실패:", error);
      alert("동기화 중 오류가 발생했습니다.");
    }
  };

  // 표시 판매량 계산
  const getDisplaySales = (product: FundingProduct): number => {
    const actualSales = product.manual_sales_override ?? product.current_sales;
    return Math.floor(actualSales * product.display_multiplier);
  };

  // 현재 가격 계산
  const getCurrentPrice = (product: FundingProduct): number => {
    const displaySales = getDisplaySales(product);
    const steps = product.price_steps || [];
    
    // 목표 수량에 도달한 가장 높은 단계 찾기
    for (let i = steps.length - 1; i >= 0; i--) {
      if (displaySales >= steps[i].target) {
        return steps[i].price;
      }
    }
    
    return product.initial_price;
  };

  // 달성률 계산
  const getProgress = (product: FundingProduct): number => {
    const steps = product.price_steps || [];
    if (steps.length === 0) return 0;
    
    const maxStep = steps[steps.length - 1];
    const displaySales = getDisplaySales(product);
    
    return Math.min((displaySales / maxStep.target) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">펀딩 관리 대시보드</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            + 펀딩 상품 추가
          </button>
        </div>

        {mallId && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">쇼핑몰 정보</h2>
            <p className="text-gray-600">
              <strong>쇼핑몰 ID:</strong> {mallId}
            </p>
          </div>
        )}

        {/* 펀딩 상품 목록 */}
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-500 mb-4">등록된 펀딩 상품이 없습니다.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                첫 펀딩 상품 추가하기
              </button>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{product.product_name || `상품 #${product.product_no}`}</h3>
                    <p className="text-sm text-gray-500">상품번호: {product.product_no}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => syncProduct(product.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      동기화
                    </button>
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      수정
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">실제 판매량</p>
                    <p className="text-lg font-semibold">{product.current_sales}개</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">표시 판매량</p>
                    <p className="text-lg font-semibold">{getDisplaySales(product)}개</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">현재 가격</p>
                    <p className="text-lg font-semibold">{getCurrentPrice(product).toLocaleString()}원</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">상태</p>
                    <p className={`text-lg font-semibold ${product.enabled ? "text-green-600" : "text-gray-400"}`}>
                      {product.enabled ? "활성" : "비활성"}
                    </p>
                  </div>
                </div>

                {/* 진행률 바 */}
                {product.price_steps && product.price_steps.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>달성률: {getProgress(product).toFixed(1)}%</span>
                      <span>목표: {product.price_steps[product.price_steps.length - 1].target}개</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{ width: `${getProgress(product)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* 가격 단계 표시 */}
                {product.price_steps && product.price_steps.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">가격 단계:</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        초기: {product.initial_price.toLocaleString()}원
                      </span>
                      {product.price_steps.map((step, idx) => (
                        <span key={idx} className="text-sm bg-blue-100 px-2 py-1 rounded">
                          {step.target}개 달성 시: {step.price.toLocaleString()}원
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 상품 추가/수정 모달 */}
      {(showAddModal || editingProduct) && (
        <ProductModal
          mallId={mallId || ""}
          product={editingProduct}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            fetchProducts();
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// 상품 추가/수정 모달 컴포넌트
function ProductModal({
  mallId,
  product,
  onClose,
  onSuccess,
}: {
  mallId: string;
  product: FundingProduct | null;
  isEdit?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    product_no: product?.product_no || "",
    initial_price: product?.initial_price || 0,
    price_steps: product?.price_steps || [],
    display_multiplier: product?.display_multiplier || 1.0,
    include_cancellations: product?.include_cancellations || false,
    enabled: product?.enabled ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [newStep, setNewStep] = useState({ target: 0, price: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product
        ? `/api/funding-products/${product.id}`
        : "/api/funding-products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          mall_id: mallId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        alert(`저장 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const addPriceStep = () => {
    if (newStep.target > 0 && newStep.price > 0) {
      setFormData({
        ...formData,
        price_steps: [...formData.price_steps, { ...newStep }].sort(
          (a, b) => a.target - b.target
        ),
      });
      setNewStep({ target: 0, price: 0 });
    }
  };

  const removePriceStep = (index: number) => {
    setFormData({
      ...formData,
      price_steps: formData.price_steps.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {product ? "펀딩 상품 수정" : "펀딩 상품 추가"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">상품번호 *</label>
            <input
              type="text"
              value={formData.product_no}
              onChange={(e) =>
                setFormData({ ...formData, product_no: e.target.value })
              }
              required
              disabled={!!product}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">초기 판매가 *</label>
            <input
              type="number"
              value={formData.initial_price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  initial_price: parseFloat(e.target.value) || 0,
                })
              }
              required
              min="0"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">노출 배수</label>
            <input
              type="number"
              value={formData.display_multiplier}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  display_multiplier: parseFloat(e.target.value) || 1.0,
                })
              }
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              실제 판매량에 곱할 배수 (예: 10배 설정 시 실제 30개 → 노출 300개)
            </p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.include_cancellations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    include_cancellations: e.target.checked,
                  })
                }
                className="mr-2"
              />
              취소/환불 건을 판매량에 포함
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="mr-2"
              />
              펀딩 활성화
            </label>
          </div>

          {/* 가격 단계 추가 */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">가격 단계 설정</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                placeholder="목표 수량"
                value={newStep.target || ""}
                onChange={(e) =>
                  setNewStep({ ...newStep, target: parseInt(e.target.value) || 0 })
                }
                min="1"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="가격"
                value={newStep.price || ""}
                onChange={(e) =>
                  setNewStep({ ...newStep, price: parseFloat(e.target.value) || 0 })
                }
                min="0"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                type="button"
                onClick={addPriceStep}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                추가
              </button>
            </div>

            {formData.price_steps.length > 0 && (
              <div className="space-y-2">
                {formData.price_steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-50 p-2 rounded"
                  >
                    <span>
                      {step.target}개 달성 시: {step.price.toLocaleString()}원
                    </span>
                    <button
                      type="button"
                      onClick={() => removePriceStep(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
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
      <DashboardContent />
    </Suspense>
  );
}
