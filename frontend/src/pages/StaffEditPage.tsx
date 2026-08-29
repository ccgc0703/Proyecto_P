import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  Person,
  Badge,
  CalendarMonth,
  Wc,
  EscalatorWarning,
  SaveAlt,
  Edit,
  MedicalInformation
} from '@mui/icons-material';
import { adultosApi, unidadesApi } from '../api';
import { FichaMedicaPanel } from '../features/fichaMedica/FichaMedicaPanel';
import { UnidadEntity } from '../types/member';
import { getApiErrorMessage } from '../utils/errors';

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
        setUnidades(uData);
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

  const inputClasses =
    'w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all h-[54px]';
  const labelClasses =
    'text-[10px] font-black uppercase tracking-widest px-1 text-outline flex items-center gap-2';
  const sectionClasses =
    'bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] shadow-sm border border-outline-variant/5';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-6">
        <button
          onClick={goBack}
          className="w-12 h-12 bg-surface-container-high rounded-2xl flex items-center justify-center text-primary hover:bg-surface-container-highest transition-colors"
        >
          <ArrowBack />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-primary">
            Editar Staff / Adulto
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Modificando perfil de facilitador corporativo
          </p>
        </div>
      </header>

      {/* Messages */}
      {formError && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in">
          {formError}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm font-bold animate-fade-in">
          ✓ Cambios guardados correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Formulario */}
        <section className={sectionClasses}>
          <div className="flex items-center gap-3 mb-8">
            <Edit className="text-primary" />
            <h3 className="text-lg font-black text-primary uppercase tracking-tight">
              Datos del Perfil
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClasses}>
                <Person sx={{ fontSize: 14 }} /> Nombres *
              </label>
              <input {...register('nombres')} className={inputClasses} />
              {errors.nombres && <p className="text-[10px] text-error font-bold px-1">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <Person sx={{ fontSize: 14 }} /> Apellidos *
              </label>
              <input {...register('apellidos')} className={inputClasses} />
              {errors.apellidos && <p className="text-[10px] text-error font-bold px-1">{errors.apellidos.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <Badge sx={{ fontSize: 14 }} /> Cédula *
              </label>
              <input {...register('cedula')} className={inputClasses} />
              {errors.cedula && <p className="text-[10px] text-error font-bold px-1">{errors.cedula.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <CalendarMonth sx={{ fontSize: 14 }} /> Fecha de Nacimiento *
              </label>
              <input {...register('fechaNacimiento')} type="date" className={inputClasses} />
              {errors.fechaNacimiento && <p className="text-[10px] text-error font-bold px-1">{errors.fechaNacimiento.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <Wc sx={{ fontSize: 14 }} /> Género *
              </label>
              <select {...register('genero')} className={inputClasses}>
                <option value="MASCULINO">MASCULINO</option>
                <option value="FEMENINO">FEMENINO</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <EscalatorWarning sx={{ fontSize: 14 }} /> Unidad Scout Asignada *
              </label>
              <select {...register('unidadId')} className={inputClasses}>
                <option value="">Seleccione Unidad / Grupo</option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              {errors.unidadId && <p className="text-[10px] text-error font-bold px-1">{errors.unidadId.message}</p>}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-[2rem]">
          <button
            type="button"
            onClick={goBack}
            className="px-8 py-3 bg-surface-container-high text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || success}
            className="sentinel-gradient text-on-primary px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <SaveAlt sx={{ fontSize: 16 }} />
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Ficha Médica del adulto/staff */}
      <section className="bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] shadow-sm border border-outline-variant/5">
        <div className="flex items-center gap-3 mb-6">
          <MedicalInformation className="text-emerald-600" />
          <h3 className="text-lg font-black text-primary uppercase tracking-tight">Ficha Médica</h3>
        </div>
        <FichaMedicaPanel miembroId={miembroId} miembroNombre={staffNombre} />
      </section>
    </div>
  );
};
