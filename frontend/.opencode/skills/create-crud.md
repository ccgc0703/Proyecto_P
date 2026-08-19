# Skill: Create CRUD

Genera una estructura CRUD completa para un módulo del sistema.

## Descripción

Esta skill crea automáticamente la estructura de archivos para un módulo CRUD completo incluyendo:
- Tipos TypeScript
- Store de Zustand (si es necesario)
- Componente de lista/tabla
- Componente de formulario
- Página principal
- Hooks personalizados

## Uso

```
/create-crud [nombre-modulo] [campos]
```

## Parámetros

- `nombre-modulo`: Nombre del módulo en singular (ej: joven, usuario, unidad)
- `campos`: Lista de campos separados por coma (ej: nombre,email,edad)

## Ejemplos

```
/create-crud joven nombre,apellido,fechaNacimiento,unidadId
/create-crud usuario nombre,email,password,rol
/create-crud unidad nombre,tipo,adultoAcargo
```

## Archivos Generados

Para el módulo "joven":

```
src/types/joven.ts
src/features/jovenes/jovenesApi.ts
src/features/jovenes/jovenesStore.ts
src/features/jovenes/JovenesList.tsx
src/features/jovenes/JovenForm.tsx
src/features/jovenes/JovenDetail.tsx
src/pages/JovenesPage.tsx
src/features/jovenes/index.ts
```

## Reglas

- Usar siempre TypeScript
- Los tipos deben incluir id, createdAt, updatedAt
- Los formularios deben usar React Hook Form + Zod
- Las tablas deben usar MUI DataGrid o Table
- Verificar permisos antes de mostrar botones de acción
- Aplicar filtros por unidad según el rol del usuario
