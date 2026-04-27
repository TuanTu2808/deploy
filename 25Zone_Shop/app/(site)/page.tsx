"use client";
import CartPopup from "@/app/components/CartPopup";
import { useCart } from "@/app/hooks/useCart";
import { useFavorites } from "@/app/hooks/useFavorites";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchNewsList,
  getNewsExcerpt,
  normalizeNewsImage,
  type ShopNewsItem,
} from "@/lib/news";

const getImageUrl = (thumbnail: any) => {
  if (!thumbnail) return "/img/placeholder.png";
  if (typeof thumbnail === "string") {
    if (thumbnail.startsWith("http")) return thumbnail;
    try {
      const parsed = JSON.parse(thumbnail);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0].startsWith("http")
          ? parsed[0]
          : `http://localhost:5001${parsed[0]}`;
      }
    } catch (e) {
      // not a json array
    }
    return thumbnail.startsWith("/")
      ? `http://localhost:5001${thumbnail}`
      : `http://localhost:5001/${thumbnail}`;
  }
  return `http://localhost:5001${thumbnail}`;
};

function FlashSaleCard({ product }: { product: any }) {
  const discount = Math.round(
    ((product.Price - product.Sale_Price) / product.Price) * 100,
  );

  return (
    <div className="bg-white rounded-3xl p-4 shadow-lg text-center flex flex-col relative h-full w-full">
      <span className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
        -{discount}%
      </span>

      <div className="rounded-2xl overflow-hidden border-4 border-gray-100 mb-4 aspect-square">
        <img
          className="w-full h-full object-cover"
          src={getImageUrl(product.Thumbnail)}
          alt={product.Name_product}
        />
      </div>

      <h3 className="text-sm font-semibold text-[#003366] text-left line-clamp-2">
        {product.Name_product}
      </h3>

      <div className="text-left mt-auto pt-2">
        <p className="line-through text-gray-400 text-sm">
          {product.Price?.toLocaleString()}đ
        </p>
        <p className="text-red-600 font-extrabold text-lg">
          {product.Sale_Price?.toLocaleString()}đ
        </p>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
}: {
  product: any;
  onAddToCart: (product: any) => void;
}) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(isFavorite(product.Id_product));
    const handleUpdate = () => setLiked(isFavorite(product.Id_product));
    window.addEventListener("favorites-updated", handleUpdate);
    return () => window.removeEventListener("favorites-updated", handleUpdate);
  }, [product.Id_product]);

  return (
    <Link href={`/products/${product.Id_product}`} className="w-full h-full">
      <div className="bg-white rounded-[32px] overflow-hidden shadow-2xl max-w-[320px] w-full h-full flex flex-col">
        <div className="relative w-full overflow-hidden aspect-square">
          <img
            alt={product.Name_product}
            className="w-full h-full object-cover"
            src={getImageUrl(product.Thumbnail)}
          />
        </div>

        <div className="bg-white flex-1 flex flex-col rounded-t-[32px] -mt-8 sm:-mt-10 p-4 sm:p-6 relative z-10">
          <h3 className="text-[18px] sm:text-[22px] font-extrabold text-[#003366] uppercase line-clamp-2">
            {product.Name_product}
          </h3>

          <p className="text-sm text-[#003366] mt-1">{product.Category_Name}</p>

          <div className="h-[3px] w-12 bg-[#003366] mt-2 mb-4"></div>

          <div className="mt-auto">
            <p className="text-xs text-gray-400 uppercase">Giá sản phẩm</p>

            <div className="flex items-center mt-2">
              <span className="text-[#8b1e1e] font-extrabold text-3xl">
                {product.Price?.toLocaleString()}đ
              </span>

              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product); }}
                className="ml-auto w-10 h-10 flex-shrink-0 rounded-full bg-[#003366] text-white flex items-center justify-center hover:bg-[#002244] hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <i className={liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
              </button>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart(product);
              }}
              className="w-full mt-4 py-3 rounded-2xl bg-[#003366] text-white font-bold"
            >
              MUA NGAY
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
function HomeNewsCard({ item }: { item: ShopNewsItem }) {
  return (
    <article className="bg-white rounded-3xl overflow-hidden shadow-xl">
      <img
        alt={item.Title}
        className="w-full h-[220px] object-cover"
        src={normalizeNewsImage(item.Thumbnail)}
      />
      <div className="p-6">
        <span className="inline-flex items-center rounded-full bg-[#E6F4FF] px-3 py-1 text-xs font-bold text-[#0B4C8C]">
          {item.Name_category_news || "Tin t\u1ee9c"}
        </span>
        <h3 className="mt-3 text-lg font-extrabold text-[#003366] leading-snug line-clamp-2">
          {item.Title}
        </h3>
        <p className="text-gray-600 text-sm mt-3 leading-relaxed line-clamp-3">
          {getNewsExcerpt(item.Content, 130)}
        </p>
        <Link
          className="inline-flex items-center gap-2 mt-5 font-bold text-[#003366] text-sm hover:text-[#00A2D9]"
          href={`/news/${encodeURIComponent(item.Slug)}`}
        >
          {"\u0110\u1eccC CHI TI\u1ebeT"}
          <i className="fa-solid fa-arrow-right text-xs"></i>
        </Link>
      </div>
    </article>
  );
}

export default function HomePage() {
  const slides = [
    "/img/banner1.jpg",
    "/img/banner%20shop.png",
    "/img/banner3.jpg",
  ];
  const [index, setIndex] = useState(0);
  const [homeNews, setHomeNews] = useState<ShopNewsItem[]>([]);
  const [homeNewsLoading, setHomeNewsLoading] = useState(true);
  const [flashSale, setFlashSale] = useState<any[]>([]);
  const [bestSeller, setBestSeller] = useState<any[]>([]);
  const [sapVuotToc, setSapVuotToc] = useState<any[]>([]);
  const { addToCart, showPopup, popupProduct } = useCart();
  const [dauGoi, setDauGoi] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(7200);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      hours: h.toString().padStart(2, "0"),
      minutes: m.toString().padStart(2, "0"),
      seconds: s.toString().padStart(2, "0"),
    };
  };

  const time = formatTime(timeLeft);

  const scrollSlider = (direction: "left" | "right") => {
    const slider = document.getElementById("flash-sale-slider");
    if (slider) {
      const scrollAmount = slider.clientWidth;
      slider.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const flash = await fetch(
          "http://localhost:5001/api/sanpham/flash-sale?limit=12",
        );

        if (!flash.ok) {
          console.error("API flash-sale lỗi");
          return;
        }

        const flashData = await flash.json();

        setFlashSale(Array.isArray(flashData) ? flashData : []);

        const best = await fetch("http://localhost:5001/api/sanpham");
        const bestData = await best.json();
        setBestSeller(bestData.slice(0, 4));

        const sap = await fetch("http://localhost:5001/api/sanpham/category/1");
        const sapData = await sap.json();
        setSapVuotToc(sapData);

        const dau = await fetch("http://localhost:5001/api/sanpham/category/2");
        const dauData = await dau.json();
        setDauGoi(dauData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 1500);
    return () => clearInterval(t);
  }, [slides.length]);

  useEffect(() => {
    let active = true;

    const loadHomeNews = async () => {
      try {
        setHomeNewsLoading(true);
        const data = await fetchNewsList({ page: 1, limit: 3 });
        if (!active) return;
        setHomeNews(data.items);
      } catch (error) {
        if (!active) return;
        console.error("Không thể tải tin tức trang chủ:", error);
      } finally {
        if (active) setHomeNewsLoading(false);
      }
    };

    loadHomeNews();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      {/* ===== Slider ===== */}
      <section className="py-5">
        <div className="relative w-[90%] max-w-[1920px] mx-auto overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((src) => (
              <img
                key={src}
                src={src}
                className="w-full flex-shrink-0"
                alt="banner"
              />
            ))}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={
                  "w-3 h-3 rounded-full transition " +
                  (i === index ? "bg-[#868282]" : "bg-white/50")
                }
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Flash Sale ===== */}
      <section className="w-full bg-[linear-gradient(90deg,#5FC3F4_0%,#A9DFF7_35%,#EAF8FB_65%)]">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-6 lg:gap-8 px-4 sm:px-6 lg:px-10 relative">
          <div className="w-full lg:w-[40%] relative right-0 lg:right-20">
            <div className="rounded-3xl overflow-hidden relative">
              <img
                className="w-90 w-full object-cover "
                src="/img/Rectangle%2024827.png"
                alt=""
              />

              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-bold italic">
                LIMITED TIME OFFER! <br />
                <span className="text-cyan-300">Jan 27 ONLY!</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[60%]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-4 bg-[#003366] text-white px-8 py-4 rounded-2xl skew-x-[-10deg] w-fit">
                <i className="fa-solid fa-bolt text-yellow-400 text-6xl"></i>
                <h1 className="text-4xl font-extrabold tracking-widest skew-x-[10deg] italic">
                  FLASH SALE
                </h1>
              </div>

              <div className="flex gap-3 text-[#003366] font-bold text-lg">
                <span>00</span> : <span>{time.hours}</span> : <span>{time.minutes}</span> :{" "}
                <span>{time.seconds}</span>
              </div>
            </div>

            <div
              id="flash-sale-slider"
              className="flex gap-4 sm:gap-6 pt-2 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {flashSale.map((p) => (
                <div
                  key={p.Id_product}
                  className="snap-start flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                >
                  <FlashSaleCard product={p} />
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8 sm:mt-10">
              <Link
                href="/promotions"
                className="bg-white flex items-center gap-3 px-8 sm:px-10 py-4 border-2 border-[#003366] rounded-full font-bold text-[#003366] hover:bg-[#003366] hover:text-white transition"
              >
                XEM THÊM SẢN PHẨM
                <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <button
            onClick={() => scrollSlider('left')}
            className="hidden lg:flex absolute left-[38%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white shadow items-center justify-center text-[#003366] hover:bg-gray-100 z-10 transition-colors"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <button
            onClick={() => scrollSlider('right')}
            className="hidden lg:flex absolute -right-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow items-center justify-center text-[#003366] hover:bg-gray-100 z-10 transition-colors"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </section>

      {/* ===== Best Seller ===== */}
      <section className="w-full mt-5 bg-gradient-to-b from-[#5fb7de] via-[#3a78b8] to-[#1f2f6b] py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-white text-3xl font-extrabold uppercase mb-8 sm:mb-12">
            SẢN PHẨM BÁN CHẠY
          </h2>

          {/* ✅ mobile 2 box/row + gap nhỏ lại cho đẹp */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 justify-items-center">
            {bestSeller.map((p) => (
              <ProductCard
                key={p.Id_product}
                product={p}
                onAddToCart={(p) => addToCart(p)}
              />
            ))}
          </div>

          <div className="flex justify-center mt-10 sm:mt-16">
            <Link
              href="/products"
              className="bg-white flex items-center gap-3 px-8 sm:px-10 py-4 border-2 border-[#003366] rounded-full font-bold text-[#003366] hover:bg-[#003366] hover:text-white transition"
            >
              XEM THÊM SẢN PHẨM
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== SÁP VUỐT TÓC ===== */}
      <section className="mt-5 bg-[#eef7fb] py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-[#0b3a66] uppercase">
                SÁP VUỐT TÓC
              </h2>
              <div className="w-16 h-1 bg-[#1aa3a3] mt-3"></div>
            </div>

            {/* ✅ Desktop mới hiện nút ở header */}
            <Link
              href="/products"
              className="bg-white flex items-center gap-3 px-8 sm:px-10 py-4 border-2 border-[#003366] rounded-full font-bold text-[#003366] hover:bg-[#003366] hover:text-white transition"
            >
              XEM THÊM SẢN PHẨM
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 justify-items-center">
            {sapVuotToc.map((p) => (
              <ProductCard
                key={p.Id_product}
                product={p}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          {/* ✅ Mobile: nút nằm dưới grid */}
          <div className="md:hidden flex justify-center mt-10">
            <button className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#0b3a66] text-white font-bold hover:bg-[#092d50] transition w-fit">
              XEM THÊM SẢN PHẨM <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ===== Dầu gội nam ===== */}
      <section className="mt-5 bg-[#eef7fb] py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 sm:mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-[#0b3a66] uppercase">
                Dầu gội nam
              </h2>
              <div className="w-16 h-1 bg-[#1aa3a3] mt-3"></div>
            </div>

            {/* ✅ Desktop mới hiện nút ở header */}
            <Link
              href="/products"
              className="bg-white flex items-center gap-3 px-8 sm:px-10 py-4 border-2 border-[#003366] rounded-full font-bold text-[#003366] hover:bg-[#003366] hover:text-white transition"
            >
              XEM THÊM SẢN PHẨM
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 justify-items-center">
            {dauGoi.map((p) => (
              <ProductCard
                key={p.Id_product}
                product={p}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          {/* ✅ Mobile: nút nằm dưới grid */}
          <div className="md:hidden flex justify-center mt-10">
            <button className="flex items-center gap-3 px-8 py-4 rounded-full bg-[#0b3a66] text-white font-bold hover:bg-[#092d50] transition w-fit">
              XEM THÊM SẢN PHẨM <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>

      {/* ===== Tin tức ===== */}
      <section className="mt-5 bg-[#eef7fb] py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-10 sm:mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-4xl font-extrabold text-[#003366] uppercase">
                {"TIN T\u1ee8C 25ZONE"}
              </h2>
              <div className="w-16 h-1 bg-teal-400 mt-3"></div>
            </div>
            <Link
              href="/news"
              className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-[#003366] px-6 py-3 text-sm font-bold text-[#003366] hover:bg-[#003366] hover:text-white"
            >
              {"XEM T\u1ea4T C\u1ea2"}
              <i className="fa-solid fa-arrow-right text-xs"></i>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-10">
            {homeNewsLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl border border-[#DDE7EF] bg-white shadow-sm"
                >
                  <div className="h-[220px] animate-pulse bg-[#E5EEF5]"></div>
                  <div className="space-y-3 p-6">
                    <div className="h-4 w-24 animate-pulse rounded bg-[#E5EEF5]"></div>
                    <div className="h-5 w-full animate-pulse rounded bg-[#E5EEF5]"></div>
                    <div className="h-5 w-4/5 animate-pulse rounded bg-[#E5EEF5]"></div>
                    <div className="h-4 w-full animate-pulse rounded bg-[#E5EEF5]"></div>
                  </div>
                </div>
              ))}

            {!homeNewsLoading && homeNews.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[#BCD0E0] bg-white p-6 text-center text-[#4B5D70] md:col-span-3">
                {
                  "Ch\u01b0a c\u00f3 b\u00e0i vi\u1ebft n\u00e0o \u0111\u1ec3 hi\u1ec3n th\u1ecb."
                }
              </div>
            )}

            {!homeNewsLoading &&
              homeNews.map((item) => (
                <HomeNewsCard key={item.Id_news} item={item} />
              ))}
          </div>
        </div>
      </section>
      {showPopup && <CartPopup product={popupProduct} />}
    </main>
  );
}
