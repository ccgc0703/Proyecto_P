"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_service_1 = require("./users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
describe('UsersService', () => {
    let service;
    let prisma;
    let auditService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                users_service_1.UsersService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
            ],
        }).compile();
        service = module.get(users_service_1.UsersService);
        prisma = module.get(prisma_service_1.PrismaService);
        auditService = module.get(audit_service_1.AuditService);
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should throw ConflictException if email exists', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
            await expect(service.create({ email: 'test@test.com', password: '123', nombre: 'Test' })).rejects.toThrow(common_1.ConflictException);
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
            await expect(service.findOne('invalid-id')).rejects.toThrow(common_1.NotFoundException);
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
            await expect(service.updateUser('1', { email: 'new@test.com' }, 'actor-1')).rejects.toThrow(common_1.ConflictException);
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
            const result = await service.updateUser('1', { email: 'new@test.com' }, 'actor-1');
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
//# sourceMappingURL=users.service.spec.js.map