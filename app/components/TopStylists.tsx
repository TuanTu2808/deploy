
"use client";

import React, { useEffect, useState } from "react";

export default function TopStylists() {
  const [stylists, setStylists] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001"}/api/thocat`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStylists(data.slice(0, 4));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  if (stylists.length === 0) {
    return (
      <div className="flex justify-center items-center py-10">
        <p className="text-white text-lg">Đang tải danh sách Stylist...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
      {stylists.map((stylist, index) => {
        const medals = ["bg-yellow-400 text-navy border-white", "bg-gray-300 text-navy border-white", "bg-orange-700 text-white border-white/50", "bg-purple-600 text-white border-white/50"];
        const medalClass = medals[index % 4];

        return (
          <div key={stylist.Id_user} className="group relative rounded-3xl bg-gray-900 border-2 border-white/5 overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-neon transform hover:-translate-y-3">
            <div className="aspect-[3/4] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-transparent to-black z-10">
              </div>
              <img alt={stylist.Name_user} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={stylist.Image || "https://i.pinimg.com/736x/d6/7c/22/d67c2241293718ceb635f0791ecd78db.jpg"} />
              <div className={`absolute top-4 right-4 z-20 font-black px-4 py-2 rounded-lg shadow-lg text-sm border-2 ${medalClass}`}>
                TOP {index + 1}</div>
            </div>
            <div className="p-6 relative z-20 -mt-12 sm:-mt-16 md:-mt-20 text-center">
              <h3 className="text-3xl font-black uppercase text-white mb-1 drop-shadow-lg">{stylist.Name_user}</h3>
              <p className="text-primary text-sm font-bold mb-6 tracking-wide">{stylist.Name_store}</p>
              <div className="flex items-center justify-center gap-1 w-full bg-white/5 py-4 rounded-xl border border-white/10 backdrop-blur-sm">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-2xl ${i < Math.round(Number(stylist.rating) || 0) ? 'text-yellow-400' : 'text-gray-600'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                ))}
                <span className="text-white font-bold ml-2 text-lg">{Number(stylist.rating || 0).toFixed(1)}/5.0</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}