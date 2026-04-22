"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Trash2, RefreshCw, X, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getCandidates, addCandidate, updateCandidate, deleteCandidate } from "@/lib/api";

const STATUSES = ["applied", "shortlisted", "interview", "offered", "hired", "rejected"];

const STATUS_COLORS: any = {
  applied: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  shortlisted: { bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
  interview: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  offered: { bg: "rgba(20,184,166,0.15)", color: "#14b8a6" },
  hired: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  rejected: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    candidate_name: "", job_title: "", status: "applied",
    hiring_cost: "", applied_date: "", hired_date: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("smarthr_token");
    if (!token) { router.replace("/login"); return; }
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCandidates();
      setCandidates(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await addCandidate({
        ...form,
        hiring_cost: Number(form.hiring_cost) || 0,
      });
      setShowModal(false);
      setForm({ candidate_name: "", job_title: "", status: "applied", hiring_cost: "", applied_date: "", hired_date: "" });
      loadCandidates();
    } catch (err: any) {
      setError(err?.message || "Failed to add candidate");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateCandidate(id, { status });
      loadCandidates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    try {
      await deleteCandidate(id);
      loadCandidates();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = candidates.filter(c =>
    c.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  const s = {
    page: { display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif" } as React.CSSProperties,
    main: { flex: 1, display: "flex", flexDirection: "column" as const, overflowY: "auto" as const },
    topbar: { background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, zIndex: 10 },
    content: { padding: "28px", display: "flex", flexDirection: "column" as const, gap: "20px" },
    btn: { display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", color: "#fff", fontSize: "13px", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontFamily: "'Segoe UI', system-ui, sans-serif" } as React.CSSProperties,
    searchBox: { display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 16px" },
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { textAlign: "left" as const, padding: "12px 16px", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "rgba(255,255,255,0.3)", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.07)" },
    td: { padding: "14px 16px", fontSize: "14px", color: "rgba(255,255,255,0.8)", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  };

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Candidates</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{candidates.length} total</div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadCandidates} style={{ ...s.btn, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowModal(true)} style={s.btn}>
              <UserPlus size={14} />
              Add candidate
            </button>
          </div>
        </div>

        <div style={s.content}>
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.14)",
              border: "1px solid rgba(239,68,68,0.35)",
              color: "#fecaca",
              borderRadius: "12px",
              padding: "12px 14px",
              fontSize: "13px",
            }}>
              {error}
            </div>
          )}

          {/* Search */}
          <div style={s.searchBox}>
            <Search size={16} color="rgba(255,255,255,0.3)" />
            <input
              placeholder="Search by name or job title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "#fff", flex: 1 }}
            />
          </div>

          {/* Table */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: "48px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Loading candidates...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No candidates found</div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>Name</th>
                    <th style={s.th}>Job title</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Applied date</th>
                    <th style={s.th}>Hiring cost</th>
                    <th style={s.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td style={s.td}>{c.candidate_name || "—"}</td>
                      <td style={s.td}>{c.job_title || "—"}</td>
                      <td style={s.td}>
                        <select
                          value={c.status}
                          onChange={e => handleStatusChange(c._id, e.target.value)}
                          style={{
                            background: STATUS_COLORS[c.status]?.bg,
                            color: STATUS_COLORS[c.status]?.color,
                            border: "none", borderRadius: "8px",
                            padding: "4px 10px", fontSize: "12px",
                            fontWeight: 600, cursor: "pointer", outline: "none",
                          }}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={s.td}>{c.applied_date ? new Date(c.applied_date).toLocaleDateString() : "—"}</td>
                      <td style={s.td}>${Number(c.hiring_cost || 0).toLocaleString()}</td>
                      <td style={s.td}>
                        <button onClick={() => handleDelete(c._id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "6px 10px", borderRadius: "8px", cursor: "pointer" }}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Add Candidate Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "460px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Add candidate</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Candidate name", name: "candidate_name", type: "text", placeholder: "John Doe" },
                { label: "Job title", name: "job_title", type: "text", placeholder: "Software Engineer" },
                { label: "Hiring cost ($)", name: "hiring_cost", type: "number", placeholder: "3000" },
                { label: "Applied date", name: "applied_date", type: "date", placeholder: "" },
              ].map((field) => (
                <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.name]}
                    onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#fff", outline: "none" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#fff", outline: "none" }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" style={{ ...s.btn, justifyContent: "center", padding: "12px", marginTop: "8px", fontSize: "14px" }}>
                Add candidate
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}