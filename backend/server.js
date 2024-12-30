const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/temp');

const app = express();
const cors = require('cors');
app.use(cors({ origin: 'http://127.0.0.1:3000' }));
const adminRoutes = require('./routes/admin');

app.use('/api/admin', adminRoutes);

const path = require('path');

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
require('dotenv').config(); // Load environment variables

const jwt = require('jsonwebtoken');

