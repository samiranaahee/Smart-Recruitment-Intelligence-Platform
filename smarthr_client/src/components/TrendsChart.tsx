"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale,
  LinearScale, BarElement, Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function TrendsChart({ trends }: { trends: any[] }) {
  const data = {
    labels: trends.length ? trends.map((t) => t.month) : ["No data"],
    datasets: [
      {
        label: "Applications",
        data: trends.length ? trends.map((t) => t.total_applications) : [0],
        backgroundColor: "#3b82f6",
        borderRadius: 4,
      },
      {
        label: "Hired",
        data: trends.length ? trends.map((t) => t.total_hired) : [0],
        backgroundColor: "#10b981",
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="chart-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div className="chart-title" style={{ marginBottom: 0 }}>Monthly hiring trends</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#9ca3af" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#3b82f6" }} />
            Applications
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#9ca3af" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#10b981" }} />
            Hired
          </div>
        </div>
      </div>
      <div style={{ position: "relative", height: "220px" }}>
        <Bar
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              y: { beginAtZero: true, ticks: { font: { size: 11 }, stepSize: 1 }, grid: { color: "rgba(0,0,0,0.05)" } },
            },
          }}
        />
      </div>
    </div>
  );
}