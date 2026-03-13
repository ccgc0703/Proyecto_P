"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const PERMISOS_SEED = [
    { accion: 'user:create', modulo: 'users', descripcion: 'Crear usuarios del sistema' },
    { accion: 'user:view', modulo: 'users', descripcion: 'Ver usuarios del sistema' },
    { accion: 'user:update', modulo: 'users', descripcion: 'Actualizar usuarios del sistema' },
    { accion: 'user:delete', modulo: 'users', descripcion: 'Eliminar usuarios del sistema' },
    { accion: 'joven:create', modulo: 'jovenes', descripcion: 'Registrar jóvenes' },
    { accion: 'joven:view', modulo: 'jovenes', descripcion: 'Ver jóvenes' },
    { accion: 'joven:update', modulo: 'jovenes', descripcion: 'Actualizar jóvenes' },
    { accion: 'joven:delete', modulo: 'jovenes', descripcion: 'Eliminar jóvenes' },
    { accion: 'unidad:create', modulo: 'unidades', descripcion: 'Crear unidades scouts' },
    { accion: 'unidad:view', modulo: 'unidades', descripcion: 'Ver unidades scouts' },
    { accion: 'unidad:update', modulo: 'unidades', descripcion: 'Actualizar unidades scouts' },
    { accion: 'unidad:delete', modulo: 'unidades', descripcion: 'Eliminar unidades scouts' },
    { accion: 'representante:create', modulo: 'administrativo', descripcion: 'Registrar representantes' },
    { accion: 'representante:view', modulo: 'administrativo', descripcion: 'Ver representantes' },
    { accion: 'representante:update', modulo: 'administrativo', descripcion: 'Actualizar representantes' },
    { accion: 'representante:delete', modulo: 'administrativo', descripcion: 'Eliminar representantes' },
    { accion: 'progresion:create', modulo: 'scout', descripcion: 'Registrar progresión scout' },
    { accion: 'progresion:view', modulo: 'scout', descripcion: 'Ver progresión scout' },
    { accion: 'progresion:update', modulo: 'scout', descripcion: 'Actualizar progresión scout' },
    { accion: 'condecoracion:create', modulo: 'scout', descripcion: 'Crear condecoraciones en catálogo' },
    { accion: 'condecoracion:view', modulo: 'scout', descripcion: 'Ver condecoraciones' },
    { accion: 'condecoracion:otorgar', modulo: 'scout', descripcion: 'Otorgar condecoración a joven' },
    { accion: 'medico:view', modulo: 'medico', descripcion: 'Ver ficha médica' },
    { accion: 'medico:edit', modulo: 'medico', descripcion: 'Editar ficha médica (legacy)' },
    { accion: 'medico:update', modulo: 'medico', descripcion: 'Actualizar ficha médica' },
    { accion: 'rbac:view', modulo: 'rbac', descripcion: 'Ver roles y permisos' },
    { accion: 'rbac:manage', modulo: 'rbac', descripcion: 'Administrar roles y permisos' },
    { accion: 'rbac:assign-role', modulo: 'rbac', descripcion: 'Asignar roles a usuarios' },
];
const ROLES_SEED = [
    { nombre: 'SYSTEM_ADMIN', descripcion: 'Administrador del Sistema — acceso total' },
    { nombre: 'GROUP_LEADER', descripcion: 'Jefe de Grupo' },
    { nombre: 'GROUP_SUBLEADER', descripcion: 'Subjefe de Grupo' },
    { nombre: 'ADULTO_MANADA', descripcion: 'Adulto de Unidad Manada' },
    { nombre: 'ADULTO_TROPA', descripcion: 'Adulto de Unidad Tropa' },
    { nombre: 'ADULTO_CLAN', descripcion: 'Adulto de Unidad Clan' },
    { nombre: 'SECRETARIO', descripcion: 'Secretario del Grupo' },
    { nombre: 'ADULTO_COLABORADOR', descripcion: 'Adulto Colaborador' },
    { nombre: 'CONSULTOR', descripcion: 'Consultor — solo lectura' },
];
const ROL_PERMISOS_SEED = {
    'SYSTEM_ADMIN': [
        'user:create', 'user:view', 'user:update', 'user:delete',
        'joven:create', 'joven:view', 'joven:update', 'joven:delete',
        'unidad:create', 'unidad:view', 'unidad:update', 'unidad:delete',
        'representante:create', 'representante:view', 'representante:update', 'representante:delete',
        'progresion:create', 'progresion:view', 'progresion:update',
        'condecoracion:create', 'condecoracion:view', 'condecoracion:otorgar',
        'medico:view', 'medico:edit', 'medico:update',
        'rbac:view', 'rbac:manage', 'rbac:assign-role',
    ],
    'GROUP_LEADER': [
        'user:create', 'user:view', 'user:update',
        'joven:create', 'joven:view', 'joven:update',
        'unidad:create', 'unidad:view',
        'representante:create', 'representante:view',
        'progresion:create',
        'condecoracion:create', 'condecoracion:otorgar',
        'rbac:assign-role',
    ],
    'GROUP_SUBLEADER': [
        'user:view',
        'joven:view', 'joven:update',
        'unidad:view',
        'representante:view',
    ],
    'ADULTO_MANADA': [
        'joven:create', 'joven:view', 'joven:update',
        'progresion:create', 'progresion:view',
    ],
    'ADULTO_TROPA': [
        'joven:create', 'joven:view', 'joven:update',
        'progresion:create', 'progresion:view',
    ],
    'ADULTO_CLAN': [
        'joven:create', 'joven:view', 'joven:update',
        'progresion:create', 'progresion:view',
    ],
    'SECRETARIO': [
        'representante:create', 'representante:view', 'representante:update',
        'medico:update',
        'joven:view',
    ],
    'ADULTO_COLABORADOR': [
        'joven:view',
    ],
    'CONSULTOR': [
        'joven:view',
    ],
};
async function main() {
    console.log('🌱 Iniciando seed...\n');
    const unidades = [
        { nombre: 'Manada', tipo: 'RAMA', descripcion: 'Rama para niños de 7 a 11 años' },
        { nombre: 'Tropa', tipo: 'RAMA', descripcion: 'Rama para jóvenes de 11 a 15 años' },
        { nombre: 'Clan', tipo: 'RAMA', descripcion: 'Rama para jóvenes de 15 a 21 años' },
    ];
    for (const u of unidades) {
        const existing = await prisma.unidad.findFirst({ where: { nombre: u.nombre } });
        if (!existing) {
            await prisma.unidad.create({ data: u });
            console.log(`  ✓ Unidad creada: ${u.nombre}`);
        }
        else {
            console.log(`  — Unidad ya existe: ${u.nombre}`);
        }
    }
    const adminEmail = 'admin@poseidon.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.usuario.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            nombre: 'Administrador del Sistema',
            email: adminEmail,
            password: hashedPassword,
            activo: true,
        },
    });
    console.log(`\n  ✓ Usuario admin: ${adminEmail}`);
    console.log('\n  📦 Inicializando RBAC...');
    await prisma.$transaction(async (tx) => {
        const permisoMap = {};
        for (const p of PERMISOS_SEED) {
            const permiso = await tx.permiso.upsert({
                where: { accion: p.accion },
                update: { descripcion: p.descripcion },
                create: p,
            });
            permisoMap[p.accion] = permiso.id;
            console.log(`    ✓ Permiso: ${p.accion}`);
        }
        const rolMap = {};
        for (const r of ROLES_SEED) {
            const rol = await tx.rol.upsert({
                where: { nombre: r.nombre },
                update: { descripcion: r.descripcion },
                create: { nombre: r.nombre, descripcion: r.descripcion },
            });
            rolMap[r.nombre] = rol.id;
            console.log(`    ✓ Rol: ${r.nombre}`);
        }
        for (const [rolNombre, acciones] of Object.entries(ROL_PERMISOS_SEED)) {
            const rolId = rolMap[rolNombre];
            for (const accion of acciones) {
                const permisoId = permisoMap[accion];
                if (!rolId || !permisoId)
                    continue;
                const existing = await tx.rolPermiso.findFirst({
                    where: { rolId, permisoId },
                });
                if (!existing) {
                    await tx.rolPermiso.create({ data: { rolId, permisoId } });
                }
                else if (existing.deletedAt) {
                    await tx.rolPermiso.update({
                        where: { id: existing.id },
                        data: { deletedAt: null },
                    });
                }
            }
            console.log(`    ✓ Permisos asignados a: ${rolNombre}`);
        }
        const adminRolId = rolMap['SYSTEM_ADMIN'];
        if (adminRolId) {
            const existingUR = await tx.usuarioRol.findFirst({
                where: { usuarioId: admin.id, rolId: adminRolId },
            });
            if (!existingUR) {
                await tx.usuarioRol.create({
                    data: { usuarioId: admin.id, rolId: adminRolId, asignadoPor: admin.id },
                });
                console.log(`    ✓ Admin mapeado a rol SYSTEM_ADMIN`);
            }
            else {
                console.log(`    — Admin ya tiene rol SYSTEM_ADMIN`);
            }
        }
    });
    console.log('\n✅ Seed finalizado con éxito.');
}
main()
    .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map