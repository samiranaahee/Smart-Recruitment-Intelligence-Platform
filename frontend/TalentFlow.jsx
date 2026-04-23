import React, { useState, useEffect, useCallback } from 'react';

// ─── helpers ───────────────────────────────────────────────────────────────

const API = 'http://localhost:3001/api';

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// avatar colour palette – deterministic from name
const AVATAR_COLORS = [
  '#60A5FA','#818CF8','#34D399','#F59E0B','#EC4899',
  '#A78BFA','#2DD4BF','#F87171','#6C63FF','#FBBF24',
];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// stage config
const STAGES = [
  { key: 'applied',     label: 'Applied',     color: '#60A5FA', textColor: '#2563EB' },
  { key: 'shortlisted', label: 'Shortlisted',  color: '#FBBF24', textColor: '#D97706' },
  { key: 'interview',   label: 'Interview',   color: '#A78BFA', textColor: '#7C3AED' },
  { key: 'offered',     label: 'Offered',     color: '#34D399', textColor: '#059669' },
  { key: 'hired',       label: 'Hired',       color: '#F87171', textColor: '#DC2626' },
];

const INTERVIEW_TYPE_STYLE = {
  Technical:   { bg: '#EFF6FF', color: '#2563EB' },
  'HR Round':  { bg: '#F5F3FF', color: '#7C3AED' },
  'Final Round':{ bg: '#FFF7ED', color: '#EA580C' },
  'Culture Fit':{ bg: '#F0FDF4', color: '#059669' },
};

// ─── sub-components ────────────────────────────────────────────────────────

const Avatar = React.memo(function Avatar({ name, size = 26 }) {
  const bg = avatarColor(name);
  const fontSize = size <= 26 ? 9 : size <= 32 ? 11 : 15;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
});

const StatCard = React.memo(function StatCard({ icon, value, label, iconBg, iconColor }) {
  return (
    <div style={{
      flex: 1, height: 60, background: '#fff', borderRadius: 8,
      border: '1px solid #DDE0EE', position: 'relative', display: 'flex',
      alignItems: 'center', gap: 10, padding: '0 14px',
    }}>
      <div style={{
        width: 30, height: 30, background: iconBg, borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill={iconColor}>
          <path d={icon} />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1E2035', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 10, color: '#8890AA' }}>{label}</div>
      </div>
    </div>
  );
});

const CandidateCard = React.memo(function CandidateCard({ candidate, onMove, stageIndex }) {
  const color = avatarColor(candidate.name);
  const score = candidate.match_score ?? 0;
  const applied = fmt(candidate.created_at);
  return (
    <div style={{
      background: '#fff', borderRadius: 7, border: '1px solid #DDE0EE',
      padding: '10px 10px 8px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', background: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {initials(candidate.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1E2035', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {candidate.name}
          </div>
          <div style={{ fontSize: 9, color: '#8890AA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {candidate.role || candidate.status}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: '#A0A5C0' }}>{applied}</span>
        <span style={{
          background: '#F0FDF4', color: '#059669', fontSize: 9, fontWeight: 700,
          borderRadius: 10, padding: '1px 7px',
        }}>{score}%</span>
      </div>

      {stageIndex < 4 && (
        <button
          onClick={() => onMove(candidate._id, stageIndex + 1)}
          style={{
            width: '100%', background: '#6C63FF', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 9, fontWeight: 600,
            padding: '5px 0', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 3,
          }}
        >
          → Move
        </button>
      )}
      {stageIndex === 4 && (
        <div style={{
          width: '100%', background: '#F0FDF4', color: '#059669',
          borderRadius: 5, fontSize: 9, fontWeight: 600,
          padding: '5px 0', textAlign: 'center',
        }}>✓ Hired</div>
      )}
    </div>
  );
});

const KanbanColumn = React.memo(function KanbanColumn({ stage, stageIndex, candidates, onMove }) {
  return (
    <div style={{
      flex: 1, background: '#E8EAF4', borderRadius: 8,
      minWidth: 0, position: 'relative', overflow: 'hidden',
    }}>
      {/* top accent bar */}
      <div style={{
        height: 4, background: stage.color,
        borderRadius: '8px 8px 0 0',
      }} />
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 10px 6px',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.7px', color: stage.textColor,
        }}>{stage.label}</span>
        <div style={{
          width: 20, height: 20, background: stage.color, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700,
          color: ['#FBBF24','#34D399'].includes(stage.color) ? '#1a1a1a' : '#fff',
        }}>{candidates.length}</div>
      </div>
      {/* cards */}
      <div style={{ padding: '0 8px 8px' }}>
        {candidates.length === 0 && (
          <div style={{ fontSize: 10, color: '#A0A5C0', textAlign: 'center', padding: '16px 0' }}>
            No candidates
          </div>
        )}
        {candidates.map(c => (
          <CandidateCard key={c._id} candidate={c} onMove={onMove} stageIndex={stageIndex} />
        ))}
      </div>
    </div>
  );
});

// ─── Calendar helpers ───────────────────────────────────────────────────────

function buildCalendar(year, month) {
  // month: 0-based
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0) { cells.push({ day: cells.length - daysInMonth - firstDay + 1, cur: false }); }
  return cells;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ─── Interview Card ─────────────────────────────────────────────────────────

const InterviewCard = React.memo(function InterviewCard({ interview, onConfirm, onEvaluate, onReschedule, onDelete }) {
  const typeStyle = INTERVIEW_TYPE_STYLE[interview.type] || { bg: '#F5F3FF', color: '#7C3AED' };
  const interviewers = interview.interviewers || [];
  const isZoom = interview.medium === 'Zoom';
  const isGoogleMeet = interview.medium === 'Google Meet';
  const isVideo = isZoom || isGoogleMeet;
  const mediumIcon = interview.medium === 'On-site' ? '🏢' : interview.medium === 'Zoom' ? '📹' : interview.medium === 'Phone' ? '📞' : '💻';

  const joinUrl =
    interview.zoom_join_url ||
    interview.zoomJoinUrl ||
    interview.google_meet_link ||
    interview.googleMeetLink ||
    null;

  const liveColor = isZoom ? '#2D8CFF' : '#1A73E8';
  const liveLabelText = isZoom ? '📹 Join Zoom' : '💻 Join Google Meet';
  const liveBgGradient = isZoom ? 'linear-gradient(135deg, #2D8CFF, #1a6fd4)' : 'linear-gradient(135deg, #1A73E8, #0d5bba)';

  return (
    <div style={{
      background: '#fff', borderRadius: 10, border: '1px solid #DDE0EE',
      padding: '14px 14px 12px', marginBottom: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E2035' }}>
          {interview.candidate_name || interview.candidateName || '—'}
        </div>
        <span style={{
          background: typeStyle.bg, color: typeStyle.color,
          borderRadius: 10, fontSize: 9, fontWeight: 700, padding: '3px 8px',
        }}>{interview.type}</span>
      </div>

      <div style={{ fontSize: 10, color: '#7A7F99', marginBottom: 8 }}>
        📅 {fmt(interview.scheduled_date)}, {fmtTime(interview.scheduled_date)}
        &nbsp;&nbsp;⏱ {interview.duration || 60} min
        &nbsp;&nbsp;{mediumIcon} {interview.medium}
      </div>

      {/* interviewer avatars */}
      {interviewers.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          {interviewers.slice(0, 3).map((iv, idx) => (
            <div key={idx} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
              border: idx > 0 ? '2px solid #fff' : 'none',
              marginLeft: idx > 0 ? -6 : 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: '#fff', zIndex: 3 - idx,
            }}>{iv.slice(0, 2).toUpperCase()}</div>
          ))}
          <span style={{ fontSize: 9, color: '#8890AA', marginLeft: 4 }}>
            {interviewers.length === 1 ? 'Interviewer' : `${interviewers.length} Interviewers`}
          </span>
        </div>
      )}

      {/* LIVE JOIN BUTTON — video interviews */}
      {isVideo && (
        joinUrl ? (
          <button
            type="button"
            onClick={() => window.open(joinUrl, '_blank', 'noopener,noreferrer')}
            style={{
              width: '100%', height: 36,
              background: liveBgGradient,
              color: '#fff', border: 'none', borderRadius: 7,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              marginBottom: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              boxShadow: `0 2px 8px ${liveColor}55`,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{
              width: 8, height: 8, background: '#FF4444', borderRadius: '50%',
              boxShadow: '0 0 6px #FF4444', display: 'inline-block',
              animation: 'livePulse 1.2s ease-in-out infinite',
            }} />
            LIVE · {liveLabelText}
          </button>
        ) : (
          <div style={{
            width: '100%', height: 34, background: '#F8FAFF',
            border: `1px dashed ${liveColor}66`,
            borderRadius: 7, fontSize: 10, color: '#7A7F99',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8, gap: 6,
          }}>
            <span style={{ fontSize: 12 }}>{isZoom ? '📹' : '💻'}</span>
            {isZoom ? 'Zoom' : 'Google Meet'} link will appear after scheduling
          </div>
        )
      )}

      {interview.status === 'completed' || interview.score ? (
        <div style={{ width: '100%', background: '#F0FDF4', color: '#059669', borderRadius: 6, fontSize: 10, fontWeight: 700, padding: '6px 0', textAlign: 'center' }}>
          ✓ Score: {interview.score}/100
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onConfirm(interview._id, !interview.confirmed)}
            style={{
              flex: 1, background: interview.confirmed ? '#059669' : '#6C63FF',
              color: '#fff', border: 'none', borderRadius: 6,
              fontSize: 10, fontWeight: 700, padding: '6px 0', cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {interview.confirmed ? '✓ Confirmed' : 'Confirm'}
          </button>
          {interview.confirmed && onEvaluate && (
            <button
              onClick={() => onEvaluate(interview)}
              style={{
                flex: 1, background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 10, fontWeight: 700, padding: '6px 0', cursor: 'pointer',
              }}
            >
              Evaluate
            </button>
          )}
          <button
            onClick={() => onReschedule(interview)}
            style={{
              flex: 1, background: '#F5F6FA', border: '1px solid #C8CCE0',
              borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#4A4F6A',
              padding: '6px 0', cursor: 'pointer',
            }}
          >
            ↺ Reschedule
          </button>
          <button
            onClick={() => { if (window.confirm('Delete this interview schedule?')) onDelete(interview._id); }}
            style={{
              width: 32, minWidth: 32, background: '#FEE2E2', border: '1px solid #FCA5A5',
              borderRadius: 6, fontSize: 13, color: '#DC2626',
              padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Delete Interview"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  );
});

// ─── Main App ───────────────────────────────────────────────────────────────

export default function TalentFlow() {
  const [page, setPage] = useState('dashboard');   // 'dashboard' | 'pipeline' | 'interviews'
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [token, setToken] = useState(null);

  // ── calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  // ── schedule modal
  const [showModal, setShowModal] = useState(false);
  const [newIv, setNewIv] = useState({ id: null, candidateId: '', date: '', time: '', type: 'Technical', medium: 'Google Meet', duration: 60 });

  const [jobs, setJobs] = useState([]);
  const [evalReport, setEvalReport] = useState({ statistics: {}, evaluations: [] });

  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', department: '', required_skills: '', status: 'open' });

  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', role: '', jobId: '', resumeUrl: '', matchScore: 0 });

  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalIv, setEvalIv] = useState(null);
  const [evalScores, setEvalScores] = useState({ technical: 0, communication: 0, problem_solving: 0, feedback: '' });


  // ── login / token ────────────────────────────────────────────────────────
  const login = useCallback(async () => {
    try {
      const r = await fetch(`${API}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!r.ok) throw new Error('Login failed');
      const d = await r.json();
      setToken(d.token);
      return d.token;
    } catch (e) {
      setError('Could not connect to backend. Is the server running on port 3001?');
      return null;
    }
  }, []);


  // ── fetch jobs & eval report ─────────────────────────────────────────────
  const fetchJobs = useCallback(async (tok) => {
    try {
      const r = await fetch(`${API}/jobs`, { headers: { Authorization: `Bearer ${tok}` } });
      if (r.ok) setJobs(await r.json());
    } catch (e) {}
  }, []);

  const fetchEvalReport = useCallback(async (tok) => {
    try {
      const r = await fetch(`${API}/interviews/evaluations/report`, { headers: { Authorization: `Bearer ${tok}` } });
      if (r.ok) setEvalReport(await r.json());
    } catch (e) {}
  }, []);

  // ── fetch candidates ─────────────────────────────────────────────────────
  const fetchCandidates = useCallback(async () => {
    try {
      const tok = token || await login();
      if (!tok) return;
      const r = await fetch(`${API}/candidates`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (!r.ok) throw new Error('Failed to load candidates');
      const data = await r.json();
      setCandidates(data);
    } catch (e) {
      setError(e.message);
    }
  }, [token, login]);

  // ── fetch interviews ─────────────────────────────────────────────────────
  const fetchInterviews = useCallback(async () => {
    try {
      const tok = token || await login();
      if (!tok) return;
      const r = await fetch(`${API}/interviews`, {
        headers: { Authorization: `Bearer ${tok}` }
      });
      if (!r.ok) throw new Error('Failed to load interviews');
      const data = await r.json();
      setInterviews(data);
    } catch (e) {
      setError(e.message);
    }
  }, [token, login]);

  // ── initial load + polling every 15 s ───────────────────────────────────
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setLoading(true);

      const tok = await login();
      if (!tok) { setLoading(false); return; }
      await Promise.all([fetchCandidates(), fetchInterviews(), fetchJobs(tok), fetchEvalReport(tok)]);

      setLoading(false);
    })();


    const interval = setInterval(() => {
      fetchCandidates();
      fetchInterviews();
      if (token) {
        fetchJobs(token);
        fetchEvalReport(token);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      ac.abort();
    };
  }, [login, fetchCandidates, fetchInterviews, token]);

  // ── move candidate stage ─────────────────────────────────────────────────
  const statusMap = ['applied', 'shortlisted', 'interview', 'offered', 'hired'];
  const moveCandidate = async (candidateId, newStageIdx) => {
    const newStatus = statusMap[newStageIdx];
    // Optimistic update
    setCandidates(prev => prev.map(c => c._id === candidateId ? { ...c, status: newStatus } : c));
    try {
      const tok = token || await login();
      if (!tok) return;
      await fetch(`${API}/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      fetchCandidates(); // revert on fail
    }
  };

  // ── confirm interview ────────────────────────────────────────────────────
  const confirmInterview = async (interviewId, confirmed) => {
    setInterviews(prev => prev.map(i => i._id === interviewId ? { ...i, confirmed, status: confirmed ? 'confirmed' : 'scheduled' } : i));
    try {
      const tok = token || await login();
      if (!tok) return;
      await fetch(`${API}/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ confirmed, status: confirmed ? 'confirmed' : 'scheduled' }),
      });
    } catch {
      fetchInterviews();
    }
  };

  // ── delete interview ─────────────────────────────────────────────────────
  const deleteInterview = async (interviewId) => {
    setInterviews(prev => prev.filter(i => i._id !== interviewId));
    try {
      const tok = token || await login();
      if (!tok) return;
      await fetch(`${API}/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` },
      });
    } catch {
      fetchInterviews();
    }
  };

  // ── reschedule interview ────────────────────────────────────────────────
  const handleReschedule = (iv) => {
    const d = new Date(iv.scheduled_date);
    // Format date as YYYY-MM-DD in local time
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${mins}`;
    // Ensure candidateId is always a plain string
    const cid = iv.candidate_id?._id || iv.candidate_id || '';
    setNewIv({
      id: iv._id,
      candidateId: String(cid),
      date: dateStr,
      time: timeStr,
      type: iv.type || 'Technical',
      medium: iv.medium || 'Google Meet',
      duration: iv.duration || 60,
    });
    setShowModal(true);
  };

  // ── schedule interview ───────────────────────────────────────────────────
  const scheduleInterview = async () => {
    if (!newIv.candidateId || !newIv.date || !newIv.time) return;
    const scheduled = new Date(`${newIv.date}T${newIv.time}`).toISOString();
    try {
      const tok = token || await login();
      if (!tok) return;

      const endpoint = newIv.id ? `${API}/interviews/${newIv.id}` : `${API}/interviews/schedule-external`;
      const method = newIv.id ? 'PATCH' : 'POST';

      const r = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({
          candidateId: newIv.candidateId,
          scheduledDate: scheduled,
          duration: parseInt(newIv.duration) || 60,
          type: newIv.type,
          medium: newIv.medium,
          interviewers: ['SR'],
        }),
      });
      if (!r.ok) {
        const msg = await r.json().catch(() => null);
        console.error('Schedule interview error:', msg);
        throw new Error(msg?.error || 'Failed to schedule interview');
      }
      const result = await r.json();
      console.log('Interview operation successful:', result);
      setShowModal(false);
      setNewIv({ id: null, candidateId: '', date: '', time: '', type: 'Technical', medium: 'Google Meet', duration: 60 });
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to ensure DB is updated
      fetchInterviews();
    } catch (e) {
      console.error('Schedule interview exception:', e);
      alert('Failed to schedule interview: ' + e.message);
    }
  };



  // ── candidate operations ──────────────────────────────────────────────────
  const saveCandidate = async () => {
    if (!newCandidate.name || !newCandidate.email || !newCandidate.jobId) {
      alert('Please fill in all required fields: Name, Email, and Job');
      return;
    }
    try {
      const tok = token || await login();
      if (!tok) return;
      const r = await fetch(`${API}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify(newCandidate)
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to save candidate (${r.status})`);
      }
      const result = await r.json();
      console.log('Candidate saved successfully:', result);
      setShowCandidateModal(false);
      setNewCandidate({ name: '', email: '', phone: '', role: '', jobId: '', resumeUrl: '', matchScore: 0 });
      fetchCandidates();
    } catch (e) {
      console.error('Save candidate error:', e);
      alert('Failed to save candidate: ' + e.message);
    }
  };

  // ── job operations ───────────────────────────────────────────────────────
  const saveJob = async () => {
    if (!newJob.title || !newJob.description) return;
    try {
      const tok = token || await login();
      if (!tok) return;
      const skillsArray = newJob.required_skills.split(',').map(s => s.trim()).filter(s => s).map(s => ({ skill_name: s, proficiency_level: 'Intermediate', years_required: 1 }));

      const method = newJob._id ? 'PATCH' : 'POST';
      const url = newJob._id ? `${API}/jobs/${newJob._id}` : `${API}/jobs`;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({
          title: newJob.title,
          description: newJob.description,
          department: newJob.department,
          status: newJob.status,
          required_skills: skillsArray
        })
      });
      setShowJobModal(false);
      setNewJob({ title: '', description: '', department: '', required_skills: '', status: 'open' });
      fetchJobs(tok);
    } catch (e) {
      alert('Failed to save job');
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      const tok = token || await login();
      if (!tok) return;
      await fetch(`${API}/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok}` }
      });
      fetchJobs(tok);
    } catch (e) {
      alert('Failed to delete job');
    }
  };

  const editJob = (job) => {
    setNewJob({
      _id: job._id,
      title: job.title,
      description: job.description,
      department: job.department || '',
      status: job.status,
      required_skills: (job.required_skills || []).map(s => s.skill_name).join(', ')
    });
    setShowJobModal(true);
  };

  // ── eval operations ──────────────────────────────────────────────────────
  const submitEval = async () => {
    if (!evalIv) return;
    try {
      const tok = token || await login();
      if (!tok) return;
      const criteria = [
        { criterion_id: 'tech', criterion_name: 'Technical Skills', weight: 0.4 },
        { criterion_id: 'comm', criterion_name: 'Communication', weight: 0.3 },
        { criterion_id: 'prob', criterion_name: 'Problem Solving', weight: 0.3 }
      ];
      const scores = [
        { criterion_id: 'tech', score: evalScores.technical, comments: evalScores.feedback },
        { criterion_id: 'comm', score: evalScores.communication, comments: '' },
        { criterion_id: 'prob', score: evalScores.problem_solving, comments: '' }
      ];
      await fetch(`${API}/interviews/${evalIv._id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ evaluation_criteria: criteria, evaluation_scores: scores })
      });
      setShowEvalModal(false);
      fetchInterviews();
      fetchEvalReport(tok);
    } catch (e) {
      alert('Failed to submit evaluation');
    }
  };

  // ── derived data ─────────────────────────────────────────────────────────
  const filtered = candidates.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const byStage = (key) => filtered.filter(c => c.status === key);

  // stat counts
  const totalApplicants = candidates.length;
  const thisWeekInterviews = interviews.filter(i => {
    const d = new Date(i.scheduled_date);
    const now = new Date();
    const diff = (d - now) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;
  const offersExtended = candidates.filter(c => c.status === 'offered' || c.status === 'hired').length;

  // calendar
  const calCells = buildCalendar(calYear, calMonth);
  const interviewDays = new Set(
    interviews.map(i => {
      const d = new Date(i.scheduled_date);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) return d.getDate();
      return null;
    }).filter(Boolean)
  );

  const selectedDate = new Date(calYear, calMonth, selectedDay);
  const dayInterviews = interviews.filter(i => {
    const d = new Date(i.scheduled_date);
    return d.getFullYear() === calYear && d.getMonth() === calMonth && d.getDate() === selectedDay;
  });

  // ── styles ───────────────────────────────────────────────────────────────
  const s = {
    wrap: {
      minHeight: '100vh', background: '#F0F2F8',
      fontFamily: "'Inter', -apple-system, sans-serif",
    },
    navbar: {
      width: '100%', height: 60, background: '#2B2D3A',
      display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100,
      padding: '0 24px', gap: 16,
    },
    logoBlobWrapper: {
      width: 40, height: 36, background: '#FBBF24',
      borderRadius: '60% 40% 55% 45% / 50% 60% 40% 50%',
      flexShrink: 0,
    },
    logoText: { fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', marginLeft: 8 },
    navBtn: (active) => ({
      height: 30, padding: '0 14px', borderRadius: 6, fontSize: 11,
      fontWeight: active ? 600 : 500, cursor: 'pointer', border: 'none',
      background: active ? '#6C63FF' : 'transparent',
      boxShadow: active ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.2)',
      color: active ? '#fff' : '#D0D4E8',
    }),
    avatar: {
      width: 30, height: 30, borderRadius: '50%', background: '#6C63FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, color: '#fff', marginLeft: 'auto',
    },
    content: {
      padding: '20px clamp(16px, 2.8vw, 40px)',
      width: '100%',
      maxWidth: '100%',
      margin: '0 auto',
    },
    statRow: { display: 'flex', gap: 12, marginBottom: 16 },
    pageTitle: { fontSize: 18, fontWeight: 700, color: '#1A1C2E' },
    pageSub: { fontSize: 11, color: '#7A7F99', marginTop: 2 },
    actionRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
    searchBox: {
      flex: 1, height: 30, background: '#fff', border: '1px solid #C8CCE0',
      borderRadius: 6, padding: '0 10px 0 28px', fontSize: 11, color: '#333',
      outline: 'none',
    },
    btn: (variant = 'primary') => ({
      height: 28, padding: '0 14px', borderRadius: 6, fontSize: 11,
      fontWeight: variant === 'primary' ? 600 : 500, cursor: 'pointer',
      border: variant === 'primary' ? 'none' : '1px solid #C8CCE0',
      background: variant === 'primary' ? '#6C63FF' : '#fff',
      color: variant === 'primary' ? '#fff' : '#4A4F6A',
    }),
    green: {
      height: 28, padding: '0 14px', borderRadius: 6, fontSize: 11,
      fontWeight: 600, cursor: 'pointer', border: '1px solid #34D399',
      background: '#F0FDF4', color: '#059669',
      display: 'flex', alignItems: 'center', gap: 6,
    },
    kanban: { display: 'flex', gap: 10 },
    panelWhite: {
      background: '#fff', borderRadius: 10, border: '1px solid #DDE0EE', overflow: 'hidden',
    },
    sectionLabel: {
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.7px', color: '#7A7F99', marginBottom: 8,
    },
  };

//   // ── render ────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
//       <div style={{ textAlign: 'center', color: '#6C63FF' }}>
//         <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
//         <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#4A4F6A' }}>Loading TalentFlow…</div>
//       </div>
//     </div>
//   );

//   if (error) return (
//     <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
//       <div style={{ textAlign: 'center', maxWidth: 400 }}>
//         <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
//         <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#DC2626', marginBottom: 8 }}>{error}</div>
//         <button type="button" onClick={() => window.location.reload()} style={{ ...s.btn('primary'), height: 36 }}>Retry</button>
//       </div>
//     </div>
//   );

  return (
    <div style={s.wrap}>
      {/* ── Navbar ── */}
      <nav style={s.navbar}>
        <div style={s.logoBlobWrapper} />
        <span style={s.logoText}>Talent<span style={{ color: '#2DD4BF' }}>Flow</span></span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" style={s.navBtn(page === 'dashboard')} onClick={() => setPage('dashboard')}>Dashboard</button>
          <button type="button" style={s.navBtn(page === 'pipeline')} onClick={() => setPage('pipeline')}>Pipeline</button>
          <button type="button" style={s.navBtn(page === 'interviews')} onClick={() => setPage('interviews')}>Interviews</button>
          <button type="button" style={s.navBtn(page === 'reports')} onClick={() => setPage('reports')}>Reports</button>
          <div style={s.avatar}>AD</div>
        </div>
      </nav>


      {/* ═══════════════════════════════════════════════════════════
          PAGE 0 — DASHBOARD (JOB POSTINGS)
      ═══════════════════════════════════════════════════════════ */}
      {page === 'dashboard' && (
        <main style={s.content}>
          <div style={s.statRow}>
            <StatCard icon="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" value={jobs.length} label="Total Jobs" iconBg="#EFF6FF" iconColor="#2563EB" />
            <StatCard icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" value={jobs.filter(j => j.status === 'open').length} label="Open Jobs" iconBg="#F0FDF4" iconColor="#059669" />
            <StatCard icon="M10 18a8 8 0 100-16 8 8 0 000 16z" value={jobs.filter(j => j.status === 'draft').length} label="Drafts" iconBg="#F5F3FF" iconColor="#7C3AED" />
            <StatCard icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" value={jobs.filter(j => j.status === 'closed').length} label="Closed" iconBg="#FFF7ED" iconColor="#EA580C" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h1 style={s.pageTitle}>Job Postings</h1>
              <div style={s.pageSub}>Manage your open roles and requirements</div>
            </div>
            <button type="button" style={s.btn('primary')} onClick={() => setShowJobModal(true)}>+ Create Job</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {jobs.map(job => (
              <div key={job._id} style={{ background: '#fff', borderRadius: 8, border: '1px solid #DDE0EE', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E2035', marginBottom: 4 }}>{job.title}</div>
                    <div style={{ background: job.status === 'open' ? '#D1FAE5' : '#F3F4F6', color: job.status === 'open' ? '#065F46' : '#4B5563', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 600, display: 'inline-block' }}>{job.status.toUpperCase()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={() => editJob(job)} style={{ background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                    <button type="button" onClick={() => deleteJob(job._id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Del</button>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.description}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>Department: {job.department || 'N/A'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(job.required_skills || []).map(skill => (
                    <span key={skill._id || skill.skill_name} style={{ background: '#E0E7FF', color: '#3730A3', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>{skill.skill_name}</span>
                  ))}
                </div>
              </div>
            ))}
            {jobs.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#6B7280', padding: '40px' }}>No jobs created yet.</div>}
          </div>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 1 — CANDIDATE PIPELINE
      ═══════════════════════════════════════════════════════════ */}
      {page === 'pipeline' && (
        <main style={s.content}>
          {/* Stats */}
          <div style={s.statRow}>
            <StatCard
              icon="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
              value={totalApplicants} label="Total Applicants" iconBg="#EFF6FF" iconColor="#2563EB"
            />
            <StatCard
              icon="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"
              value={thisWeekInterviews} label="Interviews This Week" iconBg="#F5F3FF" iconColor="#7C3AED"
            />
            <StatCard
              icon="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              value={offersExtended} label="Offers Extended" iconBg="#F0FDF4" iconColor="#059669"
            />
            <StatCard
              icon="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              value={candidates.filter(c => c.status === 'hired').length} label="Hired" iconBg="#FFF7ED" iconColor="#EA580C"
            />
          </div>

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <h1 style={s.pageTitle}>Candidate Pipeline</h1>
              <div style={s.pageSub}>Job: Senior Frontend Developer · Posted 12 days ago</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={s.btn('primary')} onClick={() => setShowCandidateModal(true)}>Add Candidate</button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 12, maxWidth: 320 }}>
            <span style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: '#A0A5C0',
            }}>Search</span>
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={s.searchBox}
            />
          </div>

          {/* Kanban board */}
          <div style={s.kanban}>
            {STAGES.map((stage, idx) => (
              <KanbanColumn
                key={stage.key}
                stage={stage}
                stageIndex={idx}
                candidates={byStage(stage.key)}
                onMove={moveCandidate}
              />
            ))}
          </div>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PAGE 2 — INTERVIEW SCHEDULING
      ═══════════════════════════════════════════════════════════ */}
      {page === 'interviews' && (
        <main style={s.content}>
          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h1 style={s.pageTitle}>Interview Scheduling</h1>
              <div style={s.pageSub}>{MONTH_NAMES[calMonth]} {calYear} · {interviews.length} interviews scheduled</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={s.green}>
                <div style={{ width: 7, height: 7, background: '#34D399', borderRadius: '50%' }} />
                Google Calendar Synced
              </div>
              <button type="button" style={s.btn('secondary')}>🔗 Sync Now</button>
              <button type="button" style={s.btn('primary')} onClick={() => setShowModal(true)}>+ Schedule Interview</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* ── LEFT: Calendar panel ── */}
            <div style={{ ...s.panelWhite, width: 'min(730px, 100%)', flex: 1, minWidth: 320 }}>
              {/* Calendar header */}
              <div style={{
                height: 52, borderBottom: '1px solid #EEF0FA', display: 'flex',
                alignItems: 'center', padding: '0 18px',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1E2035' }}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </div>
                <div style={{ fontSize: 10, color: '#8890AA', marginLeft: 16 }}>
                  {interviews.length} interviews · {dayInterviews.length} today
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button type="button"
                    onClick={() => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); }}
                    style={{ width: 26, height: 26, background: '#F5F6FA', border: '1px solid #DDE0EE', borderRadius: 5, cursor: 'pointer', fontSize: 13, color: '#4A4F6A' }}
                  >‹</button>
                  <button type="button"
                    onClick={() => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); }}
                    style={{ width: 26, height: 26, background: '#F5F6FA', border: '1px solid #DDE0EE', borderRadius: 5, cursor: 'pointer', fontSize: 13, color: '#4A4F6A' }}
                  >›</button>
                </div>
              </div>

              {/* Day labels */}
              <div style={{ display: 'flex', padding: '8px 18px 0' }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#A0A5C0', textTransform: 'uppercase' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ padding: '0 18px 12px' }}>
                {Array.from({ length: Math.ceil(calCells.length / 7) }, (_, row) => (
                  <div key={row} style={{ display: 'flex' }}>
                    {calCells.slice(row * 7, row * 7 + 7).map((cell, col) => {
                      const isToday = cell.cur && cell.day === today.getDate() && calYear === today.getFullYear() && calMonth === today.getMonth();
                      const isSelected = cell.cur && cell.day === selectedDay;
                      const hasIv = cell.cur && interviewDays.has(cell.day);
                      return (
                        <div
                          key={col}
                          onClick={() => cell.cur && setSelectedDay(cell.day)}
                          style={{
                            flex: 1, height: 52, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            borderRadius: 7, cursor: cell.cur ? 'pointer' : 'default',
                            fontSize: 12, fontWeight: isToday || isSelected ? 700 : 400,
                            color: !cell.cur ? '#C8CCE0' : isToday ? '#fff' : isSelected ? '#2563EB' : '#4A4F6A',
                            background: isToday ? '#6C63FF' : isSelected ? '#EFF6FF' : 'transparent',
                            border: isSelected && !isToday ? '1px solid #60A5FA' : 'none',
                          }}
                        >
                          {cell.day}
                          {hasIv && (
                            <div style={{ width: 5, height: 5, borderRadius: '50%', marginTop: 2, background: isToday ? 'rgba(255,255,255,0.7)' : '#2DD4BF' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#EEF0FA' }} />

              {/* Time slots for selected day */}
              <div style={{ padding: '12px 18px' }}>
                <div style={s.sectionLabel}>
                  Available Slots — {MONTH_NAMES[calMonth].slice(0,3)} {selectedDay}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {['9:00 AM','10:30 AM','11:00 AM','2:00 PM','3:30 PM','4:00 PM'].map((slot, i) => {
                    // mark 10:30 AM as selected, odd ones as booked
                    const booked = i % 3 === 0;
                    const selected = slot === '10:30 AM';
                    return (
                      <div key={slot} style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: selected ? '#6C63FF' : booked ? '#FEF3C7' : '#F0FDF4',
                        border: `1px solid ${selected ? '#6C63FF' : booked ? '#FBBF24' : '#34D399'}`,
                        color: selected ? '#fff' : booked ? '#92400E' : '#065F46',
                      }}>{slot}</div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  {[['#FEF3C7','#FBBF24','Booked'],['#F0FDF4','#34D399','Available'],['#6C63FF','#6C63FF','Selected']].map(([bg,bd,lbl]) => (
                    <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#7A7F99' }}>
                      <div style={{ width: 10, height: 10, background: bg, border: `1px solid ${bd}`, borderRadius: 2 }} />
                      {lbl}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#7A7F99' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2DD4BF' }} />
                    Has Interview
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Interview cards ── */}
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={s.sectionLabel}>Upcoming Interviews</div>
              <div style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', paddingRight: 2 }}>
                {interviews.length === 0 && (
                  <div style={{ fontSize: 13, color: '#8890AA', textAlign: 'center', padding: '40px 0' }}>
                    No interviews scheduled yet.
                  </div>
                )}
                {interviews
                  .slice()
                  .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
                  .map(iv => (
                    <InterviewCard key={iv._id} interview={iv} onConfirm={confirmInterview} onEvaluate={(iv) => { setEvalIv(iv); setShowEvalModal(true); }} onReschedule={handleReschedule} onDelete={deleteInterview} />
                  ))}
              </div>
            </div>
          </div>
        </main>
      )}


      {/* ═══════════════════════════════════════════════════════════
          PAGE 3 — REPORTS (EVALUATIONS)
      ═══════════════════════════════════════════════════════════ */}
      {page === 'reports' && (
        <main style={s.content}>
          <div style={s.statRow}>
            <StatCard icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" value={evalReport.statistics.total_evaluations || 0} label="Total Evaluations" iconBg="#EFF6FF" iconColor="#2563EB" />
            <StatCard icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" value={evalReport.statistics.average_score || 0} label="Avg Score" iconBg="#F0FDF4" iconColor="#059669" />
            <StatCard icon="M5 10l7-7m0 0l7 7m-7-7v18" value={evalReport.statistics.highest_score || 0} label="Highest Score" iconBg="#F5F3FF" iconColor="#7C3AED" />
            <StatCard icon="M19 14l-7 7m0 0l-7-7m7 7V3" value={evalReport.statistics.lowest_score || 0} label="Lowest Score" iconBg="#FFF7ED" iconColor="#EA580C" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h1 style={s.pageTitle}>Interview Evaluations</h1>
              <div style={s.pageSub}>Review candidate performance and scoring</div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #DDE0EE', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #DDE0EE', fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Candidate</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Evaluator</th>
                  <th style={{ padding: '12px 16px' }}>Score</th>
                  <th style={{ padding: '12px 16px' }}>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {evalReport.evaluations.map(ev => (
                  <tr key={ev._id} style={{ borderBottom: '1px solid #EEF2F6', fontSize: 12 }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E293B' }}>{ev.candidate_name}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{ev.interview_type}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{new Date(ev.interview_date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{ev.evaluated_by}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: ev.overall_score >= 70 ? '#D1FAE5' : ev.overall_score >= 50 ? '#FEF3C7' : '#FEE2E2', color: ev.overall_score >= 70 ? '#065F46' : ev.overall_score >= 50 ? '#92400E' : '#991B1B', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{ev.overall_score}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.feedback || '—'}</td>
                  </tr>
                ))}
                {evalReport.evaluations.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>No evaluations completed yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      )}


      {/* ── Job Modal ── */}
      {showJobModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowJobModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 'min(480px, calc(100vw - 32px))', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E2035', marginBottom: 20 }}>Create Job Posting</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label htmlFor="job-title" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Job Title</label>
                <input id="job-title" type="text" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
              </div>
              <div>
                <label htmlFor="job-desc" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea id="job-desc" value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} style={{ width: '100%', height: 80, border: '1px solid #C8CCE0', borderRadius: 6, padding: '10px', fontSize: 11 }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="job-dept" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Department</label>
                  <input id="job-dept" type="text" value={newJob.department} onChange={e => setNewJob({...newJob, department: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="job-status" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Status</label>
                  <select id="job-status" value={newJob.status} onChange={e => setNewJob({...newJob, status: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }}>
                    <option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="job-skills" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Required Skills (comma separated)</label>
                <input id="job-skills" type="text" value={newJob.required_skills} placeholder="React, Node.js, MongoDB" onChange={e => setNewJob({...newJob, required_skills: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={saveJob} style={{ flex: 1, height: 36, background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Save Job</button>
              <button type="button" onClick={() => setShowJobModal(false)} style={{ flex: 1, height: 36, background: '#F5F6FA', border: '1px solid #DDE0EE', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#4A4F6A' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Evaluate Modal ── */}
      {showEvalModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowEvalModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 'min(480px, calc(100vw - 32px))', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E2035', marginBottom: 20 }}>Evaluate {evalIv?.candidate_name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="eval-tech" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Technical Skills (0-100)</label>
                  <input id="eval-tech" type="number" min="0" max="100" value={evalScores.technical} onChange={e => setEvalScores({...evalScores, technical: parseInt(e.target.value) || 0})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="eval-comm" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Communication (0-100)</label>
                  <input id="eval-comm" type="number" min="0" max="100" value={evalScores.communication} onChange={e => setEvalScores({...evalScores, communication: parseInt(e.target.value) || 0})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="eval-prob" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Problem Solving (0-100)</label>
                  <input id="eval-prob" type="number" min="0" max="100" value={evalScores.problem_solving} onChange={e => setEvalScores({...evalScores, problem_solving: parseInt(e.target.value) || 0})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
              </div>
              <div>
                <label htmlFor="eval-feedback" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Overall Feedback</label>
                <textarea id="eval-feedback" value={evalScores.feedback} onChange={e => setEvalScores({...evalScores, feedback: e.target.value})} style={{ width: '100%', height: 80, border: '1px solid #C8CCE0', borderRadius: 6, padding: '10px', fontSize: 11 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={submitEval} style={{ flex: 1, height: 36, background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Submit Evaluation</button>
              <button type="button" onClick={() => setShowEvalModal(false)} style={{ flex: 1, height: 36, background: '#F5F6FA', border: '1px solid #DDE0EE', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#4A4F6A' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Interview Modal ── */}
      {showModal && (
        <div role="dialog" aria-modal="true" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowModal(false)}>
          <div
            style={{
              background: '#fff', borderRadius: 12, padding: 28, width: 'min(480px, calc(100vw - 32px))',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E2035', marginBottom: 20 }}>
              {newIv.id ? '↺ Reschedule Interview' : '+ Schedule Interview'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label htmlFor="sched-cand" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Candidate</label>
                <select id="sched-cand"
                  value={newIv.candidateId}
                  onChange={e => setNewIv({ ...newIv, candidateId: e.target.value })}
                  style={{
                    width: '100%',
                    height: 34,
                    border: '1px solid #C8CCE0',
                    borderRadius: 6,
                    padding: '0 10px',
                    fontSize: 11,
                    color: '#111827',
                    WebkitTextFillColor: '#111827',
                    background: '#fff',
                    colorScheme: 'light',
                  }}
                >
                  <option value="">Select a candidate…</option>
                  {candidates.filter(c => c.status !== 'applied').map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sched-date" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Date</label>
                  <input id="sched-date" type="date" value={newIv.date} onChange={e => setNewIv({ ...newIv, date: e.target.value })}
                    style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11, color: '#1E2035' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sched-time" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Time</label>
                  <input id="sched-time" type="time" value={newIv.time} onChange={e => setNewIv({ ...newIv, time: e.target.value })}
                    style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11, color: '#1E2035' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sched-type" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Type</label>
                  <select id="sched-type" value={newIv.type} onChange={e => setNewIv({ ...newIv, type: e.target.value })}
                    style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }}>
                    <option>Technical</option><option>HR Round</option><option>Final Round</option><option>Culture Fit</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sched-medium" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Medium</label>
                  <select id="sched-medium" value={newIv.medium} onChange={e => setNewIv({ ...newIv, medium: e.target.value })}
                    style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }}>
                    <option>Google Meet</option><option>Zoom</option><option>On-site</option><option>Phone</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="sched-duration" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Duration (min)</label>
                  <input id="sched-duration" type="number" min="15" step="15" value={newIv.duration} onChange={e => setNewIv({ ...newIv, duration: e.target.value })}
                    style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={scheduleInterview} style={{ flex: 1, height: 36, background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {newIv.id ? '↺ Update & Reschedule' : '+ Schedule Interview'}
              </button>
              <button type="button" onClick={() => { setShowModal(false); setNewIv({ id: null, candidateId: '', date: '', time: '', type: 'Technical', medium: 'Google Meet', duration: 60 }); }} style={{ flex: 1, height: 36, background: '#F5F6FA', border: '1px solid #DDE0EE', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#4A4F6A' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Candidate Modal ── */}
      {showCandidateModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowCandidateModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 'min(480px, calc(100vw - 32px))', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1E2035', marginBottom: 20 }}>Add Candidate</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label htmlFor="cand-name" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input id="cand-name" type="text" value={newCandidate.name} onChange={e => setNewCandidate({...newCandidate, name: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="cand-email" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Email</label>
                  <input id="cand-email" type="email" value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="cand-phone" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Phone</label>
                  <input id="cand-phone" type="text" value={newCandidate.phone} onChange={e => setNewCandidate({...newCandidate, phone: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="cand-role" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Role / Title</label>
                  <input id="cand-role" type="text" value={newCandidate.role} onChange={e => setNewCandidate({...newCandidate, role: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="cand-score" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Match Score (0-100)</label>
                  <input id="cand-score" type="number" min="0" max="100" value={newCandidate.matchScore} onChange={e => setNewCandidate({...newCandidate, matchScore: parseInt(e.target.value) || 0})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11 }} />
                </div>
              </div>
              <div>
                <label htmlFor="cand-job" style={{ fontSize: 11, fontWeight: 600, color: '#4A4F6A', display: 'block', marginBottom: 4 }}>Assign to Job</label>
                <select id="cand-job" value={newCandidate.jobId} onChange={e => setNewCandidate({...newCandidate, jobId: e.target.value})} style={{ width: '100%', height: 34, border: '1px solid #C8CCE0', borderRadius: 6, padding: '0 10px', fontSize: 11, color: '#333' }}>
                  <option value="">Select a job...</option>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={saveCandidate} style={{ flex: 1, height: 36, background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Add Candidate</button>
              <button type="button" onClick={() => setShowCandidateModal(false)} style={{ flex: 1, height: 36, background: '#F5F6FA', border: '1px solid #DDE0EE', borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#4A4F6A' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
