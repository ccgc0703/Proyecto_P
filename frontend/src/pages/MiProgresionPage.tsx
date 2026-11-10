import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowBack, TrendingUp } from '@mui/icons-material';
import { miembrosApi } from '../api';
import { ProgresionSeccion } from '../features/progresion/ProgresionSeccion';
import { useAuth } from '../hooks/useAuth';
import { Member } from '../types/member';
import { Hero, HeroChip, StateBlock } from '../components/ui';

export const MiProgresionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [miembro, setMiembro] = useState<Member | null>(null);

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
    </div>
  );
};
