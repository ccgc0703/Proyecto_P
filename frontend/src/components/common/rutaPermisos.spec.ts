import { describe, expect, it } from 'vitest';
import { REGLAS_RUTA, permisosDeRuta } from './rutaPermisos';

describe('permisosDeRuta', () => {
  it('deja abiertas las rutas sin regla (dashboard y perfil)', () => {
    expect(permisosDeRuta('/app')).toBeNull();
    expect(permisosDeRuta('/app/perfil')).toBeNull();
    expect(permisosDeRuta('/app/mi-progresion')).toBeNull();
  });

  it('exige joven:view en el listado global de miembros', () => {
    expect(permisosDeRuta('/app/miembros')).toEqual(['joven:view']);
  });

  it('exige unidad:view y joven:view en los listados por unidad', () => {
    expect(permisosDeRuta('/app/manada')).toEqual(['unidad:view', 'joven:view']);
    expect(permisosDeRuta('/app/tropa')).toEqual(['unidad:view', 'joven:view']);
    expect(permisosDeRuta('/app/clan')).toEqual(['unidad:view', 'joven:view']);
    expect(permisosDeRuta('/app/comunidad')).toEqual(['unidad:view', 'joven:view']);
  });

  it('usa la regla más larga: editar pide joven:update aunque la ruta sea profunda', () => {
    expect(permisosDeRuta('/app/manada/editar/3f21a908-9d9d')).toEqual(['joven:update']);
    expect(permisosDeRuta('/app/tropa/editar/abc')).toEqual(['joven:update']);
  });

  it('los formularios de alta exigen joven:create', () => {
    expect(permisosDeRuta('/app/comunidad/nuevo')).toEqual(['joven:create']);
  });

  it('protege staff según el nivel de la ruta', () => {
    expect(permisosDeRuta('/app/staff')).toEqual(['rbac:view']);
    expect(permisosDeRuta('/app/staff/nuevo')).toEqual(['user:create']);
    expect(permisosDeRuta('/app/staff/editar/9c1')).toEqual(['user:update']);
    expect(permisosDeRuta('/app/staff/cuenta/9c1')).toEqual(['user:create']);
  });

  it('exige progresion:view y organizacion:view', () => {
    expect(permisosDeRuta('/app/progresion')).toEqual(['progresion:view']);
    expect(permisosDeRuta('/app/progresion/3f21')).toEqual(['progresion:view']);
    expect(permisosDeRuta('/app/estructura')).toEqual(['organizacion:view']);
  });

  it('todas las reglas declaran al menos un permiso (fallo cerrado)', () => {
    for (const regla of REGLAS_RUTA) {
      expect(regla.permisos.length).toBeGreaterThan(0);
    }
  });
});
