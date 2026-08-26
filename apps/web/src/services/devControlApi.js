const API_BASE = "https://infraopsai.awecloudsolution.com";

export async function fetchDevControlOverview() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/development-control/overview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": "superadmin",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Development Control Center está desabilitado ou restrito a SuperAdmin.");
      }
      throw new Error(`Erro na API (${res.status}): ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.warn("[devControlApi] Falling back to local calculation if server unreachable:", err);
    throw err;
  }
}
