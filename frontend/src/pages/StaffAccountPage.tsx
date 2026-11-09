import { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowBack, Email, Shield, VpnKey } from '@mui/icons-material';
import { adultosApi, rbacApi } from '../api';
import { getApiErrorMessage } from '../utils/errors';
import { useAuth } from '../hooks/useAuth';
import { puedeAsignarRol } from '../types/auth';
import { PageHeader, StateBlock } from '../components/ui';

interface StaffAccount {
  nombres?: string;
  apellidos?: string;
  cedula?: string;
}

interface RoleOption {
  id: string;
  nombre: string;
}

const accountSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rolId: z.string().min(1, 'Requerido'),
});

type AccountFormData = z.infer<typeof accountSchema>;

export const StaffAccountPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams({ strict: false }) as { id: string };
  const [member, setMember] = useState<StaffAccount | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
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
        setMember(mData as StaffAccount);
        setRoles(rData as RoleOption[]);
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
    } catch (err) {
      console.error('Error al vincular la cuenta:', err);
      setFormError(getApiErrorMessage(err, 'Error al vincular la cuenta.'));
    }
  };

  const goBack = () => navigate({ to: '/app/staff' });

  const iniciales = `${member?.nombres?.[0] ?? ''}${member?.apellidos?.[0] ?? ''}` || '?';

  if (loading) {
    return (
      <div className="animate-fade-in-up pb-10 max-w-4xl mx-auto">
        <StateBlock estado="loading" filas={4} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up pb-10 max-w-4xl mx-auto">
      <PageHeader
        micro={
          <span className="tb-crumb">
            <span className="micro">Staff</span>
            <span className="micro">/</span>
            <span className="micro">Vincular cuenta</span>
          </span>
        }
        titulo="Vincular Cuenta de Sistema"
        subtitulo={
          <>
            Creando acceso digital para <strong>{member?.nombres} {member?.apellidos}</strong>
          </>
        }
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
          ✓ Cuenta vinculada y acceso autorizado correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
        <div className="form-sect">
          <header>
            <div className="ic" aria-hidden="true">
              <VpnKey />
            </div>
            <div>
              <span className="micro">Identificación</span>
              <h3>Agente Identificado</h3>
            </div>
          </header>

          <div
            className="flex items-center gap-4 p-5 rounded-xl mb-5"
            style={{
              background: 'var(--color-surface-container-low)',
              border: '1px solid var(--color-outline-variant)',
            }}
          >
            <div className="avatar-xl" style={{ width: 64, height: 64, fontSize: 22, borderRadius: 18, margin: 0 }}>
              <span>{iniciales}</span>
            </div>
            <div className="min-w-0">
              <p className="micro">Agente Identificado</p>
              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: '-0.025em',
                  color: 'var(--color-primary)',
                  marginTop: 4,
                }}
              >
                {member?.nombres} {member?.apellidos}
              </h4>
              <p className="text-xs font-bold text-outline mt-1">C.I. {member?.cedula}</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="micro" htmlFor="cuenta-email">
                <Email sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                Correo Electrónico (Usuario) *
              </label>
              <input
                id="cuenta-email"
                {...register('email')}
                type="email"
                className="inp"
                placeholder="correo@scout.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && <span className="field-err">{errors.email.message}</span>}
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="micro" htmlFor="cuenta-password">
                <VpnKey sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                Contraseña de Acceso *
              </label>
              <input
                id="cuenta-password"
                {...register('password')}
                type="password"
                className="inp"
                placeholder="Mínimo 6 caracteres"
                aria-invalid={!!errors.password}
              />
              {errors.password && <span className="field-err">{errors.password.message}</span>}
            </div>

            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="micro" htmlFor="cuenta-rol">
                <Shield sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                Nivel de Autorización (Rol) *
              </label>
              <select id="cuenta-rol" {...register('rolId')} className="inp" aria-invalid={!!errors.rolId}>
                <option value="">Seleccione el nivel jerárquico</option>
                {roles
                  .filter((r) => puedeAsignarRol(user?.roles ?? [], r.nombre))
                  .map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre.replace(/_/g, ' ')}</option>
                  ))}
              </select>
              {errors.rolId && <span className="field-err">{errors.rolId.message}</span>}
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="button" onClick={goBack} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || success}>
              <VpnKey />
              {isSubmitting ? 'Procesando...' : 'Autorizar y Vincular'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
