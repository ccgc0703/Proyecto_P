-- AlterTable
ALTER TABLE "IndicadorLogro" ADD COLUMN     "unidadId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "IndicadorLogro_unidadId_idx" ON "IndicadorLogro"("unidadId");

-- AddForeignKey
ALTER TABLE "IndicadorLogro" ADD CONSTRAINT "IndicadorLogro_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
