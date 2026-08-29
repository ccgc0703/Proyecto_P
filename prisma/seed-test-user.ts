import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Creando usuario de prueba para Caminantes...\n');

    // 1. Buscar unidad Caminantes
    const unidad = await prisma.unidad.findFirst({
        where: { nombre: 'Caminantes', deletedAt: null },
    });
    if (!unidad) {
        console.error('ERROR: Unidad "Caminantes" no encontrada. Ejecuta el seed primero.');
        process.exit(1);
    }
    console.log(`  Unidad encontrada: ${unidad.nombre} (${unidad.id})`);

    // 2. Buscar rol ADULTO_CAMINANTES
    const rol = await prisma.rol.findFirst({
        where: { nombre: 'ADULTO_CAMINANTES' },
    });
    if (!rol) {
        console.error('ERROR: Rol "ADULTO_CAMINANTES" no encontrado. Ejecuta el seed primero.');
        process.exit(1);
    }
    console.log(`  Rol encontrado: ${rol.nombre} (${rol.id})`);

    // 3. Crear Miembro (adulto)
    const miembro = await prisma.miembro.create({
        data: {
            nombres: 'CARLOS',
            apellidos: 'MENDOZA',
            cedula: 'V-20123456',
            fechaNacimiento: new Date('1985-06-15'),
            genero: 'MASCULINO',
            tipo: 'ADULTO',
            estado: 'ACTIVO',
            unidadId: unidad.id,
            createdBy: 'SEED-TEST',
        },
    });
    console.log(`  Miembro creado: ${miembro.nombres} ${miembro.apellidos} (${miembro.id})`);

    // 4. Crear Adulto vinculado al Miembro
    const adulto = await prisma.adulto.create({
        data: {
            miembroId: miembro.id,
            ocupacion: 'Instructor Scout',
            telefono: '0412-1234567',
        },
    });
    console.log(`  Adulto creado: ${adulto.id}`);

    // 5. Crear Usuario (cuenta de login)
    const email = 'caminantes@test.com';
    const hashedPassword = await bcrypt.hash('test123', 10);

    const usuario = await prisma.usuario.create({
        data: {
            nombre: 'Carlos Mendoza',
            email,
            password: hashedPassword,
            activo: true,
            unidadId: unidad.id,
        },
    });
    console.log(`  Usuario creado: ${email} (${usuario.id})`);

    // 6. Vincular Adulto con Usuario
    await prisma.adulto.update({
        where: { id: adulto.id },
        data: { usuarioId: usuario.id },
    });
    console.log(`  Adulto vinculado al Usuario`);

    // 7. Asignar rol ADULTO_CAMINANTES
    await prisma.usuarioRol.create({
        data: {
            usuarioId: usuario.id,
            rolId: rol.id,
            asignadoPor: usuario.id,
        },
    });
    console.log(`  Rol ADULTO_CAMINANTES asignado`);

    console.log('\n✅ Usuario de prueba creado exitosamente.');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: test123`);
    console.log(`   Unidad:   Caminantes`);
    console.log(`   Rol:      ADULTO_CAMINANTES`);
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
