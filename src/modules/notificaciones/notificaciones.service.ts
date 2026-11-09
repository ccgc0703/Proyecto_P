import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RBAC_ROLES } from '../../common/constantes';
import { rangoLista } from '../../common/paginacion';

/** Tipos canónicos de notificación in-app (Fase 3). */
export const TIPOS_NOTIFICACION = {
    CUENTA_CREADA: 'CUENTA_CREADA',
    SOLICITUD_APROBACION: 'SOLICITUD_APROBACION',
    PROGRESION_RESUELTA: 'PROGRESION_RESUELTA',
    FICHA_MEDICA_ALTA: 'FICHA_MEDICA_ALTA',
    SEGURO_POR_VENCER: 'SEGURO_POR_VENCER',
    CARGO_ASIGNADO: 'CARGO_ASIGNADO',
} as const;

/** Roles de adulto de unidad que reciben los avisos operativos de su unidad. */
const ROLES_RESPONSABLES_UNIDAD: string[] = [
    RBAC_ROLES.ADULTO_MANADA,
    RBAC_ROLES.ADULTO_TROPA,
    RBAC_ROLES.ADULTO_COMUNIDAD,
    RBAC_ROLES.ADULTO_CLAN,
    RBAC_ROLES.REPRESENTANTE_UNIDAD,
];

const DIA_MS = 24 * 60 * 60 * 1000;
const HORIZONTE_SEGURO_DIAS = 30;

export interface OpcionesNotificaciones {
    page?: number;
    limit?: number;
    soloNoLeidas?: boolean;
}

@Injectable()
export class NotificacionesService {
    private readonly logger = new Logger(NotificacionesService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Publica una notificación a los usuarios indicados.
     * Best-effort: nunca lanza (solo loguea) para no romper el evento que la
     * dispara. Deduplica ids y descarta cuentas inexistentes o inactivas.
     */
    async publicar(
        usuarioIds: string[],
        tipo: string,
        titulo: string,
        cuerpo: string,
        link?: string,
    ): Promise<void> {
        const ids = [
            ...new Set(
                (usuarioIds ?? []).filter((id) => typeof id === 'string' && id.length > 0),
            ),
        ];
        if (ids.length === 0) return;

        try {
            const validos = await this.prisma.usuario.findMany({
                where: { id: { in: ids }, activo: true, deletedAt: null },
                select: { id: true },
            });
            if (validos.length === 0) return;

            await this.prisma.notificacion.createMany({
                data: validos.map((u) => ({
                    usuarioId: u.id,
                    tipo,
                    titulo,
                    cuerpo,
                    link: link ?? null,
                })),
            });
        } catch (err) {
            this.logger.warn(
                `No se pudo publicar la notificación "${tipo}": ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }

    /**
     * Destinatarios operativos de una unidad: usuarios activos con rol de
     * adulto de esa unidad + todos los SYSTEM_ADMIN activos (sin duplicados).
     */
    async responsablesUnidad(unidadId?: string | null): Promise<string[]> {
        const filtroAdmin = {
            activo: true,
            deletedAt: null,
            UsuarioRoles: {
                some: { deletedAt: null, Rol: { deletedAt: null, nombre: RBAC_ROLES.SYSTEM_ADMIN } },
            },
        };

        const [deUnidad, admins] = await Promise.all([
            unidadId
                ? this.prisma.usuario.findMany({
                    where: {
                        activo: true,
                        deletedAt: null,
                        unidadId,
                        UsuarioRoles: {
                            some: {
                                deletedAt: null,
                                Rol: { deletedAt: null, nombre: { in: ROLES_RESPONSABLES_UNIDAD } },
                            },
                        },
                    },
                    select: { id: true },
                })
                : Promise.resolve([] as { id: string }[]),
            this.prisma.usuario.findMany({ where: filtroAdmin, select: { id: true } }),
        ]);

        return [...new Set([...deUnidad.map((u) => u.id), ...admins.map((u) => u.id)])];
    }

    /** Lista notificaciones propias (más recientes primero) + total y badge de no leídas. */
    async listar(usuarioId: string, opts: OpcionesNotificaciones = {}) {
        const where = { usuarioId, ...(opts.soloNoLeidas ? { leidaEn: null } : {}) };
        const rango = rangoLista({ page: opts.page, limit: opts.limit });

        const [items, total, noLeidas] = await Promise.all([
            this.prisma.notificacion.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: rango.skip,
                take: rango.take,
            }),
            this.prisma.notificacion.count({ where }),
            this.prisma.notificacion.count({ where: { usuarioId, leidaEn: null } }),
        ]);

        return { items, total, noLeidas };
    }

    /** Marca una notificación propia como leída (idempotente); 404 si es ajena. */
    async marcarLeida(usuarioId: string, id: string) {
        const notificacion = await this.prisma.notificacion.findFirst({
            where: { id, usuarioId },
        });
        if (!notificacion) {
            throw new NotFoundException('Notificación no encontrada');
        }
        if (notificacion.leidaEn) return notificacion;

        return this.prisma.notificacion.update({
            where: { id },
            data: { leidaEn: new Date() },
        });
    }

    /** Marca todas las no leídas propias como leídas; devuelve cuántas. */
    async marcarTodas(usuarioId: string): Promise<number> {
        const { count } = await this.prisma.notificacion.updateMany({
            where: { usuarioId, leidaEn: null },
            data: { leidaEn: new Date() },
        });
        return count;
    }

    /**
     * Job diario (03:30): avisa a los responsables de cada unidad que tiene
     * fichas con seguro vencido o por vencer. Deduplica por usuario: no repite
     * el aviso si ya lo recibió en los últimos 30 días.
     */
    @Cron('0 30 3 * * *')
    async avisarSegurosPorVencer(): Promise<void> {
        try {
            const en30d = new Date(Date.now() + HORIZONTE_SEGURO_DIAS * DIA_MS);
            const fichas = await this.prisma.fichaMedica.findMany({
                where: {
                    deletedAt: null,
                    seguroVigencia: { lte: en30d },
                    Miembro: { deletedAt: null },
                },
                select: { Miembro: { select: { unidadId: true } } },
            });

            const unidadIds = [
                ...new Set(
                    fichas.map((f) => f.Miembro.unidadId).filter((id): id is string => !!id),
                ),
            ];
            if (unidadIds.length === 0) return;

            const porUnidad = await Promise.all(
                unidadIds.map((id) => this.responsablesUnidad(id)),
            );
            const candidatos = [...new Set(porUnidad.flat())];
            if (candidatos.length === 0) return;

            // No repetir: el usuario ya recibió este aviso en los últimos 30 días.
            const desde = new Date(Date.now() - HORIZONTE_SEGURO_DIAS * DIA_MS);
            const recientes = await this.prisma.notificacion.findMany({
                where: {
                    usuarioId: { in: candidatos },
                    tipo: TIPOS_NOTIFICACION.SEGURO_POR_VENCER,
                    createdAt: { gte: desde },
                },
                select: { usuarioId: true },
            });
            const yaAvisados = new Set(recientes.map((n) => n.usuarioId));
            const pendientes = candidatos.filter((id) => !yaAvisados.has(id));
            if (pendientes.length === 0) return;

            await this.publicar(
                pendientes,
                TIPOS_NOTIFICACION.SEGURO_POR_VENCER,
                'Seguros médicos por vencer',
                `${fichas.length} ficha(s) médica(s) con seguro vencido o por vencer en los próximos ${HORIZONTE_SEGURO_DIAS} días.`,
                '/app/miembros',
            );
        } catch (err) {
            this.logger.error('Fallo el job de avisos de seguro por vencer', err as Error);
        }
    }
}
