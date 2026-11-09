import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  Badge,
  CalendarMonth,
  Email,
  EscalatorWarning,
  Person,
  SaveAlt,
  Shield,
  VpnKey,
  Wc,
} from '@mui/icons-material';
import { adultosApi, unidadesApi, rbacApi } from '../api';
import { ordenarPorUnidad } from '../hooks/useUnidad';
import { UnidadEntity } from '../types/member';
import { getApiErrorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';
import { puedeAsignarRol } from '../types/auth';
import { PageHeader } from '../components/ui';

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
  const { user } = useAuth();
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
        setUnidades(ordenarPorUnidad(uData as UnidadEntity[]));
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

  return (
    <div className="space-y-5 animate-fade-in-up pb-10 max-w-5xl mx-auto">
      <PageHeader
        micro={
          <span className="tb-crumb">
            <span className="micro">Staff</span>
            <span className="micro">/</span>
            <span className="micro">Registrar</span>
          </span>
        }
        titulo="Registrar Nuevo Staff / Adulto"
        subtitulo="Añadir nuevo facilitador o administrativo al sistema"
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
          ✓ Adulto registrado correctamente. Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        {/* Datos Personales */}
        <div className="form-sect">
          <header>
            <div className="ic" aria-hidden="true">
              <Person />
            </div>
            <div>
              <span className="micro">Sección 01</span>
              <h3>Información Personal</h3>
            </div>
          </header>

          <div className="form-grid">
            <div className="field">
              <label className="micro" htmlFor="reg-nombres">
                <Person sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Nombres *
              </label>
              <input id="reg-nombres" {...register('nombres')} className="inp" placeholder="Nombre completo" aria-invalid={!!errors.nombres} />
              {errors.nombres && <span className="field-err">{errors.nombres.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="reg-apellidos">
                <Person sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Apellidos *
              </label>
              <input id="reg-apellidos" {...register('apellidos')} className="inp" placeholder="Apellidos" aria-invalid={!!errors.apellidos} />
              {errors.apellidos && <span className="field-err">{errors.apellidos.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="reg-cedula">
                <Badge sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Cédula *
              </label>
              <input id="reg-cedula" {...register('cedula')} className="inp" placeholder="V-0000000" aria-invalid={!!errors.cedula} />
              {errors.cedula && <span className="field-err">{errors.cedula.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="reg-nacimiento">
                <CalendarMonth sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Fecha de Nacimiento *
              </label>
              <input id="reg-nacimiento" type="date" {...register('fechaNacimiento')} className="inp" aria-invalid={!!errors.fechaNacimiento} />
              {errors.fechaNacimiento && <span className="field-err">{errors.fechaNacimiento.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="reg-genero">
                <Wc sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Género *
              </label>
              <select id="reg-genero" {...register('genero')} className="inp" aria-invalid={!!errors.genero}>
                <option value="MASCULINO">MASCULINO</option>
                <option value="FEMENINO">FEMENINO</option>
              </select>
              {errors.genero && <span className="field-err">{errors.genero.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="reg-unidad">
                <EscalatorWarning sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Unidad Scout Asignada *
              </label>
              <select id="reg-unidad" {...register('unidadId')} className="inp" aria-invalid={!!errors.unidadId}>
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
        </div>

        {/* Cuenta de Sistema */}
        <div className="form-sect">
          <header>
            <div className="ic" aria-hidden="true">
              <VpnKey />
            </div>
            <div>
              <span className="micro">Sección 02</span>
              <h3>Acceso al Sistema</h3>
            </div>
            <label className="chk ml-auto" htmlFor="crear-cuenta">
              <input id="crear-cuenta" type="checkbox" {...register('crearCuenta')} />
              <span className="micro">Habilitar Cuenta</span>
            </label>
          </header>

          {watchCrearCuenta && (
            <div className="form-grid animate-fade-in">
              <div className="field">
                <label className="micro" htmlFor="reg-email">
                  <Email sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Email (Usuario) *
                </label>
                <input id="reg-email" type="email" {...register('email')} className="inp" placeholder="correo@scout.com" aria-invalid={!!errors.email} />
                {errors.email && <span className="field-err">{errors.email.message}</span>}
              </div>
              <div className="field">
                <label className="micro" htmlFor="reg-password">
                  <VpnKey sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Contraseña *
                </label>
                <input id="reg-password" type="password" {...register('password')} className="inp" placeholder="******" aria-invalid={!!errors.password} />
                {errors.password && <span className="field-err">{errors.password.message}</span>}
              </div>
              <div className="field">
                <label className="micro" htmlFor="reg-rol">
                  <Shield sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} /> Rol Asignado *
                </label>
                <select id="reg-rol" {...register('rolId')} className="inp" aria-invalid={!!errors.rolId}>
                  <option value="">Seleccione Rol</option>
                  {roles
                    .filter((r) => puedeAsignarRol(user?.roles ?? [], r.nombre))
                    .map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                {errors.rolId && <span className="field-err">{errors.rolId.message}</span>}
              </div>
            </div>
          )}

          {!watchCrearCuenta && (
            <div className="p-4 rounded-xl border border-dashed text-center" style={{ borderColor: 'var(--color-outline-variant)', background: 'var(--color-surface-container-low)' }}>
              <p className="micro">No se creará cuenta de acceso digital en este momento.</p>
            </div>
          )}
        </div>

        {/* Resumen final */}
        <div className="np-head" style={{ marginBottom: 0 }}>
          <span className="micro">Resumen de Agente</span>
          <h4>
            {getValues('nombres') || '---'} {getValues('apellidos') || ''}
          </h4>
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={goBack}
              className="btn btn-sm"
              style={{ background: 'rgba(255, 255, 255, 0.16)', color: '#fff' }}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-gold btn-sm" disabled={isSubmitting || success}>
              <SaveAlt />
              {isSubmitting ? 'Registrando...' : 'Finalizar Registro'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
