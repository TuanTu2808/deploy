"use client";

import { useEffect, useRef, useState } from "react";
import type { LookbookItem } from "./lookbookData";

export default function LookbookAi() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<LookbookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingFace, setIsValidatingFace] = useState(false);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnStyle, setTryOnStyle] = useState<LookbookItem | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const hasImage = Boolean(previewUrl);
  const hasSuggestions = suggestions.length > 0;
  const hasError = Boolean(error);

  useEffect(() => {
    if (hasSuggestions) {
      setActiveIndex(0);
    }
  }, [hasSuggestions]);

  useEffect(() => {
    if (!hasSuggestions) return;
    const root = carouselRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const indexAttr = entry.target.getAttribute("data-index");
          if (!indexAttr) return;
          const nextIndex = Number(indexAttr);
          if (!Number.isNaN(nextIndex)) {
            setActiveIndex(nextIndex);
          }
        });
      },
      { root, threshold: 0.6 }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [hasSuggestions, suggestions]);

  useEffect(() => {
    if (!hasSuggestions) return;
    const target = cardRefs.current[activeIndex];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [activeIndex, hasSuggestions]);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
    setSuggestions([]);
    setError(null);
    setTryOnError(null);
    setTryOnResult(null);
    setTryOnStyle(null);
    setSelectedFile(file);

    setIsValidatingFace(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/check-face", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok === false) {
        setError(data.error || "Ảnh không chứa khuôn mặt người hợp lệ.");
      }
    } catch (e) {
      // Bỏ qua nếu có lỗi mạng
    } finally {
      setIsValidatingFace(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSuggestions([]);
    setError(null);
    setTryOnError(null);
    setTryOnResult(null);
    setTryOnStyle(null);
    setSelectedFile(null);
  };

  const handleAnalyze = async () => {
    if (!hasImage || !selectedFile) return;
    setLoading(true);
    setError(null);
    setTryOnError(null);
    setTryOnResult(null);
    setTryOnStyle(null);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/lookbook-ai", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          payload?.error || "Không thể phân tích ảnh. Vui lòng thử lại.";
        setError(message);
        setSuggestions([]);
        return;
      }

      const data = (await response.json()) as {
        suggestions?: LookbookItem[];
      };
      const nextSuggestions = data?.suggestions ?? [];
      if (!nextSuggestions.length) {
        setError("Không tìm thấy gợi ý phù hợp. Vui lòng thử ảnh khác.");
        setSuggestions([]);
        return;
      }
      setSuggestions(nextSuggestions);
    } catch (err) {
      setError("Không thể kết nối đến hệ thống AI. Vui lòng thử lại.");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTryOn = async (item: LookbookItem) => {
    if (!selectedFile) {
      setTryOnError("Vui lòng tải lên ảnh khuôn mặt trước.");
      return;
    }

    setTryOnLoading(true);
    setTryOnResult(null);
    setTryOnStyle(item);
    setTryOnError(null);

    try {
      const formData = new FormData();
      formData.append("person_image", selectedFile);
      formData.append("style_url", item.image);
      formData.append("style_title", item.title);

      const response = await fetch("/api/lookbook-tryon", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error || "Không thể ghép kiểu tóc. Vui lòng thử lại.";
        setTryOnError(message);
        return;
      }

      const data = await response.json();
      if (!data.image) {
        setTryOnError("Không nhận được kết quả.");
        return;
      }

      setTryOnResult(data.image);
    } catch (err) {
      setTryOnError("Không thể kết nối đến hệ thống AI.");
    } finally {
      setTryOnLoading(false);
    }
  };

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-content mx-auto px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              AI GỢI Ý KIỂU TÓC
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Tải ảnh khuôn mặt để nhận 5 gợi ý phù hợp
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl">
              Ảnh chính diện, đủ sáng sẽ cho gợi ý chính xác hơn. Kết quả mang
              tính tham khảo để bạn chọn phong cách phù hợp.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm sm:text-base font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-primary hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasImage || loading || isValidatingFace || !!error}
          >
            {isValidatingFace ? "Đang quét khuôn mặt..." : loading ? "Đang phân tích..." : "Phân tích ảnh"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 sm:p-6">
              {hasImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <img
                      alt="Ảnh khuôn mặt tải lên"
                      className="h-full w-full object-cover"
                      src={previewUrl as string}
                    />
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-700 shadow"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                  <label
                    htmlFor="lookbook-file"
                    className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-800 transition-all hover:border-primary hover:text-primary"
                  >
                    Đổi ảnh khác
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="lookbook-file"
                  className="flex h-full min-h-[320px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-center"
                >
                  <span className="material-symbols-outlined text-4xl text-slate-500">
                    upload
                  </span>
                  <div>
                    <p className="text-sm sm:text-base font-bold text-slate-800">
                      Tải ảnh khuôn mặt của bạn
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      PNG, JPG tối đa 5MB
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white">
                    Chọn ảnh
                  </span>
                </label>
              )}
              <input
                id="lookbook-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="lg:col-span-7">
            {(loading || isValidatingFace) && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm sm:text-base font-semibold text-slate-900">
                  {isValidatingFace ? "Đang quét kiểm tra khuôn mặt..." : "Đang phân tích ảnh..."}
                </p>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Vui lòng chờ trong giây lát.
                </p>
              </div>
            )}

            {!loading && !isValidatingFace && !hasSuggestions && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm sm:text-base font-semibold text-slate-900">
                  Chưa có gợi ý nào
                </p>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Tải ảnh chân dung và bấm &quot;Phân tích ảnh&quot; để xem 5 kiểu tóc phù hợp.
                </p>
                {hasError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm font-bold text-red-600">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!loading && hasSuggestions && (
              <>
                <div className="sm:hidden">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
                      Gợi ý {activeIndex + 1}/{suggestions.length}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Kéo ngang để xem
                    </p>
                  </div>
                  <div
                    ref={carouselRef}
                    className="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scroll-smooth"
                  >
                    {suggestions.map((item, index) => (
                      <div
                        key={item.title}
                        data-index={index}
                        ref={(el) => {
                          cardRefs.current[index] = el;
                        }}
                        className="min-w-[78%] snap-center"
                      >
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl">
                              <img
                                alt={item.title}
                                className="h-full w-full object-cover"
                                src={item.image}
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                                {item.tag}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">
                                {item.title}
                              </h3>
                              <p className="mt-1 text-xs text-gray-500">
                                {item.desc}
                              </p>
                              <button
                                type="button"
                                onClick={() => handleTryOn(item)}
                                className="mt-2 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-700 transition-all hover:border-primary hover:text-primary"
                                disabled={tryOnLoading}
                              >
                                {tryOnLoading &&
                                tryOnStyle?.title === item.title
                                  ? "Đang ghép..."
                                  : "Thử kiểu này"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    {suggestions.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        type="button"
                        onClick={() => handleDotClick(index)}
                        className={`h-2.5 w-2.5 rounded-full transition-all ${
                          activeIndex === index
                            ? "bg-primary"
                            : "bg-slate-200"
                        }`}
                      >
                        <span className="sr-only">
                          Xem gợi ý {index + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="hidden sm:grid sm:grid-cols-2 gap-4">
                  {suggestions.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl">
                        <img
                          alt={item.title}
                          className="h-full w-full object-cover"
                          src={item.image}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          {item.tag}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {item.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-2">
                          {item.desc}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleTryOn(item)}
                          className="mt-3 inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-700 transition-all hover:border-primary hover:text-primary"
                          disabled={tryOnLoading}
                        >
                          {tryOnLoading && tryOnStyle?.title === item.title
                            ? "Đang ghép..."
                            : "Thử kiểu này"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {(tryOnLoading || tryOnResult || tryOnError) && (
              <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Kết quả ghép thử
                    </p>
                    <p className="text-base sm:text-lg font-bold text-slate-900">
                      {tryOnStyle?.title || "Kiểu tóc được chọn"}
                    </p>
                  </div>
                  {tryOnResult && (
                    <a
                      href={tryOnResult}
                      download="25zone-tryon.png"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-700 transition-all hover:border-primary hover:text-primary"
                    >
                      Tải ảnh
                    </a>
                  )}
                </div>

                {tryOnLoading && (
                  <p className="mt-4 text-sm text-slate-500">
                    Đang ghép kiểu tóc... vui lòng chờ.
                  </p>
                )}

                {tryOnError && (
                  <p className="mt-4 text-sm font-semibold text-red-600">
                    {tryOnError}
                  </p>
                )}

                {tryOnResult && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    <img
                      alt="Kết quả ghép kiểu tóc"
                      className="h-full w-full object-cover"
                      src={tryOnResult}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
