import { useState } from 'react';
import { getEncryptedLogs } from '../api.js';
import { decryptLogs } from '../crypto.js';
import { LEVELS, LogList } from './LogsPage.jsx';

export default function EncryptedLogsPage() {
  const [level, setLevel] = useState('INFO');
  const [passphrase, setPassphrase] = useState('');
  const [payload, setPayload] = useState(null);
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function fetchEncrypted() {
    setBusy(true); setError(null); setLogs(null);
    const res = await getEncryptedLogs(level, 50);
    if (res.ok) setPayload(res.body); else setError(res.body?.message ?? 'Failed to load encrypted logs');
    setBusy(false);
  }

  async function decrypt() {
    setBusy(true); setError(null);
    try {
      setLogs(await decryptLogs(payload, passphrase));
    } catch {
      setLogs(null);
      setError('Decryption failed. The passphrase is wrong or the payload was altered.');
    }
    setBusy(false);
  }

  return (
    <div className="split">
      <section className="panel">
        <h2>1. Fetch encrypted logs</h2>
        <p className="lede">
          The server encrypts the log JSON with AES-256-GCM. The key comes from a shared passphrase through PBKDF2
          with a random salt, so the browser never receives the key itself.
        </p>
        <div className="toolbar">
          <label>Minimum level
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <button onClick={fetchEncrypted} disabled={busy}>Fetch encrypted logs</button>
        </div>

        {payload && (
          <>
            <h2>What travels over the network</h2>
            <dl className="kv">
              <dt>Cipher</dt><dd>{payload.algorithm}</dd>
              <dt>Key derivation</dt><dd>{payload.kdf}, {payload.iterations.toLocaleString()} iterations</dd>
              <dt>Salt</dt><dd><code>{payload.salt}</code></dd>
              <dt>IV</dt><dd><code>{payload.iv}</code></dd>
            </dl>
            <pre className="json cipher">{payload.ciphertext}</pre>
          </>
        )}
      </section>

      <section className="panel">
        <h2>2. Decrypt in the browser</h2>
        <div className="toolbar">
          <label className="grow">Passphrase
            <input
              type="password"
              value={passphrase}
              placeholder="Server default: demo-secret-change-me"
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && payload && passphrase && decrypt()}
            />
          </label>
          <button onClick={decrypt} disabled={!payload || !passphrase || busy}>Decrypt logs</button>
        </div>
        {!payload && <p className="empty">Fetch the encrypted logs first.</p>}
        {error && <p className="alert">{error}</p>}
        {logs && (
          <>
            <p className="ok">Decrypted {logs.length} entries.</p>
            <LogList logs={logs} />
          </>
        )}
      </section>
    </div>
  );
}
