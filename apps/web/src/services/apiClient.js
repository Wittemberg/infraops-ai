/**
 * Cliente de API Centralizado
 * InfraOps AI — Stage 28B
 */

export const API_BASE = "https://infraopsai.awecloudsolution.com";

export async function apiRequest(endpoint, options = {}) {
  const { tenantId, body, method = "GET", headers = {} } = options;

  const reqHeaders = {
    "Content-Type": "application/json",
    ...(tenantId ? { "x-tenant-id": tenantId } : {}),
    ...headers,
  };

  const config = {
    method,
    headers: reqHeaders,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erro na requisição (HTTP ${response.status})`);
    }

    return data;
  } catch (error) {
    console.warn(`[API_REQUEST_ERROR] ${endpoint}:`, error.message);
    throw error;
  }
}

export default apiRequest;
