# Sistema de Gestión Scout - Backend

Backend profesional en **NestJS** con **Prisma** y **PostgreSQL** para la gestión de grupos scouts.

## Requisitos

- Node.js 18+
- PostgreSQL (base de datos: `poseidon`)

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar .env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/poseidon"
JWT_SECRET="tu_secret_key"

# Generar cliente Prisma
npm run prisma:generate

# Aplicar migraciones
npx prisma migrate deploy

# Iniciar en desarrollo
npm run start:dev
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript |
| `npm run start:dev` | Inicia en modo desarrollo |
| `npm run test` | Ejecuta tests unitarios |
| `npm run prisma:generate` | Genera cliente Prisma |

## Arquitectura

### Módulos implementados

| Módulo | Endpoints |
|--------|-----------|
| **auth** | POST /login, POST /logout, POST /refresh, GET /me |
| **users** | CRUD completo |
| **unidades** | CRUD completo |
| **jovenes** | CRUD con políticas ABAC por unidad |
| **administrativo** | CRUD representantes |
| **scout** | Progresiones y condecoraciones |
| **ficha-médica** | CRUD completo |
| **rbac** | Gestión de roles y permisos |
| **audit** | Logs de auditoría |

### Seguridad

- JWT con expiración de 8 horas
- Refresh token (invalida JWTs anteriores)
- Permisos RBAC por endpoint
- Políticas ABAC para aislamiento por unidad
- Soft delete en todos los modelos
- Auditoría completa de acciones

### Permisos disponibles

```typescript
// Usuarios
user:create, user:view, user:update, user:delete

// Jóvenes
joven:create, joven:view, joven:update, joven:delete

// Unidades
unidad:create, unidad:view, unidad:update, unidad:delete

// Representantes
representante:create, representante:view, representante:update, representante:delete

// Progresiones
progresion:create, progresion:view, progresion:update, progresion:delete

// Condecoraciones
condecoracion:create, condecoracion:view, condecoracion:update, condecoracion:delete, condecoracion:otorgar

// Ficha médica
medico:view, medico:edit, medico:update

// RBAC
rbac:view, rbac:manage, rbac:assign-role
```

## Estructura del proyecto

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── constantes.ts
│   ├── base.service.ts
│   ├── guards/
│   ├── decorators/
│   └── interceptors/
└── modules/
    ├── auth/
    ├── users/
    ├── unidades/
    ├── jovenes/
    ├── administrativo/
    ├── scout/
    ├── ficha-medica/
    ├── rbac/
    └── audit/
```

## Tests

```bash
npm test
```

## Stack

- **Framework:** NestJS 11
- **ORM:** Prisma 7
- **Database:** PostgreSQL
- **Auth:** JWT + Passport
- **Testing:** Jest + ts-jest

---

Desarrollado para la gestión profesional de grupos scouts.
