import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowBack, QrCodeScanner, TrendingUp } from '@mui/icons-material';
import { miembrosApi } from '../api';
import { ProgresionSeccion } from '../features/progresion/ProgresionSeccion';
import { ScannerPresencia } from '../features/eventos/ScannerPresencia';
import { useAuth } from '../hooks/useAuth';
import { Member } from '../types/member';
import { Hero, HeroChip, StateBlock } from '../components/ui';

export const MiProgresionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [miembro, setMiembro] = useState<Member | null>(null);
  const [scannerAbierto, setScannerAbierto] = useState(false);

  useEffect(() => {
    miembrosApi
      .getMiPerfil()
      .then((data) => setMiembro(data as Member))
      .catch(() => setMiembro(null));
  }, []);

  const miembroId = user?.miembroId ?? miembro?.id;

  return (
    <div className="space-y-5 animate-fade-in-up pb-10">
      <Hero
        variante="flat"
        crumb={
          <button type="button" className="crumb" onClick={() => navigate({ to: '/app' })}>
            <ArrowBack />
            Principal
          </button>
        }
        chips={
          <HeroChip tono="gold" icono={<TrendingUp />}>
            Mi Progresión
          </HeroChip>
        }
        titulo={miembro ? `${miembro.nombres} ${miembro.apellidos}` : 'Mi Adelanto'}
        subtitulo={
          <>
            {miembro?.Unidad?.nombre ?? 'Unidad'} · C.I. {miembro?.cedula || '—'}
          </>
        }
        icono={<TrendingUp />}
      />

      {miembroId ? (
        <ProgresionSeccion miembroId={miembroId} />
      ) : (
        <StateBlock
          estado="empty"
          titulo="Sin perfil scout vinculado"
          mensaje="Tu cuenta no tiene un perfil scout vinculado. Contactá a tu unidad."
        />
      )}

      {/* QR de presencia (Fase 7b): el joven escanea el código de la reunión */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-outline/10 bg-surface-container-lowest">
        <div>
          <p className="text-sm font-black text-primary">Asistencia por QR</p>
          <p className="text-[11px] font-bold text-outline">
            Escaneá el código que proyecta tu unidad para marcarte presente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScannerAbierto(true)}
          className="sentinel-gradient px-6 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all inline-flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <QrCodeScanner sx={{ fontSize: 15 }} />
          Escanear QR
        </button>
      </div>

      <ScannerPresencia open={scannerAbierto} onClose={() => setScannerAbierto(false)} />
    </div>
  );
};
