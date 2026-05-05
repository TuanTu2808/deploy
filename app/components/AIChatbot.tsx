"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { writeStoredBookingFlowSelection } from "@/lib/booking-flow-selection";
import { useAuth } from "@/app/components/auth/AuthProvider";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  bookingContext?: {
    salonId?: number | null;
    serviceIds?: number[];
    comboIds?: number[];
  } | null;
};

export default function AIChatbot() {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Xin chào! 👋 Mình là trợ lý AI của 25Zone. Mình có thể tư vấn các kiểu tóc, dịch vụ, combo hay chi nhánh cho bạn. Bạn cần mình giúp gì nào?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Hiện tooltip mời gọi sau 2 giây
    const timer = setTimeout(() => setShowTooltip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowTooltip(false); // Ẩn vĩnh viễn nếu đã mở
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
            .filter((msg) => msg.id !== "welcome")
            .map(({ role, content }) => ({
              role,
              content,
            })),
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          bookingContext: data.bookingContext,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Lỗi: " + (error?.message || "Hệ thống AI hiện đang bận."),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Tooltip mời gọi gây chú ý */}
      {!isOpen && showTooltip && (
        <div 
          className="fixed bottom-[80px] right-3 sm:bottom-[90px] sm:right-4 z-[89] animate-bounce cursor-pointer transition-opacity duration-500"
          onClick={() => setIsOpen(true)}
        >
          <div className="relative rounded-2xl bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-[13px] sm:text-sm font-bold text-[#003366] shadow-xl border border-slate-100 flex items-center gap-1.5 sm:gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Trợ lý AI tư vấn tóc đây! 🤖
            {/* Tam giác trỏ xuống nút */}
            <div className="absolute -bottom-2 right-5 h-4 w-4 rotate-45 bg-white border-b border-r border-slate-100"></div>
          </div>
        </div>
      )}

      {/* Nút bật/tắt Chatbot */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl transition-transform hover:scale-110 active:scale-95 ${
          isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
        style={{ transitionDuration: "300ms" }}
      >
        <span className="material-symbols-outlined text-2xl sm:text-3xl">content_cut</span>
      </button>

      {/* Khung Chatbot */}
      <div
        className={`fixed z-[100] flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ease-in-out
          bottom-0 right-0 h-[100dvh] w-full rounded-none
          sm:bottom-6 sm:right-6 sm:h-[500px] sm:max-h-[85vh] sm:w-[350px] sm:rounded-2xl
          ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-10 scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#003366] to-[#004080] p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h3 className="font-bold">25Zone Assistant</h3>
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                Luôn sẵn sàng
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-[#003366] text-white rounded-br-sm"
                    : "bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.content}
                
                {msg.role === "assistant" && msg.content.includes("/chonsalon") && (
                   <button 
                     onClick={() => {
                        setIsOpen(false);
                        if (msg.bookingContext) {
                          writeStoredBookingFlowSelection({
                            salonId: msg.bookingContext.salonId,
                            serviceIds: msg.bookingContext.serviceIds || [],
                            comboIds: msg.bookingContext.comboIds || [],
                          });
                        }
                        router.push("/chonsalon?step=1");
                     }}
                     className="mt-3 block w-full bg-yellow-400 hover:bg-yellow-500 text-[#003366] font-bold text-center py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-colors"
                   >
                     Đặt lịch ngay
                   </button>
                )}

                {msg.role === "assistant" && msg.content.includes("/yeucaudangnhap") && (
                   <button 
                     onClick={() => {
                        setIsOpen(false);
                        const currentParams = new URLSearchParams(window.location.search);
                        currentParams.set("auth", "login");
                        router.push(`${window.location.pathname}?${currentParams.toString()}`);
                     }}
                     className="mt-3 block w-full bg-[#003366] hover:bg-[#002244] text-white font-bold text-center py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-colors"
                   >
                     Đăng nhập ngay
                   </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm shadow-sm border border-slate-100 rounded-bl-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 bg-white p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Nhập câu hỏi của bạn..."
              className="max-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#003366] text-white hover:bg-[#002244] disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] ml-1">send</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
