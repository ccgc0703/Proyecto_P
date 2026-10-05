-- Índices para hot-paths (F4.2) — idempotente (IF NOT EXISTS)
-- 1) Miembro: tabla más grande; listados filtran tipo+deletedAt (+unidadId) y ordenan por apellidos.
CREATE INDEX IF NOT EXISTS "Miembro_tipo_deletedAt_idx" ON "Miembro"("tipo", "deletedAt");
CREATE INDEX IF NOT EXISTS "Miembro_unidadId_tipo_deletedAt_idx" ON "Miembro"("unidadId", "tipo", "deletedAt");
CREATE INDEX IF NOT EXISTS "Miembro_deletedAt_idx" ON "Miembro"("deletedAt");
CREATE INDEX IF NOT EXISTS "Miembro_apellidos_nombres_idx" ON "Miembro"("apellidos", "nombres");

-- 2) Usuario: ABAC por unidad/nodo (F4.3 usará nodoId intensivamente).
CREATE INDEX IF NOT EXISTS "Usuario_unidadId_idx" ON "Usuario"("unidadId");
CREATE INDEX IF NOT EXISTS "Usuario_nodoId_idx" ON "Usuario"("nodoId");
CREATE INDEX IF NOT EXISTS "Usuario_deletedAt_idx" ON "Usuario"("deletedAt");

-- 3) AuditLog: paginación ORDER BY createdAt DESC + job de retención por fecha.
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_module_action_idx" ON "AuditLog"("module", "action");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- 4) BitacoraAuditoria: consultas por usuario/registro y retención por fecha.
CREATE INDEX IF NOT EXISTS "BitacoraAuditoria_usuarioId_idx" ON "BitacoraAuditoria"("usuarioId");
CREATE INDEX IF NOT EXISTS "BitacoraAuditoria_tabla_registroId_idx" ON "BitacoraAuditoria"("tabla", "registroId");
CREATE INDEX IF NOT EXISTS "BitacoraAuditoria_createdAt_idx" ON "BitacoraAuditoria"("createdAt");

-- 5) FKs sin índice (búsquedas inversas + integridad en deletes).
CREATE INDEX IF NOT EXISTS "Joven_representanteId_idx" ON "Joven"("representanteId");
CREATE INDEX IF NOT EXISTS "DatosScout_patrullaId_idx" ON "DatosScout"("patrullaId");
CREATE INDEX IF NOT EXISTS "Formacion_adultoId_idx" ON "Formacion"("adultoId");
CREATE INDEX IF NOT EXISTS "Planificacion_unidadId_idx" ON "Planificacion"("unidadId");

-- 6) Progresión: conteos por joven filtrando estado (resumen/listados).
CREATE INDEX IF NOT EXISTS "Progresion_jovenId_estado_idx" ON "Progresion"("jovenId", "estado");
CREATE INDEX IF NOT EXISTS "EstadoLogroJoven_jovenId_estado_idx" ON "EstadoLogroJoven"("jovenId", "estado");

-- 7) Organización: carga del árbol (hijos por padre activo).
CREATE INDEX IF NOT EXISTS "OrganizacionNodo_padreId_activo_idx" ON "OrganizacionNodo"("padreId", "activo");
