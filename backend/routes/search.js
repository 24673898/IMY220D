const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { optionalAuthenticate } = require('../middleware/auth');

// GET /api/search/all-users - Get all users (admin only)
router.get('/all-users', optionalAuthenticate, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        const db = getDB();

        // Get all users, excluding passwords
        const users = await db.collection('users')
            .find({})
            .project({ password: 0 })
            .sort({ username: 1 })
            .toArray();

        res.json({ users });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch all users' });
    }
});

// GET /api/search/users?q=searchTerm - Search for users
router.get('/users', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const db = getDB();

        // Search by name, username, or email (case-insensitive)
        const users = await db.collection('users')
            .find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { username: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } }
                ]
            })
            .project({ password: 0 })
            .limit(20)
            .toArray();

        res.json({ users });

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// GET /api/search/projects?q=searchTerm - Search for projects
router.get('/projects', async (req, res) => {
    try {
        const { q, type, tag } = req.query;

        const db = getDB();
        let projectIdsFromCheckins = [];
        let projectsSet = new Set();

        // 1. Search by check-in messages if query provided
        if (q) {
            const checkins = await db.collection('checkins')
                .find({
                    message: { $regex: q, $options: 'i' }
                })
                .toArray();

            projectIdsFromCheckins = [...new Set(checkins.map(c => c.projectId))];
        }

        // 2. Build query for projects collection search
        let projectQuery = {};

        if (q) {
            // Search by name, description, or tags (hashtags)
            projectQuery.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $elemMatch: { $regex: q, $options: 'i' } } }
            ];

            // Also include projects found via checkin messages
            if (projectIdsFromCheckins.length > 0) {
                projectQuery.$or.push({ _id: { $in: projectIdsFromCheckins } });
            }
        }

        // Apply additional filters
        if (type) {
            projectQuery.type = type;
        }

        if (tag) {
            projectQuery.tags = { $elemMatch: { $regex: tag, $options: 'i' } };
        }

        // Fetch matching projects
        const projects = await db.collection('projects')
            .find(projectQuery)
            .limit(20)
            .toArray();

        // Populate owner info
        const projectsWithOwners = await Promise.all(
            projects.map(async (project) => {
                // Handle both string and ObjectId formats for ownerId
                let owner;
                try {
                    owner = await db.collection('users')
                        .findOne({ _id: project.ownerId }, { projection: { password: 0 } });

                    // If not found and ownerId is a string that looks like an ObjectId, try converting it
                    if (!owner && typeof project.ownerId === 'string' && ObjectId.isValid(project.ownerId)) {
                        owner = await db.collection('users')
                            .findOne({ _id: new ObjectId(project.ownerId) }, { projection: { password: 0 } });
                    }
                } catch (e) {
                    console.error('Error fetching owner for project:', e);
                }

                return { ...project, owner };
            })
        );

        res.json({ projects: projectsWithOwners });

    } catch (error) {
        console.error('Search projects error:', error);
        res.status(500).json({ error: 'Failed to search projects' });
    }
});

// GET /api/search/checkins?q=searchTerm - Search check-in messages
router.get('/checkins', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const db = getDB();

        const checkins = await db.collection('checkins')
            .find({ 
                message: { $regex: q, $options: 'i' }
            })
            .sort({ timestamp: -1 })
            .limit(20)
            .toArray();

        // Populate user and project info
        const checkinsWithDetails = await Promise.all(
            checkins.map(async (item) => {
                // Handle both string and ObjectId formats for userId
                let user;
                try {
                    user = await db.collection('users')
                        .findOne({ _id: item.userId }, { projection: { password: 0 } });

                    if (!user && typeof item.userId === 'string' && ObjectId.isValid(item.userId)) {
                        user = await db.collection('users')
                            .findOne({ _id: new ObjectId(item.userId) }, { projection: { password: 0 } });
                    }
                } catch (e) {
                    console.error('Error fetching user for checkin:', e);
                }

                // Handle both string and ObjectId formats for projectId
                let project;
                try {
                    project = await db.collection('projects')
                        .findOne({ _id: item.projectId });

                    if (!project && typeof item.projectId === 'string' && ObjectId.isValid(item.projectId)) {
                        project = await db.collection('projects')
                            .findOne({ _id: new ObjectId(item.projectId) });
                    }
                } catch (e) {
                    console.error('Error fetching project for checkin:', e);
                }

                return { ...item, user, project };
            })
        );

        res.json({ checkins: checkinsWithDetails });

    } catch (error) {
        console.error('Search checkins error:', error);
        res.status(500).json({ error: 'Failed to search check-ins' });
    }
});

module.exports = router;