import { BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { JWT_SECRET } from '../../common/constantes';

/**
 * QR de presencia (Fase 7b).
 *
 * El adulto con `asistencia:manage` genera un código para la actividad y el
 * joven lo escanea para auto-registrarse. El código es un token firmado con
 * HMAC-SHA256 (secreto `JWT_SECRET`, validado al arrancar en `main.ts`) con
 * caducidad de `PRESENCIA_QR_TTL_MS`: no hay estado en el servidor,
 * verificar el código es autónomo.
 *
 * Formato: `presencia:v1:<uuidActividad>:<expMs>:<firma base64url>`.
 */
export const PRESENCIA_QR_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

const VERSION = 'presencia';
const V1 = 'v1';
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const base64url = (buffer: Buffer): string =>
    buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const firma = (actividadId: string, exp: number): string =>
    base64url(
        createHmac('sha256', JWT_SECRET).update(`${VERSION}:${V1}:${actividadId}:${exp}`).digest(),
    );

export interface PresenciaFirmada {
    codigo: string;
    expira: Date;
}

/** Firma el QR de presencia de una actividad (válido por 24 h). */
export const firmarPresencia = (actividadId: string, ahora = Date.now()): PresenciaFirmada => {
    const exp = ahora + PRESENCIA_QR_TTL_MS;
    return {
        codigo: `${VERSION}:${V1}:${actividadId}:${exp}:${firma(actividadId, exp)}`,
        expira: new Date(exp),
    };
};

/**
 * Verifica un código escaneado. Cualquier alteración (id, vencimiento o
 * firma) y cualquier formato desconocido → `BadRequestException`.
 */
export const verificarPresencia = (
    codigo: string,
    ahora = Date.now(),
): { actividadId: string; expira: Date } => {
    const invalido = () => new BadRequestException('Código QR inválido o expirado');

    const partes = (codigo ?? '').split(':');
    if (partes.length !== 5 || partes[0] !== VERSION || partes[1] !== V1) throw invalido();

    const [, , actividadId, expCrudo, firmaEscaneada] = partes;
    const exp = Number(expCrudo);
    if (!RE_UUID.test(actividadId) || !Number.isFinite(exp) || !firmaEscaneada) throw invalido();

    // Comparación en tiempo constante y de igual longitud.
    const esperada = Buffer.from(firma(actividadId, exp));
    const recibida = Buffer.from(firmaEscaneada);
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) throw invalido();
    if (exp <= ahora) throw invalido();

    return { actividadId, expira: new Date(exp) };
};
