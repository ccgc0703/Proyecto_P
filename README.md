# Sistema de Gestión Scout - Backend

Backend profesional en **NestJS** con **Prisma** y **PostgreSQL** para la gestión de grupos scouts.

## Requisitos

- Node.js 18+
- PostgreSQL (base de datos: `poseidon`)

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar el entorno (variables documentadas en .env.example)
cp .env.example .env
#   DATABASE_URL  -> conexión a PostgreSQL
#   JWT_SECRET    -> obligatorio; sin él el servicio no arranca (32+ caracteres)
#   CORS_ORIGIN   -> orígenes de navegador permitidos (por defecto Vite: 5173/4173)

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
| `npm run start` | Ejecuta `dist/src/main.js` |
| `npm run start:dev` | Inicia en modo desarrollo |
| `npm test` | Tests unitarios (Jest) |
| `npm run test:cov` | Tests con cobertura |
| `npm run load:test` | Prueba de carga de la API (ver sección Tests) |
| `npm run prisma:generate` | Genera cliente Prisma |
| `npm run prisma:migrate` | Aplica migraciones pendientes |
| `npm run seed` | Carga datos base (unidades, roles, admin) — idempotente |
| `npm run seed:masivo` | Crea ~1000 jóvenes de prueba — idempotente (`--limpiar` los elimina) |
| `npm run importar:indicadores` | Importa el catálogo de indicadores desde Excel |

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
| 6 | `ADULTO_COMUNIDAD` |
| 7 | `ADULTO_CLAN` |
| 8 | `SECRETARIO` |
| 9 | `ADULTO_COLABORADOR` |
| 10 | `CONSULTOR` |

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
| `COMUNIDAD` |
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

### 🩺 Ficha Médica

Cada miembro posee **una única** ficha médica (relación 1:1 con el miembro).

**Estructura:**

- **Datos generales:** tipo de sangre (enum), teléfono, email.
- **Datos médicos:** médico tratante, teléfono del médico, observaciones.
- **Seguro médico:** compañía, póliza y vigencia.
- **Contacto de emergencia:** nombre, teléfono y parentesco (desglosado).
- **Tablas hijas (detalle, relación 1:N):**
  - `Alergias` — nombre, severidad (LEVE/MODERADA/SEVERA), reacción.
  - `Medicamentos` — nombre, dosis, frecuencia, motivo, prescrito por.
  - `Condiciones` — nombre, descripción, fecha de diagnóstico, requiere control.
  - `Vacunas` — nombre, fecha de aplicación, lote.
- **Consentimiento/autorización médica:** bandera, fecha y observaciones.

**Reglas de negocio:**

- Un miembro solo puede tener **una** ficha médica.
- Ver y crear/editar requiere los permisos `medico:view`, `medico:edit` y `medico:update`.
- Las acciones de crear/actualizar/eliminar quedan registradas en auditoría (`FICHA_MEDICA_CREATED`, `FICHA_MEDICA_UPDATED`, `FICHA_MEDICA_DELETED`).
- La eliminación es **lógica (soft delete)**, no se borran datos físicamente.
- Si se registra consentimiento sin fecha, se asigna automáticamente la fecha actual.
- La creación/actualización permite gestionar de forma anidada las tablas hijas (crear, actualizar o eliminar detalle).

**Permisos necesarios:**

```
medico:view, medico:edit, medico:update
```

---

### 🔒 Restricción de acceso por unidad

El acceso a los jóvenes se restringe según la unidad del adulto.

**Reglas:**

| Rol | Acceso |
|-----|--------|
| `ADULTO_MANADA` | Solo jóvenes de **Manada** |
| `ADULTO_TROPA` | Solo jóvenes de **Tropa** |
| `ADULTO_COMUNIDAD` | Solo jóvenes de **Comunidad** |
| `ADULTO_CLAN` | Solo jóvenes de **Clan** |

**Excepciones (acceso a todas las unidades):**

- `SYSTEM_ADMIN`
- `GROUP_LEADER`
- `GROUP_SUBLEADER`

**Observación (referencial, no se valida):**

| Unidad | Rango de edad |
|--------|---------------|
| Manada | 6 – 10 |
| Tropa | 10 – 15 |
| Comunidad | 15 – 18 |
| Clan | 18 – 21 |

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

### 🛡 Seguridad y salud del servicio

**Cabeceras HTTP (`helmet`):** toda respuesta incluye `X-Content-Type-Options`, `X-Frame-Options`,
`Strict-Transport-Security`, `Referrer-Policy` y `Cross-Origin-Resource-Policy`; se omite
`X-Powered-By`. CSP y `Cross-Origin-Embedder-Policy` están desactivados porque la API solo sirve JSON.

**Rate limit (`@nestjs/throttler`, por IP):**

| Límite | Ventana | Aplica a |
|--------|---------|----------|
| 600 peticiones | 60 s | Todos los endpoints (`X-RateLimit-Limit`) |
| 20 intentos | 60 s | `POST /api/v1/auth/login` (fuerza bruta) |

Al superar el límite la API responde `429 Too Many Requests` con cabecera `Retry-After`.
La ventana se reinicia automáticamente y también al reiniciar el servicio.

El límite global se puede ajustar por variable de entorno (por defecto `600`); se usa sobre todo
para pruebas de carga, donde debe medirse la capacidad del servicio sin el cortafuegos encima:

```bash
RATE_LIMIT_GLOBAL=1000000 node dist/src/main.js
```

**Health check:**

```
GET /api/v1/health      # sin autenticación
```

Respuesta `200` con `{ status: "ok", uptime, timestamp, checks: { database: "up" } }`;
devuelve `503` con `status: "degraded"` si la base de datos no responde.

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
- No existe endpoint para editar ni borrar registros individuales: la auditoría es **inmutable desde la API**.
- **Retención:** un job programado (a las 03:00, diario) y el endpoint `POST /api/v1/audit/retencion`
  (permiso `rbac:manage`) eliminan los registros anteriores al umbral configurable
  `AUDIT_RETENTION_DAYS` (**365 días** por defecto; un valor `<= 0` desactiva la retención).
  `?dias=N` permite forzar otra ventana en la ejecución manual.

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
progresion:create, progresion:view, progresion:update, progresion:delete, progresion:aprobar

// Catálogo de progresión (áreas, etapas, indicadores, adelantos)
catalogo:view, catalogo:manage

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

### Unitarios (backend)

```bash
npm test
```

### E2E del frontend (Playwright + Edge del sistema)

Valida el flujo real en navegador: login, protección de rutas, recarga (F5),
navegación del panel y control de acceso por rol. No descarga navegadores
(`channel: 'msedge'`); arranca por sí solo el API y el dev server si no están corriendo.

```bash
cd frontend
npm run test:e2e
```

Archivos en `frontend/e2e/`: `acceso.spec.ts` (rutas públicas/privadas, F5),
`panel.spec.ts` (navegación admin completa) y `rbac.spec.ts` (portal del joven y denegación).

### Prueba de carga (sin dependencias)

```bash
npm run load:test -- --scenario listado --concurrency 25 --duration 15
```

Escenarios: `health`, `listado`, `page100`, `busqueda`, `stats`, `progresion`, `login`, `mixto`.
Reporta req/s, percentiles p50/p95/p99 y el reparto de códigos HTTP (incluidos los `429`
del rate limit). Para medir capacidad sin el cortafuegos, reinicia el API con
`RATE_LIMIT_GLOBAL` alto.

## Stack

- **Framework:** NestJS 11
- **ORM:** Prisma 7
- **Database:** PostgreSQL
- **Auth:** JWT + Passport
- **Testing:** Jest + ts-jest

---

Desarrollado para la gestión profesional de grupos scouts.
