-- Normaliza Unidad.tipo al valor de despliegue que espera el frontend.
-- El seed históricamente guardaba 'RAMA' en lugar de MANADA/TROPA/COMUNIDAD/CLAN.
UPDATE "Unidad"
SET "tipo" = CASE lower("nombre")
    WHEN 'manada' THEN 'MANADA'
    WHEN 'tropa' THEN 'TROPA'
    WHEN 'comunidad' THEN 'COMUNIDAD'
    WHEN 'clan' THEN 'CLAN'
    ELSE "tipo"
END
WHERE "deletedAt" IS NULL;
