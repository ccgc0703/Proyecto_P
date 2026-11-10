import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowBack, TrendingUp } from '@mui/icons-material';
import { miembrosApi } from '../api';
import { ProgresionSeccion } from '../features/progresion/ProgresionSeccion';
import { Member } from '../types/member';
import { Hero, HeroChip } from '../components/ui';

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
    <div className="space-y-5 animate-fade-in-up pb-10">
      <Hero
        variante="flat"
        crumb={
          <button
            type="button"
            className="crumb"
            onClick={() => navigate({ to: '/app/progresion' })}
          >
            <ArrowBack />
            Volver al cuadro
          </button>
        }
        chips={
          <HeroChip tono="gold" icono={<TrendingUp />}>
            Progresión Personal
          </HeroChip>
        }
        titulo={miembro ? `${miembro.nombres} ${miembro.apellidos}` : 'Joven'}
        subtitulo={
          <>
            {miembro?.Unidad?.nombre ?? 'Unidad'} · C.I. {miembro?.cedula || '—'}
          </>
        }
        icono={<TrendingUp />}
      />

      <ProgresionSeccion miembroId={miembroId} />
    </div>
  );
};
