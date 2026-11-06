import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventosService } from './eventos.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';

describe('EventosService', () => {
    let service: EventosService;

    const mockPrisma = {
        planificacion: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        actividad: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        asistencia: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            count: jest.fn(),
            upsert: jest.fn(),
            update: jest.fn(),
        },
        miembro: { findMany: jest.fn() },
    };

    const mockAudit = { logAction: jest.fn() };
    const mockUnitPolicy = {
        unidadesAlcance: jest.fn(),
        assertCanManageUnit: jest.fn(),
    };

    const admin = { id: 'user-1', roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };
    const adultoManada = { id: 'user-2', roles: ['ADULTO_MANADA'], unidadId: 'u-manada', nodoId: null };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventosService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAudit },
                { provide: UnitPolicy, useValue: mockUnitPolicy },
            ],
        }).compile();

        service = module.get<EventosService>(EventosService);
        jest.clearAllMocks();
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);
        mockUnitPolicy.assertCanManageUnit.mockResolvedValue(undefined);
    });

    // ── Planificaciones ───────────────────────────────────────────────

    describe('findPlanificaciones', () => {
        it('admin (alcance global) lista sin filtro de unidad', async () => {
            mockPrisma.planificacion.findMany.mockResolvedValue([]);

            await service.findPlanificaciones({}, admin, {});

            const where = mockPrisma.planificacion.findMany.mock.calls[0][0].where;
            expect(where.deletedAt).toBeNull();
            expect(where.AND).toBeUndefined();
        });

        it('adulto restringido solo ve su unidad y el ambito grupo (unidadId null)', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['u-manada']);
            mockPrisma.planificacion.findMany.mockResolvedValue([]);

            await service.findPlanificaciones({}, adultoManada, {});

            const where = mockPrisma.planificacion.findMany.mock.calls[0][0].where;
            expect(where.AND).toContainEqual({
                OR: [{ unidadId: { in: ['u-manada'] } }, { unidadId: null }],
            });
        });

        it('con unidadId explicito valida el alcance antes de listar', async () => {
            mockPrisma.planificacion.findMany.mockResolvedValue([]);

            await service.findPlanificaciones({ unidadId: 'u-tropa' }, adultoManada, {});

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(adultoManada, 'u-tropa');
        });
    });

    describe('createPlanificacion', () => {
        it('crea la planificacion con auditoria', async () => {
            mockPrisma.planificacion.create.mockResolvedValue({ id: 'p1', titulo: 'Semana 1' });

            const result = await service.createPlanificacion(
                { titulo: 'Semana 1', fechaInicio: '2026-03-01', fechaFin: '2026-03-07' },
                admin,
            );

            expect(result.id).toBe('p1');
            expect(mockPrisma.planificacion.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        titulo: 'Semana 1',
                        fechaInicio: new Date('2026-03-01'),
                        createdBy: 'user-1',
                    }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'PLANIFICACION_CREATED',
                    module: 'eventos',
                    actorId: 'user-1',
                    targetId: 'p1',
                }),
            );
        });

        it('con unidadId valida que el actor pueda gestionarla', async () => {
            mockPrisma.planificacion.create.mockResolvedValue({ id: 'p1' });

            await service.createPlanificacion(
                { titulo: 'Semana 1', fechaInicio: '2026-03-01', fechaFin: '2026-03-07', unidadId: 'u-x' },
                adultoManada,
            );

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(adultoManada, 'u-x');
        });
    });

    describe('updatePlanificacion', () => {
        it('lanza NotFoundException si no existe', async () => {
            mockPrisma.planificacion.findFirst.mockResolvedValue(null);

            await expect(
                service.updatePlanificacion('no-existe', { titulo: 'x' }, admin),
            ).rejects.toThrow(NotFoundException);
        });

        it('actualiza con auditoria', async () => {
            mockPrisma.planificacion.findFirst.mockResolvedValue({ id: 'p1', titulo: 'Vieja', unidadId: null });
            mockPrisma.planificacion.update.mockResolvedValue({ id: 'p1', titulo: 'Nueva' });

            await service.updatePlanificacion('p1', { titulo: 'Nueva' }, admin);

            expect(mockPrisma.planificacion.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'p1' },
                    data: expect.objectContaining({ titulo: 'Nueva', updatedBy: 'user-1' }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'PLANIFICACION_UPDATED', targetId: 'p1' }),
            );
        });
    });

    describe('removePlanificacion', () => {
        it('lanza ConflictException si tiene actividades activas', async () => {
            mockPrisma.planificacion.findFirst.mockResolvedValue({ id: 'p1', titulo: 'X', unidadId: null });
            mockPrisma.actividad.count.mockResolvedValue(3);

            await expect(service.removePlanificacion('p1', admin)).rejects.toThrow(ConflictException);
            expect(mockPrisma.planificacion.update).not.toHaveBeenCalled();
        });

        it('soft-delete y audita si no tiene actividades', async () => {
            mockPrisma.planificacion.findFirst.mockResolvedValue({ id: 'p1', titulo: 'X', unidadId: null });
            mockPrisma.actividad.count.mockResolvedValue(0);
            mockPrisma.planificacion.update.mockResolvedValue({});

            await service.removePlanificacion('p1', admin);

            expect(mockPrisma.planificacion.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'p1' },
                    data: expect.objectContaining({ deletedAt: expect.any(Date) }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'PLANIFICACION_DELETED', targetId: 'p1' }),
            );
        });
    });

    // ── Actividades ───────────────────────────────────────────────────

    describe('createActividad', () => {
        it('lanza NotFoundException si la planificacion no existe', async () => {
            mockPrisma.planificacion.findFirst.mockResolvedValue(null);

            await expect(
                service.createActividad('p-x', { titulo: 'Reunion', fecha: '2026-03-05' }, admin),
            ).rejects.toThrow(NotFoundException);
        });

        it('propaga Forbidden si la planificacion es de otra unidad', async () => {
            mockPrisma.planificacion.findFirst.mockResolvedValue({ id: 'p1', unidadId: 'u-tropa' });
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new ForbiddenException('fuera de alcance'));

            await expect(
                service.createActividad('p1', { titulo: 'Reunion', fecha: '2026-03-05' }, adultoManada),
            ).rejects.toThrow(ForbiddenException);
            expect(mockPrisma.actividad.create).not.toHaveBeenCalled();
        });

        it('crea la actividad con auditoria', async () => {
            mockPrisma.planificacion.findFirst.mockResolvedValue({ id: 'p1', titulo: 'Semana 1', unidadId: null });
            mockPrisma.actividad.create.mockResolvedValue({ id: 'a1', titulo: 'Reunion' });

            const result = await service.createActividad(
                'p1',
                { titulo: 'Reunion', fecha: '2026-03-05', tipo: 'REUNION', horaInicio: '16:00' },
                admin,
            );

            expect(result.id).toBe('a1');
            expect(mockPrisma.actividad.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        titulo: 'Reunion',
                        fecha: new Date('2026-03-05'),
                        planificacionId: 'p1',
                        createdBy: 'user-1',
                    }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'ACTIVIDAD_CREATED', module: 'eventos', targetId: 'a1' }),
            );
        });
    });

    describe('removeActividad', () => {
        it('lanza ConflictException si tiene asistencias registradas', async () => {
            mockPrisma.actividad.findFirst.mockResolvedValue({
                id: 'a1',
                titulo: 'Reunion',
                Planificacion: { unidadId: null },
            });
            mockPrisma.asistencia.count.mockResolvedValue(10);

            await expect(service.removeActividad('a1', admin)).rejects.toThrow(ConflictException);
            expect(mockPrisma.actividad.update).not.toHaveBeenCalled();
        });

        it('soft-delete y audita si no tiene asistencias', async () => {
            mockPrisma.actividad.findFirst.mockResolvedValue({
                id: 'a1',
                titulo: 'Reunion',
                Planificacion: { unidadId: null },
            });
            mockPrisma.asistencia.count.mockResolvedValue(0);
            mockPrisma.actividad.update.mockResolvedValue({});

            await service.removeActividad('a1', admin);

            expect(mockPrisma.actividad.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'a1' },
                    data: expect.objectContaining({ deletedAt: expect.any(Date) }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'ACTIVIDAD_DELETED', targetId: 'a1' }),
            );
        });
    });

    // ── Asistencias ───────────────────────────────────────────────────

    describe('listarAsistenciasActividad', () => {
        it('mergea los jovenes del ambito con sus marcas (estado null si falta)', async () => {
            mockPrisma.actividad.findFirst.mockResolvedValue({
                id: 'a1',
                titulo: 'Reunion',
                fecha: new Date(),
                tipo: 'REUNION',
                estado: 'PENDIENTE',
                planificacionId: 'p1',
                Planificacion: { id: 'p1', titulo: 'Semana 1', unidadId: null },
            });
            mockPrisma.miembro.findMany.mockResolvedValue([
                { id: 'm1', nombres: 'Ana', apellidos: 'Perez', unidadId: 'u-manada' },
                { id: 'm2', nombres: 'Luis', apellidos: 'Gomez', unidadId: 'u-manada' },
            ]);
            mockPrisma.asistencia.findMany.mockResolvedValue([
                { id: 'as1', miembroId: 'm1', estado: 'AUSENTE', observacion: null },
            ]);

            const result = await service.listarAsistenciasActividad('a1', admin);

            expect(result.registros).toHaveLength(2);
            expect(result.registros[0]).toEqual(
                expect.objectContaining({ miembroId: 'm1', estado: 'AUSENTE', asistenciaId: 'as1' }),
            );
            expect(result.registros[1]).toEqual(
                expect.objectContaining({ miembroId: 'm2', estado: null, asistenciaId: null }),
            );
        });

        it('lanza NotFoundException si la actividad no existe', async () => {
            mockPrisma.actividad.findFirst.mockResolvedValue(null);

            await expect(service.listarAsistenciasActividad('x', admin)).rejects.toThrow(NotFoundException);
        });
    });

    describe('registrarAsistenciasBulk', () => {
        const actividadBase = {
            id: 'a1',
            titulo: 'Reunion',
            Planificacion: { unidadId: null },
        };

        it('rechaza con ConflictException si hay miembros fuera de alcance', async () => {
            mockPrisma.actividad.findFirst.mockResolvedValue(actividadBase);
            mockPrisma.miembro.findMany.mockResolvedValue([{ id: 'm1' }]); // solo m1 es valido

            await expect(
                service.registrarAsistenciasBulk(
                    'a1',
                    {
                        registros: [
                            { miembroId: 'm1', estado: 'PRESENTE' as const },
                            { miembroId: 'm-fantasma', estado: 'AUSENTE' as const },
                        ],
                    },
                    admin,
                ),
            ).rejects.toThrow(ConflictException);
            expect(mockPrisma.asistencia.upsert).not.toHaveBeenCalled();
            expect(mockAudit.logAction).not.toHaveBeenCalled();
        });

        it('hace upsert por registro y audita UN solo ASISTENCIA_BULK con el conteo', async () => {
            mockPrisma.actividad.findFirst.mockResolvedValue(actividadBase);
            mockPrisma.miembro.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
            mockPrisma.asistencia.upsert.mockResolvedValue({});

            const result = await service.registrarAsistenciasBulk(
                'a1',
                {
                    registros: [
                        { miembroId: 'm1', estado: 'PRESENTE' as const },
                        { miembroId: 'm2', estado: 'JUSTIFICADO' as const, observacion: 'Cita medica' },
                    ],
                },
                admin,
            );

            expect(result.registrados).toBe(2);
            expect(mockPrisma.asistencia.upsert).toHaveBeenCalledTimes(2);
            expect(mockPrisma.asistencia.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { actividadId_miembroId: { actividadId: 'a1', miembroId: 'm1' } },
                    create: expect.objectContaining({ estado: 'PRESENTE', createdBy: 'user-1' }),
                }),
            );
            const bulkAudits = mockAudit.logAction.mock.calls.filter(
                (c) => c[0].action === 'ASISTENCIA_BULK',
            );
            expect(bulkAudits).toHaveLength(1);
            expect(bulkAudits[0][0].description).toContain('2 marca(s)');
        });

        it('en planificacion de unidad solo admite miembros de esa unidad', async () => {
            mockPrisma.actividad.findFirst.mockResolvedValue({
                ...actividadBase,
                Planificacion: { unidadId: 'u-manada' },
            });
            mockPrisma.miembro.findMany.mockResolvedValue([{ id: 'm1' }]);
            mockPrisma.asistencia.upsert.mockResolvedValue({});

            await service.registrarAsistenciasBulk(
                'a1',
                { registros: [{ miembroId: 'm1', estado: 'PRESENTE' as const }] },
                admin,
            );

            const where = mockPrisma.miembro.findMany.mock.calls[0][0].where;
            expect(where.unidadId).toEqual({ in: ['u-manada'] });
            expect(where.tipo).toBe('JOVEN');
            expect(where.estado).toBe('ACTIVO');
        });
    });

    describe('updateAsistencia', () => {
        it('lanza NotFoundException si la asistencia no existe', async () => {
            mockPrisma.asistencia.findFirst.mockResolvedValue(null);

            await expect(
                service.updateAsistencia('x', { estado: 'AUSENTE' }, admin),
            ).rejects.toThrow(NotFoundException);
        });

        it('actualiza el estado y audita', async () => {
            mockPrisma.asistencia.findFirst.mockResolvedValue({ id: 'as1', actividadId: 'a1' });
            mockPrisma.actividad.findFirst.mockResolvedValue({
                id: 'a1',
                titulo: 'Reunion',
                Planificacion: { unidadId: null },
            });
            mockPrisma.asistencia.update.mockResolvedValue({ id: 'as1', estado: 'AUSENTE' });

            await service.updateAsistencia('as1', { estado: 'AUSENTE' }, admin);

            expect(mockPrisma.asistencia.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'as1' },
                    data: expect.objectContaining({ estado: 'AUSENTE', updatedBy: 'user-1' }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'ASISTENCIA_UPDATED', targetId: 'as1' }),
            );
        });
    });

    describe('asistenciasDeUnidad', () => {
        it('valida el alcance de la unidad antes de consultar', async () => {
            mockPrisma.asistencia.findMany.mockResolvedValue([]);

            await service.asistenciasDeUnidad('u-manada', {}, adultoManada);

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(adultoManada, 'u-manada');
            const args = mockPrisma.asistencia.findMany.mock.calls[0][0];
            expect(args.where.Miembro).toEqual({ unidadId: 'u-manada' });
        });

        it('propaga Forbidden si la unidad esta fuera de alcance', async () => {
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new ForbiddenException('sin acceso'));

            await expect(service.asistenciasDeUnidad('u-otra', {}, adultoManada)).rejects.toThrow(
                ForbiddenException,
            );
            expect(mockPrisma.asistencia.findMany).not.toHaveBeenCalled();
        });
    });
});
