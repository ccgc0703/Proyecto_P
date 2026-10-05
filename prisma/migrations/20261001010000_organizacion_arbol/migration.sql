-- Enum de tipos de nodo del árbol organizacional
CREATE TYPE "TipoNodoOrganizacion" AS ENUM ('CONSEJO_NACIONAL', 'DIRECCION_EJECUTIVA', 'REGION', 'DISTRITO', 'GRUPO');

-- Tabla del árbol organizacional
CREATE TABLE "OrganizacionNodo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoNodoOrganizacion" NOT NULL,
    "nivel" INTEGER NOT NULL,
    "padreId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "OrganizacionNodo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizacionNodo_codigo_key" ON "OrganizacionNodo"("codigo");
CREATE INDEX "OrganizacionNodo_padreId_idx" ON "OrganizacionNodo"("padreId");
CREATE INDEX "OrganizacionNodo_tipo_idx" ON "OrganizacionNodo"("tipo");

ALTER TABLE "OrganizacionNodo" ADD CONSTRAINT "OrganizacionNodo_padreId_fkey"
    FOREIGN KEY ("padreId") REFERENCES "OrganizacionNodo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Unidad anclada a un nodo GRUPO
ALTER TABLE "Unidad" ADD COLUMN "grupoId" TEXT;
CREATE INDEX "Unidad_grupoId_idx" ON "Unidad"("grupoId");
CREATE UNIQUE INDEX "Unidad_grupoId_tipo_key" ON "Unidad"("grupoId", "tipo");
ALTER TABLE "Unidad" ADD CONSTRAINT "Unidad_grupoId_fkey"
    FOREIGN KEY ("grupoId") REFERENCES "OrganizacionNodo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Usuario con ámbito de líder (nodo)
ALTER TABLE "Usuario" ADD COLUMN "nodoId" TEXT;
CREATE INDEX "Usuario_nodoId_idx" ON "Usuario"("nodoId");
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_nodoId_fkey"
    FOREIGN KEY ("nodoId") REFERENCES "OrganizacionNodo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
