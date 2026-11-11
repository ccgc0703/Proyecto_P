import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, QrCodeScanner, Stop } from '@mui/icons-material';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { eventosApi } from '../../api';
import { ResultadoPresencia } from '../../types/eventos';
import { getApiErrorMessage } from '../../utils/errors';

interface ScannerPresenciaProps {
  open: boolean;
  onClose: () => void;
  onRegistrado?: (resultado: ResultadoPresencia) => void;
}

type Modo = 'iniciando' | 'listo' | 'exito';

/**
 * Escáner de presencia (Fase 7b): lee el QR de la actividad con la cámara y
 * auto-registra al joven como PRESENTE. Si no hay cámara disponible queda el
 * código manual como alternativa (y como vía de testeo).
 */
export const ScannerPresencia = ({ open, onClose, onRegistrado }: ScannerPresenciaProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [modo, setModo] = useState<Modo>('iniciando');
  const [camaraError, setCamaraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPresencia | null>(null);
  const [codigoManual, setCodigoManual] = useState('');
  const [registrando, setRegistrando] = useState(false);

  const detener = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  };

  const registrar = async (codigo: string) => {
    const limpio = codigo.trim();
    if (!limpio || registrando) return;
    setRegistrando(true);
    setError(null);
    detener();
    try {
      const data = await eventosApi.registrarPresencia(limpio);
      setResultado(data);
      setModo('exito');
      onRegistrado?.(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo registrar la presencia.'));
      setModo('listo');
    } finally {
      setRegistrando(false);
    }
  };

  const iniciarCamara = async () => {
    setCamaraError(null);
    setError(null);
    setModo('iniciando');
    try {
      const video = videoRef.current;
      if (!video) throw new Error('sin video');
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromVideoDevice(undefined, video, (res) => {
        if (res) void registrar(res.getText());
      });
      setModo('listo');
    } catch {
      setCamaraError(
        'No se pudo acceder a la cámara. Usá el código manual de abajo.',
      );
      setModo('listo');
    }
  };

  useEffect(() => {
    if (open) {
      setResultado(null);
      setCodigoManual('');
      setError(null);
      void iniciarCamara();
    } else {
      detener();
    }
    return detener;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cerrar = () => {
    detener();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={cerrar}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up',
      }}
    >
      <DialogTitle className="px-8 pt-8 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <QrCodeScanner fontSize="small" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black text-primary truncate">Escanear QR de presencia</h3>
            <p className="text-[10px] font-bold text-outline uppercase tracking-[0.15em]">
              Apuntá a la pantalla donde se muestra el código
            </p>
          </div>
        </div>
      </DialogTitle>

      <DialogContent className="px-8 py-5 space-y-4">
        {resultado ? (
          <div
            className="flex flex-col items-center gap-2 py-6 text-center"
            data-testid="resultado-presencia"
          >
            <CheckCircle className="text-emerald-500" sx={{ fontSize: 48 }} />
            <p className="text-base font-black text-primary">
              {resultado.yaRegistrado ? 'Ya estabas marcado presente' : '¡Presencia registrada!'}
            </p>
            <p className="text-xs font-bold text-outline">
              {resultado.actividad.titulo} · {resultado.estado}
            </p>
          </div>
        ) : (
          <>
            <div className="relative rounded-2xl overflow-hidden bg-black/90 aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {modo === 'iniciando' && (
                <div className="absolute inset-0 flex items-center justify-center gap-3 text-white">
                  <CircularProgress size={22} color="inherit" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Activando cámara…
                  </span>
                </div>
              )}
            </div>

            {camaraError && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-xs font-bold">
                {camaraError}
              </div>
            )}

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 text-error rounded-xl text-xs font-bold animate-fade-in">
                {error}
              </div>
            )}

            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                void registrar(codigoManual);
              }}
            >
              <label
                htmlFor="codigo-manual-presencia"
                className="block text-[10px] font-black uppercase tracking-widest text-outline"
              >
                O pegá el código manualmente
              </label>
              <div className="flex gap-2">
                <input
                  id="codigo-manual-presencia"
                  type="text"
                  value={codigoManual}
                  onChange={(e) => setCodigoManual(e.target.value)}
                  placeholder="presencia:v1:…"
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-outline/15 bg-surface-container-low text-xs font-bold text-primary focus:outline-none focus:border-primary/40"
                />
                <button
                  type="submit"
                  disabled={registrando || codigoManual.trim().length === 0}
                  className="sentinel-gradient px-5 py-2.5 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all disabled:opacity-40"
                >
                  {registrando ? <CircularProgress size={14} color="inherit" /> : 'Registrar'}
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>

      <DialogActions className="p-8 gap-4 justify-end">
        <button
          type="button"
          onClick={cerrar}
          className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors"
        >
          {resultado ? 'Cerrar' : 'Cancelar'}
        </button>
        {!resultado && (
          <button
            type="button"
            onClick={detener}
            disabled={modo === 'iniciando'}
            className="px-6 py-3 rounded-xl border border-outline/15 font-black text-[10px] uppercase tracking-widest text-outline hover:border-error/40 hover:text-error transition-all disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Stop sx={{ fontSize: 14 }} />
            Detener cámara
          </button>
        )}
        {resultado && (
          <button
            type="button"
            onClick={() => {
              setResultado(null);
              setCodigoManual('');
              void iniciarCamara();
            }}
            className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
          >
            Escanear otro
          </button>
        )}
      </DialogActions>
    </Dialog>
  );
};
