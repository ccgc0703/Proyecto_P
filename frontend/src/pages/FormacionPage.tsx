import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Add, Delete, Edit, School, Search, Shield } from '@mui/icons-material';
import { formacionApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import { PERMISSIONS } from '../types/auth';
import { AdultoFormacion, Formacion, NuevaFormacion } from '../types/formacion';
import { getApiErrorMessage } from '../utils/errors';
import { PageHeader, Pill, StateBlock } from '../components/ui';

const formacionSchema = z.object({
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres'),
  fecha: z.string().min(1, 'Selecciona una fecha'),
  director: z.string().min(3, 'Mínimo 3 caracteres').max(150, 'Máximo 150 caracteres'),
  adultoId: z.string().uuid('Selecciona un adulto'),
});

type FormacionForm = z.infer<typeof formacionSchema>;

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    // La fecha se guarda como ISO a medianoche UTC: formatear en UTC evita
    // que en husos negativos (p. ej. UTC-4) se muestre el día anterior.
    timeZone: 'UTC',
  });

const fechaParaInput = (iso: string): string => new Date(iso).toISOString().slice(0, 10);

const nombreAdulto = (formacion: Formacion): string =>
  `${formacion.Adulto?.Miembro?.nombres ?? ''} ${formacion.Adulto?.Miembro?.apellidos ?? ''}`.trim();

export const FormacionPage = () => {
  const canView = usePermission(PERMISSIONS.FORMACION_VIEW);
  const canManage = usePermission(PERMISSIONS.FORMACION_MANAGE);

  const [formaciones, setFormaciones] = useState<Formacion[]>([]);
  const [adultos, setAdultos] = useState<AdultoFormacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [adultoFiltro, setAdultoFiltro] = useState('TODOS');
  const [dialogo, setDialogo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormacionForm>({
    resolver: zodResolver(formacionSchema),
    defaultValues: { nombre: '', fecha: '', director: '', adultoId: '' },
  });

  // Guardia de secuencia: con StrictMode (o al encadenar acciones) se lanzan
  // varias cargas en paralelo. Solo la última puede escribir estado, para que
  // una respuesta lenta no repinte datos obsoletos ni deje el spinner activo.
  const peticionRef = useRef(0);

  const cargar = useCallback(async () => {
    const peticion = ++peticionRef.current;
    setCargando(true);
    setError(null);
    try {
      const [lista, adultosDisponibles] = await Promise.all([
        formacionApi.listar(),
        formacionApi.listarAdultos(),
      ]);
      if (peticion !== peticionRef.current) return;
      setFormaciones(lista);
      setAdultos(adultosDisponibles);
    } catch (err: unknown) {
      if (peticion !== peticionRef.current) return;
      setFormaciones([]);
      setAdultos([]);
      setError(getApiErrorMessage(err, 'No se pudieron cargar las formaciones.'));
    } finally {
      if (peticion === peticionRef.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) {
      setCargando(false);
      return;
    }
    void cargar();
  }, [canView, cargar]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return formaciones.filter((formacion) => {
      if (adultoFiltro !== 'TODOS' && formacion.adultoId !== adultoFiltro) return false;
      if (!texto) return true;
      return (
        formacion.nombre.toLowerCase().includes(texto) ||
        formacion.director.toLowerCase().includes(texto) ||
        nombreAdulto(formacion).toLowerCase().includes(texto)
      );
    });
  }, [formaciones, adultoFiltro, busqueda]);

  const abrirCrear = () => {
    setEditandoId(null);
    reset({
      nombre: '',
      fecha: new Date().toISOString().slice(0, 10),
      director: '',
      adultoId: adultoFiltro !== 'TODOS' ? adultoFiltro : '',
    });
    setError(null);
    setDialogo(true);
  };

  const abrirEditar = (formacion: Formacion) => {
    setEditandoId(formacion.id);
    reset({
      nombre: formacion.nombre,
      fecha: fechaParaInput(formacion.fecha),
      director: formacion.director,
      adultoId: formacion.adultoId,
    });
    setError(null);
    setDialogo(true);
  };

  const cerrarDialogo = () => {
    setDialogo(false);
    setEditandoId(null);
    reset();
  };

  const onSubmit = async (data: FormacionForm) => {
    const payload: NuevaFormacion = {
      nombre: data.nombre.trim(),
      fecha: data.fecha,
      director: data.director.trim(),
      adultoId: data.adultoId,
    };

    try {
      if (editandoId) {
        await formacionApi.actualizar(editandoId, payload);
      } else {
        await formacionApi.crear(payload);
      }
      cerrarDialogo();
      await cargar();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          editandoId ? 'No se pudo actualizar la formación.' : 'No se pudo registrar la formación.',
        ),
      );
    }
  };

  const eliminar = async (formacion: Formacion) => {
    if (!window.confirm(`¿Eliminar "${formacion.nombre}" del expediente del adulto?`)) return;
    setOcupadoId(formacion.id);
    setError(null);
    try {
      await formacionApi.eliminar(formacion.id);
      await cargar();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo eliminar la formación.'));
    } finally {
      setOcupadoId(null);
    }
  };

  if (!canView) {
    return (
      <div className="p-8 glass-panel border border-error/20 rounded-2xl flex flex-col items-center gap-4 text-center">
        <Shield className="text-error text-5xl opacity-20" fontSize="large" />
        <div>
          <h3 className="text-xl font-black text-error">Acceso Restringido</h3>
          <p className="text-sm font-medium text-outline">
            Se requiere el permiso formacion:view para consultar el expediente de formación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <PageHeader
        micro="Expediente · Formación"
        titulo="Formación y Certificaciones"
        subtitulo={`${formaciones.length} registro(s) · ${filtradas.length} visible(s)`}
        acciones={
          canManage ? (
            <button
              type="button"
              onClick={abrirCrear}
              className="sentinel-gradient px-6 py-3 rounded-xl text-on-primary font-bold tracking-tight shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Add fontSize="small" />
              <span>Registrar formación</span>
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex justify-between items-center animate-fade-in">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs uppercase tracking-widest px-2 hover:underline"
          >
            Ignorar
          </button>
        </div>
      )}

      <section className="bg-surface-container-low p-4 rounded-2xl shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
              <Search fontSize="small" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por curso, director o adulto..."
              aria-label="Buscar formaciones"
              className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary transition-all font-medium"
            />
          </div>

          <div className="lg:w-72 shrink-0">
            <label htmlFor="formacion-filtro-adulto" className="sr-only">
              Filtrar por adulto
            </label>
            <select
              id="formacion-filtro-adulto"
              value={adultoFiltro}
              onChange={(e) => setAdultoFiltro(e.target.value)}
              className="w-full p-3.5 bg-surface-container-high border-none rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary appearance-none"
            >
              <option value="TODOS">Todos los adultos</option>
              {adultos.map((adulto) => (
                <option key={adulto.id} value={adulto.id}>
                  {adulto.apellidos}, {adulto.nombres}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {cargando ? (
        <StateBlock estado="loading" filas={4} />
      ) : formaciones.length === 0 ? (
        <StateBlock
          estado="empty"
          titulo="Sin formaciones registradas"
          mensaje="Aún no hay cursos ni certificaciones cargadas para los adultos."
          accion={
            canManage ? (
              <button type="button" onClick={abrirCrear} className="btn btn-secondary">
                <School fontSize="small" /> Registrar formación
              </button>
            ) : undefined
          }
        />
      ) : filtradas.length === 0 ? (
        <StateBlock
          estado="empty"
          titulo="Sin coincidencias"
          mensaje="Ninguna formación coincide con los filtros actuales."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((formacion) => {
            const ocupado = ocupadoId === formacion.id;
            const adulto = nombreAdulto(formacion);
            const adultoInfo = adultos.find((a) => a.id === formacion.adultoId);
            return (
              <article
                key={formacion.id}
                className="bg-surface-container-low rounded-[1.5rem] border border-outline-variant/10 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <School />
                  </div>
                  <Pill variante="blue">{fechaCorta(formacion.fecha)}</Pill>
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-black text-primary leading-snug">{formacion.nombre}</h3>
                  <p className="text-xs text-outline mt-1">
                    Director: <span className="font-bold text-on-surface">{formacion.director}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                  <span>{adulto || 'Adulto no disponible'}</span>
                  <span>{adultoInfo?.Unidad?.nombre ?? 'Sin unidad'}</span>
                </div>

                {canManage && (
                  <div className="mt-auto flex items-center justify-end gap-1 pt-3 border-t border-outline/10">
                    <button
                      type="button"
                      onClick={() => abrirEditar(formacion)}
                      disabled={ocupado}
                      title="Editar formación"
                      aria-label={`Editar ${formacion.nombre}`}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all disabled:opacity-40"
                    >
                      <Edit fontSize="small" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void eliminar(formacion)}
                      disabled={ocupado}
                      title="Eliminar formación"
                      aria-label={`Eliminar ${formacion.nombre}`}
                      className="p-2 rounded-lg hover:bg-error/10 text-error transition-all disabled:opacity-40"
                    >
                      {ocupado ? <CircularProgress size={16} color="inherit" /> : <Delete fontSize="small" />}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogo}
        onClose={cerrarDialogo}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: 'rounded-[2rem] !bg-surface-container-lowest shadow-2xl animate-fade-in-up' }}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle className="text-xl font-black text-primary px-8 pt-8">
            {editandoId ? 'Editar formación' : 'Registrar formación'}
          </DialogTitle>

          <DialogContent className="px-8 space-y-4">
            <div className="space-y-2 mt-2">
              <label
                htmlFor="formacion-nombre"
                className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
              >
                Curso / certificación
              </label>
              <input
                id="formacion-nombre"
                {...register('nombre')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
                placeholder="Ej: Curso básico de dirigentes"
              />
              {errors.nombre && (
                <p className="text-[10px] text-error font-bold px-1">{errors.nombre.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="formacion-fecha"
                  className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
                >
                  Fecha
                </label>
                <input
                  id="formacion-fecha"
                  type="date"
                  {...register('fecha')}
                  className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
                />
                {errors.fecha && (
                  <p className="text-[10px] text-error font-bold px-1">{errors.fecha.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="formacion-director"
                  className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
                >
                  Director
                </label>
                <input
                  id="formacion-director"
                  {...register('director')}
                  className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
                  placeholder="Nombre del director"
                />
                {errors.director && (
                  <p className="text-[10px] text-error font-bold px-1">{errors.director.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="formacion-adulto"
                className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
              >
                Adulto responsable
              </label>
              <select
                id="formacion-adulto"
                {...register('adultoId')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none"
              >
                <option value="">Selecciona un adulto…</option>
                {adultos.map((adulto) => (
                  <option key={adulto.id} value={adulto.id}>
                    {adulto.apellidos}, {adulto.nombres}
                  </option>
                ))}
              </select>
              {errors.adultoId && (
                <p className="text-[10px] text-error font-bold px-1">{errors.adultoId.message}</p>
              )}
            </div>
          </DialogContent>

          <DialogActions className="p-8 gap-4">
            <button
              type="button"
              onClick={cerrarDialogo}
              className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-outline hover:text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Registrar'}
            </button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
