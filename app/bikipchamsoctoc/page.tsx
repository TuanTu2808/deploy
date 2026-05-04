import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bí kíp chăm sóc tóc",
};

const tips = [
  {
    title: "Giữ nếp tóc sau khi uốn",
    content: "Sấy tóc ở nhiệt độ vừa, dùng sáp nền nước và không vuốt quá mạnh trong 48 giờ đầu.",
  },
  {
    title: "Giảm rụng tóc theo mùa",
    content: "Bổ sung vitamin nhóm B, ngủ đủ giấc và massage da đầu 5 phút mỗi ngày.",
  },
  {
    title: "Tóc nhuộm bền màu hơn",
    content: "Dùng dầu gội không sulfate, hạn chế nước nóng và che tóc khi ra nắng gắt.",
  },
  {
    title: "Da đầu dầu nhưng ngọn tóc khô",
    content: "Gội cách ngày, dưỡng phần ngọn tóc và tẩy da chết da đầu 1 lần/tuần.",
  },
];

export default function BiKipChamSocTocPage() {
  return (
    <main className="bg-[#F8FAFC] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#33B1FA]">Cẩm nang 25Zone</p>
          <h1 className="mt-2 text-2xl font-black text-[#003366] sm:text-3xl">Bí kíp chăm sóc tóc</h1>
          <p className="mt-2 text-sm text-slate-500">
            Những mẹo nhanh giúp tóc khỏe, vào nếp và giữ phong độ mỗi ngày.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tips.map((tip) => (
            <article key={tip.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-base font-extrabold text-[#003366]">{tip.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{tip.content}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
