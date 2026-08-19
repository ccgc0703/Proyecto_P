/*
  Warnings:

  - You are about to drop the column `jovenId` on the `FichaMedica` table. All the data in the column will be lost.
  - You are about to drop the column `apellidos` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `cedula` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `fechaNacimiento` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `genero` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `nombres` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `unidadId` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Joven` table. All the data in the column will be lost.
  - You are about to drop the `JovenCondecoracion` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[miembroId]` on the table `FichaMedica` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[miembroId]` on the table `Joven` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `miembroId` to the `FichaMedica` table without a default value. This is not possible if the table is not empty.
  - Added the required column `miembroId` to the `Joven` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoMiembro" AS ENUM ('JOVEN', 'ADULTO');

-- CreateEnum
CREATE TYPE "EstadoMiembro" AS ENUM ('ACTIVO', 'INACTIVO', 'EGRESADO');

-- CreateEnum
CREATE TYPE "TipoProgramaMundial" AS ENUM ('PROGRAMA_MUNDIAL', 'DESAFIO', 'INICIATIVA');

-- CreateEnum
CREATE TYPE "EstadoProgramaMundial" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADO');

-- DropForeignKey
ALTER TABLE "FichaMedica" DROP CONSTRAINT "FichaMedica_jovenId_fkey";

-- DropForeignKey
ALTER TABLE "Joven" DROP CONSTRAINT "Joven_unidadId_fkey";

-- DropForeignKey
ALTER TABLE "JovenCondecoracion" DROP CONSTRAINT "JovenCondecoracion_condecoracionId_fkey";

-- DropForeignKey
ALTER TABLE "JovenCondecoracion" DROP CONSTRAINT "JovenCondecoracion_jovenId_fkey";

-- DropIndex
DROP INDEX "FichaMedica_jovenId_key";

-- DropIndex
DROP INDEX "Joven_cedula_key";

-- AlterTable
ALTER TABLE "FichaMedica" DROP COLUMN "jovenId",
ADD COLUMN     "miembroId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Joven" DROP COLUMN "apellidos",
DROP COLUMN "cedula",
DROP COLUMN "createdAt",
DROP COLUMN "createdBy",
DROP COLUMN "deletedAt",
DROP COLUMN "estado",
DROP COLUMN "fechaNacimiento",
DROP COLUMN "genero",
DROP COLUMN "nombres",
DROP COLUMN "unidadId",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedBy",
ADD COLUMN     "miembroId" TEXT NOT NULL;

-- DropTable
DROP TABLE "JovenCondecoracion";

-- CreateTable
CREATE TABLE "Miembro" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "genero" "Genero" NOT NULL,
    "tipo" "TipoMiembro" NOT NULL,
    "estado" "EstadoMiembro" NOT NULL DEFAULT 'ACTIVO',
    "unidadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Miembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adulto" (
    "id" TEXT NOT NULL,
    "miembroId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "ocupacion" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,

    CONSTRAINT "Adulto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatosScout" (
    "id" TEXT NOT NULL,
    "miembroId" TEXT NOT NULL,
    "fechaRegistro" TIMESTAMP(3),
    "fechaIngreso" TIMESTAMP(3),
    "fechaPromesa" TIMESTAMP(3),
    "cargoActual" TEXT,
    "observaciones" TEXT,

    CONSTRAINT "DatosScout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "director" TEXT NOT NULL,
    "adultoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Formacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiembroCondecoracion" (
    "id" TEXT NOT NULL,
    "miembroId" TEXT NOT NULL,
    "condecoracionId" TEXT NOT NULL,
    "fechaOtorgada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "MiembroCondecoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramaMundial" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProgramaMundial" NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProgramaMundial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiembroProgramaMundial" (
    "id" TEXT NOT NULL,
    "miembroId" TEXT NOT NULL,
    "programaMundialId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaCompletado" TIMESTAMP(3),
    "estado" "EstadoProgramaMundial" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MiembroProgramaMundial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Miembro_cedula_key" ON "Miembro"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "Adulto_miembroId_key" ON "Adulto"("miembroId");

-- CreateIndex
CREATE UNIQUE INDEX "Adulto_usuarioId_key" ON "Adulto"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "DatosScout_miembroId_key" ON "DatosScout"("miembroId");

-- CreateIndex
CREATE UNIQUE INDEX "MiembroCondecoracion_miembroId_condecoracionId_key" ON "MiembroCondecoracion"("miembroId", "condecoracionId");

-- CreateIndex
CREATE UNIQUE INDEX "MiembroProgramaMundial_miembroId_programaMundialId_key" ON "MiembroProgramaMundial"("miembroId", "programaMundialId");

-- CreateIndex
CREATE UNIQUE INDEX "FichaMedica_miembroId_key" ON "FichaMedica"("miembroId");

-- CreateIndex
CREATE UNIQUE INDEX "Joven_miembroId_key" ON "Joven"("miembroId");

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Joven" ADD CONSTRAINT "Joven_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adulto" ADD CONSTRAINT "Adulto_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adulto" ADD CONSTRAINT "Adulto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatosScout" ADD CONSTRAINT "DatosScout_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaMedica" ADD CONSTRAINT "FichaMedica_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formacion" ADD CONSTRAINT "Formacion_adultoId_fkey" FOREIGN KEY ("adultoId") REFERENCES "Adulto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroCondecoracion" ADD CONSTRAINT "MiembroCondecoracion_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroCondecoracion" ADD CONSTRAINT "MiembroCondecoracion_condecoracionId_fkey" FOREIGN KEY ("condecoracionId") REFERENCES "Condecoracion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroProgramaMundial" ADD CONSTRAINT "MiembroProgramaMundial_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroProgramaMundial" ADD CONSTRAINT "MiembroProgramaMundial_programaMundialId_fkey" FOREIGN KEY ("programaMundialId") REFERENCES "ProgramaMundial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
