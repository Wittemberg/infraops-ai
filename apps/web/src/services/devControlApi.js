const API_BASE = "https://infraopsai.awecloudsolution.com";

export async function fetchDevControlOverview() {
  try {
    const token = localStorage.getItem("infraops_token") || "";
    const res = await fetch(`${API_BASE}/api/v1/development-control/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
        "x-user-role": "superadmin",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Development Control Center está desabilitado ou restrito a SuperAdmin.");
      }
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.error || `Erro na API (${res.status}): ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn("[devControlApi] Error fetching overview:", err);
    throw err;
  }
}
