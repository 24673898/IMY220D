const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

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

        // Create new user
        const newUser = {
            name: name || '',
            firstName: firstName || '',
            lastName: lastName || '',
            username,
            email,
            password, // Not hashing as per spec
            profileImage: '/assets/images/default-user.jpg',
            bio: bio || '',
            birthday: birthday || null,
            work: work || '',
            location: location || '',
            website: website || '',
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

module.exports = router;



