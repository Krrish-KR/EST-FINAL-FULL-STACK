/**
 * Calls the backend and ALWAYS resolves with { ok, status, requestId, durationMs, body }
 * so the UI can show error responses produced by the global exception handler.
 */
export async function call({ method = 'GET', url, body, rawBody }) {
  const started = performance.now();
  const init = { method, headers: {} };
  if (rawBody !== undefined) {
    init.body = rawBody;
    init.headers['Content-Type'] = 'application/json';
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    return {
      ok: res.ok,
      status: res.status,
      requestId: res.headers.get('X-Request-Id'),
      durationMs: Math.round(performance.now() - started),
      body: parsed,
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      requestId: null,
      durationMs: Math.round(performance.now() - started),
      body: { message: 'Could not reach the backend. Is Spring Boot running on port 8080?', detail: String(e) },
    };
  }
}

export const getLogs = (level, limit) =>
  call({ url: `/api/logs?level=${encodeURIComponent(level)}&limit=${limit}` });

export const getEncryptedLogs = (level, limit) =>
  call({ url: `/api/logs/encrypted?level=${encodeURIComponent(level)}&limit=${limit}` });

export const clearLogs = () => call({ method: 'DELETE', url: '/api/logs' });
