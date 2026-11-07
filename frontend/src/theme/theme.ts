import { createTheme, alpha } from '@mui/material/styles';

/**
 * Identidad visual Sentinel — alineada con `frontend/src/index.css` (@theme)
 * y con la maqueta `frontend/maqueta/index.html`.
 *
 * Regla: si cambia un color aquí, cambia también en @theme. Mantener ambos
 * sincronizados evita que MUI (formularios, alerts, dialogs) pinte de azul
 * mientras Tailwind pinta de verde.
 */
const VERDE = '#003629'; // primary
const VERDE_CONT = '#1b4d3e'; // primary-container
const AZUL_SEC = '#485f84'; // secondary (antes gris)
const SUP = '#f9faf7'; // background / surface
const ON_SUP = '#191c1b'; // on-surface
const ON_SUP_VAR = '#404945'; // on-surface-variant (texto secundario)
const OUTLINE = '#707974';
const OUTLINE_VAR = '#c0c9c3';

const ERROR = '#a3231c';
const SUCCESS = '#1b6b4a';
const WARNING = '#8a6100';
const INFO = '#3f5a8a';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: VERDE,
      light: VERDE_CONT,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: AZUL_SEC,
      contrastText: '#FFFFFF',
    },
    error: { main: ERROR },
    success: { main: SUCCESS },
    warning: { main: WARNING },
    info: { main: INFO },
    background: {
      default: SUP,
      paper: '#FFFFFF',
    },
    text: {
      primary: ON_SUP,
      secondary: ON_SUP_VAR,
    },
    divider: OUTLINE_VAR,
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
            boxShadow: `0 4px 12px ${alpha(VERDE, 0.2)}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'var(--sh-1)',
          border: `1px solid ${alpha(OUTLINE, 0.14)}`,
          borderRadius: 14,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#f3f4f1',
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: alpha(VERDE, 0.24),
            },
            '&.Mui-focused fieldset': {
              borderColor: VERDE,
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
