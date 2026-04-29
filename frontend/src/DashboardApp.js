import { useState, useEffect, useRef } from "react";
import axios from "axios";
axios.defaults.headers.common["Authorization"] = "Bearer dev";

const BASE = "http://localhost:5000/api";
const API = `${BASE}/candidates`;

/* ─── tiny helpers ────────────────────────────────────────────────────── */
const initials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const scoreColor = (s) => (s >= 70 ? "#16a34a" : s >= 40 ? "#d97706" : "#dc2626");

const fmt = (n) => (n ?? 0).toLocaleString();

const ago = (d) => {
    const diff = Date.now() - new Date(d);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
};

/* ─── shared palette / tokens ─────────────────────────────────────────── */
const T = {
    bg: "#0f0f13",
    surface: "#17171e",
    surfaceHi: "#1e1e28",
    border: "#2a2a38",
    accent: "#6c63ff",
    accentHi: "#8b85ff",
    green: "#16a34a",
    amber: "#d97706",
    red: "#dc2626",
    text: "#f0f0f8",
    muted: "#8888a8",
    tag: "#1f1f2e",
};

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f13; color: #f0f0f8; font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.6; min-height: 100vh; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0f0f13; }
  ::-webkit-scrollbar-thumb { background: #2a2a38; border-radius: 2px; }
  input, textarea, select { font-family: inherit; background: #1e1e28; border: 1px solid #2a2a38; color: #f0f0f8; border-radius: 8px; padding: 9px 13px; font-size: 13.5px; outline: none; width: 100%; transition: border-color .15s; }
  input:focus, textarea:focus, select:focus { border-color: #6c63ff; }
  input::placeholder, textarea::placeholder { color: #8888a8; }
  button { cursor: pointer; font-family: inherit; }
  label { font-size: 12px; color: #8888a8; font-weight: 500; letter-spacing: .03em; text-transform: uppercase; display: block; margin-bottom: 6px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ─── tiny UI primitives ──────────────────────────────────────────────── */
const Card = ({ children, style }) => (
    <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 12, padding: 20, animation: "fadeUp .3s ease both", ...style,
    }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style, type = "button" }) => {
    const variants = {
        primary: { background: T.accent, color: "#fff", border: "none" },
        ghost: { background: "transparent", color: T.muted, border: `1px solid ${T.border}` },
        danger: { background: "#3b0c0c", color: T.red, border: `1px solid #5c1c1c` },
        success: { background: "#052e16", color: T.green, border: `1px solid #134d2a` },
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled}
            style={{
                padding: "9px 20px", borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                transition: "all .15s", display: "inline-flex", alignItems: "center", gap: 6,
                opacity: disabled ? .5 : 1, cursor: disabled ? "not-allowed" : "pointer",
                ...variants[variant], ...style
            }}>
            {children}
        </button>
    );
};

const Badge = ({ children, color = T.accent }) => (
    <span style={{
        display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 9px",
        borderRadius: 99, background: color + "22", color, letterSpacing: ".02em"
    }}>{children}</span>
);

const KPICard = ({ label, value, sub, accent = T.accent }) => (
    <Card style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: accent }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: T.muted }}>{sub}</span>}
    </Card>
);

const Spinner = () => (
    <div style={{ width: 18, height: 18, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin .6s linear infinite" }} />
);

const StatusMsg = ({ status }) => status ? (
    <div style={{
        marginTop: 14, padding: "11px 15px", borderRadius: 8, fontSize: 13,
        background: status.type === "success" ? "#052e1622" : "#3b0c0c22",
        color: status.type === "success" ? T.green : T.red,
        border: `1px solid ${status.type === "success" ? "#134d2a" : "#5c1c1c"}`
    }}>
        {status.msg}
    </div>
) : null;

const Avatar = ({ name, size = 38, bg = "#1e1e40" }) => (
    <div style={{
        width: size, height: size, borderRadius: "50%", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: size * .34, color: T.accentHi,
        flexShrink: 0, fontFamily: "'Syne', sans-serif"
    }}>{initials(name)}</div>
);

const PipelineTag = ({ stage }) => {
    const colors = { Applied: T.muted, Shortlisted: T.amber, Interview: T.accent, Offered: T.green, Hired: "#22d3ee", Rejected: T.red };
    return <Badge color={colors[stage] || T.muted}>{stage}</Badge>;
};

const FieldRow = ({ label, value, mono }) => (
    <div style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 12, justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: T.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: ".04em", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{label}</span>
        <span style={{ color: T.text, fontSize: 13, textAlign: "right", fontFamily: mono ? "'DM Mono', monospace" : "inherit" }}>{value}</span>
    </div>
);

function SectionHeader({ title, sub, children }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 3 }}>{title}</h1>
                {sub && <p style={{ color: T.muted, fontSize: 13 }}>{sub}</p>}
            </div>
            {children}
        </div>
    );
}

// [Include all the dashboard page components here from the original App.js]
// ... (DashboardPage, CostCalculator, JobsPage, PipelinePage, InterviewsPage, TalentPage, ComparePage, RecruitersPage, NotificationsPage)

/* ════════════════════════════════════════
   ROOT APP
════════════════════════════════════════ */
const NAV = [
    { id: "dashboard", icon: "◈", label: "Dashboard", member: "M1", color: "#6c63ff" },
    { id: "jobs", icon: "◉", label: "Jobs", member: "M2", color: "#16a34a" },
    { id: "pipeline", icon: "◎", label: "Pipeline", member: "M2", color: "#16a34a" },
    { id: "interviews", icon: "◷", label: "Interviews", member: "M2", color: "#16a34a" },
    { id: "talent", icon: "◆", label: "Talent AI", member: "M3", color: "#d97706" },
    { id: "compare", icon: "◈", label: "Compare", member: "M4", color: "#22d3ee" },
    { id: "recruiters", icon: "◉", label: "Recruiters", member: "M4", color: "#22d3ee" },
    { id: "notifications", icon: "✉", label: "Notifications", member: "M4", color: "#22d3ee" },
];

export { T, GLOBAL_STYLE, Card, Btn, Badge, KPICard, Spinner, StatusMsg, Avatar, PipelineTag, FieldRow, SectionHeader, BASE, API, NAV, scoreColor, fmt, ago, initials };
