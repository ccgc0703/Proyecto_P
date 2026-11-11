-- CreateEnum
CREATE TYPE "AlcancePlanificacion" AS ENUM ('GRUPO', 'DISTRITO', 'REGION', 'NACIONAL');

-- AlterTable
ALTER TABLE "Planificacion" ADD COLUMN     "alcance" "AlcancePlanificacion" NOT NULL DEFAULT 'GRUPO',
ADD COLUMN     "nodoId" TEXT;

-- CreateIndex
CREATE INDEX "Planificacion_nodoId_idx" ON "Planificacion"("nodoId");

-- CreateIndex
CREATE INDEX "Planificacion_alcance_idx" ON "Planificacion"("alcance");

-- AddForeignKey
ALTER TABLE "Planificacion" ADD CONSTRAINT "Planificacion_nodoId_fkey" FOREIGN KEY ("nodoId") REFERENCES "OrganizacionNodo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
