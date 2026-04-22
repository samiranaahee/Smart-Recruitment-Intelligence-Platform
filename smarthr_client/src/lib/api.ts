const BASE = "http://localhost:5000/api";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("smarthr_token") : "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const loginCompany = async (email: string, password: string) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed");
  return data;
};

export const registerCompany = async (
  company_name: string,
  email: string,
  password: string
) => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
};

export const getKPIs = async () => {
  const res = await fetch(`${BASE}/dashboard/kpis`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch KPIs");
  return res.json();
};

export const getCostPerHire = async () => {
  const res = await fetch(`${BASE}/dashboard/cost-per-hire`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch cost per hire");
  return res.json();
};

export const getMonthlyTrends = async () => {
  const res = await fetch(`${BASE}/dashboard/monthly-trends`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch trends");
  return res.json();
};
export const getCandidates = async () => {
  const res = await fetch(`${BASE}/candidates`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch candidates");
  return res.json();
};

export const addCandidate = async (data: any) => {
  const res = await fetch(`${BASE}/candidates`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add candidate");
  return res.json();
};

export const updateCandidate = async (id: string, data: any) => {
  const res = await fetch(`${BASE}/candidates/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update candidate");
  return res.json();
};

export const deleteCandidate = async (id: string) => {
  const res = await fetch(`${BASE}/candidates/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete candidate");
  return res.json();
};

export const getJobs = async () => {
  const res = await fetch(`${BASE}/jobs`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
};

export const addJob = async (data: any) => {
  const res = await fetch(`${BASE}/jobs`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add job");
  return res.json();
};

export const deleteJob = async (id: string) => {
  const res = await fetch(`${BASE}/jobs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete job");
  return res.json();
};