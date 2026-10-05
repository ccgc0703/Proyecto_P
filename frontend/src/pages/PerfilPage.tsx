import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { adultosApi, miembrosApi, usuariosApi } from '../api';
import { FichaMedicaPanel } from '../features/fichaMedica/FichaMedicaPanel';
import { 
  Person, 
  Shield, 
  Email, 
  Fingerprint,
  VerifiedUser,
  Key,
  MedicalInformation,
  MilitaryTech
} from '@mui/icons-material';

const perfilSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
});
type PerfilFormData = z.infer<typeof perfilSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerida'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
type PasswordFormData = z.infer<typeof passwordSchema>;

const miPerfilSchema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  cedula: z.string().min(3, 'Mínimo 3 caracteres'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida'),
  genero: z.enum(['MASCULINO', 'FEMENINO'], { message: 'Seleccioná un género' }),
  cargoActual: z.string().optional(),
  fechaIngreso: z.string().optional(),
  fechaPromesa: z.string().optional(),
  historial: z.string().optional(),
});
type MiPerfilFormData = z.infer<typeof miPerfilSchema>;

interface MiPerfilJoven {
  id: string;
  nombres?: string;
  apellidos?: string;
  cedula?: string;
  fechaNacimiento?: string;
  genero?: string;
  estado?: string;
  historial?: string;
  fechaIngreso?: string;
  fechaPromesa?: string;
  cargoActual?: string;
  Unidad?: { id?: string; nombre?: string };
  Representante?: { id?: string; nombre?: string } | null;
}

export const PerfilPage = () => {
  const { user, checkAuth, logout } = useAuth();
  const [success, setSuccess] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [miembroId, setMiembroId] = useState<string | undefined>(undefined);
  const [staffNombre, setStaffNombre] = useState('');
  const [miembroDatos, setMiembroDatos] = useState<MiPerfilJoven | null>(null);
  const [miSuccess, setMiSuccess] = useState(false);
  const [miError, setMiError] = useState<string | null>(null);

  const esJoven = user?.roles?.includes('JOVEN') ?? false;

  useEffect(() => {
    (async () => {
      if (esJoven) {
        try {
          const perfil = (await miembrosApi.getMiPerfil()) as MiPerfilJoven | undefined;
          if (perfil) {
            setMiembroDatos(perfil);
            setMiembroId(perfil.id ?? user?.miembroId);
            setStaffNombre(`${perfil.nombres ?? ''} ${perfil.apellidos ?? ''}`.trim());
          }
        } catch {
          // Sin perfil de joven vinculado: conservar miembroId del token si existe
          setMiembroId(user?.miembroId);
        }
        return;
      }
      try {
        const perfil = await adultosApi.getMiPerfil();
        setMiembroId(perfil?.miembroId);
        const m = perfil?.Miembro;
        setStaffNombre(m ? `${m.nombres} ${m.apellidos}` : '');
      } catch {
        // El usuario logueado no está vinculado a un perfil de adulto: sin ficha médica
        setMiembroId(undefined);
      }
    })();
  }, [esJoven, user?.miembroId]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PerfilFormData>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: user?.nombre || '', apellido: user?.apellido || '', email: user?.email || '' },
  });

  const pwdForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const miForm = useForm<MiPerfilFormData>({
    resolver: zodResolver(miPerfilSchema),
    defaultValues: {
      nombres: '',
      apellidos: '',
      cedula: '',
      fechaNacimiento: '',
      genero: 'MASCULINO',
      cargoActual: '',
      fechaIngreso: '',
      fechaPromesa: '',
      historial: '',
    },
  });

  useEffect(() => {
    if (miembroDatos) {
      miForm.reset({
        nombres: miembroDatos.nombres ?? '',
        apellidos: miembroDatos.apellidos ?? '',
        cedula: miembroDatos.cedula ?? '',
        fechaNacimiento: miembroDatos.fechaNacimiento ? miembroDatos.fechaNacimiento.slice(0, 10) : '',
        genero: miembroDatos.genero === 'FEMENINO' ? 'FEMENINO' : 'MASCULINO',
        cargoActual: miembroDatos.cargoActual ?? '',
        fechaIngreso: miembroDatos.fechaIngreso ? miembroDatos.fechaIngreso.slice(0, 10) : '',
        fechaPromesa: miembroDatos.fechaPromesa ? miembroDatos.fechaPromesa.slice(0, 10) : '',
        historial: miembroDatos.historial ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miembroDatos]);

  const onSubmitPerfil = async (data: PerfilFormData) => {
    try {
      setError(null);
      await usuariosApi.updateMe(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await checkAuth();
    } catch {
      setError('Error al actualizar el perfil');
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setPwdError(null);
      await usuariosApi.changeMyPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      pwdForm.reset();
      setPwdSuccess(true);
      // El backend invalida el token vigente: llevar al login tras el aviso
      setTimeout(() => {
        logout();
        window.location.replace('/login');
      }, 2500);
    } catch {
      setPwdError('Error al cambiar la contraseña');
    }
  };

  const onSubmitMiPerfil = async (data: MiPerfilFormData) => {
    try {
      setMiError(null);
      const payload: Record<string, unknown> = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedula: data.cedula,
        fechaNacimiento: data.fechaNacimiento,
        genero: data.genero,
        cargoActual: data.cargoActual?.trim() || null,
        fechaIngreso: data.fechaIngreso || null,
        fechaPromesa: data.fechaPromesa || null,
        historial: data.historial?.trim() || null,
      };
      const actualizado = (await miembrosApi.updateMiPerfil(payload)) as MiPerfilJoven | undefined;
      if (actualizado) setMiembroDatos(actualizado);
      setMiSuccess(true);
      setTimeout(() => setMiSuccess(false), 3000);
    } catch {
      setMiError('No se pudo actualizar tu información scout');
    }
  };

  const initials = user?.nombre
    ? user.nombre.charAt(0).toUpperCase() + (user.apellido?.charAt(0).toUpperCase() || '')
    : '?';

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <header className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
          <Person fontSize="medium" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-primary uppercase">
            {esJoven ? 'Mi Perfil Joven' : 'Mi Perfil Agente'}
          </h2>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">ID de Enlace: {user?.id.slice(0, 8)}...</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Fingerprint sx={{ fontSize: 100 }} />
             </div>

            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto mb-4 sentinel-gradient rounded-3xl flex items-center justify-center text-on-primary font-black text-2xl shadow-xl shadow-primary/20">
                {initials}
              </div>
              
              <h3 className="text-xl font-black text-primary mb-1 uppercase tracking-tight">
                {user?.nombre} {user?.apellido}
              </h3>
              <p className="text-xs font-bold text-outline mb-6">{user?.email}</p>

              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {user?.roles.map((role) => (
                  <span key={role} className="bg-primary px-3 py-1 rounded-full text-[9px] font-black text-on-primary uppercase tracking-widest">
                    {role.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>

              <div className="h-px bg-surface-container-high w-full mb-6" />

              <div className="text-left space-y-4">
                <div className="flex items-center gap-3">
                   <Shield className="text-outline" fontSize="small" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Nivel de Autorización</h4>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {user?.permissions.slice(0, 8).map((perm) => (
                    <span key={perm} className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-surface-container-high border border-outline-variant/10 text-outline">
                      {perm}
                    </span>
                  ))}
                  {(user?.permissions.length ?? 0) > 8 && (
                    <span className="text-[8px] font-bold text-outline">+{ (user?.permissions.length ?? 0) - 8 }</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-low p-6 rounded-[2rem] flex items-center gap-4">
             <div className="w-10 h-10 bg-tertiary/20 rounded-xl flex items-center justify-center text-primary">
                <VerifiedUser />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Estado de Seguridad</p>
                <p className="text-xs font-bold text-outline uppercase tracking-widest">Protocolo Validado</p>
             </div>
          </section>
        </div>

        {/* Right Column: Editing Forms */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Info Form */}
          <section className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Email className="text-primary" />
              <h3 className="text-lg font-black text-primary uppercase tracking-tight">Información de Enlace</h3>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2">
                <span>✓ Perfil actualizado correctamente en el nodo central.</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Nombre</label>
                  <input {...register('nombre')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                  {errors.nombre && <p className="text-[10px] text-error font-bold px-1">{errors.nombre.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Apellido</label>
                  <input {...register('apellido')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                  {errors.apellido && <p className="text-[10px] text-error font-bold px-1">{errors.apellido.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Correo Electrónico</label>
                <input {...register('email')} type="email" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                {errors.email && <p className="text-[10px] text-error font-bold px-1">{errors.email.message}</p>}
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Sincronizando...' : 'Sincronizar Datos'}
                </button>
              </div>
            </form>
          </section>

          {/* Mis Datos Scout (solo jóvenes con perfil vinculado) */}
          {esJoven && miembroDatos && (
            <section className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <MilitaryTech className="text-primary" />
                <h3 className="text-lg font-black text-primary uppercase tracking-tight">Mis Datos Scout</h3>
              </div>

              {miSuccess && (
                <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2">
                  <span>✓ Información scout actualizada correctamente.</span>
                </div>
              )}

              {miError && (
                <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in">
                  {miError}
                </div>
              )}

              <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-surface-container-high rounded-xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Unidad</p>
                  <p className="text-sm font-bold text-on-surface">{miembroDatos.Unidad?.nombre ?? '—'}</p>
                </div>
                <div className="bg-surface-container-high rounded-xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Representante</p>
                  <p className="text-sm font-bold text-on-surface">{miembroDatos.Representante?.nombre ?? '—'}</p>
                </div>
                <div className="bg-surface-container-high rounded-xl p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Estado</p>
                  <p className="text-sm font-bold text-on-surface">{miembroDatos.estado ?? '—'}</p>
                </div>
              </div>

              <form onSubmit={miForm.handleSubmit(onSubmitMiPerfil)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Nombres</label>
                    <input {...miForm.register('nombres')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                    {miForm.formState.errors.nombres && <p className="text-[10px] text-error font-bold px-1">{miForm.formState.errors.nombres.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Apellidos</label>
                    <input {...miForm.register('apellidos')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                    {miForm.formState.errors.apellidos && <p className="text-[10px] text-error font-bold px-1">{miForm.formState.errors.apellidos.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Cédula</label>
                    <input {...miForm.register('cedula')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                    {miForm.formState.errors.cedula && <p className="text-[10px] text-error font-bold px-1">{miForm.formState.errors.cedula.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Fecha de Nacimiento</label>
                    <input {...miForm.register('fechaNacimiento')} type="date" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                    {miForm.formState.errors.fechaNacimiento && <p className="text-[10px] text-error font-bold px-1">{miForm.formState.errors.fechaNacimiento.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Género</label>
                    <select {...miForm.register('genero')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]">
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMENINO">FEMENINO</option>
                    </select>
                    {miForm.formState.errors.genero && <p className="text-[10px] text-error font-bold px-1">{miForm.formState.errors.genero.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Cargo Actual</label>
                    <input {...miForm.register('cargoActual')} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Fecha de Ingreso</label>
                    <input {...miForm.register('fechaIngreso')} type="date" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Fecha de Promesa</label>
                    <input {...miForm.register('fechaPromesa')} type="date" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary h-[54px]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Historial</label>
                  <textarea {...miForm.register('historial')} rows={3} className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary" />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={miForm.formState.isSubmitting}
                    className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {miForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Datos Scout'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Password Change Form */}
          <section className="p-8 rounded-[2rem] shadow-sm bg-surface-container-low">
            <div className="flex items-center gap-3 mb-8">
              <Key className="text-secondary" />
              <h3 className="text-lg font-black text-secondary uppercase tracking-tight">Rotación de Claves</h3>
            </div>

            {pwdSuccess && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2">
                <span>✓ Contraseña actualizada. Serás redirigido al login en unos segundos.</span>
              </div>
            )}
            
            {pwdError && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in">
                {pwdError}
              </div>
            )}

            <form onSubmit={pwdForm.handleSubmit(onSubmitPassword)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Clave Actual</label>
                <input {...pwdForm.register('currentPassword')} type="password" placeholder="••••••••" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-secondary-container h-[54px]" />
                {pwdForm.formState.errors.currentPassword && <p className="text-[10px] text-error font-bold px-1">{pwdForm.formState.errors.currentPassword.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Nueva Clave</label>
                  <input {...pwdForm.register('newPassword')} type="password" placeholder="••••••••" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-secondary-container h-[54px]" />
                  {pwdForm.formState.errors.newPassword && <p className="text-[10px] text-error font-bold px-1">{pwdForm.formState.errors.newPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest px-1 text-outline">Confirmar Nueva Clave</label>
                  <input {...pwdForm.register('confirmPassword')} type="password" placeholder="••••••••" className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-secondary-container h-[54px]" />
                  {pwdForm.formState.errors.confirmPassword && <p className="text-[10px] text-error font-bold px-1">{pwdForm.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={pwdForm.formState.isSubmitting}
                  className="bg-secondary text-on-secondary px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-secondary/20 hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {pwdForm.formState.isSubmitting ? 'Rotando...' : 'Confirmar Rotación'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* Ficha Médica propia (staff vinculado) */}
      <section className="bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <MedicalInformation className="text-emerald-600" />
          <h3 className="text-lg font-black text-primary uppercase tracking-tight">Ficha Médica</h3>
        </div>
        <FichaMedicaPanel miembroId={miembroId} miembroNombre={staffNombre} />
      </section>
    </div>
  );
};
