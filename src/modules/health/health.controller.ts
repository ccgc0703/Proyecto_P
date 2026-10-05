import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Health check público (sin JWT) para monitoreo/uptime.
 *
 * - 200: la API y la base de datos responden.
 * - 503: la API responde pero la DB no (degraded).
 */
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async check(@Res({ passthrough: true }) res: Response) {
        let database = 'up';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch {
            database = 'down';
        }

        const ok = database === 'up';
        res.status(ok ? 200 : 503);

        return {
            status: ok ? 'ok' : 'degraded',
            uptime: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
            checks: { database },
        };
    }
}
