// localStorage for per-device preferences only: the theme and the card/table
// view, so each device keeps the layout that suits its screen. Applications
// live on the server.

const THEME_KEY = 'vc-application-tracker/theme';
const VIEW_KEY = 'vc-application-tracker/view';

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

export function loadView() {
  try {
    const saved = window.localStorage.getItem(VIEW_KEY);
    return saved === 'table' || saved === 'cards' ? saved : null;
  } catch {
    return null;
  }
}

export function saveView(view) {
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    /* nothing to recover from here */
  }
}
