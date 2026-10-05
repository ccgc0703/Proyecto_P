import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowBack, TrendingUp } from '@mui/icons-material';
import { miembrosApi } from '../api';
import { ProgresionSeccion } from '../features/progresion/ProgresionSeccion';
import { Member } from '../types/member';

export const ProgresionFichaPage = () => {
  const { miembroId } = useParams({ strict: false }) as { miembroId: string };
  const navigate = useNavigate();
  const [miembro, setMiembro] = useState<Member | null>(null);

  useEffect(() => {
    miembrosApi
      .getById(miembroId)
      .then((data) => setMiembro(data as Member))
      .catch(() => setMiembro(null));
  }, [miembroId]);

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <header className="relative overflow-hidden sentinel-gradient p-8 rounded-[2rem] text-on-primary shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate({ to: '/app/progresion' })}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-on-primary transition-all active:scale-95"
              title="Volver al cuadro de adelanto"
            >
              <ArrowBack />
            </button>
            <div>
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-1.5 w-fit">
                <TrendingUp sx={{ fontSize: 12 }} /> Progresión Personal
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter mt-2">
                {miembro ? `${miembro.nombres} ${miembro.apellidos}` : 'Joven'}
              </h1>
              <p className="text-sm font-medium opacity-70">
                {miembro?.Unidad?.nombre ?? 'Unidad'} · C.I. {miembro?.cedula || '—'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <ProgresionSeccion miembroId={miembroId} />
    </div>
  );
};
