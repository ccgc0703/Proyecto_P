import { createTheme, alpha } from '@mui/material/styles';

const AZUL = '#27348B';
const AMARILLO = '#FFDE00';
const GRIS = '#878787';
const SURFACE = '#FAF9F9';
const ON_SURFACE = '#1B1C1C';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: AZUL,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: GRIS,
    },
    warning: {
      main: AMARILLO,
    },
    background: {
      default: SURFACE,
      paper: '#FFFFFF',
    },
    text: {
      primary: ON_SURFACE,
      secondary: GRIS,
    },
    divider: alpha(GRIS, 0.12),
  },
  typography: {
    fontFamily: '"Manrope", "Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.015em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 4px 12px ${alpha(AZUL, 0.2)}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          border: `1px solid ${alpha(GRIS, 0.1)}`,
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: alpha(GRIS, 0.05),
            '& fieldset': {
              borderColor: 'transparent',
            },
            '&:hover fieldset': {
              borderColor: alpha(AZUL, 0.2),
            },
            '&.Mui-focused fieldset': {
              borderColor: AZUL,
            },
          },
        },
      },
    },
  },
});
