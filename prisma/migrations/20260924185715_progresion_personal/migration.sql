-- CreateEnum
CREATE TYPE "EstadoLogro" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'PENDIENTE_APROBACION', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "EstadoProgresion" AS ENUM ('EN_CURSO', 'SOLICITADA', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "TipoArea" AS ENUM ('AREA_CRECIMIENTO', 'PRUEBA_ADELANTO');

-- DropForeignKey
ALTER TABLE "Progresion" DROP CONSTRAINT "Progresion_unidadId_fkey";

-- AlterTable
ALTER TABLE "Progresion" DROP COLUMN "etapa",
DROP COLUMN "unidadId",
ADD COLUMN     "adelantoId" TEXT NOT NULL,
ADD COLUMN     "aprobadoEn" TIMESTAMP(3),
ADD COLUMN     "aprobadoPor" TEXT,
ADD COLUMN     "estado" "EstadoProgresion" NOT NULL DEFAULT 'EN_CURSO';

-- CreateTable
CREATE TABLE "AreaCrecimiento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoArea" NOT NULL DEFAULT 'AREA_CRECIMIENTO',
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "AreaCrecimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etapa" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Etapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicadorLogro" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "IndicadorLogro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adelanto" (
    "id" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "edadMinima" INTEGER,
    "umbralPorcentaje" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Adelanto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstadoLogroJoven" (
    "id" TEXT NOT NULL,
    "jovenId" TEXT NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "estado" "EstadoLogro" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "registradoPor" TEXT,
    "registradoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprobadoPor" TEXT,
    "aprobadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "EstadoLogroJoven_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AreaCrecimiento_nombre_key" ON "AreaCrecimiento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Etapa_numero_key" ON "Etapa"("numero");

-- CreateIndex
CREATE INDEX "IndicadorLogro_etapaId_idx" ON "IndicadorLogro"("etapaId");

-- CreateIndex
CREATE INDEX "IndicadorLogro_areaId_idx" ON "IndicadorLogro"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "IndicadorLogro_etapaId_areaId_codigo_key" ON "IndicadorLogro"("etapaId", "areaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Adelanto_unidadId_orden_key" ON "Adelanto"("unidadId", "orden");

-- CreateIndex
CREATE INDEX "EstadoLogroJoven_jovenId_idx" ON "EstadoLogroJoven"("jovenId");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoLogroJoven_jovenId_indicadorId_key" ON "EstadoLogroJoven"("jovenId", "indicadorId");

-- CreateIndex
CREATE INDEX "Progresion_jovenId_idx" ON "Progresion"("jovenId");

-- CreateIndex
CREATE UNIQUE INDEX "Progresion_jovenId_adelantoId_key" ON "Progresion"("jovenId", "adelantoId");

-- AddForeignKey
ALTER TABLE "Etapa" ADD CONSTRAINT "Etapa_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicadorLogro" ADD CONSTRAINT "IndicadorLogro_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "Etapa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicadorLogro" ADD CONSTRAINT "IndicadorLogro_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "AreaCrecimiento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adelanto" ADD CONSTRAINT "Adelanto_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progresion" ADD CONSTRAINT "Progresion_adelantoId_fkey" FOREIGN KEY ("adelantoId") REFERENCES "Adelanto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstadoLogroJoven" ADD CONSTRAINT "EstadoLogroJoven_jovenId_fkey" FOREIGN KEY ("jovenId") REFERENCES "Joven"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstadoLogroJoven" ADD CONSTRAINT "EstadoLogroJoven_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "IndicadorLogro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Rename: Caminantes -> Comunidad (unidad) y ADULTO_CAMINANTES -> ADULTO_COMUNIDAD (rol)
UPDATE "Unidad"
   SET "nombre" = 'Comunidad',
       "descripcion" = 'Comunidad de jovenes de 15 a 18 anios',
       "updatedAt" = CURRENT_TIMESTAMP
 WHERE "nombre" = 'Caminantes' AND "deletedAt" IS NULL;

UPDATE "Rol"
   SET "nombre" = 'ADULTO_COMUNIDAD',
       "descripcion" = 'Adulto de Comunidad',
       "updatedAt" = CURRENT_TIMESTAMP
 WHERE "nombre" = 'ADULTO_CAMINANTES' AND "deletedAt" IS NULL;
