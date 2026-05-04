"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AuthModal from "@/app/components/auth/AuthModal";
import { LoginSuccessPopup } from "@/app/components/auth/LoginSuccessPopup";

type AuthMode = "login" | "register";

function getAuthMode(value: string | null): AuthMode | null {
  if (value === "login") return "login";
  if (value === "register") return "register";
  return null;
}

export default function AuthModalGate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const authParam = searchParams.get("auth");
  const desiredMode = getAuthMode(authParam);

  const [mode, setMode] = useState<AuthMode>("login");
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [showPasswordResetSuccess, setShowPasswordResetSuccess] = useState(false);
  const open = desiredMode !== null;

  useEffect(() => {
    if (desiredMode) setMode(desiredMode);
  }, [desiredMode]);

  const baseSearch = searchParams.toString();

  const updateUrl = (nextMode: AuthMode | null) => {
    const params = new URLSearchParams(baseSearch);
    if (nextMode) params.set("auth", nextMode);
    else params.delete("auth");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <>
      <AuthModal
        open={open}
        mode={mode}
        logoSrc="/image 2.png"
        onClose={() => updateUrl(null)}
        onModeChange={(next) => {
          setMode(next);
          updateUrl(next);
        }}
        onLoginSuccess={() => setShowLoginSuccess(true)}
        onPasswordResetSuccess={() => setShowPasswordResetSuccess(true)}
      />
      {showLoginSuccess && <LoginSuccessPopup returnTo="RELOAD" />}
      {showPasswordResetSuccess && <LoginSuccessPopup returnTo="RELOAD" message="Đổi mật khẩu thành công" />}
    </>
  );
}
