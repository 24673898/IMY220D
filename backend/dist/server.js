"use strict";

var _excluded = ["password"],
  _excluded2 = ["password"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
var express = require('express');
var cors = require('cors');
var path = require('path');

// Create Express app
var app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cors());

// Serve static files from the frontend/public directory
app.use(express["static"](path.join(__dirname, '../frontend/public')));

// In-memory user storage (for demo purposes - replace with database in real app)
var users = [{
  id: 1,
  firstName: "Test",
  lastName: "User",
  email: "test@test.com",
  password: "test1234",
  // In real app, this would be hashed
  username: "testuser",
  bio: "Test user for demonstration purposes",
  location: "Demo City",
  website: "https://example.com",
  joinDate: "January 2024"
}];

// Helper function to find user by email
var findUserByEmail = function findUserByEmail(email) {
  return users.find(function (user) {
    return user.email === email;
  });
};

// Helper function to find user by ID
var findUserById = function findUserById(id) {
  return users.find(function (user) {
    return user.id === parseInt(id);
  });
};

// Authentication Routes
app.post('/api/auth/login', function (req, res) {
  try {
    console.log('Login attempt:', req.body);
    var _req$body = req.body,
      email = _req$body.email,
      password = _req$body.password;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    var user = findUserByEmail(email);
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
    var _ = user.password,
      userData = _objectWithoutProperties(user, _excluded);
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
app.post('/api/auth/signup', function (req, res) {
  try {
    console.log('Signup attempt:', req.body);
    var _req$body2 = req.body,
      firstName = _req$body2.firstName,
      lastName = _req$body2.lastName,
      email = _req$body2.email,
      password = _req$body2.password;

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
    var newUser = {
      id: users.length + 1,
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      // In real app, hash this password
      username: "".concat(firstName.toLowerCase()).concat(lastName.toLowerCase()).concat(users.length + 1),
      bio: "Hello! I'm ".concat(firstName, " ").concat(lastName),
      location: "",
      website: "",
      joinDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    };
    users.push(newUser);

    // Return user data (exclude password)
    var _ = newUser.password,
      userData = _objectWithoutProperties(newUser, _excluded2);
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
app.get('/api/health', function (req, res) {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Error handling middleware
app.use(function (err, req, res, next) {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
var PORT = process.env.PORT || 1337;
app.listen(PORT, function () {
  console.log("Server running on http://localhost:".concat(PORT));
  console.log('Available endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/auth/signup');
  console.log('  GET  /api/health');
  console.log('  GET  /* (React app)');
});