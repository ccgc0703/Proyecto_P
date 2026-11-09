import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificacionesService, TIPOS_NOTIFICACION } from './notificaciones.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificacionesService', () => {
    let service: NotificacionesService;

    const mockPrisma = {
        usuario: { findMany: jest.fn() },
        notificacion: {
            createMany: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
            count: jest.fn(),
        },
        fichaMedica: { findMany: jest.fn() },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificacionesService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<NotificacionesService>(NotificacionesService);
        jest.clearAllMocks();
    });

    // ── publicar ────────────────────────────────────────────────────────────

    describe('publicar', () => {
        it('no hace nada sin destinatarios', async () => {
            await service.publicar([], TIPOS_NOTIFICACION.CUENTA_CREADA, 'T', 'C');

            expect(mockPrisma.usuario.findMany).not.toHaveBeenCalled();
            expect(mockPrisma.notificacion.createMany).not.toHaveBeenCalled();
        });

        it('deduplica ids y solo notifica a cuentas activas existentes', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([{ id: 'u1' }]);
            mockPrisma.notificacion.createMany.mockResolvedValue({ count: 1 });

            await service.publicar(['u1', 'u1', '', 'fantasma'], 'TIPO', 'T', 'C');

            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ id: { in: ['u1', 'fantasma'] } }),
                }),
            );
            expect(mockPrisma.notificacion.createMany).toHaveBeenCalledWith({
                data: [expect.objectContaining({ usuarioId: 'u1', tipo: 'TIPO', link: null })],
            });
        });

        it('registra el link cuando se provee', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([{ id: 'u1' }]);
            mockPrisma.notificacion.createMany.mockResolvedValue({ count: 1 });

            await service.publicar(
                ['u1'],
                TIPOS_NOTIFICACION.CARGO_ASIGNADO,
                'T',
                'C',
                '/app/estructura',
            );

            expect(mockPrisma.notificacion.createMany).toHaveBeenCalledWith({
                data: [expect.objectContaining({ link: '/app/estructura' })],
            });
        });

        it('nunca lanza: tolera fallos de consulta e inserción', async () => {
            mockPrisma.usuario.findMany.mockRejectedValue(new Error('db caida'));
            await expect(
                service.publicar(['u1'], 'T', 't', 'c'),
            ).resolves.toBeUndefined();

            mockPrisma.usuario.findMany.mockResolvedValue([{ id: 'u1' }]);
            mockPrisma.notificacion.createMany.mockRejectedValue(new Error('fk rota'));
            await expect(
                service.publicar(['u1'], 'T', 't', 'c'),
            ).resolves.toBeUndefined();
        });
    });

    // ── responsablesUnidad ──────────────────────────────────────────────────

    describe('responsablesUnidad', () => {
        it('combina adultos de la unidad con SYSTEM_ADMIN sin duplicados', async () => {
            mockPrisma.usuario.findMany
                .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])
                .mockResolvedValueOnce([{ id: 'b' }, { id: 'c' }]);

            const ids = await service.responsablesUnidad('u1');

            expect(ids).toEqual(['a', 'b', 'c']);
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledTimes(2);
            expect(mockPrisma.usuario.findMany.mock.calls[0][0].where.unidadId).toBe('u1');
        });

        it('sin unidadId solo consulta los administradores', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([{ id: 'admin' }]);

            const ids = await service.responsablesUnidad();

            expect(ids).toEqual(['admin']);
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledTimes(1);
        });
    });

    // ── listar ──────────────────────────────────────────────────────────────

    describe('listar', () => {
        it('siempre acota al usuario del JWT y devuelve el badge de no leídas', async () => {
            mockPrisma.notificacion.findMany.mockResolvedValue([{ id: 'n1' }]);
            mockPrisma.notificacion.count.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

            const res = await service.listar('me');

            expect(res).toEqual({ items: [{ id: 'n1' }], total: 5, noLeidas: 3 });
            expect(mockPrisma.notificacion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { usuarioId: 'me' } }),
            );
            expect(mockPrisma.notificacion.count.mock.calls[0][0].where).toEqual({
                usuarioId: 'me',
            });
            expect(mockPrisma.notificacion.count.mock.calls[1][0].where).toEqual({
                usuarioId: 'me',
                leidaEn: null,
            });
        });

        it('soloNoLeidas agrega el filtro y pagina con skip/take', async () => {
            mockPrisma.notificacion.findMany.mockResolvedValue([]);
            mockPrisma.notificacion.count.mockResolvedValue(0);

            await service.listar('me', { soloNoLeidas: true, page: 2, limit: 10 });

            expect(mockPrisma.notificacion.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { usuarioId: 'me', leidaEn: null },
                    skip: 10,
                    take: 10,
                }),
            );
        });
    });

    // ── marcarLeida / marcarTodas ───────────────────────────────────────────

    describe('marcarLeida', () => {
        it('lanza 404 si la notificación no existe o es de otro usuario', async () => {
            mockPrisma.notificacion.findFirst.mockResolvedValue(null);

            await expect(service.marcarLeida('me', 'n1')).rejects.toThrow(NotFoundException);
            expect(mockPrisma.notificacion.findFirst).toHaveBeenCalledWith({
                where: { id: 'n1', usuarioId: 'me' },
            });
        });

        it('es idempotente: una notificación ya leída no se vuelve a tocar', async () => {
            const leida = { id: 'n1', usuarioId: 'me', leidaEn: new Date() };
            mockPrisma.notificacion.findFirst.mockResolvedValue(leida);

            const res = await service.marcarLeida('me', 'n1');

            expect(res).toBe(leida);
            expect(mockPrisma.notificacion.update).not.toHaveBeenCalled();
        });

        it('marca como leída la propia pendiente', async () => {
            mockPrisma.notificacion.findFirst.mockResolvedValue({
                id: 'n1',
                usuarioId: 'me',
                leidaEn: null,
            });
            mockPrisma.notificacion.update.mockResolvedValue({ id: 'n1' });

            await service.marcarLeida('me', 'n1');

            expect(mockPrisma.notificacion.update).toHaveBeenCalledWith({
                where: { id: 'n1' },
                data: { leidaEn: expect.any(Date) },
            });
        });
    });

    it('marcarTodas acota al usuario y devuelve el conteo', async () => {
        mockPrisma.notificacion.updateMany.mockResolvedValue({ count: 4 });

        const count = await service.marcarTodas('me');

        expect(count).toBe(4);
        expect(mockPrisma.notificacion.updateMany).toHaveBeenCalledWith({
            where: { usuarioId: 'me', leidaEn: null },
            data: { leidaEn: expect.any(Date) },
        });
    });

    // ── cron: seguros por vencer ────────────────────────────────────────────

    describe('avisarSegurosPorVencer (cron)', () => {
        it('no notifica cuando no hay fichas con seguro por vencer', async () => {
            mockPrisma.fichaMedica.findMany.mockResolvedValue([]);
            const publicar = jest.spyOn(service, 'publicar').mockResolvedValue(undefined);

            await service.avisarSegurosPorVencer();

            expect(publicar).not.toHaveBeenCalled();
        });

        it('avisa a los responsables de las unidades afectadas excluyendo a los ya avisados', async () => {
            mockPrisma.fichaMedica.findMany.mockResolvedValue([
                { Miembro: { unidadId: 'u1' } },
                { Miembro: { unidadId: 'u2' } },
            ]);
            jest.spyOn(service, 'responsablesUnidad').mockImplementation((id) =>
                Promise.resolve(id === 'u1' ? ['a', 'b'] : ['b', 'c']),
            );
            mockPrisma.notificacion.findMany.mockResolvedValue([{ usuarioId: 'b' }]);
            const publicar = jest.spyOn(service, 'publicar').mockResolvedValue(undefined);

            await service.avisarSegurosPorVencer();

            expect(publicar).toHaveBeenCalledTimes(1);
            expect(publicar).toHaveBeenCalledWith(
                ['a', 'c'],
                TIPOS_NOTIFICACION.SEGURO_POR_VENCER,
                expect.any(String),
                expect.any(String),
                '/app/miembros',
            );
        });

        it('no repite el aviso a quien ya lo recibió en los últimos 30 días', async () => {
            mockPrisma.fichaMedica.findMany.mockResolvedValue([
                { Miembro: { unidadId: 'u1' } },
            ]);
            jest.spyOn(service, 'responsablesUnidad').mockResolvedValue(['a', 'b']);
            mockPrisma.notificacion.findMany.mockResolvedValue([
                { usuarioId: 'a' },
                { usuarioId: 'b' },
            ]);
            const publicar = jest.spyOn(service, 'publicar').mockResolvedValue(undefined);

            await service.avisarSegurosPorVencer();

            expect(publicar).not.toHaveBeenCalled();
        });

        it('no lanza si la consulta del job falla', async () => {
            mockPrisma.fichaMedica.findMany.mockRejectedValue(new Error('db caida'));

            await expect(service.avisarSegurosPorVencer()).resolves.toBeUndefined();
        });
    });
});
