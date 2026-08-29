import { Test, TestingModule } from '@nestjs/testing';
import { FichaMedicaService } from './ficha-medica.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('FichaMedicaService', () => {
    let service: FichaMedicaService;
    let prisma: any;
    let audit: any;

    const mockFicha = {
        id: 'ficha-1',
        miembroId: 'miembro-1',
        tipoSangre: 'O_POSITIVO',
    };

    let mockPrisma: any;

    beforeEach(async () => {
        mockPrisma = {
            miembro: { findFirst: jest.fn() },
            fichaMedica: {
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                findMany: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            alergiaFichaMedica: { create: jest.fn(), update: jest.fn() },
            medicamentoFichaMedica: { create: jest.fn(), update: jest.fn() },
            condicionFichaMedica: { create: jest.fn(), update: jest.fn() },
            vacunaFichaMedica: { create: jest.fn(), update: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FichaMedicaService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: { logAction: jest.fn() } },
            ],
        }).compile();

        service = module.get<FichaMedicaService>(FichaMedicaService);
        prisma = module.get(PrismaService);
        audit = module.get(AuditService);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('debe lanzar NotFound si el miembro no existe', async () => {
            prisma.miembro.findFirst.mockResolvedValue(null);
            await expect(service.create({ miembroId: 'x' }, 'u1')).rejects.toThrow(NotFoundException);
        });

        it('debe lanzar Conflict si el miembro ya tiene ficha', async () => {
            prisma.miembro.findFirst.mockResolvedValue({ id: 'm1' });
            prisma.fichaMedica.findUnique.mockResolvedValue(mockFicha);
            await expect(service.create({ miembroId: 'm1' }, 'u1')).rejects.toThrow(ConflictException);
        });

        it('debe crear la ficha con consentimiento: si consentimiento es true, registra fecha', async () => {
            prisma.miembro.findFirst.mockResolvedValue({ id: 'm1' });
            prisma.fichaMedica.findUnique.mockResolvedValue(null);
            prisma.fichaMedica.create.mockResolvedValue({ id: 'f1' });

            await service.create(
                { miembroId: 'm1', tipoSangre: 'O_POSITIVO', consentimiento: true, alergiasDetalle: [{ nombre: 'Penicilina' }] },
                'u1',
            );

            const data = prisma.fichaMedica.create.mock.calls[0][0].data;
            expect(data.tipoSangre).toBe('O_POSITIVO');
            expect(data.consentimiento).toBe(true);
            expect(data.consentimientoFecha).toBeInstanceOf(Date);
            expect(data.createdBy).toBe('u1');
            expect(data.Alergias.create[0].nombre).toBe('Penicilina');
            expect(audit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'FICHA_MEDICA_CREATED', module: 'ficha-medica' }),
            );
        });
    });

    describe('findByMiembro / findOne', () => {
        it('debe lanzar NotFound si no existe ficha para el miembro', async () => {
            prisma.fichaMedica.findFirst.mockResolvedValue(null);
            await expect(service.findByMiembro('m1')).rejects.toThrow(NotFoundException);
        });
    });
});
