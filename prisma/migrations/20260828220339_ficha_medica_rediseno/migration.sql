/*
  Warnings:

  - You are about to drop the column `contactoEmergencia` on the `FichaMedica` table. All the data in the column will be lost.
  - You are about to drop the column `seguro` on the `FichaMedica` table. All the data in the column will be lost.
  - The `tipoSangre` column on the `FichaMedica` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TipoSangre" AS ENUM ('A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO', 'DESCONOCIDO');

-- CreateEnum
CREATE TYPE "Severidad" AS ENUM ('LEVE', 'MODERADA', 'SEVERA');

-- DropIndex
DROP INDEX "DatosScout_patrullaId_idx";

-- AlterTable
ALTER TABLE "FichaMedica" DROP COLUMN "contactoEmergencia",
DROP COLUMN "seguro",
ADD COLUMN     "consentimiento" BOOLEAN DEFAULT false,
ADD COLUMN     "consentimientoFecha" TIMESTAMP(3),
ADD COLUMN     "consentimientoObservaciones" TEXT,
ADD COLUMN     "contactoEmergenciaNombre" TEXT,
ADD COLUMN     "contactoEmergenciaParentesco" TEXT,
ADD COLUMN     "contactoEmergenciaTelefono" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "medicoTratante" TEXT,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "seguroCompania" TEXT,
ADD COLUMN     "seguroPoliza" TEXT,
ADD COLUMN     "seguroVigencia" TIMESTAMP(3),
ADD COLUMN     "telefono" TEXT,
ADD COLUMN     "telefonoMedico" TEXT,
DROP COLUMN "tipoSangre",
ADD COLUMN     "tipoSangre" "TipoSangre";

-- CreateTable
CREATE TABLE "AlergiaFichaMedica" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "severidad" "Severidad" NOT NULL DEFAULT 'LEVE',
    "reaccion" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "AlergiaFichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicamentoFichaMedica" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dosis" TEXT,
    "frecuencia" TEXT,
    "motivo" TEXT,
    "prescritoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "MedicamentoFichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CondicionFichaMedica" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaDiagnostico" TIMESTAMP(3),
    "requiereControl" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "CondicionFichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VacunaFichaMedica" (
    "id" TEXT NOT NULL,
    "fichaMedicaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaAplicacion" TIMESTAMP(3),
    "lote" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "VacunaFichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlergiaFichaMedica_fichaMedicaId_idx" ON "AlergiaFichaMedica"("fichaMedicaId");

-- CreateIndex
CREATE INDEX "MedicamentoFichaMedica_fichaMedicaId_idx" ON "MedicamentoFichaMedica"("fichaMedicaId");

-- CreateIndex
CREATE INDEX "CondicionFichaMedica_fichaMedicaId_idx" ON "CondicionFichaMedica"("fichaMedicaId");

-- CreateIndex
CREATE INDEX "VacunaFichaMedica_fichaMedicaId_idx" ON "VacunaFichaMedica"("fichaMedicaId");

-- AddForeignKey
ALTER TABLE "AlergiaFichaMedica" ADD CONSTRAINT "AlergiaFichaMedica_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "FichaMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicamentoFichaMedica" ADD CONSTRAINT "MedicamentoFichaMedica_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "FichaMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondicionFichaMedica" ADD CONSTRAINT "CondicionFichaMedica_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "FichaMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VacunaFichaMedica" ADD CONSTRAINT "VacunaFichaMedica_fichaMedicaId_fkey" FOREIGN KEY ("fichaMedicaId") REFERENCES "FichaMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
