import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Production only: in dev a cached worker would serve stale modules and break HMR.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline caching is a bonus, not a requirement for the game to run.
    });
  });
}

// A new deploy replaces hashed chunk files; a tab opened before it can then fail to import one.
// Reload once (guarded, so a genuine outage can't cause a reload loop) to pick up the new build.
// Do NOT call event.preventDefault(): that would swallow the error and make the import resolve
// with no module, hiding the failure from the game's own load-error handling.
window.addEventListener('vite:preloadError', () => {
  try {
    const last = Number(sessionStorage.getItem('real-or-ai-wall:chunk-reload') ?? 0);
    if (Date.now() - last > 60_000) {
      sessionStorage.setItem('real-or-ai-wall:chunk-reload', String(Date.now()));
      window.location.reload();
    }
  } catch {
    // Storage unavailable: skip the auto-reload; the in-app retry message still appears.
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
