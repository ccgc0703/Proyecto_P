import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
    let controller: HealthController;
    let prisma: any;
    let res: any;

    let mockPrisma: any;

    beforeEach(async () => {
        mockPrisma = {
            $queryRaw: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [{ provide: PrismaService, useValue: mockPrisma }],
        }).compile();

        controller = module.get<HealthController>(HealthController);
        prisma = module.get(PrismaService);
        res = { status: jest.fn().mockReturnThis() };
        jest.clearAllMocks();
    });

    describe('check', () => {
        it('devuelve 200 con status ok cuando la base de datos responde', async () => {
            prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

            const result = await controller.check(res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(result.status).toBe('ok');
            expect(result.checks).toEqual({ database: 'up' });
        });

        it('incluye uptime y timestamp validos en la respuesta', async () => {
            prisma.$queryRaw.mockResolvedValue([]);

            const result = await controller.check(res);

            expect(typeof result.uptime).toBe('number');
            expect(result.uptime).toBeGreaterThanOrEqual(0);
            expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
        });

        it('devuelve 503 con status degraded cuando la base de datos no responde', async () => {
            prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

            const result = await controller.check(res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(result.status).toBe('degraded');
            expect(result.checks).toEqual({ database: 'down' });
        });

        it('ejecuta la consulta de salud contra la base de datos', async () => {
            prisma.$queryRaw.mockResolvedValue([]);

            await controller.check(res);

            expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
        });

        it('no lanza excepcion cuando la consulta falla, solo degrada el estado', async () => {
            prisma.$queryRaw.mockRejectedValue(new Error('db caida'));

            await expect(controller.check(res)).resolves.toEqual(
                expect.objectContaining({ status: 'degraded' }),
            );
        });
    });
});
