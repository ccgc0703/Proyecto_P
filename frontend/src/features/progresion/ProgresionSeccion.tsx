import { useMemo, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Checklist, TrendingUp } from '@mui/icons-material';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { useIndicadores, useResumen } from '../../hooks/useProgresion';
import { ConteoPrueba } from '../../types/progresion';
import { ProgresionAcciones } from './ProgresionAcciones';
import { ProgresionResumen } from './ProgresionResumen';
import { IndicadoresLista } from './IndicadoresLista';

interface ProgresionSeccionProps {
  miembroId: string;
}

export const ProgresionSeccion = ({ miembroId }: ProgresionSeccionProps) => {
  const { user } = useAuth();
  const puedeVer = usePermission('progresion:view');
  const puedeActualizar = usePermission('progresion:update');
  // Los jóvenes solo solicitan adelantos: los indicadores los aprueba un adulto
  const esJoven = user?.roles?.includes('JOVEN') ?? false;
  const puedeEditarIndicadores = puedeActualizar && !esJoven;
  const [tab, setTab] = useState(0);

  const resumen = useResumen(miembroId);
  const indicadores = useIndicadores(miembroId);

  const conteoPrueba = useMemo<ConteoPrueba | null>(() => {
    const items =
      indicadores.data?.indicadores.filter((i) => i.areaTipo === 'PRUEBA_ADELANTO') ?? [];
    if (items.length === 0) return null;
    return {
      total: items.length,
      completados: items.filter((i) => i.estado === 'COMPLETADO').length,
      enProceso: items.filter((i) => i.estado === 'EN_PROCESO').length,
      pendienteAprobacion: items.filter((i) => i.estado === 'PENDIENTE_APROBACION').length,
      pendientes: items.filter((i) => i.estado === 'PENDIENTE').length,
    };
  }, [indicadores.data]);

  const recargarTodo = () => {
    resumen.reload();
    indicadores.reload();
  };

  if (!puedeVer) {
    return (
      <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 text-center">
        <p className="text-xs font-bold text-outline uppercase tracking-widest">
          No tenés permiso para ver la progresión.
        </p>
      </div>
    );
  }

  return (
    <Box className="space-y-6">
      <Tabs
        value={tab}
        onChange={(_e, valor: number) => setTab(valor)}
        variant="fullWidth"
        className="border-b border-outline/10"
        TabIndicatorProps={{ style: { background: 'var(--color-primary)', height: 3 } }}
      >
        <Tab
          label={
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp fontSize="small" /> Resumen
            </span>
          }
          className="!text-primary"
        />
        <Tab
          label={
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <Checklist fontSize="small" /> Indicadores
            </span>
          }
          className="!text-primary"
        />
      </Tabs>

      {tab === 0 ? (
        <div className="space-y-6">
          <ProgresionResumen
            resumen={resumen.data}
            loading={resumen.loading}
            error={resumen.error}
            prueba={conteoPrueba}
            onRecargar={recargarTodo}
          />
          <ProgresionAcciones
            miembroId={miembroId}
            resumen={resumen.data}
            onChanged={recargarTodo}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {indicadores.loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            </div>
          ) : indicadores.error ? (
            <div className="bg-error/5 border border-error/20 p-6 rounded-[1.5rem] text-center space-y-3">
              <Typography className="text-xs font-bold text-error">
                {indicadores.error}
              </Typography>
              <button
                onClick={indicadores.reload}
                className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <IndicadoresLista
              miembroId={miembroId}
              indicadores={indicadores.data?.indicadores ?? []}
              canEdit={puedeEditarIndicadores}
              onCambio={recargarTodo}
            />
          )}
        </div>
      )}
    </Box>
  );
};
