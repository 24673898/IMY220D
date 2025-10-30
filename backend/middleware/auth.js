const { MongoClient, ObjectId } = require('mongodb');

// Optional authentication middleware
// Tries to authenticate if userId is provided, but doesn't fail if missing
const optionalAuthenticate = async (req, res, next) => {
    try {
        // Get userId from request body, params, or query
        const userId = req.body.userId || req.params.userId || req.query.userId;

        if (!userId) {
            // No userId provided, continue without authentication
            req.user = null;
            req.userId = null;
            return next();
        }

        // Connect to database to verify user exists
        const uri = process.env.MONGODB_URI;
        const client = new MongoClient(uri);

        try {
            await client.connect();
            const db = client.db('IMY220');
            const usersCollection = db.collection('users');

            // Find user by ID (handle both string and ObjectId)
            let user;
            try {
                user = await usersCollection.findOne({ _id: new ObjectId(userId) });
            } catch (e) {
                user = await usersCollection.findOne({ _id: userId });
            }

            if (user) {
                // Attach user to request object for use in route handlers
                req.user = user;
                req.userId = userId;
            } else {
                req.user = null;
                req.userId = null;
            }

            next();
        } finally {
            await client.close();
        }
    } catch (error) {
        console.error('Authentication error:', error);
        // Continue even if authentication fails
        req.user = null;
        req.userId = null;
        next();
    }
};

// Simple authentication middleware
// Checks if userId is provided in request body and validates it exists in database
const authenticate = async (req, res, next) => {
    try {
        // Get userId from request body, params, or query
        const userId = req.body.userId || req.params.userId || req.query.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required. Please provide userId.' });
        }

        // Connect to database to verify user exists
        const uri = process.env.MONGODB_URI;
        const client = new MongoClient(uri);

        try {
            await client.connect();
            const db = client.db('IMY220');
            const usersCollection = db.collection('users');

            // Find user by ID (handle both string and ObjectId)
            let user;
            try {
                user = await usersCollection.findOne({ _id: new ObjectId(userId) });
            } catch (e) {
                user = await usersCollection.findOne({ _id: userId });
            }

            if (!user) {
                return res.status(401).json({ error: 'User not found. Invalid authentication.' });
            }

            // Attach user to request object for use in route handlers
            req.user = user;
            req.userId = userId;

            next();
        } finally {
            await client.close();
        }
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Admin authentication middleware
// Checks if the authenticated user has admin role
const requireAdmin = async (req, res, next) => {
    try {
        // First check if user is authenticated (should be set by authenticate middleware)
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user has admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required. Access denied.' });
        }

        next();
    } catch (error) {
        console.error('Admin authorization error:', error);
        res.status(500).json({ error: 'Authorization failed' });
    }
};

// Owner or Admin middleware
// Allows operation if user is the owner or an admin
const requireOwnerOrAdmin = (ownerIdField = 'ownerId') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Admin can always proceed
            if (req.user.role === 'admin') {
                req.isAdmin = true;
                return next();
            }

            // Check if user is the owner
            const resourceOwnerId = req.body[ownerIdField] || req.params[ownerIdField];
            const userId = req.user._id.toString();

            if (resourceOwnerId && resourceOwnerId.toString() === userId) {
                req.isOwner = true;
                return next();
            }

            return res.status(403).json({ error: 'You must be the owner or admin to perform this action' });
        } catch (error) {
            console.error('Owner/Admin authorization error:', error);
            res.status(500).json({ error: 'Authorization failed' });
        }
    };
};

module.exports = {
    authenticate,
    optionalAuthenticate,
    requireAdmin,
    requireOwnerOrAdmin
};
