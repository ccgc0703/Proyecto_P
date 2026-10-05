# Plan de Implementación — Progresión Personal de Jóvenes

> **Estado:** Fase 0 ✅ · Fase 1 ✅ · Fase 2 ✅ · Fase 3 ✅ · Fase 4 ✅ · **Fase 5 ✅ ejecutada y verificada** · proyecto completo. Observaciones de revisión 1 ✅ y 2 ✅ aplicadas.
> **Última actualización:** 2026-09-26
> **Regla de oro:** no se ejecuta código sin aprobación previa de cada fase.

---

## 1. Contexto y objetivo

El sistema de gestión scout (`Sistema de Gestión Scout`, NestJS + Prisma + PostgreSQL + React/Vite) no tiene hoy un módulo que gestione la **progresión personal de los jóvenes**.

Actualmente ese proceso se maneja con **formatos de Excel** (uno por unidad) más un **documento maestro de indicadores**:

| Archivo | Contenido |
|---|---|
| `(MANADA) Progresión personal .xlsx` | Etapas 1 y 2 · 181 indicadores · 5 adelantos |
| `(TROPA)  Progresión personal .xlsx` | Etapas 3 y 4 · 197 indicadores · 4 adelantos |
| `(CLAN)   Progresión personal .xlsx` | Etapas 5 y 6 (esquema viejo) · 143 indicadores · 5 adelantos |
| `Indicadores-de-Logro-ASV.pdf` | Documento oficial ASV 2022 (32 pág.) · 6 áreas de crecimiento × 6 etapas · 521 indicadores |

**Objetivo:** reemplazar los Excel por un módulo digital con:

1. **Catálogo** de áreas de crecimiento, etapas, indicadores de logro y adelantos.
2. **Seguimiento** por joven, con estados por indicador.
3. **Evaluación automática** del % de cumplimiento para ascender de adelanto.
4. **Aprobación** por parte del adulto a cargo de la unidad.
5. **Exportación** al formato Excel actual (para no romper el flujo de trabajo existente).

### Alcance de esta primera versión (v1)

- ✅ Indicadores de logro (catálogo + estados + % de cumplimiento)
- ✅ Adelantos y umbrales por porcentaje
- ✅ Aprobación manual de ascenso
- ✅ Exportación a Excel
- ❌ Créditos, especialidades, vida de grupo, cursos, desvinculación, punta de flecha *(décisión: solo porcentajes)*
- ❌ Validación por edad *(décisión: referencial)*

---

## 2. Marco conceptual (terminología oficial del sistema)

Hay **dos conceptos distintos** que en las conversaciones iniciales se mezclaron. En todo el código se usa esta terminología:

| Término | Definición | Valores |
|---|---|---|
| **Etapa** | Rango etareo / ámbito del Programa de Jóvenes | **1 a 6** |
| **Área de crecimiento** | Categoría de indicadores | **6**: Corporalidad, Creatividad, Carácter, Afectividad, Sociabilidad, Espiritualidad |
| **Indicador de logro** | Comportamiento observable a evaluar | ~521 en total |
| **Adelanto** | Nivel/rango alcanzable **dentro** de una unidad | 4 o 5 por unidad |
| **Unidad** | Rama scout donde vive el joven | Manada, Tropa, Comunidad, Clan |

### 2.1 Etapa ↔ Unidad

| Etapa | Unidad |
|---|---|
| 1ª y 2ª | **Manada** |
| 3ª y 4ª | **Tropa** |
| 5ª | **Comunidad** *(antes "Caminantes")* |
| 6ª | **Clan** |

> **Nota histórica:** el Excel de Clan cubre "5ª Etapa" y "6ª Etapa" (esquema viejo donde Clan abarcaba ambas). Con el esquema nuevo, la **columna "5ª Etapa" del Excel de Clan es la base de Comunidad**.

### 2.2 Verificación de conteos (PDF vs Excel)

Se extrajeron y contaron los indicadores del PDF agrupados por coordenada X (cada columna = una etapa):

| Etapa | PDF | Excel | ¿Coincide? |
|---|---|---|---|
| 1ª (Manada) | 89 | 89 | ✅ |
| 2ª (Manada) | 92 | 92 | ✅ |
| 3ª (Tropa) | 99 | 99 | ✅ |
| 4ª (Tropa) | 98 | 98 | ✅ |
| 5ª (Clan) | 104 | 104 | ✅ |
| 6ª (Clan) | 39 | 39 | ✅ |
| **Total** | **521** | **521** | ✅ |

**Conclusión:** el PDF y los Excel son consistentes. Manada = 181 ✅, Tropa = 197 ✅, Clan actual = 143.

---

## 3. Decisiones cerradas (Fase 0)

| # | Tema | Decisión |
|---|---|---|
| 1 | **Split Comunidad / Clan** | Partir la 5ª+6ª etapa del Excel de Clan → **Comunidad = 84**, **Clan = 59** |
| 2 | **Redondeo de umbrales** | **`floor`** (hacia abajo) |
| 3 | **Nombres de adelantos** | Clan: *Expedicionario, Descubridor, Fundador, Rover Ciudadano* · Comunidad: *Peregrino, Precursor, Viajero, Visionario* |
| 4 | **Prueba aislada de Comunidad** | **No definida aún** — se carga cuando exista |
| 5 | **Alcance de validación** | **Solo los porcentajes de indicadores**. Créditos/especialidades/vida de grupo/cursos quedan **fuera de alcance v1** |
| 6 | **Edades** | **Referenciales** — se almacenan como dato, sin validación |
| 7 | **Rename Comunidad** | `Caminantes → Comunidad` **al inicio** (Fase 1) |
| 8 | **Quién aprueba** | Adulto de la unidad + **SYSTEM_ADMIN** + **GROUP_LEADER** |
| 9 | **Prueba aislada del Clan** | **Opción A**: los 6 ítems de la hoja *"Precursor"* gating a **Expedicionario** |
| 10 | **Rename de rol** | Renombrar también `ADULTO_CAMINANTES → ADULTO_COMUNIDAD` |

---

## 4. Pools finales de indicadores por unidad

Se aplicó la **Opción A** del split proporcional por área (los 39 de la 6ª etapa van a Clan, más 20 de la 5ª; Comunidad se queda con 84 de la 5ª). Los pools quedan **disjuntos**, por lo que al cambiar de unidad no hay solapamiento.

| Unidad | Etapas | Corporalidad | Creatividad | Carácter | Afectividad | Sociabilidad | Espiritualidad | **Pool** |
|---|---|---|---|---|---|---|---|---|
| Manada | 1ª+2ª | 33 | 30 | 33 | 22 | 43 | 20 | **181** |
| Tropa | 3ª+4ª | 36 | 32 | 26 | 24 | 53 | 26 | **197** |
| Comunidad | 5ª | 14 | 12 | 13 | 14 | 22 | 9 | **84** |
| Clan | 5ª(20)+6ª(39) | 10 | 9 | 9 | 10 | 15 | 6 | **59** |
| | | | | | | | **Total** | **521** |

### Detalle del split de la 5ª etapa (Comunidad = 84 / Clan = 59)

| Área | 5ª etapa | 6ª etapa | Total | → Comunidad | → Clan |
|---|---|---|---|---|---|
| Corporalidad | 19 | 5 | 24 | 14 | 10 |
| Creatividad | 16 | 5 | 21 | 12 | 9 |
| Carácter | 15 | 7 | 22 | 13 | 9 |
| Afectividad | 16 | 8 | 24 | 14 | 10 |
| Sociabilidad | 28 | 9 | 37 | 22 | 15 |
| Espiritualidad | 10 | 5 | 15 | 9 | 6 |
| **Total** | **104** | **39** | **143** | **84** | **59** |

> **Nota sobre la meta original 84/61:** 84 + 61 = 145, pero solo existen 143 indicadores (verificado contra el PDF). Se optó por respetar **84 exactos en Comunidad** y dejar Clan en **59** (−2 respecto a la meta). *Cualquier ajuste posterior se coordina antes de ejecutar.*

**Criterio de asignación:** los 39 indicadores de la 6ª etapa van a Clan + los últimos 20 de la 5ª etapa (los más avanzados de cada área); Comunidad se queda con los primeros 84 de la 5ª etapa. Así **ambas unidades conservan indicadores de las 6 áreas**.

---

## 5. Adelantos y umbrales

**Regla:** umbral = `floor(pool × porcentaje / 100)`.

**Importante:** se almacena el **porcentaje**, no el número. El umbral se calcula en runtime, de modo que si el split cambia no hace falta migrar datos.

| Unidad | Pool | #1 — prueba aislada | #2 = 50% | #3 = 70% | #4 = 80% | #5 = 100% |
|---|---|---|---|---|---|---|
| **Manada** (5) | 181 | **Huella Fresca** · 13 ítems | **Huella Alerta** → 90 | **Huella Ágil** → 126 | **Huella Libre** → 144 | **Lobo Saltarín** → 181 |
| **Tropa** (4) | 197 | **Aventurero** · 9 ítems | **Explorador** → 98 | **Pionero** → 137 | **Scout de Bolívar** → 197 | — |
| **Comunidad** (4) | 84 | **Peregrino** · 6 ítems | **Precursor** → 42 | **Viajero** → 58 | **Visionario** → 84 | — |
| **Clan** (4) | 59 | **Expedicionario** · 6 ítems *(hoja Precursor)* | **Descubridor** → 29 | **Fundador** → 41 | **Rover Ciudadano** → 59 | — |

### Detalle de las pruebas aisladas

| Unidad | Adelanto #1 | Ítems | Fuente |
|---|---|---|---|
| Manada | Huella Fresca | **13** | hoja `Lobato(a)` del Excel de Manada |
| Tropa | Aventurero | **9** | hoja `Aventurero` del Excel de Tropa |
| Clan | Expedicionario | **6** (2 básicas + 4 opcionales) | hoja `Precursor` del Excel de Clan |
| Comunidad | Peregrino | **6** (hoja `Precursor` del Excel de Clan) | *(resuelto en la Fase 3 — opción B)* |

**Regla de guard:** si la prueba aislada de un adelanto tiene **0 ítems**, la aprobación se **bloquea** con el mensaje *"prueba aislada no definida"*. Esta regla sigue vigente; Comunidad ya no la dispara porque Peregrino tiene sus 6 ítems cargados.

### Lógica de la prueba aislada (Opción A — Clan)

La hoja `Precursor` del Excel de Clan contiene:

- **Básicas:** Ley y promesa · Introspección
- **Opcionales:** Campismo elemental · Pionerismo elemental · Exploración elemental · Conservacionismo elemental

Estos 6 ítems pasan a ser los **indicadores con `area.tipo = PRUEBA_ADELANTO`** de la unidad Clan, y gating del adelanto **Expedicionario**. El nombre *"Precursor"* queda reservado como **2º adelanto de Comunidad** (42 indicadores).

---

## 6. Esquema Prisma (diseño final)

```prisma
enum EstadoLogro {
  PENDIENTE
  EN_PROCESO
  PENDIENTE_APROBACION
  COMPLETADO
}

enum EstadoProgresion {
  EN_CURSO
  SOLICITADA
  APROBADA
  RECHAZADA
}

enum TipoArea {
  AREA_CRECIMIENTO   // las 6 áreas de crecimiento
  PRUEBA_ADELANTO    // ítems de la prueba aislada del 1er adelanto
}

// ─────────────────────────────────────────────
// CATÁLOGO
// ─────────────────────────────────────────────

model AreaCrecimiento {
  id         String    @id @default(uuid())
  nombre     String    @unique
  tipo       TipoArea  @default(AREA_CRECIMIENTO)
  orden      Int
  activo     Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?
  createdBy  String?
  updatedBy  String?

  Indicadores IndicadorLogro[]
}

model Etapa {
  id         String    @id @default(uuid())
  numero     Int       @unique          // 1..6
  nombre     String                     // "5ª Etapa"
  unidadId   String                     // 1,2→Manada | 3,4→Tropa | 5→Comunidad | 6→Clan
  activo     Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?
  createdBy  String?
  updatedBy  String?

  Unidad      Unidad      @relation(fields: [unidadId], references: [id])
  Indicadores IndicadorLogro[]
}

model IndicadorLogro {
  id         String    @id @default(uuid())
  codigo     String                     // "a".."q" / "A".."P" / "1".."13"
  texto      String
  etapaId    String
  areaId     String
  unidadId   String                     // unidad cuyo pool alimenta (añadido en Fase 1)
  orden      Int
  activo     Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  deletedAt  DateTime?
  createdBy  String?
  updatedBy  String?

  Etapa    Etapa            @relation(fields: [etapaId], references: [id])
  Area     AreaCrecimiento  @relation(fields: [areaId],  references: [id])
  Unidad   Unidad           @relation(fields: [unidadId], references: [id])
  Estados  EstadoLogroJoven[]

  @@unique([etapaId, areaId, codigo])
  @@index([etapaId])
  @@index([areaId])
  @@index([unidadId])
}

model Adelanto {
  id                String    @id @default(uuid())
  unidadId          String
  orden             Int                     // 1..5
  nombre            String                  // "Huella Alerta"
  edadMinima        Int?                    // REFERENCIAL, sin validación
  umbralPorcentaje  Int?                    // 50|70|80|100 ; null = prueba aislada
  activo            Boolean   @default(true)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  createdBy         String?
  updatedBy         String?

  Unidad       Unidad       @relation(fields: [unidadId], references: [id])
  Progresiones Progresion[]

  @@unique([unidadId, orden])
}

// ─────────────────────────────────────────────
// OPERACIÓN
// ─────────────────────────────────────────────

model Progresion {                        // rediseño de tabla existente (0 filas)
  id               String           @id @default(uuid())
  jovenId          String
  adelantoId       String
  fechaInicio      DateTime         @default(now())
  fechaCulminacion DateTime?
  estado           EstadoProgresion @default(EN_CURSO)
  aprobadoPor      String?
  aprobadoEn       DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  deletedAt        DateTime?
  createdBy        String?
  updatedBy        String?

  Joven    Joven    @relation(fields: [jovenId],    references: [id])
  Adelanto Adelanto @relation(fields: [adelantoId], references: [id])

  @@unique([jovenId, adelantoId])
  @@index([jovenId])
}

model EstadoLogroJoven {                  // estado POR JOVEN, no por progresión
  id             String       @id @default(uuid())
  jovenId        String
  indicadorId    String
  estado         EstadoLogro  @default(PENDIENTE)
  observaciones  String?
  registradoPor  String?
  registradoEn   DateTime     @default(now())
  aprobadoPor    String?
  aprobadoEn     DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  deletedAt      DateTime?
  createdBy      String?
  updatedBy      String?

  Joven     Joven          @relation(fields: [jovenId],     references: [id])
  Indicador IndicadorLogro @relation(fields: [indicadorId], references: [id])

  @@unique([jovenId, indicadorId])
  @@index([jovenId])
}
```

### Relaciones a agregar a modelos existentes

| Modelo | Nueva relación |
|---|---|
| `Unidad` | `Etapas Etapa[]`, `Adelantos Adelanto[]`, `Indicadores IndicadorLogro[]` |
| `Joven` | `EstadosLogro EstadoLogroJoven[]` |

### Tablas que NO se construyen en v1

| Modelo | Motivo |
|---|---|
| `RequisitoAdelanto` | Decisión 5: solo porcentajes |
| `CumplimientoRequisito` | Decisión 5: solo porcentajes |
| enum `TipoRequisito` | Decisión 5: solo porcentajes |

### Dos decisiones de diseño y su justificación

1. **`EstadoLogroJoven` se ancla al `joven`, no a la `Progresion`.**
   La regla de negocio es que los umbrales son **acumulados sobre el pool de la unidad** (confirmado). Si el estado viviera dentro de la progresión, cada ascenso exigiría re-copiar 181 filas. Anclándolo al joven, los indicadores logrados siguen contando automáticamente al subir de adelanto.

2. **La prueba aislada es un `AreaCrecimiento` con `tipo = PRUEBA_ADELANTO`.**
   Evita columnas FK anulables y tablas paralelas: todo son indicadores en una sola tabla con FKs no nulos. El pool de porcentaje se filtra con `area.tipo = AREA_CRECIMIENTO`; la prueba se filtra con `area.tipo = PRUEBA_ADELANTO`.

3. **`IndicadorLogro` lleva `unidadId` propio (añadido durante Fase 1).**
   El pool de Clan = 20 indicadores de la **5ª etapa** + 39 de la **6ª etapa**, pero `Etapa.unidadId` solo admite una unidad por etapa (5ª → Comunidad). Sin `indicador.unidadId` no habría forma de armar el pool de Clan. `Etapa.unidadId` queda como **etiqueta de unidad dueña de la etapa**, y el pool se calcula por `indicador.unidadId`.
   *Consecuencia:* el `@@unique([etapaId, areaId, codigo])` sigue siendo válido porque Comunidad toma los primeros códigos de cada columna y Clan los últimos (disjuntos).

---

## 7. Reglas de negocio

### 7.1 Evaluación de un adelanto

```
evaluar(joven, adelanto):

  pool = IndicadorLogro (activo)
         where area.tipo       = AREA_CRECIMIENTO
           and indicador.unidadId = adelanto.unidadId

  completados = count(EstadoLogroJoven where
                 jovenId = joven and
                 estado  = COMPLETADO and
                 indicadorId ∈ pool)

  ── Si es prueba aislada (umbralPorcentaje = null):
       items     = IndicadorLogro where
                   area.tipo = PRUEBA_ADELANTO and
                   indicador.unidadId = adelanto.unidadId
       requerido = |items|
       SI |items| = 0  →  BLOQUEAR con "prueba aislada no definida"

  ── Si tiene porcentaje:
       requerido = floor(|pool| × umbralPorcentaje / 100)

  apto = completados >= requerido
```

### 7.2 Estados del indicador

```
PENDIENTE ──▶ EN_PROCESO ──▶ PENDIENTE_APROBACION ──▶ COMPLETADO
     ▲               ▲                  │
     └───────────────┴──────────────────┘   (retroceso permitido para corrección)
```

- **Quién marca:** solo el adulto a cargo de la unidad (hoy mismo actor marca y aprueba).
- **Auditoría** en cada cambio: actor, estado anterior, estado nuevo, timestamp.

### 7.3 Ascenso de adelanto

- **Manual.** Nunca automático por edad.
- Flujo: `solicitar` (auto-evaluación → devuelve faltantes con textos) → `aprobar` / `rechazar`.
- Al aprobar: `fechaCulminacion`, `estado = APROBADA`, `aprobadoPor`, `aprobadoEn`, y se crea la `Progresion` del siguiente adelanto con `estado = EN_CURSO`.

### 7.4 Autorización

| Acceso | Regla |
|---|---|
| Marcar indicadores | Adulto de la unidad del joven (`UnitAccessPolicy.assertCanAccessUnit`, ver `src/common/policies/unit-access.policy.ts`) |
| Aprobar ascenso | Adulto de la unidad **+ SYSTEM_ADMIN + GROUP_LEADER + GROUP_SUBLEADER** |
| Catálogo (CRUD) | SYSTEM_ADMIN + GROUP_LEADER |
| Ver catálogo | Todos los anteriores + GROUP_SUBLEADER + ADULTO_* |

Mapa de unidades por rol (fuente única: `src/common/policies/unit-access.policy.ts`):

```
ADULTO_MANADA       → 'Manada'
ADULTO_TROPA        → 'Tropa'
ADULTO_COMUNIDAD    → 'Comunidad'
ADULTO_CLAN         → 'Clan'
Bypass (acceso total a todas las unidades): SYSTEM_ADMIN, GROUP_LEADER, GROUP_SUBLEADER
```

El bypass es **fuera de modelo** (no depende de `Unidad.id`), por eso vive en
`src/common/policies/unit-access.policy.ts` (`UnitAccessPolicy`, provider inyectable), separado
de `src/common/policies/unit.policy.ts` (`UnitPolicy`, ABAC que sí resuelve por `miembro.unidadId`).

### 7.5 Eventos de auditoría

| Evento | Cuándo |
|---|---|
| `INDICADOR_ESTADO_CHANGED` | Cambio de estado de un indicador |
| `PROGRESION_SOLICITADA` | Solicitud de ascenso |
| `PROGRESION_APROBADA` | Aprobación de ascenso |
| `PROGRESION_RECHAZADA` | Rechazo de ascenso |
| `CATALOGO_CREATED` / `CATALOGO_UPDATED` / `CATALOGO_DELETED` | Cambios en catálogo |

---

## 8. Permisos

### 8.1 Gap detectado en el seed actual

Revisión de `prisma/seed.ts` y `src/common/constantes.ts`:

| Permiso | Quién lo tiene hoy |
|---|---|
| `progresion:create` | SYSTEM_ADMIN, GROUP_LEADER, ADULTO_* |
| `progresion:view` | SYSTEM_ADMIN, ADULTO_* · **falta GROUP_LEADER** |
| `progresion:update` | **solo SYSTEM_ADMIN** ← los adultos no pueden marcar indicadores |
| `progresion:delete` | **nadie** |
| `progresion:aprobar` | no existe |
| `catalogo:view` | no existe |
| `catalogo:manage` | no existe |

### 8.2 Matriz objetivo

| Permiso | SYSTEM_ADMIN | GROUP_LEADER | GROUP_SUBLEADER | ADULTO_MANADA | ADULTO_TROPA | ADULTO_COMUNIDAD | ADULTO_CLAN |
|---|---|---|---|---|---|---|---|
| `progresion:create` | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ |
| `progresion:view` | ✅ | ➕ **agregar** | — | ✅ | ✅ | ✅ | ✅ |
| `progresion:update` | ✅ | ➕ **agregar** | — | ➕ **agregar** | ➕ **agregar** | ➕ **agregar** | ➕ **agregar** |
| `progresion:aprobar` | ✅ *(nuevo)* | ✅ *(nuevo)* | — | ✅ *(nuevo)* | ✅ *(nuevo)* | ✅ *(nuevo)* | ✅ *(nuevo)* |
| `progresion:delete` | — | — | — | — | — | — | — |
| `catalogo:view` | ✅ *(nuevo)* | ✅ *(nuevo)* | ✅ *(nuevo)* | ✅ *(nuevo)* | ✅ *(nuevo)* | ✅ *(nuevo)* | ✅ *(nuevo)* |
| `catalogo:manage` | ✅ *(nuevo)* | ✅ *(nuevo)* | — | — | — | — | — |

**Archivos a tocar:**

| Archivo | Cambio |
|---|---|
| `src/common/constantes.ts` | Agregar `PROGRESION_APROBAR`, `CATALOGO_VIEW`, `CATALOGO_MANAGE` |
| `prisma/seed.ts` → `PERMISOS_SEED` | Agregar los 3 permisos nuevos |
| `prisma/seed.ts` → `ROL_PERMISOS_SEED` | Aplicar la matriz de la §8.2 |
| `README.md` → sección "Permisos disponibles" | Documentar los nuevos |

---

## 9. Rename `Caminantes → Comunidad` (incluye rol)

### 9.1 Migración de datos

> ✅ **Ejecutado en Fase 1.** Estos `UPDATE` viajan dentro de la migración
> `prisma/migrations/20260924185715_progresion_personal/migration.sql` (al final del script) **y** se repiten de forma idempotente en el paso 0 de `prisma/seed.ts`.

```sql
UPDATE "Unidad"
   SET nombre = 'Comunidad',
       descripcion = 'Comunidad — jóvenes de 15 a 18 años',
       updatedBy = 'migration-comunidad'
 WHERE nombre = 'Caminantes' AND "deletedAt" IS NULL;

UPDATE "Rol"
   SET nombre = 'ADULTO_COMUNIDAD',
       descripcion = 'Adulto de Comunidad',
       updatedBy = 'migration-comunidad'
 WHERE nombre = 'ADULTO_CAMINANTES' AND "deletedAt" IS NULL;
```

> Las tablas siguientes listan las líneas **previas** al cambio; se conservan como inventario de archivos tocados.

### 9.2 Backend

| Archivo | Líneas | Qué cambia |
|---|---|---|
| `prisma/seed.ts` | 61 | `nombre: 'ADULTO_CAMINANTES'` → `'ADULTO_COMUNIDAD'` |
| `prisma/seed.ts` | 112 | clave de la matriz `ROL_PERMISOS_SEED` |
| `prisma/seed.ts` | 138 | unidad `Caminantes` → `Comunidad` |
| `prisma/seed-test-user.ts` | 14, 16, 18, 26, 28, 31, 84, 92, 97, 98 | consultas por nombre de unidad y rol |
| `src/common/constantes.ts` | 8 | `ROLES.ADULTO_CAMINANTES: 'ADULTO CAMINANTES'` → `'ADULTO COMUNIDAD'` |
| `src/common/constantes.ts` | 20 | `RBAC_ROLES.ADULTO_CAMINANTES` → `ADULTO_COMUNIDAD` |
| `src/common/constantes.ts` | 34 | `LEGACY_TO_RBAC_ROLE` |
| `src/common/policies/unit.policy.ts` | 16 | lista de bypass por rol |
| `src/modules/jovenes/jovenes.service.ts` | 10 | `ADULTO_CAMINANTES: 'Caminantes'` → `'Comunidad'` |
| `src/modules/jovenes/jovenes.service.ts` | 19 | `Caminantes: {min,max}` → `Comunidad` |
| `src/modules/jovenes/jovenes.service.ts` | 341 | `Unidad: { nombre: 'Caminantes' }` → `'Comunidad'` |

### 9.3 Frontend

| Archivo | Líneas | Qué cambia |
|---|---|---|
| `src/types/auth.ts` | 1 | `type Unidad = ... 'CAMINANTES' ...` → `'COMUNIDAD'` |
| `src/types/auth.ts` | 10 | tipo de rol `'ADULTO_CAMINANTES'` → `'ADULTO_COMUNIDAD'` |
| `src/types/auth.ts` | 88 | orden/peso del rol |
| `src/hooks/useUnidad.ts` | 26 | lista de unidades |
| `src/hooks/useUnidad.ts` | 40 | `CAMINANTES: 'Caminantes'` → `COMUNIDAD: 'Comunidad'` |
| `src/App.tsx` | 25 | `import { CaminantesPage }` → `ComunidadPage` |
| `src/App.tsx` | 147, 153, 156, 158, 164 | rutas y wrappers |
| `src/pages/CaminantesPage.tsx` | — | **renombrar archivo** → `ComunidadPage.tsx` |
| `src/pages/DashboardPage.tsx` | 154 | label "Caminantes" |
| `src/pages/MiembrosPage.tsx` | 33 | `z.enum([... 'CAMINANTES' ...])` |
| `src/pages/UnidadesPage.tsx` | 24, 31 | enum y mapa de estilos |
| `src/components/layout/Sidebar.tsx` | 57, 80, 83 | roles restringidos + label del menú |

### 9.4 Documentación

| Archivo | Cambio |
|---|---|
| `README.md` | Tabla de unidades (§ "Gestión de Unidades"), tabla de roles, mapa de acceso por unidad |

---

## 10. API

### 10.1 Catálogo — `/catalogo`

```
GET    /catalogo/areas
POST   /catalogo/areas
PATCH  /catalogo/areas/:id
DELETE /catalogo/areas/:id

GET    /catalogo/etapas                          ?unidadId

GET    /catalogo/indicadores                     ?etapaId&areaId&unidadId&search
POST   /catalogo/indicadores
PATCH  /catalogo/indicadores/:id
DELETE /catalogo/indicadores/:id

GET    /catalogo/adelantos                       ?unidadId
POST   /catalogo/adelantos
PATCH  /catalogo/adelantos/:id
DELETE /catalogo/adelantos/:id
```

> **Implementado en la Fase 2** (`src/modules/catalogo/`). Detalles:
>
> - **Permisos:** `GET` → `catalogo:view` · `POST/PATCH/DELETE` → `catalogo:manage` (guard `JwtAuthGuard` + `PermissionsGuard` a nivel de controlador).
> - **`/catalogo/etapas` es solo lectura** (el plan solo definía `GET`): las 6 etapas se siembran. Si se necesita CRUD de etapas, se coordina antes de añadirlo.
> - **`unidadId` es obligatorio y explícito** en `POST/PATCH /catalogo/indicadores`: no se deriva de `Etapa.unidadId` porque la etapa 5 pertenece a Comunidad *y* a Clan. El servicio valida que `etapaId`, `areaId` y `unidadId` existan (404 si no).
> - **Soft delete con bloqueos:** `DELETE` devuelve **409** si el registro está en uso — área con indicadores vivos, indicador con `EstadoLogroJoven`, adelanto con `Progresion`. La recomendación es `activo: false`.
> - **Prueba aislada única:** solo un `Adelanto` por unidad con `umbralPorcentaje = null` (409 si se intenta otro).
> - **Auditoría:** `CATALOGO_CREATED` / `CATALOGO_UPDATED` / `CATALOGO_DELETED` con `module = 'catalogo'`.
> - **Respuesta:** envoltorio `{ success, message, data }`. Validación global (`whitelist` + `forbidNonWhitelisted` + `transform`) rechaza bodies y query strings extra con **400**.

### 10.2 Operación — `/progresion`

```
GET    /progresion/jovenes/:miembroId/resumen
GET    /progresion/jovenes/:miembroId/indicadores
PATCH  /progresion/jovenes/:miembroId/indicadores/:indicadorId     { estado, observaciones }
POST   /progresion/jovenes/:miembroId/adelantos/:adelantoId/iniciar
POST   /progresion/progresiones/:id/solicitar
POST   /progresion/progresiones/:id/aprobar
POST   /progresion/progresiones/:id/rechazar
GET    /progresion/unidades/:unidadId/jovenes
```

> **Nota de identidad:** la API recibe `miembroId` (el ID que usa el frontend, ver `jovenes.service.ts:100`), y el servicio lo resuelve al `Joven.id` interno para las FK.

### 10.3 Reporte (Fase 4 ✅)

```
GET    /progresion/jovenes/:miembroId/export.xlsx
GET    /progresion/unidades/:unidadId/export.xlsx
```

> **Respuesta:** binario `.xlsx` (`StreamableFile`) con
> `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` y
> `Content-Disposition: attachment; filename="cuadro-adelanto-<slug>.xlsx"`.
> Permiso `progresion:view` + scoping por unidad (401/403/404 igual que el resto de `/progresion`).
> Implementación: datos en `progresion.service.ts`, render en `export.service.ts` (`exceljs`).

### 10.4 Respuesta de `GET .../resumen`

```jsonc
{
  "joven": { "id": "...", "nombres": "...", "apellidos": "...", "unidad": "Tropa" },
  "adelantoActual": {
    "id": "...", "orden": 2, "nombre": "Explorador",
    "umbralPorcentaje": 50,
    "poolTotal": 197, "requerido": 98, "completados": 61,
    "porcentajeActual": 30.9,
    "esPruebaAislada": false,
    "faltantes": 37
  },
  "porArea": [
    { "area": "Corporalidad", "total": 36, "completados": 12,
      "enProceso": 3, "pendienteAprobacion": 1, "pendientes": 20 }
    // ... las 6 áreas
  ],
  "historialProgresiones": [ /* adelantos anteriores con fechas */ ],
  "puedeAprobar": true,
  "bloqueo": null      // o { "motivo": "prueba aislada no definida" }
}
```

---

## 11. Importación del catálogo desde Excel

**Script:** `scripts/importar-indicadores.ts` → `npm run importar:indicadores` (idempotente).
**Dependencia:** `xlsx` (devDependency).

**Flujo:**

1. Leer los 3 archivos Excel con `xlsx` (se localizan por prefijo `(MANADA)` / `(TROPA)` / `(CLAN)`).
2. Para cada unidad, localizar las 6 hojas de áreas (`1. Corporalidad` … `6. Espiritualidad`).
3. Por fila: columna 0 = código minúscula (etapa impar → 1ª/3ª/5ª), columna 4 = código mayúscula (etapa par → 2ª/4ª/6ª); texto en la columna contigua.
4. Limpiar texto: colapsar `\s+` a un espacio y `trim()`.
5. Aplicar el **split de Comunidad/Clan** (§4) sobre la columna de la 5ª etapa: Comunidad se queda con los primeros `N` de cada área, el resto se marca `unidadId = Clan` **conservando `etapaId = 5`**.
6. Insertar `AreaCrecimiento` (7: las 6 áreas + "Prueba de Adelanto"), `Etapa` (1..6 → unidad), `IndicadorLogro`, `Adelanto`.
7. Insertar los ítems de pruebas aisladas desde las hojas `Lobato(a)` (13), `Aventurero` (9) y `Precursor` (2 básicas col 0 + 4 opcionales col 12 = 6).
8. **Verificación final (falla con exit 1):** total 555 = 521 pool + 34 prueba · pools `181 / 197 / 84 / 59` · 6 áreas con indicadores por unidad · adelantos `5/4/4/4` · imprime los umbrales `floor`.

**Idempotencia:** `upsert` por `@@unique([etapaId, areaId, codigo])` (reactiva `deletedAt = null`) + baja de indicadores que ya no existan en el Excel.

**Resultado de la ejecución:** Fase 1 → ✅ 549 indicadores, 17 adelantos, verificaciones en verde, idempotente (2 ejecuciones seguidas sin duplicados). **Fase 3 (re-ejecución con la opción B)** → ✅ **555 indicadores** = 521 pool + 34 prueba.

---

## 12. Plan de fases

| # | Fase | Contenido | Entregable / Criterio de cierre | Estado |
|---|---|---|---|---|
| **1** | **Base** | 9.1–9.4 rename Comunidad+rol · §6 `schema.prisma` · migración · §8 permisos · `scripts/importar-indicadores.ts` · seed de áreas/etapas/adelantos | BD lista: counts = 181/197/84/59 · `npm run build` ✅ · `npm test` ✅ | ✅ **Hecha** |
| **2** | **Catálogo** | Módulo `catalogo` (controller/service/DTOs con `class-validator`), guard de permisos, soft delete | CRUD catálogo con tests | ✅ **Hecha** |
| **3** | **Operación** | Estados, resumen, evaluación (`floor`), solicitar/aprobar/rechazar, auditoría, scoping por unidad | API de progresión con tests | ✅ **Hecha** |
| **4** | **Export** | `exceljs` → réplica del "Cuadro de Adelanto" por joven y por unidad | 2 endpoints de reporte | ✅ **Hecha** |
| **5** | **Frontend** | Marcado de indicadores, tablero por unidad, ficha de progresión, botón exportar | Pantallas funcionales | ✅ **Hecha** |

### Registro de ejecución — Fase 1 (2026-09-24)

| Paso | Resultado |
|---|---|
| Rename backend (`constantes`, `unit.policy`, `jovenes.service`, `seed`, `seed-test-user`) | ✅ |
| Rename frontend (`auth.ts`, `useUnidad`, `App.tsx`, `ComunidadPage.tsx`, `Sidebar`, `Dashboard`, `Miembros`, `Unidades`, `Member*`) | ✅ |
| Rutas `/caminantes` → `/comunidad` | ✅ |
| `schema.prisma` + 5 modelos nuevos | ✅ `prisma validate` OK |
| Migración 1 `20260924185715_progresion_personal` (schema + rename de datos) | ✅ aplicada |
| Migración 2 `20260924191004_indicador_unidad` (`IndicadorLogro.unidadId`) | ✅ aplicada |
| Permisos (`progresion:aprobar`, `catalogo:view`, `catalogo:manage` + matriz §8.2) | ✅ seed ejecutado |
| `npm run importar:indicadores` | ✅ 549 indicadores / 17 adelantos / verificación en verde / idempotente *(recuento actual: 555)* |
| `npm run build` (backend) | ✅ |
| `npm test` (backend) | ✅ 3 suites, 14 tests |
| `npm run build` (frontend) | ✅ `tsc -b && vite build` |
| `npm run lint` (frontend) | ✅ sin errores |

**Comandos de la Fase 1:**

```bash
npm run seed                  # unidades + RBAC (+ rename idempotente)
npm run importar:indicadores  # catálogo desde Excel
npm run build && npm test     # cierre backend
cd frontend && npm run build && npm run lint
```

**Reglas de ejecución:**

- Cada fase cierra con `npm run build` + `npm test` + lint **antes** de pasar a la siguiente.
- **No se hace commit** entre fases salvo petición explícita.
- Cualquier cambio en los datos del catálogo (split, umbrales, ítems de prueba aislada) **se coordina antes de ejecutar**.

### Registro de ejecución — Fase 2 (2026-09-24)

**Archivos nuevos:** `src/modules/catalogo/{catalogo.module.ts, catalogo.controller.ts, catalogo.service.ts, catalogo.service.spec.ts}` · `src/modules/catalogo/dto/{create,update}-{area,indicador,adelanto}.dto.ts`, `query-catalogo.dto.ts`, `catalogo-dto.spec.ts`.

**Cambio de dependencias:** se añadió `@nestjs/mapped-types` (devuelve `PartialType` de los DTO de actualización; no estaba instalado y `@nestjs/common` no lo exporta).

**Cambio en datos:** el usuario de prueba quedó como `comunidad@test.com` (antes `caminantes@test.com`, se quedó sin renombrar en la Fase 1); se actualizó su email. El resto de la BD no se tocó y las filas de prueba creadas durante la verificación se eliminaron.

| Paso | Resultado |
|---|---|
| Módulo `catalogo` (module + controller + service) registrado en `app.module.ts` | ✅ |
| 13 endpoints de la §10.1 | ✅ |
| DTOs `class-validator` (body + query) con `PartialType` | ✅ |
| Guard `JwtAuthGuard` + `PermissionsGuard` + `@RequirePermission` | ✅ |
| Soft delete con bloqueo por uso (409) y prueba aislada única por unidad | ✅ |
| Auditoría `CATALOGO_*` | ✅ |
| `catalogo.service.spec.ts` (26 tests) + `dto/catalogo-dto.spec.ts` (16 tests) | ✅ |
| `npm run build` (backend) | ✅ |
| `npm test` (backend) | ✅ **5 suites, 52 tests** |
| `npm run build` + `npm run lint` (frontend, sin cambios) | ✅ |
| Smoke test HTTP (arranque real de la app + JWT) | ✅ ver abajo |

**Verificación HTTP (servidor real):**

```
GET  /catalogo/areas sin token              -> 401
POST /catalogo/areas con token inválido     -> 401
GET  /catalogo/areas                        -> 7 (6 áreas + "Prueba de Adelanto")
GET  /catalogo/etapas                       -> 6
GET  /catalogo/adelantos                    -> 17 (4 con umbral null = pruebas aisladas)
GET  /catalogo/indicadores                  -> 549  (en la Fase 2; 555 desde la Fase 3)
GET  /catalogo/indicadores?unidadId=Manada  -> 194 (181 pool + 13 de prueba)
GET  /catalogo/indicadores?search=atenci    -> 1  ·  search=ZZZNADA -> 0
POST /catalogo/areas con DTO inválido       -> 400
GET  /catalogo/adelantos?unidadId=<basura>  -> 400
ADULTO_COMUNIDAD GET  /catalogo/*           -> 200 (solo tiene `catalogo:view`)
ADULTO_COMUNIDAD POST /catalogo/areas       -> 403 (`catalogo:manage` requerido)
POST/PATCH/DELETE (CRUD completo)           -> OK y soft delete verificado en BD
```

**Comandos de la Fase 2:**

```bash
npm run build && npm test     # cierre backend
cd frontend && npm run build && npm run lint
```

### Registro de ejecución — Fase 3 (2026-09-24)

**Archivos nuevos:** `src/modules/progresion/{progresion.module.ts, progresion.controller.ts, progresion.service.ts, progresion.service.spec.ts}` · `src/modules/progresion/dto/{actualizar-estado-indicador,rechazar-progresion}.dto.ts` · `src/common/policies/unit-access.policy.ts` (fuente única de `UNIT_BYPASS_ROLES`).

**Cambio retirado:** se eliminó el CRUD de `POST/PATCH/DELETE /scout/progresiones` (`scout.controller.ts`, `scout.service.ts`) — era un backdoor que permitía crear aprobaciones sin pasar por `solicitar`/`aprobar`. El módulo `scout` queda solo con condecoraciones.

**Cambio de datos:** el importador se extendió con la entrada `{ unidad:'Comunidad', etapa:5, hoja:'Precursor', columnas:[0,12], desde:'Clan' }` (opción B) y se re-ejecutó → **555 indicadores** (521 pool + 34 prueba); la errata `Instropección` → `Introspección` quedó corregida en BD (el Excel de origen no se tocó).

| Paso | Resultado |
|---|---|
| Módulo `progresion` registrado en `app.module.ts` | ✅ |
| 8 endpoints de la §10.2 | ✅ |
| Evaluación de adelanto con `floor(pool × pct / 100)` | ✅ |
| Prueba aislada: bloqueo `apto=false` + `bloqueo` cuando no hay ítems | ✅ |
| Flujo `iniciar` → `solicitar` → `aprobar`/`rechazar` + creación del siguiente adelanto | ✅ |
| Auditoría `INDICADOR_ESTADO_CHANGED`, `PROGRESION_SOLICITADA/APROBADA/RECHAZADA` | ✅ |
| Scoping por unidad (`UnitAccessPolicy`, bypass con GROUP_SUBLEADER) | ✅ |
| `PATCH /catalogo/etapas/:id` (solo `nombre`/`activo`) | ✅ |
| `progresion.service.spec.ts` (29 tests) | ✅ |
| `npm run build` (backend) | ✅ |
| `npm test` (backend) | ✅ **6 suites, 81 tests** |
| `npm run build` + `npm run lint` (frontend, sin cambios) | ✅ |
| Smoke E2E (servidor real + 2 JWT) | ✅ ver abajo |
| Limpieza de datos de la prueba | ✅ 0 progresiones / 0 estado_logro / 0 auditoría progresión |

**Verificación E2E (servidor real, joven de Comunidad):**

```
GET  /progresion/unidades/:id/jovenes            -> 1 joven
GET  /progresion/jovenes/:m/indicadores          -> 90 (84 pool + 6 prueba)
GET  /progresion/jovenes/:m/resumen              -> adelantoActual null, porArea 6, suma pool 84
POST .../adelantos/Peregrino/iniciar             -> Progresion EN_CURSO
POST .../adelantos/Peregrino/iniciar (2ª vez)    -> 409
PATCH .../indicadores/:id {estado:TODO_BIEN}     -> 400
PATCH .../indicadores/:id EN_PROCESO             -> 200
POST .../progresiones/:id/solicitar (1/6)        -> apto=false, faltantes=6 con textos
PATCH 6 indicadores COMPLETADO
POST .../progresiones/:id/solicitar              -> apto=true
POST .../progresiones/:id/aprobar                -> APROBADA + siguiente=Precursor EN_CURSO
GET  .../resumen                                 -> Precursor, prueba=false, pool=84, req=42, historial=1
POST .../progresiones/<Precursor>/solicitar      -> apto=false, faltantes=42
POST .../progresiones/<Precursor>/aprobar        -> 409 (no está SOLICITADA)
ADULTO_COMUNIDAD GET .../jovenes/<Manada>/resumen -> 403
ADULTO_COMUNIDAD GET /progresion/unidades/<Manada>/jovenes -> 403
GET  /progresion/jovenes/:m/resumen sin token    -> 401
GET  /scout/progresiones (retirado)              -> 404
```

**Comandos de la Fase 3:**

```bash
npm run importar:indicadores  # re-ejecución con la opción B (Comunidad/Peregrino)
npm run build && npm test     # cierre backend
cd frontend && npm run build && npm run lint
```

### Registro de ejecución — Fase 4 (2026-09-25)

**Dependencia nueva:** `exceljs@^4.4.0` en `dependencies` (runtime). `xlsx` sigue siendo `devDependency` y solo lo usa el importador.

**Archivos nuevos:** `src/modules/progresion/export.service.ts` (renderizado, puro y testeable) · `src/modules/progresion/export.service.spec.ts`.

**Archivos modificados:** `progresion.service.ts` (`evaluar` se partió en `evaluar` + `evaluarConListas`, y se añadieron `getDatosExportJoven`, `getDatosExportUnidad`, `armarJovenExport`, `getCatalogoExport`, `textoEtapas`) · `progresion.controller.ts` (2 rutas + `StreamableFile`) · `progresion.module.ts` (registra `ExportService`).

| Paso | Resultado |
|---|---|
| `GET /progresion/jovenes/:miembroId/export.xlsx` | ✅ |
| `GET /progresion/unidades/:unidadId/export.xlsx` | ✅ |
| Permisos (`progresion:view`) + scoping por unidad (401/403/404) | ✅ |
| Hojas: `Resumen` + `Indicadores` (joven) · `Resumen` + 1 hoja por joven (unidad) | ✅ |
| `export.service.spec.ts` (4 tests) + 4 tests nuevos en `progresion.service.spec.ts` | ✅ |
| `npm run build` (backend) | ✅ |
| `npm test` (backend) | ✅ **7 suites, 89 tests** |
| `npm run build` + `npm run lint` (frontend, sin cambios) | ✅ |
| Smoke E2E (descarga real + lectura del `.xlsx`) | ✅ ver abajo |

**Estructura del reporte:**

```
Cuadro de Adelanto (por joven)
  ├─ Resumen      título · unidad · etapas · joven · F. nacimiento · generado
  │               bloque "Adelanto actual" (umbral, progreso, faltantes, estado)
  │               tabla RESUMEN POR ÁREA (+ fila TOTAL) · HISTORIAL DE ADELANTOS
  └─ Indicadores  una sección por área (6) + "Prueba de Adelanto"
                  columnas: Código | Indicador | Estado | ✓

Cuadro de Adelanto (por unidad)
  ├─ Resumen      bloque de datos + tabla ADELANTOS (umbral y requerido calculado)
  │               tabla JÓVENES (adelanto actual, completados, requerido, %, estado)
  └─ por joven    sus 2 hojas anteriores (nombres de hoja saneados y sin duplicados)
```

**Verificación E2E (servidor real):**

```
GET /progresion/jovenes/:m/export.xlsx (admin)  -> 200 · 13.743 bytes · PK
    Content-Type: application/...spreadsheetml.sheet
    Content-Disposition: attachment; filename="cuadro-adelanto-granadillo-carlos.xlsx"
GET /progresion/unidades/:uCom/export.xlsx (ADULTO_COMUNIDAD) -> 200 · 15.119 bytes · PK
sin token                     -> 401
ADULTO_COMUNIDAD export Manada -> 403
miembro inexistente           -> 404
```

**Contenido leído del `.xlsx` generado (BD real):**

```
Resumen:  Unidad Comunidad · 5ª etapa · GRANADILLO, CARLOS
          ADELANTOS: Peregrino (prueba aislada, todos los ítems) ·
                     Precursor 50 % → 42 de 84 · Viajero 70 % → 58 de 84 · Visionario 100 % → 84 de 84
          RESUMEN POR ÁREA: 14/12/13/14/22/9 → TOTAL 84   (cuadra con la §4)
          JÓVENES: GRANADILLO CARLOS · adelanto "—" · 0 % · Sin iniciar
Indicadores: 84 del pool + 6 de prueba, agrupados por área, con estado y marca ✓
```

**Comandos de la Fase 4:**

```bash
npm run build && npm test     # cierre backend
cd frontend && npm run build && npm run lint
```

### Registro de ejecución — Fase 5 (2026-09-25)

**Decisiones (§13 previa a la ejecución):** la ficha va **embebida en `MemberProfile` y en una ruta propia** (`/app/progresion/$miembroId`) reutilizando el mismo componente; el tablero por unidad es una **pestaña de `UnitDashboard`**; alcance **completo** (marcar + ascenso + export); **ítem "Progresión" en el Sidebar** con `progresion:view`.

**Archivos nuevos (frontend):**

```
src/types/progresion.ts                         tipos del dominio
src/hooks/useProgresion.ts                      useResumen / useIndicadores / useJovenesUnidad
src/features/progresion/ProgresionResumen.tsx   adelanto actual, porArea, historial, bloqueo
src/features/progresion/ProgresionAcciones.tsx  iniciar · solicitar · aprobar · rechazar · exportar
src/features/progresion/IndicadoresLista.tsx    marcado por área (4 estados)
src/features/progresion/ProgresionSeccion.tsx   pestañas Resumen | Indicadores
src/features/progresion/UnidadProgresionPanel.tsx  DataGrid por unidad + export
src/pages/ProgresionPage.tsx                    /app/progresion (selector de unidad)
src/pages/ProgresionFichaPage.tsx               /app/progresion/$miembroId
```

**Archivos modificados (frontend):** `api/endpoints.ts` (`progresionApi`, `catalogoApi`, `descargarArchivo`) · `api/index.ts` · `components/units/MemberProfile.tsx` (se eliminó el bloque falso `progresiones.length * 25` y `member.Progresiones`) · `components/units/UnitDashboard.tsx` (tabs Miembros | Progresión + `unidadId`) · `components/layout/Sidebar.tsx` (ítem Progresión) · `App.tsx` (2 rutas con guard `progresion:view`) · `utils/errors.ts` (`getApiErrorMessage` acepta `message[]`).

| Paso | Resultado |
|---|---|
| `progresionApi` (8 operaciones) + `catalogoApi.getAdelantos` + descarga de `.xlsx` | ✅ |
| Hooks `useResumen`/`useIndicadores`/`useJovenesUnidad` (404 = estado vacío) | ✅ |
| `ProgresionResumen` + `ProgresionAcciones` (dialogs de iniciar/solicitar/aprobar/rechazar) | ✅ |
| `IndicadoresLista` (7 secciones, 4 estados, buscador) | ✅ |
| Pestaña **Progresión** en `UnitDashboard` con DataGrid y export | ✅ |
| Rutas `/app/progresion` y `/app/progresion/$miembroId` con guard | ✅ |
| Ítem **Progresión** en el Sidebar (`progresion:view`) | ✅ |
| `npm run build` (backend) | ✅ |
| `npm test` (backend) | ✅ **7 suites, 89 tests** |
| `npm run build` (frontend) | ✅ `tsc -b && vite build` |
| `npm run lint` (frontend) | ✅ sin errores |
| Smoke E2E de los endpoints que consume el front | ✅ ver abajo |
| Limpieza de los datos del smoke | ✅ 0 progresiones / 0 estado_logro / 0 auditoría progresión |

**Verificación E2E (servidor real, mismo camino que llama el frontend):**

```
GET  /progresion/unidades/:uCom/jovenes  -> 1 fila con claves exactas de FilaJovenUnidad
                                            (miembroId, adelantoActual, poolTotal, requerido,
                                             completados, porcentajeActual, progresiones)
GET  /progresion/jovenes/:m/resumen      -> joven, adelantoActual, porArea(6),
                                            historialProgresiones, puedeAprobar, bloqueo
GET  /progresion/jovenes/:m/indicadores  -> 90 ítems agrupados en 7 áreas
GET  /catalogo/adelantos?unidadId=:uCom  -> 4 (Peregrino / Precursor / Viajero / Visionario)
POST .../adelantos/Peregrino/iniciar     -> 200 (id de progresión)
POST .../progresiones/:id/solicitar      -> apto=false, faltantes=6 con faltantesDetallados
PATCH .../indicadores/:id (6x)           -> 200 COMPLETADO
POST .../progresiones/:id/solicitar      -> apto=true, faltantes=0
POST .../progresiones/:id/aprobar        -> APROBADA + siguiente=Precursor
GET  .../resumen (post)                  -> adelantoActual=Precursor, historial=1
ADULTO_COMUNIDAD GET .../jovenes/<Manada>/resumen -> 403
GET  .../jovenes/:m/export.xlsx          -> 200 · Content-Disposition con filename · 14.053 bytes
```

**Notas de implementación:**

- `solicitar` deja la progresión en `SOLICITADA`, por lo que `adelantoActual` pasa a `null` en el resumen; la UI lo toma de `historialProgresiones` (estado `SOLICITADA`) y ofrece **Aprobar/Rechazar** desde ahí (`resumen.puedeAprobar`).
- **Iniciar adelanto** solo se muestra cuando no hay adelanto en curso ni solicitud pendiente; lista los adelantos de la unidad vía `GET /catalogo/adelantos?unidadId=` (requiere `catalogo:view`) y deshabilita los ya iniciados.
- Los 2 endpoints de export se consumen con `responseType: 'blob'` y el nombre de archivo se lee de `Content-Disposition`.
- El cierre de fase es `build` + `lint` + smoke E2E: **no hay test runner en el frontend**.

**Comandos de la Fase 5:**

```bash
npm run build && npm test     # cierre backend (sin cambios de código)
cd frontend && npm run build && npm run lint
```

### Observaciones de revisión — Fase 5 (2026-09-25)

Dos observaciones posteriores al smoke manual, resueltas **solo en frontend** (sin tocar el backend):

1. **La "Prueba de Adelanto" se separa de los indicadores**, en cuenta y en vista — es el inicio de los adelantos de unidad.
2. **Las áreas de crecimiento del apartado Indicadores se colapsan** para que la vista sea más cómoda al buscar un área.

| Cambio | Archivo |
|---|---|
| Contadores divididos: los 4 chips de estados se calculan **solo sobre el pool de crecimiento (84)**; la prueba tiene su propio contador `X/6` con desglose | `IndicadoresLista.tsx` |
| Panel **"Prueba de Adelanto · inicio de los adelantos de unidad"** renderizado **fuera del listado de áreas** (debajo, con borde y acento ámbar propio, sus 6 filas marcables) | `IndicadoresLista.tsx` |
| Secciones colapsables: header con chevron + `completados/total`, **todas cerradas por defecto**, botones **Expandir todo / Colapsar todo** y búsqueda que **auto-expande** las secciones con coincidencias | `IndicadoresLista.tsx` |
| Fila **"Total áreas de crecimiento · X/84 indicadores · %"** al pie del bloque de áreas | `ProgresionResumen.tsx` |
| Tarjeta propia de la prueba (`X/6`, barra y mini-desglose de estados) debajo del bloque de áreas | `ProgresionResumen.tsx` |
| Chip **"Prueba de adelanto · cuenta solo sus ítems"** y rótulos `Pool` → `Ítems de prueba` cuando `esPruebaAislada` | `ProgresionResumen.tsx` |
| Se calcula `conteoPrueba` desde `useIndicadores` y se pasa como prop (dato ya disponible, sin endpoint nuevo) | `ProgresionSeccion.tsx` |
| Tipo `ConteoPrueba` | `types/progresion.ts` |

| Verificación | Resultado |
|---|---|
| `npm run build` (frontend) | ✅ `tsc -b && vite build` |
| `npm run lint` (frontend) | ✅ sin errores |
| `npm test` (backend, sin cambios) | ✅ **7 suites, 89 tests** |
| Datos usados (`porArea` solo con `AREA_CRECIMIENTO`, `areaTipo` en los indicadores, `esPruebaAislada` en el resumen) | ✅ ya existían: **cero cambios de backend** |

---

### Observaciones de revisión 2 — Fase 5 (2026-09-26)

Tres observaciones de la segunda revisión + dos hallazgos detectados al analizarlas:

1. **Resumen · la tarjeta de la Prueba de Adelanto se oculta** una vez aprobado el primer adelanto del joven. La pestaña **Indicadores conserva su panel de marcado** (decisión tomada).
2. **Resumen · la tarjeta inicial queda en dos zonas**: *"Último adelanto recibido/aprobado"* (chip del adelanto + fecha de aprobación) y *"Próximo adelanto"* (donut de progreso, umbral, faltantes y estado).
3. **Orden de presentación de unidades Manada → Tropa → Comunidad → Clan** en toda la UI.
4. *(Hallazgo D1)* `MiembrosPage` leía `j.unidad`, pero `GET /jovenes` **solo devuelve `Unidad: { nombre }`** → la columna Unidad salía vacía, el filtro por unidad no hacía nada y el guardado del diálogo **fallaba con 400** (`forbidNonWhitelisted: true` rechaza el campo `unidad`).
5. *(Hallazgo D2)* `Unidad.tipo` se sembraba como `'RAMA'` mientras el frontend espera `MANADA|TROPA|COMUNIDAD|CLAN` → columna "Tipo de Despliegue" y selector de edición sin valor.

| Cambio | Archivo |
|---|---|
| Helper `ORDEN_UNIDADES` + `ordenarPorUnidad()` (reconoce `tipo` y `nombre`, case-insensitive) | `hooks/useUnidad.ts` |
| Clan pasa **después** de Comunidad en el menú lateral | `Sidebar.tsx` |
| Chips de unidades ordenados (y unidad por defecto = primera del orden) | `ProgresionPage.tsx` |
| Tabla de unidades ordenada + **opción Comunidad** en el selector de tipo | `UnidadesPage.tsx` |
| Selects de unidades ordenados al cargar | `StaffEditPage.tsx`, `StaffRegisterPage.tsx` |
| **Opción Comunidad** en el filtro de unidades y en "Designación de Unidad" (condición `unidadAsignada === 'COMUNIDAD'`) | `MiembrosPage.tsx` |
| Filas mapeadas con `unidad: Unidad.nombre.toUpperCase()` (arregla columna y filtro) + envío con `unidadId` en vez de `unidad` (arregla el 400 del guardado) | `MiembrosPage.tsx` |
| Tarjeta en dos zonas (`Último adelanto recibido/aprobado` + `Próximo adelanto`, divisor entre ambas) y donut rotulado *"Hacia {adelanto}"* | `ProgresionResumen.tsx` |
| Prueba de Adelanto renderizada solo si `prueba.total > 0 && !historial.some(APROBADA)` | `ProgresionResumen.tsx` |
| `tipo` canónico en el seed + reparación automática de filas existentes | `prisma/seed.ts` |
| Migración de datos `20260926120000_unidad_tipo_canonico` | `prisma/migrations/` |

| Verificación | Resultado |
|---|---|
| `npm run build` (frontend) | ✅ `tsc -b && vite build` |
| `npm run lint` (frontend) | ✅ sin errores |
| `npm run build` + `npm test` (backend) | ✅ **7 suites, 89 tests** |
| `npm run prisma:migrate` | ✅ 13.ª migración aplicada |
| `GET /unidades` (smoke) | ✅ `Manada=MANADA, Tropa=TROPA, Clan=CLAN, Comunidad=COMUNIDAD` (la API devuelve Clan antes que Comunidad: el orden lo resuelve el helper) |
| `GET /jovenes` (smoke) | ✅ la fila **no** tiene `unidad` y sí `Unidad.nombre` → confirma D1 |
| `PATCH /jovenes/:id` (smoke) | ✅ payload viejo (`unidad=`) → **400**; payload nuevo (`unidadId=`) → **200** |
| `GET .../resumen` (smoke) | ✅ `historial: APROBADA 1° Peregrino, fin=…` → `hayAprobado=true` ⇒ tarjeta de prueba oculta y zona 1 con "Peregrino"; `adelantoActual = Precursor (2°)` ⇒ zona 2 "Próximo adelanto" |

**D3 — alta "Nuevo Registro" de `MiembrosPage` (resuelto el 2026-09-26).** El diálogo intentaba crear el joven con `POST /jovenes` sin `representanteId` (obligatorio en `CreateJovenDto`) y siempre respondía **400**. Decisión: **no duplicar el alta** — el botón ahora **redirige al alta oficial** de la unidad:

| Situación | Comportamiento |
|---|---|
| Usuario con unidad propia | Entra directo a `/app/<unidad>/nuevo` (`MemberRegisterPage`, que sí crea representante + joven) |
| Admin / visión total | Abre el diálogo **solo con el selector de unidad** (Manada/Tropa/Comunidad/Clan) y "Continuar al alta" navega al formulario de esa unidad |
| Editar un miembro | El diálogo conserva todos los campos y hace `PATCH` con `unidadId` (funciona, verificado con 200) |

| Cambio | Archivo |
|---|---|
| `iniciarAlta()` / `continuarAlta()` + `rutaAltaUnidad()` con `useNavigate` | `MiembrosPage.tsx` |
| Botón "Nuevo Registro" → `iniciarAlta()` | `MiembrosPage.tsx` |
| Diálogo: en alta se ocultan los campos personales y se muestra la nota de redirección; botón "Continuar al alta" (`type=button`) | `MiembrosPage.tsx` |
| `onSubmit` queda solo para edición (`if (!editingId) return;`) | `MiembrosPage.tsx` |

| Verificación | Resultado |
|---|---|
| `npm run build` (frontend) | ✅ `tsc -b && vite build` |
| `npm run lint` (frontend) | ✅ sin errores |
| Rutas de destino existentes | ✅ `/app/manada/nuevo`, `/app/tropa/nuevo`, `/app/comunidad/nuevo`, `/app/clan/nuevo` (`App.tsx`) |

---

## 13. Preguntas cerradas

| # | Pregunta | Resolución |
|---|---|---|
| 1 | **Ítems de la prueba aislada de Comunidad (Peregrino)** — cantidad y contenido | **Opción B.** Se añadió la hoja `Precursor` del Excel de Clan como columna 2 (`columnas:[0,12]`, `desde:'Clan'`) para las etapas 5 y 6 → **6 ítems** (códigos 1..6), `ESPERADO_PRUEBA.Comunidad = 6`. Importador re-ejecutado: 555 indicadores, verificación en verde. |
| 2 | **`edadMinima` por adelanto** | **Sin dato oficial** en los Excel: se deja en `null`. El campo es referencial y no se valida. |
| 3 | **`GROUP_SUBLEADER` y acceso total** | **Sí tiene bypass.** `UNIT_BYPASS_ROLES = ['SYSTEM_ADMIN','GROUP_LEADER','GROUP_SUBLEADER']` en `src/common/policies/unit-access.policy.ts`; `README.md` y `frontend/AGENTS.md` actualizados; el frontend ya lo incluía. |
| 4 | **"Instropección"** — errata en la hoja `Precursor` del Excel de Clan | **Corregida** vía el mapa `CORRECCIONES` del importador (`Instropección`→`Introspección`) y aplicada en BD al re-importar. El Excel de origen **no se modificó**. |
| 5 | **`PATCH /catalogo/etapas/:id`** | **Añadido**, limitado a `nombre`/`activo` (`dto/update-etapa.dto.ts`), con `CATALOGO_MANAGE` y 2 tests. |

*(Todo lo demás quedó cerrado en la Fase 0, §3.)*

---

## 14. Referencias de código existente

| Qué | Dónde |
|---|---|
| Modelo `Progresion` | `prisma/schema.prisma` (modelo nuevo en Fase 1; 0 filas antes de la Fase 3) |
| Módulo de operación (Fase 3) | `src/modules/progresion/` |
| Bypass de unidad por rol | `src/common/policies/unit-access.policy.ts` |
| Permisos `progresion:*` | `src/common/constantes.ts:65-69` |
| Control de acceso por unidad (scoping) | `src/common/policies/unit-access.policy.ts:45-64` (delegado desde `src/modules/jovenes/jovenes.service.ts`) |
| Rangos de edad por unidad (referencial) | `src/modules/jovenes/jovenes.service.ts:9-14` |
| Matriz rol→permisos | `prisma/seed.ts:71-120` |
| Unidades sembradas | `prisma/seed.ts:135-139` |
| API del frontend | `frontend/src/api/endpoints.ts` |
| Estructura de respuesta `{ success, message, data }` | `src/common/interfaces/response.interface.ts` |
| Módulo de catálogo (plantilla de referencia para nuevas entidades) | `src/modules/catalogo/` |
