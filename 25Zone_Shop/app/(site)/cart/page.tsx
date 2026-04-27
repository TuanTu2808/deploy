"use client";
import { useEffect, useState } from "react";
import AuthModal from "@/app/components/auth/AuthModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/auth/AuthProvider";
import { CartItem } from "@/types/cart.type";
import { Voucher } from "@/types/voucher";
import { getUserStorageKey } from "@/lib/user-storage";
export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();
  const { user, bootstrapped } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [discount, setDiscount] = useState(0);
  const [voucherMessage, setVoucherMessage] = useState("");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/vouchers?active=true");

        if (!res.ok) throw new Error("Không lấy được voucher");

        const data = await res.json();
        setVouchers(data);
      } catch (err) {
        console.error("Lỗi lấy voucher:", err);
      }
    };

    const fetchSuggested = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/sanpham");
        if (res.ok) {
           const data = await res.json();
           const shuffled = data.sort(() => 0.5 - Math.random());
           setSuggestedProducts(shuffled.slice(0, 4));
        }
      } catch (err) {
        console.error("Lỗi lấy sản phẩm gợi ý:", err);
      }
    };

    fetchVouchers();
    fetchSuggested();
  }, []);
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(getUserStorageKey("cart")) || "[]");
    setCart(data);

    const voucher = JSON.parse(localStorage.getItem("voucher") || "null");

    if (voucher) {
      setDiscount(voucher.discount);
      setVoucher(voucher);
    }
  }, []);
  const applyVoucher = async (code: string) => {
    try {
      const res = await fetch("http://localhost:5001/api/vouchers/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          cart_total: total,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVoucher(null);
        setDiscount(0);
        setVoucherMessage(data.message);
        return;
      }

      setVoucher(data.voucher);
      setDiscount(data.voucher.discount);

      // 🔥 lưu voucher vào localStorage
      localStorage.setItem(
        "voucher",
        JSON.stringify({
          code: data.voucher.code,
          discount: data.voucher.discount,
        }),
      );

      setVoucherMessage("Áp dụng mã thành công");
    } catch {
      setVoucherMessage("Không thể áp dụng voucher");
    }
  };

  useEffect(() => {
    const data: CartItem[] = JSON.parse(localStorage.getItem(getUserStorageKey("cart")) || "[]");
    console.log("CART DATA:", data);
    console.log(
      "KEYS:",
      data.map((i) => i.Id_product),
    );
    setCart(data);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.Price * item.quantity, 0);

  const finalAmount = total - discount;

  const removeItem = (name: string) => {
    const newCart = cart.filter((item) => item.Name_product !== name);
    setCart(newCart);
    localStorage.setItem(getUserStorageKey("cart"), JSON.stringify(newCart));
  };

  const updateQty = (name: string, qty: number) => {
    if (qty < 1) return;

    const newCart = cart.map((item) =>
      item.Name_product === name ? { ...item, quantity: qty } : item,
    );

    setCart(newCart);
    localStorage.setItem(getUserStorageKey("cart"), JSON.stringify(newCart));
  };

  return (
    <main>
      <div className="max-w-[1604px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <p className="text-sm text-gray-500 mb-6">
          Trang chủ / <span className="text-black">Giỏ hàng</span>
        </p>

        <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* LEFT - Cart list */}
          <div className="lg:col-span-8">
            {/* ===== Desktop header row ===== */}
            <div className="hidden lg:grid grid-cols-[2.6fr_0.8fr_0.9fr_1fr_1fr_44px] gap-4 text-sm font-semibold border-b pb-3 text-gray-600">
              <span>Sản phẩm</span>
              <span className="text-center">Dung tích</span>
              <span className="text-right">Giá</span>
              <span className="text-center">Số lượng</span>
              <span className="text-right">Tổng tiền</span>
              <span></span>
            </div>

            {/* ===== Desktop rows ===== */}
            {cart.length === 0 ? (
              <p className="py-10 text-center text-gray-500">
                Giỏ hàng của bạn đang trống
              </p>
            ) : (
              cart.map((item, index) => (
                <div
                  key={`${item.Name_product}-${index}`}
                  className="border-b py-5"
                >
                  {/* ================= DESKTOP ================= */}
                  <div className="hidden lg:grid grid-cols-[2.6fr_0.8fr_0.9fr_1fr_1fr_44px] gap-4 items-center text-sm">
                    <div className="flex items-center gap-4">
                      <img
                        className="w-20 h-20 border rounded object-cover"
                        src={`http://localhost:5001${item.Thumbnail}`}
                        alt={item.Name_product}
                      />
                      <p className="font-medium line-clamp-2">
                        {item.Name_product}
                      </p>
                    </div>

                    <span className="text-center font-medium">{item.Size}</span>

                    <span className="text-right font-medium tabular-nums">
                      {(item.Price ?? 0).toLocaleString()}đ                    </span>

                    <div className="flex justify-center">
                      <input
                        className="w-16 h-9 border rounded text-center"
                        min={1}
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQty(item.Name_product, Number(e.target.value))
                        }
                      />
                    </div>

                    <span className="text-right font-semibold tabular-nums">
                      {((item.Price ?? 0) * (item.quantity ?? 0)).toLocaleString()}đ                    </span>

                    <button
                      onClick={() => removeItem(item.Name_product)}
                      className="text-red-500 text-2xl font-bold flex justify-center"
                    >
                      ×
                    </button>
                  </div>

                  {/* ================= MOBILE ================= */}
                  <div className="lg:hidden mt-4 border rounded-xl p-4 bg-white">
                    <div className="flex gap-4">
                      <img
                        className="w-20 h-20 border rounded object-cover"
                        src={`http://localhost:5001${item.Thumbnail}`}
                        alt={item.Name_product}
                      />

                      <div className="flex-1">
                        <p className="font-medium line-clamp-2">
                          {item.Name_product}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          Giá: {(item.Price ?? 0).toLocaleString()}đ
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <input
                            className="w-16 h-9 border rounded text-center"
                            min={1}
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQty(
                                item.Name_product,
                                Number(e.target.value),
                              )
                            }
                          />

                          <span className="font-semibold">
                            {((item.Price ?? 0) * (item.quantity ?? 0)).toLocaleString()}đ
                          </span>

                          <button
                            onClick={() => removeItem(item.Name_product)}
                            className="text-red-500 text-xl font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT - Summary */}
          <div className="lg:col-span-4">
            <div className="border border-gray-200 rounded-xl p-6 bg-white lg:sticky lg:top-24">
              <h2 className="font-semibold mb-4">Chi tiết đơn hàng</h2>

              <div className="flex justify-between text-sm mb-2 text-gray-700">
                <span>{cart.length} sản phẩm</span>{" "}
              </div>

              <div className="flex justify-between text-sm mb-2 text-gray-700">
                <span>Tổng đơn hàng</span>
                <span className="tabular-nums">
                  {(total ?? 0).toLocaleString()}đ
                </span>{" "}
              </div>

              <div className="flex justify-between text-sm mb-2 text-gray-700">
                <span>Mã giảm giá</span>
                <span className="text-red-500 tabular-nums">
                  -{(discount ?? 0).toLocaleString()}đ
                </span>{" "}
              </div>

              <div className="flex justify-between text-sm mb-4 text-gray-700">
                <span>Phí giao hàng</span>
                <span className="text-green-600">Miễn phí</span>
              </div>

              <hr className="mb-4" />

              <div className="flex justify-between font-semibold mb-6 text-gray-900">
                <span>Tổng thanh toán</span>
                <span className="tabular-nums">
                  {(finalAmount ?? 0).toLocaleString()}đ
                </span>{" "}
              </div>

              <button
                type="button"
                onClick={() => {
                  // ❗ kiểm tra giỏ hàng trống

                  if (!user) {
                    setPendingCheckout(true);
                    setAuthMode("login");
                    setAuthOpen(true);
                    return;
                  }

                  router.push("/checkout");
                }}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded-lg font-semibold transition
                          ${cart.length === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#003366] text-white hover:bg-[#002244]"
                  }`}
              >
                Đặt Hàng
              </button>
            </div>
          </div>
        </div>

        {/* Voucher */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3 max-w-[760px]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 text-white flex items-center justify-center rounded">
                %
              </div>
              <span className="font-semibold text-[#003366]">
                25ZONE Voucher
              </span>
            </div>
            <button 
              type="button"
              className="text-blue-600 font-extrabold text-sm hover:underline" 
              onClick={() => setVoucherModalOpen(true)}
            >
              Chọn mã giảm giá &gt;
            </button>
          </div>

          {voucherMessage && (
            <p className={`mb-3 text-sm font-semibold ${voucher ? 'text-green-600' : 'text-red-500'}`}>
              {voucherMessage}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[760px]">
            {vouchers.slice(0, 3).map((v: any) => (
              <label
                key={v.Id_voucher}
                className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:border-blue-500 transition bg-white"
              >
                <input
                  className="accent-blue-600 w-5 h-5 cursor-pointer"
                  name="voucher"
                  type="radio"
                  checked={voucher?.code === v.Voucher_Coder}
                  onChange={() => applyVoucher(v.Voucher_Coder)}
                />

                <div className="min-w-0">
                  <p className="font-bold text-blue-600">{v.Voucher_Coder}</p>
                  <p className="text-xs text-gray-500">
                    Giảm {(v.Discount_value ?? 0).toLocaleString()}{v.Discount_type === 'percent' ? '%' : 'đ'}
                    {v.Min_order_value ? ` (Đơn tối thiểu ${(v.Min_order_value).toLocaleString()}đ)` : ''}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Suggested products */}
        <div className="mt-10">
          <h3 className="text-xl font-extrabold uppercase">GỢI Ý SẢN PHẨM</h3>

          {/* Mobile 2 box / Desktop 4 box */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-10">
            {suggestedProducts.map((p) => {
              const thumbnail = (() => {
                if (!p.Thumbnail) return "/img/placeholder.png";
                try {
                  const parsed = JSON.parse(p.Thumbnail);
                  return parsed[0].startsWith("http") ? parsed[0] : `http://localhost:5001${parsed[0]}`;
                } catch {
                  return p.Thumbnail.startsWith("/") ? `http://localhost:5001${p.Thumbnail}` : `http://localhost:5001/${p.Thumbnail}`;
                }
              })();
              return (
              <div
                key={`suggest-${p.Id_product}`}
                className="group bg-white rounded-[26px] sm:rounded-[34px] shadow-2xl overflow-hidden flex flex-col cursor-pointer transition-transform hover:-translate-y-1"
                onClick={() => router.push(`/products/${p.Id_product}`)}
              >
                <div className="relative overflow-hidden rounded-t-[26px] sm:rounded-t-[34px]">
                  <div className="aspect-[4/4]">
                    <img
                      alt={p.Name_product}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={thumbnail}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-t-[26px] sm:rounded-t-[34px] -mt-6 sm:-mt-8 px-4 sm:px-6 pt-5 sm:pt-6 pb-5 sm:pb-7 relative flex-1 flex flex-col">
                  <h3 className="text-[16px] sm:text-[18px] lg:text-[22px] leading-tight font-extrabold text-[#003366] uppercase line-clamp-2 min-h-[2.5em]">
                    {p.Name_product}
                  </h3>
                  <p className="mt-2 text-[#003366] font-semibold text-sm sm:text-base">
                    {p.Category_Name || p.Category || "Sản phẩm"}
                  </p>

                  <div className="h-[4px] sm:h-[5px] w-12 sm:w-14 bg-[#003366] mt-2"></div>

                  <div className="h-px bg-gray-300 mt-4 sm:mt-5"></div>

                  <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold">
                    GIÁ SẢN PHẨM
                  </p>

                  <div className="mt-2 flex items-center mb-4">
                    <span className="text-[#8b1e1e] font-extrabold text-[22px] sm:text-[26px] lg:text-[30px] leading-none tabular-nums">
                      {(p.Sale_Price || p.Price || 0).toLocaleString('vi-VN')}₫
                    </span>
                  </div>

                  <button
                    type="button"
                    className="mt-auto w-full py-3 sm:py-4 rounded-2xl bg-[#003366] text-white font-extrabold tracking-wide hover:bg-[#00264d] active:scale-95 transition"
                    onClick={(e) => {
                       e.stopPropagation();
                       router.push(`/products/${p.Id_product}`);
                    }}
                  >
                    XEM CHI TIẾT
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      {/* Voucher Modal Drawer */}
      {voucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:justify-start">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setVoucherModalOpen(false)}
          ></div>
          
          <div className="relative bg-[#f8f9fb] w-full max-w-sm h-[80vh] lg:h-full lg:rounded-r-3xl rounded-t-3xl lg:rounded-t-none lg:max-w-md flex flex-col shadow-2xl animate-in slide-in-from-bottom lg:slide-in-from-left duration-300">
            <div className="pt-6 pb-4 px-6 bg-white shrink-0 lg:rounded-tr-3xl lg:rounded-tl-none rounded-t-3xl border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-[#003366]">Mã Giảm Giá</h2>
              <button 
                onClick={() => setVoucherModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              <div className="space-y-4">
                {vouchers.map((v: any) => (
                  <label
                    key={`modal-${v.Id_voucher}`}
                    className={`flex items-start gap-4 bg-white border-2 rounded-2xl p-4 cursor-pointer hover:shadow-md transition group
                      ${voucher?.code === v.Voucher_Coder ? 'border-[#003366] shadow-sm' : 'border-transparent shadow-sm hover:border-blue-300'}`}
                  >
                    <div className="mt-1">
                      <input
                        className="accent-blue-600 w-5 h-5 cursor-pointer"
                        name="voucher_modal"
                        type="radio"
                        checked={voucher?.code === v.Voucher_Coder}
                        onChange={() => {
                          applyVoucher(v.Voucher_Coder);
                          setTimeout(() => setVoucherModalOpen(false), 300);
                        }}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-extrabold text-[#003366] text-lg uppercase tracking-tight">{v.Voucher_Coder}</p>
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">
                          Sale
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        Giảm {(v.Discount_value ?? 0).toLocaleString()}{v.Discount_type === 'percent' ? '%' : 'đ'}
                      </p>
                      
                      {v.Min_order_value ? (
                        <p className="text-xs text-gray-400">Đơn tối thiểu {(v.Min_order_value).toLocaleString()}đ</p>
                      ) : null}
                    </div>
                  </label>
                ))}
                
                {vouchers.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <p>Hiện chưa có mã giảm giá nào</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => {
          setAuthOpen(false);
          setPendingCheckout(false);
        }}
        onModeChange={(next) => setAuthMode(next)}
        logoSrc="/img/image%202.png"
        onLoginSuccess={() => {
          setAuthOpen(false);

          if (pendingCheckout) {
            router.push("/checkout");
            setPendingCheckout(false);
          }
        }}
      />
    </main>
  );
}
