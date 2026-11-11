import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NodoPolicy } from './nodo.policy';

describe('NodoPolicy', () => {
    let policy: NodoPolicy;
    let prisma: any;

    const mockPrisma = {
        organizacionNodo: { findMany: jest.fn(), findFirst: jest.fn() },
        unidad: { findMany: jest.fn(), findFirst: jest.fn() },
        usuario: { findFirst: jest.fn(), count: jest.fn() },
    };

    // Jerarquía: CON → DIR → REG → DIS → (GRP-01, GRP-02)
    const nodos = [
        { id: 'con', padreId: null },
        { id: 'dir', padreId: 'con' },
        { id: 'reg', padreId: 'dir' },
        { id: 'dis', padreId: 'reg' },
        { id: 'grp1', padreId: 'dis' },
        { id: 'grp2', padreId: 'dis' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        prisma = mockPrisma;
        policy = new NodoPolicy(prisma);
        mockPrisma.organizacionNodo.findMany.mockResolvedValue(nodos);
        mockPrisma.unidad.findMany.mockResolvedValue([]);
        mockPrisma.unidad.findFirst.mockResolvedValue(null);
    });

    describe('subtreeIds', () => {
        it('incluye el propio nodo y todos sus descendientes', async () => {
            expect(Array.from(await policy.subtreeIds('dis')).sort()).toEqual([
                'dis',
                'grp1',
                'grp2',
            ]);
            expect(Array.from(await policy.subtreeIds('reg')).sort()).toEqual([
                'dis',
                'grp1',
                'grp2',
                'reg',
            ]);
        });

        it('sin descendientes devuelve solo el nodo', async () => {
            expect(Array.from(await policy.subtreeIds('grp1'))).toEqual(['grp1']);
        });

        it('la raíz acumula todo el árbol', async () => {
            const subtree = await policy.subtreeIds('con');
            expect(subtree.size).toBe(nodos.length);
        });

        it('solo nodos activos (deletedAt null)', async () => {
            await policy.subtreeIds('reg');
            expect(mockPrisma.organizacionNodo.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                select: { id: true, padreId: true },
            });
        });

        it('fail-closed: nodo inexistente o borrado produce ámbito vacío', async () => {
            expect((await policy.subtreeIds('no-existe')).size).toBe(0);
        });

        it('sin nodoId no consulta la DB', async () => {
            expect((await policy.subtreeIds(null)).size).toBe(0);
            expect((await policy.subtreeIds(undefined)).size).toBe(0);
            expect(mockPrisma.organizacionNodo.findMany).not.toHaveBeenCalled();
        });
    });

    describe('unidadesEnAlcance', () => {
        it('filtra unidades por los nodos GRUPO del subárbol', async () => {
            mockPrisma.unidad.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

            const result = await policy.unidadesEnAlcance('reg');

            expect(result).toEqual(['u1', 'u2']);
            const call = mockPrisma.unidad.findMany.mock.calls[0][0];
            expect(call.where.grupoId.in.sort()).toEqual(['dis', 'grp1', 'grp2', 'reg']);
            expect(call.where.deletedAt).toBeNull();
            expect(call.select).toEqual({ id: true });
        });

        it('ámbito vacío devuelve lista vacía sin consultar unidades', async () => {
            expect(await policy.unidadesEnAlcance('no-existe')).toEqual([]);
            expect(mockPrisma.unidad.findMany).not.toHaveBeenCalled();
        });

        it('sin nodoId devuelve lista vacía', async () => {
            expect(await policy.unidadesEnAlcance(null)).toEqual([]);
        });
    });

    describe('unidadEnAlcance', () => {
        it('true si la unidad cuelga de un nodo GRUPO del subárbol', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ grupoId: 'grp1' });

            expect(await policy.unidadEnAlcance('reg', 'u-ok')).toBe(true);
        });

        it('false si la unidad pertenece a otro subárbol', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ grupoId: 'otro-grupo' });

            expect(await policy.unidadEnAlcance('reg', 'u-ajena')).toBe(false);
        });

        it('false si la unidad no tiene nodo GRUPO asignado', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ grupoId: null });

            expect(await policy.unidadEnAlcance('reg', 'u-sin-grupo')).toBe(false);
        });

        it('true si la unidad no existe (deja pasar y responde 404)', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue(null);

            expect(await policy.unidadEnAlcance('reg', 'u-inexistente')).toBe(true);
        });

        it('false si no hay nodoId (fail-closed)', async () => {
            mockPrisma.unidad.findFirst.mockResolvedValue({ grupoId: 'grp1' });

            expect(await policy.unidadEnAlcance(null, 'u1')).toBe(false);
        });
    });

    // ── Multi-grupo (Fase 7c) ──────────────────────────────────────────

    describe('filtroUsuarios', () => {
        it('sin nodoId devuelve null (visión global)', async () => {
            expect(await policy.filtroUsuarios(null)).toBeNull();
            expect(await policy.filtroUsuarios(undefined)).toBeNull();
            expect(mockPrisma.unidad.findMany).not.toHaveBeenCalled();
        });

        it('filtra por unidades del subárbol O por nodoId dentro del subárbol', async () => {
            mockPrisma.unidad.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

            const filtro = await policy.filtroUsuarios('reg');

            expect(filtro).toEqual({
                OR: [
                    { unidadId: { in: ['u1', 'u2'] } },
                    { nodoId: { in: expect.arrayContaining(['dis', 'grp1', 'grp2', 'reg']) } },
                ],
            });
            const nodos = (filtro as any).OR[1].nodoId.in;
            expect(nodos).toHaveLength(4);
        });

        it('fail-closed: subárbol vacío devuelve un filtro que no matchea a nadie', async () => {
            const filtro = await policy.filtroUsuarios('no-existe');
            expect(filtro).toEqual({ id: { in: [] } });
            expect(mockPrisma.unidad.findMany).not.toHaveBeenCalled();
        });
    });

    describe('usuarioEnAlcance', () => {
        it('true si el usuario tiene una unidad del subárbol', async () => {
            mockPrisma.unidad.findMany.mockResolvedValue([{ id: 'u-grupo-a' }]);
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user-1' });
            mockPrisma.usuario.count.mockResolvedValue(1);

            expect(await policy.usuarioEnAlcance('grp1', 'user-1')).toBe(true);
        });

        it('false si el usuario pertenece a otro grupo (unidad ajena)', async () => {
            mockPrisma.unidad.findMany.mockResolvedValue([{ id: 'u-grupo-a' }]);
            mockPrisma.usuario.findFirst.mockResolvedValue({ id: 'user-2' });
            mockPrisma.usuario.count.mockResolvedValue(0);

            expect(await policy.usuarioEnAlcance('grp1', 'user-2')).toBe(false);
        });

        it('true si el usuario no existe (deja pasar y responde 404)', async () => {
            mockPrisma.usuario.findFirst.mockResolvedValue(null);

            expect(await policy.usuarioEnAlcance('grp1', 'user-x')).toBe(true);
            expect(mockPrisma.usuario.count).not.toHaveBeenCalled();
        });

        it('true si el actor no tiene nodoId (visión global)', async () => {
            expect(await policy.usuarioEnAlcance(null, 'user-1')).toBe(true);
            expect(mockPrisma.usuario.findFirst).not.toHaveBeenCalled();
        });
    });

    describe('assertGrupo', () => {
        it('acepta un nodo GRUPO vivo sin ámbito', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValue({ tipo: 'GRUPO' });

            await expect(policy.assertGrupo('grp1')).resolves.toBeUndefined();
        });

        it('acepta un nodo GRUPO dentro del subárbol del actor', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValue({ tipo: 'GRUPO' });

            await expect(policy.assertGrupo('grp2', 'dis')).resolves.toBeUndefined();
        });

        it('lanza NotFoundException si el nodo no existe', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValue(null);

            await expect(policy.assertGrupo('no-existe')).rejects.toThrow(NotFoundException);
        });

        it('lanza BadRequestException si el nodo no es tipo GRUPO', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValue({ tipo: 'REGION' });

            await expect(policy.assertGrupo('reg')).rejects.toThrow(BadRequestException);
        });

        it('lanza ForbiddenException si el grupo está fuera del ámbito del actor', async () => {
            mockPrisma.organizacionNodo.findFirst.mockResolvedValue({ tipo: 'GRUPO' });

            await expect(policy.assertGrupo('grp2', 'grp1')).rejects.toThrow(ForbiddenException);
        });
    });
});
