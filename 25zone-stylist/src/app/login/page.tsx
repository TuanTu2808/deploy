"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginStylist } from "@/lib/auth";
import { useToast, ToastContainer } from "@/components/Toast";

/* ─── Types ─── */
interface FieldError {
  identifier: string;
  password: string;
}

/* ─── Validation Rules ─── */
function validateIdentifier(value: string): string {
  const v = value.trim();
  if (!v) return "Vui lòng nhập email hoặc số điện thoại.";
  // Check if it looks like email
  if (v.includes("@")) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Định dạng email không hợp lệ.";
  } else {
    // Phone: only digits, 9-11 chars
    const digits = v.replace(/[^\d]/g, "");
    if (digits.length < 9 || digits.length > 11) return "Số điện thoại phải từ 9 đến 11 chữ số.";
  }
  return "";
}

function validatePassword(value: string): string {
  if (!value) return "Vui lòng nhập mật khẩu.";
  if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
  return "";
}

export default function Login() {
  const router = useRouter();
  const toast  = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<FieldError>({ identifier: "", password: "" });
  const [touched, setTouched] = useState({ identifier: false, password: false });
  const [serverError, setServerError] = useState("");
  const [shakeForm, setShakeForm] = useState(false);

  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Auto-focus identifier on mount
  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  /* ─── Field-level validation on blur ─── */
  const handleBlur = useCallback(
    (field: keyof FieldError) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({
        ...prev,
        [field]: field === "identifier" ? validateIdentifier(identifier) : validatePassword(password),
      }));
    },
    [identifier, password]
  );

  /* ─── Real-time clear error while typing ─── */
  const handleIdentifierChange = useCallback(
    (val: string) => {
      setIdentifier(val);
      setServerError("");
      if (touched.identifier) {
        setErrors((prev) => ({ ...prev, identifier: validateIdentifier(val) }));
      }
    },
    [touched.identifier]
  );

  const handlePasswordChange = useCallback(
    (val: string) => {
      setPassword(val);
      setServerError("");
      if (touched.password) {
        setErrors((prev) => ({ ...prev, password: validatePassword(val) }));
      }
    },
    [touched.password]
  );

  /* ─── Submit ─── */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      const identifierErr = validateIdentifier(identifier);
      const passwordErr = validatePassword(password);
      setErrors({ identifier: identifierErr, password: passwordErr });
      setTouched({ identifier: true, password: true });

      if (identifierErr || passwordErr) {
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 600);
        // Focus first invalid field
        if (identifierErr) identifierRef.current?.focus();
        else if (passwordErr) passwordRef.current?.focus();
        return;
      }

      setIsLoading(true);
      setServerError("");

      try {
        await loginStylist(identifier.trim(), password, remember);
        toast.success("Đăng nhập thành công!");
        setTimeout(() => router.push("/"), 1200);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
        setServerError(message);
        setShakeForm(true);
        setTimeout(() => setShakeForm(false), 600);
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, password, remember, router]
  );

  /* ─── Helper: field class ─── */
  const fieldClass = (field: keyof FieldError) => {
    const base =
      "w-full h-[48px] sm:h-[50px] pl-4 pr-12 rounded-xl outline-none transition-all duration-300 bg-gray-50 border-2 text-[#1a1a1a] font-medium placeholder:text-gray-400";
    if (touched[field] && errors[field]) {
      return `${base} border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/40`;
    }
    if (touched[field] && !errors[field]) {
      return `${base} border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200`;
    }
    return `${base} border-transparent focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/30`;
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#002244] to-[#001122] md:bg-none md:bg-[#F5F7FA] p-4 sm:p-8 relative overflow-hidden">
      <ToastContainer toasts={toast.toasts} onClose={toast.close} />
      {/* Premium Background Effects (Mobile Only) */}
      <div className="md:hidden absolute top-[-10%] left-[-10%] w-96 h-96 bg-accent-blue/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="md:hidden absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#003366]/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Mobile Branding */}
      <div className="md:hidden flex flex-col items-center justify-center mb-8 z-10 text-center w-full animate-in slide-in-from-top-10 fade-in duration-700">
        <div className="w-[84px] h-[84px] bg-white rounded-3xl flex items-center justify-center shadow-xl mb-4 border-4 border-white/10">
          <img src="/logo.jpg" alt="Logo" className="w-[60px] h-[60px] object-contain mix-blend-multiply" />
        </div>
        <h1 className="text-2xl font-black tracking-widest text-white uppercase drop-shadow-md">25Zone Stylist</h1>
        <p className="text-[13px] text-accent-blue font-semibold mt-1.5 uppercase tracking-wide opacity-90 drop-shadow-sm">
          Hệ thống quản lý chuyên nghiệp
        </p>
      </div>

      {/* Main Card */}
      <div
        className={`w-full max-w-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[500px] z-10 animate-in zoom-in-[0.98] fade-in duration-500 ${shakeForm ? "animate-shake" : ""}`}
      >
        {/* Left Side - Accent Panel (Hidden on Mobile) */}
        <div className="hidden md:flex h-full w-full bg-accent-blue text-white flex-col justify-center items-center px-10 py-10 text-center relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0,transparent_100%)]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl font-bold mb-3 uppercase tracking-wider text-white drop-shadow-md">25Zone Stylist</h2>
            <p className="text-sm opacity-90 max-w-[250px]">
              Hệ thống quản lý lịch phân ca và chăm sóc khách hàng chuyên nghiệp.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="px-6 sm:px-10 py-10 flex flex-col justify-center text-center bg-white">
          {/* Desktop Logo */}
          <div className="hidden md:flex justify-center mb-2">
            <img src="/logo.jpg" alt="25Zone Logo" className="h-16 sm:h-20 object-contain mix-blend-multiply" />
          </div>

          <p className="text-xl font-semibold mt-2 mb-2 text-[#003366] hidden md:block">Đăng nhập</p>
          <p className="text-2xl font-bold mb-2 text-[#003366] md:hidden">Đăng nhập hệ thống</p>

          {/* Server Error Banner */}
          {serverError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-left animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="shrink-0 mt-0.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="12" />
                  <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-red-600 leading-snug">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Identifier Field */}
            <div>
              <div className="relative">
                <input
                  ref={identifierRef}
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  onBlur={() => handleBlur("identifier")}
                  className={fieldClass("identifier")}
                  placeholder="Email / Số điện thoại"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  {touched.identifier && !errors.identifier ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </span>
              </div>
              {touched.identifier && errors.identifier && (
                <p className="mt-1.5 text-xs font-semibold text-red-500 text-left pl-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  {errors.identifier}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={fieldClass("password")}
                  placeholder="Mật khẩu"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent-blue transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-500 text-left pl-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm pt-1">
              <label className="inline-flex items-center gap-2 text-gray-700 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-blue focus:ring-accent-blue/40"
                />
                <span className="font-medium">Ghi nhớ đăng nhập</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                id="login-submit"
                disabled={isLoading}
                className="w-full h-[52px] bg-accent-blue text-white font-extrabold rounded-full uppercase tracking-wider hover:shadow-[0_0_15px_rgba(51,177,250,.55)] hover:bg-sky-500 transition-all duration-300 active:scale-[0.98] flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </div>
          </form>

          {/* Role hint */}
          <p className="mt-6 text-xs text-gray-400 font-medium">
            Chỉ dành cho tài khoản có vai trò <span className="text-accent-blue font-bold">Stylist</span>
          </p>
        </div>
      </div>
    </div>
  );
}
