const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { ObjectId } = require('mongodb');

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
    try {
        const { name, username, email, password, birthday, work, bio, firstName, lastName, location, website } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const db = getDB();

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'User with this email or username already exists'
            });
        }

        // Create new user with safe defaults for all fields
        const newUser = {
            name: name || `${firstName || ''} ${lastName || ''}`.trim() || username,
            firstName: firstName || '',
            lastName: lastName || '',
            username,
            email,
            password, // Not hashing as per spec
            profileImage: '/assets/images/default-user.jpg',
            bio: bio || '',
            birthday: birthday || '',
            work: work || '',
            location: location || '',
            website: website || '',
            role: 'user', // Default role for new users
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            message: 'User created successfully',
            user: { ...userWithoutPassword, _id: result.insertedId }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        const db = getDB();
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Check password (not hashed as per spec)
        if (user.password !== password) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.json({ 
            message: 'Login successful',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// POST /api/auth/logout - Logout user (client-side handling mostly)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout successful' });
});

// GET /api/auth/me - Get current user info (requires userId in query)
router.get('/me', authenticate, async (req, res) => {
    try {
        const { password: _, ...userWithoutPassword } = req.user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});

// POST /api/auth/make-admin - Promote a user to admin (admin only)
router.post('/make-admin', authenticate, requireAdmin, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ error: 'Target user ID is required' });
        }

        const db = getDB();

        // Convert to ObjectId if needed
        let userId;
        try {
            userId = new ObjectId(targetUserId);
        } catch (e) {
            userId = targetUserId;
        }

        // Update user role to admin
        const result = await db.collection('users').updateOne(
            { _id: userId },
            { $set: { role: 'admin' } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User promoted to admin successfully',
            userId: targetUserId
        });

    } catch (error) {
        console.error('Make admin error:', error);
        res.status(500).json({ error: 'Failed to promote user to admin' });
    }
});

// POST /api/auth/setup-admin - Create first admin (one-time setup)
// This route should be disabled after first admin is created
router.post('/setup-admin', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }

        const db = getDB();

        // Check if any admin already exists
        const existingAdmin = await db.collection('users').findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(403).json({ error: 'Admin already exists. Use /make-admin endpoint instead.' });
        }

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            // Update existing user to admin
            let userId;
            try {
                userId = new ObjectId(existingUser._id);
            } catch (e) {
                userId = existingUser._id;
            }

            await db.collection('users').updateOne(
                { _id: userId },
                { $set: { role: 'admin' } }
            );

            const { password: _, ...userWithoutPassword } = existingUser;
            return res.json({
                message: 'Existing user promoted to admin',
                user: { ...userWithoutPassword, role: 'admin' }
            });
        }

        // Create new admin user
        const newAdmin = {
            name: username,
            firstName: '',
            lastName: '',
            username,
            email,
            password,
            profileImage: '/assets/images/default-user.jpg',
            bio: 'System Administrator',
            birthday: '',
            work: 'Administrator',
            location: '',
            website: '',
            role: 'admin',
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(newAdmin);

        const { password: _, ...userWithoutPassword } = newAdmin;
        res.status(201).json({
            message: 'Admin created successfully',
            user: { ...userWithoutPassword, _id: result.insertedId }
        });

    } catch (error) {
        console.error('Setup admin error:', error);
        res.status(500).json({ error: 'Failed to setup admin' });
    }
});

// POST /api/auth/remove-admin - Remove admin role from user (admin only)
router.post('/remove-admin', authenticate, requireAdmin, async (req, res) => {
    try {
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ error: 'Target user ID is required' });
        }

        // Prevent admin from removing their own admin role
        if (req.user._id.toString() === targetUserId) {
            return res.status(400).json({ error: 'Cannot remove your own admin privileges' });
        }

        const db = getDB();

        let userId;
        try {
            userId = new ObjectId(targetUserId);
        } catch (e) {
            userId = targetUserId;
        }

        const result = await db.collection('users').updateOne(
            { _id: userId },
            { $set: { role: 'user' } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Admin role removed successfully',
            userId: targetUserId
        });

    } catch (error) {
        console.error('Remove admin error:', error);
        res.status(500).json({ error: 'Failed to remove admin role' });
    }
});

module.exports = router;



