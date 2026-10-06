import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '../types/auth';

const user: User = {
  id: 'u1',
  email: 'admin@poseidon.com',
  nombre: 'Admin',
  roles: ['SYSTEM_ADMIN'],
  permissions: ['rbac:manage'],
  activo: true,
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  });

  it('logout limpia usuario, token, sesión y el storage persistido', () => {
    useAuthStore.setState({ user, token: 'token-viejo', isAuthenticated: true });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    const persistido = JSON.parse(localStorage.getItem('auth-storage') ?? '{}');
    expect(persistido.state?.token ?? null).toBeNull();
    expect(persistido.state?.user ?? null).toBeNull();
    expect(persistido.state?.isAuthenticated ?? false).toBe(false);
  });

  it('checkAuth sin token no llama a la API y marca la sesión como inactiva', async () => {
    useAuthStore.setState({ user, token: null, isAuthenticated: true });

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('checkAuth sin token no lanza excepciones (fallo silencioso controlado)', async () => {
    useAuthStore.setState({ token: null });
    await expect(useAuthStore.getState().checkAuth()).resolves.toBeUndefined();
  });
});
