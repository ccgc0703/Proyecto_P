import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, CircularProgress, LinearProgress } from '@mui/material';
import { Download, Search, TrendingUp, Visibility } from '@mui/icons-material';
import { progresionApi } from '../../api';
import { useJovenesUnidad } from '../../hooks/useProgresion';
import { usePermission } from '../../hooks/usePermission';
import { FilaJovenUnidad } from '../../types/progresion';
import { getApiErrorMessage } from '../../utils/errors';

interface UnidadProgresionPanelProps {
  unidadId: string;
}

const colorAdelanto = (fila: FilaJovenUnidad) => {
  if (!fila.adelantoActual) return 'bg-surface-container-high text-outline border-outline/10';
  if (fila.adelantoActual.estado === 'SOLICITADA')
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  return 'bg-primary/10 text-primary border-primary/20';
};

export const UnidadProgresionPanel = ({ unidadId }: UnidadProgresionPanelProps) => {
  const navigate = useNavigate();
  const puedeVer = usePermission('progresion:view');
  const { data, loading, error, reload } = useJovenesUnidad(puedeVer ? unidadId : undefined);
  const [busqueda, setBusqueda] = useState('');
  const [exportando, setExportando] = useState(false);
  const [snack, setSnack] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const filas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = data ?? [];
    const filtradas = texto
      ? lista.filter((f) =>
          `${f.nombres} ${f.apellidos}`.toLowerCase().includes(texto),
        )
      : lista;
    return [...filtradas].sort((a, b) => b.porcentajeActual - a.porcentajeActual);
  }, [data, busqueda]);

  const resumen = useMemo(() => {
    const lista = data ?? [];
    const conAdelanto = lista.filter((f) => f.adelantoActual);
    const promedio =
      conAdelanto.length > 0
        ? Math.floor(conAdelanto.reduce((s, f) => s + f.porcentajeActual, 0) / conAdelanto.length)
        : 0;
    return {
      total: lista.length,
      enCurso: lista.filter((f) => f.adelantoActual?.estado === 'EN_CURSO').length,
      solicitados: lista.filter((f) => f.adelantoActual?.estado === 'SOLICITADA').length,
      sinAdelanto: lista.filter((f) => !f.adelantoActual).length,
      promedio,
    };
  }, [data]);

  const exportar = async () => {
    setExportando(true);
    try {
      const nombre = await progresionApi.exportUnidad(unidadId);
      setSnack({ tipo: 'success', texto: `Descargado: ${nombre}` });
    } catch (err: unknown) {
      setSnack({
        tipo: 'error',
        texto: getApiErrorMessage(err, 'No se pudo generar el Cuadro de Adelanto.'),
      });
    } finally {
      setExportando(false);
    }
  };

  const columnas: GridColDef<FilaJovenUnidad>[] = [
    {
      field: 'nombre',
      headerName: 'Joven',
      flex: 1.6,
      renderCell: (p) => (
        <div className="flex items-center gap-3 h-full">
          <div className="w-9 h-9 rounded-xl sentinel-gradient flex items-center justify-center text-on-primary font-black text-[10px] shadow-md shrink-0">
            {p.row.nombres?.[0]}
            {p.row.apellidos?.[0]}
          </div>
          <div className="flex flex-col justify-center overflow-hidden">
            <p className="font-black text-sm text-primary leading-none mb-1 uppercase tracking-tight truncate">
              {p.row.nombres} {p.row.apellidos}
            </p>
            <p className="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">
              {p.row.progresiones} adelanto(s) registrado(s)
            </p>
          </div>
        </div>
      ),
    },
    {
      field: 'adelanto',
      headerName: 'Adelanto Actual',
      width: 200,
      renderCell: (p) => (
        <div className="flex items-center h-full">
          {p.row.adelantoActual ? (
            <span
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${colorAdelanto(p.row)}`}
            >
              {p.row.adelantoActual.orden}° {p.row.adelantoActual.nombre}
              {p.row.adelantoActual.estado === 'SOLICITADA' ? ' · solicitado' : ''}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-surface-container-high text-outline border-outline/10">
              Sin iniciar
            </span>
          )}
        </div>
      ),
    },
    {
      field: 'requerido',
      headerName: 'Requerido',
      width: 110,
      renderCell: (p) => (
        <div className="flex items-center h-full">
          <span className="text-xs font-black text-primary">
            {p.row.adelantoActual ? `${p.row.completados}/${p.row.requerido}` : '—'}
          </span>
        </div>
      ),
    },
    {
      field: 'porcentaje',
      headerName: 'Avance',
      width: 220,
      renderCell: (p) => (
        <div className="flex items-center gap-3 h-full w-full">
          <LinearProgress
            variant="determinate"
            value={Math.min(p.row.porcentajeActual, 100)}
            className="flex-1 h-2 rounded-full bg-primary/10"
          />
          <span className="text-xs font-black text-primary w-12 text-right">
            {p.row.porcentajeActual}%
          </span>
        </div>
      ),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 110,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (p) => (
        <button
          onClick={() =>
            navigate({ to: '/app/progresion/$miembroId', params: { miembroId: p.row.miembroId } })
          }
          className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-xl text-primary transition-all active:scale-95"
          title="Ver progresión"
        >
          <Visibility sx={{ fontSize: 20 }} />
        </button>
      ),
    },
  ];

  if (!puedeVer) {
    return (
      <div className="bg-surface-container-lowest p-10 rounded-[2rem] border border-outline-variant/10 text-center">
        <p className="text-xs font-bold text-outline uppercase tracking-widest">
          No tenés permiso para ver la progresión de la unidad.
        </p>
      </div>
    );
  }

  return (
    <Box className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Metrica label="Jóvenes" valor={String(resumen.total)} />
        <Metrica label="Adelanto en curso" valor={String(resumen.enCurso)} />
        <Metrica label="Ascensos solicitados" valor={String(resumen.solicitados)} />
        <Metrica label="Sin adelanto" valor={String(resumen.sinAdelanto)} />
        <Metrica label="Avance promedio" valor={`${resumen.promedio}%`} />
      </div>

      <div className="bg-surface-container-lowest rounded-[2rem] shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-surface-container-low flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-black tracking-tight text-primary uppercase italic flex items-center gap-2">
              <TrendingUp fontSize="small" /> Progresión
            </h3>
            <p className="text-[9px] font-bold text-outline uppercase tracking-[0.2em] opacity-50">
              Cuadro de adelanto — ordenado por avance
            </p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" fontSize="small" />
              <input
                type="text"
                placeholder="BUSCAR JOVEN..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary transition-all shadow-inner"
              />
            </div>
            <button
              onClick={exportar}
              disabled={exportando}
              className="whitespace-nowrap px-4 py-2.5 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {exportando ? <CircularProgress size={14} color="inherit" /> : <Download sx={{ fontSize: 16 }} />}
              Exportar .xlsx
            </button>
          </div>
        </div>

        {snack && (
          <div
            className={`mx-6 mt-4 p-4 rounded-2xl border ${
              snack.tipo === 'success'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-error/5 border-error/20'
            }`}
          >
            <p className={`text-xs font-bold ${snack.tipo === 'success' ? 'text-emerald-600' : 'text-error'}`}>
              {snack.texto}
            </p>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-error/5 border border-error/20 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-error">{error}</p>
            <button
              onClick={reload}
              className="px-3 py-1.5 bg-error/10 text-error rounded-lg font-black text-[10px] uppercase tracking-widest"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="p-2">
          <DataGrid
            rows={filas}
            columns={columnas}
            getRowId={(fila) => fila.miembroId}
            loading={loading}
            autoHeight
            rowHeight={72}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'var(--color-surface-container-low)',
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                fontSize: '11px',
                letterSpacing: '0.15em',
                fontWeight: '950',
                borderRadius: '1rem',
                border: 'none',
                minHeight: '48px !important',
              },
              '& .MuiDataGrid-cell': {
                display: 'flex !important',
                alignItems: 'center !important',
                padding: '10px 16px !important',
                borderBottom: '1px solid var(--color-surface-container-low)',
                lineHeight: 'normal !important',
                '&:focus, &:focus-within': { outline: 'none' },
                '& > div': {
                  display: 'flex !important',
                  alignItems: 'center !important',
                  height: '100% !important',
                  width: '100%',
                },
                '& *': { lineHeight: 'normal !important' },
              },
              '& .MuiDataGrid-row': { margin: '2px 0', transition: 'background-color 0.2s' },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'var(--color-surface-container-low) !important',
              },
            }}
          />
        </div>
      </div>
    </Box>
  );
};

const Metrica = ({ label, valor }: { label: string; valor: string }) => (
  <div className="bg-surface-container-lowest p-5 rounded-[1.5rem] border border-outline-variant/5">
    <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">{label}</p>
    <h4 className="text-xl font-black text-primary">{valor}</h4>
  </div>
);
