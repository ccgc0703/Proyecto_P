import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequierePermiso } from './RequierePermiso';
import { useAuthStore } from '../../stores/authStore';
import { PERMISSIONS } from '../../types/auth';
import type { User } from '../../types/auth';

const usuario = (permisos: string[], roles: string[] = []): User => ({
  id: 'u1',
  email: 'prueba@test.com',
  nombre: 'Prueba',
  roles: roles as User['roles'],
  permissions: permisos,
  activo: true,
});

describe('RequierePermiso', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('renderiza el contenido cuando el usuario tiene el permiso', () => {
    useAuthStore.setState({ user: usuario([PERMISSIONS.JOVEN_VIEW]) });

    render(
      <RequierePermiso permiso={PERMISSIONS.JOVEN_VIEW}>
        <p>Contenido protegido</p>
      </RequierePermiso>,
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    expect(screen.queryByText('Acceso Denegado')).not.toBeInTheDocument();
  });

  it('pinta "Acceso Denegado" y no renderiza el contenido sin el permiso', () => {
    useAuthStore.setState({ user: usuario([]) });

    render(
      <RequierePermiso permiso={PERMISSIONS.JOVEN_VIEW}>
        <p>Contenido protegido</p>
      </RequierePermiso>,
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('permite el acceso a SYSTEM_ADMIN (rbac:manage) sin listar cada permiso', () => {
    useAuthStore.setState({ user: usuario([PERMISSIONS.RBAC_MANAGE]) });

    render(
      <RequierePermiso permiso={PERMISSIONS.ORGANIZACION_VIEW}>
        <p>Estructura</p>
      </RequierePermiso>,
    );

    expect(screen.getByText('Estructura')).toBeInTheDocument();
  });

  it('exige todos los permisos cuando se declaran varios', () => {
    useAuthStore.setState({ user: usuario([PERMISSIONS.UNIDAD_VIEW]) });

    const { container } = render(
      <RequierePermiso permisos={[PERMISSIONS.UNIDAD_VIEW, PERMISSIONS.JOVEN_VIEW]}>
        <p>Listado por unidad</p>
      </RequierePermiso>,
    );

    expect(screen.queryByText('Listado por unidad')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('Acceso Denegado');
  });

  it('falla cerrado: sin permisos declarados no muestra el contenido', () => {
    useAuthStore.setState({ user: usuario([PERMISSIONS.RBAC_MANAGE]) });

    render(
      <RequierePermiso>
        <p>Nunca debe verse</p>
      </RequierePermiso>,
    );

    expect(screen.queryByText('Nunca debe verse')).not.toBeInTheDocument();
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
  });

  it('muestra el mensaje personalizado cuando se indica', () => {
    useAuthStore.setState({ user: usuario([]) });

    render(
      <RequierePermiso permiso={PERMISSIONS.RBAC_VIEW} mensaje="Se requiere jerarquía.">
        <p>Staff</p>
      </RequierePermiso>,
    );

    expect(screen.getByText('Se requiere jerarquía.')).toBeInTheDocument();
  });

  it('deniega cuando no hay sesión', () => {
    render(
      <RequierePermiso permiso={PERMISSIONS.JOVEN_VIEW}>
        <p>Contenido protegido</p>
      </RequierePermiso>,
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
  });
});
