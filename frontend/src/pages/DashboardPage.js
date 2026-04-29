import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  FileCheck,
  Clock,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

const BASE = "http://localhost:5000/api";

export default function DashboardPage() {
  const [kpis, setKpis] = useState(null);
  const [cost, setCost] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Token from localStorage or use test token
  const getAuthToken = () => localStorage.getItem("token") || "dev";

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${getAuthToken()}` };

      const [kpiData, costData, trendData] = await Promise.all([
        axios.get(`${BASE}/dashboard/kpis`, { headers }),
        axios.get(`${BASE}/dashboard/cost-per-hire`, { headers }),
        axios.get(`${BASE}/dashboard/trends`, { headers }),
      ]);

      setKpis(kpiData.data);
      setCost(costData.data);
      setTrends(trendData.data || []);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load dashboard data. Make sure your backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
          fontSize: "16px",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "#ff6b6b",
          fontSize: "16px",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          gap: "16px",
        }}
      >
        <div>{error}</div>
        <button
          onClick={loadData}
          style={{
            padding: "8px 16px",
            background: "#6c63ff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const kpiCards = kpis
    ? [
        {
          title: "Total Applicants",
          value: kpis.total_applicants || 0,
          icon: Users,
          bg: "rgba(59,130,246,0.15)",
          color: "#3b82f6",
        },
        {
          title: "Interview Rate",
          value: kpis.interview_rate || "0%",
          icon: CalendarCheck,
          bg: "rgba(16,185,129,0.15)",
          color: "#10b981",
        },
        {
          title: "Offer Rate",
          value: kpis.offer_rate || "0%",
          icon: FileCheck,
          bg: "rgba(245,158,11,0.15)",
          color: "#f59e0b",
        },
        {
          title: "Time to Hire",
          value: `${kpis.avg_time_to_hire || 0}d`,
          icon: Clock,
          bg: "rgba(139,92,246,0.15)",
          color: "#8b5cf6",
        },
        {
          title: "Cost per Hire",
          value: `$${Number(cost?.cost_per_hire || 0).toLocaleString()}`,
          icon: DollarSign,
          bg: "rgba(239,68,68,0.15)",
          color: "#ef4444",
        },
        {
          title: "Total Hired",
          value: kpis.total_hired || 0,
          icon: TrendingUp,
          bg: "rgba(20,184,166,0.15)",
          color: "#14b8a6",
        },
      ]
    : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        padding: "24px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: "#f0f0f8",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <h1 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>
          Recruitment Dashboard
        </h1>
        <button
          onClick={loadData}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "#6c63ff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {kpiCards.map((card, i) => (
          <div
            key={i}
            style={{
              background: card.bg,
              border: `1px solid ${card.color}33`,
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                background: `${card.color}22`,
                padding: "12px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <card.icon size={24} color={card.color} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "4px",
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: card.color,
                }}
              >
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hiring Funnel & Trends Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginTop: "32px",
        }}
      >
        {/* Hiring Funnel */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#fff",
            }}
          >
            Hiring Funnel
          </h2>

          {kpis && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[
                {
                  label: "Applied",
                  value: kpis.total_applicants,
                  color: "#3b82f6",
                },
                {
                  label: "Interviewed",
                  value: kpis.total_interviews,
                  color: "#10b981",
                },
                {
                  label: "Offered",
                  value: kpis.total_offers,
                  color: "#f59e0b",
                },
                { label: "Hired", value: kpis.total_hired, color: "#2563eb" },
              ].map((stage, i) => {
                const pct =
                  kpis.total_applicants > 0
                    ? Math.round((stage.value / kpis.total_applicants) * 100)
                    : 0;
                return (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "13px",
                        color: "#8888a8",
                        marginBottom: "4px",
                      }}
                    >
                      <span>{stage.label}</span>
                      <span>
                        {stage.value}{" "}
                        <span style={{ color: "#6a7a8f" }}>({pct}%)</span>
                      </span>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "4px",
                        height: "8px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: stage.color,
                          width: `${pct}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cost Analytics */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#fff",
            }}
          >
            Cost per Hire Analytics
          </h2>

          {cost && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "4px",
                  }}
                >
                  Cost per Hire
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "700",
                    color: "#ef4444",
                  }}
                >
                  ${Number(cost.cost_per_hire || 0).toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: "4px",
                    }}
                  >
                    Total Cost
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#8b5cf6",
                    }}
                  >
                    ${Number(cost.total_cost || 0).toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "8px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: "4px",
                    }}
                  >
                    Total Hired
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#14b8a6",
                    }}
                  >
                    {cost.total_hired || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      {trends && trends.length > 0 && (
        <div
          style={{
            marginTop: "32px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "16px",
              color: "#fff",
            }}
          >
            Monthly Hiring Trends
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {trends.map((trend, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.6)",
                    marginBottom: "8px",
                  }}
                >
                  {trend.month}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    gap: "12px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Applications
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#3b82f6",
                      }}
                    >
                      {trend.total_applications || 0}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Hired
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#10b981",
                      }}
                    >
                      {trend.total_hired || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
