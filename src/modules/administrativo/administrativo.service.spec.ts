import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdministrativoService } from './administrativo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AdministrativoService', () => {
    let service: AdministrativoService;
    let prisma: any;

    let mockPrisma: any;

    beforeEach(async () => {
        mockPrisma = {
            representante: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            fichaMedica: { create: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdministrativoService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<AdministrativoService>(AdministrativoService);
        prisma = module.get(PrismaService);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('lista solo representantes no eliminados', async () => {
            const representantes = [{ id: 'r1', nombre: 'JUAN', cedula: 'V-123' }];
            prisma.representante.findMany.mockResolvedValue(representantes);

            const result = await service.findAll();

            expect(result).toEqual(representantes);
            expect(prisma.representante.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
            });
        });
    });

    describe('findOne', () => {
        it('lanza NotFoundException si el representante no existe o fue eliminado', async () => {
            prisma.representante.findFirst.mockResolvedValue(null);

            await expect(service.findOne('r404')).rejects.toThrow(NotFoundException);
            expect(prisma.representante.findFirst).toHaveBeenCalledWith({
                where: { id: 'r404', deletedAt: null },
            });
        });
    });

    describe('createRepresentante', () => {
        it('devuelve el existente sin crear uno nuevo si la cedula ya esta registrada', async () => {
            const existente = { id: 'r1', cedula: 'V-123' };
            prisma.representante.findUnique.mockResolvedValue(existente);

            const result = await service.createRepresentante({ nombre: 'JUAN', cedula: 'V-123' }, 'u1');

            expect(result).toEqual(existente);
            expect(prisma.representante.findUnique).toHaveBeenCalledWith({ where: { cedula: 'V-123' } });
            expect(prisma.representante.create).not.toHaveBeenCalled();
        });

        it('crea el representante con el autor de la accion cuando la cedula es nueva', async () => {
            prisma.representante.findUnique.mockResolvedValue(null);
            prisma.representante.create.mockResolvedValue({ id: 'r9', nombre: 'JUAN' });

            const result = await service.createRepresentante({ nombre: 'JUAN', cedula: 'V-999' }, 'u1');

            expect(result.id).toBe('r9');
            expect(prisma.representante.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    nombre: 'JUAN',
                    cedula: 'V-999',
                    createdBy: 'u1',
                    createdAt: expect.any(Date),
                }),
            });
        });
    });

    describe('updateRepresentante', () => {
        it('lanza NotFoundException si el representante a actualizar no existe', async () => {
            prisma.representante.findFirst.mockResolvedValue(null);

            await expect(service.updateRepresentante('r404', { nombre: 'PEDRO' }, 'u1')).rejects.toThrow(
                NotFoundException,
            );
            expect(prisma.representante.update).not.toHaveBeenCalled();
        });

        it('actualiza el representante registrando updatedBy', async () => {
            prisma.representante.findFirst.mockResolvedValue({ id: 'r1' });
            prisma.representante.update.mockResolvedValue({ id: 'r1', nombre: 'PEDRO' });

            const result = await service.updateRepresentante('r1', { nombre: 'PEDRO' }, 'u1');

            expect(result.nombre).toBe('PEDRO');
            expect(prisma.representante.update).toHaveBeenCalledWith({
                where: { id: 'r1' },
                data: expect.objectContaining({
                    nombre: 'PEDRO',
                    updatedBy: 'u1',
                    updatedAt: expect.any(Date),
                }),
            });
        });
    });

    describe('createFichaMedica', () => {
        it('crea la ficha medica con fecha y autor de la accion', async () => {
            prisma.fichaMedica.create.mockResolvedValue({ id: 'f1', miembroId: 'm1' });

            const result = await service.createFichaMedica(
                { miembroId: 'm1', tipoSangre: 'O_POSITIVO' },
                'u1',
            );

            expect(result.id).toBe('f1');
            expect(prisma.fichaMedica.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    miembroId: 'm1',
                    tipoSangre: 'O_POSITIVO',
                    createdBy: 'u1',
                    createdAt: expect.any(Date),
                }),
            });
        });
    });

    describe('remove', () => {
        it('hace soft delete del representante', async () => {
            prisma.representante.update.mockResolvedValue({ id: 'r1' });

            await service.remove('r1', 'u1');

            expect(prisma.representante.update).toHaveBeenCalledWith({
                where: { id: 'r1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                    updatedBy: 'u1',
                }),
            });
        });
    });
});
