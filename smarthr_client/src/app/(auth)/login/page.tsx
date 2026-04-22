"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, LogIn, AlertCircle, Zap } from "lucide-react";
import { loginCompany } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginCompany(form.email, form.password);
      localStorage.setItem("smarthr_token", data.token);
      localStorage.setItem("smarthr_company", JSON.stringify(data.company));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: "20px",
    }}>
      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "24px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(59,130,246,0.4)",
          }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#fff", margin: "0 0 8px" }}>
            Smart<span style={{ color: "#3b82f6" }}>HR</span>
          </h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Sign in to your company account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5", fontSize: "13px",
            padding: "12px 16px", borderRadius: "12px", marginBottom: "20px",
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.7)" }}>
              Email address
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", padding: "12px 16px",
              transition: "border 0.2s",
            }}>
              <Mail size={16} color="rgba(255,255,255,0.4)" />
              <input
                name="email"
                type="email"
                placeholder="hr@company.com"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", fontSize: "14px",
                  color: "#fff",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "500", color: "rgba(255,255,255,0.7)" }}>
              Password
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px", padding: "12px 16px",
            }}>
              <Lock size={16} color="rgba(255,255,255,0.4)" />
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                style={{
                  flex: 1, background: "transparent", border: "none",
                  outline: "none", fontSize: "14px", color: "#fff",
                }}
              />
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              background: loading ? "rgba(59,130,246,0.5)" : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              color: "#fff", border: "none", borderRadius: "12px",
              padding: "14px", fontSize: "15px", fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "8px",
              boxShadow: loading ? "none" : "0 8px 24px rgba(59,130,246,0.4)",
              transition: "all 0.2s",
            }}
          >
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Register link */}
        <p style={{ textAlign: "center", fontSize: "14px", color: "rgba(255,255,255,0.4)", marginTop: "28px", marginBottom: 0 }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: "#3b82f6", fontWeight: "500", textDecoration: "none" }}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}