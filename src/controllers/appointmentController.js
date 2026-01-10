const prisma = require('../prisma/client');

// GET /api/appointments
const getAppointments = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let whereClause = {};
        if (role === 'DOCTOR') {
            whereClause = { doctorId: userId };
        } else {
            whereClause = { patientId: userId };
        }

        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            include: {
                patient: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                doctor: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Format for frontend
        const formatted = appointments.map(app => ({
            id: app.id,
            patientName: app.patient.name,
            doctorName: app.doctor.name,
            date: app.date.toISOString().split('T')[0], // YYYY-MM-DD
            time: app.time, // HH:mm
            type: app.type, // 'In-Person' or 'Online'
            status: app.status,
            patientAvatar: app.patient.avatarUrl
        }));

        res.json(formatted);
    } catch (error) {
        next(error);
    }
};

// POST /api/appointments
const createAppointment = async (req, res, next) => {
    try {
        const doctorId = req.user.id;
        const { patientId, date, time, type } = req.body;

        if (!patientId || !date || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                doctorId,
                patientId: parseInt(patientId),
                date: new Date(date),
                time,
                type: type || 'In-Person',
                status: 'Scheduled'
            }
        });

        // NOTIFICATION TRIGGER
        // Notify the patient
        await prisma.notification.create({
            data: {
                userId: parseInt(patientId),
                type: 'APPOINTMENT', // Ensure this enum/type is handled if strongly typed, or text matches
                message: `New appointment scheduled for ${date} at ${time} (${type || 'In-Person'})`,
                isRead: false
            }
        });

        res.status(201).json(appointment);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAppointments, createAppointment };
