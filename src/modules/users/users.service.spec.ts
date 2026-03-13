import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
    let service: UsersService;
    let prisma: any;
    let auditService: any;

    const mockPrisma = {
        usuario: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockAuditService = {
        logAction: jest.fn().mockResolvedValue(undefined),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        prisma = module.get(PrismaService);
        auditService = module.get(AuditService);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should throw ConflictException if email exists', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });

            await expect(
                service.create({ email: 'test@test.com', password: '123', nombre: 'Test' }),
            ).rejects.toThrow(ConflictException);
        });

        it('should create user successfully', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            mockPrisma.usuario.create.mockResolvedValue({
                id: '1',
                email: 'test@test.com',
                nombre: 'Test',
                password: 'hashed',
            });

            const result = await service.create({
                email: 'test@test.com',
                password: '123456',
                nombre: 'Test',
            });

            expect(result.email).toBe('test@test.com');
            expect(result.password).toBeUndefined();
            expect(mockAuditService.logAction).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return user without password', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({
                id: '1',
                email: 'test@test.com',
                password: 'hashed',
            });

            const result = await service.findOne('1');

            expect(result.password).toBeUndefined();
            expect(result.email).toBe('test@test.com');
        });

        it('should throw NotFoundException if user not found', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue(null);

            await expect(service.findOne('invalid-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('updateUser', () => {
        it('should throw ConflictException if email is taken', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({
                id: '1',
                email: 'old@test.com',
            });
            mockPrisma.usuario.findUnique.mockResolvedValue({
                id: '2',
                email: 'new@test.com',
            });

            await expect(
                service.updateUser('1', { email: 'new@test.com' }, 'actor-1'),
            ).rejects.toThrow(ConflictException);
        });

        it('should update user successfully', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue({
                id: '1',
                email: 'old@test.com',
            });
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            mockPrisma.usuario.update.mockResolvedValue({
                id: '1',
                email: 'new@test.com',
                nombre: 'Updated',
            });

            const result = await service.updateUser(
                '1',
                { email: 'new@test.com' },
                'actor-1',
            );

            expect(result.email).toBe('new@test.com');
        });
    });

    describe('remove', () => {
        it('should soft delete user', async () => {
            mockPrisma.usuario.update.mockResolvedValue({
                id: '1',
                deletedAt: new Date(),
            });

            await service.remove('1', 'actor-1');

            expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({ deletedAt: expect.any(Date) }),
            });
            expect(mockAuditService.logAction).toHaveBeenCalled();
        });
    });
});
