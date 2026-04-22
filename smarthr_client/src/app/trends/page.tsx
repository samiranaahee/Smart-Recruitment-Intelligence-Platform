"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TrendsChart from "@/components/TrendsChart";
import { getMonthlyTrends, getKPIs } from "@/lib/api";

export default function TrendsPage() {
  const router = useRouter();
  const [trends, setTrends] = useState<any[]>([]);
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
      const [trendData, kpiData] = await Promise.all([getMonthlyTrends(), getKPIs()]);
      setTrends(trendData);
      setKpis(kpiData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const bestMonth = trends.length
    ? trends.reduce((a, b) => (a.total_applications > b.total_applications ? a : b))
    : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Hiring trends</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>Monthly hiring activity</div>
          </div>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: "13px", padding: "8px 16px", borderRadius: "10px", cursor: "pointer" }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "28px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Loading trends...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "16px" }}>
                {[
                  { label: "Total months tracked", value: trends.length },
                  { label: "Best month", value: bestMonth?.month || "—" },
                  { label: "Peak applications", value: bestMonth?.total_applications || 0 },
                  { label: "Overall hire rate", value: kpis ? `${Math.round((kpis.total_hired / Math.max(kpis.total_applicants, 1)) * 100)}%` : "0%" },
                ].map((card, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px" }}>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>{card.value}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <TrendsChart trends={trends} />

              {/* Monthly Table */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Month", "Applications", "Hired", "Hire rate"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.3)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t, i) => {
                      const rate = t.total_applications > 0
                        ? Math.round((t.total_hired / t.total_applications) * 100)
                        : 0;
                      return (
                        <tr key={i}>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "rgba(255,255,255,0.8)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.month}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#3b82f6", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.total_applications}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "#10b981", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{t.total_hired}</td>
                          <td style={{ padding: "14px 20px", fontSize: "14px", color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{rate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}