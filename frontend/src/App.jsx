import { useState } from 'react';
import ErrorTester from './pages/ErrorTester.jsx';
import LogsPage from './pages/LogsPage.jsx';
import EncryptedLogsPage from './pages/EncryptedLogsPage.jsx';

const TABS = [
  { id: 'errors', label: 'Error tester', Page: ErrorTester },
  { id: 'logs', label: 'Structured logs', Page: LogsPage },
  { id: 'secure', label: 'Encrypted logs', Page: EncryptedLogsPage },
];

const THEMES = [
  { id: 'lagoon', label: 'Lagoon', color: '#138577' },
  { id: 'sunset', label: 'Sunset', color: '#d16a48' },
  { id: 'orchid', label: 'Orchid', color: '#7656b5' },
];

export default function App() {
  const [active, setActive] = useState('errors');
  const [theme, setTheme] = useState('lagoon');
  const { Page } = TABS.find((t) => t.id === active);

  return (
    <div
      className={`app-background theme-${theme}`}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
      }}
    >
      <div className="shell">
        <header className="topbar">
          <h1>Exception &amp; Log Console</h1>
          <div className="header-actions">
            <div className="theme-picker" role="group" aria-label="Background color">
              <span className="theme-label">Background</span>
              {THEMES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`theme-option${theme === option.id ? ' selected' : ''}`}
                  aria-label={`${option.label} background`}
                  aria-pressed={theme === option.id}
                  title={`${option.label} background`}
                  style={{ '--swatch': option.color }}
                  onClick={() => setTheme(option.id)}
                />
              ))}
            </div>
            <nav role="tablist" aria-label="Sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={t.id === active}
                  className={t.id === active ? 'tab active' : 'tab'}
                  onClick={() => setActive(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
        </header>
        <main>
          <Page />
        </main>
      </div>
    </div>
  );
}
