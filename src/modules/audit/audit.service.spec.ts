import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService (F4.6 retención)', () => {
    let service: AuditService;
    const prismaMock = {
        auditLog: {
            create: jest.fn().mockResolvedValue({}),
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
    };

    const envOriginal = process.env.AUDIT_RETENTION_DAYS;

    beforeEach(async () => {
        delete process.env.AUDIT_RETENTION_DAYS;
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
    });

    afterAll(() => {
        if (envOriginal === undefined) delete process.env.AUDIT_RETENTION_DAYS;
        else process.env.AUDIT_RETENTION_DAYS = envOriginal;
    });

    describe('retencionDias', () => {
        it('usa 365 días por defecto', () => {
            expect(service.retencionDias()).toBe(365);
        });

        it('lee AUDIT_RETENTION_DAYS', () => {
            process.env.AUDIT_RETENTION_DAYS = '90';
            expect(service.retencionDias()).toBe(90);
        });

        it('degrada a 365 con valores no numéricos', () => {
            process.env.AUDIT_RETENTION_DAYS = 'abc';
            expect(service.retencionDias()).toBe(365);
        });
    });

    describe('purgarRetencion', () => {
        it('elimina registros anteriores al corte con la ventana indicada', async () => {
            prismaMock.auditLog.deleteMany.mockResolvedValue({ count: 7 });

            const antes = Date.now();
            const res = await service.purgarRetencion(30);
            const despues = Date.now();

            expect(res.eliminados).toBe(7);
            expect(res.deshabilitado).toBe(false);
            expect(res.dias).toBe(30);

            const corte = res.desde!.getTime();
            expect(corte).toBeGreaterThanOrEqual(antes - 30 * 86400000 - 50);
            expect(corte).toBeLessThanOrEqual(despues - 30 * 86400000);

            expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledTimes(1);
            expect(prismaMock.auditLog.deleteMany).toHaveBeenCalledWith({
                where: { createdAt: { lt: res.desde } },
            });
        });

        it('usa la ventana por defecto cuando no se pasa días', async () => {
            const res = await service.purgarRetencion();
            expect(res.dias).toBe(365);
            expect(res.deshabilitado).toBe(false);
        });

        it('deshabilita la retención con dias <= 0 (no borra)', async () => {
            const res = await service.purgarRetencion(0);
            expect(res.deshabilitado).toBe(true);
            expect(res.eliminados).toBe(0);
            expect(res.desde).toBeNull();
            expect(prismaMock.auditLog.deleteMany).not.toHaveBeenCalled();
        });

        it('no lanza excepción si falla el job programado', async () => {
            prismaMock.auditLog.deleteMany.mockRejectedValue(new Error('db down'));
            await expect(service.retencionProgramada()).resolves.toBeUndefined();
        });
    });

    describe('logAction', () => {
        it('no lanza si la inserción falla (la auditoría nunca bloquea)', async () => {
            const espia = jest.spyOn(console, 'error').mockImplementation(() => undefined);
            prismaMock.auditLog.create.mockRejectedValue(new Error('boom'));
            await expect(
                service.logAction({ action: 'X', module: 'test' }),
            ).resolves.toBeUndefined();
            expect(espia).toHaveBeenCalled();
            espia.mockRestore();
        });
    });
});
