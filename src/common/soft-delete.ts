/**
 * Soft-delete centralizado.
 *
 * `crearExtensionSoftDelete()` inyecta `deletedAt: null` en las lecturas de
 * los modelos que tienen la columna, de modo que ningún servicio dependa de
 * recordar el filtro manual.
 *
 * Escape hatch: para leer tambi\u00e9n los registros borrados l\u00f3gicamente,
 * declara `deletedAt: undefined` en el where. La clave existe (el hook no
 * inyecta) y Prisma la ignora.
 */

export const MODELOS_SOFT_DELETE = [
    'OrganizacionNodo',
    'CargoAsignacion',
    'Usuario',
    'Unidad',
    'Miembro',
    'Representante',
    'FichaMedica',
    'AlergiaFichaMedica',
    'MedicamentoFichaMedica',
    'CondicionFichaMedica',
    'VacunaFichaMedica',
    'Formacion',
    'Condecoracion',
    'MiembroCondecoracion',
    'AreaCrecimiento',
    'Etapa',
    'IndicadorLogro',
    'Adelanto',
    'Progresion',
    'EstadoLogroJoven',
    'ProgramaMundial',
    'MiembroProgramaMundial',
    'BitacoraAuditoria',
    'Rol',
    'UsuarioRol',
    'RolPermiso',
    'Patrulla',
    'Planificacion',
    'Actividad',
] as const;

export const OPERACIONES_LECTURA = [
    'findMany',
    'findFirst',
    'findFirstOrThrow',
    'findUnique',
    'findUniqueOrThrow',
    'count',
    'aggregate',
    'groupBy',
] as const;

type ParamsExtension = {
    operation: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any;
    model?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: (args: any) => any;
};

export function crearExtensionSoftDelete() {
    return {
        name: 'softDelete',
        query: {
            $allOperations({ operation, args, model, query }: ParamsExtension) {
                const esLectura = (OPERACIONES_LECTURA as readonly string[]).includes(operation);
                const protegido = !!model && (MODELOS_SOFT_DELETE as readonly string[]).includes(model);
                const where = args?.where;
                if (esLectura && protegido && !('deletedAt' in (where ?? {}))) {
                    args = args ?? {};
                    args.where = { ...(where ?? {}), deletedAt: null };
                }
                return query(args);
            },
        },
    };
}
