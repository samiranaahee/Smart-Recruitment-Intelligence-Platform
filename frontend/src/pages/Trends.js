import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import axios from "axios";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const BASE = "http://localhost:5000/api";

export default function Trends() {
  const [monthlyData, setMonthlyData] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAuthToken = () => localStorage.getItem("token") || "dev";

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = { Authorization: `Bearer ${getAuthToken()}` };

      const [trendData, kpiData] = await Promise.all([
        axios.get(`${BASE}/dashboard/trends`, { headers }),
        axios.get(`${BASE}/dashboard/kpis`, { headers }),
      ]);

      setMonthlyData(trendData.data || []);
      setKpis(kpiData.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load trends data. Make sure your backend is running.");
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
        Loading trends...
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

  // Prepare data for Bar Chart - Monthly Hiring Rate and Applicant Rate
  const barChartData = monthlyData
    ? {
        labels: monthlyData.map((item) => item.month),
        datasets: [
          {
            label: "Applications",
            data: monthlyData.map((item) => item.total_applications),
            backgroundColor: "rgba(59, 130, 246, 0.7)",
            borderColor: "rgba(59, 130, 246, 1)",
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: "rgba(59, 130, 246, 0.9)",
          },
          {
            label: "Hired",
            data: monthlyData.map((item) => item.total_hired),
            backgroundColor: "rgba(16, 185, 129, 0.7)",
            borderColor: "rgba(16, 185, 129, 1)",
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: "rgba(16, 185, 129, 0.9)",
          },
        ],
      }
    : null;

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "rgba(255,255,255,0.8)",
          font: {
            size: 12,
            weight: "500",
          },
          padding: 15,
        },
      },
      title: {
        display: true,
        text: "Monthly Hiring Rate & Applicant Rate Comparison",
        color: "rgba(255,255,255,0.9)",
        font: {
          size: 14,
          weight: "600",
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += context.parsed.y || 0;
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
        ticks: {
          color: "rgba(255,255,255,0.6)",
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
        ticks: {
          color: "rgba(255,255,255,0.6)",
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // Prepare data for Pie Chart - Hiring Funnel
  const pieChartData = kpis
    ? {
        labels: ["Applied", "Interviewed", "Offered", "Hired"],
        datasets: [
          {
            data: [
              kpis.total_applicants || 0,
              kpis.total_interviews || 0,
              kpis.total_offers || 0,
              kpis.total_hired || 0,
            ],
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(245, 158, 11, 0.8)",
              "rgba(37, 99, 235, 0.8)",
            ],
            borderColor: [
              "rgba(59, 130, 246, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(245, 158, 11, 1)",
              "rgba(37, 99, 235, 1)",
            ],
            borderWidth: 2,
            hoverBorderWidth: 3,
            hoverOffset: 8,
          },
        ],
      }
    : null;

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "rgba(255,255,255,0.8)",
          font: {
            size: 12,
            weight: "500",
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "Hiring Funnel - Conversion Rates",
        color: "rgba(255,255,255,0.9)",
        font: {
          size: 14,
          weight: "600",
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.2)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const value = context.parsed || 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

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
          Trends & Analytics
        </h1>
        <button
          onClick={loadData}
          style={{
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
          Refresh
        </button>
      </div>

      {/* Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginTop: "32px",
        }}
      >
        {/* Bar Chart */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "24px",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {barChartData ? (
            <Bar data={barChartData} options={barChartOptions} />
          ) : (
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
              }}
            >
              No data available
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "24px",
            height: "400px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {pieChartData ? (
            <Pie data={pieChartData} options={pieChartOptions} />
          ) : (
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
              }}
            >
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {kpis && (
        <div
          style={{
            marginTop: "32px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "24px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "20px",
              color: "#fff",
            }}
          >
            Funnel Summary
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}
          >
            {[
              {
                label: "Applied",
                value: kpis.total_applicants || 0,
                color: "#3b82f6",
              },
              {
                label: "Interviewed",
                value: kpis.total_interviews || 0,
                color: "#10b981",
              },
              {
                label: "Offered",
                value: kpis.total_offers || 0,
                color: "#f59e0b",
              },
              {
                label: "Hired",
                value: kpis.total_hired || 0,
                color: "#2563eb",
              },
            ].map((stat, i) => {
              const total = kpis.total_applicants || 1;
              const percentage = ((stat.value / total) * 100).toFixed(1);

              return (
                <div
                  key={i}
                  style={{
                    background: `${stat.color}15`,
                    border: `1px solid ${stat.color}33`,
                    borderRadius: "8px",
                    padding: "16px",
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
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: stat.color,
                      marginBottom: "4px",
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {percentage}% of total
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
