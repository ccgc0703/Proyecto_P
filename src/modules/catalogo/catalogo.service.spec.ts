import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogoService } from './catalogo.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('CatalogoService', () => {
    let service: CatalogoService;

    const mockPrisma = {
        areaCrecimiento: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        etapa: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        indicadorLogro: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        adelanto: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        estadoLogroJoven: { count: jest.fn() },
        progresion: { count: jest.fn() },
        unidad: { findFirst: jest.fn() },
    };

    const mockAudit = { logAction: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CatalogoService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAudit },
            ],
        }).compile();

        service = module.get<CatalogoService>(CatalogoService);
        jest.clearAllMocks();
    });

    describe('findAreas', () => {
        it('lista solo areas no eliminadas ordenadas por orden', async () => {
            const areas = [{ id: 'a1', nombre: 'Corporalidad', orden: 1 }];
            mockPrisma.areaCrecimiento.findMany.mockResolvedValue(areas);

            const result = await service.findAreas();

            expect(result).toEqual(areas);
            expect(mockPrisma.areaCrecimiento.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { deletedAt: null },
                    orderBy: { orden: 'asc' },
                }),
            );
        });
    });

    describe('createArea', () => {
        it('crea el area con auditoria', async () => {
            mockPrisma.areaCrecimiento.create.mockResolvedValue({ id: 'a1', nombre: 'Afectividad' });

            const result = await service.createArea(
                { nombre: 'Afectividad', orden: 5, tipo: 'AREA_CRECIMIENTO' },
                'user-1',
            );

            expect(result.id).toBe('a1');
            expect(mockPrisma.areaCrecimiento.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ nombre: 'Afectividad', orden: 5, createdBy: 'user-1' }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'CATALOGO_CREATED',
                    module: 'catalogo',
                    actorId: 'user-1',
                    targetId: 'a1',
                }),
            );
        });
    });

    describe('updateArea', () => {
        it('lanza NotFoundException si el area no existe', async () => {
            mockPrisma.areaCrecimiento.findFirst.mockResolvedValue(null);

            await expect(service.updateArea('x', { orden: 2 }, 'user-1')).rejects.toThrow(NotFoundException);
            expect(mockPrisma.areaCrecimiento.update).not.toHaveBeenCalled();
        });

        it('actualiza registrando updatedBy', async () => {
            mockPrisma.areaCrecimiento.findFirst.mockResolvedValue({ id: 'a1' });
            mockPrisma.areaCrecimiento.update.mockResolvedValue({ id: 'a1', orden: 3 });

            await service.updateArea('a1', { orden: 3 }, 'user-1');

            expect(mockPrisma.areaCrecimiento.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'a1' },
                    data: expect.objectContaining({ orden: 3, updatedBy: 'user-1' }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'CATALOGO_UPDATED', targetId: 'a1' }),
            );
        });
    });

    describe('removeArea', () => {
        it('bloquea la eliminacion si el area tiene indicadores activos', async () => {
            mockPrisma.areaCrecimiento.findFirst.mockResolvedValue({ id: 'a1', nombre: 'Sociabilidad' });
            mockPrisma.indicadorLogro.count.mockResolvedValue(42);

            await expect(service.removeArea('a1', 'user-1')).rejects.toThrow(ConflictException);
            expect(mockPrisma.areaCrecimiento.update).not.toHaveBeenCalled();
        });

        it('hace soft delete cuando no tiene indicadores', async () => {
            mockPrisma.areaCrecimiento.findFirst.mockResolvedValue({ id: 'a1', nombre: 'Sociabilidad' });
            mockPrisma.indicadorLogro.count.mockResolvedValue(0);
            mockPrisma.areaCrecimiento.update.mockResolvedValue({});

            await service.removeArea('a1', 'user-1');

            expect(mockPrisma.areaCrecimiento.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'a1' },
                    data: expect.objectContaining({ deletedAt: expect.any(Date), updatedBy: 'user-1' }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'CATALOGO_DELETED', targetId: 'a1' }),
            );
        });
    });

    describe('findEtapas', () => {
        it('resuelve la rama de la unidad cuando se envia unidadId', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ id: 'u-clan', tipo: 'CLAN' });
            mockPrisma.etapa.findMany.mockResolvedValue([]);

            await service.findEtapas({ unidadId: 'u-clan' });

            expect(mockPrisma.etapa.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { deletedAt: null, rama: 'CLAN' },
                    orderBy: { numero: 'asc' },
                }),
            );
        });

        it('devuelve lista vacia si la unidad no existe', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue(null);

            const result = await service.findEtapas({ unidadId: 'no-existe' });

            expect(result).toEqual([]);
            expect(mockPrisma.etapa.findMany).not.toHaveBeenCalled();
        });

        it('filtra por rama directa cuando se envia rama', async () => {
            mockPrisma.etapa.findMany.mockResolvedValue([]);

            await service.findEtapas({ rama: 'MANADA' });

            expect(mockPrisma.etapa.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { deletedAt: null, rama: 'MANADA' },
                }),
            );
        });

        it('ignora unidadId cuando no se envia', async () => {
            mockPrisma.etapa.findMany.mockResolvedValue([]);

            await service.findEtapas({});

            expect(mockPrisma.etapa.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { deletedAt: null } }),
            );
        });
    });

    describe('updateEtapa', () => {
        it('lanza NotFoundException si la etapa no existe', async () => {
            mockPrisma.etapa.findFirst.mockResolvedValue(null);

            await expect(service.updateEtapa('x', { nombre: 'Nueva' }, 'user-1')).rejects.toThrow(NotFoundException);
            expect(mockPrisma.etapa.update).not.toHaveBeenCalled();
        });

        it('solo permite tocar nombre y activo', async () => {
            mockPrisma.etapa.findFirst.mockResolvedValue({ id: 'e1', nombre: '5ª Etapa' });
            mockPrisma.etapa.update.mockResolvedValue({ id: 'e1', nombre: 'Quinta Etapa', activo: false });

            const result = await service.updateEtapa('e1', { nombre: 'Quinta Etapa', activo: false }, 'user-1');

            expect(result.nombre).toBe('Quinta Etapa');
            expect(mockPrisma.etapa.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'e1' },
                    data: expect.objectContaining({ nombre: 'Quinta Etapa', activo: false, updatedBy: 'user-1' }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'CATALOGO_UPDATED', targetId: 'e1' }),
            );
        });
    });

    describe('findIndicadores', () => {
        it('devuelve lista vacia si la unidad de unidadId no existe', async () => {
            const lista = [{ id: 'i1', codigo: 'a' }];
            mockPrisma.unidad.findFirst.mockResolvedValue(null);
            mockPrisma.indicadorLogro.findMany.mockResolvedValue(lista);

            const result = await service.findIndicadores({
                etapaId: 'e1',
                areaId: 'a1',
                unidadId: 'u1',
                search: 'sirviente',
            });

            expect(result).toEqual([]);
            expect(mockPrisma.indicadorLogro.findMany).not.toHaveBeenCalled();
        });

        it('resuelve rama desde unidadId y aplica el resto de filtros', async () => {
            const lista = [{ id: 'i1', codigo: 'a' }];
            mockPrisma.unidad.findFirst.mockResolvedValue({ id: 'u1', tipo: 'TROPA' });
            mockPrisma.indicadorLogro.findMany.mockResolvedValue(lista);

            const result = await service.findIndicadores({
                etapaId: 'e1',
                areaId: 'a1',
                unidadId: 'u1',
                search: 'sirviente',
            });

            expect(result).toEqual(lista);
            expect(mockPrisma.indicadorLogro.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        deletedAt: null,
                        rama: 'TROPA',
                        etapaId: 'e1',
                        areaId: 'a1',
                        OR: [
                            { codigo: { contains: 'sirviente', mode: 'insensitive' } },
                            { texto: { contains: 'sirviente', mode: 'insensitive' } },
                        ],
                    },
                }),
            );
        });

        it('devuelve solo el filtro de soft delete sin filtros adicionales', async () => {
            mockPrisma.indicadorLogro.findMany.mockResolvedValue([]);

            await service.findIndicadores({});

            expect(mockPrisma.indicadorLogro.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { deletedAt: null } }),
            );
        });
    });

    describe('createIndicador', () => {
        const dto = {
            codigo: 'a',
            texto: 'Presta atencion en las reuniones',
            etapaId: 'e1',
            areaId: 'a1',
            rama: 'MANADA' as const,
            orden: 1,
        };

        it('lanza NotFoundException si la etapa no existe', async () => {
            mockPrisma.etapa.findFirst.mockResolvedValue(null);

            await expect(service.createIndicador(dto, 'user-1')).rejects.toThrow(NotFoundException);
            expect(mockPrisma.indicadorLogro.create).not.toHaveBeenCalled();
        });

        it('crea el indicador con etapa y area validadas y su rama', async () => {
            mockPrisma.etapa.findFirst.mockResolvedValue({ id: 'e1' });
            mockPrisma.areaCrecimiento.findFirst.mockResolvedValue({ id: 'a1' });
            mockPrisma.indicadorLogro.create.mockResolvedValue({ id: 'i1', codigo: 'a' });

            const result = await service.createIndicador(dto, 'user-1');

            expect(result.id).toBe('i1');
            expect(mockPrisma.etapa.findFirst).toHaveBeenCalled();
            expect(mockPrisma.areaCrecimiento.findFirst).toHaveBeenCalled();
            expect(mockPrisma.indicadorLogro.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ codigo: 'a', rama: 'MANADA', createdBy: 'user-1' }),
                }),
            );
        });
    });

    describe('removeIndicador', () => {
        it('bloquea la eliminacion si hay estados de progreso', async () => {
            mockPrisma.indicadorLogro.findFirst.mockResolvedValue({ id: 'i1', codigo: 'a' });
            mockPrisma.estadoLogroJoven.count.mockResolvedValue(7);

            await expect(service.removeIndicador('i1', 'user-1')).rejects.toThrow(ConflictException);
            expect(mockPrisma.indicadorLogro.update).not.toHaveBeenCalled();
        });

        it('hace soft delete si nadie tiene estado del indicador', async () => {
            mockPrisma.indicadorLogro.findFirst.mockResolvedValue({ id: 'i1', codigo: 'a' });
            mockPrisma.estadoLogroJoven.count.mockResolvedValue(0);
            mockPrisma.indicadorLogro.update.mockResolvedValue({});

            await service.removeIndicador('i1', 'user-1');

            expect(mockPrisma.indicadorLogro.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ deletedAt: expect.any(Date), updatedBy: 'user-1' }),
                }),
            );
        });
    });

    describe('createAdelanto', () => {
        const base = { nombre: 'Lobo Mayor', orden: 2, rama: 'MANADA' as const };

        it('permite un adelanto con umbral sin comprobar prueba aislada', async () => {
            mockPrisma.adelanto.create.mockResolvedValue({ id: 'ad1' });

            await service.createAdelanto({ ...base, umbralPorcentaje: 70 }, 'user-1');

            expect(mockPrisma.adelanto.findFirst).not.toHaveBeenCalled();
            expect(mockPrisma.adelanto.create).toHaveBeenCalled();
        });

        it('permite crear la prueba aislada cuando la rama no tiene otra', async () => {
            mockPrisma.adelanto.findFirst.mockResolvedValue(null);
            mockPrisma.adelanto.create.mockResolvedValue({ id: 'ad1', nombre: 'Huella Fresca' });

            await service.createAdelanto({ ...base, nombre: 'Huella Fresca', orden: 1 }, 'user-1');

            expect(mockPrisma.adelanto.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ rama: 'MANADA', umbralPorcentaje: null }),
                }),
            );
            expect(mockPrisma.adelanto.create).toHaveBeenCalled();
        });

        it('bloquea una segunda prueba aislada en la misma rama', async () => {
            mockPrisma.adelanto.findFirst.mockResolvedValue({ id: 'ad0', nombre: 'Huella Fresca' });

            await expect(service.createAdelanto(base, 'user-1')).rejects.toThrow(ConflictException);
            expect(mockPrisma.adelanto.create).not.toHaveBeenCalled();
        });
    });

    describe('updateAdelanto', () => {
        it('bloquea si al cambiar a prueba aislada ya existe otra', async () => {
            mockPrisma.adelanto.findFirst.mockResolvedValueOnce({ id: 'ad1', rama: 'MANADA', umbralPorcentaje: 70 });
            mockPrisma.adelanto.findFirst.mockResolvedValueOnce({ id: 'ad0', nombre: 'Existente' });

            await expect(
                service.updateAdelanto('ad1', { umbralPorcentaje: null }, 'user-1'),
            ).rejects.toThrow(ConflictException);
            expect(mockPrisma.adelanto.update).not.toHaveBeenCalled();
        });
    });

    describe('removeAdelanto', () => {
        it('bloquea la eliminacion si tiene progresiones asociadas', async () => {
            mockPrisma.adelanto.findFirst.mockResolvedValue({ id: 'ad1', nombre: 'Lobo Mayor' });
            mockPrisma.progresion.count.mockResolvedValue(3);

            await expect(service.removeAdelanto('ad1', 'user-1')).rejects.toThrow(ConflictException);
            expect(mockPrisma.adelanto.update).not.toHaveBeenCalled();
        });

        it('hace soft delete cuando nadie ha iniciado el adelanto', async () => {
            mockPrisma.adelanto.findFirst.mockResolvedValue({ id: 'ad1', nombre: 'Lobo Mayor' });
            mockPrisma.progresion.count.mockResolvedValue(0);
            mockPrisma.adelanto.update.mockResolvedValue({});

            await service.removeAdelanto('ad1', 'user-1');

            expect(mockPrisma.adelanto.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'ad1' },
                    data: expect.objectContaining({ deletedAt: expect.any(Date), updatedBy: 'user-1' }),
                }),
            );
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'CATALOGO_DELETED', targetId: 'ad1' }),
            );
        });
    });
});
