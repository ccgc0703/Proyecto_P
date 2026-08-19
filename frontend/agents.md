# Frontend Agent Instructions

## 🎯 Objetivo
Desarrollar el frontend del Sistema de Gestión Scout utilizando React + TypeScript con las mejores prácticas de desarrollo.

## 🛠 Stack Tecnológico
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Material UI (MUI) v5
- **Estado Global**: Zustand
- **Routing**: TanStack Router
- **Formularios**: React Hook Form + Zod
- **HTTP Client**: Axios

---

## 📋 Reglas de Negocio

### 🔐 Autenticación
- El sistema utiliza JWT para autenticación
- Token se envía en header: `Authorization: Bearer <TOKEN>`
- El login retorna un JWT que debe ser decodificado para obtener:
  - `sub`: ID del usuario
  - `roles`: Array de roles
  - `permissions`: Array de permisos
  - `unidad`: Unidad asignada (si aplica)

### 🛡️ Sistema de Permisos (RBAC)
- Verificar permisos antes de mostrar componentes o renderizar hijos
- Si el usuario no tiene permiso, mostrar mensaje 403 o redirigir
- Permisos del sistema:
  ```
  user:create, user:view, user:update, user:delete
  joven:create, joven:view, joven:update, joven:delete
  unidad:create, unidad:view, unidad:update, unidad:delete
  representante:create, representante:view, representante:update, representante:delete
  progresion:create, progresion:view, progresion:update, progresion:delete
  condecoracion:create, condecoracion:view, condecoracion:update, condecoracion:delete, condecoracion:otorgar
  medico:view, medico:edit, medico:update
  rbac:view, rbac:manage, rbac:assign-role
  ```

### 🏕️ Control de Acceso por Unidad
- **ADULTO_MANADA**: Solo puede ver/gestionar jóvenes de **Manada**
- **ADULTO_TROPA**: Solo puede ver/gestionar jóvenes de **Tropa**
- **ADULTO_CLAN**: Solo puede ver/gestionar jóvenes de **Clan**
- **SYSTEM_ADMIN, GROUP_LEADER, GROUP_SUBLEADER**: Acceso a todas las unidades

### 👥 Jerarquía de Roles
| Nivel | Rol |
|-------|-----|
| 1 | SYSTEM_ADMIN |
| 2 | GROUP_LEADER |
| 3 | GROUP_SUBLEADER |
| 4 | ADULTO_MANADA |
| 5 | ADULTO_TROPA |
| 6 | ADULTO_CLAN |
| 7 | SECRETARIO |
| 8 | ADULTO_COLABORADOR |
| 9 | CONSULTOR |

Un usuario no puede asignar roles iguales o superiores al suyo.

---

## 📁 Estructura del Proyecto

```
src/
├── api/                    # Configuración de Axios e interceptors
├── components/
│   ├── common/            # Componentes reutilizables (Button, Input, Card, Table, Modal, Loading)
│   ├── layout/           # Sidebar, Navbar, MainLayout, PrivateRoute
│   └── forms/            # Componentes de formulario
├── features/
│   ├── auth/             # Login, logout
│   ├── dashboard         # Resumen y métricas
│   ├── jovenes           # CRUD jóvenes
│   ├── usuarios          # Gestión de usuarios
│   ├── unidades          # Gestión de unidades
│   ├── perfil            # Perfil de usuario
│   └── staff             # Roles y permisos
├── hooks/                # Hooks personalizados
├── pages/                # Componentes de página
├── stores/               # Zustand stores
├── theme/                # Tema MUI
├── types/                # TypeScript interfaces
└── utils/                # Utilidades
```

---

## 🎨 Convenciones de Código

### Naming
- **Archivos**: camelCase para archivos de código, PascalCase para componentes React
- **Componentes**: PascalCase (ej: `LoginForm.tsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useAuth.ts`)
- **Stores**: camelCase (ej: `authStore.ts`)

### Estructura de Componente
```tsx
import { useState } from 'react';
import { Box, Typography } from '@mui/material';

interface ComponentProps {
  title: string;
  onSubmit: () => void;
}

export const Component = ({ title, onSubmit }: ComponentProps) => {
  const [state, setState] = useState('');

  return (
    <Box>
      <Typography>{title}</Typography>
    </Box>
  );
};
```

### Forms con React Hook Form + Zod
```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type FormData = z.infer<typeof schema>;

export const Form = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
};
```

---

## 📌 Guidelines de Desarrollo

1. ** Siempre usar TypeScript** - Definir interfaces para todo
2. ** Componentes pequeños** - Un componente = una responsabilidad
3. ** No duplicar código** - Extraer lógica a hooks o utils
4. ** Manejo de errores** - Try/catch en llamadas API, mostrar feedback al usuario
5. ** Loading states** - Siempre mostrar indicador de carga
6. ** Validaciones** - Usar Zod para validaciones en cliente y servidor
7. ** Accesibilidad** - Usar componentes MUI que ya son accesibles
8. ** Responsive** - Diseño mobile-first con MUI Grid

---

## 🔗 Integración con Backend

### Endpoints esperados
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /auth/login | Iniciar sesión |
| POST | /auth/logout | Cerrar sesión |
| POST | /auth/refresh | Refrescar token |
| GET | /auth/me | Obtener usuario actual |
| GET | /jovenes | Listar jóvenes (filtrado por unidad) |
| POST | /jovenes | Crear joven |
| GET | /jovenes/:id | Obtener joven |
| PUT | /jovenes/:id | Actualizar joven |
| DELETE | /jovenes/:id | Eliminar joven |
| GET | /usuarios | Listar usuarios |
| POST | /usuarios | Crear usuario |
| GET | /unidades | Listar unidades |
| GET | /rbac/roles | Listar roles |
| GET | /rbac/permisos | Listar permisos |

---

## ✅ Checklist de Código

- [ ] TypeScript strict mode
- [ ] Interfaces para todos los tipos de datos
- [ ] Manejo de estados: loading, error, success
- [ ] Validaciones con Zod en formularios
- [ ] Verificación de permisos antes de renderizar
- [ ] Filtros por unidad según rol del usuario
- [ ] Interceptores de Axios para token
- [ ] Tema MUI personalizado
- [ ] Rutas protegidas
- [ ] Logout limpia todo el estado
