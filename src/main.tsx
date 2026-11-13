import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HudWindow } from './HudWindow';
import './styles/theme.css';

const viewMode =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('view')
    : null;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {viewMode === 'hud' ? <HudWindow /> : <App />}
  </React.StrictMode>,
);
