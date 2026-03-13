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

---

## Reglas de Negocio

Las siguientes reglas definen el comportamiento funcional del sistema y garantizan la seguridad, consistencia de datos y control organizacional dentro del grupo scout.

---

### 👤 Gestión de Usuarios

#### 1. Creación de usuarios

- Solo usuarios con el permiso `user:create` pueden crear nuevos usuarios.
- El sistema permite crear usuarios sin rol inicial.
- Los roles se asignan posteriormente mediante el endpoint de RBAC.

#### 2. Asignación de roles

Los roles se asignan mediante el endpoint:

```
POST /rbac/assign-role
```

**Reglas:**

- Solo usuarios con el permiso `rbac:assign-role` pueden asignar roles.
- Un usuario no puede asignar un rol igual o superior al suyo en la jerarquía.
- Un usuario puede tener múltiples roles.

#### 3. Eliminación de usuarios

**Reglas:**

- Solo usuarios con permiso `user:delete` pueden eliminar usuarios.
- El sistema debe impedir eliminar usuarios críticos del sistema (ej. último administrador).

---

### 🛡 Sistema de Roles y Permisos (RBAC)

El sistema utiliza **Role Based Access Control (RBAC)**.

**Reglas:**

- Cada rol posee un conjunto de permisos.
- Los permisos controlan acceso a endpoints del sistema.
- Los endpoints pueden requerir uno o varios permisos.

**Ejemplo de permisos:**

```
joven:create
joven:view
joven:update
joven:delete
```

---

### 🧭 Jerarquía de Roles

El sistema implementa una jerarquía para evitar escalamiento de privilegios.

**Orden jerárquico (de mayor a menor autoridad):**

| Nivel | Rol |
|-------|-----|
| 1 | `SYSTEM_ADMIN` |
| 2 | `GROUP_LEADER` |
| 3 | `GROUP_SUBLEADER` |
| 4 | `ADULTO_MANADA` |
| 5 | `ADULTO_TROPA` |
| 6 | `ADULTO_CLAN` |
| 7 | `SECRETARIO` |
| 8 | `ADULTO_COLABORADOR` |
| 9 | `CONSULTOR` |

**Reglas:**

- Un usuario solo puede asignar roles inferiores al suyo.
- Los roles superiores poseen mayor nivel de autoridad.

---

### 🏕 Gestión de Unidades

Las unidades representan la estructura del grupo scout.

**Unidades disponibles:**

| Unidad |
|--------|
| `MANADA` |
| `TROPA` |
| `CLAN` |

**Reglas:**

- Cada joven pertenece a una unidad específica.
- Cada adulto de unidad está asociado a una unidad específica.

---

### 👦 Gestión de Jóvenes

Los jóvenes representan los miembros participantes del grupo scout.

**Reglas:**

- Cada joven debe pertenecer a una unidad.
- Cada joven tiene información básica, médica y de progreso.

**Permisos necesarios:**

```
joven:create
joven:view
joven:update
joven:delete
```

---

### 🔒 Restricción de acceso por unidad

El acceso a los jóvenes se restringe según la unidad del adulto.

**Reglas:**

| Rol | Acceso |
|-----|--------|
| `ADULTO_MANADA` | Solo jóvenes de **Manada** |
| `ADULTO_TROPA` | Solo jóvenes de **Tropa** |
| `ADULTO_CLAN` | Solo jóvenes de **Clan** |

**Excepciones (acceso a todas las unidades):**

- `SYSTEM_ADMIN`
- `GROUP_LEADER`
- `GROUP_SUBLEADER`

---

### 🔐 Autenticación

El sistema utiliza autenticación basada en **JWT**.

**Reglas:**

- Los endpoints protegidos requieren token válido.
- El token debe enviarse en el header:

```
Authorization: Bearer <TOKEN>
```

---

### 📜 Auditoría del sistema

El sistema registra acciones críticas en la tabla `AuditLog`.

**Eventos auditados:**

| Evento |
|--------|
| `USER_CREATED` |
| `USER_UPDATED` |
| `USER_DELETED` |
| `ROLE_ASSIGNED` |
| `JOVEN_CREATED` |
| `JOVEN_UPDATED` |
| `JOVEN_DELETED` |

**Información almacenada:**

| Campo | Descripción |
|-------|-------------|
| `actorId` | ID del usuario que realizó la acción |
| `action` | Tipo de evento |
| `module` | Módulo donde ocurrió la acción |
| `targetId` | ID del recurso afectado |
| `ipAddress` | Dirección IP del actor |
| `userAgent` | User agent del navegador/cliente |
| `timestamp` | Fecha y hora del evento |

**Reglas:**

- Todas las acciones críticas deben ser registradas.
- Los registros de auditoría **no pueden ser modificados ni eliminados**.

---

### 🔎 Consulta de permisos

El sistema permite consultar roles y permisos disponibles mediante:

```
GET /rbac/roles
GET /rbac/permisos
```

**Regla:**

- Usuarios con permiso `rbac:view` pueden acceder a esta información.

---

### ⚙ Principios del sistema

El backend se rige por los siguientes principios:

| Principio | Descripción |
|-----------|-------------|
| **Seguridad por permisos** | Todo acceso está controlado por permisos RBAC |
| **Prevención de escalamiento** | La jerarquía impide asignar roles iguales o superiores |
| **Auditoría de acciones** | Todas las acciones críticas quedan registradas |
| **Modularidad** | Arquitectura organizada en módulos independientes |
| **Control por unidad** | Los adultos solo acceden a jóvenes de su unidad |

---

## Permisos disponibles

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
