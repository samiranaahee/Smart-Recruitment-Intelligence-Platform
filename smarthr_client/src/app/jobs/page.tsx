"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, RefreshCw, X, Briefcase } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { getJobs, addJob, deleteJob } from "@/lib/api";

const STATUS_COLORS: any = {
  open: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  closed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  paused: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    job_title: "", department: "", location: "", status: "open", budget: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("smarthr_token");
    if (!token) { router.replace("/login"); return; }
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addJob({ ...form, budget: Number(form.budget) || 0 });
      setShowModal(false);
      setForm({ job_title: "", department: "", location: "", status: "open", budget: "" });
      loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    try {
      await deleteJob(id);
      loadJobs();
    } catch (err) {
      console.error(err);
    }
  };

  const s = {
    page: { display: "flex", minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif" } as React.CSSProperties,
    main: { flex: 1, display: "flex", flexDirection: "column" as const },
    topbar: { background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, zIndex: 10 },
    btn: { display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", color: "#fff", fontSize: "13px", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontFamily: "'Segoe UI', system-ui, sans-serif" } as React.CSSProperties,
  };

  return (
    <div style={s.page}>
      <Sidebar />
      <main style={s.main}>
        <div style={s.topbar}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Job postings</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{jobs.length} total</div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={loadJobs} style={{ ...s.btn, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setShowModal(true)} style={s.btn}>
              <Plus size={14} />
              Add job
            </button>
          </div>
        </div>

        <div style={{ padding: "28px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "16px" }}>
          {loading ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>No jobs posted yet</div>
          ) : jobs.map((job) => (
            <div key={job._id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Briefcase size={18} color="#3b82f6" />
                </div>
                <span style={{ background: STATUS_COLORS[job.status]?.bg, color: STATUS_COLORS[job.status]?.color, fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "8px" }}>
                  {job.status}
                </span>
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>{job.job_title}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                  {job.department && `${job.department} · `}{job.location || "Remote"}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                  Budget: <span style={{ color: "#10b981", fontWeight: 600 }}>${Number(job.budget || 0).toLocaleString()}</span>
                </div>
                <button onClick={() => handleDelete(job._id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", padding: "6px 10px", borderRadius: "8px", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#fff" }}>Add job posting</div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Job title", name: "job_title", placeholder: "Software Engineer" },
                { label: "Department", name: "department", placeholder: "Engineering" },
                { label: "Location", name: "location", placeholder: "Remote" },
                { label: "Budget ($)", name: "budget", placeholder: "5000" },
              ].map((field) => (
                <div key={field.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{field.label}</label>
                  <input
                    placeholder={field.placeholder}
                    value={(form as any)[field.name]}
                    onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#fff", outline: "none" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "#fff", outline: "none" }}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <button type="submit" style={{ ...s.btn, justifyContent: "center", padding: "12px", marginTop: "8px", fontSize: "14px" }}>
                Add job
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}