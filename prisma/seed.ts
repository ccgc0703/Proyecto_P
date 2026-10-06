import { PrismaClient, TipoNodoOrganizacion } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Catálogo de permisos ─────────────────────────────────────────────────
const PERMISOS_SEED = [
    // Users
    { accion: 'user:create', modulo: 'users', descripcion: 'Crear usuarios del sistema' },
    { accion: 'user:view', modulo: 'users', descripcion: 'Ver usuarios del sistema' },
    { accion: 'user:update', modulo: 'users', descripcion: 'Actualizar usuarios del sistema' },
    { accion: 'user:delete', modulo: 'users', descripcion: 'Eliminar usuarios del sistema' },
    // Jóvenes
    { accion: 'joven:create', modulo: 'jovenes', descripcion: 'Registrar jóvenes' },
    { accion: 'joven:view', modulo: 'jovenes', descripcion: 'Ver jóvenes' },
    { accion: 'joven:update', modulo: 'jovenes', descripcion: 'Actualizar jóvenes' },
    { accion: 'joven:delete', modulo: 'jovenes', descripcion: 'Eliminar jóvenes' },
    // Unidades
    { accion: 'unidad:create', modulo: 'unidades', descripcion: 'Crear unidades scouts' },
    { accion: 'unidad:view', modulo: 'unidades', descripcion: 'Ver unidades scouts' },
    { accion: 'unidad:update', modulo: 'unidades', descripcion: 'Actualizar unidades scouts' },
    { accion: 'unidad:delete', modulo: 'unidades', descripcion: 'Eliminar unidades scouts' },
    // Representantes
    { accion: 'representante:create', modulo: 'administrativo', descripcion: 'Registrar representantes' },
    { accion: 'representante:view', modulo: 'administrativo', descripcion: 'Ver representantes' },
    { accion: 'representante:update', modulo: 'administrativo', descripcion: 'Actualizar representantes' },
    { accion: 'representante:delete', modulo: 'administrativo', descripcion: 'Eliminar representantes' },
    // Progresión
    { accion: 'progresion:create', modulo: 'scout', descripcion: 'Registrar progresión scout' },
    { accion: 'progresion:view', modulo: 'scout', descripcion: 'Ver progresión scout' },
    { accion: 'progresion:update', modulo: 'scout', descripcion: 'Actualizar progresión scout' },
    { accion: 'progresion:aprobar', modulo: 'scout', descripcion: 'Aprobar o rechazar ascenso de adelanto' },
    // Catálogo de progresión
    { accion: 'catalogo:view', modulo: 'scout', descripcion: 'Ver catálogo de progresión' },
    { accion: 'catalogo:manage', modulo: 'scout', descripcion: 'Administrar catálogo de progresión' },
    // Condecoraciones
    { accion: 'condecoracion:create', modulo: 'scout', descripcion: 'Crear condecoraciones en catálogo' },
    { accion: 'condecoracion:view', modulo: 'scout', descripcion: 'Ver condecoraciones' },
    { accion: 'condecoracion:otorgar', modulo: 'scout', descripcion: 'Otorgar condecoración a joven' },
    // Médico
    { accion: 'medico:view', modulo: 'medico', descripcion: 'Ver ficha médica' },
    { accion: 'medico:edit', modulo: 'medico', descripcion: 'Editar ficha médica (legacy)' },
    { accion: 'medico:update', modulo: 'medico', descripcion: 'Actualizar ficha médica' },
    // RBAC
    { accion: 'rbac:view', modulo: 'rbac', descripcion: 'Ver roles y permisos' },
    { accion: 'rbac:manage', modulo: 'rbac', descripcion: 'Administrar roles y permisos' },
    { accion: 'rbac:assign-role', modulo: 'rbac', descripcion: 'Asignar roles a usuarios' },
    // Self-scope (perfil propio)
    { accion: 'self:view', modulo: 'perfil', descripcion: 'Ver el propio perfil' },
    { accion: 'self:update', modulo: 'perfil', descripcion: 'Editar el propio perfil' },
    // Estructura organizacional (Fase 1)
    { accion: 'organizacion:view', modulo: 'organizacion', descripcion: 'Ver la estructura organizacional' },
    { accion: 'organizacion:create', modulo: 'organizacion', descripcion: 'Crear nodos de la estructura (regiones, distritos, grupos)' },
    { accion: 'organizacion:update', modulo: 'organizacion', descripcion: 'Actualizar nodos de la estructura' },
    { accion: 'organizacion:delete', modulo: 'organizacion', descripcion: 'Eliminar nodos de la estructura' },
    // Módulos futuros (claves definidas, sin implementar aún)
    { accion: 'normativa:view', modulo: 'normativa', descripcion: 'Ver normativas' },
    { accion: 'normativa:manage', modulo: 'normativa', descripcion: 'Crear y aprobar normativas' },
    { accion: 'finanza:view', modulo: 'finanza', descripcion: 'Ver finanzas del grupo' },
    { accion: 'finanza:manage', modulo: 'finanza', descripcion: 'Gestionar cuotas y cobros' },
    { accion: 'evento:view', modulo: 'evento', descripcion: 'Ver eventos' },
    { accion: 'evento:create', modulo: 'evento', descripcion: 'Crear y gestionar eventos' },
    { accion: 'inventario:view', modulo: 'inventario', descripcion: 'Ver inventario' },
    { accion: 'inventario:manage', modulo: 'inventario', descripcion: 'Gestionar inventario' },
    { accion: 'asistencia:view', modulo: 'asistencia', descripcion: 'Ver asistencias' },
    { accion: 'asistencia:manage', modulo: 'asistencia', descripcion: 'Cargar asistencias' },
    { accion: 'formacion:view', modulo: 'formacion', descripcion: 'Ver formación de adultos' },
    { accion: 'formacion:manage', modulo: 'formacion', descripcion: 'Gestionar formación de adultos' },
];

// ─── Catálogo de roles ────────────────────────────────────────────────────
const ROLES_SEED = [
    { nombre: 'SYSTEM_ADMIN', descripcion: 'Administrador del Sistema — acceso total (técnico)' },
    // ── Nacional ──
    { nombre: 'NATIONAL_BOARD', descripcion: 'Consejo Nacional' },
    { nombre: 'NATIONAL_EXECUTIVE', descripcion: 'Director Ejecutivo Nacional' },
    { nombre: 'NATIONAL_DIR_JOVENES', descripcion: 'Director Nacional del Programa de Jóvenes' },
    { nombre: 'NATIONAL_DIR_ADULTOS', descripcion: 'Director Nacional de Adultos en el Movimiento' },
    { nombre: 'NATIONAL_DIR_DESARROLLO', descripcion: 'Director Nacional de Desarrollo Institucional' },
    { nombre: 'NATIONAL_COLABORADOR', descripcion: 'Cooperador Nacional' },
    // ── Regional ──
    { nombre: 'REGION_COMMISSIONER', descripcion: 'Comisionado Regional' },
    { nombre: 'REGION_ASSISTANT', descripcion: 'Asistente de Programa Regional' },
    { nombre: 'REGION_COLABORADOR', descripcion: 'Cooperador Regional' },
    // ── Distrital ──
    { nombre: 'DISTRICT_COMMISSIONER', descripcion: 'Comisionado Distrital' },
    { nombre: 'DISTRICT_ASSISTANT', descripcion: 'Asistente de Programa Distrital' },
    { nombre: 'DISTRICT_COLABORADOR', descripcion: 'Cooperador Distrital' },
    // ── Grupo / Unidad ──
    { nombre: 'GROUP_LEADER', descripcion: 'Jefe de Grupo' },
    { nombre: 'GROUP_SUBLEADER', descripcion: 'Subjefe de Grupo' },
    { nombre: 'ADULTO_MANADA', descripcion: 'Adulto de Unidad Manada' },
    { nombre: 'ADULTO_TROPA', descripcion: 'Adulto de Unidad Tropa' },
    { nombre: 'ADULTO_CLAN', descripcion: 'Adulto de Unidad Clan' },
    { nombre: 'ADULTO_COMUNIDAD', descripcion: 'Adulto de Comunidad' },
    { nombre: 'REPRESENTANTE_UNIDAD', descripcion: 'Representante de Unidad' },
    { nombre: 'ADULTO_COLABORADOR', descripcion: 'Adulto Colaborador' },
    { nombre: 'CONSULTOR', descripcion: 'Consultor — solo lectura' },
    { nombre: 'JOVEN', descripcion: 'Joven miembro — acceso propio (self-scope)' },
];

// ─── Matriz: qué permisos tiene cada rol ─────────────────────────────────
const ROL_PERMISOS_SEED: Record<string, string[]> = {
    'SYSTEM_ADMIN': [
        'user:create', 'user:view', 'user:update', 'user:delete',
        'joven:create', 'joven:view', 'joven:update', 'joven:delete',
        'unidad:create', 'unidad:view', 'unidad:update', 'unidad:delete',
        'representante:create', 'representante:view', 'representante:update', 'representante:delete',
        'progresion:create', 'progresion:view', 'progresion:update', 'progresion:aprobar',
        'catalogo:view', 'catalogo:manage',
        'condecoracion:create', 'condecoracion:view', 'condecoracion:update',
        'condecoracion:delete', 'condecoracion:otorgar',
        'medico:view', 'medico:edit', 'medico:update',
        'rbac:view', 'rbac:manage', 'rbac:assign-role',
        'organizacion:view', 'organizacion:create', 'organizacion:update', 'organizacion:delete',
        'formacion:view', 'formacion:manage',
    ],
    'GROUP_LEADER': [
        'user:create', 'user:view', 'user:update',
        'joven:create', 'joven:view', 'joven:update',
        'unidad:create', 'unidad:view',
        'representante:create', 'representante:view',
        'progresion:create', 'progresion:view', 'progresion:update', 'progresion:aprobar',
        'catalogo:view', 'catalogo:manage',
        'condecoracion:create', 'condecoracion:otorgar',
        'rbac:view', 'rbac:assign-role',
        'organizacion:view',
    ],
    'GROUP_SUBLEADER': [
        'user:view',
        'joven:view', 'joven:update',
        'unidad:view',
        'representante:view',
        'catalogo:view',
        'organizacion:view',
    ],
    // ── Nacional ──
    'NATIONAL_BOARD': [
        'organizacion:view', 'organizacion:create', 'organizacion:update', 'organizacion:delete',
        'user:view', 'rbac:view',
        'normativa:view', 'finanza:view', 'evento:view', 'inventario:view', 'asistencia:view', 'formacion:view',
    ],
    'NATIONAL_EXECUTIVE': [
        'organizacion:view', 'organizacion:create', 'organizacion:update', 'organizacion:delete',
        'user:view', 'rbac:view', 'rbac:assign-role',
        'unidad:view', 'joven:view',
        'normativa:view', 'finanza:view', 'evento:view', 'asistencia:view', 'formacion:view',
    ],
    'NATIONAL_DIR_JOVENES': [
        'organizacion:view', 'joven:view', 'progresion:view', 'catalogo:view', 'evento:view',
    ],
    'NATIONAL_DIR_ADULTOS': [
        'organizacion:view', 'formacion:view', 'asistencia:view', 'evento:view',
    ],
    'NATIONAL_DIR_DESARROLLO': [
        'organizacion:view', 'user:view', 'rbac:view', 'finanza:view', 'inventario:view', 'normativa:view',
    ],
    'NATIONAL_COLABORADOR': [
        'organizacion:view',
    ],
    // ── Regional ──
    'REGION_COMMISSIONER': [
        'organizacion:view', 'user:view', 'rbac:view', 'rbac:assign-role',
        'unidad:view', 'joven:view',
    ],
    'REGION_ASSISTANT': [
        'organizacion:view', 'unidad:view', 'joven:view', 'evento:view',
    ],
    'REGION_COLABORADOR': [
        'organizacion:view',
    ],
    // ── Distrital ──
    'DISTRICT_COMMISSIONER': [
        'organizacion:view', 'user:view', 'rbac:view', 'rbac:assign-role',
        'unidad:view', 'joven:view',
    ],
    'DISTRICT_ASSISTANT': [
        'organizacion:view', 'unidad:view', 'joven:view', 'evento:view',
    ],
    'DISTRICT_COLABORADOR': [
        'organizacion:view',
    ],
    'ADULTO_MANADA': [
        'joven:create', 'joven:view', 'joven:update',
        'progresion:create', 'progresion:view', 'progresion:update', 'progresion:aprobar',
        'catalogo:view',
        'unidad:view',
        'representante:create', 'representante:view', 'representante:update',
    ],
    'ADULTO_TROPA': [
        'joven:create', 'joven:view', 'joven:update',
        'progresion:create', 'progresion:view', 'progresion:update', 'progresion:aprobar',
        'catalogo:view',
        'unidad:view',
        'representante:create', 'representante:view', 'representante:update',
    ],
    'ADULTO_CLAN': [
        'joven:create', 'joven:view', 'joven:update',
        'progresion:create', 'progresion:view', 'progresion:update', 'progresion:aprobar',
        'catalogo:view',
        'unidad:view',
        'representante:create', 'representante:view', 'representante:update',
    ],
    'ADULTO_COMUNIDAD': [
        'joven:create', 'joven:view', 'joven:update',
        'progresion:create', 'progresion:view', 'progresion:update', 'progresion:aprobar',
        'catalogo:view',
        'unidad:view',
        'representante:create', 'representante:view', 'representante:update',
    ],
    'REPRESENTANTE_UNIDAD': [
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
    'JOVEN': [
        'self:view', 'self:update',
        'progresion:view', 'progresion:create', 'progresion:update',
        'medico:view', 'medico:edit', 'medico:update',
        // Lecturas necesarias para ver y iniciar adelantos propios
        'unidad:view', 'catalogo:view',
    ],
};

async function main() {
    console.log('🌱 Iniciando seed...\n');

    // ── 0. Renombres de compatibilidad (ejecución idempotente) ───────────
    const unidadRenombrada = await prisma.unidad.updateMany({
        where: { nombre: 'Caminantes', deletedAt: null },
        data: { nombre: 'Comunidad', descripcion: 'Comunidad de jóvenes de 15 a 18 años' },
    });
    if (unidadRenombrada.count > 0) {
        console.log(`  ↻ Unidad renombrada: Caminantes → Comunidad (${unidadRenombrada.count})`);
    }

    const rolRenombrado = await prisma.rol.updateMany({
        where: { nombre: 'ADULTO_CAMINANTES' },
        data: { nombre: 'ADULTO_COMUNIDAD', descripcion: 'Adulto de Comunidad' },
    });
    if (rolRenombrado.count > 0) {
        console.log(`  ↻ Rol renombrado: ADULTO_CAMINANTES → ADULTO_COMUNIDAD (${rolRenombrado.count})`);
    }

    const rolSecretario = await prisma.rol.updateMany({
        where: { nombre: 'SECRETARIO' },
        data: { nombre: 'REPRESENTANTE_UNIDAD', descripcion: 'Representante de Unidad' },
    });
    if (rolSecretario.count > 0) {
        console.log(`  ↻ Rol renombrado: SECRETARIO → REPRESENTANTE_UNIDAD (${rolSecretario.count})`);
    }

    // ── 1. Unidades (usando findFirst + create en lugar de upsert por nombre) ──
    const unidades = [
        { nombre: 'Manada', tipo: 'MANADA', descripcion: 'Rama para niños de 6 a 10 años' },
        { nombre: 'Tropa', tipo: 'TROPA', descripcion: 'Rama para jóvenes de 10 a 15 años' },
        { nombre: 'Comunidad', tipo: 'COMUNIDAD', descripcion: 'Comunidad de jóvenes de 15 a 18 años' },
        { nombre: 'Clan', tipo: 'CLAN', descripcion: 'Rama para jóvenes de 18 a 21 años' },
    ];

    for (const u of unidades) {
        const existing = await prisma.unidad.findFirst({ where: { nombre: u.nombre } });
        if (!existing) {
            await prisma.unidad.create({ data: u });
            console.log(`  ✓ Unidad creada: ${u.nombre}`);
        } else {
            console.log(`  — Unidad ya existe: ${u.nombre}`);
            if (existing.tipo !== u.tipo) {
                await prisma.unidad.update({ where: { id: existing.id }, data: { tipo: u.tipo } });
                console.log(`  ↻ Tipo de unidad corregido: ${u.nombre} → ${u.tipo}`);
            }
        }
    }

    // ── 1b. Estructura organizacional demo (Fase 1) ───────────────────────
    console.log('\n  🌐 Estructura organizacional...');
    const jerarquiaDemo: Array<{ tipo: TipoNodoOrganizacion; nombre: string; padre: TipoNodoOrganizacion | null }> = [
        { tipo: 'CONSEJO_NACIONAL', nombre: 'Consejo Nacional', padre: null },
        { tipo: 'DIRECCION_EJECUTIVA', nombre: 'Dirección Ejecutiva', padre: 'CONSEJO_NACIONAL' },
        { tipo: 'REGION', nombre: 'Región Centro', padre: 'DIRECCION_EJECUTIVA' },
        { tipo: 'DISTRITO', nombre: 'Distrito Capital', padre: 'REGION' },
        { tipo: 'GRUPO', nombre: 'Grupo Scout Poseidon', padre: 'DISTRITO' },
    ];
    const prefijosNodo: Record<TipoNodoOrganizacion, string> = {
        CONSEJO_NACIONAL: 'CON', DIRECCION_EJECUTIVA: 'DIR', REGION: 'REG', DISTRITO: 'DIS', GRUPO: 'GRP',
    };
    const nivelesNodo: Record<TipoNodoOrganizacion, number> = {
        CONSEJO_NACIONAL: 1, DIRECCION_EJECUTIVA: 2, REGION: 3, DISTRITO: 4, GRUPO: 5,
    };
    const nodosDemo: Partial<Record<TipoNodoOrganizacion, { id: string }>> = {};

    for (const item of jerarquiaDemo) {
        let nodo = await prisma.organizacionNodo.findFirst({
            where: { tipo: item.tipo, nombre: item.nombre, deletedAt: null },
        });
        if (!nodo) {
            let codigo = '';
            let n = 1;
            while (!codigo && n < 1000) {
                const candidato = `${prefijosNodo[item.tipo]}-${String(n).padStart(2, '0')}`;
                const usado = await prisma.organizacionNodo.findFirst({ where: { codigo: candidato } });
                if (!usado) codigo = candidato;
                n++;
            }
            nodo = await prisma.organizacionNodo.create({
                data: {
                    codigo,
                    nombre: item.nombre,
                    tipo: item.tipo,
                    nivel: nivelesNodo[item.tipo],
                    padreId: item.padre ? nodosDemo[item.padre]?.id ?? null : null,
                },
            });
            console.log(`  ✓ Nodo creado: ${item.nombre} (${nodo.codigo})`);
        } else {
            console.log(`  — Nodo ya existe: ${item.nombre} (${nodo.codigo})`);
            if (item.padre && nodosDemo[item.padre] && nodo.padreId !== nodosDemo[item.padre].id) {
                await prisma.organizacionNodo.update({
                    where: { id: nodo.id },
                    data: { padreId: nodosDemo[item.padre].id },
                });
            }
        }
        nodosDemo[item.tipo] = nodo;
    }

    // Backfill: unidades sin grupo → Grupo demo
    const grupoDemo = nodosDemo['GRUPO'];
    if (grupoDemo) {
        const unidadesSinGrupo = await prisma.unidad.findMany({
            where: { deletedAt: null, grupoId: null },
        });
        for (const u of unidadesSinGrupo) {
            await prisma.unidad.update({ where: { id: u.id }, data: { grupoId: grupoDemo.id } });
            console.log(`  ↻ Unidad asignada al grupo: ${u.nombre} → Grupo demo`);
        }
    }

    // ── 2. Usuario Admin (legacy) ────────────────────────────────────────
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

    // ── 3. RBAC: Permisos, Roles, Asignaciones (transaccional) ──────────
    console.log('\n  📦 Inicializando RBAC...');

    await prisma.$transaction(async (tx) => {
        // 3a. Crear/actualizar permisos
        const permisoMap: Record<string, string> = {};
        for (const p of PERMISOS_SEED) {
            const permiso = await tx.permiso.upsert({
                where: { accion: p.accion },
                update: { descripcion: p.descripcion },
                create: p,
            });
            permisoMap[p.accion] = permiso.id;
            console.log(`    ✓ Permiso: ${p.accion}`);
        }

        // 3b. Crear/actualizar roles
        const rolMap: Record<string, string> = {};
        for (const r of ROLES_SEED) {
            const rol = await tx.rol.upsert({
                where: { nombre: r.nombre },
                update: { descripcion: r.descripcion },
                create: { nombre: r.nombre, descripcion: r.descripcion },
            });
            rolMap[r.nombre] = rol.id;
            console.log(`    ✓ Rol: ${r.nombre}`);
        }

        // 3c. Asignar permisos a roles (idempotente)
        for (const [rolNombre, acciones] of Object.entries(ROL_PERMISOS_SEED)) {
            const rolId = rolMap[rolNombre];
            for (const accion of acciones) {
                const permisoId = permisoMap[accion];
                if (!rolId || !permisoId) continue;
                const existing = await tx.rolPermiso.findFirst({
                    where: { rolId, permisoId },
                });
                if (!existing) {
                    await tx.rolPermiso.create({ data: { rolId, permisoId } });
                } else if (existing.deletedAt) {
                    await tx.rolPermiso.update({
                        where: { id: existing.id },
                        data: { deletedAt: null },
                    });
                }
            }
            console.log(`    ✓ Permisos asignados a: ${rolNombre}`);
        }

        // 3d. Mapear usuario admin al rol SYSTEM_ADMIN
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
            } else {
                console.log(`    — Admin ya tiene rol SYSTEM_ADMIN`);
            }
        }
    });

    // ── 4. Usuario joven de pruebas (portal E2E y docs) ─────────────────
    // Cuenta mínima para los tests E2E del portal joven (frontend/e2e/rbac.spec.ts).
    console.log('\n  👤 Usuario joven de pruebas...');
    const emailJoven = 'joven.test@poseidon.com';
    const unidadPruebas =
        (await prisma.unidad.findFirst({ where: { nombre: 'Tropa', deletedAt: null } })) ??
        (await prisma.unidad.findFirst({ where: { deletedAt: null } }));
    if (!unidadPruebas) {
        throw new Error('No hay unidades para vincular al usuario joven de pruebas');
    }

    const representantePruebas = await prisma.representante.upsert({
        where: { cedula: '10970419' },
        update: {},
        create: { nombre: 'YOSELIN', cedula: '10970419' },
    });

    const miembroPruebas = await prisma.miembro.upsert({
        where: { cedula: '77777777' },
        update: {},
        create: {
            nombres: 'TEST',
            apellidos: 'PORTALJOVEN',
            cedula: '77777777',
            fechaNacimiento: new Date('2014-03-15T00:00:00.000Z'),
            genero: 'MASCULINO',
            tipo: 'JOVEN',
            estado: 'ACTIVO',
            unidadId: unidadPruebas.id,
        },
    });

    const usuarioJoven = await prisma.usuario.upsert({
        where: { email: emailJoven },
        update: {},
        create: {
            nombre: 'JOVEN TEST',
            email: emailJoven,
            password: await bcrypt.hash('joven456', 10),
            activo: true,
            unidadId: unidadPruebas.id,
        },
    });

    const vinculoJoven = await prisma.joven.findFirst({ where: { miembroId: miembroPruebas.id } });
    if (!vinculoJoven) {
        await prisma.joven.create({
            data: {
                miembroId: miembroPruebas.id,
                representanteId: representantePruebas.id,
                usuarioId: usuarioJoven.id,
            },
        });
        console.log('  ✓ Vínculo Joven creado');
    } else if (vinculoJoven.usuarioId !== usuarioJoven.id) {
        await prisma.joven.update({
            where: { id: vinculoJoven.id },
            data: { usuarioId: usuarioJoven.id },
        });
        console.log('  ↻ Vínculo Joven actualizado');
    }

    const rolJoven = await prisma.rol.findFirst({ where: { nombre: 'JOVEN' } });
    if (rolJoven) {
        const rolAsignado = await prisma.usuarioRol.findFirst({
            where: { usuarioId: usuarioJoven.id, rolId: rolJoven.id },
        });
        if (!rolAsignado) {
            await prisma.usuarioRol.create({
                data: { usuarioId: usuarioJoven.id, rolId: rolJoven.id, asignadoPor: admin.id },
            });
            console.log('    ✓ Rol JOVEN asignado');
        }
    }
    console.log(`  ✓ Usuario joven: ${emailJoven}`);

    // ── 5. Usuario adulto de pruebas (staff / portal del adulto) ────────
    // Cuenta con perfil de staff vinculado: /adultos/mi-perfil resuelve el
    // Adulto por usuarioId y devuelve 404 sin ese vínculo.
    console.log('\n  👤 Usuario adulto de pruebas...');
    const emailAdulto = 'comunidad@test.com';
    const unidadAdulto =
        (await prisma.unidad.findFirst({ where: { nombre: 'Comunidad', deletedAt: null } })) ??
        (await prisma.unidad.findFirst({ where: { deletedAt: null } }));
    if (!unidadAdulto) {
        throw new Error('No hay unidades para vincular al usuario adulto de pruebas');
    }

    const miembroAdulto = await prisma.miembro.upsert({
        where: { cedula: 'V-20123456' },
        update: {},
        create: {
            nombres: 'CARLOS',
            apellidos: 'MENDOZA',
            cedula: 'V-20123456',
            fechaNacimiento: new Date('1985-07-20T00:00:00.000Z'),
            genero: 'MASCULINO',
            tipo: 'ADULTO',
            estado: 'ACTIVO',
            unidadId: unidadAdulto.id,
        },
    });

    const usuarioAdulto = await prisma.usuario.upsert({
        where: { email: emailAdulto },
        update: {},
        create: {
            nombre: 'CARLOS MENDOZA',
            email: emailAdulto,
            password: await bcrypt.hash('test123', 10),
            activo: true,
            unidadId: unidadAdulto.id,
        },
    });

    const adultoPorUsuario = await prisma.adulto.findFirst({
        where: { usuarioId: usuarioAdulto.id },
    });
    const adultoPorMiembro = await prisma.adulto.findFirst({
        where: { miembroId: miembroAdulto.id },
    });
    if (adultoPorUsuario) {
        console.log('  — Vínculo Adulto ya existe');
    } else if (adultoPorMiembro) {
        if (adultoPorMiembro.usuarioId !== usuarioAdulto.id) {
            await prisma.adulto.update({
                where: { id: adultoPorMiembro.id },
                data: { usuarioId: usuarioAdulto.id },
            });
            console.log('  ↻ Vínculo Adulto actualizado');
        }
    } else {
        await prisma.adulto.create({
            data: {
                miembroId: miembroAdulto.id,
                usuarioId: usuarioAdulto.id,
                ocupacion: 'Instructor Scout',
                telefono: '0412-1234567',
            },
        });
        console.log('  ✓ Vínculo Adulto creado');
    }

    const rolAdulto = await prisma.rol.findFirst({ where: { nombre: 'ADULTO_COMUNIDAD' } });
    if (rolAdulto) {
        const rolAsignado = await prisma.usuarioRol.findFirst({
            where: { usuarioId: usuarioAdulto.id, rolId: rolAdulto.id },
        });
        if (!rolAsignado) {
            await prisma.usuarioRol.create({
                data: { usuarioId: usuarioAdulto.id, rolId: rolAdulto.id, asignadoPor: admin.id },
            });
            console.log('    ✓ Rol ADULTO_COMUNIDAD asignado');
        }
    }
    console.log(`  ✓ Usuario adulto: ${emailAdulto}`);

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
