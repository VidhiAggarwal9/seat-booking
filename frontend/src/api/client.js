export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: "POST", body }),
  del: (p, body) => request(p, { method: "DELETE", body }),
};