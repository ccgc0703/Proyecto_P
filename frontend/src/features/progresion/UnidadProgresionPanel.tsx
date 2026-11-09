import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CircularProgress } from '@mui/material';
import {
  CheckCircle,
  Download,
  ErrorOutline,
  Groups2,
  Schedule,
  Search,
  TrendingUp,
  Visibility,
} from '@mui/icons-material';
import { progresionApi } from '../../api';
import { useJovenesUnidad } from '../../hooks/useProgresion';
import { usePermission } from '../../hooks/usePermission';
import { FilaJovenUnidad } from '../../types/progresion';
import { getApiErrorMessage } from '../../utils/errors';
import { DataTableShell, StateBlock } from '../../components/ui';

interface UnidadProgresionPanelProps {
  unidadId: string;
  /** Nombre de la unidad — se muestra como título del cuadro de adelanto. */
  titulo?: string;
}

export const UnidadProgresionPanel = ({ unidadId, titulo }: UnidadProgresionPanelProps) => {
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

  if (!puedeVer) {
    return (
      <StateBlock
        estado="error"
        titulo="Sin permiso"
        mensaje="No tenés permiso para ver la progresión de la unidad."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Métricas del cuadro ─────────────────────────────────────── */}
      <div className="kpi-row">
        <div className="kpi-s">
          <div className="lbl">
            <Groups2 />
            <span className="micro">Jóvenes</span>
          </div>
          <div className="val">{resumen.total}</div>
        </div>
        <div className="kpi-s gold">
          <div className="lbl">
            <Schedule />
            <span className="micro">Adelanto en curso</span>
          </div>
          <div className="val">{resumen.enCurso}</div>
        </div>
        <div className="kpi-s blue">
          <div className="lbl">
            <CheckCircle />
            <span className="micro">Ascensos solicitados</span>
          </div>
          <div className="val">{resumen.solicitados}</div>
        </div>
        <div className="kpi-s red">
          <div className="lbl">
            <ErrorOutline />
            <span className="micro">Sin adelanto</span>
          </div>
          <div className="val">{resumen.sinAdelanto}</div>
        </div>
        <div className="kpi-s">
          <div className="lbl">
            <TrendingUp />
            <span className="micro">Avance promedio</span>
          </div>
          <div className="val">
            {resumen.promedio}<small>%</small>
          </div>
        </div>
      </div>

      {/* ── Cuadro de adelanto ──────────────────────────────────────── */}
      <DataTableShell
        herramientas={
          <>
            <div className="tbl-titles">
              <span className="micro">Cuadro de adelanto</span>
              <h3>{titulo ?? 'Unidad'}</h3>
            </div>
            <div className="tbl-tools-l flex-none justify-end">
              <label className="tbl-search">
                <Search />
                <input
                  type="search"
                  placeholder="Buscar joven..."
                  aria-label="Buscar joven"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-soft btn-sm"
                onClick={exportar}
                disabled={exportando}
              >
                {exportando ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Download />
                )}
                <span>Exportar .xlsx</span>
              </button>
            </div>
          </>
        }
      >
        {snack && (
          <div
            className={`mx-4 mt-4 p-4 rounded-2xl border ${
              snack.tipo === 'success'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-error/5 border-error/20'
            }`}
            role="status"
          >
            <p className={`text-xs font-bold ${snack.tipo === 'success' ? 'text-emerald-600' : 'text-error'}`}>
              {snack.texto}
            </p>
          </div>
        )}

        {error && (
          <div
            className="mx-4 mt-4 p-4 rounded-2xl bg-error/5 border border-error/20 flex items-center justify-between gap-3"
            role="alert"
          >
            <p className="text-xs font-bold text-error">{error}</p>
            <button
              type="button"
              onClick={reload}
              className="px-3 py-1.5 bg-error/10 text-error rounded-lg font-black text-[10px] uppercase tracking-widest"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-4">
            <StateBlock estado="loading" filas={5} />
          </div>
        ) : filas.length === 0 ? (
          <StateBlock
            estado="empty"
            titulo="Sin resultados"
            mensaje={
              busqueda
                ? 'Ningún joven coincide con la búsqueda.'
                : 'Esta unidad aún no tiene jóvenes registrados.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="dt">
              <caption>Avance de progresión de los jóvenes de la unidad</caption>
              <thead>
                <tr>
                  <th scope="col">Joven</th>
                  <th scope="col">Adelanto Actual</th>
                  <th scope="col">Requerido</th>
                  <th scope="col">Avance</th>
                  <th scope="col" style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f: FilaJovenUnidad) => {
                  const pct = Math.min(f.porcentajeActual, 100);
                  const tono = pct >= 80 ? ' green' : pct >= 40 ? '' : ' gold';
                  const solicitado = f.adelantoActual?.estado === 'SOLICITADA';
                  return (
                    <tr key={f.miembroId}>
                      <td data-l="Joven">
                        <div className="cell-id">
                          <span className="av-sq" aria-hidden="true">
                            {f.nombres?.[0]}
                            {f.apellidos?.[0]}
                          </span>
                          <span>
                            <span className="nm">
                              {f.nombres} {f.apellidos}
                            </span>
                            <span className="sub">
                              {f.progresiones} adelanto(s) registrado(s)
                            </span>
                          </span>
                        </div>
                      </td>
                      <td data-l="Adelanto">
                        {f.adelantoActual ? (
                          <span
                            className="chip"
                            style={
                              solicitado
                                ? { background: 'rgba(255,184,0,.16)', color: 'var(--color-warning)' }
                                : undefined
                            }
                          >
                            {f.adelantoActual.orden}° {f.adelantoActual.nombre}
                            {solicitado ? ' · solicitado' : ''}
                          </span>
                        ) : (
                          <span className="chip">Sin iniciar</span>
                        )}
                      </td>
                      <td data-l="Requerido">
                        <span className="chip chip-mono">
                          {f.adelantoActual ? `${f.completados}/${f.requerido}` : '—'}
                        </span>
                      </td>
                      <td data-l="Avance">
                        <div className="prog-cell">
                          <span className={`prog${tono}`} style={{ flex: 1 }}>
                            <i style={{ width: `${pct}%` }} />
                          </span>
                          <span className="pc">{f.porcentajeActual}%</span>
                        </div>
                      </td>
                      <td data-l="Acciones">
                        <div className="row-acts">
                          <button
                            type="button"
                            className="act-btn"
                            aria-label={`Ver progresión de ${f.nombres} ${f.apellidos}`}
                            title="Ver progresión"
                            onClick={() =>
                              navigate({
                                to: '/app/progresion/$miembroId',
                                params: { miembroId: f.miembroId },
                              })
                            }
                          >
                            <Visibility />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataTableShell>
    </div>
  );
};
