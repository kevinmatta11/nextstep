const multer = require('multer');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const path = require('path');

// Configure multer for file uploads
const upload = multer({
    dest: path.join(__dirname, 'uploads'),
    fileFilter: (req, file, cb) => {
        console.log('File MIME type:', file.mimetype);
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

require('dotenv').config();

const router = express.Router();

// Middleware to Authenticate Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied! Token missing.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token!' });
        }
        req.user = user;
        next();
    });
}

// Create Account Route
router.post('/register', (req, res, next) => {
    upload.single('cv')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err.message);
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            console.error('Unexpected error:', err.message);
            return res.status(400).json({ message: `Unexpected error: ${err.message}` });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);
        console.log('File:', req.file);

        const { firstName, lastName, email, password, phone, dateOfBirth, location, employmentType, role } = req.body;
        const cvPath = req.file ? req.file.path : null;

        if (!firstName || !lastName || !email || !password || !phone || !dateOfBirth || !location || !employmentType) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO users (firstname, lastname, email, password, phone, dateofbirth, location, employmenttype, cvpath, role)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [firstName, lastName, email, hashedPassword, phone, dateOfBirth, location, employmentType, cvPath, role || 'user']
        );

        return res.status(201).json({
            message: 'User created successfully!',
            user: {
                id: newUser.rows[0].userid,
                email: newUser.rows[0].email,
                role: newUser.rows[0].role,
            },
        });
    } catch (err) {
        console.error('Error during registration:', err.message);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid email or password!' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid email or password!' });
        }

        const token = jwt.sign(
            { userId: user.rows[0].userid, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful!',
            token,
            role: user.rows[0].role,
        });
    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ message: 'Server Error. Please try again later.' });
    }
});

// Profile Route
router.get('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const result = await pool.query('SELECT * FROM users WHERE userid = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const { password, ...userData } = result.rows[0];
        res.json(userData);
    } catch (error) {
        console.error('Error fetching profile:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Profile Update with CV
router.post('/profile', (req, res, next) => {
    upload.single('cv')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error:', err.message);
            return res.status(400).json({ message: `Multer error: ${err.message}` });
        } else if (err) {
            console.error('Unexpected error:', err.message);
            return res.status(400).json({ message: `Unexpected error: ${err.message}` });
        }
        next();
    });
}, authenticateToken, async (req, res) => {
    const { firstName, lastName, location, employmentType } = req.body;
    const userId = req.user.userId;
    const cvPath = req.file ? req.file.path : null;

    try {
        const query = `
            UPDATE users
            SET firstname = $1, lastname = $2, location = $3, employmenttype = $4, cvpath = COALESCE($5, cvpath)
            WHERE userid = $6
            RETURNING *;
        `;
        const values = [firstName, lastName, location, employmentType, cvPath, userId];

        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({ message: 'Profile updated successfully.', user: result.rows[0] });
    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
