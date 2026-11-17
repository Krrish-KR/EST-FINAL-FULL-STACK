import { useCallback, useEffect, useState } from 'react';
import { clearLogs, getLogs } from '../api.js';

export const LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];

export function LogList({ logs }) {
  if (!logs.length) return <p className="empty">No log entries yet. Trigger an error on the first tab.</p>;
  return (
    <ol className="loglist">
      {logs.map((l) => (
        <li key={l.id} className={`log lvl-${l.level}`}>
          <header>
            <span className={`lvl lvl-${l.level}`}>{l.level}</span>
            <time>{l.timestamp}</time>
            {l.mdc?.requestId && <code>{l.mdc.requestId}</code>}
          </header>
          <pre className="json">{JSON.stringify(l, null, 2)}</pre>
        </li>
      ))}
    </ol>
  );
}

export default function LogsPage() {
  const [level, setLevel] = useState('INFO');
  const [limit, setLimit] = useState(50);
  const [auto, setAuto] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const res = await getLogs(level, limit);
    if (res.ok) { setLogs(res.body); setError(null); } else { setError(res.body?.message ?? 'Failed to load logs'); }
  }, [level, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [auto, load]);

  return (
    <section className="panel wide">
      <div className="toolbar">
        <label>Minimum level
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label>Entries
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {[25, 50, 100, 250].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Refresh every 2 s</label>
        <button className="secondary" onClick={load}>Refresh</button>
        <button className="danger" onClick={async () => { await clearLogs(); load(); }}>Clear logs</button>
      </div>
      {error && <p className="alert">{error}</p>}
      <p className="hint">Newest first. The backend also writes these events as JSON lines to <code>backend/logs/app.json</code> and to the console.</p>
      <LogList logs={logs} />
    </section>
  );
}
