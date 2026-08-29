import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  Person,
  ContactPhone,
  Home,
  Badge,
  Wc,
  CalendarMonth,
  SaveAlt,
  Add,
} from '@mui/icons-material';
import { miembrosApi, administrativoApi, unidadesApi } from '../api';
import { UnidadEntity } from '../types/member';
import { getApiErrorMessage } from '../utils/errors';

const registerSchema = z.object({
  // Datos Personales
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  cedula: z.string().min(5, 'Cédula requerida'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida'),
  genero: z.enum(['MASCULINO', 'FEMENINO'], { required_error: 'Selecciona el género' }),
  historial: z.string().optional(),
  // Representante
  repNombre: z.string().min(2, 'Nombre del representante requerido'),
  repCedula: z.string().min(5, 'Cédula del representante requerida'),
  repTelefono: z.string().optional(),
  repDireccion: z.string().optional(),
  repParentesco: z.string().min(1, 'Parentesco requerido'),
  // Datos Scout
  fechaIngreso: z.string().optional(),
  fechaPromesa: z.string().optional(),
  cargoActual: z.string().optional(),
  patrullaId: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface MemberRegisterPageProps {
  unitType: string;
  unitLabel: string;
}

export const MemberRegisterPage = ({ unitType, unitLabel }: MemberRegisterPageProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [subUnidades, setSubUnidades] = useState<UnidadEntity[]>([]);
  const [isLoadingSub, setIsLoadingSub] = useState(false);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubNombre, setNewSubNombre] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);

  // Determinar nomenclatura
  const subUnitLabel = unitType.toLowerCase() === 'manada' 
    ? 'Seisena' 
    : unitType.toLowerCase() === 'clan' || unitType.toLowerCase() === 'caminantes'
      ? 'Equipo de Trabajo' 
      : 'Patrulla';

  useEffect(() => {
    const fetchSubUnits = async () => {
      try {
        setIsLoadingSub(true);
        const unidades = await unidadesApi.getAll();
        const unidad = (unidades as UnidadEntity[]).find((u) => 
          u.nombre?.toLowerCase() === unitType.toLowerCase()
        );
        if (unidad) {
          const list = await unidadesApi.getPatrullas(unidad.id);
          setSubUnidades(list);
        }
      } catch (err) {
        console.error('Error fetching sub-units:', err);
      } finally {
        setIsLoadingSub(false);
      }
    };
    fetchSubUnits();
  }, [unitType]);

  const handleCreateSubUnit = async () => {
    if (!newSubNombre.trim()) return;
    try {
      setCreatingSub(true);
      const unidades = await unidadesApi.getAll();
      const unidad = (unidades as UnidadEntity[]).find((u) =>
        u.nombre?.toLowerCase() === unitType.toLowerCase()
      );
      if (!unidad) return;

      const created = await unidadesApi.createPatrulla(unidad.id, { nombre: newSubNombre.trim() });
      setSubUnidades(prev => [...prev, created]);
      setNewSubNombre('');
      setShowCreateSub(false);
    } catch (err) {
      console.error('Error creating sub-unit:', err);
    } finally {
      setCreatingSub(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { genero: undefined },
  });

  const handleNextStep = async () => {
    const valid = await trigger([
      'nombres', 'apellidos', 'cedula', 'fechaNacimiento', 'genero',
      'repNombre', 'repCedula', 'repParentesco',
    ]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);

      // 1. Crear o encontrar representante
      const representante = await administrativoApi.createRepresentante({
        nombre: data.repNombre,
        cedula: data.repCedula,
        telefono: data.repTelefono || null,
        direccion: data.repDireccion || null,
        parentesco: data.repParentesco,
      });

      // 2. Obtener unidadId
      const unidades = await unidadesApi.getAll();
      const unidad = (unidades as UnidadEntity[]).find((u) =>
        u.nombre?.toLowerCase() === unitType.toLowerCase()
      );
      if (!unidad) {
        setError('No se encontró la unidad en el sistema. Regístrala primero.');
        return;
      }

      // 3. Crear miembro
      const miembro = await miembrosApi.create({
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedula: data.cedula,
        fechaNacimiento: data.fechaNacimiento,
        genero: data.genero,
        unidadId: unidad.id,
        representanteId: representante.id,
        historial: data.historial || null,
        fechaIngreso: data.fechaIngreso || null,
        fechaPromesa: data.fechaPromesa || null,
        cargoActual: data.cargoActual || null,
        patrullaId: data.patrullaId || null,
      });

      // 4. Crear ficha médica básica
      try {
        await administrativoApi.createFichaMedica({ jovenId: miembro.id });
      } catch {
        // No bloqueante
      }

      // 5. Redirigir al dashboard de la unidad
      navigate({ to: `/app/${unitType.toLowerCase()}` });
    } catch (err) {
      console.error('Error en el registro:', err);
      setError(getApiErrorMessage(err, 'Error al registrar el miembro. Verifica los datos.'));
    }
  };

  const goBack = () => navigate({ to: `/app/${unitType.toLowerCase()}` });

  const inputClasses =
    'w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all h-[54px]';
  const labelClasses =
    'text-[10px] font-black uppercase tracking-widest px-1 text-outline';
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
            Nuevo Registro — {unitLabel}
          </h1>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em]">
            Formulario de inscripción de miembro
          </p>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            step === 1
              ? 'sentinel-gradient text-on-primary shadow-lg shadow-primary/20'
              : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
          }`}
        >
          <Person sx={{ fontSize: 16 }} /> Datos Personales y Representante
        </button>
        <div className="w-8 h-px bg-outline-variant" />
        <button
          onClick={handleNextStep}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            step === 2
              ? 'sentinel-gradient text-on-primary shadow-lg shadow-primary/20'
              : 'bg-surface-container-high text-primary hover:bg-surface-container-highest'
          }`}
        >
          <Badge sx={{ fontSize: 16 }} /> Datos Scout
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold animate-fade-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 1 && (
          <div className="space-y-8">
            {/* Sección 1: Datos Personales del Miembro */}
            <section className={sectionClasses}>
              <div className="flex items-center gap-3 mb-8">
                <Person className="text-primary" />
                <h3 className="text-lg font-black text-primary uppercase tracking-tight">
                  Datos del Miembro
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className={labelClasses}>Nombres *</label>
                  <input {...register('nombres')} className={inputClasses} placeholder="Ej: Juan Carlos" />
                  {errors.nombres && <p className="text-[10px] text-error font-bold px-1">{errors.nombres.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Apellidos *</label>
                  <input {...register('apellidos')} className={inputClasses} placeholder="Ej: Rodríguez Pérez" />
                  {errors.apellidos && <p className="text-[10px] text-error font-bold px-1">{errors.apellidos.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Cédula de Identidad *</label>
                  <input {...register('cedula')} className={inputClasses} placeholder="Ej: V-12345678" />
                  {errors.cedula && <p className="text-[10px] text-error font-bold px-1">{errors.cedula.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>
                    <CalendarMonth sx={{ fontSize: 12, mr: 0.5 }} />
                    Fecha de Nacimiento *
                  </label>
                  <input {...register('fechaNacimiento')} type="date" className={inputClasses} />
                  {errors.fechaNacimiento && (
                    <p className="text-[10px] text-error font-bold px-1">{errors.fechaNacimiento.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>
                    <Wc sx={{ fontSize: 12, mr: 0.5 }} />
                    Género *
                  </label>
                  <select {...register('genero')} className={inputClasses}>
                    <option value="">Seleccionar...</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                  </select>
                  {errors.genero && <p className="text-[10px] text-error font-bold px-1">{errors.genero.message}</p>}
                </div>
              </div>
            </section>

            {/* Sección 2: Representante */}
            <section className={sectionClasses}>
              <div className="flex items-center gap-3 mb-8">
                <ContactPhone className="text-secondary" />
                <h3 className="text-lg font-black text-secondary uppercase tracking-tight">
                  Datos del Representante
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className={labelClasses}>Nombre Completo *</label>
                  <input {...register('repNombre')} className={inputClasses} placeholder="Ej: María Rodríguez" />
                  {errors.repNombre && <p className="text-[10px] text-error font-bold px-1">{errors.repNombre.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Cédula *</label>
                  <input {...register('repCedula')} className={inputClasses} placeholder="Ej: V-9876543" />
                  {errors.repCedula && <p className="text-[10px] text-error font-bold px-1">{errors.repCedula.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Parentesco *</label>
                  <select {...register('repParentesco')} className={inputClasses}>
                    <option value="">Seleccionar...</option>
                    <option value="PADRE">Padre</option>
                    <option value="MADRE">Madre</option>
                    <option value="ABUELO/A">Abuelo/a</option>
                    <option value="TIO/A">Tío/a</option>
                    <option value="HERMANO/A">Hermano/a</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  {errors.repParentesco && (
                    <p className="text-[10px] text-error font-bold px-1">{errors.repParentesco.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Teléfono</label>
                  <input {...register('repTelefono')} className={inputClasses} placeholder="Ej: 0412-1234567" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={labelClasses}>
                    <Home sx={{ fontSize: 12, mr: 0.5 }} />
                    Dirección
                  </label>
                  <input {...register('repDireccion')} className={inputClasses} placeholder="Ej: Av. Principal, Casa 5..." />
                </div>
              </div>
            </section>

            {/* Control: Siguiente */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={goBack}
                className="px-8 py-3 bg-surface-container-high text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="sentinel-gradient px-8 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
              >
                Siguiente: Datos Scout →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            {/* Sección 3: Datos Scout */}
            <section className={sectionClasses}>
              <div className="flex items-center gap-3 mb-8">
                <Badge className="text-primary" />
                <h3 className="text-lg font-black text-primary uppercase tracking-tight">
                  Datos Scout
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClasses}>Unidad Asignada</label>
                  <input
                    type="text"
                    value={unitLabel}
                    disabled
                    className={`${inputClasses} opacity-60 cursor-not-allowed`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>{subUnitLabel} *</label>
                  <div className="flex gap-2">
                    <select {...register('patrullaId')} className={`${inputClasses} flex-1`}>
                      <option value="">Seleccionar {subUnitLabel}...</option>
                      {subUnidades.map(su => (
                        <option key={su.id} value={su.id}>{su.nombre}</option>
                      ))}
                      {subUnidades.length === 0 && !isLoadingSub && (
                        <option disabled>No hay {subUnitLabel.toLowerCase()}s registradas</option>
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCreateSub(!showCreateSub)}
                      className="h-[54px] px-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center"
                      title={`Crear nueva ${subUnitLabel}`}
                    >
                      <Add sx={{ fontSize: 20 }} />
                    </button>
                  </div>
                  {showCreateSub && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={newSubNombre}
                        onChange={(e) => setNewSubNombre(e.target.value)}
                        placeholder={`Nombre de la ${subUnitLabel.toLowerCase()}`}
                        className={`${inputClasses} flex-1`}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSubUnit()}
                      />
                      <button
                        type="button"
                        onClick={handleCreateSubUnit}
                        disabled={creatingSub || !newSubNombre.trim()}
                        className="h-[54px] px-4 sentinel-gradient text-on-primary rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                      >
                        {creatingSub ? '...' : 'Crear'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Fecha de Ingreso al Grupo</label>
                  <input {...register('fechaIngreso')} type="date" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Fecha de Promesa</label>
                  <input {...register('fechaPromesa')} type="date" className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className={labelClasses}>Cargo en la Unidad</label>
                  <input {...register('cargoActual')} type="text" className={inputClasses} placeholder="Ej: Guía de Patrulla, Sub-guía, etc." />
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <label className={labelClasses}>Observaciones / Historial</label>
                <textarea
                  {...register('historial')}
                  rows={4}
                  className="w-full p-4 bg-surface-container-high border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary transition-all resize-none"
                  placeholder="Notas adicionales sobre el miembro..."
                />
              </div>
            </section>

            {/* Resumen Rápido */}
            <section className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">
                Resumen del Registro
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase">Miembro</p>
                  <p className="text-sm font-black text-primary uppercase">{getValues('nombres')} {getValues('apellidos')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase">C.I.</p>
                  <p className="text-sm font-black text-primary uppercase">{getValues('cedula')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase">Representante</p>
                  <p className="text-sm font-black text-primary uppercase">{getValues('repNombre')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-outline uppercase">Unidad</p>
                  <p className="text-sm font-black text-primary">{unitLabel}</p>
                </div>
              </div>
            </section>

            {/* Controls */}
            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-8 py-3 bg-surface-container-high text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
              >
                ← Volver
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="sentinel-gradient px-10 py-3 rounded-xl text-on-primary font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <SaveAlt sx={{ fontSize: 16 }} />
                {isSubmitting ? 'Registrando...' : 'Confirmar Registro'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
