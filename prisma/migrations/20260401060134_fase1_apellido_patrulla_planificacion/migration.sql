-- CreateEnum
CREATE TYPE "EstadoPlanificacion" AS ENUM ('BORRADOR', 'APROBADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('REUNION', 'CAMPAMENTO', 'EXCURSION', 'SERVICIO_COMUNITARIO', 'TALLER', 'CEREMONIA', 'COMPETENCIA', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "FichaMedica" ADD COLUMN     "tipoSangre" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "apellido" TEXT,
ADD COLUMN     "fotoUrl" TEXT;

-- CreateTable
CREATE TABLE "Patrulla" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "color" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "Patrulla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planificacion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "unidadId" TEXT,
    "estado" "EstadoPlanificacion" NOT NULL DEFAULT 'BORRADOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Planificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoActividad" NOT NULL DEFAULT 'REUNION',
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT,
    "horaFin" TEXT,
    "lugar" TEXT,
    "responsable" TEXT,
    "planificacionId" TEXT NOT NULL,
    "estado" "EstadoActividad" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patrulla_unidadId_idx" ON "Patrulla"("unidadId");

-- CreateIndex
CREATE INDEX "Actividad_planificacionId_idx" ON "Actividad"("planificacionId");

-- CreateIndex
CREATE INDEX "Actividad_fecha_idx" ON "Actividad"("fecha");

-- AddForeignKey
ALTER TABLE "Patrulla" ADD CONSTRAINT "Patrulla_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planificacion" ADD CONSTRAINT "Planificacion_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_planificacionId_fkey" FOREIGN KEY ("planificacionId") REFERENCES "Planificacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
