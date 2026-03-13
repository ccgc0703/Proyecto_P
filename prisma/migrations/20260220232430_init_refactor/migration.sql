/*
  Warnings:

  - The primary key for the `BitacoraAuditoria` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actualizado_en` on the `BitacoraAuditoria` table. All the data in the column will be lost.
  - You are about to drop the column `creado_en` on the `BitacoraAuditoria` table. All the data in the column will be lost.
  - You are about to drop the column `datos_antes` on the `BitacoraAuditoria` table. All the data in the column will be lost.
  - You are about to drop the column `datos_despues` on the `BitacoraAuditoria` table. All the data in the column will be lost.
  - You are about to drop the column `eliminado_en` on the `BitacoraAuditoria` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `BitacoraAuditoria` table. All the data in the column will be lost.
  - The primary key for the `FichaMedica` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actualizado_en` on the `FichaMedica` table. All the data in the column will be lost.
  - You are about to drop the column `creado_en` on the `FichaMedica` table. All the data in the column will be lost.
  - You are about to drop the column `eliminado_en` on the `FichaMedica` table. All the data in the column will be lost.
  - You are about to drop the column `enfermedades` on the `FichaMedica` table. All the data in the column will be lost.
  - You are about to drop the column `personaId` on the `FichaMedica` table. All the data in the column will be lost.
  - The primary key for the `Unidad` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actualizado_en` on the `Unidad` table. All the data in the column will be lost.
  - You are about to drop the column `creado_en` on the `Unidad` table. All the data in the column will be lost.
  - You are about to drop the column `edad_maxima` on the `Unidad` table. All the data in the column will be lost.
  - You are about to drop the column `edad_minima` on the `Unidad` table. All the data in the column will be lost.
  - You are about to drop the column `eliminado_en` on the `Unidad` table. All the data in the column will be lost.
  - You are about to drop the column `grupoId` on the `Unidad` table. All the data in the column will be lost.
  - The primary key for the `Usuario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `actualizado_en` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `bloqueado` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `creado_en` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `eliminado_en` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `intentos_fallidos` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `personaId` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `Adelanto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Alerta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogoCondecoracion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogoCurso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogoIndicador` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CatalogoPrograma` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Grupo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Miembro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MiembroCurso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MiembroIndicador` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PerfilAdulto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Persona` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonaCondecoracion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PersonaPrograma` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TokenRefresco` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[jovenId]` on the table `FichaMedica` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `BitacoraAuditoria` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jovenId` to the `FichaMedica` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FichaMedica` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Unidad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Alerta" DROP CONSTRAINT "Alerta_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "BitacoraAuditoria" DROP CONSTRAINT "BitacoraAuditoria_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "CatalogoIndicador" DROP CONSTRAINT "CatalogoIndicador_adelantoId_fkey";

-- DropForeignKey
ALTER TABLE "FichaMedica" DROP CONSTRAINT "FichaMedica_personaId_fkey";

-- DropForeignKey
ALTER TABLE "Miembro" DROP CONSTRAINT "Miembro_adelanto_actual_id_fkey";

-- DropForeignKey
ALTER TABLE "Miembro" DROP CONSTRAINT "Miembro_personaId_fkey";

-- DropForeignKey
ALTER TABLE "Miembro" DROP CONSTRAINT "Miembro_unidadId_fkey";

-- DropForeignKey
ALTER TABLE "MiembroCurso" DROP CONSTRAINT "MiembroCurso_catalogoCursoId_fkey";

-- DropForeignKey
ALTER TABLE "MiembroCurso" DROP CONSTRAINT "MiembroCurso_miembroId_fkey";

-- DropForeignKey
ALTER TABLE "MiembroIndicador" DROP CONSTRAINT "MiembroIndicador_catalogoIndicadorId_fkey";

-- DropForeignKey
ALTER TABLE "MiembroIndicador" DROP CONSTRAINT "MiembroIndicador_miembroId_fkey";

-- DropForeignKey
ALTER TABLE "PerfilAdulto" DROP CONSTRAINT "PerfilAdulto_personaId_fkey";

-- DropForeignKey
ALTER TABLE "PersonaCondecoracion" DROP CONSTRAINT "PersonaCondecoracion_catalogoCondecoracionId_fkey";

-- DropForeignKey
ALTER TABLE "PersonaCondecoracion" DROP CONSTRAINT "PersonaCondecoracion_personaId_fkey";

-- DropForeignKey
ALTER TABLE "PersonaPrograma" DROP CONSTRAINT "PersonaPrograma_catalogoProgramaId_fkey";

-- DropForeignKey
ALTER TABLE "PersonaPrograma" DROP CONSTRAINT "PersonaPrograma_personaId_fkey";

-- DropForeignKey
ALTER TABLE "TokenRefresco" DROP CONSTRAINT "TokenRefresco_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Unidad" DROP CONSTRAINT "Unidad_grupoId_fkey";

-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_personaId_fkey";

-- DropIndex
DROP INDEX "FichaMedica_personaId_key";

-- DropIndex
DROP INDEX "Usuario_personaId_key";

-- AlterTable
ALTER TABLE "BitacoraAuditoria" DROP CONSTRAINT "BitacoraAuditoria_pkey",
DROP COLUMN "actualizado_en",
DROP COLUMN "creado_en",
DROP COLUMN "datos_antes",
DROP COLUMN "datos_despues",
DROP COLUMN "eliminado_en",
DROP COLUMN "fecha",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "datosAntes" JSONB,
ADD COLUMN     "datosDespues" JSONB,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "usuarioId" SET DATA TYPE TEXT,
ALTER COLUMN "registroId" SET DATA TYPE TEXT,
ADD CONSTRAINT "BitacoraAuditoria_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "BitacoraAuditoria_id_seq";

-- AlterTable
ALTER TABLE "FichaMedica" DROP CONSTRAINT "FichaMedica_pkey",
DROP COLUMN "actualizado_en",
DROP COLUMN "creado_en",
DROP COLUMN "eliminado_en",
DROP COLUMN "enfermedades",
DROP COLUMN "personaId",
ADD COLUMN     "condiciones" TEXT,
ADD COLUMN     "contactoEmergencia" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "jovenId" TEXT NOT NULL,
ADD COLUMN     "seguro" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "FichaMedica_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "FichaMedica_id_seq";

-- AlterTable
ALTER TABLE "Unidad" DROP CONSTRAINT "Unidad_pkey",
DROP COLUMN "actualizado_en",
DROP COLUMN "creado_en",
DROP COLUMN "edad_maxima",
DROP COLUMN "edad_minima",
DROP COLUMN "eliminado_en",
DROP COLUMN "grupoId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "tipo" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Unidad_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Unidad_id_seq";

-- AlterTable
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_pkey",
DROP COLUMN "actualizado_en",
DROP COLUMN "bloqueado",
DROP COLUMN "creado_en",
DROP COLUMN "eliminado_en",
DROP COLUMN "intentos_fallidos",
DROP COLUMN "personaId",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "nombre" TEXT NOT NULL,
ADD COLUMN     "unidadId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedBy" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Usuario_id_seq";

-- DropTable
DROP TABLE "Adelanto";

-- DropTable
DROP TABLE "Alerta";

-- DropTable
DROP TABLE "CatalogoCondecoracion";

-- DropTable
DROP TABLE "CatalogoCurso";

-- DropTable
DROP TABLE "CatalogoIndicador";

-- DropTable
DROP TABLE "CatalogoPrograma";

-- DropTable
DROP TABLE "Grupo";

-- DropTable
DROP TABLE "Miembro";

-- DropTable
DROP TABLE "MiembroCurso";

-- DropTable
DROP TABLE "MiembroIndicador";

-- DropTable
DROP TABLE "PerfilAdulto";

-- DropTable
DROP TABLE "Persona";

-- DropTable
DROP TABLE "PersonaCondecoracion";

-- DropTable
DROP TABLE "PersonaPrograma";

-- DropTable
DROP TABLE "TokenRefresco";

-- CreateTable
CREATE TABLE "Joven" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "unidadId" TEXT NOT NULL,
    "representanteId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "historial" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Joven_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Representante" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "parentesco" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Representante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condecoracion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Condecoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JovenCondecoracion" (
    "id" TEXT NOT NULL,
    "jovenId" TEXT NOT NULL,
    "condecoracionId" TEXT NOT NULL,
    "fechaOtorgada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "JovenCondecoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progresion" (
    "id" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCulminacion" TIMESTAMP(3),
    "unidadId" TEXT NOT NULL,
    "jovenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Progresion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Representante_cedula_key" ON "Representante"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "JovenCondecoracion_jovenId_condecoracionId_key" ON "JovenCondecoracion"("jovenId", "condecoracionId");

-- CreateIndex
CREATE UNIQUE INDEX "FichaMedica_jovenId_key" ON "FichaMedica"("jovenId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Joven" ADD CONSTRAINT "Joven_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Joven" ADD CONSTRAINT "Joven_representanteId_fkey" FOREIGN KEY ("representanteId") REFERENCES "Representante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaMedica" ADD CONSTRAINT "FichaMedica_jovenId_fkey" FOREIGN KEY ("jovenId") REFERENCES "Joven"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JovenCondecoracion" ADD CONSTRAINT "JovenCondecoracion_jovenId_fkey" FOREIGN KEY ("jovenId") REFERENCES "Joven"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JovenCondecoracion" ADD CONSTRAINT "JovenCondecoracion_condecoracionId_fkey" FOREIGN KEY ("condecoracionId") REFERENCES "Condecoracion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progresion" ADD CONSTRAINT "Progresion_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progresion" ADD CONSTRAINT "Progresion_jovenId_fkey" FOREIGN KEY ("jovenId") REFERENCES "Joven"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BitacoraAuditoria" ADD CONSTRAINT "BitacoraAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
