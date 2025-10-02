const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

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
        let query = {};

        if (q) {
            // Search by check-in messages
            const checkins = await db.collection('checkins')
                .find({ 
                    message: { $regex: q, $options: 'i' }
                })
                .toArray();
            
            const projectIds = [...new Set(checkins.map(c => c.projectId))];
            query._id = { $in: projectIds };
        }

        if (type) {
            query.type = type;
        }

        if (tag) {
            query.tags = { $regex: tag, $options: 'i' };
        }

        const projects = await db.collection('projects')
            .find(query)
            .limit(20)
            .toArray();

        // Populate owner info
        const projectsWithOwners = await Promise.all(
            projects.map(async (project) => {
                const owner = await db.collection('users')
                    .findOne({ _id: project.ownerId }, { projection: { password: 0 } });
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
                const user = await db.collection('users')
                    .findOne({ _id: item.userId }, { projection: { password: 0 } });
                const project = await db.collection('projects')
                    .findOne({ _id: item.projectId });
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