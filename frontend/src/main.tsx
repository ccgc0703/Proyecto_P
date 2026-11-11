import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { aplicarTema, modoInicial } from './stores/temaStore';

// Aplica el modo claro/oscuro ANTES del primer render (evita destello).
aplicarTema(modoInicial());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
