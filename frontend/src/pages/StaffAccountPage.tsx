import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  VpnKey,
  Email,
  Shield,
} from '@mui/icons-material';
import { adultosApi, rbacApi } from '../api';

const accountSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rolId: z.string().min(1, 'Requerido'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export const StaffAccountPage = () => {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false }) as { id: string };
  const [member, setMember] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [mData, rData] = await Promise.all([
          adultosApi.getById(id),
          rbacApi.getRoles()
        ]);
        setMember(mData);
        setRoles(rData);
      } catch (err) {
        console.error('Error:', err);
        setFormError('No se pudo cargar la información del staff.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      setFormError(null);
      await adultosApi.createAccount(id, data);
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: '/app/staff' });
      }, 1500);
    } catch (err: any) {
      console.error('Error:', err);
      setFormError(err?.response?.data?.message || 'Error al vincular la cuenta.');
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
    <div className="space-y-8 animate-fade-in-up pb-10 max-w-4xl mx-auto">
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
            Vincular Cuenta de Sistema
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Creando acceso digital para {member?.nombres} {member?.apellidos}
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
          ✓ Cuenta vinculada y acceso autorizado correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className={sectionClasses}>
          <div className="flex items-center gap-4 mb-10 p-6 bg-surface-container-low rounded-3xl border border-outline-variant/10">
            <div className="w-16 h-16 rounded-2xl sentinel-gradient flex items-center justify-center text-on-primary font-black text-xl shadow-lg">
              {member?.nombres?.[0]}{member?.apellidos?.[0]}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-1">Agente Identificado</p>
              <h4 className="text-2xl font-black text-primary uppercase">{member?.nombres} {member?.apellidos}</h4>
              <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">C.I. {member?.cedula}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className={labelClasses}>
                <Email sx={{ fontSize: 14 }} /> Correo Electrónico (Usuario) *
              </label>
              <input {...register('email')} type="email" className={inputClasses} placeholder="correo@scout.com" />
              {errors.email && <p className="text-[10px] text-error font-bold px-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <VpnKey sx={{ fontSize: 14 }} /> Contraseña de Acceso *
              </label>
              <input {...register('password')} type="password" className={inputClasses} placeholder="Mínimo 6 caracteres" />
              {errors.password && <p className="text-[10px] text-error font-bold px-1">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <label className={labelClasses}>
                <Shield sx={{ fontSize: 14 }} /> Nivel de Autorización (Rol) *
              </label>
              <select {...register('rolId')} className={inputClasses}>
                <option value="">Seleccione el nivel jerárquico</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.nombre.replace(/_/g, ' ')}</option>
                ))}
              </select>
              {errors.rolId && <p className="text-[10px] text-error font-bold px-1">{errors.rolId.message}</p>}
            </div>
          </div>
        </section>

        <div className="flex justify-between items-center gap-4">
           <button
             type="button"
             onClick={goBack}
             className="px-8 py-4 bg-surface-container-high text-primary rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"
           >
             Cancelar
           </button>
           <button
             type="submit"
             disabled={isSubmitting || success}
             className="sentinel-gradient text-on-primary px-12 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
           >
             <VpnKey sx={{ fontSize: 18 }} />
             {isSubmitting ? 'Procesando...' : 'Autorizar y Vincular'}
           </button>
        </div>
      </form>
    </div>
  );
};
