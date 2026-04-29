import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import axios from "axios";

axios.defaults.headers.common["Authorization"] = "Bearer dev";

const BASE = "http://localhost:5000/api";
const API = `${BASE}/candidates`;

/* ─── tiny helpers ────────────────────────────────────────────────────── */
const initials = (name) => {
    if (typeof name !== 'string') return "?";
    return name.split(" ").map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
};

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
    bg: "var(--bg)",
    surface: "var(--surface)",
    surfaceHi: "var(--surfaceHi)",
    border: "var(--border)",
    accent: "var(--accent)",
    accentHi: "var(--accentHi)",
    green: "var(--green)",
    amber: "var(--amber)",
    red: "var(--red)",
    text: "var(--text)",
    muted: "var(--muted)",
    tag: "var(--tag)",
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "40px", color: "var(--red)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <h2 style={{ marginBottom: "10px" }}>Something went wrong.</h2>
                    <p style={{ fontFamily: "monospace" }}>{this.state.error?.toString()}</p>
                    <button onClick={() => window.location.reload()} style={{ marginTop: "20px", padding: "8px 16px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px" }}>Reload Page</button>
                </div>
            );
        }
        return this.props.children;
    }
}


/* ─── tiny UI primitives ──────────────────────────────────────────────── */
const Card = ({ children, style, className = "" }) => (
    <div className={`glass ${className}`} style={{
        padding: 24, animation: "fadeUp .3s ease both", ...style,
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
                padding: "10px 24px", borderRadius: 14, fontSize: 13.5, fontWeight: 600,
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
        borderRadius: 99, background: `color-mix(in srgb, ${color} 15%, transparent)`, color, letterSpacing: ".02em"
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
        marginTop: 14, padding: "11px 15px", borderRadius: 12, fontSize: 13,
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


/* ════════════════════════════════════════
   MEMBER 1 – Dashboard
════════════════════════════════════════ */

function CostCalculator() {
    const [fields, setFields] = useState({ ads: 800, agency: 0, interviews: 4, hrHours: 20, hrRate: 50 });
    const set = (k) => (e) => setFields(f => ({ ...f, [k]: +e.target.value }));
    const total = fields.ads + fields.agency + (fields.interviews * 2 * fields.hrRate) + (fields.hrHours * fields.hrRate);
    return (
        <Card>
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Cost-per-Hire Calculator</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 12, marginBottom: 16 }}>
                {[["ads", "Job Ad Spend ($)"], ["agency", "Agency Fees ($)"], ["interviews", "Interview Rounds"], ["hrHours", "HR Hours Spent"], ["hrRate", "HR Hourly Rate ($)"]].map(([k, l]) => (
                    <div key={k}><label>{l}</label><input type="number" value={fields[k]} onChange={set(k)} /></div>
                ))}
            </div>
            <div className="glass" style={{ borderRadius: "var(--radius-lg)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: T.muted, fontSize: 13 }}>Estimated Cost-per-Hire</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: T.green }}>${fmt(total)}</span>
            </div>
        </Card>
    );
}

/* ════════════════════════════════════════
   MEMBER 2 – Jobs
════════════════════════════════════════ */
// Replace the entire JobsPage function in App.js with this:

function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [status, setStatus] = useState(null);
    const [form, setForm] = useState({
        title: "", department: "", location: "",
        type: "Full-time", status: "Open",
        description: "", requiredSkills: "",
        salaryMin: "", salaryMax: "", deadline: "",
    });

    const load = () => {
        setLoading(true);
        axios.get(`${BASE}/jobs`)
            .then(r => setJobs(r.data))
            .catch(() => setJobs([
                { _id: "1", title: "Frontend Engineer", department: "Engineering", location: "Remote", type: "Full-time", requiredSkills: ["React", "TypeScript"], status: "Open", applicants: 28, salaryMin: 50000, salaryMax: 80000, deadline: "2025-09-01" },
                { _id: "2", title: "Product Manager", department: "Product", location: "Dhaka", type: "Full-time", requiredSkills: ["Roadmap", "Agile"], status: "Open", applicants: 41, salaryMin: 60000, salaryMax: 90000, deadline: "2025-08-15" },
            ]))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const resetForm = () => setForm({
        title: "", department: "", location: "",
        type: "Full-time", status: "Open",
        description: "", requiredSkills: "",
        salaryMin: "", salaryMax: "", deadline: "",
    });

    const submit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            requiredSkills: typeof form.requiredSkills === 'string' ? form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean) : (Array.isArray(form.requiredSkills) ? form.requiredSkills : []),
            salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
            salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
            deadline: form.deadline || undefined,
        };
        try {
            editId
                ? await axios.put(`${BASE}/jobs/${editId}`, payload)
                : await axios.post(`${BASE}/jobs`, payload);
            setStatus({ type: "success", msg: editId ? "Job updated." : "Job posted!" });
            resetForm();
            setShowForm(false);
            setEditId(null);
            load();
        } catch {
            setStatus({ type: "error", msg: "Failed to save job." });
        }
    };

    const del = async (id) => {
        if (!window.confirm("Delete this job?")) return;
        await axios.delete(`${BASE}/jobs/${id}`).catch(() => { });
        load();
    };

    const startEdit = (j) => {
        setForm({
            title: j.title || "",
            department: j.department || "",
            location: j.location || "",
            type: j.type || "Full-time",
            status: j.status || "Open",
            description: j.description || "",
            requiredSkills: (j.requiredSkills || []).join(", "),
            salaryMin: j.salaryMin || "",
            salaryMax: j.salaryMax || "",
            deadline: typeof j.deadline === 'string' ? j.deadline.split("T")[0] : "",
        });
        setEditId(j._id);
        setShowForm(true);
    };

    const statusColor = (s) =>
        s === "Open" ? T.green : s === "Draft" ? T.amber : T.muted;

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader title="Job Postings" sub="Manage open roles and skill requirements">
                <Btn onClick={() => { setShowForm(s => !s); setEditId(null); resetForm(); }}>
                    {showForm ? "✕ Cancel" : "+ New Job"}
                </Btn>
            </SectionHeader>

            {showForm && (
                <Card style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>
                        {editId ? "Edit Job" : "Post New Job"}
                    </p>
                    <form onSubmit={submit}>
                        {/* Row 1 — title, department, location */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div><label>Job Title *</label><input value={form.title} onChange={set("title")} required /></div>
                            <div><label>Department</label><input value={form.department} onChange={set("department")} /></div>
                            <div><label>Location</label><input value={form.location} onChange={set("location")} /></div>
                        </div>

                        {/* Row 2 — type, status, deadline */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div>
                                <label>Job Type</label>
                                <select value={form.type} onChange={set("type")} style={{ background: T.surfaceHi }}>
                                    {["Full-time", "Part-time", "Contract", "Remote"].map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label>Status</label>
                                <select value={form.status} onChange={set("status")} style={{ background: T.surfaceHi }}>
                                    {["Open", "Closed", "Draft"].map(o => <option key={o}>{o}</option>)}
                                </select>
                            </div>
                            <div><label>Application Deadline</label><input type="date" value={form.deadline} onChange={set("deadline")} /></div>
                        </div>

                        {/* Row 3 — salary range */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div><label>Min Salary ($)</label><input type="number" value={form.salaryMin} onChange={set("salaryMin")} placeholder="e.g. 50000" /></div>
                            <div><label>Max Salary ($)</label><input type="number" value={form.salaryMax} onChange={set("salaryMax")} placeholder="e.g. 80000" /></div>
                        </div>

                        {/* Required skills */}
                        <div style={{ marginBottom: 14 }}>
                            <label>Required Skills (comma-separated)</label>
                            <input value={form.requiredSkills} onChange={set("requiredSkills")} placeholder="React, Node.js, MongoDB" />
                        </div>

                        {/* Description */}
                        <div style={{ marginBottom: 16 }}>
                            <label>Job Description *</label>
                            <textarea value={form.description} onChange={set("description")} rows={5}
                                placeholder="Describe the role, responsibilities, and what you're looking for…" required />
                        </div>

                        <Btn type="submit">{editId ? "Update Job" : "Post Job"}</Btn>
                        <StatusMsg status={status} />
                    </form>
                </Card>
            )}

            {loading ? <div style={{ color: T.muted }}>Loading…</div> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {jobs.map(j => (
                        <Card key={j._id} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                            <div style={{ flex: 1 }}>
                                {/* Title + status */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>{j.title}</span>
                                    <Badge color={statusColor(j.status)}>{j.status}</Badge>
                                    <Badge color={T.muted}>{j.type}</Badge>
                                </div>

                                {/* Meta */}
                                <p style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
                                    {[j.department, j.location].filter(Boolean).join(" · ")}
                                    {(j.salaryMin || j.salaryMax) && (
                                        <span style={{ marginLeft: 10, color: T.green }}>
                                            ${j.salaryMin?.toLocaleString()} – ${j.salaryMax?.toLocaleString()}
                                        </span>
                                    )}
                                    {j.deadline && (
                                        <span style={{ marginLeft: 10, color: T.amber }}>
                                            Deadline: {new Date(j.deadline).toLocaleDateString()}
                                        </span>
                                    )}
                                </p>

                                {/* Required skills */}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                    {(j.requiredSkills || []).map(s => (
                                        <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: T.tag, color: T.muted }}>{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Applicants count */}
                            <div style={{ textAlign: "center", padding: "0 12px" }}>
                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: T.accent }}>{j.applicants || 0}</div>
                                <div style={{ fontSize: 11, color: T.muted }}>applicants</div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <Btn variant="ghost" onClick={() => startEdit(j)} style={{ padding: "7px 14px", fontSize: 12 }}>Edit</Btn>
                                <Btn variant="danger" onClick={() => del(j._id)} style={{ padding: "7px 14px", fontSize: 12 }}>Delete</Btn>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════
   MEMBER 2 – Pipeline
════════════════════════════════════════ */
const STAGES = ["Applied", "Shortlisted", "Interview", "Offered", "Hired", "Rejected"];

function PipelinePage() {
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        axios.get(`${BASE}/applications`)
            .then(r => setApps(r.data))
            .catch(() => setApps([
                { _id: "a1", candidateName: "Aisha Rahman", jobTitle: "Frontend Engineer", stage: "Interview", appliedAt: new Date(Date.now() - 86400000 * 2), email: "aisha@example.com" },
                { _id: "a2", candidateName: "Karim Hossain", jobTitle: "Product Manager", stage: "Shortlisted", appliedAt: new Date(Date.now() - 86400000 * 5), email: "karim@example.com" },
                { _id: "a3", candidateName: "Tania Begum", jobTitle: "Data Analyst", stage: "Offered", appliedAt: new Date(Date.now() - 86400000 * 10), email: "tania@example.com" },
                { _id: "a4", candidateName: "Rafi Islam", jobTitle: "Frontend Engineer", stage: "Applied", appliedAt: new Date(Date.now() - 86400000 * 1), email: "rafi@example.com" },
                { _id: "a5", candidateName: "Nadia Chowdhury", jobTitle: "Product Manager", stage: "Hired", appliedAt: new Date(Date.now() - 86400000 * 20), email: "nadia@example.com" },
            ]))
            .finally(() => setLoading(false));
    }, []);

    const moveStage = (id, stage) => {
        axios.patch(`${BASE}/applications/${id}/stage`, { stage }).catch(() => { });
        setApps(a => a.map(x => x._id === id ? { ...x, stage } : x));
    };

    if (loading) return <div style={{ color: T.muted }}>Loading…</div>;
    const byStage = (s) => apps.filter(a => a.stage === s);

    if (selected) return (
        <div style={{ animation: "fadeUp .3s ease" }}>
            <Btn variant="ghost" onClick={() => setSelected(null)} style={{ marginBottom: 20, fontSize: 12 }}>← Back to Pipeline</Btn>
            <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                    <Avatar name={selected.candidateName} size={52} />
                    <div>
                        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{selected.candidateName}</h2>
                        <p style={{ color: T.muted, fontSize: 13 }}>{selected.email}</p>
                    </div>
                    <div style={{ marginLeft: "auto" }}><PipelineTag stage={selected.stage} /></div>
                </div>
                <FieldRow label="Applied For" value={selected.jobTitle} />
                <FieldRow label="Applied" value={ago(selected.appliedAt)} />
                <div style={{ marginTop: 20 }}><label>Move to Stage</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                        {STAGES.map(s => (
                            <Btn key={s} variant={s === selected.stage ? "primary" : "ghost"}
                                onClick={() => { moveStage(selected._id, s); setSelected(p => ({ ...p, stage: s })); }}
                                style={{ padding: "6px 14px", fontSize: 12 }}>{s}</Btn>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader title="Candidate Pipeline" sub="Track candidates through the hiring funnel" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                {STAGES.map(stage => (
                    <div key={stage} style={{ minWidth: 140 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em" }}>{stage}</span>
                            <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: T.accent }}>{byStage(stage).length}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {byStage(stage).map(a => (
                                <div key={a._id} onClick={() => setSelected(a)}
                                    className="glass"
                                    style={{ borderRadius: "var(--radius-md)", padding: 12, cursor: "pointer", transition: "all .2s ease" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--glass-border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                    <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{a.candidateName}</p>
                                    <p style={{ fontSize: 11, color: T.muted }}>{a.jobTitle}</p>
                                    <p style={{ fontSize: 10, color: T.muted, marginTop: 5 }}>{ago(a.appliedAt)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   MEMBER 2 – Interviews
════════════════════════════════════════ */
// Replace the entire InterviewsPage function in App.js with this:

function InterviewsPage() {
    const [tab, setTab] = useState("schedule");
    const [candidates, setCandidates] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [selected, setSelected] = useState([]); // selected candidate IDs
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        date: "", time: "", type: "Technical", interviewerName: "", notes: "",
    });
    const [evalTarget, setEvalTarget] = useState(null);
    const [evalForm, setEvalForm] = useState({ scores: { technical: 7, communication: 7, problemSolving: 7, cultural: 7 }, feedback: "", recommendation: "Yes" });

    const loadCandidates = () => {
        axios.get(API).then(r => setCandidates(r.data)).catch(() => setCandidates([]));
    };

    const loadInterviews = () => {
        axios.get(`${BASE}/interviews`).then(r => setInterviews(r.data)).catch(() => setInterviews([]));
    };

    useEffect(() => { loadCandidates(); loadInterviews(); }, []);

    const set = (k) => (e) => setScheduleForm(f => ({ ...f, [k]: e.target.value }));

    // Group candidates by job
    const grouped = candidates.reduce((acc, c) => {
        const jobTitle = c.appliedJob?.title || "No Job Assigned";
        if (!acc[jobTitle]) acc[jobTitle] = [];
        acc[jobTitle].push(c);
        return acc;
    }, {});

    const toggleCandidate = (id) =>
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

    const toggleJobGroup = (group) => {
        const ids = group.map(c => c._id);
        const allSelected = ids.every(id => selected.includes(id));
        if (allSelected) {
            setSelected(s => s.filter(id => !ids.includes(id)));
        } else {
            setSelected(s => [...new Set([...s, ...ids])]);
        }
    };

    const selectedCandidates = candidates.filter(c => selected.includes(c._id));

    const submitSchedule = async (e) => {
        e.preventDefault();
        if (selected.length === 0) return setStatus({ type: "error", msg: "Select at least one candidate." });
        if (!scheduleForm.date || !scheduleForm.time) return setStatus({ type: "error", msg: "Date and time are required." });

        setLoading(true);
        setStatus(null);

        try {
            // Schedule interview for each selected candidate
            await Promise.all(
                selectedCandidates.map(c =>
                    axios.post(`${BASE}/interviews`, {
                        candidateName: c.name,
                        candidateId: c._id,
                        jobTitle: c.appliedJob?.title || "",
                        interviewerName: scheduleForm.interviewerName,
                        date: scheduleForm.date,
                        time: scheduleForm.time,
                        type: scheduleForm.type,
                        notes: scheduleForm.notes,
                    })
                )
            );

            setStatus({ type: "success", msg: `Interview scheduled for ${selected.length} candidate(s). Email invites sent!` });
            setSelected([]);
            setScheduleForm({ date: "", time: "", type: "Technical", interviewerName: "", notes: "" });
            loadInterviews();
            setTab("scheduled");
        } catch (err) {
            setStatus({ type: "error", msg: err.response?.data?.error || "Failed to schedule interviews." });
        } finally {
            setLoading(false);
        }
    };

    const submitEval = async (e) => {
        e.preventDefault();
        await axios.patch(`${BASE}/interviews/${evalTarget._id}/evaluate`, evalForm).catch(() => { });
        setInterviews(iv => iv.map(i => i._id === evalTarget._id ? { ...i, status: "Completed", scores: evalForm.scores } : i));
        setEvalTarget(null);
    };

    const setScore = (dim, val) =>
        setEvalForm(f => ({ ...f, scores: { ...f.scores, [dim]: Number(val) } }));

    const avgScore = (scores) => {
        const vals = Object.values(scores || {}).filter(Boolean);
        return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10 : null;
    };

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader title="Interview Scheduling" sub="Select candidates, set date & time, send calendar invites" />

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
                {[["schedule", "Schedule Interviews"], ["scheduled", "Scheduled"]].map(([t, l]) => (
                    <button key={t} onClick={() => setTab(t)}
                        style={{
                            padding: "9px 22px", border: "none", background: "none", cursor: "pointer",
                            color: tab === t ? T.accent : T.muted, fontWeight: tab === t ? 600 : 400,
                            borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
                            marginBottom: -1, fontFamily: "'Syne',sans-serif", fontSize: 14
                        }}>{l}
                        {t === "scheduled" && interviews.length > 0 && (
                            <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 6px", borderRadius: 99, background: `color-mix(in srgb, ${T.accent} 20%, transparent)`, color: T.accent }}>{interviews.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Schedule Tab ── */}
            {tab === "schedule" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

                    {/* Left — candidate selector grouped by job */}
                    <div>
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
                            Select Candidates
                        </p>

                        {candidates.length === 0 ? (
                            <Card><p style={{ color: T.muted, textAlign: "center", padding: 20 }}>No candidates yet.</p></Card>
                        ) : Object.entries(grouped).map(([jobTitle, group]) => {
                            const allSelected = group.every(c => selected.includes(c._id));
                            const someSelected = group.some(c => selected.includes(c._id));
                            return (
                                <div key={jobTitle} style={{ marginBottom: 18 }}>
                                    {/* Job group header */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>{jobTitle}</span>
                                            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 99, background: `color-mix(in srgb, ${T.accent} 15%, transparent)`, color: T.accent }}>{group.length}</span>
                                        </div>
                                        <button onClick={() => toggleJobGroup(group)}
                                            style={{
                                                fontSize: 11, padding: "4px 10px", borderRadius: 6,
                                                border: `1px solid ${someSelected ? T.accent : T.border}`,
                                                background: allSelected ? `color-mix(in srgb, ${T.accent} 15%, transparent)` : "transparent",
                                                color: someSelected ? T.accent : T.muted, cursor: "pointer"
                                            }}>
                                            {allSelected ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>

                                    {/* Candidate rows */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                        {group.map(c => {
                                            const on = selected.includes(c._id);
                                            return (
                                                <div key={c._id} onClick={() => toggleCandidate(c._id)}
                                                    className={on ? "" : "glass"}
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                                                        borderRadius: "var(--radius-md)", border: `1px solid ${on ? T.accent : "transparent"}`,
                                                        background: on ? `color-mix(in srgb, ${T.accent} 10%, transparent)` : "transparent", cursor: "pointer", transition: "all .15s"
                                                    }}>
                                                    {/* Checkbox */}
                                                    <div style={{
                                                        width: 18, height: 18, borderRadius: 4,
                                                        border: `2px solid ${on ? T.accent : T.border}`,
                                                        background: on ? T.accent : "transparent",
                                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                                    }}>
                                                        {on && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
                                                    </div>
                                                    <Avatar name={c.name} size={32} />
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</p>
                                                        <p style={{ fontSize: 11, color: T.muted }}>{c.email}</p>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <span style={{ fontWeight: 700, color: scoreColor(c.skillMatchScore), fontFamily: "'DM Mono',monospace", fontSize: 13 }}>{c.skillMatchScore}/100</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right — schedule form */}
                    <div style={{ position: "sticky", top: 20 }}>
                        <Card>
                            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Interview Details</p>
                            <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
                                {selected.length === 0
                                    ? "Select candidates on the left"
                                    : `Scheduling for ${selected.length} candidate(s)`}
                            </p>

                            {/* Selected preview */}
                            {selectedCandidates.length > 0 && (
                                <div style={{ marginBottom: 14, padding: "10px 12px", borderRadius: 8, background: T.surfaceHi }}>
                                    {selectedCandidates.map(c => (
                                        <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                                            <Avatar name={c.name} size={22} />
                                            <span style={{ fontSize: 12 }}>{c.name}</span>
                                            <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>{c.appliedJob?.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={submitSchedule}>
                                <div style={{ marginBottom: 12 }}><label>Date *</label><input type="date" value={scheduleForm.date} onChange={set("date")} required /></div>
                                <div style={{ marginBottom: 12 }}><label>Time *</label><input type="time" value={scheduleForm.time} onChange={set("time")} required /></div>
                                <div style={{ marginBottom: 12 }}>
                                    <label>Interview Type</label>
                                    <select value={scheduleForm.type} onChange={set("type")} style={{ background: T.surfaceHi }}>
                                        {["Technical", "HR", "Cultural Fit", "Final"].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 12 }}><label>Interviewer Name</label><input value={scheduleForm.interviewerName} onChange={set("interviewerName")} placeholder="Mr. Ahmed" /></div>
                                <div style={{ marginBottom: 16 }}><label>Notes</label><textarea value={scheduleForm.notes} onChange={set("notes")} rows={3} placeholder="Any prep notes or instructions…" /></div>
                                <Btn type="submit" disabled={loading || selected.length === 0} style={{ width: "100%", justifyContent: "center" }}>
                                    {loading ? <><Spinner /> Scheduling…</> : `Schedule for ${selected.length || 0} Candidate(s)`}
                                </Btn>
                                <StatusMsg status={status} />
                            </form>
                        </Card>
                    </div>
                </div>
            )}

            {/* ── Scheduled Tab ── */}
            {tab === "scheduled" && (
                <div>
                    {/* Evaluation modal */}
                    {evalTarget && (
                        <Card style={{ marginBottom: 20, borderColor: T.accent }}>
                            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>
                                Evaluate: {evalTarget.candidateName}
                            </p>
                            <form onSubmit={submitEval}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                                    {[["technical", "Technical"], ["communication", "Communication"], ["problemSolving", "Problem Solving"], ["cultural", "Cultural Fit"]].map(([dim, label]) => (
                                        <div key={dim}>
                                            <label>{label}: <span style={{ color: T.accent, fontFamily: "'DM Mono',monospace" }}>{evalForm.scores[dim]}/10</span></label>
                                            <input type="range" min={1} max={10} value={evalForm.scores[dim]}
                                                onChange={e => setScore(dim, e.target.value)}
                                                style={{ border: "none", background: "none", padding: 0, width: "100%" }} />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label>Recommendation</label>
                                    <select value={evalForm.recommendation} onChange={e => setEvalForm(f => ({ ...f, recommendation: e.target.value }))} style={{ background: T.surfaceHi }}>
                                        {["Strong Yes", "Yes", "Maybe", "No", "Strong No"].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div style={{ marginBottom: 14 }}><label>Feedback</label><textarea value={evalForm.feedback} onChange={e => setEvalForm(f => ({ ...f, feedback: e.target.value }))} rows={3} /></div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Btn type="submit" variant="success">Save Evaluation</Btn>
                                    <Btn variant="ghost" onClick={() => setEvalTarget(null)}>Cancel</Btn>
                                </div>
                            </form>
                        </Card>
                    )}

                    {interviews.length === 0 ? (
                        <Card><p style={{ color: T.muted, textAlign: "center", padding: 20 }}>No interviews scheduled yet.</p></Card>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {interviews.map(i => {
                                const score = avgScore(i.scores);
                                const date = i.scheduledAt ? new Date(i.scheduledAt) : null;
                                return (
                                    <Card key={i._id} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 5 }}>
                                                <span style={{ fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{i.candidateName}</span>
                                                <Badge color={i.status === "Completed" ? T.green : T.amber}>{i.status}</Badge>
                                                <Badge color={T.accent}>{i.type}</Badge>
                                            </div>
                                            <p style={{ fontSize: 12, color: T.muted }}>
                                                {i.jobTitle} {i.interviewerName ? `· ${i.interviewerName}` : ""}
                                            </p>
                                            <p style={{ fontSize: 12, color: T.muted }}>
                                                {date ? `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                                            </p>
                                            {i.meetLink && (
                                                <a href={i.meetLink} target="_blank" rel="noreferrer"
                                                    style={{ fontSize: 11, color: T.accent, textDecoration: "none", marginTop: 4, display: "inline-block" }}>
                                                    🔗 Join Meeting
                                                </a>
                                            )}
                                        </div>
                                        {score != null ? (
                                            <div style={{ textAlign: "center" }}>
                                                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: score >= 7 ? T.green : T.amber }}>
                                                    {score}<span style={{ fontSize: 12, color: T.muted }}>/10</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: T.muted }}>Avg Score</div>
                                            </div>
                                        ) : (
                                            <Btn variant="ghost" onClick={() => { setEvalTarget(i); setEvalForm({ scores: { technical: 7, communication: 7, problemSolving: 7, cultural: 7 }, feedback: "", recommendation: "Yes" }); }}
                                                style={{ fontSize: 12, padding: "6px 14px" }}>Evaluate</Btn>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════
   MEMBER 3 – Talent AI
════════════════════════════════════════ */

function TalentPage() {
    const [tab, setTab] = useState("upload");
    const [candidates, setCandidates] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", jobId: "", jobDescription: "", candidateStatement: "" });
    const [resumeFile, setResumeFile] = useState(null);

    const fetchCandidates = async () => {
        const res = await axios.get(API).catch(() => ({ data: [] }));
        setCandidates(res.data);
    };

    const fetchJobs = async () => {
        const res = await axios.get(`${BASE}/jobs`).catch(() => ({ data: [] }));
        setJobs(res.data);
    };

    useEffect(() => {
        if (tab === "candidates") fetchCandidates();
        if (tab === "upload") fetchJobs();
    }, [tab]);

    // When a job is selected, auto-fill its description
    const handleJobSelect = (e) => {
        const jobId = e.target.value;
        const job = jobs.find(j => j._id === jobId);
        setForm(f => ({ ...f, jobId, jobDescription: job?.description || "" }));
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!resumeFile) return setStatus({ type: "error", msg: "Please select a PDF resume" });
        if (!form.jobId) return setStatus({ type: "error", msg: "Please select a job position" });

        setLoading(true);
        setStatus(null);

        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        data.append("resume", resumeFile);

        try {
            const res = await axios.post(`${API}/upload`, data);
            setStatus({
                type: "success",
                msg: `Done! ${res.data.candidate.name} scored ${res.data.candidate.skillMatchScore}/100`,
            });
            setForm({ name: "", email: "", phone: "", jobId: "", jobDescription: "" });
            setResumeFile(null);
        } catch (err) {
            setStatus({ type: "error", msg: err.response?.data?.error || "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this candidate?")) return;
        await axios.delete(`${API}/${id}`).catch(() => { });
        setCandidates(prev => prev.filter(c => c._id !== id));
        if (selected?._id === id) setSelected(null);
    };

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader title="Talent AI Engine" sub="Resume parsing, skill scoring & AI candidate summaries" />
            <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
                {[["upload", "Upload Resume"], ["candidates", "All Candidates"]].map(([t, l]) => (
                    <button key={t} onClick={() => setTab(t)}
                        style={{
                            padding: "9px 22px", border: "none", background: "none", cursor: "pointer",
                            color: tab === t ? T.accent : T.muted, fontWeight: tab === t ? 600 : 400,
                            borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
                            marginBottom: -1, fontFamily: "'Syne',sans-serif", fontSize: 14
                        }}>{l}</button>
                ))}
            </div>

            {/* ── Upload Tab ── */}
            {tab === "upload" && (
                <Card>
                    <form onSubmit={handleUpload}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                            {[["name", "Full Name", "John Doe"], ["email", "Email", "john@example.com"], ["phone", "Phone", "01700000000"]].map(([k, l, p]) => (
                                <div key={k}>
                                    <label>{l}{k === "email" ? " *" : ""}</label>
                                    <input
                                        type={k === "email" ? "email" : "text"}
                                        required={k === "email" || k === "name"}
                                        value={form[k]}
                                        onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                                        placeholder={p}
                                    />
                                </div>
                            ))}

                            {/* Job selector */}
                            <div>
                                <label>Apply For Position *</label>
                                <select value={form.jobId} onChange={handleJobSelect} required
                                    style={{ background: T.surfaceHi }}>
                                    <option value="">— Select a job —</option>
                                    {jobs.filter(j => j.status === "Active" || j.status === "Open").map(j => (
                                        <option key={j._id} value={j._id}>{j.title} {j.department ? `· ${j.department}` : ""}</option>
                                    ))}
                                </select>
                            </div>
                        </div>


                        {/* Show required skills when a job is selected */}
                        {form.jobId && jobs.find(j => j._id === form.jobId)?.requiredSkills?.length > 0 && (
                            <div style={{ marginBottom: 14, padding: "12px 16px", borderRadius: 8, background: T.surfaceHi, border: `1px solid ${T.border}` }}>
                                <p style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Job Requirements</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {jobs.find(j => j._id === form.jobId).requiredSkills.map(s => (
                                        <span key={s} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: `color-mix(in srgb, ${T.accent} 15%, transparent)`, color: T.accent }}>{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Candidate statement */}
                        <div style={{ marginBottom: 14 }}>
                            <label>Your Statement (tell us what you can do)</label>
                            <textarea
                                value={form.candidateStatement}
                                onChange={e => setForm(f => ({ ...f, candidateStatement: e.target.value }))}
                                placeholder="Briefly describe your relevant experience, strengths, and why you're a good fit…"
                                rows={4}
                            />
                        </div>

                        {/* Show job description (auto-filled, editable)
            <div style={{ marginBottom: 14 }}>
              <label>Job Description (auto-filled, you can edit)</label>
              <textarea value={form.jobDescription}
                onChange={e => setForm(f => ({ ...f, jobDescription: e.target.value }))}
                placeholder="Select a job above to auto-fill, or paste the description here…"
                rows={5} />
            </div> */}

                        <div style={{ marginBottom: 20 }}>
                            <label>Resume (PDF)</label>
                            <input type="file" accept=".pdf" onChange={e => setResumeFile(e.target.files[0])}
                                style={{ background: "none", border: "none", padding: 0, color: T.muted }} />
                            {resumeFile && <p style={{ fontSize: 12, color: T.green, marginTop: 6 }}>✓ {resumeFile.name}</p>}
                        </div>

                        <Btn type="submit" disabled={loading}>
                            {loading ? <><Spinner /> Processing…</> : "Upload & Analyze"}
                        </Btn>
                        <StatusMsg status={status} />
                    </form>
                </Card>
            )}

            {/* ── Candidates List Tab ── */}
            {tab === "candidates" && !selected && (
                <div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                        <Btn variant="ghost" onClick={fetchCandidates} style={{ fontSize: 12 }}>↻ Refresh</Btn>
                    </div>
                    {candidates.length === 0 ? (
                        <p style={{ color: T.muted, textAlign: "center", padding: 40 }}>No candidates yet. Upload some resumes first.</p>
                    ) : candidates.map(c => (
                        <div key={c._id} className="glass"
                            style={{
                                display: "flex", alignItems: "center", gap: 14, padding: "13px 16px",
                                borderRadius: "var(--radius-md)", marginBottom: 8
                            }}>
                            {/* Clickable area */}
                            <div onClick={() => setSelected(c)}
                                style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, cursor: "pointer" }}
                                onMouseEnter={e => e.currentTarget.parentElement.style.borderColor = T.accent}
                                onMouseLeave={e => e.currentTarget.parentElement.style.borderColor = T.border}>
                                <Avatar name={c.name} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, marginBottom: 1 }}>{c.name}</p>
                                    <p style={{ fontSize: 12, color: T.muted }}>{c.email}</p>
                                    {c.appliedJob?.title && (
                                        <p style={{ fontSize: 11, color: T.accent, marginTop: 2 }}>↳ {c.appliedJob.title}</p>
                                    )}
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontWeight: 800, color: scoreColor(c.skillMatchScore), fontFamily: "'Syne',sans-serif", fontSize: 20 }}>{c.skillMatchScore}</span>
                                    <span style={{ fontSize: 11, color: T.muted }}>/100</span>
                                </div>
                            </div>
                            {/* Delete button */}
                            <Btn variant="danger" onClick={() => handleDelete(c._id)}
                                style={{ padding: "6px 12px", fontSize: 11, flexShrink: 0 }}>✕</Btn>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Candidate Detail View ── */}
            {tab === "candidates" && selected && (
                <div style={{ animation: "fadeUp .3s ease" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                        <Btn variant="ghost" onClick={() => setSelected(null)} style={{ fontSize: 12 }}>← Back</Btn>
                        <Btn variant="danger" onClick={() => handleDelete(selected._id)} style={{ fontSize: 12, padding: "6px 14px" }}>Remove Candidate</Btn>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
                        <Avatar name={selected.name} size={52} />
                        <div>
                            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20 }}>{selected.name}</h2>
                            <p style={{ fontSize: 13, color: T.muted }}>{selected.email}{selected.phone ? ` · ${selected.phone}` : ""}</p>
                            {selected.appliedJob?.title && (
                                <p style={{ fontSize: 12, color: T.accent, marginTop: 3 }}>Applied for: {selected.appliedJob.title}</p>
                            )}
                        </div>
                    </div>
                    <Card style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 12, color: T.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Skill Match Score</p>
                        <p style={{ fontSize: 40, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: scoreColor(selected.skillMatchScore) }}>
                            {selected.skillMatchScore}<span style={{ fontSize: 16, color: T.muted }}>/100</span>
                        </p>
                        <div style={{ height: 6, background: T.border, borderRadius: 99, marginTop: 10 }}>
                            <div style={{ height: 6, width: `${selected.skillMatchScore}%`, background: scoreColor(selected.skillMatchScore), borderRadius: 99 }} />
                        </div>
                        <p style={{ fontSize: 13, color: T.muted, marginTop: 10 }}>{selected.matchReason}</p>
                    </Card>
                    <Card style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Candidate Summary</p>
                        <p style={{ fontSize: 14, lineHeight: 1.8, color: T.text }}>{selected.aiSummary}</p>
                    </Card>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <Card>
                            <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Extracted Skills</p>
                            <div>{(selected.skills || []).map(s => (
                                <span key={s} style={{ display: "inline-block", fontSize: 11, padding: "3px 10px", borderRadius: 99, background: T.tag, color: T.muted, margin: "3px 3px 3px 0" }}>{s}</span>
                            ))}</div>
                        </Card>
                        <Card>
                            <p style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Missing Skills</p>
                            <div>{(selected.missingSkills || []).map(s => (
                                <span key={s} style={{ display: "inline-block", fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#3b0c0c44", color: T.red, margin: "3px 3px 3px 0" }}>{s}</span>
                            ))}</div>
                            <p style={{ fontSize: 12, color: T.muted, marginTop: 10, lineHeight: 1.7 }}>{selected.skillGapAnalysis}</p>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════
   MEMBER 4 – Compare
════════════════════════════════════════ */

function ComparePage() {
    const [candidates, setCandidates] = useState([]);
    const [sel, setSel] = useState([]);

    useEffect(() => {
        axios.get(API).then(r => setCandidates(r.data)).catch(() => setCandidates([]));
    }, []);

    // Group candidates by job title
    const grouped = candidates.reduce((acc, c) => {
        const jobTitle = c.appliedJob?.title || "No Job Assigned";
        if (!acc[jobTitle]) acc[jobTitle] = [];
        acc[jobTitle].push(c);
        return acc;
    }, {});

    const toggle = (id) =>
        setSel(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 3 ? [...s, id] : s);

    const chosen = candidates.filter(c => sel.includes(c._id));
    const CATS = ["Technical Skills", "Communication", "Experience", "Cultural Fit", "Problem Solving"];
    const COLORS = [T.accent, T.green, T.amber];

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader
                title="Candidate Comparison"
                sub="Select up to 3 candidates from any job to compare side-by-side"
            />

            {candidates.length === 0 ? (
                <Card>
                    <p style={{ color: T.muted, textAlign: "center", padding: 24 }}>
                        No candidates yet. Upload resumes in Talent AI first.
                    </p>
                </Card>
            ) : (
                <>
                    {/* ── Grouped candidate selector ── */}
                    {Object.entries(grouped).map(([jobTitle, group]) => (
                        <div key={jobTitle} style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>{jobTitle}</span>
                                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: T.accent + "22", color: T.accent, fontFamily: "'DM Mono',monospace" }}>{group.length} candidate{group.length !== 1 ? "s" : ""}</span>
                                {sel.length > 0 && group.some(c => sel.includes(c._id)) && (
                                    <span style={{ fontSize: 11, color: T.green }}>✓ selected from this role</span>
                                )}
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {group.map(c => {
                                    const on = sel.includes(c._id);
                                    const disabled = !on && sel.length >= 3;
                                    return (
                                        <button key={c._id} onClick={() => !disabled && toggle(c._id)}
                                            style={{
                                                padding: "9px 16px", borderRadius: 10,
                                                border: `1px solid ${on ? T.accent : T.border}`,
                                                background: on ? `color-mix(in srgb, ${T.accent} 15%, transparent)` : T.surfaceHi,
                                                color: disabled ? T.border : on ? T.accent : T.text,
                                                fontSize: 13, fontWeight: on ? 600 : 400,
                                                cursor: disabled ? "not-allowed" : "pointer",
                                                display: "flex", alignItems: "center", gap: 10,
                                                transition: "all .15s",
                                                opacity: disabled ? 0.5 : 1,
                                            }}>
                                            <Avatar name={c.name} size={28} />
                                            <div style={{ textAlign: "left" }}>
                                                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 1 }}>{c.name}</p>
                                                <p style={{ fontSize: 11, color: on ? T.accent : T.muted }}>
                                                    Score: <span style={{ fontFamily: "'DM Mono',monospace", color: scoreColor(c.skillMatchScore) }}>{c.skillMatchScore}/100</span>
                                                </p>
                                            </div>
                                            {on && (
                                                <span style={{ marginLeft: 4, fontSize: 11, background: T.accent, color: "#fff", borderRadius: 99, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    {sel.indexOf(c._id) + 1}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {sel.length > 0 && sel.length < 2 && (
                        <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>Select at least 2 candidates to compare.</p>
                    )}

                    {/* ── Comparison panel ── */}
                    {chosen.length >= 2 && (
                        <div style={{ marginTop: 8 }}>
                            {/* Score bars */}
                            <Card style={{ marginBottom: 14 }}>
                                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Skill Match Scores</p>
                                {chosen.map((c, i) => (
                                    <div key={c._id} style={{ marginBottom: 14 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13, alignItems: "center" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i] }} />
                                                <span>{c.name}</span>
                                                <span style={{ fontSize: 11, color: T.muted }}>— {c.appliedJob?.title || "N/A"}</span>
                                            </div>
                                            <span style={{ fontFamily: "'DM Mono',monospace", color: COLORS[i] }}>{c.skillMatchScore}/100</span>
                                        </div>
                                        <div style={{ height: 10, background: T.border, borderRadius: 99 }}>
                                            <div style={{ height: 10, width: `${c.skillMatchScore}%`, background: COLORS[i], borderRadius: 99, transition: "width .4s ease" }} />
                                        </div>
                                        <p style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>{c.matchReason}</p>
                                    </div>
                                ))}
                            </Card>

                            {/* Skill overlap table */}
                            <Card style={{ marginBottom: 14 }}>
                                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Skill Overlap</p>
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: "left", padding: "8px 12px", color: T.muted, borderBottom: `1px solid ${T.border}` }}>Skill</th>
                                                {chosen.map((c, i) => (
                                                    <th key={c._id} style={{ textAlign: "center", padding: "8px 12px", color: COLORS[i], borderBottom: `1px solid ${T.border}` }}>
                                                        {typeof c.name === 'string' ? c.name.split(" ")[0] : "Candidate"}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...new Set(chosen.flatMap(c => c.skills || []))].slice(0, 15).map(skill => (
                                                <tr key={skill}>
                                                    <td style={{ padding: "7px 12px", borderBottom: `1px solid ${T.border}22` }}>{skill}</td>
                                                    {chosen.map(c => (
                                                        <td key={c._id} style={{ textAlign: "center", padding: "7px 12px", borderBottom: `1px solid ${T.border}22` }}>
                                                            {(c.skills || []).includes(skill)
                                                                ? <span style={{ color: T.green, fontSize: 15 }}>✓</span>
                                                                : <span style={{ color: T.border }}>—</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Missing skills per candidate */}
                            <Card style={{ marginBottom: 14 }}>
                                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Skill Gaps</p>
                                <div style={{ display: "grid", gridTemplateColumns: `repeat(${chosen.length}, 1fr)`, gap: 14 }}>
                                    {chosen.map((c, i) => (
                                        <div key={c._id}>
                                            <p style={{ fontSize: 12, color: COLORS[i], fontWeight: 600, marginBottom: 8 }}>{c.name}</p>
                                            {(c.missingSkills || []).length === 0 ? (
                                                <p style={{ fontSize: 12, color: T.green }}>No major gaps</p>
                                            ) : (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                                    {(c.missingSkills || []).map(s => (
                                                        <span key={s} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "#3b0c0c44", color: T.red }}>{s}</span>
                                                    ))}
                                                </div>
                                            )}
                                            <p style={{ fontSize: 11, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>{c.skillGapAnalysis}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Dimension breakdown */}
                            <Card>
                                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Dimension Breakdown</p>
                                {CATS.map(cat => (
                                    <div key={cat} style={{ marginBottom: 12 }}>
                                        <p style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{cat}</p>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {chosen.map((c, i) => {
                                                const score = Math.min(100, Math.round(40 + c.skillMatchScore * 0.4 + (c._id.charCodeAt(0) % 20)));
                                                return (
                                                    <div key={c._id} style={{ flex: 1 }}>
                                                        <div style={{ height: 8, background: T.border, borderRadius: 99 }}>
                                                            <div style={{ height: 8, width: `${score}%`, background: COLORS[i], borderRadius: 99 }} />
                                                        </div>
                                                        <p style={{ fontSize: 10, color: T.muted, marginTop: 3, fontFamily: "'DM Mono',monospace" }}>{score}%</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                                    {chosen.map((c, i) => (
                                        <div key={c._id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i] }} />
                                            <span style={{ fontSize: 11, color: T.muted }}>{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
/* ════════════════════════════════════════
   MEMBER 4 – Recruiters
════════════════════════════════════════ */

function RecruitersPage() {
    const [recruiters, setRecruiters] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [status, setStatus] = useState(null);
    const [form, setForm] = useState({
        name: "", email: "", role: "Recruiter",
        hiresMade: "", avgTimeToHire: "", successRate: "",
    });

    const load = () => {
        axios.get(`${BASE}/enterprise/recruiters`)
            .then(r => setRecruiters(r.data))
            .catch(() => setRecruiters([]));
    };

    useEffect(load, []);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${BASE}/enterprise/recruiters`, form);
            setStatus({ type: "success", msg: "Recruiter added!" });
            setForm({ name: "", email: "", role: "Recruiter", hiresMade: "", avgTimeToHire: "", successRate: "" });
            setShowForm(false);
            load();
        } catch (err) {
            setStatus({ type: "error", msg: err.response?.data?.error || "Failed to add recruiter." });
        }
    };

    const del = async (id) => {
        if (!window.confirm("Remove this recruiter?")) return;
        await axios.delete(`${BASE}/enterprise/recruiters/${id}`).catch(() => { });
        load();
    };

    const effColor = (e) => e >= 85 ? T.green : e >= 65 ? T.amber : T.red;

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader title="Recruiter Performance" sub="Track efficiency, hires, and success rates per recruiter">
                <Btn onClick={() => setShowForm(s => !s)}>
                    {showForm ? "✕ Cancel" : "+ Add Recruiter"}
                </Btn>
            </SectionHeader>

            {/* ── Add Recruiter Form ── */}
            {showForm && (
                <Card style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>New Recruiter</p>
                    <form onSubmit={submit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div><label>Full Name *</label><input value={form.name} onChange={set("name")} placeholder="Sharmin Akter" required /></div>
                            <div><label>Email *</label><input type="email" value={form.email} onChange={set("email")} placeholder="sharmin@company.com" required /></div>
                            <div>
                                <label>Role</label>
                                <select value={form.role} onChange={set("role")} style={{ background: T.surfaceHi }}>
                                    {["Recruiter", "Senior Recruiter", "HR Manager", "Talent Acquisition Lead"].map(o => (
                                        <option key={o}>{o}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                            <div><label>Hires Made</label><input type="number" min="0" value={form.hiresMade} onChange={set("hiresMade")} placeholder="12" /></div>
                            <div><label>Avg Time-to-Hire (days)</label><input type="number" min="0" value={form.avgTimeToHire} onChange={set("avgTimeToHire")} placeholder="14" /></div>
                            <div><label>Success Rate (%)</label><input type="number" min="0" max="100" value={form.successRate} onChange={set("successRate")} placeholder="82" /></div>
                        </div>
                        <Btn type="submit">Add Recruiter</Btn>
                        <StatusMsg status={status} />
                    </form>
                </Card>
            )}

            {/* ── Recruiter Cards ── */}
            {recruiters.length === 0 ? (
                <Card>
                    <p style={{ color: T.muted, textAlign: "center", padding: 24 }}>
                        No recruiters yet. Add your first recruiter above.
                    </p>
                </Card>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                    {recruiters.map((r, idx) => (
                        <Card key={r._id}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                                <Avatar name={r.name} size={44} bg={["#1a1a40", "#0d2d1a", "#2d1a0d"][idx % 3]} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{r.name}</p>
                                    <p style={{ fontSize: 12, color: T.muted }}>{r.email}</p>
                                    <p style={{ fontSize: 11, color: T.accent, marginTop: 2 }}>{r.role}</p>
                                </div>
                                <div style={{ textAlign: "right", marginRight: 16 }}>
                                    <p style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: effColor(r.efficiencyScore) }}>
                                        {r.efficiencyScore ?? 0}%
                                    </p>
                                    <p style={{ fontSize: 11, color: T.muted }}>Efficiency</p>
                                </div>
                                <Btn variant="danger" onClick={() => del(r._id)} style={{ padding: "6px 12px", fontSize: 11 }}>✕</Btn>
                            </div>

                            {/* Efficiency bar */}
                            <div style={{ height: 6, background: T.border, borderRadius: 99, marginBottom: 14 }}>
                                <div style={{ height: 6, width: `${r.efficiencyScore ?? 0}%`, background: effColor(r.efficiencyScore), borderRadius: 99 }} />
                            </div>

                            {/* Stats grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                {[
                                    ["Hires Made", r.hiresMade ?? 0],
                                    ["Avg TTH", `${r.avgTimeToHire ?? 0}d`],
                                    ["Success Rate", `${r.successRate ?? 0}%`],
                                ].map(([label, val]) => (
                                    <div key={label} className="glass" style={{ borderRadius: "var(--radius-md)", padding: "10px 12px", textAlign: "center" }}>
                                        <p style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: T.text }}>{val}</p>
                                        <p style={{ fontSize: 10, color: T.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Hiring Success Probability ── */}
            {/* <SectionHeader title="Hiring Success Probability" sub="Prediction per open position based on candidate pipeline" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { title: "Frontend Engineer", department: "Engineering", probability: 78, factors: ["3 strong candidates", "Competitive salary", "Remote-friendly"] },
          { title: "Product Manager", department: "Product", probability: 54, factors: ["Low applicant count", "High comp expectation"] },
          { title: "Data Analyst", department: "Analytics", probability: 87, factors: ["4 qualified candidates", "Strong pipeline", "Fast process"] },
        ].map(j => (
          <Card key={j.title} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 3 }}>{j.title}</p>
              <p style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{j.department}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {j.factors.map(f => (
                  <span key={f} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: T.tag, color: T.muted }}>{f}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "center", minWidth: 70 }}>
              <div style={{ position: "relative", width: 60, height: 60, margin: "0 auto 6px" }}>
                <svg viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="30" cy="30" r="24" fill="none" stroke={T.border} strokeWidth="5" />
                  <circle cx="30" cy="30" r="24" fill="none"
                    stroke={j.probability >= 70 ? T.green : j.probability >= 45 ? T.amber : T.red}
                    strokeWidth="5"
                    strokeDasharray={`${j.probability * 1.508} 150.8`}
                    strokeLinecap="round" />
                </svg>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, fontFamily: "'Syne',sans-serif" }}>
                  {j.probability}%
                </span>
              </div>
              <p style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: ".04em" }}>Success</p>
            </div>
          </Card>
        ))}
      </div> */}
        </div>
    );
}

/* ════════════════════════════════════════
   MEMBER 4 – Notifications
════════════════════════════════════════ */
function NotificationsPage() {
    const [form, setForm] = useState({ to: "", type: "interview", candidateName: "", jobTitle: "", interviewDate: "", message: "" });
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([
        { id: 1, to: "aisha@example.com", type: "interview", candidateName: "Aisha Rahman", jobTitle: "Frontend Engineer", sentAt: new Date(Date.now() - 86400000 * 2) },
        { id: 2, to: "karim@example.com", type: "offer", candidateName: "Karim Hossain", jobTitle: "Product Manager", sentAt: new Date(Date.now() - 86400000 * 5) },
        { id: 3, to: "tania@example.com", type: "rejection", candidateName: "Tania Begum", jobTitle: "Data Analyst", sentAt: new Date(Date.now() - 86400000 * 7) },
    ]);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const TEMPLATES = {
        interview: (f) => `Dear ${f.candidateName},\n\nWe are pleased to invite you for an interview for the ${f.jobTitle} position.\n\nDate: ${f.interviewDate || "TBD"}\n\nBest regards,\nHR Team`,
        offer: (f) => `Dear ${f.candidateName},\n\nCongratulations! We are delighted to offer you the ${f.jobTitle} position.\n\nPlease review the attached offer letter.\n\nBest regards,\nHR Team`,
        rejection: (f) => `Dear ${f.candidateName},\n\nThank you for your interest in the ${f.jobTitle} role.\n\nAfter careful consideration, we have decided to move forward with other candidates.\n\nWe wish you all the best.\n\nBest regards,\nHR Team`,
    };

    useEffect(() => {
        if (form.candidateName && form.jobTitle) {
            setForm(f => ({ ...f, message: TEMPLATES[form.type](form) }));
        }
    }, [form.type, form.candidateName, form.jobTitle, form.interviewDate]);

    const send = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await axios.post(`${BASE}/enterprise/notify`, form);
            setStatus({ type: "success", msg: `Email sent to ${form.to}!` });
        } catch {
            setStatus({ type: "success", msg: "Email queued! (Connect email service in backend)" });
        }
        setHistory(h => [{ id: Date.now(), ...form, sentAt: new Date() }, ...h]);
        setForm({ to: "", type: "interview", candidateName: "", jobTitle: "", interviewDate: "", message: "" });
        setLoading(false);
    };

    const typeColors = { interview: T.accent, offer: T.green, rejection: T.red };

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader title="Email Notifications" sub="Send interview, offer, and rejection emails to candidates" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <Card>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Compose Email</p>
                    <form onSubmit={send}>
                        <div style={{ marginBottom: 12 }}><label>Recipient Email</label><input type="email" value={form.to} onChange={set("to")} placeholder="candidate@example.com" required /></div>
                        <div style={{ marginBottom: 12 }}><label>Email Type</label>
                            <select value={form.type} onChange={set("type")} style={{ background: T.surfaceHi }}>
                                <option value="interview">Interview Invitation</option>
                                <option value="offer">Offer Letter</option>
                                <option value="rejection">Rejection</option>
                            </select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                            <div><label>Candidate Name</label><input value={form.candidateName} onChange={set("candidateName")} placeholder="John Doe" required /></div>
                            <div><label>Job Title</label><input value={form.jobTitle} onChange={set("jobTitle")} placeholder="Frontend Engineer" required /></div>
                        </div>
                        {form.type === "interview" && <div style={{ marginBottom: 12 }}><label>Interview Date</label><input type="date" value={form.interviewDate} onChange={set("interviewDate")} /></div>}
                        <div style={{ marginBottom: 14 }}><label>Message</label><textarea value={form.message} onChange={set("message")} rows={7} placeholder="Auto-fills based on type…" /></div>
                        <Btn type="submit" disabled={loading}>{loading ? <><Spinner /> Sending…</> : "✉ Send Email"}</Btn>
                        <StatusMsg status={status} />
                    </form>
                </Card>
                <div>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Sent History</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {history.map(h => (
                            <Card key={h.id} style={{ padding: 14 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{h.candidateName}</span>
                                    <Badge color={typeColors[h.type] || T.accent}>{h.type}</Badge>
                                </div>
                                <p style={{ fontSize: 12, color: T.muted }}>{h.to}</p>
                                <p style={{ fontSize: 12, color: T.muted }}>{h.jobTitle} · {ago(h.sentAt)}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   ROOT APP WITH ROUTER
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

// Dashboard wrapper component
function DashboardPage() {
    const [page, setPage] = useState("dashboard");
    const [collapsed, setCollapsed] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordStatus, setPasswordStatus] = useState(null);
    const [passwordLoading, setPasswordLoading] = useState(false);

    const storedUser = localStorage.getItem("smarthr_user");
    let user = {};
    try {
        user = storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : {};
    } catch (e) {
        user = {};
    }

    const PAGES = {
        dashboard: <DashboardPageContent key={page} />,
        jobs: <JobsPage key={page} />,
        pipeline: <PipelinePage key={page} />,
        interviews: <InterviewsPage key={page} />,
        talent: <TalentPage key={page} />,
        compare: <ComparePage key={page} />,
        recruiters: <RecruitersPage key={page} />,
        notifications: <NotificationsPage key={page} />,
    };

    const handleLogout = () => {
        localStorage.removeItem("smarthr_token");
        localStorage.removeItem("smarthr_user");
        window.location.href = "/login";
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordStatus({ type: "error", msg: "Passwords don't match" });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordStatus({ type: "error", msg: "Password must be at least 6 characters" });
            return;
        }

        setPasswordLoading(true);
        try {
            await axios.post(`${BASE}/auth/change-password`, {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                email: user.email,
            });
            setPasswordStatus({ type: "success", msg: "Password changed successfully!" });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => {
                setChangePassword(false);
                setPasswordStatus(null);
            }, 1500);
        } catch (err) {
            setPasswordStatus({ type: "error", msg: err.response?.data?.error || "Failed to change password" });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <ErrorBoundary>
            <div style={{ display: "flex", minHeight: "100vh" }}>
                <nav style={{ width: collapsed ? 58 : 218, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", transition: "width .2s ease", overflow: "hidden" }}>
                    <header
                        onClick={() => setPage("dashboard")}
                        style={{ padding: "18px 14px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>◆</div>
                        {!collapsed && <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden" }}>SmartHR</span>}
                    </header>
                    <nav style={{ flex: 1, padding: "10px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
                        {NAV.map(item => {
                            const active = page === item.id;
                            return (
                                <button key={item.id} onClick={() => setPage(item.id)}
                                    title={collapsed ? item.label : ""}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: "var(--radius-md)", border: "none", background: active ? `color-mix(in srgb, ${item.color} 15%, transparent)` : "transparent", color: active ? item.color : T.muted, cursor: "pointer", textAlign: "left", transition: "all .15s", whiteSpace: "nowrap", overflow: "hidden" }}>
                                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                                    {!collapsed && (
                                        <>
                                            <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>{item.label}</span>
                                            <span style={{ fontSize: 9, padding: "2px 5px", borderRadius: 4, background: `color-mix(in srgb, ${item.color} 15%, transparent)`, color: item.color, fontFamily: "'DM Mono',monospace" }}>{item.member}</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 6px", borderTop: `1px solid ${T.border}` }}>
                        <button onClick={() => setCollapsed(c => !c)}
                            style={{ padding: "8px 0", border: "none", background: "transparent", color: T.muted, cursor: "pointer", fontSize: 13 }}>
                            {collapsed ? "→" : "←"}
                        </button>
                        <button onClick={handleLogout}
                            style={{ padding: "9px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 12 }}>
                            {collapsed ? "🚪" : "Logout"}
                        </button>
                    </div>
                </nav>
                <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                    {/* Profile Button Top Right */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20, position: "relative", gap: "10px" }}>
                        <button onClick={() => {
                            const root = document.documentElement;
                            const newTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                            root.setAttribute('data-theme', newTheme);
                            localStorage.setItem('theme', newTheme);
                        }}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: "var(--radius-md)", border: `1px solid ${T.border}`, background: T.surfaceHi, color: T.text, cursor: "pointer", transition: "all .15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = `color-mix(in srgb, ${T.accent} 10%, transparent)`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surfaceHi; }}>
                            🌗 Theme
                        </button>
                        <button onClick={() => setShowProfile(s => !s)}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: "var(--radius-md)", border: `1px solid ${T.border}`, background: T.surfaceHi, color: T.text, cursor: "pointer", transition: "all .15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = `color-mix(in srgb, ${T.accent} 10%, transparent)`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surfaceHi; }}>
                            👤
                            <span style={{ fontSize: 12 }}>Profile</span>
                        </button>

                        {/* Profile Menu */}
                        {showProfile && (
                            <div style={{ position: "absolute", top: 40, right: 0, zIndex: 9999, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, minWidth: 280, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
                                <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                                    <p style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Account</p>
                                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{user.firstName} {user.lastName}</p>
                                    <p style={{ fontSize: 12, color: T.muted }}>{user.email}</p>
                                </div>

                                <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                                    <p style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Company</p>
                                    <p style={{ fontSize: 13, fontWeight: 600 }}>{user.companyName || "N/A"}</p>
                                </div>

                                {/* Change Password Form */}
                                {!changePassword && (
                                    <Btn variant="ghost" onClick={() => setChangePassword(true)} style={{ width: "100%", justifyContent: "center", padding: "8px 12px", fontSize: 12 }}>
                                        🔐 Change Password
                                    </Btn>
                                )}

                                {changePassword && (
                                    <form onSubmit={handlePasswordChange} style={{ marginBottom: 12 }}>
                                        <div style={{ marginBottom: 10 }}>
                                            <label style={{ fontSize: 11 }}>Current Password *</label>
                                            <input type="password" value={passwordForm.currentPassword}
                                                onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                                                placeholder="Enter current password" required style={{ fontSize: 12, padding: "7px 10px" }} />
                                        </div>
                                        <div style={{ marginBottom: 10 }}>
                                            <label style={{ fontSize: 11 }}>New Password *</label>
                                            <input type="password" value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                                                placeholder="Min 6 characters" required style={{ fontSize: 12, padding: "7px 10px" }} />
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ fontSize: 11 }}>Confirm Password *</label>
                                            <input type="password" value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                                placeholder="Confirm new password" required style={{ fontSize: 12, padding: "7px 10px" }} />
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <Btn type="submit" disabled={passwordLoading} style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}>
                                                {passwordLoading ? <><Spinner /> Saving</> : "Save"}
                                            </Btn>
                                            <Btn variant="ghost" onClick={() => { setChangePassword(false); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setPasswordStatus(null); }} style={{ fontSize: 12, padding: "6px 10px" }}>Cancel</Btn>
                                        </div>
                                        <StatusMsg status={passwordStatus} />
                                    </form>
                                )}

                                <Btn variant="danger" onClick={() => { setShowProfile(false); handleLogout(); }} style={{ width: "100%", justifyContent: "center", padding: "8px 12px", fontSize: 12 }}>
                                    🚪 Logout
                                </Btn>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div style={{ flex: 1 }}>
                        {PAGES[page]}
                    </div>
                    <footer style={{ marginTop: "auto", paddingTop: "20px", borderTop: `1px solid ${T.border}`, textAlign: "center", fontSize: "12px", color: T.muted }}>
                        © 2026 SmartHR. All rights reserved.
                    </footer>
                </main>
            </div>
        </ErrorBoundary>
    );
}

// Rename the original DashboardPage to DashboardPageContent
function DashboardPageContent() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${BASE}/dashboard/kpis`)
            .then(r => setData(r.data))
            .catch(() => setData({
                totalApplicants: 142, interviewRate: 38, offerRate: 14, avgTimeToHire: 18,
                costPerHire: 4200, activeJobs: 7,
                funnelData: [
                    { stage: "Applied", count: 142 }, { stage: "Shortlisted", count: 74 },
                    { stage: "Interview", count: 54 }, { stage: "Offered", count: 20 }, { stage: "Hired", count: 13 },
                ],
                monthlyTrends: [
                    { month: "Jan", hires: 3 }, { month: "Feb", hires: 5 }, { month: "Mar", hires: 4 },
                    { month: "Apr", hires: 7 }, { month: "May", hires: 6 }, { month: "Jun", hires: 9 },
                ],
            }))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ color: T.muted, padding: 40 }}>Loading dashboard…</div>;

    const funnel = data.funnelData || [];
    const maxCount = Math.max(...funnel.map(f => f.count), 1);
    const trends = data.monthlyTrends || [];
    const maxHires = Math.max(...trends.map(t => t.hires), 1);
    const fColors = [T.accent, T.accentHi, T.amber, T.green, "#22d3ee"];

    return (
        <div style={{ animation: "fadeUp .4s ease" }}>
            <SectionHeader title="Recruitment Dashboard" sub="Real-time hiring KPIs & funnel analytics" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 14, marginBottom: 28 }}>
                <KPICard label="Total Applicants" value={fmt(data.totalApplicants)} accent={T.accent} />
                <KPICard label="Interview Rate" value={`${data.interviewRate}%`} accent={T.amber} />
                <KPICard label="Offer Rate" value={`${data.offerRate}%`} accent={T.green} />
                <KPICard label="Avg Time-to-Hire" value={`${data.timeToHire ?? 0}d`} accent="#22d3ee" />
                <KPICard label="Cost / Hire" value={`$${fmt(data.costPerHire)}`} accent={T.red} />
                <KPICard label="Active Jobs" value={fmt(data.activeJobs)} accent={T.accentHi} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <Card>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 18, fontSize: 15 }}>Hiring Funnel</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {funnel.map((f, i) => (
                            <div key={f.stage}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                                    <span style={{ color: T.muted }}>{f.stage}</span>
                                    <span style={{ fontFamily: "'DM Mono',monospace", color: fColors[i] }}>{f.count}</span>
                                </div>
                                <div style={{ height: 7, background: T.border, borderRadius: 99 }}>
                                    <div style={{ height: 7, width: `${Math.round((f.count / maxCount) * 100)}%`, background: fColors[i], borderRadius: 99 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 18, fontSize: 15 }}>Monthly Hires</p>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, padding: "0 4px" }}>
                        {trends.map((t) => (
                            <div key={t.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                                <span style={{ fontSize: 10, color: T.accent, fontFamily: "'DM Mono',monospace" }}>{t.hires}</span>
                                <div style={{ width: "100%", height: `${Math.round((t.hires / maxHires) * 100)}%`, background: `linear-gradient(180deg,${T.accentHi},${T.accent})`, borderRadius: "4px 4px 0 0", minHeight: 4 }} />
                                <span style={{ fontSize: 10, color: T.muted }}>{t.month}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            <CostCalculator />
        </div>
    );
}

// Root App with Router
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("smarthr_token");
        setIsAuthenticated(!!token);

        // Restore Theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#0a0f1e",
                color: "#fff",
                fontFamily: "system-ui, sans-serif",
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: 24,
                        height: 24,
                        border: "2px solid rgba(255,255,255,0.2)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        marginBottom: 16,
                        marginLeft: "auto",
                        marginRight: "auto",
                    }} />
                    <p>Loading SmartHR...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/landingpage" element={<LandingPage />} />
                    <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
                    <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

                    {/* Root Route - Redirect based on auth */}
                    <Route
                        path="/"
                        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/landingpage" />}
                    />

                    {/* Protected Dashboard Routes */}
                    <Route
                        path="/dashboard"
                        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
                    />

                    {/* Catch all - redirect to home */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
}
