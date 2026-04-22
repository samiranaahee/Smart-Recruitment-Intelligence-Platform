"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("smarthr_token");
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, []);

  return (
    <div className="loading-screen">
      Loading SmartHR...
    </div>
  );
}