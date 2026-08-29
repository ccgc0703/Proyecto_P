import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCanViewAllUnidades } from '../hooks/useUnidad';
import { api } from '../api';
import { 
  Groups2, 
  TrendingUp,
  EventAvailable,
  MilitaryTech,
  ArrowForward,
  ChevronRight,
  Radar
} from '@mui/icons-material';

interface Stats {
  totalJovenes: number;
  manada: number;
  tropa: number;
  caminantes: number;
  clan: number;
}

const UPCOMING_ACTIVITIES = [
  { id: 1, title: 'Campamento de Primavera', date: '15 Abr - 17 Abr', location: 'Reserva Natural "Los Pinos"', type: 'CAMP' },
  { id: 2, title: 'Torneo Comunitario Limpieza Río', date: '22 Abr', location: 'Ribera del Río Bravo', type: 'COMM' },
  { id: 3, title: 'Inscripción de Dirigentes', date: '30 Abr', location: 'Sede Central', type: 'ADMIN' },
];

export const DashboardPage = () => {
  const { user, token } = useAuth();
  const canViewAll = useCanViewAllUnidades();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        const response = await api.get('/jovenes/stats');
        setStats(response.data.data);
      } catch {
        setStats({ totalJovenes: 0, manada: 0, tropa: 0, caminantes: 0, clan: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const totalMembers = stats?.totalJovenes ?? 0;
  const activeUnities = canViewAll ? 4 : 1; // Simplificación para demo visual
  const growthRate = "+12%"; // Estático para demo visual

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-primary">Dashboard de inicio</h1>
          <p className="text-sm font-medium text-outline/70">Bienvenido de nuevo al centro de comando, {user?.nombre}.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-high hover:bg-surface-container-highest transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
            <TrendingUp sx={{ fontSize: 16 }} /> Generar Reporte
          </button>
        </div>
      </header>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Members */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-4 flex items-center gap-2">
            <Groups2 sx={{ fontSize: 14 }} className="text-primary" /> Total Miembros
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black text-primary tracking-tighter">{loading ? '---' : totalMembers}</h2>
            <span className="text-[10px] font-black text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded-full">Global</span>
          </div>
        </div>

        {/* Active Unities */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-[4rem] group-hover:bg-secondary/10 transition-colors" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-4 flex items-center gap-2">
            <MilitaryTech sx={{ fontSize: 14 }} className="text-secondary" /> Unidades Activas
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black text-primary tracking-tighter">{activeUnities}</h2>
            <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full mb-1">Activas</span>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-sm border border-outline-variant/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-[4rem] group-hover:bg-accent/20 transition-colors" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-outline mb-4 flex items-center gap-2">
            <TrendingUp sx={{ fontSize: 14 }} className="text-tertiary" /> Tasa de Crecimiento
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black text-tertiary tracking-tighter">{growthRate}</h2>
            <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">+2 este mes</span>
          </div>
        </div>
      </div>

      {/* Main content asymmetrical grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Breakdown + Activities (8/12) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Breakdown by Units Card */}
          <section className="bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-sm border border-outline-variant/5">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black tracking-tight text-primary">Desglose por Unidades</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary flex items-center gap-1 transition-colors">
                Ver Detalles <ChevronRight sx={{ fontSize: 14 }} />
              </button>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Doughnut Chart Placeholder (CSS based) */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f1" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-primary)" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="100" strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-secondary)" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="180" strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-primary">{totalMembers}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-outline">Total</span>
                </div>
              </div>

              {/* Legend with data */}
              <div className="grid grid-cols-2 gap-x-12 gap-y-6 flex-1 w-full">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Manada</p>
                  </div>
                  <p className="text-xl font-black text-primary">{stats?.manada ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Tropa</p>
                  </div>
                  <p className="text-xl font-black text-primary">{stats?.tropa ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Caminantes</p>
                  </div>
                  <p className="text-xl font-black text-primary">{stats?.caminantes ?? 0}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-surface-container-highest" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-outline">Clan</p>
                  </div>
                  <p className="text-xl font-black text-primary">{stats?.clan ?? 0}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Upcoming Activities */}
          <section className="bg-surface-container-lowest p-10 rounded-[2.5rem] shadow-sm border border-outline-variant/5">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black tracking-tight text-primary">Próximas Actividades</h3>
              <div className="flex gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-primary hover:bg-surface-container-high transition-colors">
                  <EventAvailable sx={{ fontSize: 18 }} />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {UPCOMING_ACTIVITIES.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-5 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl transition-all cursor-pointer group border border-transparent hover:border-outline-variant/10">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="text-[8px] font-black uppercase leading-none">{activity.date.split(' ')[1]}</span>
                      <span className="text-lg font-black leading-tight">{activity.date.split(' ')[0]}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-primary">{activity.title}</h4>
                      <p className="text-[10px] font-medium text-outline flex items-center gap-1 mt-0.5">
                        <Radar sx={{ fontSize: 10 }} /> {activity.location}
                      </p>
                    </div>
                  </div>
                  <ArrowForward className="text-primary/20 group-hover:text-primary group-hover:translate-x-1 transition-all" fontSize="small" />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 bg-tertiary/5 text-tertiary font-black text-[10px] tracking-widest uppercase rounded-2xl hover:bg-tertiary/10 transition-colors">
              Ver Calendario Completo
            </button>
          </section>
        </div>

        {/* Right Column: Special Promotion + Growth Card (4/12) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Promotion Card (Leadership Workshop) */}
          <section className="relative overflow-hidden bg-primary p-10 rounded-[2.5rem] text-on-primary shadow-xl group min-h-[360px] flex flex-col justify-between">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-accent/20 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <span className="px-3 py-1 bg-tertiary rounded-full text-[8px] font-black uppercase tracking-widest text-on-tertiary">Especial</span>
              <h3 className="text-3xl font-black tracking-tight mt-6 leading-tight">Leadership Workshop 2024</h3>
              <p className="text-sm font-medium opacity-80 mt-4 leading-relaxed">Únete a la próxima sesión de capacitación estratégica para nuevos dirigentes y jefes de unidad.</p>
            </div>
            <div className="relative z-10 pt-8">
              <button className="w-full py-4 bg-white text-primary font-black text-[10px] tracking-widest uppercase rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                Reservar Mi Espacio
              </button>
            </div>
          </section>

          {/* Growth Card */}
          <section className="bg-emerald-900 p-10 rounded-[2.5rem] text-emerald-50 relative overflow-hidden group border border-emerald-800 shadow-xl">
             <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-emerald-400 opacity-[0.05] rounded-full blur-[60px]" />
             <h3 className="text-xl font-black tracking-tight mb-4">Análisis de Crecimiento Trimestral</h3>
             <p className="text-xs opacity-70 leading-relaxed mb-8">El contingente ha crecido un 4% por encima del objetivo regional este trimestre.</p>
             <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-100">Censo Actual vs Objetivo</p>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-400 w-[89%] relative group-hover:w-[92%] transition-all duration-700">
                      <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                   </div>
                </div>
                <div className="flex justify-between mt-3">
                   <span className="text-xl font-black">142</span>
                   <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Meta: 160</span>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};
