import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';
import {
    filtroBusqueda,
    hayPaginacion,
    OpcionesLista,
    rangoLista,
} from '../../common/paginacion';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { QueryDocumentosDto } from './dto/query-documentos.dto';
import {
    ArchivoSubido,
    extensionDe,
    mimeCanonico,
    rutaAbsolutaArchivo,
} from './archivos';

/** Usuario enriquecido por JwtStrategy (req.user). */
export interface Actor {
    id: string;
    roles: string[];
    unidadId?: string | null;
    nodoId?: string | null;
}

const DOCUMENTO_INCLUDE = {
    Unidad: { select: { id: true, nombre: true, tipo: true } },
};

@Injectable()
export class NormativaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
        private readonly unitPolicy: UnitPolicy,
    ) { }

    private registrar(
        userId: string | undefined,
        action: string,
        targetId: string,
        description: string,
    ): void {
        void this.audit.logAction({
            actorId: userId,
            action,
            module: 'normativa',
            targetId,
            description,
        });
    }

    // ── Filtros ────────────────────────────────────────────────────────

    /**
     * Scope por unidad: los documentos nacionales (`unidadId: null`) siempre
     * son visibles; el resto se limita al alcance del actor (null = global).
     */
    private async construirWhere(
        query: QueryDocumentosDto,
        user: Actor,
        q?: string,
    ): Promise<any> {
        const and: any[] = [];

        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null) {
            and.push({ OR: [{ unidadId: { in: alcance } }, { unidadId: null }] });
        }

        const busqueda = filtroBusqueda(q, ['titulo', 'descripcion']);
        if (busqueda) and.push(busqueda);

        const where: any = { deletedAt: null };
        if (and.length) where.AND = and;
        if (query.categoria) where.categoria = query.categoria;
        if (query.unidadId) where.unidadId = query.unidadId;
        if (query.vigente === 'true') where.vigente = true;
        if (query.vigente === 'false') where.vigente = false;
        return where;
    }

    // ── CRUD ───────────────────────────────────────────────────────────

    async listar(query: QueryDocumentosDto, user: Actor, opts: OpcionesLista = {}) {
        const where = await this.construirWhere(query, user, opts.q);
        return this.prisma.documento.findMany({
            where,
            include: DOCUMENTO_INCLUDE,
            orderBy: [{ createdAt: 'desc' }],
            ...(hayPaginacion(opts) ? rangoLista(opts) : {}),
        });
    }

    async contar(query: QueryDocumentosDto, user: Actor, q?: string): Promise<number> {
        return this.prisma.documento.count({
            where: await this.construirWhere(query, user, q),
        });
    }

    async obtener(id: string, user?: Actor) {
        const documento = await this.prisma.documento.findFirst({
            where: { id, deletedAt: null },
            include: DOCUMENTO_INCLUDE,
        });
        if (!documento) throw new NotFoundException('Documento no encontrado');
        await this.asegurarVisibilidad(documento, user);
        return documento;
    }

    /**
     * Fail-closed para lecturas puntuales: un documento de otra unidad no debe
     * poder abrirse/descargarse aunque se conozca su id. Los nacionales
     * (`unidadId: null`) son visibles para todos.
     */
    private async asegurarVisibilidad(
        documento: { unidadId: string | null },
        user?: Actor,
    ): Promise<void> {
        if (!user || !documento.unidadId) return;

        const alcance = await this.unitPolicy.unidadesAlcance(user);
        if (alcance !== null && !alcance.includes(documento.unidadId)) {
            throw new NotFoundException('Documento no encontrado');
        }
    }

    async crear(dto: CreateDocumentoDto, archivo: ArchivoSubido, user: Actor) {
        if (dto.unidadId) {
            await this.unitPolicy.assertCanManageUnit(user, dto.unidadId);
        }

        const documento = await this.prisma.documento.create({
            data: {
                titulo: dto.titulo.trim(),
                categoria: dto.categoria,
                descripcion: dto.descripcion?.trim() || null,
                archivoUrl: `normativa/${archivo.filename}`,
                mimeType: mimeCanonico(extensionDe(archivo.filename)),
                tamano: archivo.size,
                nombreOriginal: archivo.originalname,
                unidadId: dto.unidadId ?? null,
                createdBy: user?.id,
            },
            include: DOCUMENTO_INCLUDE,
        });

        this.registrar(
            user?.id,
            'DOCUMENTO_CREATED',
            documento.id,
            `Documento "${documento.titulo}" creado`,
        );
        return documento;
    }

    async actualizar(id: string, dto: UpdateDocumentoDto, user: Actor) {
        const existente = await this.obtener(id, user);

        if (dto.unidadId && dto.unidadId !== existente.unidadId) {
            await this.unitPolicy.assertCanManageUnit(user, dto.unidadId);
        }

        const data: any = { ...dto, updatedBy: user?.id };
        if (dto.titulo !== undefined) data.titulo = dto.titulo.trim();
        if (dto.descripcion !== undefined) data.descripcion = dto.descripcion.trim() || null;

        const documento = await this.prisma.documento.update({
            where: { id },
            data,
            include: DOCUMENTO_INCLUDE,
        });

        this.registrar(
            user?.id,
            'DOCUMENTO_UPDATED',
            documento.id,
            `Documento "${documento.titulo}" actualizado`,
        );
        return documento;
    }

    /** Soft-delete: el archivo físico se conserva para una eventual restauración. */
    async eliminar(id: string, user: Actor): Promise<void> {
        const documento = await this.obtener(id, user);
        await this.prisma.documento.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: user?.id },
        });

        this.registrar(
            user?.id,
            'DOCUMENTO_DELETED',
            documento.id,
            `Documento "${documento.titulo}" eliminado`,
        );
    }

    // ── Descarga ───────────────────────────────────────────────────────

    async obtenerArchivo(id: string, user?: Actor): Promise<{
        ruta: string;
        nombreOriginal: string;
        mimeType: string;
    }> {
        const documento = await this.obtener(id, user);
        const ruta = rutaAbsolutaArchivo(documento.archivoUrl);

        if (!fs.existsSync(ruta)) {
            throw new NotFoundException('El archivo del documento no esta disponible');
        }

        return {
            ruta,
            nombreOriginal: documento.nombreOriginal ?? 'documento',
            mimeType: documento.mimeType ?? 'application/octet-stream',
        };
    }
}
