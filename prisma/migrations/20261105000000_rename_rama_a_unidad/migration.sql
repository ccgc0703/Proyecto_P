-- Renombre de terminología "RAMA" → "UNIDAD" (decisión de producto: el sistema
-- usa UNIDAD como único término; "rama" queda reservado solo para uso scout
-- genérico si acaso, nunca en código/API/BD).
--
-- Escrita a mano porque Prisma no detecta renames: `migrate dev` generaría
-- DROP+CREATE (pérdida de datos). Se aplica con `prisma migrate deploy`.

-- 1) Renombrar el enum.
ALTER TYPE "RamaUnidad" RENAME TO "TipoUnidad";

-- 2) Renombrar columnas "rama" → "unidad" en las 4 tablas de catálogo.
ALTER TABLE "AreaCrecimiento" RENAME COLUMN "rama" TO "unidad";
ALTER TABLE "Etapa"          RENAME COLUMN "rama" TO "unidad";
ALTER TABLE "IndicadorLogro" RENAME COLUMN "rama" TO "unidad";
ALTER TABLE "Adelanto"       RENAME COLUMN "rama" TO "unidad";

-- 3) Renombrar índices para que coincidan con el nombre que Prisma deriva
--    del nuevo nombre de columna.
--    Nota: "Adelanto_rama_orden_key" es un UNIQUE INDEX (@@unique), no una
--    constraint, por eso se usa ALTER INDEX y no ALTER TABLE ... RENAME CONSTRAINT.
ALTER INDEX "IndicadorLogro_rama_idx"  RENAME TO "IndicadorLogro_unidad_idx";
ALTER INDEX "Adelanto_rama_orden_key"  RENAME TO "Adelanto_unidad_orden_key";

-- 4) Tipar "Unidad.tipo" como enum. Antes era texto libre y ya existe al menos
--    un valor inválido ('RARA'); se limpian a NULL los que no sean canónicos
--    antes del cast (un '' también rompería el cast a enum).
UPDATE "Unidad"
SET "tipo" = NULL
WHERE "tipo" IS NOT NULL
  AND "tipo" <> ALL (ARRAY['MANADA', 'TROPA', 'COMUNIDAD', 'CLAN']);

ALTER TABLE "Unidad"
  ALTER COLUMN "tipo" TYPE "TipoUnidad"
  USING ("tipo"::"TipoUnidad");
