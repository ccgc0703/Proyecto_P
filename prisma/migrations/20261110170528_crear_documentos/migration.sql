-- CreateEnum
CREATE TYPE "CategoriaNormativa" AS ENUM ('LEY_PROMESA', 'REGLAMENTO', 'ACTA', 'CIRCULAR', 'OTRO');

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" "CategoriaNormativa" NOT NULL,
    "descripcion" TEXT,
    "archivoUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "tamano" INTEGER,
    "nombreOriginal" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "unidadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Documento_categoria_vigente_deletedAt_idx" ON "Documento"("categoria", "vigente", "deletedAt");

-- CreateIndex
CREATE INDEX "Documento_unidadId_idx" ON "Documento"("unidadId");

-- CreateIndex
CREATE INDEX "Documento_deletedAt_idx" ON "Documento"("deletedAt");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE SET NULL ON UPDATE CASCADE;
