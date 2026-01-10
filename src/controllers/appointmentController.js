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
        const formatted = appointments.map(app => {
            // Extract time from Date object if stored combined, or default
            const dateObj = new Date(app.date);
            const dateStr = dateObj.toISOString().split('T')[0];
            // Format HH:mm from the date object
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

            return {
                id: app.id,
                patientName: app.patient.name,
                doctorName: app.doctor.name,
                date: dateStr,
                time: timeStr,
                type: app.type,
                status: app.status,
                patientAvatar: app.patient.avatarUrl
            };
        });

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

        // Combine Date and Time
        const combinedDateTime = new Date(`${date}T${time}:00`);

        // Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                doctorId,
                patientId: parseInt(patientId),
                date: combinedDateTime,
                // Time field removed to match Schema
                type: type || 'In-Person',
                status: 'Scheduled'
            }
        });

        // NOTIFICATION TRIGGER
        await prisma.notification.create({
            data: {
                userId: parseInt(patientId),
                type: 'APPOINTMENT',
                title: 'New Appointment', // Added mandatory title
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
