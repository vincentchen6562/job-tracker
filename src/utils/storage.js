// localStorage persistence. Everything stays on this machine — there is no
// server behind this app.

const KEY = 'vc-application-tracker/v1';
const THEME_KEY = 'vc-application-tracker/theme';

export function loadApplications() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveApplications(applications) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(applications));
    return true;
  } catch {
    return false;
  }
}

export function clearApplications() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to recover from here */
  }
}

export function loadTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* nothing to recover from here */
  }
}
