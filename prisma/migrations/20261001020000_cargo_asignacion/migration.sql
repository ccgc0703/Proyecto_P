-- CreateTable CargoAsignacion (Fase 2: cargos por nodo)
CREATE TABLE "CargoAsignacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nodoId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "CargoAsignacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CargoAsignacion_nodoId_idx" ON "CargoAsignacion"("nodoId");

-- CreateIndex
CREATE INDEX "CargoAsignacion_usuarioId_idx" ON "CargoAsignacion"("usuarioId");

-- AddForeignKey
ALTER TABLE "CargoAsignacion" ADD CONSTRAINT "CargoAsignacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoAsignacion" ADD CONSTRAINT "CargoAsignacion_nodoId_fkey" FOREIGN KEY ("nodoId") REFERENCES "OrganizacionNodo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
