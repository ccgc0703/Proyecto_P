import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, User } from '../types/auth';
import { api } from '../api';

interface AuthStateWithHydration extends AuthState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthStateWithHydration>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', credentials);
          // Defensive extraction: handle both camelCase and snake_case, and EN/ES variants
          const data = response.data.data;
          const token = data.access_token || data.accessToken;
          const rawUser = data.user || data.usuario;

          if (!rawUser) {
            throw new Error('No se pudo encontrar la información del usuario en la respuesta del servidor');
          }

          // Normalizar usuario al tipo User del frontend
          const user: User = {
            id: rawUser.id,
            email: rawUser.email,
            nombre: rawUser.nombre,
            apellido: rawUser.apellido || '',
            roles: Array.isArray(rawUser.roles)
              ? rawUser.roles.map((r: string | { nombre?: string }) => (typeof r === 'string' ? r : (r.nombre ?? '')))
              : [],
            permissions: rawUser.permissions || rawUser.permisos || [],
            unidad: rawUser.unidad || rawUser.unidadId || undefined,
            activo: rawUser.activo ?? true,
            miembroId: rawUser.miembroId || undefined,
          };

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          // Defensive extraction for profile endpoint
          const data = response.data.data;

          const user: User = {
            id: data.id,
            email: data.email,
            nombre: data.nombre,
            apellido: data.apellido || '',
            roles: Array.isArray(data.roles)
              ? data.roles.map((r: string | { nombre?: string }) => (typeof r === 'string' ? r : (r.nombre ?? '')))
              : [],
            permissions: data.permissions || data.permisos || [],
            unidad: data.unidad || data.unidadId || undefined,
            activo: data.activo ?? true,
            miembroId: data.miembroId || undefined,
          };

          set({
            user,
            isAuthenticated: true,
          });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      // Se persiste también `isAuthenticated`: sin él, una recarga (F5) dejaba
      // token+usuario guardados pero `isAuthenticated=false`, y el guard de la
      // ruta /app* redirigía al login pese a tener sesión válida.
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
