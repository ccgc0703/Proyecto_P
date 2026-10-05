import { useAuthStore } from '../stores/authStore';
import { PERMISSIONS, Unidad } from '../types/auth';

export const useUnidad = (): Unidad | undefined => {
  const { user } = useAuthStore();
  return user?.unidad;
};

export const useCanViewAllUnidades = (): boolean => {
  const { user } = useAuthStore();
  if (!user) return false;
  
  return user.permissions.includes(PERMISSIONS.RBAC_MANAGE) ||
         user.roles.includes('SYSTEM_ADMIN') ||
         user.roles.includes('GROUP_LEADER') ||
         user.roles.includes('GROUP_SUBLEADER');
};

export const useUnidadesFiltradas = (): Unidad[] => {
  const { user } = useAuthStore();
  const canViewAll = useCanViewAllUnidades();

  if (!user) return [];

  if (canViewAll) {
    return ['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN'];
  }
  
  if (user.unidad) {
    return [user.unidad];
  }
  
  return [];
};

export const useUnidadLabel = (unidad?: Unidad): string => {
  const labels: Record<Unidad, string> = {
    MANADA: 'Manada',
    TROPA: 'Tropa',
    COMUNIDAD: 'Comunidad',
    CLAN: 'Clan',
  };
  
  return unidad ? labels[unidad] : 'Todas';
};

export const ORDEN_UNIDADES: Unidad[] = ['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN'];

const indiceCanonico = (valor?: string | null): number => {
  const normalizado = (valor ?? '').trim().toUpperCase();
  const indice = ORDEN_UNIDADES.indexOf(normalizado as Unidad);
  return indice >= 0 ? indice : ORDEN_UNIDADES.length;
};

/**
 * Ordena listados de unidades en el orden de presentación del sistema:
 * Manada → Tropa → Comunidad → Clan. Reconoce tanto el tipo como el nombre
 * (la API puede devolver cualquiera de los dos).
 */
export const ordenarPorUnidad = <T extends { nombre?: string | null; tipo?: string | null }>(
  lista: T[],
): T[] =>
  [...lista].sort((a, b) => {
    const indiceA = Math.min(indiceCanonico(a.tipo), indiceCanonico(a.nombre));
    const indiceB = Math.min(indiceCanonico(b.tipo), indiceCanonico(b.nombre));
    if (indiceA !== indiceB) return indiceA - indiceB;
    return (a.nombre ?? '').localeCompare(b.nombre ?? '', 'es');
  });
