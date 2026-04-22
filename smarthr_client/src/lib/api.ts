const BASE = "http://localhost:5000/api";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("smarthr_token") : "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const request = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && payload?.message) ||
      (typeof payload === "string" && payload) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return payload;
};

export const loginCompany = async (email: string, password: string) => {
  return request(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
};

export const registerCompany = async (
  company_name: string,
  email: string,
  password: string
) => {
  return request(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name, email, password }),
  });
};

export const getKPIs = async () => {
  return request(`${BASE}/dashboard/kpis`, {
    headers: authHeaders(),
  });
};

export const getCostPerHire = async () => {
  return request(`${BASE}/dashboard/cost-per-hire`, {
    headers: authHeaders(),
  });
};

export const getMonthlyTrends = async () => {
  return request(`${BASE}/dashboard/monthly-trends`, {
    headers: authHeaders(),
  });
};
export const getCandidates = async () => {
  return request(`${BASE}/candidates`, { headers: authHeaders() });
};

export const addCandidate = async (data: any) => {
  return request(`${BASE}/candidates`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
};

export const updateCandidate = async (id: string, data: any) => {
  return request(`${BASE}/candidates/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
};

export const deleteCandidate = async (id: string) => {
  return request(`${BASE}/candidates/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
};

export const getJobs = async () => {
  return request(`${BASE}/jobs`, { headers: authHeaders() });
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