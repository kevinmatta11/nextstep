const jwt = require('jsonwebtoken');
require('dotenv').config();

// General Authentication Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization']; // Ensure header name is correct
    const token = authHeader && authHeader.split(' ')[1]; // Extract the token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token using secret
        req.user = decoded; // Attach decoded token payload (userId, role) to req.user
        next();
    } catch (err) {
        console.error('Invalid token:', err.message); // Log the exact error for debugging
        res.status(403).json({ message: 'Invalid token.' }); // Change to 403 to indicate forbidden access
    }
};

// Role-Based Middleware (Admin Only)
const adminMiddleware = (req, res, next) => {
    authMiddleware(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }
        next();
    });
};

// Middleware to Handle User Sessions for Registration/Login
const handleUserSession = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            console.warn('Invalid token in session:', err.message);
        }
    }
    next();
};

// Authentication Middleware for Protected Routes
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access. Please log in.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification error:', err.message);
            return res.status(403).json({ message: 'Token is invalid or expired.' });
        }
        req.user = user;
        next();
    });
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    handleUserSession,
    authenticateToken,
};
