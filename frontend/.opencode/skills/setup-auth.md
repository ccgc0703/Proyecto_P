# Skill: Setup Auth

Configura el sistema de autenticación completo.

## Descripción

Esta skill configura automáticamente:
- Store de Zustand para auth
- Instancia de Axios con interceptores
- Hooks de autenticación
- Tipos TypeScript
- Componente de ruta protegida

## Uso

```
/setup-auth
```

## Archivos Generados

### 1. Tipos (src/types/auth.ts)
```typescript
export interface User {
  id: string;
  email: string;
  nombre: string;
  roles: string[];
  permissions: string[];
  unidad?: 'MANADA' | 'TROPA' | 'CLAN';
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

### 2. Store (src/stores/authStore.ts)
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types/auth';
import { login as apiLogin } from '../api/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const response = await apiLogin(credentials);
        set({
          user: response.user,
          token: response.access_token,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      checkAuth: async () => {
        // Verificar token válido
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### 3. Axios Instance (src/api/axios.ts)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 4. Hook useAuth (src/hooks/useAuth.ts)
```typescript
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  return { user, token, isAuthenticated, login, logout };
};
```

### 5. Hook usePermission (src/hooks/usePermission.ts)
```typescript
import { useAuthStore } from '../stores/authStore';

export const usePermission = (permission: string) => {
  const { user } = useAuthStore();
  return user?.permissions.includes(permission) ?? false;
};
```

### 6. Hook useUnidad (src/hooks/useUnidad.ts)
```typescript
import { useAuthStore } from '../stores/authStore';

export const useUnidad = () => {
  const { user } = useAuthStore();
  return user?.unidad;
};
```

### 7. PrivateRoute (src/components/layout/PrivateRoute.tsx)
```typescript
import { Navigate, Outlet } from '@tanstack/react-router';
import { useAuth } from '../../hooks/useAuth';

export const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};
```

## Integración con Backend

El login debe enviar:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Y recibir:
```json
{
  "access_token": "eyJhbG...",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "nombre": "Juan Pérez",
    "roles": ["GROUP_LEADER"],
    "permissions": ["joven:view", "joven:create"],
    "unidad": null
  }
}
```

## Reglas

- JWT se decodifica para obtener permisos
- Token se guarda en localStorage (o cookies)
- El interceptor de Axios agrega el token automáticamente
- 401 = logout automático y redirección a login
- Verificar permisos en cada ruta protegida
- Filtrar datos por unidad del usuario
