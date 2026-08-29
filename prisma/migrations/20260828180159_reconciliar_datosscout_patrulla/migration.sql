ALTER TABLE "DatosScout" ADD COLUMN "patrullaId" TEXT;

-- CreateIndex
CREATE INDEX "DatosScout_patrullaId_idx" ON "DatosScout"("patrullaId");

-- AddForeignKey
ALTER TABLE "DatosScout" ADD CONSTRAINT "DatosScout_patrullaId_fkey" FOREIGN KEY ("patrullaId") REFERENCES "Patrulla"("id") ON DELETE SET NULL ON UPDATE CASCADE;
