import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  Add,
  CheckCircle,
  Delete,
  Description,
  Download,
  History,
  Search,
  Shield,
  UploadFile,
} from '@mui/icons-material';
import { normativaApi } from '../api';
import { usePermission } from '../hooks/usePermission';
import { PERMISSIONS } from '../types/auth';
import {
  CATEGORIAS_NORMATIVA,
  CategoriaNormativa,
  Documento,
  ETIQUETA_CATEGORIA,
  NuevoDocumento,
} from '../types/documento';
import { getApiErrorMessage } from '../utils/errors';
import { PageHeader, Pill, StateBlock } from '../components/ui';

const TAMANO_MAXIMO = 10 * 1024 * 1024;

const documentoSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  categoria: z.enum(CATEGORIAS_NORMATIVA),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});

type DocumentoForm = z.infer<typeof documentoSchema>;

const variantePill = (
  categoria: CategoriaNormativa,
): 'green' | 'gold' | 'blue' | 'grey' => {
  if (categoria === 'LEY_PROMESA') return 'green';
  if (categoria === 'REGLAMENTO') return 'gold';
  if (categoria === 'ACTA') return 'blue';
  return 'grey';
};

const formatBytes = (bytes: number | null): string => {
  if (!bytes || bytes <= 0) return '—';
  const kb = bytes / 1024;
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
};

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

const validarArchivo = (archivo: File): string | null => {
  if (!/\.(pdf|docx)$/i.test(archivo.name)) {
    return 'Solo se permiten archivos PDF o DOCX.';
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return 'El archivo no puede superar 10 MB.';
  }
  return null;
};

export const DocumentosPage = () => {
  const canView = usePermission(PERMISSIONS.NORMATIVA_VIEW);
  const canManage = usePermission(PERMISSIONS.NORMATIVA_MANAGE);

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<'TODAS' | CategoriaNormativa>('TODAS');
  const [soloVigentes, setSoloVigentes] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentoForm>({
    resolver: zodResolver(documentoSchema),
    defaultValues: { titulo: '', categoria: 'REGLAMENTO', descripcion: '' },
  });

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDocumentos(await normativaApi.listar());
    } catch (err: unknown) {
      setDocumentos([]);
      setError(getApiErrorMessage(err, 'No se pudieron cargar los documentos.'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (!canView) {
      setCargando(false);
      return;
    }
    void cargar();
  }, [canView, cargar]);

  const conteo = useMemo(() => {
    const porCategoria: Record<string, number> = { TODAS: documentos.length };
    for (const cat of CATEGORIAS_NORMATIVA) porCategoria[cat] = 0;
    for (const doc of documentos) {
      porCategoria[doc.categoria] = (porCategoria[doc.categoria] ?? 0) + 1;
    }
    return porCategoria;
  }, [documentos]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return documentos.filter((doc) => {
      if (categoria !== 'TODAS' && doc.categoria !== categoria) return false;
      if (soloVigentes && !doc.vigente) return false;
      if (!texto) return true;
      return (
        doc.titulo.toLowerCase().includes(texto) ||
        (doc.descripcion ?? '').toLowerCase().includes(texto) ||
        (doc.nombreOriginal ?? '').toLowerCase().includes(texto)
      );
    });
  }, [documentos, categoria, soloVigentes, busqueda]);

  const abrirDialogo = () => {
    reset({ titulo: '', categoria: 'REGLAMENTO', descripcion: '' });
    setArchivo(null);
    setErrorArchivo(null);
    setError(null);
    setDialogo(true);
  };

  const cerrarDialogo = () => {
    setDialogo(false);
    setArchivo(null);
    setErrorArchivo(null);
    reset();
  };

  const onSubmit = async (data: DocumentoForm) => {
    if (!archivo) {
      setErrorArchivo('Adjunta un archivo PDF o DOCX.');
      return;
    }
    const invalido = validarArchivo(archivo);
    if (invalido) {
      setErrorArchivo(invalido);
      return;
    }

    const payload: NuevoDocumento = {
      titulo: data.titulo.trim(),
      categoria: data.categoria,
      descripcion: data.descripcion?.trim() || undefined,
      archivo,
    };

    try {
      await normativaApi.crear(payload);
      cerrarDialogo();
      await cargar();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo subir el documento.'));
    }
  };

  const descargar = async (doc: Documento) => {
    setOcupadoId(doc.id);
    setError(null);
    try {
      await normativaApi.descargar(
        doc.id,
        doc.nombreOriginal ?? `${doc.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo descargar el documento.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const alternarVigencia = async (doc: Documento) => {
    setOcupadoId(doc.id);
    setError(null);
    try {
      await normativaApi.actualizar(doc.id, { vigente: !doc.vigente });
      await cargar();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo actualizar la vigencia.'));
    } finally {
      setOcupadoId(null);
    }
  };

  const eliminar = async (doc: Documento) => {
    if (!window.confirm(`¿Eliminar "${doc.titulo}" de la biblioteca?`)) return;
    setOcupadoId(doc.id);
    setError(null);
    try {
      await normativaApi.eliminar(doc.id);
      await cargar();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'No se pudo eliminar el documento.'));
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
            Se requiere el permiso normativa:view para consultar la biblioteca.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <PageHeader
        micro="Biblioteca · Normativa"
        titulo="Documentos y Normativa"
        subtitulo={`${documentos.length} documento(s) · ${filtrados.length} visible(s)`}
        acciones={
          canManage ? (
            <button
              type="button"
              onClick={abrirDialogo}
              className="sentinel-gradient px-6 py-3 rounded-xl text-on-primary font-bold tracking-tight shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Add fontSize="small" />
              <span>Subir documento</span>
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

      <section className="bg-surface-container-low p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
              <Search fontSize="small" />
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, descripción o archivo..."
              aria-label="Buscar documentos"
              className="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-xl text-sm text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary transition-all font-medium"
            />
          </div>
          <label className="chk shrink-0 px-1">
            <input
              type="checkbox"
              checked={soloVigentes}
              onChange={(e) => setSoloVigentes(e.target.checked)}
            />
            Solo vigentes
          </label>
        </div>

        <div className="chip-form !mb-0">
          <button
            type="button"
            className={`chip-btn${categoria === 'TODAS' ? ' on' : ''}`}
            onClick={() => setCategoria('TODAS')}
          >
            <i style={{ background: 'var(--color-primary)' }} />
            Todas
            <span className="opacity-60">({conteo.TODAS ?? 0})</span>
          </button>
          {CATEGORIAS_NORMATIVA.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip-btn${categoria === cat ? ' on' : ''}`}
              onClick={() => setCategoria(cat)}
            >
              <i style={{ background: 'var(--color-secondary)' }} />
              {ETIQUETA_CATEGORIA[cat]}
              <span className="opacity-60">({conteo[cat] ?? 0})</span>
            </button>
          ))}
        </div>
      </section>

      {cargando ? (
        <StateBlock estado="loading" filas={4} />
      ) : documentos.length === 0 ? (
        <StateBlock
          estado="empty"
          titulo="Biblioteca vacía"
          mensaje="Aún no hay documentos cargados. Sube la primera normativa o acta."
          accion={
            canManage ? (
              <button type="button" onClick={abrirDialogo} className="btn btn-secondary">
                <UploadFile fontSize="small" /> Subir documento
              </button>
            ) : undefined
          }
        />
      ) : filtrados.length === 0 ? (
        <StateBlock
          estado="empty"
          titulo="Sin coincidencias"
          mensaje="Ningún documento coincide con los filtros actuales."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((doc) => {
            const ocupado = ocupadoId === doc.id;
            return (
              <article
                key={doc.id}
                className="bg-surface-container-low rounded-[1.5rem] border border-outline-variant/10 p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Description />
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Pill variante={variantePill(doc.categoria)}>
                      {ETIQUETA_CATEGORIA[doc.categoria]}
                    </Pill>
                    <Pill variante={doc.vigente ? 'green' : 'grey'} dot={doc.vigente}>
                      {doc.vigente ? 'Vigente' : 'Histórico'}
                    </Pill>
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-black text-primary leading-snug">{doc.titulo}</h3>
                  {doc.descripcion && (
                    <p className="text-xs text-outline mt-1 line-clamp-2">{doc.descripcion}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-outline">
                  <span>{doc.Unidad?.nombre ?? 'Nacional'}</span>
                  <span>v{doc.version}</span>
                  <span>{formatBytes(doc.tamano)}</span>
                  <span>{fechaCorta(doc.createdAt)}</span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-outline/10">
                  <button
                    type="button"
                    onClick={() => void descargar(doc)}
                    disabled={ocupado}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    {ocupado ? <CircularProgress size={14} color="inherit" /> : <Download fontSize="small" />}
                    Descargar
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => void alternarVigencia(doc)}
                        disabled={ocupado}
                        title={doc.vigente ? 'Marcar como histórico' : 'Marcar como vigente'}
                        aria-label={doc.vigente ? 'Marcar como histórico' : 'Marcar como vigente'}
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all disabled:opacity-40"
                      >
                        {doc.vigente ? <History fontSize="small" /> : <CheckCircle fontSize="small" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => void eliminar(doc)}
                        disabled={ocupado}
                        title="Eliminar documento"
                        aria-label={`Eliminar ${doc.titulo}`}
                        className="p-2 rounded-lg hover:bg-error/10 text-error transition-all disabled:opacity-40"
                      >
                        <Delete fontSize="small" />
                      </button>
                    </div>
                  )}
                </div>
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
            Subir documento
          </DialogTitle>

          <DialogContent className="px-8 space-y-4">
            <div className="space-y-2 mt-2">
              <label
                htmlFor="documento-titulo"
                className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
              >
                Título
              </label>
              <input
                id="documento-titulo"
                {...register('titulo')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary"
                placeholder="Ej: Reglamento general 2026"
              />
              {errors.titulo && (
                <p className="text-[10px] text-error font-bold px-1">{errors.titulo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="documento-categoria"
                className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
              >
                Categoría
              </label>
              <select
                id="documento-categoria"
                {...register('categoria')}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px] appearance-none"
              >
                {CATEGORIAS_NORMATIVA.map((cat) => (
                  <option key={cat} value={cat}>
                    {ETIQUETA_CATEGORIA[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="documento-descripcion"
                className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
              >
                Descripción (opcional)
              </label>
              <textarea
                id="documento-descripcion"
                {...register('descripcion')}
                rows={3}
                className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary resize-none"
                placeholder="Breve resumen del contenido"
              />
              {errors.descripcion && (
                <p className="text-[10px] text-error font-bold px-1">{errors.descripcion.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="documento-archivo"
                className="text-[10px] font-black uppercase tracking-widest px-1 text-outline"
              >
                Archivo
              </label>
              <input
                id="documento-archivo"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const seleccionado = e.target.files?.[0] ?? null;
                  const invalido = seleccionado ? validarArchivo(seleccionado) : null;
                  setArchivo(invalido ? null : seleccionado);
                  setErrorArchivo(invalido);
                }}
                className="w-full text-xs font-bold text-outline file:mr-3 file:px-4 file:py-2.5 file:rounded-xl file:border-0 file:bg-primary/10 file:text-primary file:font-black file:uppercase file:tracking-widest file:text-[10px] hover:file:bg-primary/20 cursor-pointer"
              />
              <p className="text-[11px] text-outline px-1">PDF o DOCX · máximo 10 MB.</p>
              {errorArchivo && (
                <p className="text-[10px] text-error font-bold px-1">{errorArchivo}</p>
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
              {isSubmitting ? 'Subiendo…' : 'Subir documento'}
            </button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};
