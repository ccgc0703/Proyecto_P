import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProgresionService, Actor } from './progresion.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitAccessPolicy } from '../../common/policies/unit-access.policy';

const areaCrecimiento = (n: number, orden: number) => ({
    id: `ac${n}`,
    nombre: `Area ${n}`,
    orden,
    tipo: 'AREA_CRECIMIENTO',
});

const indicadorPool = (n: number) => ({
    id: `p${n}`,
    codigo: `c${n}`,
    texto: `Indicador de pool ${n}`,
    orden: n,
    areaId: 'ac1',
    etapaId: 'e1',
    rama: 'TROPA',
    Area: areaCrecimiento(1, 1),
});

const indicadorPrueba = (n: number) => ({
    id: `t${n}`,
    codigo: String(n),
    texto: `Item de prueba ${n}`,
    orden: n,
    areaId: 'acPrueba',
    etapaId: 'e1',
    rama: 'TROPA',
    Area: { id: 'acPrueba', nombre: 'Prueba de Adelanto', orden: 7, tipo: 'PRUEBA_ADELANTO' },
});

describe('ProgresionService', () => {
    let service: ProgresionService;

    let pool: any[];
    let items: any[];

    const mockPrisma = {
        miembro: { findFirst: jest.fn(), findMany: jest.fn() },
        unidad: { findFirst: jest.fn() },
        areaCrecimiento: { findMany: jest.fn() },
        indicadorLogro: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
        estadoLogroJoven: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        progresion: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        adelanto: { findFirst: jest.fn(), findMany: jest.fn() },
        etapa: { findMany: jest.fn() },
    };

    const mockAudit = { logAction: jest.fn() };
    const mockUnitAccess = { assertCanAccessUnit: jest.fn() };

    const actor: Actor = { id: 'user-1', roles: ['ADULTO_TROPA'], permissions: ['progresion:aprobar'] };

    const miembroJoven = {
        id: 'm1',
        nombres: 'JUAN',
        apellidos: 'PEREZ',
        tipo: 'JOVEN',
        unidadId: 'u1',
        Unidad: { id: 'u1', nombre: 'Tropa', tipo: 'TROPA' },
        Joven: { id: 'j1', miembroId: 'm1' },
    };

    const adelantoPorcentaje = {
        id: 'ad1',
        rama: 'TROPA',
        orden: 2,
        nombre: 'Explorador',
        umbralPorcentaje: 50,
        activo: true,
    };

    beforeEach(async () => {
        pool = Array.from({ length: 10 }, (_, i) => indicadorPool(i + 1));
        items = Array.from({ length: 6 }, (_, i) => indicadorPrueba(i + 1));

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProgresionService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAudit },
                { provide: UnitAccessPolicy, useValue: mockUnitAccess },
            ],
        }).compile();

        service = module.get<ProgresionService>(ProgresionService);
        jest.clearAllMocks();
        mockUnitAccess.assertCanAccessUnit.mockResolvedValue(undefined);
        mockPrisma.indicadorLogro.findMany.mockImplementation((args: any) =>
            Promise.resolve(args.where.Area.is.tipo === 'PRUEBA_ADELANTO' ? items : pool),
        );
        mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([]);
        mockPrisma.areaCrecimiento.findMany.mockResolvedValue([areaCrecimiento(1, 1)]);
        mockPrisma.etapa.findMany.mockResolvedValue([]);
        mockPrisma.adelanto.findMany.mockResolvedValue([]);
    });

    describe('getResumen — identidad y scoping', () => {
        it('lanza NotFound si el miembro no existe', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(null);

            await expect(service.getResumen('nope', actor)).rejects.toThrow(NotFoundException);
        });

        it('lanza BadRequest si el miembro no es de tipo JOVEN', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue({ ...miembroJoven, tipo: 'ADULTO' });

            await expect(service.getResumen('m1', actor)).rejects.toThrow(BadRequestException);
        });

        it('lanza Forbidden si el actor no puede acceder a la unidad', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockUnitAccess.assertCanAccessUnit.mockRejectedValue(new ForbiddenException('No acceso'));

            await expect(service.getResumen('m1', actor)).rejects.toThrow(ForbiddenException);
            expect(mockUnitAccess.assertCanAccessUnit).toHaveBeenCalledWith('user-1', 'u1');
        });
    });

    describe('getResumen — evaluación con floor', () => {
        const progresionConAdelanto = (adelanto: any) => [
            {
                id: 'pr1',
                jovenId: 'j1',
                adelantoId: adelanto.id,
                estado: 'EN_CURSO',
                fechaInicio: new Date('2026-01-01'),
                fechaCulminacion: null,
                aprobadoPor: null,
                aprobadoEn: null,
                Adelanto: adelanto,
            },
        ];

        it('calcula requerido con floor y porcentaje sobre el pool', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.progresion.findMany.mockResolvedValue(progresionConAdelanto(adelantoPorcentaje));
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue(
                ['p1', 'p2', 'p3', 'p4'].map((id) => ({ indicadorId: id, estado: 'COMPLETADO' })),
            );

            const resumen = await service.getResumen('m1', actor);

            expect(resumen.adelantoActual).toMatchObject({
                nombre: 'Explorador',
                esPruebaAislada: false,
                poolTotal: 10,
                requerido: 5,
                completados: 4,
                faltantes: 1,
                porcentajeActual: 40,
            });
        });

        it('usa floor cuando el pool no es divisible', async () => {
            pool = [indicadorPool(1), indicadorPool(2), indicadorPool(3)];
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.progresion.findMany.mockResolvedValue(progresionConAdelanto(adelantoPorcentaje));
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([]);

            const resumen = await service.getResumen('m1', actor);

            expect(resumen.adelantoActual!.requerido).toBe(1);
        });

        it('bloquea la prueba aislada cuando no tiene items definidos', async () => {
            items = [];
            const prueba = { ...adelantoPorcentaje, id: 'adP', orden: 1, nombre: 'Peregrino', umbralPorcentaje: null };
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.progresion.findMany.mockResolvedValue(progresionConAdelanto(prueba));

            const resumen = await service.getResumen('m1', actor);

            expect(resumen.bloqueo).toEqual({ motivo: 'prueba aislada no definida' });
            expect(resumen.adelantoActual).toMatchObject({ esPruebaAislada: true, poolTotal: 0, requerido: 0 });
        });

        it('cuenta items de la prueba aislada, no el pool', async () => {
            const prueba = { ...adelantoPorcentaje, id: 'adP', orden: 1, nombre: 'Peregrino', umbralPorcentaje: null };
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.progresion.findMany.mockResolvedValue(progresionConAdelanto(prueba));
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([
                { indicadorId: 't1', estado: 'COMPLETADO' },
                { indicadorId: 't2', estado: 'EN_PROCESO' },
                { indicadorId: 'p1', estado: 'COMPLETADO' },
            ]);

            const resumen = await service.getResumen('m1', actor);

            expect(resumen.adelantoActual).toMatchObject({
                esPruebaAislada: true,
                poolTotal: 6,
                requerido: 6,
                completados: 1,
                faltantes: 5,
            });
            expect(resumen.bloqueo).toBeNull();
        });

        it('desglosa porArea con los 4 estados y pendientes sin fila', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.progresion.findMany.mockResolvedValue(progresionConAdelanto(adelantoPorcentaje));
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([
                { indicadorId: 'p1', estado: 'COMPLETADO' },
                { indicadorId: 'p2', estado: 'EN_PROCESO' },
                { indicadorId: 'p3', estado: 'PENDIENTE_APROBACION' },
                { indicadorId: 'p4', estado: 'PENDIENTE' },
            ]);

            const resumen = await service.getResumen('m1', actor);

            expect(resumen.porArea).toEqual([
                { area: 'Area 1', total: 10, completados: 1, enProceso: 1, pendienteAprobacion: 1, pendientes: 7 },
            ]);
        });

        it('devuelve adelantoActual null y sin bloqueo si no hay progresión activa', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.progresion.findMany.mockResolvedValue([]);

            const resumen = await service.getResumen('m1', actor);

            expect(resumen.adelantoActual).toBeNull();
            expect(resumen.bloqueo).toBeNull();
            expect(resumen.historialProgresiones).toEqual([]);
        });

        it('puedeAprobar es false cuando falta progresion:aprobar', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.progresion.findMany.mockResolvedValue([]);

            const sinPermiso = await service.getResumen('m1', { ...actor, permissions: ['progresion:view'] });

            expect(sinPermiso.puedeAprobar).toBe(false);
        });
    });

    describe('actualizarEstado', () => {
        it('rechaza un indicador de otra rama', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.indicadorLogro.findFirst.mockResolvedValue({ id: 'ix', codigo: 'a', rama: 'MANADA' });

            await expect(
                service.actualizarEstado('m1', 'ix', { estado: 'EN_PROCESO' }, actor),
            ).rejects.toThrow(BadRequestException);
        });

        it('crea el estado y audita el cambio', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.indicadorLogro.findFirst.mockResolvedValue({ id: 'p1', codigo: 'c1', rama: 'TROPA' });
            mockPrisma.estadoLogroJoven.findFirst.mockResolvedValue(null);
            mockPrisma.estadoLogroJoven.create.mockResolvedValue({ id: 'est1' });

            const result = await service.actualizarEstado('m1', 'p1', { estado: 'COMPLETADO' }, actor);

            expect(result).toEqual({ id: 'est1' });
            expect(mockPrisma.estadoLogroJoven.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        jovenId: 'j1',
                        indicadorId: 'p1',
                        estado: 'COMPLETADO',
                        registradoPor: 'user-1',
                        aprobadoPor: 'user-1',
                    }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'INDICADOR_ESTADO_CHANGED',
                    module: 'progresion',
                    description: expect.stringContaining('c1: PENDIENTE -> COMPLETADO'),
                }),
            );
        });

        it('no audita si el estado no cambia', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.indicadorLogro.findFirst.mockResolvedValue({ id: 'p1', codigo: 'c1', rama: 'TROPA' });
            mockPrisma.estadoLogroJoven.findFirst.mockResolvedValue({ id: 'est1', estado: 'EN_PROCESO' });
            mockPrisma.estadoLogroJoven.update.mockResolvedValue({ id: 'est1' });

            await service.actualizarEstado('m1', 'p1', { estado: 'EN_PROCESO' }, actor);

            expect(mockAudit.logAction).not.toHaveBeenCalled();
            expect(mockPrisma.estadoLogroJoven.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ aprobadoPor: null, aprobadoEn: null }),
                }),
            );
        });
    });

    describe('iniciarAdelanto', () => {
        it('rechaza un adelanto de otra rama', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.adelanto.findFirst.mockResolvedValue({ id: 'ad2', rama: 'MANADA', nombre: 'X', activo: true });

            await expect(service.iniciarAdelanto('m1', 'ad2', actor)).rejects.toThrow(BadRequestException);
        });

        it('lanza Conflict si ya fue iniciado', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.adelanto.findFirst.mockResolvedValue(adelantoPorcentaje);
            mockPrisma.progresion.findFirst.mockResolvedValue({ id: 'pr1' });

            await expect(service.iniciarAdelanto('m1', 'ad1', actor)).rejects.toThrow(ConflictException);
        });

        it('crea la progresión en curso', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockPrisma.adelanto.findFirst.mockResolvedValue(adelantoPorcentaje);
            mockPrisma.progresion.findFirst.mockResolvedValue(null);
            mockPrisma.progresion.create.mockResolvedValue({ id: 'pr1', estado: 'EN_CURSO' });

            const result = await service.iniciarAdelanto('m1', 'ad1', actor);

            expect(result.estado).toBe('EN_CURSO');
            expect(mockPrisma.progresion.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ jovenId: 'j1', adelantoId: 'ad1', createdBy: 'user-1' }),
                }),
            );
        });
    });

    describe('solicitar', () => {
        const progresionSolicitada = (estado: string) => ({
            id: 'pr1',
            jovenId: 'j1',
            estado,
            Adelanto: adelantoPorcentaje,
            Joven: { Miembro: { ...miembroJoven, unidadId: 'u1' } },
        });

        it('devuelve faltantes sin cambiar de estado cuando no es apto', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValue(progresionSolicitada('EN_CURSO'));
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([
                { indicadorId: 'p1', estado: 'COMPLETADO' },
            ]);

            const result = await service.solicitar('pr1', actor);

            expect(result.apto).toBe(false);
            expect(result.requerido).toBe(5);
            expect(result.faltantesDetallados).toHaveLength(9);
            expect(mockPrisma.progresion.update).not.toHaveBeenCalled();
        });

        it('cambia a SOLICITADA y audita cuando es apto', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValue(progresionSolicitada('EN_CURSO'));
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue(
                Array.from({ length: 5 }, (_, i) => ({ indicadorId: `p${i + 1}`, estado: 'COMPLETADO' })),
            );
            mockPrisma.progresion.update.mockResolvedValue({});

            const result = await service.solicitar('pr1', actor);

            expect(result.apto).toBe(true);
            expect(mockPrisma.progresion.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ estado: 'SOLICITADA' }) }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'PROGRESION_SOLICITADA' }),
            );
        });

        it('lanza Conflict si ya está solicitada', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValue(progresionSolicitada('SOLICITADA'));

            await expect(service.solicitar('pr1', actor)).rejects.toThrow(ConflictException);
        });
    });

    describe('aprobar', () => {
        const progresionSolicitada = {
            id: 'pr1',
            jovenId: 'j1',
            estado: 'SOLICITADA',
            Adelanto: adelantoPorcentaje,
            Joven: { Miembro: { ...miembroJoven, unidadId: 'u1' } },
        };

        it('rechaza si no está en estado SOLICITADA', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValue({ ...progresionSolicitada, estado: 'EN_CURSO' });

            await expect(service.aprobar('pr1', actor)).rejects.toThrow(ConflictException);
        });

        it('rechaza si ya no cumple el umbral', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValue(progresionSolicitada);
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([]);

            await expect(service.aprobar('pr1', actor)).rejects.toThrow(ConflictException);
            expect(mockPrisma.progresion.update).not.toHaveBeenCalled();
        });

        it('aprueba y crea la progresión del siguiente adelanto', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValueOnce(progresionSolicitada);
            mockPrisma.progresion.findFirst.mockResolvedValue(null);
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue(
                Array.from({ length: 5 }, (_, i) => ({ indicadorId: `p${i + 1}`, estado: 'COMPLETADO' })),
            );
            mockPrisma.progresion.update.mockResolvedValue({ id: 'pr1', estado: 'APROBADA' });
            mockPrisma.adelanto.findFirst.mockResolvedValue({ id: 'ad2', orden: 3, nombre: 'Pionero' });
            mockPrisma.progresion.create.mockResolvedValue({ id: 'pr2', estado: 'EN_CURSO', Adelanto: { nombre: 'Pionero' } });

            const result = await service.aprobar('pr1', actor);

            expect(mockPrisma.progresion.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        estado: 'APROBADA',
                        aprobadoPor: 'user-1',
                        fechaCulminacion: expect.any(Date),
                    }),
                }),
            );
            expect(result.siguiente).toMatchObject({ id: 'pr2', estado: 'EN_CURSO' });
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'PROGRESION_APROBADA' }),
            );
        });

        it('no crea siguiente adelanto cuando es el último', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValueOnce(progresionSolicitada);
            mockPrisma.progresion.findFirst.mockResolvedValue(null);
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue(
                Array.from({ length: 5 }, (_, i) => ({ indicadorId: `p${i + 1}`, estado: 'COMPLETADO' })),
            );
            mockPrisma.progresion.update.mockResolvedValue({ id: 'pr1', estado: 'APROBADA' });
            mockPrisma.adelanto.findFirst.mockResolvedValue(null);

            const result = await service.aprobar('pr1', actor);

            expect(result.siguiente).toBeNull();
            expect(mockPrisma.progresion.create).not.toHaveBeenCalled();
        });
    });

    describe('rechazar', () => {
        it('rechaza con motivo y audita', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValue({
                id: 'pr1',
                jovenId: 'j1',
                estado: 'SOLICITADA',
                Adelanto: adelantoPorcentaje,
                Joven: { Miembro: { ...miembroJoven, unidadId: 'u1' } },
            });
            mockPrisma.progresion.update.mockResolvedValue({ id: 'pr1', estado: 'RECHAZADA' });

            await service.rechazar('pr1', { motivo: 'Falta evidencia' }, actor);

            expect(mockPrisma.progresion.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ estado: 'RECHAZADA' }) }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'PROGRESION_RECHAZADA',
                    description: expect.stringContaining('Falta evidencia'),
                }),
            );
        });

        it('lanza Conflict si no está solicitada', async () => {
            mockPrisma.progresion.findFirst.mockResolvedValue({
                id: 'pr1',
                estado: 'APROBADA',
                Adelanto: adelantoPorcentaje,
                Joven: { Miembro: { ...miembroJoven, unidadId: 'u1' } },
            });

            await expect(service.rechazar('pr1', {}, actor)).rejects.toThrow(ConflictException);
        });
    });

    describe('listarJovenesDeUnidad', () => {
        it('lanza NotFound si la unidad no existe', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue(null);

            await expect(service.listarJovenesDeUnidad('nope', actor)).rejects.toThrow(NotFoundException);
        });

        it('devuelve cada joven con su adelanto actual y porcentaje', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ id: 'u1', nombre: 'Tropa', tipo: 'TROPA' });
            mockPrisma.miembro.findMany.mockResolvedValue([
                {
                    id: 'm1',
                    nombres: 'JUAN',
                    apellidos: 'PEREZ',
                    fechaNacimiento: new Date('2012-01-01'),
                    Joven: {
                        id: 'j1',
                        Progresiones: [
                            {
                                id: 'pr1',
                                estado: 'EN_CURSO',
                                Adelanto: { ...adelantoPorcentaje, orden: 2 },
                            },
                        ],
                    },
                },
            ]);
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue(
                Array.from({ length: 5 }, (_, i) => ({ jovenId: 'j1', indicadorId: `p${i + 1}` })),
            );

            const result = await service.listarJovenesDeUnidad('u1', actor);

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                miembroId: 'm1',
                nombres: 'JUAN',
                poolTotal: 10,
                requerido: 5,
                completados: 5,
                porcentajeActual: 50,
            });
            expect(result[0].adelantoActual).toMatchObject({ nombre: 'Explorador', orden: 2 });
        });
    });

    describe('reporte (§10.3)', () => {
        const progresionActiva = [
            {
                id: 'pr1',
                jovenId: 'j1',
                adelantoId: 'ad1',
                estado: 'EN_CURSO',
                fechaInicio: new Date('2026-01-01'),
                fechaCulminacion: null,
                aprobadoPor: null,
                Adelanto: adelantoPorcentaje,
            },
        ];

        it('getDatosExportJoven: construye indicadores, evaluación y resumen por área', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue({
                ...miembroJoven,
                fechaNacimiento: new Date('2012-01-01'),
            });
            mockPrisma.progresion.findMany.mockResolvedValue(progresionActiva);
            mockPrisma.etapa.findMany.mockResolvedValue([{ numero: 3 }, { numero: 4 }]);
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([
                { indicadorId: 'p1', estado: 'COMPLETADO' },
                { indicadorId: 'p2', estado: 'EN_PROCESO' },
            ]);

            const datos = await service.getDatosExportJoven('m1', actor);

            expect(datos).toMatchObject({
                miembroId: 'm1',
                nombres: 'JUAN',
                apellidos: 'PEREZ',
                unidad: 'Tropa',
                etapas: '3ª, 4ª etapas',
            });
            expect(datos.indicadores).toHaveLength(16);
            expect(datos.indicadores[0].estado).toBe('COMPLETADO');
            expect(datos.indicadores[1].estado).toBe('EN_PROCESO');
            expect(datos.adelantoActual).toMatchObject({ orden: 2, nombre: 'Explorador', umbralPorcentaje: 50 });
            expect(datos.evaluacion).toMatchObject({
                poolTotal: 10,
                requerido: 5,
                completados: 1,
                apto: false,
                bloqueo: null,
            });
            expect(datos.porArea).toEqual([
                { area: 'Area 1', total: 10, completados: 1, enProceso: 1, pendienteAprobacion: 0, pendientes: 8 },
            ]);
            expect(datos.historial).toEqual([]);
            expect(mockUnitAccess.assertCanAccessUnit).toHaveBeenCalledWith('user-1', 'u1');
        });

        it('getDatosExportJoven: respeta el scoping por unidad', async () => {
            mockPrisma.miembro.findFirst.mockResolvedValue(miembroJoven);
            mockUnitAccess.assertCanAccessUnit.mockRejectedValue(new ForbiddenException('No acceso'));

            await expect(service.getDatosExportJoven('m1', actor)).rejects.toThrow(ForbiddenException);
        });

        it('getDatosExportUnidad: lanza NotFound si la unidad no existe', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue(null);

            await expect(service.getDatosExportUnidad('nope', actor)).rejects.toThrow(NotFoundException);
        });

        it('getDatosExportUnidad: lista jóvenes y umbrales de la unidad', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ id: 'u1', nombre: 'Tropa', tipo: 'TROPA' });
            mockPrisma.miembro.findMany.mockResolvedValue([
                {
                    id: 'm1',
                    nombres: 'JUAN',
                    apellidos: 'PEREZ',
                    fechaNacimiento: new Date('2012-01-01'),
                    Joven: { id: 'j1', Progresiones: progresionActiva },
                },
                { id: 'm2', nombres: 'ANA', apellidos: 'GOMEZ', fechaNacimiento: new Date('2013-01-01'), Joven: null },
            ]);
            mockPrisma.adelanto.findMany.mockResolvedValue([
                { orden: 2, nombre: 'Explorador', umbralPorcentaje: 50 },
                { orden: 3, nombre: 'Pionero', umbralPorcentaje: 100 },
                { orden: 1, nombre: 'Aventurero', umbralPorcentaje: null },
            ]);
            mockPrisma.etapa.findMany.mockResolvedValue([{ numero: 3 }, { numero: 4 }]);
            mockPrisma.estadoLogroJoven.findMany.mockResolvedValue(
                Array.from({ length: 5 }, (_, i) => ({ jovenId: 'j1', indicadorId: `p${i + 1}`, estado: 'COMPLETADO' })),
            );

            const datos = await service.getDatosExportUnidad('u1', actor);

            expect(datos.unidad).toMatchObject({ nombre: 'Tropa', poolTotal: 10, etapas: '3ª, 4ª etapas' });
            expect(datos.adelantos).toEqual([
                { orden: 2, nombre: 'Explorador', umbralPorcentaje: 50, requerido: 5 },
                { orden: 3, nombre: 'Pionero', umbralPorcentaje: 100, requerido: 10 },
                { orden: 1, nombre: 'Aventurero', umbralPorcentaje: null, requerido: 0 },
            ]);
            expect(datos.jovenes).toHaveLength(1);
            expect(datos.jovenes[0].evaluacion).toMatchObject({
                poolTotal: 10,
                requerido: 5,
                completados: 5,
                apto: true,
            });
            expect(mockUnitAccess.assertCanAccessUnit).toHaveBeenCalledWith('user-1', 'u1');
        });
    });
});
