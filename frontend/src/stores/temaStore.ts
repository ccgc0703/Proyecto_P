import { create } from 'zustand';

/**
 * Modo claro/oscuro de la interfaz (Fase 4.1).
 *
 * El estado vive en `localStorage` y se refleja en `<html data-theme>`, que
 * es lo que activa el bloque `[data-theme="dark"]` de `index.css` (tokens) y
 * el `palette.mode` del tema MUI. Se aplica antes del primer render desde
 * `main.tsx` para evitar el destello del tema claro.
 */
export type ModoTema = 'claro' | 'oscuro';

const CLAVE = 'tema-storage';

/** Preferencia guardada → o preferencia del sistema (`prefers-color-scheme`). */
export const modoInicial = (): ModoTema => {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'oscuro' || guardado === 'claro') return guardado;
  } catch {
    /* localStorage no disponible (p.ej. modo privado) → seguimos el sistema */
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'oscuro'
    : 'claro';
};

/** Pinta el modo en el documento (tokens CSS + color-scheme nativo). */
export const aplicarTema = (modo: ModoTema): void => {
  const el = document.documentElement;
  el.dataset.theme = modo === 'oscuro' ? 'dark' : 'light';
  el.style.colorScheme = modo === 'oscuro' ? 'dark' : 'light';
};

interface EstadoTema {
  modo: ModoTema;
  /** Alterna claro ↔ oscuro y lo persiste. */
  alternar: () => void;
  establecer: (modo: ModoTema) => void;
}

export const useTemaStore = create<EstadoTema>((set, get) => ({
  modo: modoInicial(),
  establecer: (modo) => {
    try {
      localStorage.setItem(CLAVE, modo);
    } catch {
      /* sin persistencia seguimos funcionando en memoria */
    }
    aplicarTema(modo);
    set({ modo });
  },
  alternar: () => get().establecer(get().modo === 'oscuro' ? 'claro' : 'oscuro'),
}));
