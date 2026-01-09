require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    try {
        const count = await prisma.user.count({
            where: { role: 'PATIENT' }
        });
        console.log('ACTUAL_PATIENT_COUNT:', count);

        const allPatients = await prisma.user.findMany({
            where: { role: 'PATIENT' },
            select: { id: true, email: true, name: true }
        });
        console.log('PATIENT_LIST:', JSON.stringify(allPatients, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
