/*
  Warnings:

  - A unique constraint covering the columns `[cedula]` on the table `Joven` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cedula` to the `Joven` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genero` to the `Joven` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('MASCULINO', 'FEMENINO');

-- AlterTable
ALTER TABLE "Joven" ADD COLUMN     "cedula" TEXT NOT NULL,
ADD COLUMN     "genero" "Genero" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Joven_cedula_key" ON "Joven"("cedula");
