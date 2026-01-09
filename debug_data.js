const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function debug() {
    try {
        console.log('--- DEBUG USER DATA ---');
        // 1. Get Patient URL/ID
        const patient = await prisma.user.findFirst({ where: { email: 'jul@gmail.com' } });
        if (!patient) {
            console.log('Patient jul@gmail.com NOT FOUND');
            return;
        }
        console.log(`Patient Found: ID=${patient.id}, Name=${patient.name}`);

        // 2. Check Reminders
        const reminders = await prisma.medicationReminder.findMany({ where: { patientId: patient.id } });
        console.log(`\n[MedicationReminder] Count: ${reminders.length}`);
        console.log(JSON.stringify(reminders, null, 2));

        // 3. Check Notifications
        const notifications = await prisma.notification.findMany({ where: { userId: patient.id } });
        console.log(`\n[Notification] Count: ${notifications.length}`);
        console.log(JSON.stringify(notifications, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
