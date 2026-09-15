import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthGate from './AuthGate';
import { loadTheme } from './utils/storage';
import './styles.css';

// Set before the first render, so the login screen doesn't flash light when
// dark mode was chosen, while the tracker isn't mounted to set it.
document.documentElement.dataset.theme = loadTheme() ?? 'light';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate />
  </React.StrictMode>
);
