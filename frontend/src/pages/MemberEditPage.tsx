import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  Person,
  ContactPhone,
  Home,
  Wc,
  CalendarMonth,
  SaveAlt,
} from '@mui/icons-material';
import { miembrosApi, unidadesApi } from '../api';

const editSchema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  cedula: z.string().min(5, 'Cédula requerida'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida'),
  genero: z.enum(['MASCULINO', 'FEMENINO'], { required_error: 'Selecciona el género' }),
  estado: z.string().optional(),
  historial: z.string().optional(),
  // Datos Scout
  fechaIngreso: z.string().optional(),
  fechaPromesa: z.string().optional(),
  cargoActual: z.string().optional(),
  patrullaId: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface MemberEditPageProps {
  memberId: string;
  unitType: string;
  unitLabel: string;
}

export const MemberEditPage = ({ memberId, unitType, unitLabel }: MemberEditPageProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<any>(null);
  const [subUnidades, setSubUnidades] = useState<any[]>([]);
  const [isLoadingSub, setIsLoadingSub] = useState(false);

  // Determinar nomenclatura
  const subUnitLabel = unitType.toLowerCase() === 'manada' 
    ? 'Seisena' 
    : unitType.toLowerCase() === 'clan' 
      ? 'Equipo de Trabajo' 
      : 'Patrulla';

  useEffect(() => {
    const fetchSubUnits = async () => {
      try {
        setIsLoadingSub(true);
        // Buscar la unidad por nombre para obtener su ID real si es necesario, 
        // pero aquí memberData ya tiene unidadId
        if (memberData?.unidadId) {
          const list = await unidadesApi.getPatrullas(memberData.unidadId);
          setSubUnidades(list);
        }
      } catch (err) {
        console.error('Error fetching sub-units:', err);
      } finally {
        setIsLoadingSub(false);
      }
    };
    if (memberData) fetchSubUnits();
  }, [memberData?.unidadId, memberData]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    const loadMember = async () => {
      try {
        const data = await miembrosApi.getById(memberId);
        setMemberData(data);
        reset({
          nombres: data.nombres,
          apellidos: data.apellidos,
          cedula: data.cedula,
          fechaNacimiento: data.fechaNacimiento?.split('T')[0] || '',
          genero: data.genero,
          estado: data.estado,
          historial: data.historial || '',
          fechaIngreso: data.fechaIngreso?.split('T')[0] || '',
          fechaPromesa: data.fechaPromesa?.split('T')[0] || '',
          cargoActual: data.cargoActual || '',
          patrullaId: data.patrullaId || '',
        });
      } catch (err) {
        setError('No se pudo cargar el miembro.');
      } finally {
        setLoading(false);
      }
    };
    loadMember();
  }, [memberId, reset]);

  const onSubmit = async (data: EditFormData) => {
    try {
      setError(null);
      await miembrosApi.update(memberId, {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedula: data.cedula,
        fechaNacimiento: data.fechaNacimiento,
        genero: data.genero,
        estado: data.estado,
        historial: data.historial || null,
        fechaIngreso: data.fechaIngreso || null,
        fechaPromesa: data.fechaPromesa || null,
        cargoActual: data.cargoActual || null,
        patrullaId: data.patrullaId || null,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: `/app/${unitType.toLowerCase()}` });
      }, 1500);
    } catch (err: any) {
      console.error('Error al actualizar:', err);
      setError(err?.response?.data?.message || 'Error al actualizar el miembro.');
    }
  };

  const goBack = () => navigate({ to: `/app/${unitType.toLowerCase()}` });

  const inputClasses =
    'w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all h-[54px]';
  const labelClasses =
    'text-[10px] font-black uppercase tracking-widest px-1 text-outline';
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
            Editar Miembro — {unitLabel}
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            {memberData?.nombres} {memberData?.apellidos}
          </p>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-sm font-bold animate-fade-in">
          ✓ Miembro actualizado correctamente. Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Datos Personales */}
        <section className={sectionClasses}>
          <div className="flex items-center gap-3 mb-8">
            <Person className="text-primary" />
            <h3 className="text-lg font-black text-primary uppercase tracking-tight">
              Datos del Miembro
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className={labelClasses}>Nombres *</label>
              <input {...register('nombres')} className={inputClasses} />
              {errors.nombres && <p className="text-[10px] text-error font-bold px-1">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Apellidos *</label>
              <input {...register('apellidos')} className={inputClasses} />
              {errors.apellidos && <p className="text-[10px] text-error font-bold px-1">{errors.apellidos.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Cédula *</label>
              <input {...register('cedula')} className={inputClasses} />
              {errors.cedula && <p className="text-[10px] text-error font-bold px-1">{errors.cedula.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <CalendarMonth sx={{ fontSize: 12, mr: 0.5 }} /> Fecha de Nacimiento *
              </label>
              <input {...register('fechaNacimiento')} type="date" className={inputClasses} />
              {errors.fechaNacimiento && (
                <p className="text-[10px] text-error font-bold px-1">{errors.fechaNacimiento.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <Wc sx={{ fontSize: 12, mr: 0.5 }} /> Género *
              </label>
              <select {...register('genero')} className={inputClasses}>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
                {errors.genero && <p className="text-[10px] text-error font-bold px-1">{errors.genero.message}</p>}
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Estado</label>
                <select {...register('estado')} className={inputClasses}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="EGRESADO">Egresado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 pt-6 border-t border-outline-variant/10">
            <div className="space-y-2">
              <label className={labelClasses}>{subUnitLabel}</label>
              <select {...register('patrullaId')} className={inputClasses}>
                <option value="">Seleccionar {subUnitLabel}...</option>
                {subUnidades.map(su => (
                  <option key={su.id} value={su.id}>{su.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Fecha Ingreso Grupo</label>
              <input {...register('fechaIngreso')} type="date" className={inputClasses} />
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Fecha Promesa</label>
              <input {...register('fechaPromesa')} type="date" className={inputClasses} />
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>Cargo Actual</label>
              <input {...register('cargoActual')} type="text" className={inputClasses} placeholder="Cargo en la unidad..." />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className={labelClasses}>Observaciones / Historial</label>
            <textarea
              {...register('historial')}
              rows={4}
              className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all resize-none"
              placeholder="Notas adicionales..."
            />
          </div>
        </section>

        {/* Datos del Representante (lectura) */}
        {memberData?.Representante && (
          <section className="bg-surface-container-low p-8 md:p-10 rounded-[2rem] border border-outline-variant/5">
            <div className="flex items-center gap-3 mb-8">
              <ContactPhone className="text-secondary" />
              <h3 className="text-lg font-black text-secondary uppercase tracking-tight">
                Representante Asociado
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Nombre</p>
                <p className="text-sm font-bold text-primary uppercase">{memberData.Representante.nombre}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Cédula</p>
                <p className="text-sm font-bold text-primary uppercase">{memberData.Representante.cedula}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Teléfono</p>
                <p className="text-sm font-bold text-primary">{memberData.Representante.telefono || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Parentesco</p>
                <p className="text-sm font-bold text-primary">{memberData.Representante.parentesco || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">
                  <Home sx={{ fontSize: 10, mr: 0.5 }} /> Dirección
                </p>
                <p className="text-sm font-bold text-primary uppercase">{memberData.Representante.direccion || 'N/A'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Controls */}
        <div className="flex justify-between gap-4">
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
            className="sentinel-gradient px-10 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <SaveAlt sx={{ fontSize: 16 }} />
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
