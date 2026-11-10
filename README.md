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
| `npm run test:integration` | Tests de integracion contra PostgreSQL |
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
| **adultos** | CRUD de adultos vinculados al grupo |
| **administrativo** | CRUD representantes y ficha médica |
| **scout** | Condecoraciones y otorgamientos |
| **progresion** | Progresiones, estados de indicador y export |
| **catalogo** | Áreas, etapas, indicadores y adelantos |
| **ficha-médica** | CRUD completo (incluye tablas hijas) |
| **datos-scout** | Datos scout complementarios |
| **formacion** | Formación de adultos |
| **programas-mundiales** | Programas mundiales y su estado por miembro |
| **organizacion** | Árbol organizacional y cargos |
| **eventos** | CRUD planificaciones y actividades, planilla de asistencia y asistencias por unidad |
| **normativa** | Biblioteca de documentos: subida PDF/DOCX (10 MB), categorías, vigencia y descarga autenticada |
| **rbac** | Gestión de roles y permisos |
| **audit** | Logs de auditoría y retención |
| **health** | Estado del servicio (uptime, checks) |

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

Fuente canónica: `RBAC_ROLES` en `src/common/constantes.ts`; la comparación de
niveles para asignación vive en `ROL_HIERARCHY` (`frontend/src/types/auth.ts`).

| Nivel | Rol |
|-------|-----|
| 1 | `SYSTEM_ADMIN` |
| 2 | `NATIONAL_BOARD` |
| 3 | `NATIONAL_EXECUTIVE` |
| 4 | `NATIONAL_DIR_JOVENES` / `NATIONAL_DIR_ADULTOS` / `NATIONAL_DIR_DESARROLLO` |
| 5 | `NATIONAL_COLABORADOR` |
| 6 | `REGION_COMMISSIONER` |
| 7 | `REGION_ASSISTANT` |
| 8 | `REGION_COLABORADOR` |
| 9 | `DISTRICT_COMMISSIONER` |
| 10 | `DISTRICT_ASSISTANT` |
| 11 | `DISTRICT_COLABORADOR` |
| 12 | `GROUP_LEADER` |
| 13 | `GROUP_SUBLEADER` |
| 14 | `REPRESENTANTE_UNIDAD` |
| 15 | `ADULTO_MANADA` / `ADULTO_TROPA` / `ADULTO_COMUNIDAD` / `ADULTO_CLAN` |
| 16 | `ADULTO_COLABORADOR` |
| 17 | `CONSULTOR` |
| 18 | `JOVEN` |

**Reglas:**

- Un usuario solo puede asignar roles de nivel **estrictamente mayor** (es decir, de menor privilegio) que su propio nivel máximo.
- Los niveles menores poseen mayor nivel de autoridad. Los roles en el mismo nivel (p. ej. los cuatro `ADULTO_*`) son equivalentes.

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
- Ver requiere `medico:view`; crear, actualizar o eliminar requiere `medico:update`.
- Las acciones de crear/actualizar/eliminar quedan registradas en auditoría (`FICHA_MEDICA_CREATED`, `FICHA_MEDICA_UPDATED`, `FICHA_MEDICA_DELETED`).
- La eliminación es **lógica (soft delete)**, no se borran datos físicamente.
- Si se registra consentimiento sin fecha, se asigna automáticamente la fecha actual.
- La creación/actualización permite gestionar de forma anidada las tablas hijas (crear, actualizar o eliminar detalle).

**Permisos necesarios:**

```
medico:view, medico:update
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

El sistema registra acciones críticas en la tabla **`AuditLog`** (fuente canónica).

**Eventos auditados:**

| Evento | Módulo |
|--------|--------|
| `USER_CREATED` | users |
| `USER_UPDATED` | users |
| `PASSWORD_CHANGED` | users |
| `USER_DELETED` | users |
| `JOVEN_CREATED` | jovenes |
| `JOVEN_UPDATED` | jovenes |
| `JOVEN_DELETED` | jovenes |
| `JOVEN_ACCOUNT_CREATED` | jovenes |
| `ADULTO_CREATED` | adultos |
| `ROLE_ASSIGNED` | rbac |
| `FICHA_MEDICA_CREATED` | ficha-medica |
| `FICHA_MEDICA_UPDATED` | ficha-medica |
| `FICHA_MEDICA_DELETED` | ficha-medica |
| `CATALOGO_CREATED` | catalogo |
| `CATALOGO_UPDATED` | catalogo |
| `CATALOGO_DELETED` | catalogo |
| `INDICADOR_ESTADO_CHANGED` | progresion |
| `PROGRESION_SOLICITADA` | progresion |
| `PROGRESION_APROBADA` | progresion |
| `PROGRESION_RECHAZADA` | progresion |

**Tablas de auditoría (⚠️ son tres, con responsabilidades distintas):**

| Tabla | Rol | ¿Se escribe hoy? |
|-------|-----|-------------------|
| `AuditLog` | Fuente canónica de auditoría de negocio. La escriben los endpoints vía `AuditService.logAction`; es la que consulta el módulo `audit` y la que aplica la retención `AUDIT_RETENTION_DAYS`. | **Sí** |
| `BitacoraAuditoria` | Legacy de la v1 (modelo `tabla` / `registroId` / `datosAntes`-`datosDespues`). Ningún endpoint actual la escribe; se conserva por los datos históricos que contiene. | No (solo lectura histórica) |
| `AuditRBAC` | Legacy de la v1 específico de RBAC. Ídem: los cambios de roles actuales se registran en `AuditLog`. | No (solo lectura histórica) |

> Las dos tablas legacy **no se migran ni se eliminan**: documentarlas es el
> tratamiento acordado (glosario §10.8).

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

// Progresiones (no existe `progresion:delete`: se rechazan con progresion:update)
progresion:create, progresion:view, progresion:update, progresion:aprobar

// Catálogo de progresión (áreas, etapas, indicadores, adelantos)
catalogo:view, catalogo:manage

// Condecoraciones
condecoracion:create, condecoracion:view, condecoracion:update, condecoracion:delete, condecoracion:otorgar

// Ficha médica (no existe `medico:edit`: se unificó en medico:update)
medico:view, medico:update

// RBAC
rbac:view, rbac:manage, rbac:assign-role

// Perfil propio
self:view, self:update

// Estructura organizacional
organizacion:view, organizacion:create, organizacion:update, organizacion:delete

// Eventos y asistencias (módulo `eventos`: planificaciones, actividades y planillas)
evento:view, evento:create
asistencia:view, asistencia:manage

// Biblioteca de documentos (módulo `normativa`: PDF/DOCX con vigencia y alcance por unidad)
normativa:view, normativa:manage

// Módulos futuros (claves definidas, sin implementar aún)
finanza:view, finanza:manage
inventario:view, inventario:manage
formacion:view, formacion:manage
```

> Fuente canónica: `PERMISSIONS` en `src/common/constantes.ts` (backend).
> El frontend replica este catálogo en `frontend/src/types/auth.ts`; la paridad
> está cubierta por `src/common/permisos-paridad.spec.ts`.

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

### Integracion (backend, requiere PostgreSQL)

```bash
npm run test:integration
```

Validan el soft-delete centralizado (extension de Prisma) contra la base real:
filtrado automatico, escape hatch `deletedAt: undefined`, alta y borrado de
adultos y reasignacion/restauracion de permisos de roles. Los datos de prueba
se crean y se eliminan en cada corrida.

### Unitarios (frontend)

```bash
cd frontend
npm test
```

Vitest + jsdom: guards de ruta (`RequierePermiso`, `permisosDeRuta`) y
comportamiento del store de sesión (login/logout/checkAuth).

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

### Integración continua (GitHub Actions)

`.github/workflows/ci.yml` corre en cada push y pull request con tres jobs paralelos:

| Job | Qué verifica |
|-----|--------------|
| `backend` | `npm ci`, `prisma generate` + `migrate deploy` (valida migraciones), `npm run build`, `npm test` y `npm run test:integration` contra PostgreSQL 16 (servicio) |
| `frontend` | `npm ci`, `npm run lint`, `npm test` (vitest) y `npm run build` |
| `e2e` | Semilla + build, arranque automático del API y de Vite, y `npx playwright test` con Chromium (`E2E_BROWSER=chromium`; local se usa `msedge`) |

En CI el E2E usa Chromium instalado por Playwright porque las máquinas Linux no traen Edge;
la semilla crea el usuario `joven.test@poseidon.com` que usa `rbac.spec.ts`.

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
## 🎨 Mejoras de UI/UX (v2.1)

### Panel de Unidades
- **Estados de carga optimizados**: Indicadores visuales mejorados durante la carga de datos
- **Estado vacío responsive**: Mensajes motivacionales cuando no hay unidades registradas
- **Filtro de búsqueda en tiempo real**: Filtrado client-side con retroalimentación visual
- **Acceso directo desde sidebar**: Navegación rápida desde el menú lateral con permisos RBAC

### Panel de Usuarios
- **Empty state interactivo**: Botón de "Inscribir Primer Agente" visible cuando no hay usuarios
- **Validaciones en tiempo real**: Feedback inmediato en formularios con Zod
- **Estado de activo/inactivo**: Indicadores visuales claros en la tabla
- **Acceso RBAC controlado**: Permisos de view/create/update/delete por rol

### Navegación y Enrutamiento
- **UnidadesPage y UsuariosPage**: Enrutamiento lazy-loaded en App.tsx
- **Sidebar coherente**: Íconos y permisos alineados con el sistema RBAC
- **Redirección inteligente**: Según rol del usuario (ADULTO_*, JOVEN, ADMIN)

### Accesibilidad Mejorada
- Headers semánticos en DataGrids para lectores de pantalla
- Contraste de colores mejorado cumpliendo WCAG AA
- Navegación completa por teclado
- Estados de foco visibles en todos los componentes interactivos

### Diseño Visual
- Tema consistente con colores sentinel-gradient
- Transiciones suaves en estados hover y active
- Grid responsivo que se adapta mobile-first
- Diálogos modales con animaciones fade-in-up

Desarrollado para la gestión profesional de grupos scouts.
