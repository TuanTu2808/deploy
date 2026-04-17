"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthModal from "@/app/components/auth/AuthModal";

type AuthMode = "login" | "register";

export default function AuthModalPage({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const close = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <AuthModal
      open={true}
      mode={mode}
      logoSrc="/image 2.png"
      onClose={close}
      onModeChange={(next) => {
        setMode(next);
        router.push(`/${next}`);
      }}
    />
  );
}
