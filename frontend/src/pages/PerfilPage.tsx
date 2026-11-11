import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { adultosApi, miembrosApi, usuariosApi } from '../api';
import { FichaMedicaPanel } from '../features/fichaMedica/FichaMedicaPanel';
import { PageHeader, Pill } from '../components/ui';
import {
  Email,
  Key,
  MedicalInformation,
  MilitaryTech,
  Password,
  Refresh,
  Save,
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
  const puedeVerFicha = usePermission('medico:view');
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

  const permisos = user?.permissions ?? [];
  const conFicha = Boolean(miembroId) && puedeVerFicha;

  return (
    <div className="space-y-5 animate-fade-in-up pb-10">
      <PageHeader
        micro={
          <span className="tb-crumb">
            <span className="micro">Principal</span>
            <span className="micro">/</span>
            <span className="micro">Perfil</span>
          </span>
        }
        titulo={esJoven ? 'Mi Perfil Joven' : 'Mi Perfil Agente'}
        subtitulo={
          <>
            ID de Enlace:{' '}
            <span className="chip chip-mono" style={{ marginLeft: 4 }}>
              {user?.id.slice(0, 8)}
            </span>
          </>
        }
      />

      <div className="perfil-grid">
        {/* ── Columna lateral: identidad y acceso ─────────────────────── */}
        <div className="perfil-side">
          <div className="card">
            <div className="text-center">
              <div className="avatar-xl" aria-hidden="true">
                <span>{initials}</span>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: '-0.025em',
                  color: 'var(--color-primary)',
                }}
              >
                {user?.nombre} {user?.apellido}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--color-outline)', marginTop: 5 }}>
                {user?.email}
              </p>
              <div className="chip-row justify-center mt-3.5">
                {user?.roles.map((role) => (
                  <span
                    key={role}
                    className="chip chip-mono fill-brand"
                  >
                    {role.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="np-sec" style={{ marginTop: 18 }}>
              <span className="micro">Nivel de autorización</span>
              <div className="seg">
                {permisos.slice(0, 8).map((perm, i) => (
                  <span key={perm} className={i < 4 ? 'hi' : undefined}>
                    {perm}
                  </span>
                ))}
                {permisos.length > 8 && <span>+{permisos.length - 8}</span>}
              </div>
            </div>
          </div>

          <div className="card">
            <span className="micro">Estado de seguridad</span>
            <p className="mt-3">
              <Pill variante="green" dot>
                Protocolo Validado
              </Pill>
            </p>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--color-on-surface-variant)',
                marginTop: 11,
                lineHeight: 1.6,
              }}
            >
              Sesión protegida con JWT. Última verificación hace 2 minutos.
            </p>
          </div>
        </div>

        {/* ── Columna principal: formularios ──────────────────────────── */}
        <div>
          {/* Sección 01 — Información de enlace */}
          <div className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <Email />
              </div>
              <div>
                <span className="micro">Sección 01</span>
                <h3>Información de Enlace</h3>
              </div>
            </header>

            {success && (
              <div className="mb-4 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2" role="status">
                <span>✓ Perfil actualizado correctamente en el nodo central.</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitPerfil)} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label className="micro" htmlFor="perfil-nombre">Nombre</label>
                  <input id="perfil-nombre" {...register('nombre')} className="inp" aria-invalid={!!errors.nombre} />
                  {errors.nombre && <span className="field-err">{errors.nombre.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="perfil-apellido">Apellido</label>
                  <input id="perfil-apellido" {...register('apellido')} className="inp" aria-invalid={!!errors.apellido} />
                  {errors.apellido && <span className="field-err">{errors.apellido.message}</span>}
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="micro" htmlFor="perfil-email">Correo Electrónico</label>
                  <input id="perfil-email" type="email" {...register('email')} className="inp" aria-invalid={!!errors.email} />
                  {errors.email && <span className="field-err">{errors.email.message}</span>}
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  <Refresh />
                  {isSubmitting ? 'Sincronizando...' : 'Sincronizar Datos'}
                </button>
              </div>
            </form>
          </div>

          {/* Sección 02 — Mis datos scout (solo jóvenes con perfil vinculado) */}
          {esJoven && miembroDatos && (
            <div className="form-sect">
              <header>
                <div className="ic" aria-hidden="true">
                  <MilitaryTech />
                </div>
                <div>
                  <span className="micro">Sección 02</span>
                  <h3>Mis Datos Scout</h3>
                </div>
              </header>

              {miSuccess && (
                <div className="mb-4 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2" role="status">
                  <span>✓ Información scout actualizada correctamente.</span>
                </div>
              )}

              {miError && (
                <div className="mb-4 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in" role="alert">
                  {miError}
                </div>
              )}

              <div className="stat-grid">
                <div className="stat-mini">
                  <b>{miembroDatos.Unidad?.nombre ?? '—'}</b>
                  <span>Unidad</span>
                </div>
                <div className="stat-mini">
                  <b>{miembroDatos.Representante?.nombre ?? '—'}</b>
                  <span>Representante</span>
                </div>
                <div className="stat-mini">
                  <b style={{ color: 'var(--color-success)' }}>{miembroDatos.estado ?? '—'}</b>
                  <span>Estado</span>
                </div>
              </div>

              <form onSubmit={miForm.handleSubmit(onSubmitMiPerfil)} noValidate>
                <div className="form-grid">
                  <div className="field">
                    <label className="micro" htmlFor="mi-nombres">Nombres</label>
                    <input id="mi-nombres" {...miForm.register('nombres')} className="inp" aria-invalid={!!miForm.formState.errors.nombres} />
                    {miForm.formState.errors.nombres && <span className="field-err">{miForm.formState.errors.nombres.message}</span>}
                  </div>
                  <div className="field">
                    <label className="micro" htmlFor="mi-apellidos">Apellidos</label>
                    <input id="mi-apellidos" {...miForm.register('apellidos')} className="inp" aria-invalid={!!miForm.formState.errors.apellidos} />
                    {miForm.formState.errors.apellidos && <span className="field-err">{miForm.formState.errors.apellidos.message}</span>}
                  </div>
                  <div className="field">
                    <label className="micro" htmlFor="mi-cedula">Cédula</label>
                    <input id="mi-cedula" {...miForm.register('cedula')} className="inp" aria-invalid={!!miForm.formState.errors.cedula} />
                    {miForm.formState.errors.cedula && <span className="field-err">{miForm.formState.errors.cedula.message}</span>}
                  </div>
                  <div className="field">
                    <label className="micro" htmlFor="mi-nacimiento">Fecha de Nacimiento</label>
                    <input id="mi-nacimiento" type="date" {...miForm.register('fechaNacimiento')} className="inp" aria-invalid={!!miForm.formState.errors.fechaNacimiento} />
                    {miForm.formState.errors.fechaNacimiento && <span className="field-err">{miForm.formState.errors.fechaNacimiento.message}</span>}
                  </div>
                  <div className="field">
                    <label className="micro" htmlFor="mi-genero">Género</label>
                    <select id="mi-genero" {...miForm.register('genero')} className="inp" aria-invalid={!!miForm.formState.errors.genero}>
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMENINO">FEMENINO</option>
                    </select>
                    {miForm.formState.errors.genero && <span className="field-err">{miForm.formState.errors.genero.message}</span>}
                  </div>
                  <div className="field">
                    <label className="micro" htmlFor="mi-cargo">Cargo Actual</label>
                    <input id="mi-cargo" {...miForm.register('cargoActual')} className="inp" />
                  </div>
                  <div className="field">
                    <label className="micro" htmlFor="mi-ingreso">Fecha de Ingreso</label>
                    <input id="mi-ingreso" type="date" {...miForm.register('fechaIngreso')} className="inp" />
                  </div>
                  <div className="field">
                    <label className="micro" htmlFor="mi-promesa">Fecha de Promesa</label>
                    <input id="mi-promesa" type="date" {...miForm.register('fechaPromesa')} className="inp" />
                  </div>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label className="micro" htmlFor="mi-historial">Historial</label>
                    <textarea id="mi-historial" rows={3} {...miForm.register('historial')} className="inp" />
                  </div>
                </div>

                <div className="form-actions" style={{ marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary" disabled={miForm.formState.isSubmitting}>
                    <Save />
                    {miForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Datos Scout'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sección 03 — Rotación de claves */}
          <div className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <Password />
              </div>
              <div>
                <span className="micro">Sección 03</span>
                <h3>Rotación de Claves</h3>
              </div>
            </header>

            {pwdSuccess && (
              <div className="mb-4 p-4 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2" role="status">
                <span>✓ Contraseña actualizada. Serás redirigido al login en unos segundos.</span>
              </div>
            )}

            {pwdError && (
              <div className="mb-4 p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in" role="alert">
                {pwdError}
              </div>
            )}

            <form onSubmit={pwdForm.handleSubmit(onSubmitPassword)} noValidate>
              <div className="form-grid">
                <div className="field">
                  <label className="micro" htmlFor="pwd-actual">Clave Actual</label>
                  <input id="pwd-actual" type="password" placeholder="••••••••" {...pwdForm.register('currentPassword')} className="inp" aria-invalid={!!pwdForm.formState.errors.currentPassword} />
                  {pwdForm.formState.errors.currentPassword && <span className="field-err">{pwdForm.formState.errors.currentPassword.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="pwd-nueva">Nueva Clave</label>
                  <input id="pwd-nueva" type="password" placeholder="••••••••" {...pwdForm.register('newPassword')} className="inp" aria-invalid={!!pwdForm.formState.errors.newPassword} />
                  {pwdForm.formState.errors.newPassword && <span className="field-err">{pwdForm.formState.errors.newPassword.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="pwd-confirmar">Confirmar Nueva Clave</label>
                  <input id="pwd-confirmar" type="password" placeholder="••••••••" {...pwdForm.register('confirmPassword')} className="inp" aria-invalid={!!pwdForm.formState.errors.confirmPassword} />
                  {pwdForm.formState.errors.confirmPassword && <span className="field-err">{pwdForm.formState.errors.confirmPassword.message}</span>}
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 16 }}>
                <button type="submit" className="btn btn-secondary" disabled={pwdForm.formState.isSubmitting}>
                  <Key />
                  {pwdForm.formState.isSubmitting ? 'Rotando...' : 'Confirmar Rotación'}
                </button>
              </div>
            </form>
          </div>

          {/* Sección 04 — Ficha médica propia (staff vinculado) */}
          {conFicha && (
            <div className="form-sect">
              <header>
                <div className="ic" aria-hidden="true">
                  <MedicalInformation />
                </div>
                <div>
                  <span className="micro">Sección 04</span>
                  <h3>Ficha Médica</h3>
                </div>
              </header>
              <FichaMedicaPanel miembroId={miembroId} miembroNombre={staffNombre} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
