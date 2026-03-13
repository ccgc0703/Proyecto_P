import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET } from '../../../common/constantes';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: JWT_SECRET,
        });
    }

    /**
     * Valida que el usuario siga activo en DB y que el tokenVersion coincida.
     * Si se asignaron o revocaron roles desde el último login, tokenVersion no
     * coincide → el JWT viejo es inválido de inmediato (sin esperar expiración).
     *
     * Un único SELECT a DB con 3 campos ligeros (activo, deletedAt, tokenVersion).
     * PermissionsGuard NO hace DB: lee permissions[] desde este mismo objeto.
     */
    async validate(payload: any) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                nombre: true,
                email: true,
                unidadId: true,
                activo: true,
                deletedAt: true,
                tokenVersion: true,   // Para validar invalidación de JWT
            },
        });

        if (!usuario || !usuario.activo || usuario.deletedAt) {
            throw new UnauthorizedException('Usuario no válido o inactivo');
        }

        // ── Validación tokenVersion: invalida JWTs viejos inmediatamente ────
        if (payload.tokenVersion !== usuario.tokenVersion) {
            throw new UnauthorizedException(
                'Sesión expirada: tus permisos han cambiado. Por favor inicia sesión de nuevo.',
            );
        }

        // Retornar usuario enriquecido con permissions del JWT (sin re-consultar RBAC)
        return {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            unidadId: usuario.unidadId,
            permissions: payload.permissions ?? [],   // Inyectado al JWT en login
        };
    }
}
