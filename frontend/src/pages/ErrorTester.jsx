import { useState } from 'react';
import { call } from '../api.js';

const GROUPS = [
  {
    title: 'Handled as client errors (4xx)',
    items: [
      { label: 'Resource not found', method: 'GET', url: '/api/test/errors/not-found' },
      { label: 'Unauthorized', method: 'GET', url: '/api/test/errors/unauthorized' },
      { label: 'Forbidden', method: 'GET', url: '/api/test/errors/forbidden' },
      { label: 'Conflict', method: 'GET', url: '/api/test/errors/conflict' },
      { label: 'Business rule broken', method: 'GET', url: '/api/test/errors/business' },
      { label: 'Illegal argument', method: 'GET', url: '/api/test/errors/illegal-argument' },
      {
        label: 'Body validation fails',
        method: 'POST',
        url: '/api/test/validate',
        body: { name: '', email: 'not-an-email', age: 12 },
      },
      { label: 'Malformed JSON body', method: 'POST', url: '/api/test/validate', rawBody: '{ "name": ' },
      { label: 'Wrong parameter type', method: 'GET', url: '/api/test/number/abc' },
      { label: 'Unknown endpoint', method: 'GET', url: '/api/does-not-exist' },
      { label: 'Method not allowed', method: 'DELETE', url: '/api/test/errors/not-found' },
    ],
  },
  {
    title: 'Unexpected server faults (5xx)',
    items: [
      { label: 'NullPointerException', method: 'GET', url: '/api/test/errors/null-pointer' },
      { label: 'Divide by zero', method: 'GET', url: '/api/test/errors/arithmetic' },
      { label: 'Array index out of bounds', method: 'GET', url: '/api/test/errors/array-index' },
      { label: 'ClassCastException', method: 'GET', url: '/api/test/errors/class-cast' },
      { label: 'Unsupported operation', method: 'GET', url: '/api/test/errors/unsupported' },
      { label: 'Nested cause chain', method: 'GET', url: '/api/test/errors/nested' },
      { label: 'Generic RuntimeException', method: 'GET', url: '/api/test/errors/runtime' },
      { label: 'Upstream timeout', method: 'GET', url: '/api/test/errors/timeout' },
    ],
  },
  {
    title: 'Control',
    items: [
      { label: 'Successful call (200)', method: 'GET', url: '/api/test/ok' },
      { label: 'Number format error', method: 'GET', url: '/api/test/errors/number-format' },
    ],
  },
];

const statusClass = (s) => (s === 0 ? 'bad' : s >= 500 ? 'bad' : s >= 400 ? 'warn' : 'good');

export default function ErrorTester() {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(null);
  const [history, setHistory] = useState([]);

  async function run(item) {
    setRunning(item.label);
    const res = await call(item);
    const entry = { ...res, item, at: new Date().toLocaleTimeString() };
    setResult(entry);
    setHistory((h) => [entry, ...h].slice(0, 8));
    setRunning(null);
  }

  return (
    <div className="split">
      <section className="panel">
        <p className="lede">
          Each button sends a request that fails in a different way. The global exception handler turns every failure
          into the same JSON shape and writes one structured log entry, which you can read on the other tabs.
        </p>
        {GROUPS.map((g) => (
          <div key={g.title} className="group">
            <h2>{g.title}</h2>
            <div className="buttons">
              {g.items.map((item) => (
                <button key={item.label} className="trigger" disabled={running !== null} onClick={() => run(item)}>
                  <span className={`verb verb-${item.method}`}>{item.method}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="panel sticky">
        <h2>Response</h2>
        {!result && <p className="empty">Pick a trigger on the left to see the handled response here.</p>}
        {result && (
          <>
            <div className="meta">
              <span className={`pill ${statusClass(result.status)}`}>{result.status || 'No response'}</span>
              <span>{result.item.method} {result.item.url}</span>
              <span>{result.durationMs} ms</span>
              {result.requestId && <span>request id <code>{result.requestId}</code></span>}
            </div>
            <pre className="json">{JSON.stringify(result.body, null, 2)}</pre>
          </>
        )}

        {history.length > 0 && (
          <>
            <h2>Recent calls</h2>
            <ul className="history">
              {history.map((h, i) => (
                <li key={i}>
                  <span className={`pill small ${statusClass(h.status)}`}>{h.status}</span>
                  <span>{h.item.label}</span>
                  <time>{h.at}</time>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
