import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { getApiErrorMessage } from '../utils/errors';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
      navigate({ to: '/app' });
    } catch (err: unknown) {
      // Muestra el mensaje del API (p.ej. "Credenciales inválidas") en vez
      // del texto crudo de Axios ("Request failed with status code 401")
      setError(getApiErrorMessage(err, 'No se pudo iniciar sesión'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pb-24">
      <main className="login-shell animate-fade-in-up">
        {/* ── Columna de marca ─────────────────────────────────────── */}
        <div className="login-brand">
          <div className="brand-mark">
            <div className="brand-sq" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="brand-name">Grupo Scout</div>
              <div className="brand-sub">Sentinel Protocol</div>
            </div>
          </div>

          <div>
            <h1 className="login-h1">
              Navega tu misión con <em>autoridad.</em>
            </h1>
            <p className="login-p">
              Centro de comando para unidades, progresión, staff y planificación del movimiento scout.
            </p>
          </div>

          <div className="login-chip">
            <span className="dot" aria-hidden="true" /> Sentinel Protocol · Activo
          </div>
        </div>

        {/* ── Columna del formulario ───────────────────────────────── */}
        <div className="login-form">
          <h2>Inicio de sesión</h2>
          <p className="sub">Ingresa tus credenciales para continuar la guardia.</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 bg-error-container text-on-error rounded-[var(--radius-DEFAULT)] text-[13px] font-semibold border border-error/10 animate-fade-in"
              >
                {error}
              </div>
            )}

            {/* Correo */}
            <div className="field">
              <label className="micro" htmlFor="lg-email">
                Correo electrónico
              </label>
              <div className="inp-wrap">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  id="lg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ejemplo@scout.org"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'lg-email-err' : undefined}
                  className="inp"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <span className="field-err" id="lg-email-err">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Contraseña */}
            <div className="field">
              <label className="micro" htmlFor="lg-pass">
                Contraseña
              </label>
              <div className="inp-wrap">
                <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
                <input
                  id="lg-pass"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'lg-pass-err' : undefined}
                  className="inp"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="tail"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {errors.password && (
                <span className="field-err" id="lg-pass-err">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="row-between">
              <label className="chk" htmlFor="remember">
                <input id="remember" type="checkbox" /> Mantener sesión iniciada
              </label>
              <a className="link" href="#" onClick={(e) => e.preventDefault()}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span
                    className="w-[17px] h-[17px] rounded-full border-2 border-white/30 border-t-white animate-spin"
                    aria-hidden="true"
                  />
                  Verificando…
                </>
              ) : (
                <>
                  Autenticar acceso
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="login-foot">
            ¿Nuevo recluta?{' '}
            <a className="link" href="#" onClick={(e) => e.preventDefault()}>
              Solicitar acceso
            </a>
          </p>
        </div>
      </main>

      <footer className="login-meta" aria-hidden="true">
        <span>
          <i /> Sistema v5.0
        </span>
        <span>
          <i /> Nodo Regional LATAM-S1
        </span>
        <span>
          <i /> © 2026 Sentinel Protocol
        </span>
      </footer>
    </div>
  );
};
