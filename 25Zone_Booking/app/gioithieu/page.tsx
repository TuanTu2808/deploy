import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Về 25Zone - Điểm Tựa Cho Việc Lớn",
};

export default function Page() {
    return (
        <>
            <div className="overflow-x-hidden">
                <section className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] lg:h-[680px] overflow-hidden flex items-center justify-center">
                    <img alt="Lifestyle Barbering" className="absolute inset-0 h-full w-full object-cover grayscale brightness-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA12sCbIUnOUJKQjZskL_ntQMLjYfsV1R-60ZC_H2e134SZ8_PXAWTwcstLhva2vpLdLfaKUihb667j1t7IINyJadBpZRLrfBhHtTGtNotJTqArchPQD3R6ebLI7dwnpC8Xv2lBOQ6c0HZEjsvtVd_FBw7fM9PKjafAnNifsv9CQMKOGJHKGZlTQJMHKoBboDrLDVzJM5iV918jvq1BgUT7--gL-2k3kovQnoZbC2MvNsJR2aTAp5LaqRIuAwWSqZLSZ65fcRmEbTA" />
                    <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/60 to-navy/90 z-10"></div>
                    <div className="relative z-20 w-full max-w-5xl px-6 animate-fade-in-up text-white">
                        <h1 className="text-center text-[24px] sm:text-4xl md:text-5xl lg:text-[64px] font-medium leading-[1.35] sm:leading-[1.25] lg:leading-[1.35] tracking-[0.01em] sm:tracking-[0.02em] mb-8 sm:mb-10 lg:mb-14">
                            <span className="block sm:inline">
                                AI CŨNG CÓ <span className="font-black text-primary">VIỆC LỚN</span>
                            </span>
                            <span className="block sm:inline">
                                CỦA RIÊNG MÌNH – CHỈ CẦN MỘT{" "}
                                <span className="font-black text-primary">ĐIỂM TỰA</span>
                            </span>
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-base sm:text-lg md:text-xl font-light text-white/90">
                            <p className="text-center md:text-right">
                                Không có lộ trình nào giống nhau
                            </p>
                            <p className="text-center md:text-left">
                                Không có đích đến nào là duy nhất
                            </p>
                        </div>
                    </div>
                </section>
                <section className="py-14 sm:py-16 lg:py-24 bg-white">
                    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                            <div className="lg:col-span-5">
                                <div className="bg-[#fdfdf9] rounded-[24px] sm:rounded-[28px] lg:rounded-[36px] px-5 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-16 shadow-[0_10px_40px_rgba(0,0,0,0.05)] text-center">
                                    <div className="mx-auto w-full max-w-[220px] sm:max-w-[320px] lg:max-w-[420px]">
                                        <img alt="25ZONE Logo" className="w-full h-auto object-contain" src="/logogioithieu.png" />
                                    </div>
                                    <p className="mt-6 text-gray-500 text-sm sm:text-base">
                                        Logo mạnh mẽ và hiện đại
                                    </p>
                                </div>
                            </div>
                            <div className="lg:col-span-7">
                                <div className="text-center lg:text-left">
                                    <p className="text-[#33B1FA] font-extrabold tracking-[0.08em] text-sm sm:text-base lg:text-lg">
                                        REBRANDING
                                    </p>
                                    <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-navy leading-tight break-words">
                                        Ý NGHĨA LOGO VÀ THƯƠNG HIỆU
                                    </h2>
                                    <div className="mt-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
                                        <div className="mx-auto lg:mx-0 w-16 h-1.5 bg-[#33B1FA]"></div>
                                        <p className="break-words text-base sm:text-lg italic text-navy font-semibold leading-relaxed">
                                            “25Zone đại diện cho độ tuổi rực rỡ nhất của người đàn ông –
                                            độ tuổi của khát vọng, ý chí và sự thành công bước đầu.”
                                        </p>
                                    </div>
                                    <div className="mt-6 space-y-4 text-base sm:text-lg text-gray-600 leading-relaxed">
                                        <p className="break-words">
                                            Bộ nhận diện mới với sắc xanh
                                            <span className="text-[#33B1FA] font-bold">Blue Royal (Cyan)</span>
                                            không chỉ đại diện cho sự tươi mới, năng lượng mà còn là biểu tượng
                                            của sự đổi mới sáng tạo, phá vỡ những quan niệm cũ kỹ về nghề tóc.
                                        </p>
                                        <p className="break-words">
                                            25Zone mang trong mình tham vọng hiện đại hóa ngành tóc nam tại Việt Nam,
                                            đưa trải nghiệm cắt tóc trở thành một phần của phong cách sống thành đạt.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-navy py-20 lg:py-28 relative overflow-hidden">

                    <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-12"></div>
                    <div className="absolute bottom-0 left-0 w-1/4 h-full bg-primary/10 skew-x-12 -translate-x-12"></div>
                    <div className="mx-auto max-w-container px-4 lg:px-6 relative z-10 text-white">

                        <div className="text-center mb-12 sm:mb-16 lg:mb-20 max-w-4xl mx-auto">
                            <h2 className="text-[30px] sm:text-[34px] lg:text-[38px] xl:text-[42px] 2xl:text-[46px] font-black uppercase leading-tight tracking-wide mb-7">
                                WILLS – VĂN HOÁ TINH THẦN CỦA
                                <span className="text-primary">
                                    NHỮNG NGƯỜI DÁM TIẾN LÊN
                                </span>
                            </h2>
                            <p className="text-white/80 text-base sm:text-lg xl:text-xl leading-relaxed">
                                Chúng tôi phục vụ những người đàn ông không ngừng hoàn thiện bản thân mỗi ngày.
                                Văn hóa WILLS là kim chỉ nam cho mọi hành động tại 25Zone.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">

                            <div className="bg-navy-light/50 backdrop-blur-sm border border-white/10 p-5 sm:p-6 lg:p-7 rounded-2xl hover:bg-navy-light transition-all duration-300 group">
            <div className="text-5xl lg:text-6xl font-black text-primary mb-3 opacity-50 group-hover:opacity-100 transition-opacity text-center">
                                    W
                                </div>
                                <h3 className="text-lg lg:text-xl font-bold mb-2">Warrior</h3>
                                <p className="text-sm lg:text-base text-white/70 leading-relaxed">
                                    Tinh thần chiến binh, không ngại khó khăn, luôn tiến về phía trước.
                                </p>
                            </div>

                            <div className="bg-navy-light/50 backdrop-blur-sm border border-white/10 p-5 sm:p-6 lg:p-7 rounded-2xl hover:bg-navy-light transition-all duration-300 group">
            <div className="text-5xl lg:text-6xl font-black text-primary mb-3 opacity-50 group-hover:opacity-100 transition-opacity text-center">
                                    I
                                </div>
                                <h3 className="text-lg lg:text-xl font-bold mb-2">Intervention</h3>
                                <p className="text-sm lg:text-base text-white/70 leading-relaxed">
                                    Sự can thiệp kịp thời, chủ động giải quyết vấn đề ngay khi phát sinh.
                                </p>
                            </div>

                            <div className="bg-navy-light/50 backdrop-blur-sm border border-white/10 p-5 sm:p-6 lg:p-7 rounded-2xl hover:bg-navy-light transition-all duration-300 group">
            <div className="text-5xl lg:text-6xl font-black text-primary mb-3 opacity-50 group-hover:opacity-100 transition-opacity text-center">
                                    L
                                </div>
                                <h3 className="text-lg lg:text-xl font-bold mb-2">Learning</h3>
                                <p className="text-sm lg:text-base text-white/70 leading-relaxed">
                                    Học tập không ngừng nghỉ, đổi mới tư duy để bắt kịp xu hướng.
                                </p>
                            </div>

                            <div className="bg-navy-light/50 backdrop-blur-sm border border-white/10 p-5 sm:p-6 lg:p-7 rounded-2xl hover:bg-navy-light transition-all duration-300 group">
            <div className="text-5xl lg:text-6xl font-black text-primary mb-3 opacity-50 group-hover:opacity-100 transition-opacity text-center">
                                    L
                                </div>
                                <h3 className="text-lg lg:text-xl font-bold mb-2">Leadership</h3>
                                <p className="text-sm lg:text-base text-white/70 leading-relaxed">
                                    Dẫn đầu trong phong cách, làm chủ cuộc sống và công việc của chính mình.
                                </p>
                            </div>

                            <div className="bg-navy-light/50 backdrop-blur-sm border border-white/10 p-5 sm:p-6 lg:p-7 rounded-2xl hover:bg-navy-light transition-all duration-300 group">
            <div className="text-5xl lg:text-6xl font-black text-primary mb-3 opacity-50 group-hover:opacity-100 transition-opacity text-center">
                                    S
                                </div>
                                <h3 className="text-lg lg:text-xl font-bold mb-2">Sincerity</h3>
                                <p className="text-sm lg:text-base text-white/70 leading-relaxed">
                                    Sự chân thành trong phục vụ, trung thực với khách hàng và đồng nghiệp.
                                </p>
                            </div>
                        </div>

                        <div className="text-center mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-white/10">
                            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-medium italic">
                                "Trở thành phiên bản tốt nhất của chính mình – Bắt đầu từ hôm nay."
                            </p>
                        </div>
                    </div>
                </section>
                <section className="bg-background-alt py-16 sm:py-20 lg:py-24 flex justify-center items-center w-full">
                    <div className="w-full max-w-[1920px] px-4 md:px-8 mx-auto">
                        <div className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-lg border border-gray-100 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-20">
                            <div className="flex-shrink-0">
                                <div className="relative w-[200px] h-[200px] sm:w-[320px] sm:h-[320px] lg:w-[448px] lg:h-[448px]">
                                    <div className="absolute inset-0 bg-blue-50 rounded-full"></div>
                                    <img alt="25Zone" className="absolute inset-[15px] w-[calc(100%-30px)] h-[calc(100%-30px)] object-cover rounded-full border-8 border-white shadow-xl" src="https://phongbvb.com/upload/web2-undercut.jpg" />
                                </div>
                            </div>
                            <div className="flex-initial min-w-0 lg:max-w-[800px]">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[52px] font-black text-[#003366] uppercase mb-6 leading-tight xl:whitespace-nowrap">
                                    25ZONE – ĐIỂM TỰA CHO VIỆC LỚN
                                </h2>
                                <div className="mb-8">
                                    <span className="text-5xl text-blue-300 font-serif leading-none block mb-[-10px]">“</span>
                                    <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-serif italic text-gray-700 pl-4 border-l-4 border-blue-400 leading-relaxed">
                                        “Hãy cho tôi một điểm tựa, tôi sẽ nâng cả thế giới.”
                                        <span className="text-sm not-italic font-sans text-gray-400 mt-2 block">
                                            – Archimedes
                                        </span>
                                    </h3>
                                </div>
                                <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-[650px]">
                                    Mỗi người đàn ông đều ấp ủ những dự định lớn lao. Nhưng để vươn xa,
                                    ai cũng cần một điểm tựa vững chắc về tinh thần và ngoại hình.
                                    <br /><br />
                                    25Zone định vị mình là điểm tựa đó. Chúng tôi không chỉ cắt tóc,
                                    chúng tôi giúp bạn kiến tạo sự tự tin, định hình phong cách đĩnh đạc
                                    để sẵn sàng cho những cuộc gặp gỡ quan trọng, những quyết định mang
                                    tính bước ngoặt.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-white py-16 sm:py-20 lg:py-24 overflow-hidden">
                    <div className="mx-auto max-w-container px-4 lg:px-6">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                            <div className="w-full lg:w-6/12">
                                <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-black text-navy uppercase leading-tight mb-6 sm:mb-8">
                                    <span className="block mb-2 sm:mb-3">SỨ MỆNH – TÔN VINH</span>
                                    <span className="text-[#33A9F4] block lg:block mb-2 sm:mb-3">ĐÔI BÀN TAY TÀI HOA</span>
                                    <span className="block lg:inline-block">NGƯỜI THỢ VIỆT</span>
                                </h2>
                                <div className="w-20 h-[5px] bg-navy mb-8"></div>
                                <p className="text-gray-800 mb-8 text-base sm:text-lg leading-relaxed">
                                    Nghề tóc tại Việt Nam không chỉ là nghề mưu sinh, đó là nghệ thuật.
                                    25Zone cam kết nâng tầm vị thế của người thợ Việt trên bản đồ quốc tế.
                                </p>
                                <ul className="space-y-6">
                                    <li className="flex items-start gap-4">
                                        <span className="material-symbols-outlined text-[#33A9F4] font-bold text-3xl">check_circle</span>
                                        <span className="text-navy font-bold leading-snug text-base sm:text-lg">
                                            Đào tạo chuẩn mực quốc tế, kết hợp sự khéo léo đặc trưng của người Việt.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="material-symbols-outlined text-[#33A9F4] font-bold text-3xl">check_circle</span>
                                        <span className="text-navy font-bold leading-snug text-base sm:text-lg">
                                            Môi trường làm việc chuyên nghiệp, tôn trọng sự sáng tạo cá nhân.
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="material-symbols-outlined text-[#33A9F4] font-bold text-3xl">check_circle</span>
                                        <span className="text-navy font-bold leading-snug text-base sm:text-lg">
                                            Liên tục cập nhật xu hướng và công nghệ mới nhất thế giới.
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <div className="w-full lg:w-6/12 relative">
                                <div className="absolute top-[-20px] left-[10%] w-32 h-32 bg-[#DDF2FF] -z-10 rounded-tl-[40px]"></div>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-full sm:w-3/5 relative">
                                        <img alt="Thư giãn dưỡng sinh" className="w-full h-auto rounded-xl rounded-bl-[50px] shadow-lg object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDC16jcRaNLp2cop4C0QNdvNhrieD92I78AKySDHcmFyhKkQPwMtP-jCDq4qfInJIxeRr3NQwzvDZtJ-5A8b9eZ2an96JcwuvVWj92hXcvSOo9bV6ZIOJLObRWK0m0N504rEI5y_juM-J5t1F9j3_2B1eSE0iuSA4AqwUoPMLr3L1_qNZq_z6Wa3QKKjNV-0CzXOhwOOpgFPAUiRRrk5oJyLNqciLItrf4cvxeeLIm-swqxY5Y39jLTSjJ6y-4xPpXXkRJg6rIxMVQ" />
                                        <div className="absolute inset-0 sm:hidden bg-gradient-to-t from-black/70 via-black/10 to-transparent rounded-xl rounded-bl-[50px]"></div>
                                        <span className="absolute bottom-4 left-4 sm:hidden text-white font-black uppercase tracking-wide text-base drop-shadow-lg">
                                            Thư giãn dưỡng sinh
                                        </span>
                                    </div>
                                    <div className="w-full sm:w-2/5 sm:-translate-y-12 relative">
                                        <img alt="Thợ tóc đang làm việc" className="w-full h-auto aspect-[3/4] rounded-xl shadow-xl object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZua3CmCWtWHzOdOMGDr_JCm3-9BLBA-CQBLan7wfpBp5WQrAY3O-WHNLaAXPEtgwxq9XF-Ve6SJsnh2X94udKzo3pwXA5SMY1_68LeosHcZ6JnQ58Em1eB7aKovGR71QawNccnhtnYRfvmtYOjwvsqGxLiEDK6SMEpw4DRgiPGcTBIUok8BUwbtWZ-H88Lyww2Z3ISFHtbuhwZG3QfVHwApq3YCvO2OW2e2r8_grRcCiFaYWipgJz15Td2Ayjnn3JUcaCl9ZPqD4" />
                                        <div className="absolute inset-0 sm:hidden bg-gradient-to-t from-black/70 via-black/10 to-transparent rounded-xl"></div>
                                        <span className="absolute bottom-4 left-4 sm:hidden text-white font-black uppercase tracking-wide text-base drop-shadow-lg">
                                            Thợ tóc đang làm việc
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="relative min-h-[420px] sm:min-h-[560px] lg:min-h-[600px] w-full bg-[#002B49] overflow-hidden flex items-center py-14 sm:py-16 lg:py-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-transparent z-10"></div>
                    <div className="container mx-auto max-w-[1700px] px-6 lg:px-16 relative z-20">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-7 xl:col-span-6 text-white">
                                <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-[56px] font-black uppercase mb-6 tracking-tight">
                                    <span className="block mb-4 md:mb-6">
                                        KIỂU TÓC ĐẸP KHÔNG
                                    </span>
                                    <span className="block mb-8 md:mb-8">
                                        PHẢI ĐÍCH ĐẾN
                                    </span>
                                    <span className="text-[#33A9F4] block">
                                        – MÀ LÀ ĐIỂM KHỞI ĐẦU
                                    </span>
                                </h2>
                                <p className="text-base sm:text-lg text-gray-300 mb-8 sm:mb-10 max-w-xl font-light leading-relaxed">
                                    Một kiểu tóc đẹp là khởi đầu cho sự tự tin. Sự thoải mái khi bước ra từ Salon là khởi đầu cho
                                    những
                                    ý tưởng mới. Tại 25Zone, với mạng lưới Salon rộng khắp, công nghệ đặt lịch thông minh và đội ngũ
                                    tận
                                    tâm, chúng
                                    tôi giúp bạn duy trì phong độ đỉnh cao mọi lúc, mọi nơi.
                                </p>
                                <div className="flex justify-center sm:justify-start">
                                    <button className="bg-[#33A9F4] text-white text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold uppercase tracking-wider hover:bg-white hover:text-[#002B49] transition-all duration-300 shadow-xl hover:shadow-[#33A9F4]/40 w-full sm:w-auto">
                                        Tìm Salon Gần Nhất
                                    </button>
                                </div>
                            </div>
                            <div className="lg:col-span-5 xl:col-span-6 relative items-end justify-center lg:justify-end gap-4 h-full hidden lg:flex">
                                <div className="relative w-full max-w-[900px] h-auto transform hover:-translate-y-2 transition-transform duration-500">
                                    <img alt="Nam giới tóc ngắn" className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" src="/image 11.png" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
