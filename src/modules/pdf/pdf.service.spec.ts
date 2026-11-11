import { NotFoundException } from '@nestjs/common';
import { PdfService, CarnetDatos, PlanillaAsistenciaPdf, Actor, permitirSoloFuentes, denegarUrl } from './pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnitPolicy } from '../../common/policies/unit.policy';
import type { JovenExport } from '../progresion/export.service';

describe('PdfService', () => {
    const actor: Actor = { id: 'u1', roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };

    const mockPrisma = { miembro: { findFirst: jest.fn() } };
    const prisma = mockPrisma as unknown as PrismaService;

    const mockUnitPolicy = { unidadesAlcance: jest.fn() };
    const unitPolicy = mockUnitPolicy as unknown as UnitPolicy;

    let service: PdfService;

    const jovendeExport = (): JovenExport => ({
        miembroId: 'm1',
        nombres: 'Juan',
        apellidos: 'Pérez',
        fechaNacimiento: new Date('2012-05-01T00:00:00.000Z'),
        unidad: 'Tropa',
        etapas: 'Lobo · Caminante',
        adelantoActual: { orden: 2, nombre: 'Caminante', umbralPorcentaje: 70 },
        evaluacion: {
            esPruebaAislada: false,
            poolTotal: 24,
            requerido: 18,
            completados: 20,
            porcentajeActual: 83,
            faltantes: 4,
            apto: true,
            bloqueo: null,
        },
        porArea: [
            { area: 'Servicio', total: 6, completados: 5, enProceso: 1, pendienteAprobacion: 0, pendientes: 0 },
            { area: 'Vida en la naturaleza', total: 8, completados: 6, enProceso: 2, pendienteAprobacion: 0, pendientes: 0 },
        ],
        indicadores: [],
        historial: [
            {
                orden: 1,
                nombre: 'Lobo',
                estado: 'APROBADA',
                fechaInicio: new Date('2023-03-01T00:00:00.000Z'),
                fechaCulminacion: new Date('2024-01-15T00:00:00.000Z'),
                aprobadoPor: 'Adulto Tropa',
            },
        ],
        generadoEn: new Date('2026-01-10T12:00:00.000Z'),
    });

    const carnetDePrueba = (): CarnetDatos => ({
        miembroId: 'm1-abcdefgh',
        nombres: 'Juan',
        apellidos: 'Pérez',
        fechaNacimiento: new Date('2012-05-01T00:00:00.000Z'),
        unidad: 'Tropa',
        grupo: 'Grupo Scout Poseidon',
        patrulla: 'Tormenta',
        cargo: 'Ayudante de patrulla',
        fechaIngreso: new Date('2023-03-01T00:00:00.000Z'),
    });

    const planillaDePrueba = (registros: PlanillaAsistenciaPdf['registros']): PlanillaAsistenciaPdf => ({
        actividad: {
            id: 'a1',
            titulo: 'Reunión de prueba',
            fecha: new Date('2026-02-14T00:00:00.000Z'),
            tipo: 'REUNION',
            estado: 'COMPLETADA',
            planificacionId: 'p1',
            planificacion: { id: 'p1', titulo: 'Plan febrero', unidadId: 'u1', estado: 'EN_CURSO' },
        },
        registros,
    });

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PdfService(prisma, unitPolicy);
    });

    // ── Políticas de acceso de pdfmake ───────────────────────────────────

    describe('politicas de acceso a recursos', () => {
        it('permite leer las fuentes TTF empaquetadas por pdfmake', () => {
            expect(permitirSoloFuentes('node_modules/pdfmake/fonts/Roboto-Regular.ttf')).toBe(true);
            expect(permitirSoloFuentes('C:\\repo\\node_modules\\pdfmake\\fonts\\Roboto-Bold.ttf')).toBe(true);
            expect(permitirSoloFuentes('/var/app/node_modules/pdfmake/fonts/Roboto-Italic.ttf')).toBe(true);
        });

        it('rechaza archivos locales ajenos al directorio de fuentes', () => {
            expect(permitirSoloFuentes('C:\\Windows\\System32\\evil.ttf')).toBe(false);
            expect(permitirSoloFuentes('/etc/passwd')).toBe(false);
            expect(permitirSoloFuentes('file:///etc/shadow')).toBe(false);
            expect(permitirSoloFuentes('C:\\repo\\node_modules\\otro-paquete\\fonts\\x.ttf')).toBe(false);
        });

        it('bloquea toda URL remota dentro de los PDFs', () => {
            expect(denegarUrl('https://evil.example.com/pixel.png')).toBe(false);
            expect(denegarUrl('http://localhost/x.png')).toBe(false);
        });
    });

    // ── Render ───────────────────────────────────────────────────────────

    describe('render', () => {
        it('renderiza la constancia de progresión como PDF válido', async () => {
            const buffer = await service.renderConstancia(jovendeExport());
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
            expect(buffer.length).toBeGreaterThan(1000);
        });

        it('renderiza la constancia aunque no haya evaluación ni historial', async () => {
            const datos = jovendeExport();
            datos.evaluacion = null;
            datos.porArea = [];
            datos.historial = [];
            datos.adelantoActual = null;
            const buffer = await service.renderConstancia(datos);
            expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
        });

        it('renderiza el carnet en tamaño tarjeta', async () => {
            const buffer = await service.renderCarnet(carnetDePrueba());
            expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
            // Tamaño de página contenido dentro del PDF (pt).
            const texto = buffer.toString('latin1');
            expect(texto).toContain('242.65');
        });

        it('renderiza el listado de asistencia con sus conteos', async () => {
            const buffer = await service.renderAsistencia(
                planillaDePrueba([
                    {
                        miembroId: 'm1',
                        nombres: 'Juan',
                        apellidos: 'Pérez',
                        unidadId: 'u1',
                        asistenciaId: 'as1',
                        estado: 'PRESENTE',
                        observacion: null,
                    },
                    {
                        miembroId: 'm2',
                        nombres: 'Ana',
                        apellidos: 'Gómez',
                        unidadId: 'u1',
                        asistenciaId: null,
                        estado: null,
                        observacion: 'Llega tarde',
                    },
                ]),
            );
            expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
        });

        it('renderiza el listado de asistencia sin registros', async () => {
            const buffer = await service.renderAsistencia(planillaDePrueba([]));
            expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
        });
    });

    // ── ABAC del carnet ──────────────────────────────────────────────────

    describe('getDatosCarnet', () => {
        const miembro = {
            id: 'm1',
            nombres: 'Juan',
            apellidos: 'Pérez',
            fechaNacimiento: new Date('2012-05-01T00:00:00.000Z'),
            Unidad: { id: 'u1', nombre: 'Tropa', Grupo: { nombre: 'Grupo Scout Poseidon' } },
            DatosScout: {
                cargoActual: 'Ayudante',
                fechaIngreso: new Date('2023-03-01T00:00:00.000Z'),
                Patrulla: { nombre: 'Tormenta' },
            },
        };

        it('arma el carnet con unidad, grupo, patrulla y expediente', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);

            const datos = await service.getDatosCarnet('m1', actor);

            expect(datos).toEqual({
                miembroId: 'm1',
                nombres: 'Juan',
                apellidos: 'Pérez',
                fechaNacimiento: miembro.fechaNacimiento,
                unidad: 'Tropa',
                grupo: 'Grupo Scout Poseidon',
                patrulla: 'Tormenta',
                cargo: 'Ayudante',
                fechaIngreso: miembro.DatosScout.fechaIngreso,
            });
            expect(mockUnitPolicy.unidadesAlcance).toHaveBeenCalledWith(actor);
        });

        it('tolera miembro sin expediente scout', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue({
                ...miembro,
                DatosScout: null,
            });
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);

            const datos = await service.getDatosCarnet('m1', actor);
            expect(datos.patrulla).toBeNull();
            expect(datos.cargo).toBeNull();
            expect(datos.fechaIngreso).toBeNull();
        });

        it('responde 404 si el miembro no existe', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(null);
            await expect(service.getDatosCarnet('no-existe', actor)).rejects.toBeInstanceOf(NotFoundException);
            expect(mockUnitPolicy.unidadesAlcance).not.toHaveBeenCalled();
        });

        it('fail-closed: 404 cuando la unidad queda fuera del alcance', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembro);
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['otra-unidad']);

            await expect(service.getDatosCarnet('m1', actor)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
