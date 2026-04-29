"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap, BarChart2, Users, TrendingUp, Shield,
  ChevronDown, ArrowRight, Star, CheckCircle,
  Brain, Clock, DollarSign,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll("[data-animate]").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const features = [
    { icon: Brain, title: "AI-Powered Matching", desc: "Intelligent candidate-job matching using advanced algorithms to find the perfect fit every time.", color: "#3b82f6" },
    { icon: BarChart2, title: "KPI Dashboard", desc: "Real-time recruitment analytics with interview rates, offer rates, and time-to-hire metrics.", color: "#10b981" },
    { icon: DollarSign, title: "Cost Per Hire", desc: "Track and optimize your hiring budget with detailed cost breakdowns and forecasting.", color: "#f59e0b" },
    { icon: TrendingUp, title: "Hiring Trends", desc: "Monthly hiring analytics and visual trend reports to guide smarter recruitment decisions.", color: "#8b5cf6" },
    { icon: Users, title: "Candidate Pipeline", desc: "Manage your entire candidate lifecycle from application to onboarding in one place.", color: "#ef4444" },
    { icon: Shield, title: "Secure & Compliant", desc: "Enterprise-grade JWT security ensuring your recruitment data stays protected always.", color: "#14b8a6" },
  ];

  const stats = [
    { value: "10x", label: "Faster hiring process" },
    { value: "60%", label: "Reduction in cost per hire" },
    { value: "98%", label: "Client satisfaction rate" },
    { value: "500+", label: "Companies onboarded" },
  ];

  const testimonials = [
    { name: "Sarah Chen", role: "HR Director, TechVentures", text: "SmartHR transformed our recruitment process completely. We reduced time-to-hire by 65% in just 3 months.", stars: 5 },
    { name: "Marcus Johnson", role: "Talent Lead, Nexus Corp", text: "The KPI dashboard gives us insights we never had before. Our hiring decisions are now data-driven and precise.", stars: 5 },
    { name: "Amira Hassan", role: "CEO, StartupHub", text: "Finally an HR platform that's both powerful and easy to use. Our team adopted it instantly.", stars: 5 },
  ];

  const anim = (id: string, delay = 0) => ({
    id,
    "data-animate": true,
    style: {
      opacity: visible[id] ? 1 : 0,
      transform: visible[id] ? "translateY(0)" : "translateY(40px)",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    } as React.CSSProperties,
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1e",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflowX: "hidden",
      color: "#fff",
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrollY > 50 ? "rgba(10,15,30,0.95)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.06)" : "none",
        padding: "18px 60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
            Smart<span style={{ color: "#3b82f6" }}>HR</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
          {["Features", "Stats", "Testimonials"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{
              fontSize: "14px", color: "rgba(255,255,255,0.6)",
              textDecoration: "none", transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              border: "none", color: "#fff", fontSize: "14px", fontWeight: 600,
              padding: "9px 22px", borderRadius: "10px", cursor: "pointer",
              boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(59,130,246,0.35)"; }}
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "120px 40px 80px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background glow orbs */}
        <div style={{
          position: "absolute", top: "20%", left: "15%",
          width: "500px", height: "500px",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
          transform: `translateY(${scrollY * 0.1}px)`,
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "10%",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
          transform: `translateY(${scrollY * 0.08}px)`,
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "30%",
          width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        {/* Grid pattern overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(59,130,246,0.1)",
          border: "1px solid rgba(59,130,246,0.3)",
          borderRadius: "100px", padding: "6px 16px",
          fontSize: "13px", color: "#3b82f6", fontWeight: 500,
          marginBottom: "32px",
          animation: "fadeInDown 0.8s ease forwards",
        }}>
          <Zap size={13} />
          AI-Powered Recruitment Intelligence
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(42px, 7vw, 80px)",
          fontWeight: 800, lineHeight: 1.05,
          letterSpacing: "-2px", margin: "0 0 24px",
          maxWidth: "900px",
          animation: "fadeInUp 0.9s ease 0.1s both",
        }}>
          Hire Smarter,{" "}
          <span style={{
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #10b981)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Grow Faster
          </span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: "clamp(16px, 2vw, 20px)",
          color: "rgba(255,255,255,0.5)",
          maxWidth: "600px", lineHeight: 1.7,
          margin: "0 0 48px",
          animation: "fadeInUp 0.9s ease 0.2s both",
        }}>
          SmartHR is the all-in-one recruitment platform that helps companies find top talent faster, reduce hiring costs, and make data-driven decisions with AI-powered insights.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: "flex", gap: "16px", flexWrap: "wrap",
          justifyContent: "center",
          animation: "fadeInUp 0.9s ease 0.3s both",
        }}>
          <button
            onClick={() => router.push("/register")}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              border: "none", color: "#fff", fontSize: "15px", fontWeight: 600,
              padding: "14px 32px", borderRadius: "12px", cursor: "pointer",
              boxShadow: "0 8px 28px rgba(59,130,246,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(59,130,246,0.55)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(59,130,246,0.4)"; }}
          >
            Get started free
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => router.push("/login")}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff", fontSize: "15px", fontWeight: 500,
              padding: "14px 32px", borderRadius: "12px", cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            Sign in
          </button>
        </div>

        {/* Dashboard Preview */}
        <div style={{
          marginTop: "72px",
          width: "100%", maxWidth: "1000px",
          animation: "fadeInUp 1s ease 0.4s both",
          position: "relative",
        }}>
          {/* Glow under card */}
          <div style={{
            position: "absolute", bottom: "-40px", left: "50%",
            transform: "translateX(-50%)",
            width: "80%", height: "80px",
            background: "rgba(59,130,246,0.2)",
            filter: "blur(40px)", borderRadius: "50%",
          }} />

          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px", padding: "24px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
          }}>
            {/* Fake browser bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              {["#ef4444", "#f59e0b", "#10b981"].map(c => (
                <div key={c} style={{ width: "12px", height: "12px", borderRadius: "50%", background: c }} />
              ))}
              <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", color: "rgba(255,255,255,0.3)", marginLeft: "8px" }}>
                localhost:3000/dashboard
              </div>
            </div>

            {/* Dashboard mockup */}
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "16px", minHeight: "320px" }}>
              {/* Sidebar */}
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#3b82f6", marginBottom: "8px" }}>SmartHR</div>
                {["Dashboard", "Candidates", "Jobs", "Cost", "Trends"].map((item, i) => (
                  <div key={item} style={{
                    padding: "8px 10px", borderRadius: "8px", fontSize: "12px",
                    background: i === 0 ? "rgba(59,130,246,0.15)" : "transparent",
                    color: i === 0 ? "#3b82f6" : "rgba(255,255,255,0.4)",
                  }}>{item}</div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* KPI row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  {[
                    { label: "Applicants", value: "245", color: "#3b82f6" },
                    { label: "Interview Rate", value: "42.9%", color: "#10b981" },
                    { label: "Offer Rate", value: "33.3%", color: "#f59e0b" },
                    { label: "Time to Hire", value: "14.5d", color: "#8b5cf6" },
                  ].map((kpi) => (
                    <div key={kpi.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                      <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>{kpi.value}</div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{kpi.label}</div>
                      <div style={{ height: "3px", background: kpi.color, borderRadius: "2px", marginTop: "8px", width: "40%" }} />
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1 }}>
                  {/* Bar chart */}
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>Monthly Trends</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px", alignItems: "center" }}>
                          <div style={{ width: "100%", height: `${h}%`, background: i % 2 === 0 ? "#3b82f6" : "#10b981", borderRadius: "3px 3px 0 0", opacity: 0.8 }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Funnel */}
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" }}>Hiring Funnel</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {[
                        { label: "Applied", pct: 100, color: "#3b82f6" },
                        { label: "Interview", pct: 43, color: "#10b981" },
                        { label: "Offered", pct: 14, color: "#f59e0b" },
                        { label: "Hired", pct: 8, color: "#8b5cf6" },
                      ].map((f) => (
                        <div key={f.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginBottom: "3px" }}>
                            <span>{f.label}</span><span>{f.pct}%</span>
                          </div>
                          <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px" }}>
                            <div style={{ height: "100%", width: `${f.pct}%`, background: f.color, borderRadius: "2px" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          marginTop: "48px", display: "flex", flexDirection: "column",
          alignItems: "center", gap: "8px",
          color: "rgba(255,255,255,0.3)", fontSize: "12px",
          animation: "bounce 2s infinite",
        }}>
          <span>Scroll to explore</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" style={{ padding: "80px 60px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px" }}>
            {stats.map((stat, i) => (
              <div key={i} {...anim(`stat-${i}`, i * 100)} style={{
                ...anim(`stat-${i}`, i * 100).style,
                textAlign: "center", padding: "32px 20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "16px",
              }}>
                <div style={{ fontSize: "48px", fontWeight: 800, color: "#3b82f6", letterSpacing: "-2px" }}>{stat.value}</div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 60px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Section header */}
          <div {...anim("feat-header")} style={{ ...anim("feat-header").style, textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#3b82f6", fontWeight: 600, marginBottom: "16px" }}>
              Everything you need
            </div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-1.5px", margin: "0 0 20px", lineHeight: 1.1 }}>
              Built for modern{" "}
              <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                HR teams
              </span>
            </h2>
            <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.45)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.7 }}>
              Every feature is designed to make your recruitment process faster, smarter, and more cost-effective.
            </p>
          </div>

          {/* Features grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} {...anim(`feat-${i}`, i * 80)} style={{
                  ...anim(`feat-${i}`, i * 80).style,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "20px", padding: "32px",
                  cursor: "default", transition: "border 0.3s, transform 0.3s, opacity 0.7s, transform 0.7s",
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = `1px solid ${feature.color}40`;
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    background: `${feature.color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "20px",
                  }}>
                    <Icon size={22} color={feature.color} />
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", margin: "0 0 10px" }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 60px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div {...anim("how-header")} style={{ ...anim("how-header").style, textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#10b981", fontWeight: 600, marginBottom: "16px" }}>
              How it works
            </div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-1.5px", margin: 0, lineHeight: 1.1 }}>
              Up and running in{" "}
              <span style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                minutes
              </span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
            {[
              { step: "01", title: "Register your company", desc: "Create your SmartHR account in seconds. No credit card required to get started.", color: "#3b82f6" },
              { step: "02", title: "Add your candidates", desc: "Import or manually add candidates to your pipeline and track their progress instantly.", color: "#10b981" },
              { step: "03", title: "Get insights", desc: "Your KPI dashboard populates automatically with real-time recruitment analytics.", color: "#8b5cf6" },
            ].map((item, i) => (
              <div key={i} {...anim(`step-${i}`, i * 150)} style={{ ...anim(`step-${i}`, i * 150).style, position: "relative" }}>
                <div style={{ fontSize: "64px", fontWeight: 900, color: `${item.color}15`, lineHeight: 1, marginBottom: "16px", letterSpacing: "-3px" }}>
                  {item.step}
                </div>
                <div style={{ width: "40px", height: "3px", background: item.color, borderRadius: "2px", marginBottom: "20px" }} />
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>{item.title}</h3>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: "100px 60px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div {...anim("test-header")} style={{ ...anim("test-header").style, textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#f59e0b", fontWeight: 600, marginBottom: "16px" }}>
              Testimonials
            </div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-1.5px", margin: 0, lineHeight: 1.1 }}>
              Loved by HR teams{" "}
              <span style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                worldwide
              </span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            {testimonials.map((t, i) => (
              <div key={i} {...anim(`test-${i}`, i * 100)} style={{
                ...anim(`test-${i}`, i * 100).style,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "20px", padding: "32px",
              }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={16} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>
                <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "0 0 24px", fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{t.name}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "100px 60px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div {...anim("cta")} style={anim("cta").style}>
            {/* Glowing card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "28px", padding: "72px 48px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: "-50%", left: "50%",
                transform: "translateX(-50%)",
                width: "400px", height: "400px",
                background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
                {[CheckCircle, CheckCircle, CheckCircle].map((Icon, i) => (
                  <Icon key={i} size={20} color="#10b981" />
                ))}
              </div>

              <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-1.5px", margin: "0 0 20px", lineHeight: 1.1 }}>
                Ready to transform your{" "}
                <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  recruitment?
                </span>
              </h2>
              <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", margin: "0 0 40px", lineHeight: 1.7 }}>
                Join hundreds of companies using SmartHR to hire better, faster, and smarter.
              </p>

              <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => router.push("/register")}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    border: "none", color: "#fff", fontSize: "15px", fontWeight: 600,
                    padding: "14px 36px", borderRadius: "12px", cursor: "pointer",
                    boxShadow: "0 8px 28px rgba(59,130,246,0.4)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  Start for free
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => router.push("/login")}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff", fontSize: "15px", fontWeight: 500,
                    padding: "14px 36px", borderRadius: "12px", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                >
                  Sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "28px", height: "28px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={14} color="#fff" />
          </div>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
            Smart<span style={{ color: "#3b82f6" }}>HR</span>
          </span>
        </div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
          © 2026 SmartHR. Built for modern recruitment teams.
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Privacy", "Terms", "Contact"].map(item => (
            <a key={item} href="#" style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >
              {item}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
