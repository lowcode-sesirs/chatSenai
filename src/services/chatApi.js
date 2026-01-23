const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const X_DEV_USER = import.meta.env.VITE_X_DEV_USER;

if (!X_DEV_USER) {
  // Falha cedo pra você não ficar caçando erro silencioso
  throw new Error("VITE_X_DEV_USER não está definido no .env");
}

export const sendMessage = async (message) => {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionStorage.getItem("jwt")}`,
      "X-Dev-User": X_DEV_USER,
    },
    body: JSON.stringify({ query: message }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${txt}`);
  }

  return res.json();
};
