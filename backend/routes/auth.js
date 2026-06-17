const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Rate limiter: 20 requests per 15 minutes per IP for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.DISABLE_RATE_LIMIT === 'true' ? 10000 : 20,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Register
router.post('/register', authLimiter, async (req, res) => {
    try {
        // Only destructure safe fields — NEVER trust client-supplied role
        const { fullName, email, password, departmentId } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'fullName, email, and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user exists
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user — role is always 'student' for self-registration
        user = new User({
            fullName,
            email: normalizedEmail,
            passwordHash,
            role: 'student',
            departmentId: departmentId || undefined
        });

        await user.save();

        // Create token
        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ token, user: { id: user._id, fullName: user.fullName, role: user.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login — supports email for all roles, USN for students
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email/USN and password are required' });
        }

        // Try to find by email first; if not found, try USN (students only)
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            // USN lookup — case-insensitive
            user = await User.findOne({ usn: email.trim().toUpperCase() });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const payload = {
            id: user._id,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                role: user.role,
                usn: user.usn || null,
                departmentId: user.departmentId || null
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// GET /user/:id - Get public profile
router.get('/user/:id', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        const user = await User.findById(req.params.id)
            .select('fullName email role departmentId')
            .populate('departmentId', 'name code');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

