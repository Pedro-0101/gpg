export const API_URL = process.env.API_URL ?? 'http://localhost:3001/api/v1';

export async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`${res.status}: ${(err as any).message ?? res.statusText}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
