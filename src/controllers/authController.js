const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

const register = async (req, res, next) => {
    try {
        const { name, email, password, role, specialty } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to create user and profile
        const result = await prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: role || 'PATIENT',
                },
            });

            if (role === 'DOCTOR') {
                await prisma.doctorProfile.create({
                    data: {
                        userId: user.id,
                        specialty: specialty || 'General Practitioner',
                    },
                });
            } else {
                await prisma.patientProfile.create({
                    data: {
                        userId: user.id,
                    },
                });
            }

            return user;
        });

        const crypto = require('crypto');

        // ... (register function start matches original file until line 45) ...

        // We no longer return the token to force login
        // const token = jwt.sign(...) 

        res.status(201).json({
            message: 'User created successfully. Please log in.',
            user: {
                id: result.id,
                name: result.name,
                role: result.role,
            },
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'your_super_secret_key_123', {
            expiresIn: '7d',
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                avatar: user.avatarUrl,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res) => {
    res.json({
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
        avatar: req.user.avatarUrl,
    });
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);

        await prisma.resetToken.create({
            data: {
                email,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 3600000), // 1 hour
            }
        });

        console.log(`[EMAIL MOCK] Password Reset Token for ${email}: ${resetToken}`);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, token, newPassword } = req.body;

        // Find valid tokens for this email
        const resetRecords = await prisma.resetToken.findMany({
            where: {
                email,
                expiresAt: { gt: new Date() }
            }
        });

        let validRecord = null;
        for (const record of resetRecords) {
            const isMatch = await bcrypt.compare(token, record.token);
            if (isMatch) {
                validRecord = record;
                break;
            }
        }

        if (!validRecord) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        await prisma.resetToken.deleteMany({ where: { email } });

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
