import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RamaUnidad } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { esRama } from '../../common/ramas';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { CreateAdelantoDto } from './dto/create-adelanto.dto';
import { UpdateAdelantoDto } from './dto/update-adelanto.dto';
import { QueryAdelantosDto, QueryEtapasDto, QueryIndicadoresDto } from './dto/query-catalogo.dto';

const AREA_INCLUDE = {
    _count: { select: { Indicadores: { where: { deletedAt: null } } } },
};

const INDICADOR_INCLUDE = {
    Etapa: { select: { id: true, numero: true, nombre: true } },
    Area: { select: { id: true, nombre: true, tipo: true, orden: true } },
};

@Injectable()
export class CatalogoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
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
            module: 'catalogo',
            targetId,
            description,
        });
    }

    private async assertEtapa(id: string) {
        const etapa = await this.prisma.etapa.findFirst({ where: { id, deletedAt: null } });
        if (!etapa) throw new NotFoundException(`La etapa con ID ${id} no existe`);
        return etapa;
    }

    private async assertArea(id: string) {
        const area = await this.prisma.areaCrecimiento.findFirst({ where: { id, deletedAt: null } });
        if (!area) throw new NotFoundException(`El area con ID ${id} no existe`);
        return area;
    }

    // Resuelve el filtro de catálogo: unidadId (legacy) -> rama canonica de la unidad.
    // Si la unidad no existe o no tiene rama valida, `vacio` obliga a responder lista vacia
    // (mismo comportamiento que antes: un unidadId sin filas devolvia []).
    private async resolverRamaQuery(query: { unidadId?: string; rama?: RamaUnidad }): Promise<{ rama?: RamaUnidad; vacio: boolean }> {
        if (query.unidadId) {
            const unidad = await this.prisma.unidad.findFirst({ where: { id: query.unidadId, deletedAt: null } });
            if (!unidad || !esRama(unidad.tipo)) return { vacio: true };
            return { rama: unidad.tipo, vacio: false };
        }
        if (query.rama) return { rama: query.rama, vacio: false };
        return { vacio: false };
    }

    private async assertPruebaAisladaUnica(rama: RamaUnidad, umbral: number | null | undefined, excluirId?: string) {
        if (umbral !== null && umbral !== undefined) return;

        const otra = await this.prisma.adelanto.findFirst({
            where: {
                rama,
                umbralPorcentaje: null,
                deletedAt: null,
                ...(excluirId ? { id: { not: excluirId } } : {}),
            },
        });

        if (otra) {
            throw new ConflictException(
                `La rama ya tiene una prueba aislada ("${otra.nombre}"). Solo puede haber un adelanto sin umbralPorcentaje por rama.`,
            );
        }
    }

    // ── Areas ──────────────────────────────────

    async findAreas() {
        return this.prisma.areaCrecimiento.findMany({
            where: { deletedAt: null },
            include: AREA_INCLUDE,
            orderBy: { orden: 'asc' },
        });
    }

    async findOneArea(id: string) {
        const area = await this.prisma.areaCrecimiento.findFirst({
            where: { id, deletedAt: null },
            include: AREA_INCLUDE,
        });
        if (!area) throw new NotFoundException(`Area con ID ${id} no encontrada`);
        return area;
    }

    async createArea(dto: CreateAreaDto, userId: string) {
        const area = await this.prisma.areaCrecimiento.create({
            data: {
                nombre: dto.nombre,
                tipo: dto.tipo,
                orden: dto.orden,
                activo: dto.activo,
                rama: dto.rama,
                createdBy: userId,
            },
            include: AREA_INCLUDE,
        });
        this.registrar(userId, 'CATALOGO_CREATED', area.id, `Area "${area.nombre}" creada`);
        return area;
    }

    async updateArea(id: string, dto: UpdateAreaDto, userId: string) {
        await this.findOneArea(id);
        const area = await this.prisma.areaCrecimiento.update({
            where: { id },
            data: { ...dto, updatedBy: userId },
            include: AREA_INCLUDE,
        });
        this.registrar(userId, 'CATALOGO_UPDATED', id, `Area "${area.nombre}" actualizada`);
        return area;
    }

    async removeArea(id: string, userId: string) {
        const area = await this.findOneArea(id);

        const total = await this.prisma.indicadorLogro.count({
            where: { areaId: id, deletedAt: null },
        });
        if (total > 0) {
            throw new ConflictException(
                `No se puede eliminar el area "${area.nombre}": tiene ${total} indicador(es) activo(s). Desactivalos o muevelos antes de eliminarla.`,
            );
        }

        await this.prisma.areaCrecimiento.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        this.registrar(userId, 'CATALOGO_DELETED', id, `Area "${area.nombre}" eliminada`);
    }

    // ── Etapas ─────────────────────────────────

    async findEtapas(query: QueryEtapasDto) {
        const filtro = await this.resolverRamaQuery(query);
        if (filtro.vacio) return [];
        return this.prisma.etapa.findMany({
            where: {
                deletedAt: null,
                ...(filtro.rama ? { rama: filtro.rama } : {}),
            },
            orderBy: { numero: 'asc' },
        });
    }

    async findOneEtapa(id: string) {
        const etapa = await this.prisma.etapa.findFirst({ where: { id, deletedAt: null } });
        if (!etapa) throw new NotFoundException(`Etapa con ID ${id} no encontrada`);
        return etapa;
    }

    async updateEtapa(id: string, dto: UpdateEtapaDto, userId: string) {
        await this.findOneEtapa(id);

        const etapa = await this.prisma.etapa.update({
            where: { id },
            data: { ...dto, updatedBy: userId },
        });
        this.registrar(userId, 'CATALOGO_UPDATED', id, `Etapa "${etapa.nombre}" actualizada`);
        return etapa;
    }

    // ── Indicadores ────────────────────────────

    async findIndicadores(query: QueryIndicadoresDto) {
        const filtro = await this.resolverRamaQuery(query);
        const where: any = { deletedAt: null };

        if (filtro.vacio) return [];
        if (filtro.rama) where.rama = filtro.rama;
        if (query.etapaId) where.etapaId = query.etapaId;
        if (query.areaId) where.areaId = query.areaId;
        if (query.search) {
            where.OR = [
                { codigo: { contains: query.search, mode: 'insensitive' } },
                { texto: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.indicadorLogro.findMany({
            where,
            include: INDICADOR_INCLUDE,
            orderBy: [
                { Etapa: { numero: 'asc' } },
                { Area: { orden: 'asc' } },
                { orden: 'asc' },
            ],
        });
    }

    async findOneIndicador(id: string) {
        const indicador = await this.prisma.indicadorLogro.findFirst({
            where: { id, deletedAt: null },
            include: INDICADOR_INCLUDE,
        });
        if (!indicador) throw new NotFoundException(`Indicador con ID ${id} no encontrado`);
        return indicador;
    }

    private async assertRefsIndicador(dto: { etapaId?: string; areaId?: string }) {
        if (dto.etapaId) await this.assertEtapa(dto.etapaId);
        if (dto.areaId) await this.assertArea(dto.areaId);
    }

    async createIndicador(dto: CreateIndicadorDto, userId: string) {
        await this.assertRefsIndicador(dto);

        const indicador = await this.prisma.indicadorLogro.create({
            data: {
                codigo: dto.codigo,
                texto: dto.texto,
                etapaId: dto.etapaId,
                areaId: dto.areaId,
                rama: dto.rama,
                orden: dto.orden,
                activo: dto.activo,
                createdBy: userId,
            },
            include: INDICADOR_INCLUDE,
        });
        this.registrar(userId, 'CATALOGO_CREATED', indicador.id, `Indicador ${indicador.codigo} creado`);
        return indicador;
    }

    async updateIndicador(id: string, dto: UpdateIndicadorDto, userId: string) {
        await this.findOneIndicador(id);
        await this.assertRefsIndicador(dto);

        const indicador = await this.prisma.indicadorLogro.update({
            where: { id },
            data: { ...dto, updatedBy: userId },
            include: INDICADOR_INCLUDE,
        });
        this.registrar(userId, 'CATALOGO_UPDATED', id, `Indicador ${indicador.codigo} actualizado`);
        return indicador;
    }

    async removeIndicador(id: string, userId: string) {
        const indicador = await this.findOneIndicador(id);

        const estados = await this.prisma.estadoLogroJoven.count({
            where: { indicadorId: id, deletedAt: null },
        });
        if (estados > 0) {
            throw new ConflictException(
                `No se puede eliminar el indicador ${indicador.codigo}: tiene ${estados} estado(s) de progreso registrados. Desactivalo en lugar de eliminarlo.`,
            );
        }

        await this.prisma.indicadorLogro.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        this.registrar(userId, 'CATALOGO_DELETED', id, `Indicador ${indicador.codigo} eliminado`);
    }

    // ── Adelantos ──────────────────────────────

    async findAdelantos(query: QueryAdelantosDto) {
        const filtro = await this.resolverRamaQuery(query);
        if (filtro.vacio) return [];
        return this.prisma.adelanto.findMany({
            where: {
                deletedAt: null,
                ...(filtro.rama ? { rama: filtro.rama } : {}),
            },
            orderBy: [{ rama: 'asc' }, { orden: 'asc' }],
        });
    }

    async findOneAdelanto(id: string) {
        const adelanto = await this.prisma.adelanto.findFirst({ where: { id, deletedAt: null } });
        if (!adelanto) throw new NotFoundException(`Adelanto con ID ${id} no encontrado`);
        return adelanto;
    }

    async createAdelanto(dto: CreateAdelantoDto, userId: string) {
        await this.assertPruebaAisladaUnica(dto.rama, dto.umbralPorcentaje);

        const adelanto = await this.prisma.adelanto.create({
            data: {
                nombre: dto.nombre,
                rama: dto.rama,
                orden: dto.orden,
                edadMinima: dto.edadMinima,
                umbralPorcentaje: dto.umbralPorcentaje,
                activo: dto.activo,
                createdBy: userId,
            },
        });
        this.registrar(userId, 'CATALOGO_CREATED', adelanto.id, `Adelanto "${adelanto.nombre}" creado`);
        return adelanto;
    }

    async updateAdelanto(id: string, dto: UpdateAdelantoDto, userId: string) {
        const actual = await this.findOneAdelanto(id);

        const rama = dto.rama ?? actual.rama;
        const umbral = dto.umbralPorcentaje !== undefined ? dto.umbralPorcentaje : actual.umbralPorcentaje;

        await this.assertPruebaAisladaUnica(rama, umbral, id);

        const adelanto = await this.prisma.adelanto.update({
            where: { id },
            data: { ...dto, updatedBy: userId },
        });
        this.registrar(userId, 'CATALOGO_UPDATED', id, `Adelanto "${adelanto.nombre}" actualizado`);
        return adelanto;
    }

    async removeAdelanto(id: string, userId: string) {
        const adelanto = await this.findOneAdelanto(id);

        const progresiones = await this.prisma.progresion.count({
            where: { adelantoId: id, deletedAt: null },
        });
        if (progresiones > 0) {
            throw new ConflictException(
                `No se puede eliminar el adelanto "${adelanto.nombre}": tiene ${progresiones} progresion(es) asociadas. Desactivalo en lugar de eliminarlo.`,
            );
        }

        await this.prisma.adelanto.update({
            where: { id },
            data: { deletedAt: new Date(), updatedBy: userId },
        });
        this.registrar(userId, 'CATALOGO_DELETED', id, `Adelanto "${adelanto.nombre}" eliminado`);
    }
}
