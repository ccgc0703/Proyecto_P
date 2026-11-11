import { createTheme, alpha } from '@mui/material/styles';

/**
 * Identidad visual Sentinel — alineada con `frontend/src/index.css` (@theme)
 * y con la maqueta `frontend/maqueta/index.html`.
 *
 * Regla: si cambia un color aquí, cambia también en @theme. Mantener ambos
 * sincronizados evita que MUI (formularios, alerts, dialogs) pinte de azul
 * mientras Tailwind pinta de verde.
 *
 * Fase 4.1: `crearTema(modo)` produce la variante clara u oscura con los
 * mismos valores del bloque `[data-theme="dark"]` de index.css. `App.tsx`
 * memoriza la fábrica según `useTemaStore` para que los componentes MUI
 * (Dialog, Snackbar, TextField…) sigan el toggle del topbar.
 */
const VERDE = '#003629'; // primary (claro)
const VERDE_OSCURO = '#7ec9ad'; // primary (oscuro: menta, sirve como texto)
const VERDE_CONT = '#1b4d3e'; // primary-container (claro)
const VERDE_CONT_OSCURO = '#2b7a63'; // primary-container (oscuro)
const AZUL_SEC = '#485f84'; // secondary (claro)
const AZUL_SEC_OSCURO = '#9db4e0'; // secondary (oscuro)
const SUP = '#f9faf7'; // background / surface (claro)
const SUP_OSCURO = '#0a110e'; // background / surface (oscuro)
const ON_SUP = '#191c1b'; // on-surface (claro)
const ON_SUP_OSCURO = '#e7ede9'; // on-surface (oscuro)
const ON_SUP_VAR = '#404945'; // on-surface-variant (claro)
const ON_SUP_VAR_OSCURO = '#b7c1bb'; // on-surface-variant (oscuro)
const OUTLINE = '#707974';
const OUTLINE_VAR = '#c0c9c3';
const OUTLINE_VAR_OSCURO = '#39433d';
const PAPER_OSCURO = '#0f1714';

const ERROR = '#a3231c';
const ERROR_OSCURO = '#ff7d74';
const SUCCESS = '#1b6b4a';
const SUCCESS_OSCURO = '#6fdba4';
const WARNING = '#8a6100';
const WARNING_OSCURO = '#f0c14b';
const INFO = '#3f5a8a';
const INFO_OSCURO = '#7ea3d6';

export type ModoTemaMUI = 'light' | 'dark';

export const crearTema = (modo: ModoTemaMUI = 'light') => {
  const oscuro = modo === 'dark';
  const primario = oscuro ? VERDE_OSCURO : VERDE;

  return createTheme({
    palette: {
      mode: modo,
      primary: {
        main: primario,
        light: oscuro ? VERDE_CONT_OSCURO : VERDE_CONT,
        contrastText: oscuro ? '#062019' : '#FFFFFF',
      },
      secondary: {
        main: oscuro ? AZUL_SEC_OSCURO : AZUL_SEC,
        contrastText: oscuro ? '#10182c' : '#FFFFFF',
      },
      error: { main: oscuro ? ERROR_OSCURO : ERROR },
      success: { main: oscuro ? SUCCESS_OSCURO : SUCCESS },
      warning: { main: oscuro ? WARNING_OSCURO : WARNING },
      info: { main: oscuro ? INFO_OSCURO : INFO },
      background: {
        default: oscuro ? SUP_OSCURO : SUP,
        paper: oscuro ? PAPER_OSCURO : '#FFFFFF',
      },
      text: {
        primary: oscuro ? ON_SUP_OSCURO : ON_SUP,
        secondary: oscuro ? ON_SUP_VAR_OSCURO : ON_SUP_VAR,
      },
      divider: oscuro ? OUTLINE_VAR_OSCURO : OUTLINE_VAR,
    },
    typography: {
      fontFamily: '"Manrope", "Inter", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.035em' },
      h2: { fontWeight: 800, letterSpacing: '-0.03em' },
      h3: { fontWeight: 800, letterSpacing: '-0.025em' },
      h4: { fontWeight: 700, letterSpacing: '-0.015em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 700 },
      // Las micro-etiquetas de la maqueta van en monoespaciada
      overline: {
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontWeight: 600,
        fontSize: '0.625rem',
        letterSpacing: '0.16em',
      },
      caption: {
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontWeight: 500,
        fontSize: '0.6875rem',
        letterSpacing: '0.06em',
      },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '9px 18px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0 4px 12px ${alpha(primario, oscuro ? 0.3 : 0.2)}`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: 'var(--sh-1)',
            border: oscuro ? '1px solid rgba(141, 151, 143, 0.22)' : `1px solid ${alpha(OUTLINE, 0.14)}`,
            borderRadius: 14,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: oscuro ? '#27332c' : '#f3f4f1',
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: alpha(primario, 0.24),
              },
              '&.Mui-focused fieldset': {
                borderColor: primario,
              },
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 600 },
        },
      },
    },
  });
};

/** Compatibilidad con referencias estáticas: tema claro por defecto. */
export const theme = crearTema('light');
