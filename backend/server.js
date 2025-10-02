const express = require('express');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the frontend/public directory
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// In-memory user storage (for demo purposes - replace with database in real app)
const users = [
    {
        id: 1,
        firstName: "Test",
        lastName: "User",
        email: "test@test.com",
        password: "test1234", // In real app, this would be hashed
        username: "testuser",
        bio: "Test user for demonstration purposes",
        location: "Demo City",
        website: "https://example.com",
        joinDate: "January 2024"
    }
];

// Helper function to find user by email
const findUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

// Helper function to find user by ID
const findUserById = (id) => {
    return users.find(user => user.id === parseInt(id));
};

// Authentication Routes
app.post('/api/auth/login', (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password (in real app, compare hashed password)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Return user data (exclude password)
        const { password: _, ...userData } = user;
        
        console.log('Login successful for:', email);
        res.json({
            success: true,
            message: 'Login successful',
            user: userData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

app.post('/api/auth/signup', (req, res) => {
    try {
        console.log('Signup attempt:', req.body);
        const { firstName, lastName, email, password } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        if (findUserByEmail(email)) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const newUser = {
            id: users.length + 1,
            firstName,
            lastName,
            email,
            password, // In real app, hash this password
            username: `${firstName.toLowerCase()}${lastName.toLowerCase()}${users.length + 1}`,
            bio: `Hello! I'm ${firstName} ${lastName}`,
            location: "",
            website: "",
            joinDate: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
            })
        };

        users.push(newUser);

        // Return user data (exclude password)
        const { password: _, ...userData } = newUser;

        console.log('Signup successful for:', email);
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: userData
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 1337;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /api/auth/login');
    console.log('  POST /api/auth/signup');
    console.log('  GET  /api/health');
    console.log('  GET  /* (React app)');
});