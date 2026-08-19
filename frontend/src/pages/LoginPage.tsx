import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { 
  Shield, 
  Lock, 
  Email, 
  Visibility, 
  VisibilityOff,
  ArrowForward,
  VerifiedUser,
  Explore
} from '@mui/icons-material';

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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      await login(data);
      navigate({ to: '/app' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Credenciales incorrectas';
      setError(errorMessage);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-6 selection:bg-tertiary-fixed">
      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]"></div>
        <Explore className="text-on-surface/[0.02] !text-[600px] absolute" />
      </div>

      {/* Main Content Shell */}
      <main className="relative z-10 w-full max-w-[1100px] grid md:grid-cols-2 bg-surface-container-lowest shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] rounded-xl overflow-hidden border border-outline-variant/10">
        
        {/* Branding & Visual Column */}
        <div className="sentinel-gradient p-12 flex flex-col justify-between text-white min-h-[400px]">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="text-primary text-3xl" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tighter leading-none">Modern Sentinel</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">The Precision Navigator</p>
              </div>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
                Navega tu misión con <span className="text-accent">autoridad.</span>
              </h1>
              <p className="text-lg text-primary-fixed-dim/80 leading-relaxed max-w-sm">
                Accede al centro de comando para unidades, gestión de staff y planificación táctica.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 py-4 px-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 w-fit">
            <VerifiedUser className="text-accent" />
            <span className="text-sm font-medium">Sentinel Protocol Active</span>
          </div>
        </div>

        {/* Login Form Column */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-primary mb-2">Inicio de Sesión</h2>
            <p className="text-on-surface-variant font-medium">Ingresa tus credenciales para continuar la guardia.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm font-semibold border border-error/10 animate-fade-in">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="group">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2 ml-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Email className="text-outline text-lg" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="ejemplo@scout.com"
                  className={`w-full pl-12 pr-4 py-4 bg-surface-container-high border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary transition-all ${errors.email ? 'ring-2 ring-error' : ''}`}
                />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-focus-within:w-full"></div>
              </div>
              {errors.email && (
                <span className="text-xs text-error font-bold mt-1 ml-1">{errors.email.message}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="group">
              <div className="flex justify-between items-center mb-2 mx-1">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-bold text-secondary-container bg-secondary/10 px-2 py-0.5 rounded hover:bg-secondary/20 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-outline text-lg" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-4 bg-surface-container-high border-none rounded-lg text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary transition-all ${errors.password ? 'ring-2 ring-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-focus-within:w-full"></div>
              </div>
              {errors.password && (
                <span className="text-xs text-error font-bold mt-1 ml-1">{errors.password.message}</span>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 py-2">
              <input
                id="remember"
                type="checkbox"
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary transition-all cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm font-semibold text-on-surface-variant cursor-pointer">
                Mantener la sesión iniciada
              </label>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="sentinel-gradient w-full py-4 rounded-xl text-on-primary font-bold tracking-tight shadow-[0_8px_24px_-8px_rgba(10,26,117,0.4)] hover:shadow-[0_12px_32px_-8px_rgba(10,26,117,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Autenticar Acceso</span>
                    <ArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secondary Actions */}
          <div className="mt-12 text-center border-t border-surface-container-high pt-8">
            <p className="text-sm text-outline font-medium">
              ¿Eres un nuevo recluta?
              <a href="#" className="text-primary font-bold hover:underline ml-1">
                Solicitar Acceso
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="fixed bottom-8 w-full flex justify-center px-6 pointer-events-none z-20">
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-outline/50">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full"></span>
            System v4.2.0
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-secondary/40 rounded-full"></span>
            Regional Node: LATAM-S1
          </span>
          <span>© 2026 Modern Sentinel</span>
        </div>
      </footer>
    </div>
  );
};
