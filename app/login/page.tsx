"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function withAuthParam(path: string, mode: "login" | "register") {
  const [base, rawSearch = ""] = path.split("?");
  const params = new URLSearchParams(rawSearch);
  params.set("auth", mode);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const lastPath = localStorage.getItem("last_path") || "/";
    router.replace(withAuthParam(lastPath, "login"));
  }, [router]);

  return null;
}
