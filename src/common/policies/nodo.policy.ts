import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

/**
 * NodoPolicy — Ámbito jerárquico (árbol organizacional)
 *
 * Resuelve el subárbol de un nodo (CONSEJO → DIRECCIÓN → REGIÓN → DISTRITO → GRUPO)
 * y las unidades (Unidad.grupoId → nodo GRUPO) caen dentro de ese ámbito.
 *
 * Fail-closed: un nodo inexistente/borrado produce un ámbito vacío.
 */
@Injectable()
export class NodoPolicy {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * IDs del subárbol del nodo (incluye el propio nodo).
     * 1 sola query a la tabla de nodos (pequeña) + BFS en memoria.
     */
    async subtreeIds(nodoId?: string | null): Promise<Set<string>> {
        const vacio = new Set<string>();
        if (!nodoId) return vacio;

        const nodos = await this.prisma.organizacionNodo.findMany({
            where: { deletedAt: null },
            select: { id: true, padreId: true },
        });

        if (!nodos.some((n) => n.id === nodoId)) return vacio; // fail-closed

        const hijos = new Map<string, string[]>();
        for (const n of nodos) {
            if (!n.padreId) continue;
            const lista = hijos.get(n.padreId);
            if (lista) lista.push(n.id);
            else hijos.set(n.padreId, [n.id]);
        }

        const resultado = new Set<string>();
        const cola: string[] = [nodoId];
        while (cola.length > 0) {
            const actual = cola.pop() as string;
            if (resultado.has(actual)) continue;
            resultado.add(actual);
            const hijosDeActual = hijos.get(actual);
            if (hijosDeActual) cola.push(...hijosDeActual);
        }
        return resultado;
    }

    /** Unidades activas caen dentro del ámbito del nodo (vía Unidad.grupoId). */
    async unidadesEnAlcance(nodoId?: string | null): Promise<string[]> {
        const subtree = await this.subtreeIds(nodoId);
        if (subtree.size === 0) return [];

        const unidades = await this.prisma.unidad.findMany({
            where: { grupoId: { in: Array.from(subtree) }, deletedAt: null },
            select: { id: true },
        });
        return unidades.map((u) => u.id);
    }

    /**
     * ¿La unidad pertenece al ámbito del nodo?
     * - Unidad inexistente → true (deja pasar; el handler responderá 404).
     * - Unidad sin nodo GRUPO → false (fuera de alcance jerárquico).
     */
    async unidadEnAlcance(nodoId: string | null | undefined, unidadId: string): Promise<boolean> {
        const [subtree, unidad] = await Promise.all([
            this.subtreeIds(nodoId),
            this.prisma.unidad.findFirst({
                where: { id: unidadId, deletedAt: null },
                select: { grupoId: true },
            }),
        ]);

        if (!unidad) return true;
        if (subtree.size === 0) return false;
        if (!unidad.grupoId) return false;
        return subtree.has(unidad.grupoId);
    }
}
