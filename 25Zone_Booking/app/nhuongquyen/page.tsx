import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "25Zone - Nhượng Quyền Thương Hiệu",
};

export default function Page() {
  return (
    <>

            <section className="relative w-full h-[360px] sm:h-[480px] lg:h-[680px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0 bg-cover bg-center" data-alt="Modern high-end barber shop interior with sleek lighting and comfortable chairs" style={{ backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuBhmY8GTYCjONyclHoT4bUycGR0PhqRijWU2Hp7FwhQzqmTkgEuCNraRex2S0lVPLX3e1l8WvcsTueSXmQUcZMD8P4qKWY7wsolriA2XGSJPJIEzQDEf6nLWhj7_mf3Hl1dvjJjm2OhEvyi2ghIjT3qCgKptuawdnL41grd3xDzLD02WwvYj672Z2CPgU1d8CIUSV6EqwbDlMmE-nhEfhEWMs6JwF0NnCBGqWM3kIbKptKKN5RrYfCgJJTErDj-PypphYWJiZiXqnM\')' }}>
            </div>
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            <div className="relative z-20 container mx-auto px-4 max-w-[1200px] flex flex-col items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md">
            <span className="material-symbols-outlined text-primary text-sm">verified</span>
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Cơ hội đầu tư vàng 2024</span>
            </div>
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-tight sm:leading-[1.1] max-w-[820px] tracking-tight">
                            KIẾN TẠO <span className="text-primary">TƯƠNG LAI</span> <br/> CÙNG 25ZONE
                        </h1>
            <p className="text-gray-200 text-sm sm:text-base md:text-lg font-medium max-w-[620px] leading-relaxed border-l-0 sm:border-l-4 border-primary pl-0 sm:pl-4">
                            "Chúng tôi không chỉ nhượng quyền một cửa hàng, chúng tôi trao cho bạn chìa khóa của một đế chế kinh
                            doanh bền vững."
                        </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4 w-full sm:w-auto">
            <a className="flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 bg-primary hover:bg-primary-dark text-accent-dark text-sm sm:text-base font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-primary/30 w-full sm:w-auto" href="#contact">
                                TÌM HIỂU CƠ HỘI
                            </a>
            <button className="flex items-center justify-center h-12 sm:h-14 px-6 sm:px-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm sm:text-base font-bold rounded-lg border border-white/30 transition-all w-full sm:w-auto">
                                Xem Brochure
                            </button>
            </div>
            </div>
            </section>
            <section className="py-10 sm:py-12 bg-accent-dark border-b border-gray-800">
            <div className="container mx-auto px-4 max-w-[1200px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y divide-gray-800 sm:divide-y-0 sm:divide-x">
            <div className="flex flex-col items-center text-center gap-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-primary">50+</span>
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Chi Nhánh</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-primary">500K+</span>
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Khách Hàng</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-primary">98%</span>
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Hài Lòng</span>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-primary">12T</span>
            <span className="text-gray-400 text-sm font-medium uppercase tracking-wide">Hoàn Vốn (TB)</span>
            </div>
            </div>
            </div>
            </section>
            <section className="py-12 sm:py-16 lg:py-20 bg-background-light" id="ecosystem">
            <div className="container mx-auto px-4 max-w-[1200px]">
            <div className="flex flex-col md:flex-row gap-8 sm:gap-12 items-start mb-10 sm:mb-16">
            <div className="flex-1">
            <h2 className="text-accent-dark text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-4 tracking-tight">
                                    HƠN CẢ MỘT SALON, <br/>LÀ MỘT <span className="text-primary">HỆ SINH THÁI</span>
            </h2>
            <p className="text-text-muted text-sm sm:text-base lg:text-lg leading-relaxed max-w-[600px]">
                                    Mô hình kinh doanh đa dạng mang lại nguồn thu bền vững và vị thế dẫn đầu thị trường. Tại 25Zone,
                                    chúng tôi tối ưu hóa từng mét vuông diện tích kinh doanh của bạn.
                                </p>
            </div>
            <div className="flex-1 flex justify-center md:justify-end">
            <div className="w-full max-w-[360px] sm:max-w-[400px] aspect-video rounded-2xl bg-gray-200 overflow-hidden relative shadow-soft">
            <img alt="Full view of 25Zone ecosystem showing products and service area" className="w-full h-full object-cover" data-alt="Overview of a bustling barbershop showing multiple service areas" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrjw79w34GYJHnGD2rBnKwmmUtZizZZZhmEqW8FjZ7ulcnbKQl7dYoWRVdCG5p8Orax4NBOTIE08QmrJhaUxgbNVTlL1xN-d2g3q9NHo0dJWFNu-xy_EvfAJNmVZooqTG84zE6l9SwQTFm8b47lCqN5UpfYNXVXYW5G9xWxfIVY_PIml3OniuYATL352xUbtnT-cWU3mGDuTa7fGXajOmlexIgwNHowlUPDaG4lXcAcQCFsfL1585J-4zEfBVVlIT6piH8lWYzvmY"/>
            </div>
            </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="group bg-white p-5 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="size-12 sm:size-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-5 sm:mb-6 group-hover:bg-primary group-hover:text-accent-dark transition-colors">
            <span className="material-symbols-outlined text-2xl sm:text-3xl">content_cut</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-accent-dark mb-2">25Zone Salon</h3>
            <p className="text-text-muted text-sm">Dịch vụ cắt tóc nam đẳng cấp với quy trình 7 bước tiêu chuẩn quốc
                                    tế.</p>
            </div>
            <div className="group bg-white p-5 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="size-12 sm:size-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-5 sm:mb-6 group-hover:bg-primary group-hover:text-accent-dark transition-colors">
            <span className="material-symbols-outlined text-2xl sm:text-3xl">spa</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-accent-dark mb-2">25Zone Spa</h3>
            <p className="text-text-muted text-sm">Chăm sóc da và thư giãn chuyên sâu, gia tăng giá trị đơn hàng
                                    trung bình.</p>
            </div>
            <div className="group bg-white p-5 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="size-12 sm:size-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-5 sm:mb-6 group-hover:bg-primary group-hover:text-accent-dark transition-colors">
            <span className="material-symbols-outlined text-2xl sm:text-3xl">shopping_bag</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-accent-dark mb-2">25Zone Shop</h3>
            <p className="text-text-muted text-sm">Phân phối độc quyền mỹ phẩm nam chính hãng, tạo dòng tiền thụ
                                    động.</p>
            </div>
            <div className="group bg-white p-5 sm:p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="size-12 sm:size-14 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-5 sm:mb-6 group-hover:bg-primary group-hover:text-accent-dark transition-colors">
            <span className="material-symbols-outlined text-2xl sm:text-3xl">school</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-accent-dark mb-2">25Zone Academy</h3>
            <p className="text-text-muted text-sm">Đào tạo nhân sự chất lượng cao, đảm bảo nguồn nhân lực ổn định.
                                </p>
            </div>
            </div>
            </div>
            </section>
            <section className="py-12 sm:py-16 lg:py-20 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-[1200px]">
            <div className="flex flex-col lg:flex-row items-center gap-10 sm:gap-14 lg:gap-16">
            <div className="flex-1 order-2 lg:order-1">
            <div className="inline-block px-3 py-1 rounded-full bg-[#33B1FA]/10 text-[#33B1FA] text-xs font-bold mb-4">
                                    CÔNG NGHỆ 4.0</div>
            <h2 className="text-accent-dark text-2xl sm:text-3xl lg:text-4xl font-black leading-tight mb-5 sm:mb-6">
                                    LUÔN DẪN ĐẦU <br/> <span className="text-primary">XU HƯỚNG CÔNG NGHỆ</span>
            </h2>
            <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0 size-9 sm:size-10 rounded-full bg-[#33B1FA]/10 flex items-center justify-center text-[#33B1FA] mt-1">
            <span className="material-symbols-outlined">smartphone</span>
            </div>
            <div>
            <h4 className="font-bold text-lg text-accent-dark">Booking Web Độc Quyền</h4>
            <p className="text-text-muted">Hệ thống đặt lịch thông minh, giảm thời gian chờ đợi, tối ưu
                                                năng suất thợ.</p>
            </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0 size-9 sm:size-10 rounded-full bg-[#33B1FA]/10 flex items-center justify-center text-[#33B1FA] mt-1">
            <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
            <h4 className="font-bold text-lg text-accent-dark">Marketing Đa Nền Tảng</h4>
            <p className="text-text-muted">Chiến dịch quảng cáo tập trung, xây dựng thương hiệu mạnh mẽ
                                                trên TikTok, Facebook.</p>
            </div>
            </div>
            <div className="flex gap-3 sm:gap-4">
            <div className="shrink-0 size-9 sm:size-10 rounded-full bg-[#33B1FA]/10 flex items-center justify-center text-[#33B1FA] mt-1">
            <span className="material-symbols-outlined">manage_accounts</span>
            </div>
            <div>
            <h4 className="font-bold text-lg text-accent-dark">CRM Quản Lý Khách Hàng</h4>
            <p className="text-text-muted">Phân tích hành vi, tự động chăm sóc và giữ chân khách hàng
                                                thân thiết.</p>
            </div>
            </div>
            </div>
            </div>
            <div className="flex-1 order-1 lg:order-2 flex justify-center relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl transform scale-90"></div>
            <div className="relative w-[210px] sm:w-[260px] lg:w-[300px] h-[420px] sm:h-[520px] lg:h-[600px] bg-accent-dark rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden">
            <div className="absolute top-0 w-full h-8 bg-gray-800 rounded-b-xl z-20"></div>
            <img alt="Mobile App Interface" className="w-full h-full object-cover opacity-80" data-alt="Mobile application screen showing booking calendar and user profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAACBJy-SMfW-RWWZI5pz9OXtMzaWL6ea7U61BmBJtFBs3F7ULCF_j0PJYI0uAOLdZqZJ9Qnn6pPLs8LwzljxQd2M7sEv7kYZTwDgKkpaANM1Uq5qiW4xJedBSNFOBGuOiz-diPUZljV8uVcmBMtGhtUBpo7wjFAFwz7bev0q4i9a-EptgPcnMDp0ZNGYdYtcTqVaCgAjPwm797X99Ldgs3PXy4l6v9x1mW5rQIZ4yzl_0WygM3Vd-2ul-nO6Nxo3S1EaSTkRSJB40"/>
            <div className="absolute bottom-6 sm:bottom-10 left-3 sm:left-4 right-3 sm:right-4 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl border border-white/20">
            <div className="h-2 w-1/2 bg-white/40 rounded mb-2"></div>
            <div className="h-2 w-3/4 bg-white/20 rounded"></div>
            <button className="mt-4 w-full bg-primary py-2 rounded-lg text-xs font-bold text-accent-dark">ĐẶT
                                            LỊCH NGAY</button>
            </div>
            </div>
            </div>
            </div>
            </div>
            </section>
            <section className="py-12 sm:py-16 lg:py-20 bg-background-light" id="roadmap">
            <div className="container mx-auto px-4 max-w-[960px]">
            <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-accent-dark text-3xl md:text-4xl font-black tracking-tight mb-4">LỘ TRÌNH ĐỘC QUYỀN VỚI
                                25ZONE</h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">Chúng tôi đồng hành cùng bạn từng bước, từ ý tưởng
                                đến ngày khai trương và vận hành bền vững.</p>
            </div>
            <div className="relative">
            <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 md:-translate-x-1/2 rounded-full">
            </div>
            <div className="flex flex-col gap-8 sm:gap-10">
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 group">
            <div className="md:w-1/2 md:text-right md:pr-10 order-2 md:order-1 pl-16 md:pl-0">
            <h3 className="text-xl font-bold text-accent-dark">Tư Vấn &amp; Ký Kết</h3>
            <p className="text-text-muted mt-1">Trao đổi về mô hình, phân tích tài chính và ký hợp đồng
                                            nhượng quyền.</p>
            </div>
            <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 size-12 sm:size-14 rounded-full border-4 border-white bg-primary text-accent-dark flex items-center justify-center shadow-lg z-10 order-1">
            <span className="material-symbols-outlined font-bold">handshake</span>
            </div>
            <div className="md:w-1/2 md:pl-10 order-3 hidden md:block text-slate-300 text-8xl font-black opacity-20 select-none">
                                        01</div>
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 group">
            <div className="md:w-1/2 md:text-right md:pr-10 order-2 md:order-1 hidden md:block text-slate-300 text-8xl font-black opacity-20 select-none">
                                        02</div>
            <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 size-12 sm:size-14 rounded-full border-4 border-white bg-white text-accent-dark flex items-center justify-center shadow-md z-10 border-gray-200 order-1">
            <span className="material-symbols-outlined">location_on</span>
            </div>
            <div className="md:w-1/2 md:pl-10 order-3 md:order-3 pl-16 md:pl-10">
            <h3 className="text-xl font-bold text-accent-dark">Khảo Sát Địa Điểm</h3>
            <p className="text-text-muted mt-1">Đánh giá lưu lượng khách, tiềm năng khu vực và chốt mặt bằng
                                            kinh doanh.</p>
            </div>
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 group">
            <div className="md:w-1/2 md:text-right md:pr-10 order-2 md:order-1 pl-16 md:pl-0">
            <h3 className="text-xl font-bold text-accent-dark">Thiết Kế &amp; Thi Công</h3>
            <p className="text-text-muted mt-1">Thiết kế 3D theo nhận diện thương hiệu, thi công trọn gói
                                            đảm bảo tiến độ.</p>
            </div>
            <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 size-12 sm:size-14 rounded-full border-4 border-white bg-white text-accent-dark flex items-center justify-center shadow-md z-10 border-gray-200 order-1">
            <span className="material-symbols-outlined">architecture</span>
            </div>
            <div className="md:w-1/2 md:pl-10 order-3 hidden md:block text-slate-300 text-8xl font-black opacity-20 select-none">
                                        03</div>
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 group">
            <div className="md:w-1/2 md:text-right md:pr-10 order-2 md:order-1 hidden md:block text-slate-300 text-8xl font-black opacity-20 select-none">
                                        04</div>
            <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 size-12 sm:size-14 rounded-full border-4 border-white bg-white text-accent-dark flex items-center justify-center shadow-md z-10 border-gray-200 order-1">
            <span className="material-symbols-outlined">groups</span>
            </div>
            <div className="md:w-1/2 md:pl-10 order-3 md:order-3 pl-16 md:pl-10">
            <h3 className="text-xl font-bold text-accent-dark">Tuyển Dụng &amp; Đào Tạo</h3>
            <p className="text-text-muted mt-1">Hỗ trợ tuyển dụng thợ tay nghề cao, đào tạo quy trình vận
                                            hành từ A-Z.</p>
            </div>
            </div>
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6 group">
            <div className="md:w-1/2 md:text-right md:pr-10 order-2 md:order-1 pl-16 md:pl-0">
            <h3 className="text-xl font-bold text-accent-dark">Khai Trương &amp; Vận Hành</h3>
            <p className="text-text-muted mt-1">Tổ chức sự kiện khai trương hoành tráng, bàn giao quy trình
                                            và hỗ trợ marketing.</p>
            </div>
            <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 size-12 sm:size-14 rounded-full border-4 border-white bg-primary text-accent-dark flex items-center justify-center shadow-lg z-10 order-1">
            <span className="material-symbols-outlined font-bold">rocket_launch</span>
            </div>
            <div className="md:w-1/2 md:pl-10 order-3 hidden md:block text-slate-300 text-8xl font-black opacity-20 select-none">
                                        05</div>
            </div>
            </div>
            </div>
            </div>
            </section>
            <section className="py-12 sm:py-16 lg:py-20 bg-white" id="success">
            <div className="container mx-auto px-4 max-w-[1200px]">
            <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-accent-dark text-3xl md:text-4xl font-black tracking-tight mb-4">HÀNH TRÌNH TỎA SÁNG CỦA
                                ĐỐI TÁC</h2>
            <p className="text-text-muted text-lg">Câu chuyện thành công thực tế từ những người đã tin tưởng và đồng
                                hành cùng 25Zone.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl relative border border-gray-100">
            <span className="absolute top-8 right-8 text-6xl text-gray-200 font-serif leading-none z-0">"</span>
            <div className="relative z-10 flex flex-col h-full">
            <p className="text-accent-dark text-base italic mb-6 flex-grow">"Ban đầu tôi rất lo lắng vì chưa có
                                        kinh nghiệm trong ngành tóc. Nhưng nhờ sự hỗ trợ tận tình từ A-Z của 25Zone, cửa hàng của
                                        tôi đã đạt điểm hòa vốn chỉ sau 6 tháng. Thực sự ấn tượng!"</p>
            <div className="flex items-center gap-4 mt-auto">
            <img alt="Portrait of Mr. Nguyen Van A" className="size-12 rounded-full object-cover ring-2 ring-primary" data-alt="Close up portrait of a confident asian businessman in suit" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJHgGeEMuC7zz0s8IOnet3lo1eDzl-eUVsmKwizXEmdTChof8jeq3iexht7Gg5Fqo44MGxNG-KPpJLWlitnvfRlZnJvxRXY-9jPYPYJrMlpDcO9DU05X3f3uS-lF7O0jvCNHVI3WYwgOw_yRjOPlzkD8Ed66CtyenUwvEEq6d2lv3eADVjzDt8HZetC_fQCORr1I3CCB0wooRIx0BhsgJpWHCuYRc2tHAOd1ra98ljZBIKaQ0hXJARAzsmWF63NAy-KCcMxZ2jlSk"/>
            <div>
            <h4 className="font-bold text-sm text-accent-dark">Anh Nguyễn Văn A</h4>
            <p className="text-xs text-text-muted">Đối tác 25Zone - Hà Nội</p>
            </div>
            </div>
            </div>
            </div>
            <div className="bg-accent-dark p-6 sm:p-8 rounded-2xl relative shadow-xl transform md:-translate-y-4">
            <span className="absolute top-8 right-8 text-6xl text-gray-700 font-serif leading-none z-0">"</span>
            <div className="relative z-10 flex flex-col h-full">
            <div className="flex gap-1 mb-4 text-primary">
            <span className="material-symbols-outlined text-sm">star</span>
            <span className="material-symbols-outlined text-sm">star</span>
            <span className="material-symbols-outlined text-sm">star</span>
            <span className="material-symbols-outlined text-sm">star</span>
            <span className="material-symbols-outlined text-sm">star</span>
            </div>
            <p className="text-white text-base italic mb-6 flex-grow">"Hệ sinh thái của 25Zone là điểm khác biệt
                                        lớn nhất. Doanh thu không chỉ đến từ cắt tóc mà còn từ sản phẩm và dịch vụ spa. Đây là mô
                                        hình đầu tư thông minh."</p>
            <div className="flex items-center gap-4 mt-auto">
            <img alt="Portrait of Ms. Le Thi B" className="size-12 rounded-full object-cover ring-2 ring-primary" data-alt="Portrait of a professional asian businesswoman smiling" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmgFuFuLOe_CiO29hF2baMsIjL0tmq1kZeK1aGDaQub74SG0NtYrjscO-3ql5Yrc5TGiE1N9PYOt4rOWCQ6W0UKi2-jVBCVcTBV--0sp_m_V3AOJ8FG5uEVdqKsPACaUFC7uyTeQqz6HLtIpjJCnk0IfbpeLXp-_JjrCWII6ZE2YQQqm_4vhpwvzkmc8ZALtKQoSx3zEXPkMS3P5QrSaYRy7B62deTvsI132Xrv72LTfFSmfD-N_5rRa4P4uce6Rtu_Ma9JzC8Q8M"/>
            <div>
            <h4 className="font-bold text-sm text-white">Chị Lê Thị B</h4>
            <p className="text-xs text-gray-400">Đối tác 25Zone - TP.HCM</p>
            </div>
            </div>
            </div>
            </div>
            <div className="bg-gray-50 p-6 sm:p-8 rounded-2xl relative border border-gray-100">
            <span className="absolute top-8 right-8 text-6xl text-gray-200 font-serif leading-none z-0">"</span>
            <div className="relative z-10 flex flex-col h-full">
            <p className="text-accent-dark text-base italic mb-6 flex-grow">"Quy trình đào tạo của 25Zone
                                        Academy rất chuyên nghiệp. Nhân viên của tôi khi ra nghề đều có tay nghề vững và thái độ
                                        phục vụ tuyệt vời. Khách hàng rất hài lòng."</p>
            <div className="flex items-center gap-4 mt-auto">
            <img alt="Portrait of Mr. Tran Van C" className="size-12 rounded-full object-cover ring-2 ring-primary" data-alt="Portrait of a young asian male entrepreneur in casual wear" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr3UBflgMAyekunnJ_Db9MpsNjSTiHVt6XaglHdCikOlv5Ifscqcpi6PpZTftF9Mhd4Uv9xQK6rZF6oSL0igb36Nb8dOa0tMisE5uhAQnryEZ8q7mBzyE-RuXJrcpkdzUSGs_D8EDQbLIgI6flAhGGAFIpXhmMDZOj9HynQ7vof9ahBaLx_BEQhT-rlPDcXOVi-WoqRz36zsU6SIM4XkGX6oJ7UMc-jiH5kqcz3TcItqUyLBWybFeK5NhdmanExr09XMN1JOO0hIc"/>
            <div>
            <h4 className="font-bold text-sm text-accent-dark">Anh Trần Văn C</h4>
            <p className="text-xs text-text-muted">Đối tác 25Zone - Đà Nẵng</p>
            </div>
            </div>
            </div>
            </div>
            </div>
            </div>
            </section>
            <section className="py-12 sm:py-16 lg:py-20 bg-accent-dark relative overflow-hidden" id="contact">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4"></div>
            <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-16 items-center">
            <div>
            <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-5 sm:mb-6">
                                    ĐẦU TƯ TẦM CỠ, <br/> <span className="text-primary">TIỀM NĂNG VÔ HẠN</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-md">
                                    Đừng bỏ lỡ cơ hội trở thành đối tác chiến lược của chuỗi tóc nam hàng đầu Việt Nam. Số lượng khu
                                    vực nhượng quyền có hạn.
                                </p>
            <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary">check_circle</span>
            <span>Hỗ trợ marketing 0đ trong 3 tháng đầu</span>
            </div>
            <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary">check_circle</span>
            <span>Cam kết hỗ trợ tuyển dụng trọn đời</span>
            </div>
            <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary">check_circle</span>
            <span>Tư vấn chiến lược kinh doanh 1:1</span>
            </div>
            </div>
            <div className="mt-8 sm:mt-10 p-4 sm:p-5 bg-white/5 rounded-lg border border-white/10 inline-block">
            <p className="text-sm text-gray-400 mb-2">Liên hệ trực tiếp:</p>
            <div className="text-2xl font-bold text-white tracking-wider">0909 123 456</div>
            </div>
            </div>
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-accent-dark mb-6">Đăng Ký Nhận Tư Vấn</h3>
            <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary h-10" placeholder="Nhập họ tên" type="text"/>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary h-10" placeholder="Nhập SĐT" type="tel"/>
            </div>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary h-10" placeholder="example@email.com" type="email"/>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực quan tâm</label>
            <input className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary h-10" placeholder="VD: Hà Nội, TP.HCM..." type="text"/>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vốn đầu tư dự kiến</label>
            <select className="w-full rounded-lg border-gray-300 focus:border-primary focus:ring-primary h-10">
            <option>500 triệu - 1 tỷ</option>
            <option>1 tỷ - 2 tỷ</option>
            <option>Trên 2 tỷ</option>
            </select>
            </div>
            <button className="w-full bg-primary hover:bg-primary-dark text-accent-dark font-bold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-[#33B1FA]/40" type="button">
                                        GỬI THÔNG TIN ĐĂNG KÝ
                                    </button>
            <p className="text-xs text-center text-gray-400 mt-2">Chúng tôi cam kết bảo mật thông tin của bạn.
                                    </p>
            </form>
            </div>
            </div>
            </div>
            </section>

    </>
  );
}

