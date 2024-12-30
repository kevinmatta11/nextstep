// Updated admin.js to include CV data
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Ensure correct DB file
const { adminMiddleware } = require('../middleware/authMiddleware'); // Adjust the path if needed

// Fetch all users (Admin Only)
const path = require('path');

router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT firstname, lastname, email, phone, location, role, cvpath FROM users');
        const users = result.rows.map(user => ({
            ...user,
            cvpath: user.cvpath ? `http://localhost:5000/uploads/${path.basename(user.cvpath)}` : null, // Construct correct URL
        }));
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// Fetch all appointments (Admin Only)
router.get('/appointments', adminMiddleware, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.appointmentid, a.appointmentdate, a.status, 
                   u.firstname, u.lastname, u.email 
            FROM appointments a
            JOIN users u ON a.userid = u.userid
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching appointments:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;