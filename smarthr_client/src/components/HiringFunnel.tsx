"use client";

import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

export default function HiringFunnel({ kpis }: { kpis: any }) {
  const total = parseInt(kpis.total_applicants) || 0;

  const stages = [
    { label: "Applied", value: total, color: "#3b82f6" },
    { label: "Interviewed", value: parseInt(kpis.total_interviews) || 0, color: "#10b981" },
    { label: "Offered", value: parseInt(kpis.total_offers) || 0, color: "#f59e0b" },
    { label: "Hired", value: parseInt(kpis.total_hired) || 0, color: "#2563eb" },
  ];

  return (
    <div className="chart-card">
      <div className="chart-title">Hiring funnel</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        {stages.map((stage, i) => {
          const pct = total > 0 ? Math.round((stage.value / total) * 100) : 0;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151", marginBottom: "4px" }}>
                <span>{stage.label}</span>
                <span>
                  {stage.value}{" "}
                  <span style={{ color: "#9ca3af" }}>({pct}%)</span>
                </span>
              </div>
              <div className="funnel-bar-bg">
                <div
                  className="funnel-bar-fill"
                  style={{ width: `${pct}%`, background: stage.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "relative", height: "150px" }}>
        <Doughnut
          data={{
            labels: stages.map((s) => s.label),
            datasets: [{
              data: stages.map((s) => s.value || 0),
              backgroundColor: stages.map((s) => s.color),
              borderWidth: 0,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "65%",
            plugins: { legend: { display: false } },
          }}
        />
      </div>
    </div>
  );
}