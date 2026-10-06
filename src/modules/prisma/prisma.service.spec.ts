import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

describe('PrismaService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('extiende PrismaClient e implementa los ciclos de vida de Nest', () => {
        expect(PrismaService.prototype).toBeInstanceOf(PrismaClient);
        expect(typeof PrismaService.prototype.onModuleInit).toBe('function');
        expect(typeof PrismaService.prototype.onModuleDestroy).toBe('function');
    });

    it('onModuleInit conecta el cliente exactamente una vez', async () => {
        const service = new PrismaService();
        const $connect = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(service, '$connect', { value: $connect });

        await service.onModuleInit();

        expect($connect).toHaveBeenCalledTimes(1);
    });

    it('onModuleInit propaga el error si la conexión falla', async () => {
        const service = new PrismaService();
        const $connect = jest.fn().mockRejectedValue(new Error('database caída'));
        Object.defineProperty(service, '$connect', { value: $connect });

        await expect(service.onModuleInit()).rejects.toThrow('database caída');
        expect($connect).toHaveBeenCalledTimes(1);
    });

    it('onModuleDestroy desconecta el cliente', async () => {
        const service = new PrismaService();
        const $disconnect = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(service, '$disconnect', { value: $disconnect });

        await service.onModuleDestroy();

        expect($disconnect).toHaveBeenCalledTimes(1);
    });
});
