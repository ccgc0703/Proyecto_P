# 📋 PLAN DE IMPLEMENTACIÓN — Expansión del Sistema de Gestión Scout

> **Estado de ejecución** (actualizado 2026-11-06):
>
> | Fase | Estado |
> |---|---|
> | PRE (8.1 deuda bloqueante: circulares + README + AGENTS.md) | ✅ Cerrada |
> | Fase 1 — Asistencia + Eventos | ✅ Cerrada — commit `60e0c05` |
> | Fase 2 — Dashboard Ejecutivo con Métricas Reales | ✅ Cerrada — commit `3df726d` (backend 344/344 · frontend 23/23 · E2E 15/15) |
> | Fase 3 — Notificaciones in-app (decisión: sin email) | ✅ Cerrada — commit `277f31d` (backend 360/360 · integración 14/14 · frontend 30/30 · E2E 16/16) |
> | Fase 5 — Biblioteca (Documentos y Normativa) | ✅ Cerrada — commit `0427677` (backend 376/376 · integración 19/19 · frontend 31/31 · E2E 18/18) |
> | Fase 6 — Completar formación / datos-scout / programas-mundiales (decisión: permisos nuevos `datosscout:*`) | 🟡 En curso — `formacion` ✅ `a45263b` · `datos-scout` ✅ (esta entrega) · `programas-mundiales` ⬜ |
> | Fase 7 — Madurez y escala (PWA, PDF, Finanzas…; multi-grupo SOLO si aplica) | ⬜ Pendiente |
> | Fase 8 — Deuda técnica (8.2/8.3 continuo, en cada cierre) | 🔄 Continuo |
>
> Recuperado del historial de sesiones de OpenCode (sesión `ses_eed5541f6ffe…`, mensaje del 2026-11-05 15:45) y documentado aquí para que no se pierda. Las decisiones ya tomadas: notificaciones solo in-app, permisos `datosscout:*` nuevos (Fase 6), multi-grupo diferida a Fase 7 (solo se "prepara": todo modelo nuevo lleva `grupoId` o se deriva de `Unidad.grupoId`/`Usuario`).

**Estado actual verificado** (lo confirmé leyendo el código antes de armar esto):

| Hallazgo | Detalle |
|---|---|
| 🟢 `Planificacion` y `Actividad` **ya existen** en `prisma/schema.prisma:787-828` | Modelos completos con enums `TipoActividad` (REUNION...) y `EstadoActividad`, pero **sin módulo backend ni frontend** (huérfanos) |
| 🟢 Permisos ya sembrados | `evento:*`, `asistencia:*`, `finanza:*`, `inventario:*`, `normativa:*`, `formacion:*` en `prisma/seed.ts:64-75` |
| 🟡 Falta modelo `Asistencia` | No existe en el schema — hay que crearlo |
| 🟡 Dashboard pobre | Solo consume `GET /jovenes/stats` (totales por unidad: 4 números) |
| 🟡 Módulos solo-lectura | `datos-scout`, `formacion`, `programas-mundiales` = solo `GET` (2 endpoints cada uno), sin UI |
| 🟢 `Unidad.grupoId` ya existe | Con `@@unique([grupoId, tipo])` → base real para multi-grupo |
| 🔴 Deuda | Circulares Rollup, README desactualizado, 18 tests frontend, 5 specs E2E |

**Filosofía del plan:** cada fase cierra con `npm run build` + `npm test` + `lint` + smoke E2E (misma regla que usaste en el plan de progresión, que te funcionó).

---

# FASE 1 — Asistencia + Eventos

> **Prioridad: ALTA · Esfuerzo: 2-3 días · Riesgo: BAJO (reutiliza modelo existente)**

### 1.1 Por qué empiezo aquí
- Los modelos `Planificacion`/`Actividad` **ya están escritos y migrados** (las migraciones `fase1_apellido_patrulla_planificacion` están aplicadas) — nadie los usó nunca. Aprovecharlos es gratis.
- Los permisos ya existen en el seed.
- Es la operación diaria real del grupo.

### 1.2 Esquema nuevo (solo 1 modelo a crear)

```prisma
enum EstadoAsistencia {
  PRESENTE
  AUSENTE
  JUSTIFICADO
}

model Asistencia {
  id           String           @id @default(uuid())
  actividadId  String
  miembroId    String
  estado       EstadoAsistencia @default(PRESENTE)
  observacion  String?
  registradoEn DateTime         @default(now())
  // ...campos audit padrón del proyecto (createdAt/updatedAt/deletedAt/createdBy/updatedBy)
  Actividad Actividad @relation(fields: [actividadId], references: [id])
  Miembro   Miembro   @relation(fields: [miembroId], references: [id])

  @@unique([actividadId, miembroId])   // un registro por joven por actividad
  @@index([actividadId])
  @@index([miembroId])
}
```

> **Nota:** como `Planificacion`/`Actividad` ya migraron, sólo creas **1 migración** para `Asistencia`.

### 1.3 Backend — módulo `eventos` (patrón idéntico a `catalogo`)

```
src/modules/eventos/
├── eventos.module.ts
├── eventos.controller.ts
├── eventos.service.ts
├── eventos.service.spec.ts
└── dto/{create,update}-{planificacion,actividad,asistencia}.dto.ts
```

| Endpoint | Permiso | Notas |
|---|---|---|
| `POST/GET/PATCH/DELETE /eventos/planificaciones` | `evento:create/manage` | CRUD con soft delete + bloqueo 409 si tiene actividades hijas |
| `POST/GET/PATCH/DELETE /eventos/planificaciones/:id/actividades` | `evento:create/manage` | La `Actividad` **es el evento** (reunión con fecha/hora/lugar/responsable) |
| `POST /eventos/actividades/:id/asistencias` (bulk) | `asistencia:manage` | **Array** de `{miembroId, estado}` — marcar toda la unidad de una vez |
| `GET /eventos/actividades/:id/asistencias` | `asistencia:view` | |
| `GET /eventos/unidades/:unidadId/asistencias?desde&hasta` | `asistencia:view` | Para el Dashboard (fase 2) |
| `PATCH /eventos/asistencias/:id` | `asistencia:manage` | |

**Reglas de negocio clave:**
- **Scoping por unidad**: `UnitAccessPolicy` (ya existe) — `ADULTO_MANADA` solo carga asistencia de Manada. Reutilizas exactamente el guard de `/progresion`.
- **Auditoría**: eventos `ACTIVIDAD_CREATED/UPDATED/DELETED`, `ASISTENCIA_BULK` (con conteo, no fila por fila para no inundar `AuditLog`).
- **Jóvenes inactivos** (`deletedAt != null`) excluidos del listado a marcar.

### 1.4 Frontend

```
src/pages/EventosPage.tsx                    /app/eventos (selector de unidad + calendario/lista)
src/features/eventos/ListaActividades.tsx    lista por unidad con filtros de fecha
src/features/eventos/DialogoAsistencia.tsx    marcado masivo (checkbox por joven, 3 estados)
src/features/eventos/FormActividad.tsx        alta/edición (React Hook Form + Zod, ya lo usas)
```
- Ítem **Eventos** en `Sidebar.tsx` con `usePermission('evento:view')`.
- Rutas lazy en `App.tsx`.
- **No hace falta librería de calendario** en v1: lista agrupada por fecha (evita dependencia nueva).

### 1.5 Tests y cierre de fase
- `eventos.service.spec.ts`: CRUD, bloqueo 409, bulk asistencia, duplicado por `@@unique`, scoping por unidad (copias la estructura de `progresion.service.spec.ts`).
- DTO specs con `class-validator`.
- Smoke E2E manual con 2 JWT (adulto de unidad + admin).
- **Criterio de cierre:** `npm run build && npm test` verdes + `frontend build/lint` verdes.

---

# FASE 2 — Dashboard Ejecutivo con Métricas Reales

> **Prioridad: MEDIA-ALTA · Esfuerzo: 1-2 días · Depende de: Fase 1 (para métricas de asistencia)**

### 2.1 Nuevo endpoint agregado

`GET /dashboard/resumen` (permiso: vista según rol — `joven:view` o `organizacion:view`):

```jsonc
{
  "poblacion":      { "total": 142, "porUnidad": {...}, "varMensual": +4 },
  "progresion":     { "promedioPorcentaje": 34.5, "adelantosAprobadosMes": 12,
                      "solicitudesPendientes": 3, "porUnidad": [...] },
  "asistencia":     { "ultimaActividad": "...", "promedio30d": 87,
                      "tendenciaSemanal": [...], "porUnidad": [...] },
  "alertas": [  { "tipo": "SOLICITUD_PENDIENTE", "texto": "...", "link": "/app/progresion/..." },
                { "tipo": "SEGURO_POR_VENCER", "texto": "3 fichas con seguro < 30 días" } ]
}
```

- **Scoping**: reutiliza `unitPolicy.unidadesAlcance(req.user)` — igual que `jovenes.controller.ts:36`. Un `ADULTO_TROPA` ve sólo Tropa.
- Se implementa en `src/modules/dashboard/dashboard.{module,controller,service}.spec.ts` (módulo propio, no ensuciar `jovenes`).
- **Vista previa de alertas** sin fase 3: se calculan en tiempo real (consultas), no se persisten.

### 2.2 Frontend
- Reescribir `DashboardPage.tsx`: hoy sólo 4 tarjetas de conteo → tarjetas de KPI + gráfico de tendencia de asistencia + barra de progresión por unidad + lista de alertas con links.
- **Sin librería de gráficos nueva**: barras con divs/CSS (ya usas Tailwind) para no añadir peso; si luego quieres, `recharts` es la opción ligera.

### 2.3 Tests
- Spec del servicio con casos: admin ve global, adulto ve su unidad, sin datos → ceros (no crash), promedio con pool 0 → 0.

### ✅ Ejecución — CERRADA

- **Backend**: `src/modules/dashboard/` (`service` + `controller` + `module` + spec) → `GET /dashboard/resumen`, permiso `joven:view`, alcance ABAC con `unitPolicy.unidadesAlcance()` propagado a población/progresión/asistencia/alertas; alertas (`SOLICITUD_PENDIENTE`, `INDICADOR_PENDIENTE`, `SEGURO_POR_VENCER`) calculadas en tiempo real con links a `/app/progresion` y `/app/miembros`. Tendencia = 8 buckets × 7 días en una sola query (56 d). 14 tests del servicio.
- **Frontend**: `DashboardPage` consume el endpoint vía hook `useResumenDashboard` (`hooks/useDashboard.ts` + `api.dashboardApi` + `types/dashboard.ts`): KPIs reales (total/varMensual, asistencia 30 d, progresión), donut acotado al ámbito, tendencia semanal (barras CSS), progresión por unidad (barras CSS con semáforo), tarjeta de Alertas con links y estados loading/vacío/error con reintento. Rol **JOVEN** (sin `joven:view`) → 403 gestionado como "Vista restringida" sin reintento.
- **Tests**: backend 344/344 · frontend 23/23 (4 nuevos del hook) · E2E 15/15 (2 nuevos: métricas del admin + 403 del joven).
- **Ajustes derivados**: `GET /jovenes/stats` quedó sin consumidores (lo sustituye el resumen); `panel.spec` pasa de `[role="row"]` a `getByRole('row')` por el cambio de la sesión concurrente a tablas nativas.

---

# FASE 3 — Notificaciones

> **Prioridad: MEDIA · Esfuerzo: 2-3 días · Riesgo: MEDIO (primer modelo nuevo transversal)**

### 3.1 Diseño (v1 = in-app, sin email — decide tú si añades nodemailer)

```prisma
model Notificacion {
  id           String    @id @default(uuid())
  usuarioId    String
  tipo         String    // SOLICITUD_APROBACION, CUENTA_CREADA, SEGURO_POR_VENCER, CARGO_POR_VENCER...
  titulo       String
  cuerpo       String
  link         String?   // ruta interna a la que navega al click
  leidaEn      DateTime?
  createdAt    DateTime  @default(now())
  Usuario Usuario @relation(...)
  @@index([usuarioId, leidaEn])
}
```

### 3.2 Motor de eventos (patrón simple, sin colas externas)
- Servicio `NotificacionesService.publicar(usuarioIds, tipo, titulo, cuerpo, link?)`.
- **Puntos de disparo** (inyección directa en los services existentes, 1 línea cada uno):
  | Evento | Destinatarios |
  |---|---|
  | `progresion.aprobar/solicitar` | Adulto de la unidad + SYSTEM_ADMIN |
  | `users/adultos create` (cuenta nueva) | El usuario creado |
  | Alta ficha médica / vencimiento de seguro | Adulto de unidad + SYSTEM_ADMIN |
  | `organizacion` cargo creado | El usuario del cargo |
- `GET /notificaciones` + `POST /notificaciones/:id/leer` + badge en `MainLayout` (polling 60 s con `setInterval` + `useEffect`, sin websockets en v1).
- Auditoría: **no** auditar cada notificación (ruido); sí auditar los eventos que la originan (ya lo hacen).

### 3.3 Tests
- Unit: publicar, listar, marcar leída, filtro por usuario (nunca filtrar ajenas), paginación.
- Integración: tras `POST .../aprobar` existe la notificación para el adulto correcto.

### ✅ Ejecución — CERRADA

- **Esquema**: modelo `Notificacion` (relación `Usuario.Notificaciones`) con `@@index([usuarioId, leidaEn])` y `@@index([usuarioId, createdAt])`; migración `20261109172003_crear_notificaciones`.
- **Backend**: `src/modules/notificaciones/` (`service` + `controller` + `dto` + `module` + spec). `publicar()` es best-effort: **nunca lanza** (try/catch + `Logger.warn`), deduplica ids y solo notifica cuentas activas. `responsablesUnidad()` = adultos de la unidad (roles `ADULTO_*`/`REPRESENTANTE_UNIDAD`) + todos los `SYSTEM_ADMIN`, sin duplicados. `GET /notificaciones` devuelve `meta = {page,limit,total,totalPages,noLeidas}`; `POST :id/leer` idempotente (404 si es ajena); `POST leer-todas`. Las 4 rutas usan **`@SelfScope()`** sin `@RequirePermission` (alcance = id del JWT). Sin auditoría por notificación (los eventos que la originan ya auditan).
- **Disparores** (llamada directa en los services existentes): `users.create` → `CUENTA_CREADA` (cubre también `adultos.createAccount`); `progresion.solicitar` → responsables de la unidad menos el actor; `aprobar`/`rechazar` → `Joven.usuarioId` si existe (nullable) con link `/app/mi-progresion`; `ficha-medica.create` → responsables menos el actor; `organizacion.crearCargo` → el usuario del cargo. Más cron diario 03:30 `avisarSegurosPorVencer` (fichas con `seguroVigencia ≤ 30 d`, dedupe de 30 días por usuario, nunca lanza).
- **Frontend**: `types/notificacion.ts` + `notificacionesApi` (endpoints) + hook `useNotificaciones` (carga inicial + **sondeo silencioso cada 60 s** — los errores del sondeo se tragan y el badge conserva su valor — + `marcarLeida`/`marcarTodas` optimistas con reconciliación server-side). `MainLayout`: campana con badge de conteo (aria-label `Notificaciones (N sin leer)`), panel `.notif-menu` (patrón del `user-menu`, se cierra al cambiar de ruta) y clic en un ítem → marcar leída + `navigate(link)`.
- **Tests**: backend **360/360** (33 suites; 16 nuevos) · integración **14/14** (4 suites; 5 nuevos) · frontend **30/30** (7 nuevos del hook, con fake timers para el polling) · E2E **16/16** (1 nuevo: alta por API → badge `1` → panel → "Cuenta creada" → Marcar todas → badge a 0 → cleanup).

---

# FASE 5 — Biblioteca (Documentos y Normativa)

> **Prioridad: MEDIA · Esfuerzo: 1-2 días · Permisos `normativa:view/manage` ya sembrados**

### 5.1 Esquema

```prisma
enum CategoriaNormativa {
  LEY_PROMESA  REGLAMENTO  ACTA  CIRCULAR  OTRO
}
model Documento {
  id, titulo, categoria, descripcion,
  archivoUrl String,        // v1: storage local /uploads/normativa/<uuid>.pdf
  version Int @default(1),
  vigente Boolean @default(true),
  unidadId String?,         // null = nacional (igual lógica que catálogo progresión)
  ...audit padrón
}
```

### 5.2 Backend
- `POST /normativa/documentos` (multipart `file` + metadata) — **multer** con whitelist `.pdf/.docx`, límite 10 MB, nombre aleatorio (nunca el original en disco), servido con `ResFile` detrás de guard `normativa:view`.
- `GET /normativa/documentos?categoria=&vigente=`, `GET /:id`, `PATCH /:id`, `DELETE /:id` (soft).
- **Auditoría:** `DOCUMENTO_CREATED/DELETED`.

### 5.3 Frontend
- `DocumentosPage.tsx`: grid con chips por categoría, buscador, subida (admin), descarga.
- Sidebar con `normativa:view`.

### 5.4 Seguridad (importante)
- Extensión de `.gitignore` con `/uploads/`.
- Validar MIME real del archivo (magic bytes), no sólo la extensión.

### ✅ Ejecución — CERRADA

- **Esquema**: enum `CategoriaNormativa` (`LEY_PROMESA/REGLAMENTO/ACTA/CIRCULAR/OTRO`) + modelo `Documento` con `archivoUrl` relativo (`normativa/<uuid>.<ext>`), `mimeType`, `tamano`, `nombreOriginal`, `version`, `vigente`, `unidadId` (null = nacional), auditoría padrón (`createdBy/updatedBy`) y `deletedAt`; migración `20261110170528_crear_documentos`. `Documento` añadido a `MODELOS_SOFT_DELETE` (el spec que compara con el schema lo verifica).
- **Backend**: `src/modules/normativa/` (`archivos.ts` + service + controller + dtos + module + specs). `POST /normativa/documentos` multipart (`file` + metadata) con multer en disco, nombre aleatorio (nunca el original), whitelist `.pdf/.docx` y límite 10 MB; se valida la **firma real** (`%PDF`, `PK\x03\x04`) y todo archivo inválido o que falle al crear se borra del disco. `GET /documentos` (filtros `categoria`, `vigente`, `unidadId`, `q`, `page`/`limit`), `GET /:id`, `GET /:id/archivo` (`StreamableFile` con `Content-Disposition` saneado y `nosniff`), `PATCH /:id`, `DELETE /:id` (soft). Ámbito por unidad con `UnitPolicy` (nacionales visibles para todos). `mimeType` se normaliza a partir de la extensión. Auditoría `DOCUMENTO_CREATED/UPDATED/DELETED`.
- **Permisos**: `normativa:manage` añadido a `SYSTEM_ADMIN`, `NATIONAL_BOARD` y `NATIONAL_EXECUTIVE` en `prisma/seed.ts` (seed re-ejecutado).
- **Frontend**: `types/documento.ts` + `normativaApi` (subida multipart forzando el header para que axios ≥1.13 no serialice el `FormData` a JSON, descarga autenticada por blob) + `DocumentosPage` (chips por categoría con conteo, buscador, "solo vigentes", grid de tarjetas, subida con zod y validación PDF/DOCX ≤ 10 MB, alternar vigencia, borrado con confirmación) + ruta `/app/documentos` (lazy) con guardia `normativa:view`, título en el topbar y entrada "Documentos" en el sidebar.
- **Tests**: backend **376/376** (34 suites; 16 nuevos) · integración **19/19** (5 suites; 5 nuevos) · frontend **31/31** (1 nuevo de paridad de rutas) · E2E **18/18** (2 nuevos: alta real de PDF → vigencia → borrado; joven sin permiso → Acceso Denegado).

---

# FASE 6 — Completar Módulos Solo-Lectura

> **Prioridad: MEDIA · Esfuerzo: 3-4 días (3 módulos) · Mejor: 1 por entrega**

Hoy todos sólo exponen 2 `GET`:

| Módulo | Hoy | Completar hasta | UI |
|---|---|---|---|
| **`formacion`** | `GET /`, `GET /adulto/:id` | + `POST`, `PATCH`, `DELETE` con `formacion:manage` (permiso ya existe; **sólo SYSTEM_ADMIN lo tiene hoy** → amplía matriz a GROUP_LEADER y SECRETARIO) | `FormacionPage`: certificaciones/cursos por adulto |
| **`datos-scout`** | `GET /`, `GET /miembro/:id` | + `POST/PATCH` (libreta scout, traspasos, historial de unidad) con permiso nuevo `datosscout:*` **o** reutilizar `joven:update` (decisión tuya, te la dejo abajo) | Sección dentro de `MemberProfile` (pestaña "Expediente") |
| **`programas-mundiales`** | `GET /catalogo`, `GET /miembro/:id` | + `POST/PATCH/DELETE` enlazar programa a miembro (`WHC`, Jamboree...) con permiso nuevo `programamundial:*` | Botón en `MemberProfile` + listado |

**Por módulo:** DTOs con `class-validator` + guards `JwtAuthGuard`/`PermissionsGuard` + auditoría + spec de servicio (~15 tests) + smoke.

> ⚠️ **Pregunta de diseño para ti:** en `datos-scout`, ¿permisos nuevos (`datosscout:view/manage` — habría que añadirlos al seed) o reutilizar `joven:view/update` (más rápido, pero menos granular)? Mi recomendación: **permisos nuevos** para mantener el patrón `entidad:acción` que ya usas en todos lados.

### ✅ Ejecución — `formacion` CERRADO

- **Backend**: `src/modules/formacion/` con `dto/create-formacion.dto.ts` + `update-formacion.dto.ts` (`PartialType`, `nombre`/`director` 3-150, `fecha` ISO 8601, `adultoId` UUID). Endpoints `GET /`, `GET /adultos`, `GET /adulto/:adultoId`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (soft-delete). **ABAC** por unidad del adulto responsable (`Adulto.Miembro.unidadId`): listados filtran por `UnitPolicy.unidadesAlcance`, lecturas puntuales *fail-closed* (404 fuera de alcance) y mutaciones exigen `assertCanManageUnit` (incluida la validación del adulto nuevo al reasignar). Auditoría `FORMACION_CREATED/UPDATED/DELETED`.
- **Compatibilidad**: `GET /` y `GET /adulto/:id` siguen devolviendo el array directo; los nuevos `GET /:id`, `POST`, `PATCH`, `DELETE` usan el envelope `{success,message,data}`.
- **Endpoint `GET /formacion/adultos`**: selector de adulto para el alta, con `formacion:view` en lugar de `user:view` (hay roles con `formacion:manage` que no tienen `user:view`). Devuelve `id`, nombres/apellidos, `unidadId` y `Unidad` aplanados.
- **Permisos**: el plan hablaba de `SECRETARIO`, rol que ya no existe (renombrado a `REPRESENTANTE_UNIDAD`). Matriz final en `prisma/seed.ts`: `formacion:view` + `formacion:manage` para `GROUP_LEADER` y `REPRESENTANTE_UNIDAD` (además de `SYSTEM_ADMIN`); seed re-ejecutado.
- **Frontend**: `types/formacion.ts` + `formacionApi` (`listar`, `listarAdultos`, `listarPorAdulto`, `obtener`, `crear`, `actualizar`, `eliminar`) + `FormacionPage` (buscador, filtro por adulto, grid de tarjetas con fecha en UTC, alta/edición en diálogo con zod, borrado con confirmación) + ruta lazy `/app/formacion` con guardia `formacion:view`, título en el topbar y entrada "Formación" (icono `School`) en el sidebar.
- **Fix de concurrencia (detectado en el gate E2E)**: `DocumentosPage` y `FormacionPage` lanzaban `cargar()` en paralelo (el doble efecto de `StrictMode` y las acciones encadenadas). Sin guardia de secuencia, una respuesta lenta podía llegar última y repintar datos obsoletos (resucitando el registro recién borrado) o dejar el skeleton activo. Ahora cada carga lleva un número de petición y solo la última escribe estado.
- **Tests**: backend **393/393** (34 suites; 17 nuevos) · integración **26/26** (6 suites; 7 nuevos, incluida la matriz ABAC y el soft-delete) · frontend **32/32** (1 nuevo de paridad de rutas) · E2E **20/20** (2 nuevos: alta → edición → borrado; joven sin permiso → Acceso Denegado).
- **Nota de gate**: en este host el dev server de Vite (compartido con otro proceso) tarda >30 s en transformar módulos en frío y produce timeouts de `page.goto` ajenos al código. La suite se validó contra el build de producción (`npm run build` + `vite preview`, `E2E_BASE_URL=http://localhost:4173`): **20/20**.

### ✅ Ejecución — `datos-scout` CERRADO

- **Decisión aplicada**: permisos nuevos `datosscout:view/manage` (no se reutiliza `joven:*`), tal como recomendaba el plan. Añadidos a `PERMISOS_SEED` y repartidos con la misma matriz que `joven:view`/`joven:update`; `JOVEN` recibe `datosscout:view` para su propio expediente. Seed re-ejecutado (17 roles con los permisos).
- **Backend**: `src/modules/datos-scout/` con `dto/create-datos-scout.dto.ts` y `dto/update-datos-scout.dto.ts` (`PartialType`; `cargoActual` ≤80, `observaciones` ≤1000, las tres fechas ISO 8601 y `patrullaId` UUID, todos opcionales y anulables). Endpoints `GET /` (array, filtrado), `GET /miembro/:miembroId` (objeto, compat con el contrato anterior), `POST /` (**409** si el miembro ya tiene expediente) y `PATCH /miembro/:miembroId` (**upsert**: crea si no existe).
- **ABAC**: alcance por `Miembro.unidadId` con `UnitPolicy.unidadesAlcance`; lecturas puntuales *fail-closed* (404 fuera de alcance); `patrullaId` se valida contra la unidad del miembro (400 si es de otra unidad); `SelfScopePolicy` deja que un `JOVEN` lea su propio expediente. Auditoría `DATOS_SCOUT_CREATED`/`DATOS_SCOUT_UPDATED`.
- **Envelope**: sólo `POST`/`PATCH` devuelven `{success,message,data}`; los dos `GET` históricos mantienen su forma original para no romper consumidores.
- **Frontend**: `types/datosScout.ts` + `datosScoutApi` (`listar`, `obtenerPorMiembro`, `crear`, `actualizar`) + `hooks/useDatosScout.ts` (con guardia de secuencia y 404 → `null`) + `features/datosScout/DatosScoutResumen.tsx` y `DatosScoutForm.tsx` (diálogo zod con patrullas de la unidad; si el catálogo no carga se conserva la patrulla actual para no borrarla al guardar). La sección "Datos Scout" vive en `MemberProfile` bajo Ficha Médica, visible con `datosscout:view` y editable con `datosscout:manage`.
- **Tests**: backend **409/409** (34 suites; 21 del módulo) · integración **36/36** (7 suites; `datos-scout.integration.spec.ts` nuevo con 10: alta, upsert, conflicto, ABAC, patrulla ajena y soft-delete) · frontend **32/32** · E2E **22/22** (2 nuevos: edición del expediente desde el perfil con restauración de los valores originales; `self-scope` del joven comprobando 403 en listado/ajeno y 200/404 en el propio).
- **Nota de gate E2E**: el locator del formulario se ancla a su título (`[role="dialog"]` filtrado por el heading "Editar Datos Scout") porque `locator('[role="dialog"]').last()` pasa a resolver el panel del perfil en cuanto el diálogo se desmonta, y `toBeHidden()` fallaba con un falso negativo.

---

# FASE 7 — Madurez y Escala (incluye MULTI-GRUPO explicado)

## 7a. MULTI-GRUPO — explicación detallada

### Qué es hoy (la realidad que verifiqué)
Tu sistema **ya modela** la jerarquía nacional en `OrganizacionNodo`: `Consejo Nacional → Dirección Ejecutiva → Regiones → Distritos → GRUPOS → Unidades`. Y `Unidad.grupoId` apunta al nodo GRUPO, con `@@unique([grupoId, tipo])` (una Manada por grupo). **Pero todo el resto del sistema es mono-grupo:** no existe aislamiento de datos entre grupos.

### El problema concreto
Si mañana se dan de alta **Grupo Scout A** y **Grupo Scout B**:
- Un `SYSTEM_ADMIN` de A ve los jóvenes, fichas médicas y finanzas de B en los listados → **fuga de datos**.
- El endpoint `GET /jovenes` no filtra por grupo: mezclaría ambos.
- El catálogo de progresión es deliberadamente **nacional compartido** (tu propio esquema lo dice en el comentario de la línea 106) → eso **se mantiene**, es correcto.

### Qué implica hacerlo bien (las 4 capas)

| Capa | Cambio |
|---|---|
| **1. Datos** | `grupoId` no nulo en `Usuario`, `Miembro`, `Eventos`, `Fichas`, `Documentos`... (hoy sólo `Unidad` lo tiene). **Migración de backfill** → todos los datos existentes al "Grupo demo" que ya crea el seed. |
| **2. Backend (denegación por defecto)** | Nuevo `GrupoScopePolicy` (provider, al lado de `UnitAccessPolicy`): toda query pasa por `where.grupoId = grupoDelUsuario`. Roles `NATIONAL_*`/`SYSTEM_ADMIN` bypass (lista fija, igual que `UNIT_BYPASS_ROLES`). Refactor de **todos** los services — es el paso caro. |
| **3. Frontend** | Selector de "contexto de grupo" en el header (persistido en Zustand). Los labels del sidebar y el dashboard cambian de contexto. |
| **4. Seed** | 2 grupos de prueba + usuarios de cada uno → test de integración que prueba **aislamiento** (usuario de A no ve datos de B). |

### Cuándo hacerlo (recomendación sincera)
- **Si eres UN solo grupo scout** → **NO lo hagas ahora.** Es el refactor más caro del plan (3-5 días, toca todos los services) y no aporta valor visible. Déjalo como **Fase 7 futura**, pero toma 2 decisiones *hoy* para no bloquearte después:
  1. **Todo modelo nuevo** (Asistencia, Documento, Notificación) **debe llevar `grupoId` o derivarse de `Unidad.grupoId`** → asistencia/documentos se derivan vía unidad (barato), notificaciones vía usuario.
  2. **Nunca** consultar unidades sin `grupoId` en código nuevo.
- **Si apuntan a federación/región** → hacerlo **después de las fases 1-6**, como fase propia, con su plan detallado.

> **Decisión que necesito de ti:** ¿hay un solo grupo, o ya hay/va a haber varios grupos usando el sistema a la vez? Eso define si la 7a se ejecuta o queda anotada.

### Otras propuestas de madurez y escala

| Iniciativa | Descripción | Esfuerzo | Cuándo |
|---|---|---|---|
| **PWA offline** | `vite-plugin-pwa`: manifest + service worker cache. **En campo sin señal**, el adulto carga asistencia y sincroniza al volver (IndexedDB + cola). Es el mayor diferencial real para scouts. | 3-5 días | Tras Fase 1 |
| **Export PDF** | `pdfmake`: constancia de progresión, carnet, listado de asistencia. Ya manejas `exceljs` → patrón conocido (`StreamableFile`). | 1-2 días | Tras Fase 1 |
| **QR de presencia** | La `Actividad` genera QR; el joven escanea en la reunión → auto-asistencia. Requiere `@zxing/browser`. | 2-3 días | Tras Fase 1 |
| **Finanzas (cuotas)** | Modelo `Cuota/Pago`, permisos `finanza:*` ya sembrados, cobro mensual por joven, estados, reporte. | 4-5 días | Tras Fase 1 |
| **Inventario** | Préstamos de material con devolución. Permisos ya sembrados. | 2-3 días | posterior |
| **Multi-grupo** | Ver arriba. | 3-5 días | Sólo si aplica |
| **i18n** | `react-i18next` (ES/EN/PT) — WOSM es internacional. | 3 días | Baja prioridad |
| **Observabilidad** | `@sentry/node` + métricas `/metrics` + alertas. | 1-2 días | Cuando haya producción real |

---

# FASE 8 — Corrección de Deuda Técnica

> **Prioridad: ALTA (parte de ella va ANTES que todo) · Ejecutar de 1a en adelante**

### 🔴 8.1 ANTES de la Fase 1 (medio día) — bloquea la velocidad

| Ítem | Acción |
|---|---|
| **Circulares Rollup** | ~15 páginas importan de `'../api'` (reexport) → cambiar a `'../api/endpoints'` **o** `output.manualChunks` en `vite.config.ts`. Sin esto cada fase nueva añade warnings. **Recomendación:** `manualChunks` (1 línea, cero riesgo de romper imports). |
| **README desactualizado** | Tabla de módulos (17 → faltan 8), árbol de estructura, recuento de tests (89 → 276), email de prueba `caminantes@test.com` → `comunidad@test.com`. |
| **`AGENTS.md` del backend** | `npm run lint` aparece listado "frontend CI" pero no existe script `lint` en la raíz → aclarar. |

### 🟡 8.2 En paralelo a cada fase (continuo)

| Ítem | Acción | Métrica objetivo |
|---|---|---|
| **Tests frontend (18)** | Vitest con Testing Library por página nueva + retro-cargar las críticas (`MiembrosPage`, `PerfilPage`) | 18 → 60+ |
| **E2E (5 specs)** | Un spec por flujo nuevo (`eventos.spec.ts`, `documentos.spec.ts`...) | 5 → 10 |
| **Directorios `features/` vacíos** | `dashboard`, `jovenes`, `perfil`, `staff`, `unidades`, `usuarios` = 0 archivos → **decisión:** mover ahí el código de `pages/` gradualmente (por fase que se toque) o borrarlos y actualizar `frontend/AGENTS.md` | 6 → 0 vacíos |
| **Worker Jest que no cierra** | Warning *"A worker process has failed to exit gracefully"* → `--detectOpenHandles`, casi seguro el timer de retención de auditoría sin `.unref()` en tests → `afterEach(jest.useRealTimers())` | Warning eliminado |
| **Deprecación Node 20 en CI** | Annotations de GitHub: `actions/checkout@v4`/`setup-node@v4` con Node 20 forzado a 24 → subir a `@v5` | CI sin warnings |

### 🟢 8.3 Higiene continua
- `.opencode/`, `AGENTS.md` raíz, `test.txt`, `frontend/maqueta/`, `calendario-mockup.html`, `skills-lock.json` → **decidir**: `.gitignore` o borrar (son del entorno/agente, no del producto).
- Docs por fase: cada fase añade su sección al `docs/` (igual que hiciste con `plan-progresion.md` que te funcionó muy bien).

---

# 🗓️ ORDEN EJECUTADO RECOMENDADO (resumen)

```
PRE (medio día)  →  F8.1 deuda bloqueante (circulares + README)
  │
Fase 1 (2-3 d)   →  Asistencia + Eventos  ← modelo Act/Planif ya existe, sólo 1 migración
  │
Fase 2 (1-2 d)   →  Dashboard con métricas reales (usa Fase 1)
  │
Fase 3 (2-3 d)   →  Notificaciones in-app
  │
Fase 5 (1-2 d)   →  Biblioteca/Documentos
  │
Fase 6 (3-4 d)   →  Completar formación, datos-scout, programas-mundiales
  │
Fase 7 (varia)   →  PWA, PDF, Finanzas... + multi-grupo SOLO si aplica
  │
Fase 8 (cont.)   →  tests/E2E/deuda en cada cierre de fase
```

**Total estimado fases 1-6 + deuda inicial: ~12-15 días de trabajo.**

---

## ❓ Decisiones que necesito antes de empezar

1. **¿Un solo grupo o varios?** → define si la multi-grupo se ejecuta o sólo se "prepara" (manteniendo `grupoId` en los modelos nuevos).
2. **Notificaciones: ¿sólo in-app (v1) o ya email?** → nodemailer añade ~1 día y requiere SMTP (¿tienes?).
3. **Permisos de `datos-scout`: ¿nuevos (`datosscout:*`) o reutilizar `joven:*`?** → recomiendo nuevos.
4. **¿Arranco por el PRE (deuda bloqueante) + Fase 1?** → es lo que yo haría.

Dime estas 4 y **cambia a un agente de implementación** para que ejecute; yo en modo plan no puedo escribir código, pero el plan queda listo aquí para que se lo pases tal cual.