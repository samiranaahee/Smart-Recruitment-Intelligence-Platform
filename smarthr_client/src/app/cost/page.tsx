"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, TrendingDown, Users, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getCostPerHire, getKPIs } from "@/lib/api";

export default function CostPage() {
  const router = useRouter();
  const [cost, setCost] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("smarthr_token");
    if (!token) { router.replace("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [costData, kpiData] = await Promise.all([getCostPerHire(), getKPIs()]);
      setCost(costData);
      setKpis(kpiData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cards = cost && kpis ? [
    { title: "Total hiring spend", value: `$${Number(cost.total_cost || 0).toLocaleString()}`, icon: DollarSign, bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
    { title: "Cost per hire", value: `$${Number(cost.cost_per_hire || 0).toLocaleString()}`, icon: TrendingDown, bg: "rgba(16,185,129,0.15)", color: "#10b981" },
    { title: "Total hired", value: cost.total_hired || 0, icon: Users, bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
  ] : [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Cost analysis</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Hiring cost breakdown</div>
          </div>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: "13px", padding: "8px 16px", borderRadius: "10px", cursor: "pointer" }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "28px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Loading cost data...</div>
          ) : (
            <>
              {/* Cost Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                {cards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={20} color={card.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff" }}>{card.value}</div>
                        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{card.title}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost Breakdown */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "20px" }}>Cost breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Recruitment advertising", pct: 35, color: "#3b82f6" },
                    { label: "Interview process", pct: 25, color: "#10b981" },
                    { label: "Onboarding", pct: 20, color: "#f59e0b" },
                    { label: "Background checks", pct: 12, color: "#8b5cf6" },
                    { label: "Miscellaneous", pct: 8, color: "#ef4444" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{item.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>{item.pct}%</span>
                      </div>
                      <div style={{ height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: "3px" }} />
                      </div>
                    </div>
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