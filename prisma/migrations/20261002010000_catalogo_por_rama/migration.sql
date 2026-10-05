-- Fase 3: catálogo de progresión por rama (nacional, compartido por todos los grupos)
-- 1) Enum de rama
CREATE TYPE "RamaUnidad" AS ENUM ('MANADA', 'TROPA', 'COMUNIDAD', 'CLAN');

-- 2) Nuevas columnas rama
ALTER TABLE "AreaCrecimiento" ADD COLUMN "rama" "RamaUnidad";
ALTER TABLE "Etapa" ADD COLUMN "rama" "RamaUnidad";
ALTER TABLE "IndicadorLogro" ADD COLUMN "rama" "RamaUnidad";
ALTER TABLE "Adelanto" ADD COLUMN "rama" "RamaUnidad";

-- 3) Backfill desde Unidad.tipo (catálogo existente apunta a unidades demo con tipo canónico)
UPDATE "Etapa" e
SET "rama" = u."tipo"::"RamaUnidad"
FROM "Unidad" u
WHERE e."unidadId" = u."id"
  AND u."tipo" IN ('MANADA', 'TROPA', 'COMUNIDAD', 'CLAN');

UPDATE "IndicadorLogro" i
SET "rama" = u."tipo"::"RamaUnidad"
FROM "Unidad" u
WHERE i."unidadId" = u."id"
  AND u."tipo" IN ('MANADA', 'TROPA', 'COMUNIDAD', 'CLAN');

UPDATE "Adelanto" a
SET "rama" = u."tipo"::"RamaUnidad"
FROM "Unidad" u
WHERE a."unidadId" = u."id"
  AND u."tipo" IN ('MANADA', 'TROPA', 'COMUNIDAD', 'CLAN');

-- 4) Verificación: no puede quedar ninguna fila sin rama
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Etapa" WHERE "rama" IS NULL) THEN
    RAISE EXCEPTION 'Backfill incompleto: existen etapas sin rama';
  END IF;
  IF EXISTS (SELECT 1 FROM "IndicadorLogro" WHERE "rama" IS NULL) THEN
    RAISE EXCEPTION 'Backfill incompleto: existen indicadores sin rama';
  END IF;
  IF EXISTS (SELECT 1 FROM "Adelanto" WHERE "rama" IS NULL) THEN
    RAISE EXCEPTION 'Backfill incompleto: existen adelantos sin rama';
  END IF;
END $$;

-- 5) rama pasa a ser obligatoria (AreaCrecimiento queda nullable: null = todas las ramas)
ALTER TABLE "Etapa" ALTER COLUMN "rama" SET NOT NULL;
ALTER TABLE "IndicadorLogro" ALTER COLUMN "rama" SET NOT NULL;
ALTER TABLE "Adelanto" ALTER COLUMN "rama" SET NOT NULL;

-- 6) Se elimina la referencia a unidad del catálogo (FK, índices y columnas)
DROP INDEX "IndicadorLogro_unidadId_idx";
DROP INDEX "Adelanto_unidadId_orden_key";
ALTER TABLE "Etapa" DROP CONSTRAINT "Etapa_unidadId_fkey";
ALTER TABLE "IndicadorLogro" DROP CONSTRAINT "IndicadorLogro_unidadId_fkey";
ALTER TABLE "Adelanto" DROP CONSTRAINT "Adelanto_unidadId_fkey";
ALTER TABLE "Etapa" DROP COLUMN "unidadId";
ALTER TABLE "IndicadorLogro" DROP COLUMN "unidadId";
ALTER TABLE "Adelanto" DROP COLUMN "unidadId";

-- 7) Nuevos índices del catálogo por rama
CREATE UNIQUE INDEX "Adelanto_rama_orden_key" ON "Adelanto"("rama", "orden");
CREATE INDEX "IndicadorLogro_rama_idx" ON "IndicadorLogro"("rama");
