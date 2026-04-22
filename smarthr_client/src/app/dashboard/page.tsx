"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, CalendarCheck, FileCheck,
  Clock, DollarSign, TrendingUp, RefreshCw,
  ArrowRight,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TrendsChart from "@/components/TrendsChart";
import HiringFunnel from "@/components/HiringFunnel";
import { getKPIs, getCostPerHire, getMonthlyTrends } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<any>(null);
  const [cost, setCost] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [company, setCompany] = useState<any>(null);
  const [ready, setReady] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [kpiData, costData, trendData] = await Promise.all([
        getKPIs(), getCostPerHire(), getMonthlyTrends(),
      ]);
      setKpis(kpiData);
      setCost(costData);
      setTrends(trendData);
    } catch {
      setError("Failed to load data. Make sure your backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("smarthr_token");
    const saved = localStorage.getItem("smarthr_company");
    if (!token) {
      router.replace("/login");
      return;
    }
    if (saved) setCompany(JSON.parse(saved));
    setReady(true);
    loadData();
  }, []);

  const kpiCards = kpis ? [
    { title: "Total applicants", value: kpis.total_applicants || 0, icon: Users, bg: "rgba(59,130,246,0.15)", color: "#3b82f6", href: "/candidates" },
    { title: "Interview rate", value: kpis.interview_rate || "0%", icon: CalendarCheck, bg: "rgba(16,185,129,0.15)", color: "#10b981", href: "/candidates" },
    { title: "Offer rate", value: kpis.offer_rate || "0%", icon: FileCheck, bg: "rgba(245,158,11,0.15)", color: "#f59e0b", href: "/candidates" },
    { title: "Time to hire", value: `${kpis.avg_time_to_hire || 0}d`, icon: Clock, bg: "rgba(139,92,246,0.15)", color: "#8b5cf6", href: "/trends" },
    { title: "Cost per hire", value: `$${Number(cost?.cost_per_hire || 0).toLocaleString()}`, icon: DollarSign, bg: "rgba(239,68,68,0.15)", color: "#ef4444", href: "/cost" },
    { title: "Total hired", value: kpis.total_hired || 0, icon: TrendingUp, bg: "rgba(20,184,166,0.15)", color: "#14b8a6", href: "/jobs" },
  ] : [];

  const quickLinks = [
    { label: "View all candidates", href: "/candidates", color: "#3b82f6" },
    { label: "Manage job postings", href: "/jobs", color: "#10b981" },
    { label: "Cost analysis", href: "/cost", color: "#f59e0b" },
    { label: "Hiring trends", href: "/trends", color: "#8b5cf6" },
  ];

  if (!ready) return (
    <div style={{
      minHeight: "100vh", background: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.4)", fontSize: "14px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      Loading...
    </div>
  );

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#0f172a",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <Sidebar />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* Topbar */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
              Recruitment dashboard
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
              {company?.company_name || ""}
            </div>
          </div>
          <button onClick={loadData} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)", fontSize: "13px",
            padding: "8px 16px", borderRadius: "10px", cursor: "pointer",
          }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "28px" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
              Loading your recruitment data...
            </div>
          )}

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "12px", padding: "16px 20px",
              color: "#ef4444", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {!loading && !error && kpis && (
            <>
              {/* KPI Cards */}
              <div>
                <div style={{
                  fontSize: "11px", textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)",
                  fontWeight: "600", marginBottom: "16px",
                }}>
                  Key performance indicators
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "16px",
                }}>
                  {kpiCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={i}
                        onClick={() => router.push(card.href)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "16px", padding: "20px",
                          display: "flex", flexDirection: "column", gap: "16px",
                          cursor: "pointer", transition: "border 0.2s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.border = `1px solid ${card.color}`)}
                        onMouseLeave={e => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")}
                      >
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          background: card.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon size={18} color={card.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: "24px", fontWeight: "700", color: "#fff" }}>
                            {card.value}
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                            {card.title}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <TrendsChart trends={trends} />
                <HiringFunnel kpis={kpis} />
              </div>

              {/* Quick Links */}
              <div>
                <div style={{
                  fontSize: "11px", textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)",
                  fontWeight: "600", marginBottom: "16px",
                }}>
                  Quick access
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}>
                  {quickLinks.map((link, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(link.href)}
                      style={{
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px", padding: "14px 18px",
                        color: "#fff", fontSize: "14px",
                        cursor: "pointer", transition: "all 0.2s",
                        fontFamily: "'Segoe UI', system-ui, sans-serif",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.borderColor = link.color;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      }}
                    >
                      <span>{link.label}</span>
                      <ArrowRight size={16} color={link.color} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}