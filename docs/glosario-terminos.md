# 📖 Glosario de Términos — Sistema de Gestión Scout

> **Propósito:** inventario único de todos los términos implementados en el proyecto
> (dominio scout, modelo de datos, enums, roles, permisos, módulos, eventos de auditoría
> y términos técnicos), con su fuente de verdad, para revisarlos y corregir las
> discrepancias detectadas (sección final).
>
> **Fuentes consultadas:** `prisma/schema.prisma`, `prisma/seed.ts`,
> `src/common/constantes.ts`, `src/modules/**`, `frontend/src/types/auth.ts`,
> `frontend/src/App.tsx`, `README.md`, `docs/plan-progresion.md`, `AGENTS.md`,
> `frontend/AGENTS.md`.

---

## 1. Conceptos de dominio scout

| Término | Definición en el sistema | Fuente |
|---|---|---|
| **Miembro** | Persona física base (nombres, apellidos, cédula, fecha de nacimiento, género). Es 1:1 con `Joven` o `Adulto` según `tipo`. | `schema.prisma` → `model Miembro` |
| **Joven** | Miembro menor que participa en un programa de progresión. Requiere `Representante` (acudiente) y opcionalmente vincula un `Usuario`. | `model Joven` |
| **Adulto** | Miembro mayor (ocupación, teléfono, dirección). Puede tener `Formaciones` y `Usuario` vinculado. | `model Adulto` |
| **Representante** | Acudiente/tutor legal de un joven (nombre, cédula, parentesco). | `model Representante` |
| **Usuario** | Cuenta de acceso al sistema (email + password, JWT). Puede existir sin estar vinculado a un Miembro. | `model Usuario` |
| **Unidad** | Unidad scout donde vive el joven: **Manada, Tropa, Comunidad, Clan**. Instancia por grupo (`@@unique([grupoId, tipo])`). | `model Unidad`, `enum TipoUnidad` |
| **Patrulla** | Subgrupo dentro de una unidad (nombre, color). El joven se vincula vía `DatosScout.patrullaId`. | `model Patrulla` |
| **DatosScout** | Extensión del miembro: fechas de registro/ingreso/promesa, cargo actual, observaciones y patrulla. | `model DatosScout` |
| **Etapa** | Rango etareo/ámbito del Programa de Jóvenes, **1 a 6**. 1ª–2ª = Manada, 3ª–4ª = Tropa, 5ª = Comunidad, 6ª = Clan. | `model Etapa`, `plan-progresion.md §2` |
| **Área de crecimiento** | Categoría de indicadores: **Corporalidad, Creatividad, Carácter, Afectividad, Sociabilidad, Espiritualidad** (6). | `model AreaCrecimiento` |
| **Indicador de logro** | Comportamiento observable a evaluar (código + texto), con `unidad`, `etapa`, `area` y `orden`. ~521 en total. | `model IndicadorLogro` |
| **Prueba aislada** | Subconjunto de ítems (indicadores con `area.tipo = PRUEBA_ADELANTO`) que gating un adelanto. Si tiene 0 ítems, la aprobación se bloquea. | `enum TipoArea`, `plan-progresion.md §5` |
| **Adelanto** | Nivel/rango alcanzable dentro de una unidad (4–5 por unidad), con `edadMinima` y `umbralPorcentaje` (se almacena %, no conteo). | `model Adelanto` |
| **Progresión** | Instancia de un joven avanzando hacia un adelanto (`EN_CURSO → SOLICITADA → APROBADA/RECHAZADA`). Única por (joven, adelanto). | `model Progresion` |
| **Estado de logro** | Estado de un indicador para un joven (`EstadoLogroJoven`). Único por (joven, indicador). | `model EstadoLogroJoven` |
| **Condecoración** | Distinción del catálogo que se puede **otorgar** a un miembro (`MiembroCondecoracion`). | `model Condecoracion` |
| **Programa mundial** | Programa/Desafío/Iniciativa mundial en el que participa un miembro (`MiembroProgramaMundial` con estado y fechas). | `model ProgramaMundial` |
| **Formación** | Curso/capacitación de un adulto (nombre, fecha, director). | `model Formacion` |
| **Ficha médica** | Registro médico único por miembro (1:1) con tablas hijas: alergias, medicamentos, condiciones, vacunas + consentimiento. | `model FichaMedica` |
| **Planificación** | Periodo planificado (título, fechas, unidad, estado) que contiene **Actividades**. | `model Planificacion` |
| **Actividad** | Evento puntual dentro de una planificación (reunión, campamento, excursión, servicio comunitario, taller, ceremonia, competencia, otro). | `model Actividad` |
| **Estructura organizacional** | Árbol jerárquico de nodos: **Consejo Nacional → Dirección Ejecutiva → Región → Distrito → Grupo** (niveles 1–5). | `enum TipoNodoOrganizacion`, `model OrganizacionNodo` |
| **Cargo / CargoAsignación** | Cargo que ocupa un usuario en un nodo con vigencia (`desde`/`hasta`). Cargos por tipo de nodo en `CARGOS_POR_TIPO` (`organizacion.service.ts`). | `model CargoAsignacion` |
| **Grupo scout** | Nodo `GRUPO` del árbol organizacional al que pertenecen las unidades (ej. "Grupo Scout Poseidon"). | `OrganizacionNodo.tipo = GRUPO` |
| **Seisenas** | Sin implementación: el comentario `// Patrullas / Seisenas` de `schema.prisma` se corrigió a `// Patrullas / Secciones` (§10.9 ✅). | `schema.prisma` |

### Unidades y rangos de edad (referenciales, sin validación)

| Unidad | Tipo | Edad | Etapas |
|---|---|---|---|
| Manada | `MANADA` | 6–10 | 1ª y 2ª |
| Tropa | `TROPA` | 10–15 | 3ª y 4ª |
| Comunidad | `COMUNIDAD` | 15–18 | 5ª *(antes "Caminantes")* |
| Clan | `CLAN` | 18–21 | 6ª (+20 indicadores de la 5ª) |

### Adelantos por unidad (catálogo)

| Unidad | #1 (prueba aislada) | #2 (50%) | #3 (70%) | #4 (80%) | #5 (100%) |
|---|---|---|---|---|---|
| Manada | Huella Fresca (13 ítems) | Huella Alerta | Huella Ágil | Huella Libre | Lobo Saltarín |
| Tropa | Aventurero (9 ítems) | Explorador | Pionero | Scout de Bolívar | — |
| Comunidad | Peregrino (6 ítems) | Precursor | Viajero | Visionario | — |
| Clan | Expedicionario (6 ítems) | Descubridor | Fundador | Rover Ciudadano | — |

---

## 2. Enums y estados (`prisma/schema.prisma`)

| Enum | Valores | Uso |
|---|---|---|
| `Genero` | MASCULINO, FEMENINO | Miembro |
| `TipoMiembro` | JOVEN, ADULTO | Miembro |
| `EstadoMiembro` | ACTIVO, INACTIVO, EGRESADO | Miembro |
| `TipoProgramaMundial` | PROGRAMA_MUNDIAL, DESAFIO, INICIATIVA | ProgramaMundial |
| `EstadoProgramaMundial` | PENDIENTE, EN_CURSO, COMPLETADO | MiembroProgramaMundial |
| `EstadoPlanificacion` | BORRADOR, APROBADO, EN_CURSO, COMPLETADO, CANCELADO | Planificacion |
| `TipoActividad` | REUNION, CAMPAMENTO, EXCURSION, SERVICIO_COMUNITARIO, TALLER, CEREMONIA, COMPETENCIA, OTRO | Actividad |
| `EstadoActividad` | PENDIENTE, EN_CURSO, COMPLETADA, CANCELADA | Actividad |
| `TipoSangre` | A/B/AB/O ± POSITIVO/NEGATIVO, DESCONOCIDO | FichaMedica |
| `Severidad` | LEVE, MODERADA, SEVERA | AlergiaFichaMedica |
| `EstadoLogro` | PENDIENTE, EN_PROCESO, PENDIENTE_APROBACION, COMPLETADO | EstadoLogroJoven (indicador) |
| `EstadoProgresion` | EN_CURSO, SOLICITADA, APROBADA, RECHAZADA | Progresion (adelanto) |
| `TipoArea` | AREA_CRECIMIENTO, PRUEBA_ADELANTO | AreaCrecimiento |
| `TipoUnidad` | MANADA, TROPA, COMUNIDAD, CLAN | Etapa, IndicadorLogro, Adelanto, AreaCrecimiento, **Unidad.tipo** |
| `TipoNodoOrganizacion` | CONSEJO_NACIONAL, DIRECCION_EJECUTIVA, REGION, DISTRITO, GRUPO | OrganizacionNodo (no confundir con niveles RBAC) |

---

## 3. Roles RBAC (23 — fuente: `prisma/seed.ts` + `RBAC_ROLES` en `src/common/constantes.ts`)

| Código | Descripción | Nivel (`ROL_HIERARCHY`) |
|---|---|---|
| `SYSTEM_ADMIN` | Administrador del Sistema — acceso total (técnico) | 1 |
| `NATIONAL_BOARD` | Consejo Nacional | 2 |
| `NATIONAL_EXECUTIVE` | Director Ejecutivo Nacional | 3 |
| `NATIONAL_DIR_JOVENES` | Director Nacional del Programa de Jóvenes | 4 |
| `NATIONAL_DIR_ADULTOS` | Director Nacional de Adultos en el Movimiento | 4 |
| `NATIONAL_DIR_DESARROLLO` | Director Nacional de Desarrollo Institucional | 4 |
| `NATIONAL_COLABORADOR` | Cooperador Nacional | 5 |
| `REGION_COMMISSIONER` | Comisionado Regional | 6 |
| `REGION_ASSISTANT` | Asistente de Programa Regional | 7 |
| `REGION_COLABORADOR` | Cooperador Regional | 8 |
| `DISTRICT_COMMISSIONER` | Comisionado Distrital | 9 |
| `DISTRICT_ASSISTANT` | Asistente de Programa Distrital | 10 |
| `DISTRICT_COLABORADOR` | Cooperador Distrital | 11 |
| `GROUP_LEADER` | Jefe de Grupo | 12 |
| `GROUP_SUBLEADER` | Subjefe de Grupo | 13 |
| `REPRESENTANTE_UNIDAD` | Representante de Unidad *(antes `SECRETARIO`)* | 14 |
| `ADULTO_MANADA` | Adulto de Unidad Manada | 15 |
| `ADULTO_TROPA` | Adulto de Unidad Tropa | 15 |
| `ADULTO_COMUNIDAD` | Adulto de Comunidad *(antes `ADULTO_CAMINANTES`)* | 15 |
| `ADULTO_CLAN` | Adulto de Unidad Clan | 15 |
| `ADULTO_COLABORADOR` | Adulto Colaborador | 16 |
| `CONSULTOR` | Consultor — solo lectura | 17 |
| `JOVEN` | Joven miembro — acceso propio (self-scope) | 18 |

**Regla de asignación:** un usuario solo asigna roles de nivel numérico **mayor** (menor privilegio) que el suyo.
**Regla de acceso por unidad:** `ADULTO_*` solo ven jóvenes de su unidad; `SYSTEM_ADMIN`, `GROUP_LEADER`, `GROUP_SUBLEADER` ven todas.

**Roles legacy** (nombres en español, `ROLES` + `LEGACY_TO_RBAC_ROLE`): **eliminados** del
código (§10.5 ✅). Solo quedaban en `roles.guard.ts`, que tampoco se usaba en ningún
endpoint y fue borrado junto con `roles.decorator.ts`.

**Cargos por nodo** (`CARGOS_POR_TIPO`, ≠ roles): `MIEMBRO_CONSEJO`; `DIR_EJECUTIVO`, `DIR_PROGRAMA_JOVENES`, `DIR_ADULTOS_MOVIMIENTO`, `DIR_DESARROLLO_INSTITUCIONAL`, `COOPERADOR_NACIONAL`; `COMISIONADO_REGIONAL`, `ASISTENTE_PROGRAMA`, `COOPERADOR_REGIONAL`; `COMISIONADO_DISTRITAL`, `COOPERADOR_DISTRITAL`; `JEFE_GRUPO`, `SUBJEFE_GRUPO`, `REPRESENTANTE_UNIDAD`, `ADULTO_COLABORADOR`.

---

## 4. Permisos (`modulo:accion`)

### Implementados y sembrados (`PERMISOS_SEED`)

| Módulo | Permisos |
|---|---|
| `users` | `user:create`, `user:view`, `user:update`, `user:delete` |
| `jovenes` | `joven:create`, `joven:view`, `joven:update`, `joven:delete` |
| `unidades` | `unidad:create`, `unidad:view`, `unidad:update`, `unidad:delete` |
| `administrativo` | `representante:create`, `representante:view`, `representante:update`, `representante:delete` |
| `scout` (progresión) | `progresion:create`, `progresion:view`, `progresion:update`, `progresion:aprobar` |
| `scout` (catálogo) | `catalogo:view`, `catalogo:manage` |
| `scout` (condecoraciones) | `condecoracion:create`, `condecoracion:view`, `condecoracion:update`*, `condecoracion:delete`*, `condecoracion:otorgar` |
| `medico` | `medico:view`, `medico:update` |
| `rbac` | `rbac:view`, `rbac:manage`, `rbac:assign-role` |
| `perfil` (self-scope) | `self:view`, `self:update` |
| `organizacion` | `organizacion:view`, `organizacion:create`, `organizacion:update`, `organizacion:delete` |
| `formacion` | `formacion:view`, `formacion:manage` |
| `datos-scout` | `datosscout:view`, `datosscout:manage` |
| `programas-mundiales` | `programamundial:view`, `programamundial:manage` |

\* `condecoracion:update` y `condecoracion:delete` **añadidos al catálogo** en esta revisión (§10.1 ✅); antes solo existían en la matriz de asignación.

### Claves futuras (definidas en `PERMISSIONS`, sin módulo implementado)

| Permiso | Estado |
|---|---|
| `normativa:*`, `finanza:*`, `evento:*`, `inventario:*`, `asistencia:*` | Claves futuras, sin módulo implementado. Sincronizadas frontend ↔ backend (§10.7 ✅). |

**Retirados en esta revisión:** `progresion:delete` (§10.2 ✅) y `medico:edit` (§10.4 ✅).
`npm run seed` los elimina de `Permiso`/`RolPermiso` de forma idempotente.

> **Paridad backend ↔ frontend:** `src/common/permisos-paridad.spec.ts` lee ambos
> archivos con `fs` y compara los conjuntos `'modulo:accion'`.

---

## 5. Módulos backend y prefijos de endpoint

| Módulo (`@Controller`) | Rutas principales | Permiso(s) requerido(s) |
|---|---|---|
| `auth` | `POST /auth/login`, `/logout`, `/refresh`, `GET /auth/me` | — (público/JWT) |
| `users` | CRUD + `PATCH /users/me`, `PATCH /users/:id/password` | `user:*`, `self:*` |
| `unidades` | CRUD + `GET/POST /unidades/:id/patrullas` | `unidad:*` |
| `jovenes` | CRUD + `GET /jovenes/stats`, `GET/PATCH /jovenes/mi-perfil`, `POST /jovenes/:id/cuenta` | `joven:*`, `self:*` |
| `administrativo` | `representantes` CRUD + `POST /administrativo/ficha-medica` | `representante:*` |
| `scout` | `condecoraciones` CRUD + `POST /scout/otorgar-condecoracion` | `condecoracion:*` |
| `ficha-medica` | `GET /ficha-medica/miembro/:id`, CRUD anidado | `medico:*` |
| `rbac` | `GET/POST /rbac/roles`, `POST /rbac/roles/:id/permisos`, `GET /rbac/permisos` | `rbac:*` |
| `audit` | `POST /audit/retencion?dias=N` (logs inmutables) | `rbac:manage` |
| `catalogo` | `areas`, `etapas`, `indicadores`, `adelantos` (CRUD) | `catalogo:view/manage` |
| `eventos` | planificaciones CRUD, actividades CRUD (`POST /eventos/planificaciones/:id/actividades`, `PATCH/DELETE /eventos/actividades/:id`), planilla `GET/POST /eventos/actividades/:id/asistencias`, `PATCH /eventos/asistencias/:id`, **`DELETE /eventos/asistencias/:id`** (deshacer marca, 7b), **`GET /eventos/actividades/:id/qr`** (QR, 7b), **`POST /eventos/presencia`** (auto-registro, 7b), `GET /eventos/unidades/:unidadId/asistencias` | `evento:view/create`, `asistencia:view/manage`; `self:update` sólo en `POST /eventos/presencia` |
| `progresion` | `GET /progresion/jovenes/:id/resumen|indicadores|export.xlsx`, `PATCH .../indicadores/:id`, `POST .../adelantos/:id/iniciar`, `POST /progresiones/:id/solicitar|aprobar|rechazar`, `GET /progresion/unidades/:id/jovenes` | `progresion:*` |
| `organizacion` | `arbol`, `nodos` CRUD, `unidades/:id/grupo`, `cargos-permitidos`, `nodos/:id/cargos`, `cargos/:id` | `organizacion:*` + rol editor |
| `adultos` | `GET /adultos/mi-perfil`, CRUD, `POST /adultos/:id/cuenta` | `user:*`/`self:*` |
| `datos-scout` | `GET /datos-scout`, `GET /datos-scout/miembro/:miembroId`, `POST /datos-scout`, `PATCH /datos-scout/miembro/:miembroId` (upsert) | `datosscout:view/manage` (+ `self:view` para el propio) |
| `formacion` | `GET /formacion`, `GET /formacion/adultos`, `GET /formacion/adulto/:adultoId`, `GET /formacion/:id`, `POST /formacion`, `PATCH /formacion/:id`, `DELETE /formacion/:id` | `formacion:view/manage` |
| `programas-mundiales` | `GET /programas-mundiales` (global, scoped), `GET /programas-mundiales/catalogo`, `GET /programas-mundiales/miembro/:miembroId`, `POST /programas-mundiales`, `PATCH /programas-mundiales/:id`, `DELETE /programas-mundiales/:id` (soft-delete) | `programamundial:view/manage` (+ self-scope para el propio) |
| `pdf` | `GET /pdf/constancia/:miembroId`, `GET /pdf/carnet/:miembroId`, `GET /pdf/asistencia/:actividadId` (descarga `application/pdf`) | `progresion:view`, `datosscout:view`, `asistencia:view` respectivamente (sin permisos nuevos) |
| `health` | `GET /health` (sin auth) | — |

---

## 6. Eventos de auditoría (`action` en `AuditLog`)

`USER_CREATED`, `USER_UPDATED`, `USER_DELETED`, `PASSWORD_CHANGED`,
`JOVEN_CREATED`, `JOVEN_UPDATED`, `JOVEN_DELETED`, `JOVEN_ACCOUNT_CREATED`,
`ADULTO_CREATED`,
`ROLE_ASSIGNED`,
`FICHA_MEDICA_CREATED`, `FICHA_MEDICA_UPDATED`, `FICHA_MEDICA_DELETED`,
`CATALOGO_CREATED`, `CATALOGO_UPDATED`, `CATALOGO_DELETED`,
`INDICADOR_ESTADO_CHANGED`,
`PROGRESION_SOLICITADA`, `PROGRESION_APROBADA`, `PROGRESION_RECHAZADA`,
`FORMACION_CREATED`, `FORMACION_UPDATED`, `FORMACION_DELETED`,
`DATOS_SCOUT_CREATED`, `DATOS_SCOUT_UPDATED`,
`PROGRAMA_MUNDIAL_CREATED`, `PROGRAMA_MUNDIAL_UPDATED`, `PROGRAMA_MUNDIAL_DELETED`.

Eventos (Fase 1) y presencia QR (7b): `PLANIFICACION_CREATED`, `PLANIFICACION_UPDATED`,
`PLANIFICACION_DELETED`, `ACTIVIDAD_CREATED`, `ACTIVIDAD_UPDATED`, `ACTIVIDAD_DELETED`,
`ASISTENCIA_BULK`, `ASISTENCIA_UPDATED`, **`ASISTENCIA_DELETED`** (7b · deshacer una
marca, `DELETE /eventos/asistencias/:id`), **`ASISTENCIA_QR`** (7b · auto-registro de
presencia vía QR). Son acciones libres: no hay enum, se escriben como texto.

Tres tablas de auditoría coexistentes. Roles (§10.8 ✅, documentado en `README.md`
y con comentario en `schema.prisma`, sin tocar la BD):

| Tabla | Rol | ¿Se escribe hoy? |
|---|---|---|
| `AuditLog` | Fuente canónica de auditoría de negocio (`actorId/module/action`); la escribe `AuditService.logAction` y es la que consulta el módulo `audit` y la retención. | **Sí** |
| `BitacoraAuditoria` | Legacy v1 (`tabla`/`registroId`/`datosAntes`-`datosDespues`). | No (solo lectura histórica) |
| `AuditRBAC` | Legacy v1 de RBAC; los cambios de roles actuales van a `AuditLog`. | No (solo lectura histórica) |

---

## 7. Frontend: rutas y páginas

| Ruta (`/app/...`) | Página | Término visible |
|---|---|---|
| `/` | DashboardPage | Dashboard |
| `/perfil` | PerfilPage | Mi Perfil |
| `/miembros` | MiembrosPage | Miembros |
| `/manada`, `/tropa`, `/comunidad`, `/clan` (+ `/nuevo`, `/editar/$id`) | ManadaPage, TropaPage, ComunidadPage, ClanPage | Unidades |
| `/progresion`, `/progresion/ficha/$id` | ProgresionPage, ProgresionFichaPage | Progresión (staff) |
| `/mi-progresion` | MiProgresionPage | Mi Progresión (joven) |
| `/unidades` | UnidadesPage | Unidades |
| `/usuarios` | UsuariosPage | Usuarios |
| `/estructura` | EstructuraPage | Estructura (árbol + cargos) |
| `/staff` (+ `/nuevo`, `/editar`, `/cuenta`) | StaffPage, StaffRegisterPage, StaffEditPage, StaffAccountPage | Staff (roles/permisos) |
| `/miembros` registro/edición | MemberRegisterPage, MemberEditPage | Registro de miembros |

Permisos del frontend: `frontend/src/types/auth.ts` (`PERMISSIONS`, `ROL_HIERARCHY`,
`puedeAsignarRol`), guard `RequierePermiso`, hook `usePermission`, control por unidad `useUnidad`.

---

## 8. Términos técnicos

| Término | Significado en este proyecto |
|---|---|
| **RBAC** | Control de acceso basado en roles: `Rol` → `RolPermiso` → `Permiso`; los permisos van **inyectados en el JWT** (sin consulta a DB en cada request). |
| **ABAC** | Políticas por atributo: el módulo `jovenes` filtra por la unidad del usuario. |
| **Self-scope** | `@SelfScope()`: endpoint abierto sin permiso explícito porque su alcance es la identidad propia (`self:view`, `self:update`). |
| **Denegar por defecto** | Todo endpoint debe declarar `@RequirePermission(...)` o `@SelfScope()`; si no, 403 (validado por `permissions.coverage.spec.ts`). Sin bypass para `SYSTEM_ADMIN`. |
| **Soft delete** | Borrado lógico con `deletedAt` (extensión Prisma); escape hatch `deletedAt: undefined`. |
| **Jerarquía de roles** | `ROL_HIERARCHY`: 1 = mayor privilegio; solo se asignan niveles numéricamente mayores. No confundir con `TipoNodoOrganizacion.nivel` (estructura, 1–5). |
| **Rate limit** | 600 req/60 s globales; 20 intentos/60 s en `POST /auth/login`; 429 + `Retry-After`. |
| **Retención de auditoría** | Job diario 03:00 + `POST /audit/retencion?dias=N`; umbral `AUDIT_RETENTION_DAYS` (365; ≤0 la desactiva). |
| **Umbrales** | `floor(pool × porcentaje / 100)`; se almacena el **porcentaje** (`umbralPorcentaje`), no el conteo. |
| **Guard de prueba aislada** | Si la prueba aislada de un adelanto tiene 0 ítems, la aprobación se bloquea: "prueba aislada no definida". |
| **Seed idempotente** | `npm run seed` no duplica datos; incluye renombres de compatibilidad (`Caminantes→Comunidad`, `ADULTO_CAMINANTES→ADULTO_COMUNIDAD`, `SECRETARIO→REPRESENTANTE_UNIDAD`). |
| **Cargos vigentes** | `CargoAsignacion.hasta = null` significa vigente; `hasta` con fecha = cerrado (renombrado/desplazado). |
| **Export PDF** | Módulo `pdf` (Fase 7a): `pdfmake` genera constancia, carnet y listado de asistencia con `StreamableFile`. Reutiliza los permisos/ABAC de sus endpoints de lectura. |
| **QR de presencia** | Fase 7b: token `presencia:v1:<uuidActividad>:<expMs>:<firma>` firmado con HMAC-SHA256 sobre `JWT_SECRET` (TTL 24 h, stateless, `timingSafeEqual`; alterado/vencido → 400, actividad cancelada → 409). El adulto lo genera (`asistencia:manage` + ABAC) y el joven se auto-registra PRESENTE con `self:update` (exige vínculo `miembroId`; idempotente). Frontend: `qrcode` + `@zxing/browser`, fallback de código manual. |
| **Deshacer asistencia** | `DELETE /eventos/asistencias/:id` (7b, `asistencia:manage`): soft-delete de la marca. Necesario para corregir escaneos erróneos y para desbloquear el 409 de `DELETE /eventos/actividades/:id` (exige 0 filas de asistencia activas). UI: botón "Limpiar" por fila de la planilla. |
| **Multi-grupo** | Fase 7c (decisión 2026-11-11, **implementada**): aislamiento por subárbol jerárquico — `NodoPolicy.filtroUsuarios/usuarioEnAlcance` acotan `GET/PATCH/DELETE /users` y las rutas `rbac:assign-role` al subárbol del `Usuario.nodoId` (fail-closed: ámbito vacío → no matchea a nadie; cuenta inexistente → se deja pasar y responde 404); `POST /users` exige ancla (unidad o nodo) dentro del ámbito; `UnitAccessPolicy` aísla a los ADULTO_* por `unidadId` **exacto** (el nombre de la unidad se repite en cada grupo: "Manada" del Grupo A ≠ "Manada" del Grupo B); `POST /unidades` exige `grupoId` dentro del ámbito. Unidad por grupo: `Unidad.grupoId` + `@@unique([grupoId, tipo])`. Ver `plan-expansion.md` §Fase 7. |
| **Ámbito jerárquico (subárbol)** | F4.3/7c: `Usuario.nodoId` ancla la cuenta a un nodo del árbol (CONSEJO→…→GRUPO). `NodoPolicy.subtreeIds` calcula el subárbol (1 query + BFS); sobre él se derivan `unidadesEnAlcance`, `filtroUsuarios` (listado de usuarios: unidad del subárbol **o** `nodoId` dentro del subárbol) y `assertGrupo` (alta de unidades: 404 inexistente / 400 si no es GRUPO / 403 fuera de ámbito). Un actor con ámbito no puede vaciar `nodoId` de una cuenta (eso ampliaría su visión a global). |
| **Políticas de pdfmake** | `setUrlAccessPolicy(() => false)` bloquea toda URL remota dentro del PDF; `setLocalAccessPolicy` **no puede ser deny-all** (rompería las fuentes Roboto) → normaliza separadores y sólo permite `node_modules/pdfmake/fonts/`. Los métodos de `pdfmake` usan `this`: importar con `import * as pdfmake`, nunca destructurado. |

---

## 9. Renombres históricos (compatibilidad)

| Antes | Ahora | Dónde se migra |
|---|---|---|
| Unidad "Caminantes" | **Comunidad** | `seed.ts` (updateMany) |
| Rol `ADULTO_CAMINANTES` | **ADULTO_COMUNIDAD** | `seed.ts` |
| Rol `SECRETARIO` | **REPRESENTANTE_UNIDAD** | `seed.ts` |
| Excel "5ª Etapa" de Clan | Base de **Comunidad** (84) + 20 a Clan | `plan-progresion.md §2.1` |
| Término **RAMA** (enum, campos, query params, DTOs, respuestas) | **UNIDAD** | `prisma/migrations/20261105000000_rename_rama_a_unidad` (migración SQL manual) + código |

---

## 10. ✅ Discrepancias detectadas — corregidas

> **Estado (2026-11-05):** las 9 discrepancias originales (§10.1–§10.9) quedaron
> **corregidas** y se añadió §10.10 con el renombre RAMA → UNIDAD. Cada apartado
> conserva qué era y qué se hizo. Verificación: `npm run build`, `npm test`,
> `npm run test:integration`, frontend `npm test` + lint, y `npm run seed`.

### 10.1 ✅ `condecoracion:update` / `condecoracion:delete` no existían en el catálogo
- **Era:** la matriz del seed los asignaba a `SYSTEM_ADMIN` pero no estaban en `PERMISOS_SEED`, así que nunca se creaban y `DELETE /scout/condecoraciones/:id` devolvía 403.
- **Corregido:** ambos añadidos a `PERMISOS_SEED` (módulo `scout`); la matriz ya los asignaba.

### 10.2 ✅ `progresion:delete` era un término "fantasma"
- **Era:** definido en `constantes.ts`, frontend, README y `frontend/agents.md`, pero sin endpoint que lo exigiera.
- **Corregido (decisión: eliminarlo):** fuera de `PERMISSIONS` (backend y frontend), de `README.md`, `frontend/agents.md` y `frontend/AGENTS.md.new`. Las progresiones se **rechazan** con `progresion:update`, no se borran. `npm run seed` limpia de forma idempotente cualquier `Permiso`/`RolPermiso` huérfano.

### 10.3 ✅ Jerarquía de roles desactualizada en la documentación
- **Era:** `README.md` y `frontend/agents.md` (+ `.new`) listaban 10 roles e incluían `SECRETARIO`.
- **Corregido:** las tres tablas sustituidas por la tabla §3 (23 roles, niveles 1–18), con nota sobre la fuente canónica (`RBAC_ROLES` / `ROL_HIERARCHY`).

### 10.4 ✅ `medico:edit` estaba marcado como legacy pero seguía vivo
- **Era:** lo usaban `MemberProfile.tsx`, `FichaMedicaPanel.tsx`, `ficha-medica.controller.ts` (2 endpoints), `administrativo.controller.ts` y el rol `JOVEN` en el seed.
- **Corregido (decisión: migrar a `medico:update`):** todos los usos migrados; `MEDICO_EDIT` fuera de `PERMISSIONS` (backend y frontend); `PERMISOS_SEED` ya no lo crea y la matriz ya no lo asigna; `npm run seed` lo retira idempotente de `Permiso`/`RolPermiso`.

### 10.5 ✅ Roles legacy en español todavía en el guard
- **Era:** `ROLES` y `LEGACY_TO_RBAC_ROLE` en `constantes.ts` y un `RolesGuard` paralelo a `PermissionsGuard`.
- **Corregido:** verificado que **ningún endpoint** usaba `@Roles` ni registraba `RolesGuard` → eliminados `roles.guard.ts`, `roles.decorator.ts`, `ROLES`, `LEGACY_TO_RBAC_ROLE` y el import muerto en `create-user.dto.ts`.

### 10.6 ✅ README desactualizado en dos tablas
- **Era:** "Módulos implementados" listaba 9 (hay 17 controllers) y "Eventos auditados" listaba 7 (hay 20).
- **Corregido:** ambas tablas ampliadas en `README.md`, con columna de módulo en los eventos.

### 10.7 ✅ Definición de permisos duplicada backend ↔ frontend
- **Era:** `PERMISSIONS` divergía (frontend omitía módulos futuros y `formacion`; contenía `progresion:delete` y `medico:edit`).
- **Corregido:** catálogo frontend sincronizado con el backend y añadido `src/common/permisos-paridad.spec.ts`, que lee ambos archivos con `fs` y compara los conjuntos `'modulo:accion'` (falla ante cualquier drift).

### 10.8 ✅ Tres tablas de auditoría coexistentes
- **Decisión:** **solo documentar** (sin tocar la BD).
- **Corregido:** rol de cada tabla documentado en `README.md` (§Auditoría), en este glosario §6 y como comentario en `schema.prisma` (`AuditLog` canónica; `BitacoraAuditoria` y `AuditRBAC` legacy de solo lectura histórica).

### 10.9 ✅ Términos menores
- **"Seisenas":** comentario corregido a `// Patrullas / Secciones`.
- **`Unidad.tipo`:** ahora es `TipoUnidad?` (enum) — antes `String?`, con la fila inválida `RARA` limpiada a `NULL` en la migración. Los DTOs de unidad validan con `@IsEnum(TipoUnidad)`.
- **Redacción de la jerarquía:** uniformizada en `README.md` ("roles de nivel estrictamente mayor = menor privilegio"), igual que `auth.ts` y `frontend/agents.md`.
- **`AGENTS.md.new`:** tablas actualizadas (permisos + jerarquía 1–18); se conserva como borrador.

---

## 10.10 🔵 Renombre RAMA → UNIDAD (decisión de producto, completado)

**Alcance:** código + BD + API (enum Prisma, campos de modelo, query params, DTOs,
servicios, tests, scripts, frontend y docs).

| Antes | Ahora |
|---|---|
| `enum RamaUnidad` | `enum TipoUnidad` |
| `AreaCrecimiento.rama`, `Etapa.rama`, `IndicadorLogro.rama`, `Adelanto.rama` | `... .unidad` |
| `Unidad.tipo String?` | `Unidad.tipo TipoUnidad?` |
| query param `?rama=` | `?unidad=` (junto al `unidadId` legacy) |
| DTOs con campo `rama` / mensaje `"rama debe ser..."` | campo `unidad` / `"unidad debe ser..."` |
| `resolverRamaQuery` | `resolverUnidadQuery` |
| ctx `unidadRama` | `unidadTipo` |
| respuesta JSON `rama:` | `unidad:` |
| `src/common/ramas.ts` (`esRama`, `RAMAS_UNIDAD`) | eliminado (innecesario con el enum tipado) |

**Migración:** `prisma/migrations/20261105000000_rename_rama_a_unidad/migration.sql`,
escrita a mano (Prisma no detecta renames y `migrate dev` generaría DROP+CREATE con
pérdida de datos). Se aplica con `npx prisma migrate deploy`.

- Limpia antes del cast: `UPDATE "Unidad" SET "tipo"=NULL WHERE "tipo" NOT IN (…enum…)`.
- Renombra enum, 4 columnas, `IndicadorLogro_rama_idx` → `IndicadorLogro_unidad_idx` y
  `Adelanto_rama_orden_key` → `Adelanto_unidad_orden_key` (es UNIQUE INDEX, no constraint).
- **No** renombra las restricciones `*_rama_not_null`: solo existen en PostgreSQL ≥17
  (entorno local) y el fallo rompería el CI sobre PG16.

---

*Glosario de la revisión de consistencia terminológica del proyecto. Las discrepancias §10 quedaron corregidas el 2026-11-05; si aparece una nueva, añadirla aquí y marcarla al resolverla.*
