import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
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
  VpnKey,
  Email,
  Shield,
  SaveAlt
} from '@mui/icons-material';
import { adultosApi, unidadesApi, rbacApi } from '../api';
import { UnidadEntity } from '../types/member';
import { getApiErrorMessage } from '../utils/errors';

const staffSchema = z.object({
  nombres: z.string().min(2, 'Requerido'),
  apellidos: z.string().min(2, 'Requerido'),
  cedula: z.string().min(5, 'Requerido'),
  fechaNacimiento: z.string().min(1, 'Requerido'),
  genero: z.enum(['MASCULINO', 'FEMENINO']),
  unidadId: z.string().min(1, 'Requerido'),
  crearCuenta: z.boolean().default(false),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  password: z.string().min(6, 'Mínimo 6').or(z.literal('')).optional(),
  rolId: z.string().optional(),
}).refine(data => {
  if (data.crearCuenta) {
    return !!data.email && !!data.password && !!data.rolId;
  }
  return true;
}, { message: "Email, contraseña y rol son obligatorios", path: ["crearCuenta"] });

type StaffFormData = z.infer<typeof staffSchema>;

interface Role {
  id: string;
  nombre: string;
}

export const StaffRegisterPage = () => {
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState<UnidadEntity[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, getValues } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: { crearCuenta: false, genero: 'MASCULINO' }
  });

  const watchCrearCuenta = watch('crearCuenta');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uData, rData] = await Promise.all([
          unidadesApi.getAll(),
          rbacApi.getRoles()
        ]);
        setUnidades(uData as UnidadEntity[]);
        setRoles(rData);
      } catch {
        console.error('Error al cargar datos iniciales');
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: StaffFormData) => {
    try {
      setFormError(null);
      await adultosApi.create({
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedula: data.cedula,
        fechaNacimiento: data.fechaNacimiento,
        genero: data.genero,
        unidadId: data.unidadId,
        ...(data.crearCuenta ? {
          email: data.email,
          password: data.password,
          rolId: data.rolId,
        } : {})
      });
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: '/app/staff' });
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
      setFormError(getApiErrorMessage(err, 'Error al procesar la solicitud'));
    }
  };

  const goBack = () => navigate({ to: '/app/staff' });

  const inputClasses =
    'w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all h-[54px]';
  const labelClasses =
    'text-[10px] font-black uppercase tracking-widest px-1 text-outline flex items-center gap-2';
  const sectionClasses =
    'bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] shadow-sm border border-outline-variant/5';

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
            Registrar Nuevo Staff / Adulto
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Añadir nuevo facilitador o administrativo al sistema
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
          ✓ Adulto registrado correctamente. Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Datos Personales */}
        <section className={sectionClasses}>
          <div className="flex items-center gap-3 mb-8">
            <Person className="text-primary" />
            <h3 className="text-lg font-black text-primary uppercase tracking-tight">
              Información Personal
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClasses}>
                <Person sx={{ fontSize: 14 }} /> Nombres *
              </label>
              <input {...register('nombres')} className={inputClasses} placeholder="Nombre completo" />
              {errors.nombres && <p className="text-[10px] text-error font-bold px-1">{errors.nombres.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <Person sx={{ fontSize: 14 }} /> Apellidos *
              </label>
              <input {...register('apellidos')} className={inputClasses} placeholder="Apellidos" />
              {errors.apellidos && <p className="text-[10px] text-error font-bold px-1">{errors.apellidos.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <Badge sx={{ fontSize: 14 }} /> Cédula *
              </label>
              <input {...register('cedula')} className={inputClasses} placeholder="V-0000000" />
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

        {/* Cuenta de Sistema */}
        <section className={`${sectionClasses} border-l-4 border-l-accent/50`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <VpnKey className="text-accent" />
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">
                Acceso al Sistema
              </h3>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register('crearCuenta')} className="w-5 h-5 rounded text-primary form-checkbox bg-surface-container-highest border-none" />
              <span className="text-[10px] font-black uppercase tracking-widest text-outline">Habilitar Cuenta</span>
            </label>
          </div>

          {watchCrearCuenta && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="space-y-2">
                <label className={labelClasses}>
                  <Email sx={{ fontSize: 14 }} /> Email (Usuario) *
                </label>
                <input {...register('email')} type="email" className={inputClasses} placeholder="correo@scout.com" />
                {errors.email && <p className="text-[10px] text-error font-bold px-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>
                  <VpnKey sx={{ fontSize: 14 }} /> Contraseña *
                </label>
                <input {...register('password')} type="password" className={inputClasses} placeholder="******" />
                {errors.password && <p className="text-[10px] text-error font-bold px-1">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>
                  <Shield sx={{ fontSize: 14 }} /> Rol Asignado *
                </label>
                <select {...register('rolId')} className={inputClasses}>
                  <option value="">Seleccione Rol</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre.replace(/_/g, ' ')}</option>
                  ))}
                </select>
                {errors.rolId && <p className="text-[10px] text-error font-bold px-1">{errors.rolId.message}</p>}
              </div>
            </div>
          )}

          {!watchCrearCuenta && (
            <div className="p-4 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center">
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                No se creará cuenta de acceso digital en este momento.
              </p>
            </div>
          )}
        </section>

        {/* Resumen Final Visual */}
        <section className="bg-primary p-8 rounded-[2rem] text-on-primary">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                 <Person sx={{ color: 'white' }} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Resumen de Agente</p>
                  <h4 className="text-xl font-black uppercase truncate max-w-[300px]">
                    {getValues('nombres') || '---'} {getValues('apellidos') || ''}
                  </h4>
               </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success}
                className="bg-accent text-primary px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <SaveAlt sx={{ fontSize: 16 }} />
                {isSubmitting ? 'Registrando...' : 'Finalizar Registro'}
              </button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};
