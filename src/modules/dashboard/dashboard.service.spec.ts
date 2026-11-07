import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnitPolicy } from '../../common/policies/unit.policy';

describe('DashboardService', () => {
    let service: DashboardService;

    const mockPrisma = {
        unidad: { findMany: jest.fn() },
        miembro: { count: jest.fn(), groupBy: jest.fn() },
        estadoLogroJoven: { findMany: jest.fn(), count: jest.fn() },
        progresion: { count: jest.fn() },
        asistencia: { findMany: jest.fn() },
        actividad: { findFirst: jest.fn() },
        fichaMedica: { count: jest.fn() },
    };

    const mockUnitPolicy = { unidadesAlcance: jest.fn() };

    const admin = { id: 'u-admin', roles: ['SYSTEM_ADMIN'] };
    const adulto = { id: 'u-adulto', roles: ['ADULTO_MANADA'], unidadId: 'u-mia' };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: UnitPolicy, useValue: mockUnitPolicy },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);

        // Por defecto: vacío (ceros en todo).
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);
        mockPrisma.unidad.findMany.mockResolvedValue([]);
        mockPrisma.miembro.count.mockResolvedValue(0);
        mockPrisma.miembro.groupBy.mockResolvedValue([]);
        mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([]);
        mockPrisma.estadoLogroJoven.count.mockResolvedValue(0);
        mockPrisma.progresion.count.mockResolvedValue(0);
        mockPrisma.asistencia.findMany.mockResolvedValue([]);
        mockPrisma.actividad.findFirst.mockResolvedValue(null);
        mockPrisma.fichaMedica.count.mockResolvedValue(0);
    });

    // ── Alcance (ABAC) ───────────────────────────────────────────────

    it('visión global: no filtra por unidad en población', async () => {
        await service.getResumen(admin);

        expect(mockUnitPolicy.unidadesAlcance).toHaveBeenCalledWith(admin);
        const where = mockPrisma.miembro.count.mock.calls[0][0].where;
        expect(where.tipo).toBe('JOVEN');
        expect(where.deletedAt).toBeNull();
        expect(where.unidadId).toBeUndefined();
    });

    it('adulto acotado: filtra población por sus unidades', async () => {
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(['u-mia']);

        await service.getResumen(adulto);

        const where = mockPrisma.miembro.count.mock.calls[0][0].where;
        expect(where.unidadId).toEqual({ in: ['u-mia'] });
        // El desglose solo lista sus unidades.
        expect(mockPrisma.unidad.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ id: { in: ['u-mia'] } }),
            }),
        );
    });

    it('alcance acotado se propaga a progresión, asistencia y alertas', async () => {
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(['u-mia']);

        await service.getResumen(adulto);

        const alcance = { unidadId: { in: ['u-mia'] } };
        // Progresión: EstadoLogroJoven → Joven → Miembro
        const whereLogro = mockPrisma.estadoLogroJoven.findMany.mock.calls[0][0].where;
        expect(whereLogro.Joven.Miembro).toMatchObject(alcance);
        // Asistencia: Asistencia → Miembro
        const whereAsis = mockPrisma.asistencia.findMany.mock.calls[0][0].where;
        expect(whereAsis.Miembro).toMatchObject(alcance);
        // Alertas: FichaMedica → Miembro
        const whereFicha = mockPrisma.fichaMedica.count.mock.calls[0][0].where;
        expect(whereFicha.Miembro).toMatchObject(alcance);
    });

    // ── Población ────────────────────────────────────────────────────

    it('población: ceros y desglose vacío sin datos', async () => {
        const res = await service.getResumen(admin);

        expect(res.poblacion).toEqual({ total: 0, varMensual: 0, porUnidad: [] });
    });

    it('población: varMensual = altas30d - bajas30d', async () => {
        // 1ª count = total, 2ª = altas, 3ª = bajas
        mockPrisma.miembro.count
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(4)
            .mockResolvedValueOnce(1);
        mockPrisma.unidad.findMany.mockResolvedValue([
            { id: 'u1', nombre: 'Manada' },
        ]);
        mockPrisma.miembro.groupBy.mockResolvedValue([
            { unidadId: 'u1', _count: 7 },
        ]);

        const res = await service.getResumen(admin);

        expect(res.poblacion.total).toBe(10);
        expect(res.poblacion.varMensual).toBe(3);
        expect(res.poblacion.porUnidad).toEqual([
            { unidadId: 'u1', nombre: 'Manada', total: 7 },
        ]);
    });

    // ── Progresión ───────────────────────────────────────────────────

    it('progresión: promedio 0 con pool vacío (evita división por cero)', async () => {
        const res = await service.getResumen(admin);

        expect(res.progresion.promedioPorcentaje).toBe(0);
        expect(res.progresion.porUnidad).toEqual([]);
    });

    it('progresión: promedio = completados/total redondeado a 1 decimal', async () => {
        mockPrisma.estadoLogroJoven.findMany.mockResolvedValue([
            { estado: 'COMPLETADO', Joven: { Miembro: { unidadId: 'u1' } } },
            { estado: 'COMPLETADO', Joven: { Miembro: { unidadId: 'u1' } } },
            { estado: 'EN_PROCESO', Joven: { Miembro: { unidadId: 'u1' } } },
        ]);
        mockPrisma.unidad.findMany.mockResolvedValue([
            { id: 'u1', nombre: 'Manada' },
        ]);

        const res = await service.getResumen(admin);

        // 2/3 = 66.66… → 66.7
        expect(res.progresion.promedioPorcentaje).toBe(66.7);
        expect(res.progresion.porUnidad).toEqual([
            { unidadId: 'u1', nombre: 'Manada', porcentaje: 67 },
        ]);
    });

    it('progresión: cuenta solicitudes pendientes y adelantos del mes', async () => {
        mockPrisma.progresion.count
            .mockResolvedValueOnce(2) // solicitudes SOLICITADA
            .mockResolvedValueOnce(5); // APROBADA este mes

        const res = await service.getResumen(admin);

        expect(res.progresion.solicitudesPendientes).toBe(2);
        expect(res.progresion.adelantosAprobadosMes).toBe(5);
        // Los filtros usan el estado correcto
        expect(mockPrisma.progresion.count.mock.calls[0][0].where.estado).toBe('SOLICITADA');
        expect(mockPrisma.progresion.count.mock.calls[1][0].where.estado).toBe('APROBADA');
    });

    // ── Asistencia ───────────────────────────────────────────────────

    it('asistencia: promedio30d = 0 sin registros (pool vacío)', async () => {
        const res = await service.getResumen(admin);

        expect(res.asistencia.promedio30d).toBe(0);
        expect(res.asistencia.ultimaActividad).toBeNull();
    });

    it('asistencia: promedio30d = presentes/marcados sobre la ventana de 30d', async () => {
        const ahora = Date.now();
        const hace10d = new Date(ahora - 10 * 24 * 60 * 60 * 1000);
        mockPrisma.asistencia.findMany.mockResolvedValue([
            { estado: 'PRESENTE', createdAt: hace10d, Miembro: { unidadId: 'u1' } },
            { estado: 'AUSENTE', createdAt: hace10d, Miembro: { unidadId: 'u1' } },
            { estado: 'JUSTIFICADO', createdAt: hace10d, Miembro: { unidadId: 'u1' } },
        ]);
        mockPrisma.unidad.findMany.mockResolvedValue([
            { id: 'u1', nombre: 'Manada' },
        ]);

        const res = await service.getResumen(admin);

        expect(res.asistencia.promedio30d).toBe(33);
        expect(res.asistencia.porUnidad).toEqual([
            { unidadId: 'u1', nombre: 'Manada', porcentaje: 33 },
        ]);
    });

    it('asistencia: la tendencia tiene exactamente 8 buckets de 7 días', async () => {
        const res = await service.getResumen(admin);

        expect(res.asistencia.tendenciaSemanal).toHaveLength(8);
        for (const bucket of res.asistencia.tendenciaSemanal) {
            expect(bucket).toEqual(
                expect.objectContaining({
                    semana: expect.any(String),
                    porcentaje: expect.any(Number),
                }),
            );
        }
    });

    // ── Alertas ──────────────────────────────────────────────────────

    it('alertas: vacías sin pendientes', async () => {
        const res = await service.getResumen(admin);

        expect(res.alertas).toEqual([]);
    });

    it('alertas: genera las tres con sus links cuando hay pendientes', async () => {
        mockPrisma.progresion.count.mockResolvedValue(3); // solicitudes
        mockPrisma.estadoLogroJoven.count.mockResolvedValue(2); // indicadores
        mockPrisma.fichaMedica.count.mockResolvedValue(1); // seguros

        const res = await service.getResumen(admin);

        expect(res.alertas).toHaveLength(3);
        expect(res.alertas[0]).toEqual({
            tipo: 'SOLICITUD_PENDIENTE',
            texto: expect.stringContaining('3 solicitud'),
            link: '/app/progresion',
        });
        expect(res.alertas[1]).toEqual({
            tipo: 'INDICADOR_PENDIENTE',
            texto: expect.stringContaining('2 indicador'),
            link: '/app/progresion',
        });
        expect(res.alertas[2]).toEqual({
            tipo: 'SEGURO_POR_VENCER',
            texto: expect.stringContaining('1 ficha'),
            link: '/app/miembros',
        });
    });

    // ── Estructura de respuesta ──────────────────────────────────────

    it('devuelve las cuatro secciones del resumen', async () => {
        const res = await service.getResumen(admin);

        expect(Object.keys(res).sort()).toEqual([
            'alertas',
            'asistencia',
            'poblacion',
            'progresion',
        ]);
    });
});
