import { RamaUnidad } from '@prisma/client';

export const RAMAS_UNIDAD: RamaUnidad[] = ['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN'];

// Unidad.tipo es texto libre en el DTO; solo los valores canónicos resuelven a rama de catálogo.
export function esRama(tipo?: string | null): tipo is RamaUnidad {
    return tipo === 'MANADA' || tipo === 'TROPA' || tipo === 'COMUNIDAD' || tipo === 'CLAN';
}
