-- CreateTable
CREATE TABLE "Grupo" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "Grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidad" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "edad_minima" INTEGER NOT NULL,
    "edad_maxima" INTEGER NOT NULL,
    "grupoId" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "Unidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" SERIAL NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3) NOT NULL,
    "sexo" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaMedica" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "alergias" TEXT,
    "enfermedades" TEXT,
    "medicamentos" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "FichaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Miembro" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "unidadId" INTEGER NOT NULL,
    "adelanto_actual_id" INTEGER,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "Miembro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilAdulto" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "formacion" TEXT,
    "experiencia" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "PerfilAdulto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adelanto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "cantidad_indicadores" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "Adelanto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoIndicador" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "adelantoId" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "CatalogoIndicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiembroIndicador" (
    "id" SERIAL NOT NULL,
    "miembroId" INTEGER NOT NULL,
    "catalogoIndicadorId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cualitativo" BOOLEAN NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "MiembroIndicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoCurso" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "CatalogoCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiembroCurso" (
    "id" SERIAL NOT NULL,
    "miembroId" INTEGER NOT NULL,
    "catalogoCursoId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "aprobado" BOOLEAN NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "MiembroCurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoCondecoracion" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "CatalogoCondecoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaCondecoracion" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "catalogoCondecoracionId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "PersonaCondecoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogoPrograma" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "CatalogoPrograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaPrograma" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "catalogoProgramaId" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "PersonaPrograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "personaId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenRefresco" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiracion" TIMESTAMP(3) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "TokenRefresco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" SERIAL NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "usuarioId" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BitacoraAuditoria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "accion" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "registroId" INTEGER NOT NULL,
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "eliminado_en" TIMESTAMP(3),

    CONSTRAINT "BitacoraAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Persona_cedula_key" ON "Persona"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "FichaMedica_personaId_key" ON "FichaMedica"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilAdulto_personaId_key" ON "PerfilAdulto"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_personaId_key" ON "Usuario"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Unidad" ADD CONSTRAINT "Unidad_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "Grupo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaMedica" ADD CONSTRAINT "FichaMedica_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "Unidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_adelanto_actual_id_fkey" FOREIGN KEY ("adelanto_actual_id") REFERENCES "Adelanto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilAdulto" ADD CONSTRAINT "PerfilAdulto_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogoIndicador" ADD CONSTRAINT "CatalogoIndicador_adelantoId_fkey" FOREIGN KEY ("adelantoId") REFERENCES "Adelanto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroIndicador" ADD CONSTRAINT "MiembroIndicador_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroIndicador" ADD CONSTRAINT "MiembroIndicador_catalogoIndicadorId_fkey" FOREIGN KEY ("catalogoIndicadorId") REFERENCES "CatalogoIndicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroCurso" ADD CONSTRAINT "MiembroCurso_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiembroCurso" ADD CONSTRAINT "MiembroCurso_catalogoCursoId_fkey" FOREIGN KEY ("catalogoCursoId") REFERENCES "CatalogoCurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaCondecoracion" ADD CONSTRAINT "PersonaCondecoracion_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaCondecoracion" ADD CONSTRAINT "PersonaCondecoracion_catalogoCondecoracionId_fkey" FOREIGN KEY ("catalogoCondecoracionId") REFERENCES "CatalogoCondecoracion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaPrograma" ADD CONSTRAINT "PersonaPrograma_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaPrograma" ADD CONSTRAINT "PersonaPrograma_catalogoProgramaId_fkey" FOREIGN KEY ("catalogoProgramaId") REFERENCES "CatalogoPrograma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenRefresco" ADD CONSTRAINT "TokenRefresco_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BitacoraAuditoria" ADD CONSTRAINT "BitacoraAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
