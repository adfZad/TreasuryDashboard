const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-treasury-key-123';

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const pool = await poolPromise;
        if (!pool) return res.status(500).json({ message: 'Database not connected' });

        const result = await pool.request()
            .input('loginName', sql.NVarChar, username)
            .query(`
                SELECT u.*, r.RoleCode, r.RoleName 
                FROM sec.AppUser u
                LEFT JOIN sec.UserRole ur ON u.AppUserId = ur.AppUserId AND ur.IsActive = 1
                LEFT JOIN sec.SecurityRole r ON ur.SecurityRoleId = r.SecurityRoleId
                WHERE u.LoginName = @loginName AND u.IsActive = 1
            `);

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT Payload
        const payload = {
            userId: user.AppUserId,
            loginName: user.LoginName,
            displayName: user.DisplayName,
            role: user.RoleCode || 'VIEWER'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            token,
            user: payload
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Middleware to protect routes
const protect = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = { router, protect };
