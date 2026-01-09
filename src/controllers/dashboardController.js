const prisma = require('../prisma/client');

const getDoctorDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Count all patients to match the Patient List view
        const uniquePatientsCount = await prisma.user.count({
            where: { role: 'PATIENT' }
        });

        const appointmentsToday = await prisma.appointment.count({
            where: {
                doctorId: userId,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        const pendingRequests = await prisma.appointment.count({
            where: {
                doctorId: userId,
                status: 'PENDING',
            },
        });

        // Schedule
        const schedule = await prisma.appointment.findMany({
            where: {
                doctorId: userId,
                date: {
                    gte: today,
                    lt: tomorrow,
                },
            },
            include: { patient: true },
            orderBy: { date: 'asc' },
        });

        // Requests
        const requests = await prisma.appointment.findMany({
            where: {
                doctorId: userId,
                status: 'PENDING',
            },
            include: { patient: true },
            orderBy: { date: 'asc' },
        });

        res.json({
            stats: {
                totalPatients: uniquePatientsCount,
                appointmentsToday,
                pendingRequests,
            },
            schedule: schedule.map(appt => ({
                id: appt.id,
                time: appt.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                patientName: appt.patient.name,
                type: appt.type,
                status: appt.status,
            })),
            requests: requests.map(appt => ({
                id: appt.id,
                patientName: appt.patient.name,
                status: appt.status,
            })),
        });
    } catch (error) {
        next(error);
    }
};

const getPatientDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Greeting
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

        // Next Appointment
        const nextAppointment = await prisma.appointment.findFirst({
            where: {
                patientId: userId,
                date: { gte: new Date() },
            },
            include: { doctor: true },
            orderBy: { date: 'asc' },
        });

        // Active Medications
        const profile = await prisma.patientProfile.findUnique({
            where: { userId },
            include: { medications: { where: { isActive: true } } },
        });
        const activeMedications = profile?.medications.length || 0;

        // Recent Vitals
        const vitals = await prisma.vital.findFirst({
            where: { patientProfileId: profile?.id },
            orderBy: { recordedAt: 'desc' },
        });

        res.json({
            greeting,
            nextAppointment: nextAppointment ? {
                date: nextAppointment.date.toLocaleString(), // Simplify formatting
                doctor: nextAppointment.doctor.name,
            } : null,
            activeMedications: profile?.medications.length || 0,
            medications: profile?.medications || [],
            recentVitals: vitals ? {
                bp: `${vitals.systolic}/${vitals.diastolic}`,
                heartRate: vitals.heartRate,
            } : { bp: 'N/A', heartRate: 'N/A' },
            recentActivity: [
                { id: 1, text: "Lab results available", time: "2 hours ago" } // Mock data as requested by "Frontend -> Backend Mapping" isn't fully DB driven for this list usually
            ],
        });
    } catch (error) {
        next(error);
    }
};

const getPatientList = async (req, res, next) => {
    try {
        // Return all patients (demo mode) or assigned
        const patients = await prisma.user.findMany({
            where: { role: 'PATIENT' },
            include: { patientProfile: true },
        });

        res.json(patients.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.patientProfile?.phone,
        })));
    } catch (error) {
        next(error);
    }
};

const getPatientCase = async (req, res, next) => {
    try {
        const patientId = parseInt(req.params.id); // This is User ID
        const profile = await prisma.patientProfile.findUnique({
            where: { userId: patientId },
            include: {
                medications: true,
                vitals: { orderBy: { recordedAt: 'desc' }, take: 5 },
                user: true,
            },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }

        // Calculate Age
        let age = 'N/A';
        if (profile.dob) {
            const diff = Date.now() - new Date(profile.dob).getTime();
            age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        }

        res.json({
            overview: {
                age,
                gender: "Female", // Not in schema, defaulting or adding to schema? prompt schema didn't have Gender.
                bloodType: profile.bloodType,
            },
            medicalHistory: profile.medicalHistory,
            medications: profile.medications.map(m => ({
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency
            })),
            vitals: profile.vitals.map(v => ({
                date: v.recordedAt.toISOString().split('T')[0],
                systolic: v.systolic,
                diastolic: v.diastolic,
                heartRate: v.heartRate
            })),
        });
    } catch (error) {
        next(error);
    }
};

const updateAppointmentStatus = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        const expanded = await prisma.appointment.update({
            where: { id },
            data: { status },
        });

        res.json(expanded);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctorDashboard,
    getPatientDashboard,
    getPatientList,
    getPatientCase,
    updateAppointmentStatus
};
