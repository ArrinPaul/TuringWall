/**
 * Kiosk mode is opt-in: open the app with `?kiosk=1` (it is then remembered for the tab's session).
 * It enables the unattended-stall behaviour (auto-reset after inactivity). Normal visitors on the
 * public site never get kicked out of a round while they are reading.
 */
export const KIOSK_STORAGE_KEY = 'real-or-ai-wall:kiosk';

export function isKioskMode(): boolean {
  if (typeof window === 'undefined') return false;
  let fromUrl = false;
  try {
    const value = new URLSearchParams(window.location.search).get('kiosk');
    fromUrl = value !== null && value !== '0' && value !== 'false';
  } catch {
    fromUrl = false;
  }
  try {
    if (fromUrl) window.sessionStorage.setItem(KIOSK_STORAGE_KEY, '1');
    return fromUrl || window.sessionStorage.getItem(KIOSK_STORAGE_KEY) === '1';
  } catch {
    return fromUrl;
  }
}
