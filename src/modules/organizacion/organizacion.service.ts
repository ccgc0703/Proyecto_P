import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TipoNodoOrganizacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';

/** Nivel jerárquico del nodo (1 = cúspide del árbol) */
const NIVEL_POR_TIPO: Record<TipoNodoOrganizacion, number> = {
    CONSEJO_NACIONAL: 1,
    DIRECCION_EJECUTIVA: 2,
    REGION: 3,
    DISTRITO: 4,
    GRUPO: 5,
};

/** Cadena jerárquica permitida: tipo de nodo → tipo de padre requerido (null = sin padre) */
const PADRE_PERMITIDO: Record<TipoNodoOrganizacion, TipoNodoOrganizacion | null> = {
    CONSEJO_NACIONAL: null,
    DIRECCION_EJECUTIVA: 'CONSEJO_NACIONAL',
    REGION: 'DIRECCION_EJECUTIVA',
    DISTRITO: 'REGION',
    GRUPO: 'DISTRITO',
};

const PREFIJO_CODIGO: Record<TipoNodoOrganizacion, string> = {
    CONSEJO_NACIONAL: 'CON',
    DIRECCION_EJECUTIVA: 'DIR',
    REGION: 'REG',
    DISTRITO: 'DIS',
    GRUPO: 'GRP',
};

/** Cargos canónicos disponibles por tipo de nodo (catálogo → UI) */
export const CARGOS_POR_TIPO: Record<TipoNodoOrganizacion, readonly string[]> = {
    CONSEJO_NACIONAL: ['MIEMBRO_CONSEJO'],
    DIRECCION_EJECUTIVA: [
        'DIR_EJECUTIVO',
        'DIR_PROGRAMA_JOVENES',
        'DIR_ADULTOS_MOVIMIENTO',
        'DIR_DESARROLLO_INSTITUCIONAL',
        'COOPERADOR_NACIONAL',
    ],
    REGION: ['COMISIONADO_REGIONAL', 'ASISTENTE_PROGRAMA', 'COOPERADOR_REGIONAL'],
    DISTRITO: ['COMISIONADO_DISTRITAL', 'ASISTENTE_PROGRAMA', 'COOPERADOR_DISTRITAL'],
    GRUPO: ['JEFE_GRUPO', 'SUBJEFE_GRUPO', 'REPRESENTANTE_UNIDAD', 'ADULTO_COLABORADOR'],
};

@Injectable()
export class OrganizacionService {
    constructor(private readonly prisma: PrismaService) { }

    /** Árbol completo (nodos activos con sus unidades), anidado por jerarquía */
    async getArbol() {
        const nodos = await this.prisma.organizacionNodo.findMany({
            where: { deletedAt: null },
            include: {
                Unidades: {
                    where: { deletedAt: null },
                    select: { id: true, nombre: true, tipo: true, grupoId: true },
                },
            },
            orderBy: [{ nivel: 'asc' }, { codigo: 'asc' }],
        });

        type NodoConHijos = (typeof nodos)[number] & { hijos: NodoConHijos[] };

        const porId = new Map<string, NodoConHijos>(
            nodos.map((n) => [n.id, { ...n, hijos: [] as NodoConHijos[] }]),
        );
        const raices: NodoConHijos[] = [];
        for (const nodo of porId.values()) {
            const padre = nodo.padreId ? porId.get(nodo.padreId) : undefined;
            if (padre) padre.hijos.push(nodo);
            else raices.push(nodo);
        }
        return raices;
    }

    /** Lista plana de nodos activos (filtro opcional por tipo) */
    async listarNodos(tipo?: TipoNodoOrganizacion) {
        return this.prisma.organizacionNodo.findMany({
            where: { deletedAt: null, ...(tipo ? { tipo } : {}) },
            orderBy: [{ nivel: 'asc' }, { codigo: 'asc' }],
            include: {
                _count: { select: { hijos: true, Unidades: true } },
            },
        });
    }

    async create(dto: CreateNodoDto, actorId: string) {
        const tipoEsperado = PADRE_PERMITIDO[dto.tipo];

        if (tipoEsperado === null) {
            if (dto.padreId) {
                throw new BadRequestException('El Consejo Nacional no puede tener nodo padre');
            }
            const consejo = await this.prisma.organizacionNodo.findFirst({
                where: { tipo: 'CONSEJO_NACIONAL', deletedAt: null, activo: true },
            });
            if (consejo) {
                throw new ConflictException('Ya existe un Consejo Nacional activo');
            }
        } else {
            if (!dto.padreId) {
                throw new BadRequestException(`Este nodo requiere un padre de tipo ${tipoEsperado}`);
            }
            const padre = await this.prisma.organizacionNodo.findFirst({
                where: { id: dto.padreId, deletedAt: null },
            });
            if (!padre) {
                throw new NotFoundException('Nodo padre no encontrado');
            }
            if (padre.tipo !== tipoEsperado) {
                throw new BadRequestException(
                    `El padre debe ser de tipo ${tipoEsperado} (recibido: ${padre.tipo})`,
                );
            }
        }

        const codigo = await this.siguienteCodigo(dto.tipo);
        return this.prisma.organizacionNodo.create({
            data: {
                codigo,
                nombre: dto.nombre,
                tipo: dto.tipo,
                nivel: NIVEL_POR_TIPO[dto.tipo],
                padreId: dto.padreId ?? null,
                createdBy: actorId,
            },
        });
    }

    async update(id: string, dto: UpdateNodoDto, actorId: string) {
        await this.getNodoOrThrow(id);
        const data: { nombre?: string; activo?: boolean; updatedBy: string } = { updatedBy: actorId };
        if (dto.nombre !== undefined) data.nombre = dto.nombre;
        if (dto.activo !== undefined) data.activo = dto.activo;
        return this.prisma.organizacionNodo.update({ where: { id }, data });
    }

    async remove(id: string, actorId: string) {
        await this.getNodoOrThrow(id);
        const hijos = await this.prisma.organizacionNodo.count({
            where: { padreId: id, deletedAt: null },
        });
        if (hijos > 0) {
            throw new BadRequestException('No se puede eliminar: el nodo tiene nodos hijos activos');
        }
        const unidades = await this.prisma.unidad.count({
            where: { grupoId: id, deletedAt: null },
        });
        if (unidades > 0) {
            throw new BadRequestException('No se puede eliminar: el nodo tiene unidades asignadas');
        }
        return this.prisma.organizacionNodo.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: actorId },
        });
    }

    /** Asigna (o reasigna) una unidad a un nodo GRUPO */
    async asignarUnidad(unidadId: string, grupoId: string, actorId: string) {
        const grupo = await this.prisma.organizacionNodo.findFirst({
            where: { id: grupoId, deletedAt: null, tipo: 'GRUPO' },
        });
        if (!grupo) {
            throw new NotFoundException('Grupo no encontrado');
        }
        const unidad = await this.prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: null },
        });
        if (!unidad) {
            throw new NotFoundException('Unidad no encontrada');
        }
        // P2002 (grupoId+tipo duplicado) lo convierte el filtro global en 409
        return this.prisma.unidad.update({
            where: { id: unidadId },
            data: { grupoId, updatedBy: actorId },
        });
    }

    // ── Cargos por nodo ─────────────────────────────────────────────────────

    /** Catálogo de cargos permitidos para un tipo de nodo */
    cargosPermitidos(tipo: TipoNodoOrganizacion): readonly string[] {
        return CARGOS_POR_TIPO[tipo] ?? [];
    }

    /** Cargos vigentes (y cerrados) de un nodo, con datos del usuario */
    async getCargos(nodoId: string) {
        await this.getNodoOrThrow(nodoId);
        return this.prisma.cargoAsignacion.findMany({
            where: { nodoId, deletedAt: null },
            include: {
                Usuario: {
                    select: { id: true, nombre: true, apellido: true, email: true },
                },
            },
            orderBy: [{ activo: 'desc' }, { cargo: 'asc' }],
        });
    }

    async crearCargo(nodoId: string, dto: CreateCargoDto, actorId: string) {
        const nodo = await this.getNodoOrThrow(nodoId);

        const permitidos = CARGOS_POR_TIPO[nodo.tipo] ?? [];
        if (!permitidos.includes(dto.cargo)) {
            throw new BadRequestException(
                `El cargo "${dto.cargo}" no corresponde a un nodo tipo ${nodo.tipo}`,
            );
        }

        const usuario = await this.prisma.usuario.findFirst({
            where: { id: dto.usuarioId, deletedAt: null },
        });
        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }
        if (!usuario.activo) {
            throw new BadRequestException('El usuario está inactivo');
        }

        const ocupado = await this.prisma.cargoAsignacion.findFirst({
            where: {
                nodoId,
                cargo: dto.cargo,
                activo: true,
                hasta: null,
                deletedAt: null,
            },
        });
        if (ocupado) {
            throw new ConflictException(
                `El cargo ${dto.cargo} ya está ocupado en ${nodo.codigo}`,
            );
        }

        return this.prisma.cargoAsignacion.create({
            data: {
                nodoId,
                usuarioId: dto.usuarioId,
                cargo: dto.cargo,
                ...(dto.desde ? { desde: new Date(dto.desde) } : {}),
                createdBy: actorId,
            },
            include: {
                Usuario: {
                    select: { id: true, nombre: true, apellido: true, email: true },
                },
            },
        });
    }

    /** Cierra (hasta/activo) una asignación de cargo */
    async actualizarCargo(id: string, dto: UpdateCargoDto, actorId: string) {
        await this.getCargoOrThrow(id);
        const data: { hasta?: Date; activo?: boolean; updatedBy: string } = {
            updatedBy: actorId,
        };
        if (dto.hasta !== undefined) data.hasta = new Date(dto.hasta);
        if (dto.activo !== undefined) data.activo = dto.activo;
        return this.prisma.cargoAsignacion.update({
            where: { id },
            data,
            include: {
                Usuario: {
                    select: { id: true, nombre: true, apellido: true, email: true },
                },
            },
        });
    }

    async eliminarCargo(id: string, actorId: string) {
        await this.getCargoOrThrow(id);
        return this.prisma.cargoAsignacion.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: actorId },
        });
    }

    // ── Código autogenerado: PREFIJO-NN (correlativo por tipo, evita colisiones) ──
    private async siguienteCodigo(tipo: TipoNodoOrganizacion): Promise<string> {
        const prefijo = PREFIJO_CODIGO[tipo];
        // Una sola consulta: todos los códigos existentes de ese prefijo (el más
        // alto en memoria) en lugar de una consulta por número candidato (N+1).
        const existentes = await this.prisma.organizacionNodo.findMany({
            where: { codigo: { startsWith: `${prefijo}-` }, deletedAt: undefined },
            select: { codigo: true },
        });
        let maximo = 0;
        for (const { codigo } of existentes) {
            const n = Number.parseInt(codigo.slice(prefijo.length + 1), 10);
            if (Number.isInteger(n) && n > maximo) maximo = n;
        }

        for (let numero = maximo + 1; numero <= 999; numero++) {
            const codigo = `${prefijo}-${String(numero).padStart(2, '0')}`;
            const existe = await this.prisma.organizacionNodo.findFirst({ where: { codigo, deletedAt: undefined } });
            if (!existe) return codigo;
        }
        throw new ConflictException('No se pudo generar un código disponible para este tipo de nodo');
    }

    private async getNodoOrThrow(id: string) {
        const nodo = await this.prisma.organizacionNodo.findFirst({
            where: { id, deletedAt: null },
        });
        if (!nodo) {
            throw new NotFoundException('Nodo de organización no encontrado');
        }
        return nodo;
    }

    private async getCargoOrThrow(id: string) {
        const cargo = await this.prisma.cargoAsignacion.findFirst({
            where: { id, deletedAt: null },
        });
        if (!cargo) {
            throw new NotFoundException('Asignación de cargo no encontrada');
        }
        return cargo;
    }
}
