"use client";

import React from "react";

type Props = {
  userId: number;
  initialDate?: string;
  initialTime?: string;
  onChange?: (value: { date: string; time: string }) => void;
};

export default function TimeSlotPicker({
  userId,
  initialDate = new Date().toISOString().slice(0, 10),
  initialTime = "",
  onChange,
}: Props) {
  const [date, setDate] = React.useState(initialDate);
  const [selected, setSelected] = React.useState(initialTime);
  const [availableTimes, setAvailableTimes] = React.useState<
  { time: string; status: number }[]
>([]);
  const [loading, setLoading] = React.useState(false);
const DEFAULT_TIMES = [
  "09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30",
  "14:00","14:30","15:00","15:30","16:00","16:30",
  "17:00","17:30","18:00","18:30","19:00","19:30",
  "20:00","20:30","21:00",
];
const isPastTime = (time: string) => {
  const now = new Date();

  const todayStr = now.toISOString().slice(0, 10);
  if (date !== todayStr) return false;

  const [h, m] = time.split(":").map(Number);

  const compare = new Date();
  compare.setHours(h, m, 0, 0);

  return compare <= now;
};
  // ===== FETCH REALTIME THEO USER + DATE =====
React.useEffect(() => {
  if (!date) return;

  // 👉 default stylist → dùng giờ giả
if (userId === -1) {
  setAvailableTimes(
    DEFAULT_TIMES.map((t) => ({ time: t, status: 1 }))
  );
  return;
}

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `https://api.25zone.io.vn/api/lichlamviec?userId=${userId}&date=${date}`
      );

      const data = await res.json();

const times =
  data?.hours?.map((h: any) => ({
    time: h.Hours?.slice(0, 5).trim(),
    status: h.Status,
  })) ?? [];

setAvailableTimes(times);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [userId, date]);

React.useEffect(() => {
  if (initialDate) {
    setDate(initialDate);
  }
}, [initialDate]);
  // auto chọn giờ đầu tiên nếu selected không hợp lệ
React.useEffect(() => {
  if (!availableTimes.length) return;

  const valid = availableTimes.find(
    (t) => t.status === 1 && !isPastTime(t.time)
  );

  if (!valid) return;

  if (!availableTimes.find((t) => t.time === selected)) {
    setSelected(valid.time);
  }
}, [availableTimes, selected]);
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });

  // callback ra ngoài
  React.useEffect(() => {
    if (!date || !selected) return;
    onChangeRef.current?.({ date, time: selected });
  }, [date, selected]);

  return (
    <div className="w-full">

      {/* DATE */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-xl bg-white shadow-sm">
          <input
            type="date"
            min={new Date().toISOString().slice(0, 10)} // 👈 chặn ngày cũ
            className="text-[13px] sm:text-base text-slate-700 font-semibold outline-none bg-transparent border-0 focus:outline-none focus:ring-0"
            value={date}
            onChange={(e) => {
  setDate(e.target.value);
  onChange?.({ date: e.target.value, time: selected }); // ✅ thêm dòng này
}}
          />
        </div>
        <span className="text-[11px] sm:text-sm text-slate-500">
          Chọn ngày phù hợp với lịch của bạn
        </span>
      </div>
      {/* LOADING */}
      {loading && (
        <div className="text-sm text-slate-500 mb-3">
          Đang tải lịch...
        </div>
      )}

{/* TIME GRID */}
{availableTimes.filter(t => t.status === 1).length === 0 && !loading ? (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-[12px] text-slate-500">
    Không còn khung giờ trống.
  </div>
) : (
  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
    {availableTimes.map(({ time, status }) => {
      const isSelected = selected === time;
      const disabled = status === 0 || isPastTime(time);

      return (
        <button
          key={time}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setSelected(time)}
          className={
            isSelected
              ? "px-3 py-2 bg-blue-600 text-white rounded-xl font-semibold text-[12px] sm:text-sm shadow-sm"
              : "px-3 py-2 border border-gray-200 text-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 font-semibold bg-white text-[12px] sm:text-sm"
          }
          style={{
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {time}
        </button>
      );
    })}
  </div>
)}
      <div className="mt-4 text-[11px] sm:text-sm text-slate-500">
        Đã chọn:{" "}
        <span className="font-semibold text-slate-800">{selected}</span> ·{" "}
        <span className="font-semibold text-slate-800">{date.split('-').reverse().join('/')}</span>
      </div>
    </div>
  );
}
