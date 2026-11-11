import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { QrCode2, Refresh } from '@mui/icons-material';
import QRCode from 'qrcode';
import { eventosApi } from '../../api';
import { QrPresencia } from '../../types/eventos';
import { getApiErrorMessage } from '../../utils/errors';

interface DialogoQrPresenciaProps {
  open: boolean;
  actividadId: string | null;
  onClose: () => void;
}

/**
 * QR de presencia de una actividad (Fase 7b): el adulto lo genera y proyecta;
 * el joven lo escanea con su cámara para auto-registrarse como PRESENTE.
 * El código caduca a las 24 h; "Regenerar" firma uno nuevo.
 */
export const DialogoQrPresencia = ({ open, actividadId, onClose }: DialogoQrPresenciaProps) => {
  const [qr, setQr] = useState<QrPresencia | null>(null);
  const [imagen, setImagen] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generar = async () => {
    if (!actividadId) return;
    setCargando(true);
    setError(null);
    try {
      const data = await eventosApi.qrPresencia(actividadId);
      const url = await QRCode.toDataURL(data.codigo, { margin: 1, width: 360 });
      setQr(data);
      setImagen(url);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo generar el QR de presencia.'));
      setQr(null);
      setImagen(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (open) {
      setQr(null);
      setImagen(null);
      void generar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, actividadId]);

  const expira = qr ? new Date(qr.expira) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up',
      }}
    >
      <DialogTitle className="px-8 pt-8 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <QrCode2 fontSize="small" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-primary truncate">
              {qr ? qr.titulo : 'QR de presencia'}
            </h3>
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.15em]">
              Escaneá con tu cámara para marcar presente
            </p>
          </div>
        </div>
      </DialogTitle>

      <DialogContent className="px-8 py-5 space-y-4">
        {error && (
          <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-bold animate-fade-in">
            {error}
          </div>
        )}

        {cargando && (
          <div className="flex items-center justify-center py-10 gap-3 text-outline">
            <CircularProgress size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">Generando QR…</span>
          </div>
        )}

        {!cargando && imagen && qr && (
          <div className="flex flex-col items-center gap-3 py-2">
            <img
              src={imagen}
              alt={`QR de presencia de ${qr.titulo}`}
              className="w-64 h-64 rounded-2xl border border-outline/10 bg-white p-3"
              data-testid="qr-presencia-img"
            />
            <p className="text-[10px] font-bold text-outline text-center uppercase tracking-widest">
              Válido hasta {expira?.toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        )}
      </DialogContent>

      <DialogActions className="p-8 gap-4 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors"
        >
          Cerrar
        </button>
        <button
          type="button"
          onClick={generar}
          disabled={cargando}
          className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-40 inline-flex items-center gap-2"
        >
          {cargando ? <CircularProgress size={14} color="inherit" /> : <Refresh sx={{ fontSize: 14 }} />}
          Regenerar
        </button>
      </DialogActions>
    </Dialog>
  );
};
