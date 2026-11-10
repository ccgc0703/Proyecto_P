import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FormacionService, Actor } from './formacion.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';

describe('FormacionService', () => {
    let service: FormacionService;

    const actor: Actor = { id: 'u1', roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };

    const mockPrisma = {
        formacion: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        adulto: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const mockAudit = { logAction: jest.fn().mockResolvedValue(undefined) };
    const mockUnitPolicy = {
        unidadesAlcance: jest.fn().mockResolvedValue(null),
        assertCanManageUnit: jest.fn().mockResolvedValue(undefined),
    };

    const adulto = {
        id: 'a1',
        Miembro: { unidadId: 'unidad-1' },
    };

    const formacion = {
        id: 'f1',
        nombre: 'Curso de Formación',
        fecha: new Date('2026-01-15T00:00:00.000Z'),
        director: 'MARIA',
        adultoId: 'a1',
        Adulto: {
            id: 'a1',
            Miembro: { id: 'm1', nombres: 'Ana', apellidos: 'Pérez', unidadId: 'unidad-1' },
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FormacionService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAudit },
                { provide: UnitPolicy, useValue: mockUnitPolicy },
            ],
        }).compile();

        service = module.get<FormacionService>(FormacionService);
        jest.clearAllMocks();
        mockAudit.logAction.mockResolvedValue(undefined);
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);
        mockUnitPolicy.assertCanManageUnit.mockResolvedValue(undefined);
    });

    describe('findAll', () => {
        it('sin alcance restringido lista todas las formaciones activas', async () => {
            mockPrisma.formacion.findMany.mockResolvedValue([formacion]);

            const result = await service.findAll(actor);

            expect(result).toEqual([formacion]);
            expect(mockPrisma.formacion.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                include: expect.any(Object),
                orderBy: [{ fecha: 'desc' }],
            });
        });

        it('filtra por las unidades del alcance del actor', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-1']);

            await service.findAll(actor);

            const { where } = mockPrisma.formacion.findMany.mock.calls[0][0];
            expect(where).toEqual({
                deletedAt: null,
                Adulto: { Miembro: { unidadId: { in: ['unidad-1'] } } },
            });
        });

        it('sin usuario no consulta el alcance y lista globalmente', async () => {
            await service.findAll();

            expect(mockUnitPolicy.unidadesAlcance).not.toHaveBeenCalled();
            expect(mockPrisma.formacion.findMany.mock.calls[0][0].where).toEqual({ deletedAt: null });
        });

        it('propaga el error de Prisma al listar', async () => {
            mockPrisma.formacion.findMany.mockRejectedValue(new Error('consulta fallida'));

            await expect(service.findAll(actor)).rejects.toThrow('consulta fallida');
        });
    });

    describe('listarAdultos', () => {
        it('sin alcance restringido devuelve adultos con su unidad aplanada', async () => {
            mockPrisma.adulto.findMany.mockResolvedValue([
                {
                    id: 'a1',
                    Miembro: {
                        nombres: 'Ana',
                        apellidos: 'Pérez',
                        unidadId: 'unidad-1',
                        Unidad: { id: 'unidad-1', nombre: 'Manada' },
                    },
                },
            ]);

            const result = await service.listarAdultos(actor);

            expect(result).toEqual([
                {
                    id: 'a1',
                    nombres: 'Ana',
                    apellidos: 'Pérez',
                    unidadId: 'unidad-1',
                    Unidad: { id: 'unidad-1', nombre: 'Manada' },
                },
            ]);
            expect(mockPrisma.adulto.findMany.mock.calls[0][0].where).toEqual({
                Miembro: { deletedAt: null },
            });
        });

        it('limita el selector a las unidades del alcance', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-1']);
            mockPrisma.adulto.findMany.mockResolvedValue([]);

            await service.listarAdultos(actor);

            expect(mockPrisma.adulto.findMany.mock.calls[0][0].where).toEqual({
                Miembro: { deletedAt: null, unidadId: { in: ['unidad-1'] } },
            });
        });
    });

    describe('findByAdulto', () => {
        it('devuelve las formaciones activas del adulto', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue(adulto);
            mockPrisma.formacion.findMany.mockResolvedValue([formacion]);

            const result = await service.findByAdulto('a1', actor);

            expect(result).toEqual([formacion]);
            expect(mockPrisma.formacion.findMany).toHaveBeenCalledWith({
                where: { adultoId: 'a1', deletedAt: null },
                include: expect.any(Object),
                orderBy: [{ fecha: 'desc' }],
            });
        });

        it('lanza NotFound si el adulto no existe', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue(null);

            await expect(service.findByAdulto('a1', actor)).rejects.toBeInstanceOf(NotFoundException);
            expect(mockPrisma.formacion.findMany).not.toHaveBeenCalled();
        });

        it('lanza NotFound si el adulto está fuera del alcance', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-9']);
            mockPrisma.adulto.findFirst.mockResolvedValue(adulto);

            await expect(service.findByAdulto('a1', actor)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('obtener', () => {
        it('devuelve la formación cuando existe y es visible', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(formacion);

            await expect(service.obtener('f1', actor)).resolves.toEqual(formacion);
        });

        it('lanza NotFound si no existe o está eliminada', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(null);

            await expect(service.obtener('f1', actor)).rejects.toThrow('Formacion no encontrada');
        });

        it('lanza NotFound si la unidad del adulto está fuera del alcance', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-9']);
            mockPrisma.formacion.findFirst.mockResolvedValue(formacion);

            await expect(service.obtener('f1', actor)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('crear', () => {
        const dto = {
            nombre: '  Curso de Formación  ',
            fecha: '2026-01-15',
            director: '  MARIA  ',
            adultoId: 'a1',
        };

        it('valida la unidad del adulto y crea la formación con datos normalizados', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue(adulto);
            mockPrisma.formacion.create.mockResolvedValue(formacion);

            const result = await service.crear(dto as any, actor);

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(actor, 'unidad-1');
            expect(mockPrisma.formacion.create).toHaveBeenCalledWith({
                data: {
                    nombre: 'Curso de Formación',
                    fecha: new Date('2026-01-15'),
                    director: 'MARIA',
                    adultoId: 'a1',
                },
                include: expect.any(Object),
            });
            expect(result).toEqual(formacion);
        });

        it('audita la creación', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue(adulto);
            mockPrisma.formacion.create.mockResolvedValue(formacion);

            await service.crear(dto as any, actor);

            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: 'u1',
                    action: 'FORMACION_CREATED',
                    module: 'formacion',
                    targetId: 'f1',
                }),
            );
        });

        it('lanza NotFound si el adulto no existe y no crea nada', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue(null);

            await expect(service.crear(dto as any, actor)).rejects.toBeInstanceOf(NotFoundException);
            expect(mockPrisma.formacion.create).not.toHaveBeenCalled();
        });

        it('propaga el Forbidden del aislamiento por unidad sin crear', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue(adulto);
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new Error('Aislamiento de Unidad'));

            await expect(service.crear(dto as any, actor)).rejects.toThrow('Aislamiento de Unidad');
            expect(mockPrisma.formacion.create).not.toHaveBeenCalled();
        });
    });

    describe('actualizar', () => {
        it('actualiza los campos normalizados y audita', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(formacion);
            mockPrisma.formacion.update.mockResolvedValue({ ...formacion, nombre: 'Curso nuevo' });

            const result = await service.actualizar(
                'f1',
                { nombre: '  Curso nuevo  ', director: '  PEDRO  ' } as any,
                actor,
            );

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(actor, 'unidad-1');
            expect(mockPrisma.formacion.update).toHaveBeenCalledWith({
                where: { id: 'f1' },
                data: { nombre: 'Curso nuevo', director: 'PEDRO' },
                include: expect.any(Object),
            });
            expect(result.nombre).toBe('Curso nuevo');
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'FORMACION_UPDATED', targetId: 'f1' }),
            );
        });

        it('convierte la fecha ISO a Date', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(formacion);
            mockPrisma.formacion.update.mockResolvedValue(formacion);

            await service.actualizar('f1', { fecha: '2026-02-20' } as any, actor);

            const { data } = mockPrisma.formacion.update.mock.calls[0][0];
            expect(data.fecha).toEqual(new Date('2026-02-20'));
        });

        it('valida la unidad del nuevo adulto al reasignar', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(formacion);
            mockPrisma.adulto.findFirst.mockResolvedValue({ id: 'a2', Miembro: { unidadId: 'unidad-2' } });
            mockPrisma.formacion.update.mockResolvedValue(formacion);

            await service.actualizar('f1', { adultoId: 'a2' } as any, actor);

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(actor, 'unidad-2');
        });

        it('lanza NotFound si la formación no existe', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(null);

            await expect(service.actualizar('f1', { nombre: 'X' } as any, actor)).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(mockPrisma.formacion.update).not.toHaveBeenCalled();
        });
    });

    describe('eliminar', () => {
        it('aplica soft-delete y audita', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(formacion);
            mockPrisma.formacion.update.mockResolvedValue(formacion);

            await service.eliminar('f1', actor);

            expect(mockPrisma.formacion.update).toHaveBeenCalledWith({
                where: { id: 'f1' },
                data: { deletedAt: expect.any(Date) },
            });
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'FORMACION_DELETED', targetId: 'f1' }),
            );
        });

        it('no elimina si el actor no puede gestionar la unidad', async () => {
            mockPrisma.formacion.findFirst.mockResolvedValue(formacion);
            mockUnitPolicy.assertCanManageUnit.mockRejectedValue(new Error('sin permiso'));

            await expect(service.eliminar('f1', actor)).rejects.toThrow('sin permiso');
            expect(mockPrisma.formacion.update).not.toHaveBeenCalled();
        });
    });
});
