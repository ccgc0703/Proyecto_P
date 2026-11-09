import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  Badge,
  CalendarMonth,
  Edit,
  EscalatorWarning,
  MedicalInformation,
  Person,
  SaveAlt,
  Wc,
} from '@mui/icons-material';
import { adultosApi, unidadesApi } from '../api';
import { ordenarPorUnidad } from '../hooks/useUnidad';
import { FichaMedicaPanel } from '../features/fichaMedica/FichaMedicaPanel';
import { UnidadEntity } from '../types/member';
import { getApiErrorMessage } from '../utils/errors';
import { PageHeader, StateBlock } from '../components/ui';

const editSchema = z.object({
  nombres: z.string().min(2, 'Requerido'),
  apellidos: z.string().min(2, 'Requerido'),
  cedula: z.string().min(5, 'Requerido'),
  fechaNacimiento: z.string().min(1, 'Requerido'),
  genero: z.enum(['MASCULINO', 'FEMENINO']),
  unidadId: z.string().min(1, 'Requerido'),
});

type EditFormData = z.infer<typeof editSchema>;

export const StaffEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const [unidades, setUnidades] = useState<UnidadEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [miembroId, setMiembroId] = useState<string | undefined>(undefined);
  const [staffNombre, setStaffNombre] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [uData, staffData] = await Promise.all([
          unidadesApi.getAll(),
          adultosApi.getById(id)
        ]);
        setUnidades(ordenarPorUnidad(uData as UnidadEntity[]));
        setMiembroId(staffData.miembroId);
        setStaffNombre(`${staffData.nombres || ''} ${staffData.apellidos || ''}`.trim());
        reset({
          nombres: staffData.nombres,
          apellidos: staffData.apellidos,
          cedula: staffData.cedula,
          fechaNacimiento: staffData.fechaNacimiento ? new Date(staffData.fechaNacimiento).toISOString().split('T')[0] : '',
          genero: staffData.genero,
          unidadId: staffData.unidadId,
        });
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setFormError('No se pudo cargar la información del staff.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, reset]);

  const onSubmit = async (data: EditFormData) => {
    try {
      setFormError(null);
      await adultosApi.update(id, data);
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: '/app/staff' });
      }, 1500);
    } catch (err) {
      console.error('Error al actualizar los datos:', err);
      setFormError(getApiErrorMessage(err, 'Error al actualizar los datos.'));
    }
  };

  const goBack = () => navigate({ to: '/app/staff' });

  if (loading) {
    return (
      <div className="animate-fade-in-up pb-10 max-w-5xl mx-auto">
        <StateBlock estado="loading" filas={5} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up pb-10 max-w-5xl mx-auto">
      <PageHeader
        micro={
          <span className="tb-crumb">
            <span className="micro">Staff</span>
            <span className="micro">/</span>
            <span className="micro">Editar</span>
          </span>
        }
        titulo="Editar Staff / Adulto"
        subtitulo="Modificando perfil de facilitador corporativo"
        acciones={
          <button type="button" onClick={goBack} className="btn btn-ghost btn-sm">
            <ArrowBack />
            Volver
          </button>
        }
      />

      {/* Messages */}
      {formError && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in" role="alert">
          {formError}
        </div>
      )}
      {success && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold animate-fade-in" role="status">
          ✓ Cambios guardados correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <div className="form-sect">
          <header>
            <div className="ic" aria-hidden="true">
              <Edit />
            </div>
            <div>
              <span className="micro">Sección 01</span>
              <h3>Datos del Perfil</h3>
            </div>
          </header>

          <div className="form-grid">
            <div className="field">
              <label className="micro" htmlFor="staff-nombres">
                <Person sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Nombres *
              </label>
              <input id="staff-nombres" {...register('nombres')} className="inp" aria-invalid={!!errors.nombres} />
              {errors.nombres && <span className="field-err">{errors.nombres.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="staff-apellidos">
                <Person sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Apellidos *
              </label>
              <input id="staff-apellidos" {...register('apellidos')} className="inp" aria-invalid={!!errors.apellidos} />
              {errors.apellidos && <span className="field-err">{errors.apellidos.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="staff-cedula">
                <Badge sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Cédula *
              </label>
              <input id="staff-cedula" {...register('cedula')} className="inp" aria-invalid={!!errors.cedula} />
              {errors.cedula && <span className="field-err">{errors.cedula.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="staff-nacimiento">
                <CalendarMonth sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Fecha de Nacimiento *
              </label>
              <input id="staff-nacimiento" type="date" {...register('fechaNacimiento')} className="inp" aria-invalid={!!errors.fechaNacimiento} />
              {errors.fechaNacimiento && <span className="field-err">{errors.fechaNacimiento.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="staff-genero">
                <Wc sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Género *
              </label>
              <select id="staff-genero" {...register('genero')} className="inp" aria-invalid={!!errors.genero}>
                <option value="MASCULINO">MASCULINO</option>
                <option value="FEMENINO">FEMENINO</option>
              </select>
              {errors.genero && <span className="field-err">{errors.genero.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="staff-unidad">
                <EscalatorWarning sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Unidad Scout Asignada *
              </label>
              <select id="staff-unidad" {...register('unidadId')} className="inp" aria-invalid={!!errors.unidadId}>
                <option value="">Seleccione Unidad / Grupo</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              {errors.unidadId && <span className="field-err">{errors.unidadId.message}</span>}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="button" onClick={goBack} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || success}>
              <SaveAlt />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </form>

      {/* Ficha Médica del adulto/staff */}
      <div className="form-sect" style={{ marginBottom: 0 }}>
        <header>
          <div className="ic" aria-hidden="true">
            <MedicalInformation />
          </div>
          <div>
            <span className="micro">Sección 02</span>
            <h3>Ficha Médica</h3>
          </div>
        </header>
        <FichaMedicaPanel miembroId={miembroId} miembroNombre={staffNombre} />
      </div>
    </div>
  );
};
