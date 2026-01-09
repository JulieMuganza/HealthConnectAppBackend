const prisma = require('../prisma/client');

// GET /api/profiles/doctor
const getDoctorProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.doctorProfile.findUnique({
            where: { userId },
            include: { user: true },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({
            personal: { name: profile.user.name, email: profile.user.email },
            professional: {
                specialty: profile.specialty,
                licenseNumber: profile.licenseNumber,
                experienceYears: profile.experienceYears,
            },
            clinic: {
                name: profile.clinicName,
                address: profile.clinicAddress,
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/profiles/doctor
const updateDoctorProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { personal, professional, clinic } = req.body;

        // Update User (Personal)
        if (personal) {
            await prisma.user.update({
                where: { id: userId },
                data: { name: personal.name, email: personal.email },
            });
        }

        // Update Profile
        await prisma.doctorProfile.update({
            where: { userId },
            data: {
                specialty: professional?.specialty,
                licenseNumber: professional?.licenseNumber,
                experienceYears: professional?.experienceYears,
                clinicName: clinic?.name,
                clinicAddress: clinic?.address,
            },
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
};

// GET /api/profiles/patient
const getPatientProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await prisma.patientProfile.findUnique({
            where: { userId },
            include: { user: true },
        });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json({
            personal: {
                name: profile.user.name,
                email: profile.user.email,
                phone: profile.phone,
                dob: profile.dob ? profile.dob.toISOString().split('T')[0] : null,
            },
            medical: {
                emergencyContact: profile.emergencyContact,
                medicalHistory: profile.medicalHistory,
                allergies: profile.allergies,
                conditions: profile.chronicConditions,
            },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/profiles/patient
const updatePatientProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { personal, medical } = req.body;

        if (personal) {
            await prisma.user.update({
                where: { id: userId },
                data: { name: personal.name, email: personal.email },
            });
        }

        await prisma.patientProfile.update({
            where: { userId },
            data: {
                phone: personal?.phone,
                dob: personal?.dob ? new Date(personal.dob) : undefined,
                emergencyContact: medical?.emergencyContact,
                medicalHistory: medical?.medicalHistory,
                allergies: medical?.allergies,
                chronicConditions: medical?.conditions,
            },
        });

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctorProfile,
    updateDoctorProfile,
    getPatientProfile,
    updatePatientProfile,
};
