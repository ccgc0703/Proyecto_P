-- AlterTable
ALTER TABLE "Joven" ADD COLUMN "usuarioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Joven_usuarioId_key" ON "Joven"("usuarioId");

-- AddForeignKey
ALTER TABLE "Joven" ADD CONSTRAINT "Joven_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
