import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import axios from "axios";

const BASE = "http://localhost:5000/api";

export default function LoginPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const response = await axios.post(`${BASE}/auth/login`, {
                email: form.email,
                password: form.password,
            });

            if (response.data.token) {
                localStorage.setItem("smarthr_token", response.data.token);
                localStorage.setItem("smarthr_user", JSON.stringify(response.data.company));
                setStatus({ type: "success", msg: "Login successful! Redirecting to dashboard..." });
                setTimeout(() => navigate("/dashboard"), 1500);
            }
        } catch (error) {
            setStatus({
                type: "error",
                msg: error.response?.data?.message || "Login failed. Please check your credentials.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0a0f1e",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            color: "#fff",
        }}>
            {/* Background glow */}
            <div style={{
                position: "fixed",
                top: "20%",
                left: "10%",
                width: "400px",
                height: "400px",
                background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
            }} />
            <div style={{
                position: "fixed",
                bottom: "10%",
                right: "15%",
                width: "350px",
                height: "350px",
                background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none",
            }} />

            <div style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                maxWidth: "450px",
                background: "rgba(15,15,19,0.8)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                padding: "48px 40px",
                backdropFilter: "blur(10px)",
                animation: "fadeUp 0.5s ease",
            }}>
                {/* Header with Clickable Logo Button */}
                <div style={{ marginBottom: "32px", textAlign: "center" }}>
                    <div
                        onClick={() => navigate("/")}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "24px",
                            cursor: "pointer",
                            transition: "transform 0.2s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                        <div style={{
                            width: "40px",
                            height: "40px",
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
                        }}>
                            <span style={{ fontSize: "20px", fontWeight: 800 }}>⚡</span>
                        </div>
                        <span style={{ fontSize: "20px", fontWeight: 700 }}>
                            Smart<span style={{ color: "#3b82f6" }}>HR</span>
                        </span>


                    </div>
                    <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                        Sign in to your SmartHR account
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                    {/* Email */}
                    <div>
                        <label style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.6)",
                            fontWeight: 500,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                            display: "block",
                            marginBottom: "8px",
                        }}>
                            Email Address
                        </label>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            background: "rgba(30,30,40,0.8)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "10px",
                            padding: "12px 14px",
                            transition: "all 0.2s",
                        }}>
                            <Mail size={18} color="rgba(255,255,255,0.4)" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                                placeholder="your@email.com"
                                required
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    color: "#fff",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{
                            fontSize: "12px",
                            color: "rgba(255,255,255,0.6)",
                            fontWeight: 500,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                            display: "block",
                            marginBottom: "8px",
                        }}>
                            Password
                        </label>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            background: "rgba(30,30,40,0.8)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "10px",
                            padding: "12px 14px",
                            transition: "all 0.2s",
                        }}>
                            <Lock size={18} color="rgba(255,255,255,0.4)" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                onChange={set("password")}
                                placeholder="••••••••"
                                required
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    color: "#fff",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "rgba(255,255,255,0.4)",
                                    padding: "4px",
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div style={{
                            padding: "12px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            background: status.type === "success" ? "rgba(5,46,22,0.5)" : "rgba(59,12,12,0.5)",
                            color: status.type === "success" ? "#10b981" : "#ef4444",
                            border: `1px solid ${status.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                        }}>
                            {status.msg}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                            border: "none",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 600,
                            padding: "12px 20px",
                            borderRadius: "10px",
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "all 0.2s",
                            opacity: loading ? 0.7 : 1,
                            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
                        }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
                        onMouseLeave={e => !loading && (e.currentTarget.style.transform = "translateY(0)")}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: 16,
                                    height: 16,
                                    border: "2px solid rgba(255,255,255,0.3)",
                                    borderTopColor: "#fff",
                                    borderRadius: "50%",
                                    animation: "spin 0.6s linear infinite",
                                }} />
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    margin: "24px 0",
                    color: "rgba(255,255,255,0.2)",
                    fontSize: "12px",
                }}>
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                    Or
                    <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                </div>



                {/* Footer */}
                <div style={{
                    marginTop: "24px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.5)",
                }}>
                    Don't have an account?{" "}
                    <button
                        onClick={() => navigate("/register")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            cursor: "pointer",
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Create one
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
      `}</style>
        </div>
    );
}
