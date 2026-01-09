const prisma = require('../prisma/client');

// GET /api/reminders
const getReminders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let reminders;
        if (role === 'DOCTOR') {
            // Doctors might want to see reminders they CREATED? 
            // Or maybe just reminders for a specific patient?
            // For now, let's return reminders created by this doctor.
            reminders = await prisma.medicationReminder.findMany({
                where: { doctorId: userId },
                include: { patient: true },
                orderBy: { createdAt: 'desc' },
            });
        } else {
            // Patients see reminders assigned to them
            reminders = await prisma.medicationReminder.findMany({
                where: { patientId: userId },
                include: { doctor: true },
                orderBy: { createdAt: 'desc' },
            });
        }

        res.json(reminders);
    } catch (error) {
        next(error);
    }
};

// POST /api/reminders
const createReminder = async (req, res, next) => {
    try {
        const doctorId = req.user.id;
        const { patientId, medicationName, dosage, frequency, instructions } = req.body;

        if (req.user.role !== 'DOCTOR') {
            return res.status(403).json({ error: 'Only doctors can create reminders' });
        }

        const reminder = await prisma.medicationReminder.create({
            data: {
                doctorId,
                patientId: parseInt(patientId),
                medicationName,
                dosage,
                frequency,
                instructions,
                startDate: new Date(),
            }
        });

        // Create Notification for Patient
        await prisma.notification.create({
            data: {
                userId: parseInt(patientId),
                type: 'REMINDER',
                title: 'New Medication Reminder',
                message: `Dr. ${req.user.name} added a reminder for ${medicationName}`,
            }
        });

        res.status(201).json(reminder);
    } catch (error) {
        next(error);
    }
};

module.exports = { getReminders, createReminder };
