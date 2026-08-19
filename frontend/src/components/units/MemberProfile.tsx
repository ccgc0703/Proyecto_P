import {
  Box,
  Typography,
  Grid,
  Avatar,
  IconButton,
  Chip,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Close,
  Person,
  MedicalInformation,
  EmojiEvents,
  TrendingUp,
  Cake,
  Badge,
  Phone,
  ContactPage,
  Wc,
  Home
} from '@mui/icons-material';

interface MemberProfileProps {
  member: any;
  onClose: () => void;
}

export const MemberProfile = ({ member, onClose }: MemberProfileProps) => {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const fichaMedica = member.FichaMedica;
  const representante = member.Representante;
  const progresiones = member.Progresiones || [];
  const progresionActual = progresiones[0]; // La más reciente (ya ordenada desc)

  return (
    <Box className="bg-surface-container-lowest min-h-screen md:min-h-0 md:h-[90vh] overflow-y-auto rounded-none md:rounded-[2.5rem] relative">
      {/* Header / Avatar Section */}
      <Box className="sentinel-gradient p-12 text-on-primary relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white/10 rounded-full blur-[100px]" />

        <IconButton
          onClick={onClose}
          className="absolute top-6 right-6 text-on-primary bg-white/10 hover:bg-white/20"
        >
          <Close />
        </IconButton>

        <Box className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <Avatar
            sx={{ width: 160, height: 160, border: '8px solid rgba(255,255,255,0.2)', fontSize: '3rem', fontWeight: 900 }}
            className="shadow-2xl"
          >
            {member.nombres?.[0]}{member.apellidos?.[0]}
          </Avatar>

          <Box className="text-center md:text-left">
            <Typography variant="caption" className="font-black uppercase tracking-[0.3em] opacity-70 mb-2 block">
              Perfil del Miembro • {member.Unidad?.nombre || 'Unidad'}
            </Typography>
            <Typography variant="h3" className="font-black tracking-tighter mb-2">
              {member.nombres} {member.apellidos}
            </Typography>
            <Box className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
              <Chip
                label={member.estado || 'ACTIVO'}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  fontSize: '10px',
                  backgroundColor: member.estado === 'ACTIVO' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
                }}
              />
              <Chip
                label={member.genero === 'MASCULINO' ? 'Masculino' : 'Femenino'}
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box className="p-8 md:p-12">
        <Grid container spacing={6}>
          {/* Left Column: Personal Info */}
          <Grid item xs={12} md={4} className="space-y-6">
            <Box className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10">
              <Typography className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                <Person fontSize="small" /> Datos Personales
              </Typography>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Badge className="text-outline/40" fontSize="small" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">C.I. del Joven</p>
                    <p className="text-sm font-bold text-primary">{member.cedula || 'No registrada'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Cake className="text-outline/40" fontSize="small" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Nacimiento</p>
                    <p className="text-sm font-bold text-primary">
                      {new Date(member.fechaNacimiento).toLocaleDateString('es')} ({calculateAge(member.fechaNacimiento)} años)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Wc className="text-outline/40" fontSize="small" />
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Género</p>
                    <p className="text-sm font-bold text-primary">{member.genero === 'MASCULINO' ? 'Masculino' : 'Femenino'}</p>
                  </div>
                </div>

                <Divider sx={{ my: 2, opacity: 0.1 }} />

                {representante && (
                  <>
                    <div className="flex items-start gap-4">
                      <ContactPage className="text-outline/40" fontSize="small" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Representante</p>
                        <p className="text-sm font-bold text-primary">{representante.nombre}</p>
                        <p className="text-[10px] text-outline">{representante.parentesco || ''}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Phone className="text-outline/40" fontSize="small" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Teléfono</p>
                        <p className="text-sm font-bold text-primary">{representante.telefono || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Home className="text-outline/40" fontSize="small" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-outline mb-1">Dirección</p>
                        <p className="text-sm font-bold text-primary leading-relaxed">{representante.direccion || 'Sin dirección'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Box>

            {/* Ficha Médica — Datos reales */}
            <Box className="bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/10">
              <Typography className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
                <MedicalInformation fontSize="small" /> Ficha Médica
              </Typography>

              <div className="space-y-4">
                <Box className="flex justify-between items-center bg-white/50 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-outline">Tipo de Sangre</span>
                  <span className="text-xs font-black text-emerald-700">
                    {fichaMedica?.tipoSangre || 'No registrado'}
                  </span>
                </Box>
                <Box className="bg-white/50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-outline mb-1 uppercase tracking-tighter">Alergias</p>
                  <p className="text-xs font-medium text-primary">
                    {fichaMedica?.alergias || 'Ninguna conocida'}
                  </p>
                </Box>
                <Box className="bg-white/50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-outline mb-1 uppercase tracking-tighter">Condiciones</p>
                  <p className="text-xs font-medium text-primary">
                    {fichaMedica?.condiciones || 'Ninguna'}
                  </p>
                </Box>
                <Box className="bg-white/50 p-3 rounded-xl">
                  <p className="text-[9px] font-bold text-outline mb-1 uppercase tracking-tighter">Contacto Emergencia</p>
                  <p className="text-xs font-medium text-primary">
                    {fichaMedica?.contactoEmergencia || representante?.telefono || 'N/A'}
                  </p>
                </Box>
              </div>
            </Box>
          </Grid>

          {/* Right Column: Progress & Others */}
          <Grid item xs={12} md={8} className="space-y-6">
            {/* Progress Section */}
            <Box className="bg-surface-container-low p-10 rounded-[2.5rem] border border-outline-variant/10">
              <Box className="flex justify-between items-center mb-10">
                <Typography className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <TrendingUp fontSize="small" /> Datos Scout & Adelanto
                </Typography>
                {progresionActual && (
                  <Chip
                    label={progresionActual.etapa}
                    className="bg-primary/10 text-primary font-black text-[9px] uppercase tracking-widest"
                  />
                )}
              </Box>

              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Box className="flex flex-col items-center p-6 bg-white/30 rounded-3xl relative overflow-hidden">
                    <Typography className="text-[10px] font-black text-primary uppercase mb-4 z-10">
                      {progresionActual ? progresionActual.etapa : 'Sin progresión'}
                    </Typography>
                    <Box className="w-24 h-24 rounded-full border-8 border-primary/10 flex items-center justify-center relative z-10">
                      <Typography variant="h4" className="font-black text-primary">
                        {progresiones.length}
                      </Typography>
                    </Box>
                    <Box className="mt-6 w-full space-y-3 z-10">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-outline">Etapas Registradas</span>
                        <span className="text-[10px] font-black text-primary">{progresiones.length}</span>
                      </div>
                      <LinearProgress
                        variant="determinate"
                        value={progresiones.length > 0 ? Math.min(progresiones.length * 25, 100) : 0}
                        className="h-1.5 rounded-full bg-primary/10"
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box className="space-y-4">
                    {progresiones.slice(0, 3).map((prog: any) => (
                      <div key={prog.id} className="bg-white/50 p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <EmojiEvents fontSize="small" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-outline uppercase tracking-widest leading-none mb-1">
                            {new Date(prog.fechaInicio).toLocaleDateString('es')}
                          </p>
                          <p className="text-xs font-black text-primary">{prog.etapa}</p>
                        </div>
                      </div>
                    ))}

                    {progresiones.length === 0 && (
                      <div className="bg-white/50 p-5 rounded-2xl text-center">
                        <p className="text-xs text-outline font-bold">Sin progresiones registradas</p>
                      </div>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Critical Contacts */}
            <Box className="bg-surface-container-high p-8 rounded-[2.5rem] border border-outline-variant/10 text-primary">
              <Typography className="text-[10px] font-black uppercase tracking-widest mb-6 px-2">Contactos de Emergencia</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box className="p-4 bg-white/20 hover:bg-white/40 cursor-pointer rounded-2xl flex items-center justify-between transition-all group">
                    <div className="flex items-center gap-3">
                      <Phone className="text-primary group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-[9px] font-black opacity-60 uppercase">Llamar Representante</p>
                        <p className="text-xs font-bold">{representante?.telefono || 'N/A'}</p>
                      </div>
                    </div>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box className="p-4 bg-error/5 hover:bg-error/10 cursor-pointer rounded-2xl flex items-center justify-between transition-all group text-error">
                    <div className="flex items-center gap-3">
                      <MedicalInformation className="group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-[9px] font-black opacity-60 uppercase">Emergencia Médica</p>
                        <p className="text-xs font-bold">{fichaMedica?.contactoEmergencia || representante?.telefono || 'N/A'}</p>
                      </div>
                    </div>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
