const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');

// GET /api/projects - Get all projects or filter by user
router.get('/', async (req, res) => {
    try {
        const { userId, type } = req.query;
        const db = getDB();
        
        let query = {};
        if (userId) {
            query.members = userId;
        }
        if (type) {
            query.type = type;
        }

        const projects = await db.collection('projects')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        res.json({ projects });

    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// GET /api/projects/:projectId - Get single project
router.get('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const db = getDB();
        
        const project = await db.collection('projects').findOne({ _id: projectId });
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get project activity (check-ins)
        const activity = await db.collection('checkins')
            .find({ projectId })
            .sort({ timestamp: -1 })
            .toArray();

        // Get owner info
        const owner = await db.collection('users')
            .findOne({ _id: project.ownerId }, { projection: { password: 0 } });

        // Get members info
        const members = await db.collection('users')
            .find({ _id: { $in: project.members } }, { projection: { password: 0 } })
            .toArray();

        res.json({ 
            project,
            activity,
            owner,
            members
        });

    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
    try {
        const { name, description, ownerId, image, type, tags, files } = req.body;

        // Validation
        if (!name || !description || !ownerId || !type) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, description, ownerId, type' 
            });
        }

        const db = getDB();

        const newProject = {
            _id: `project${Date.now()}`,
            name,
            description,
            ownerId,
            members: [ownerId],
            image: image || '/assets/images/default-project.jpg',
            type,
            tags: tags || [],
            version: '1.0.0',
            status: 'checked-in',
            checkedOutBy: null,
            createdAt: new Date(),
            files: files || []
        };

        const result = await db.collection('projects').insertOne(newProject);

        // Create initial check-in
        const initialCheckin = {
            _id: `checkin${Date.now()}`,
            projectId: newProject._id,
            userId: ownerId,
            type: 'checkin',
            message: 'Initial commit: Project created',
            version: '1.0.0',
            timestamp: new Date(),
            files: files || []
        };

        await db.collection('checkins').insertOne(initialCheckin);

        res.status(201).json({ 
            message: 'Project created successfully',
            project: newProject
        });

    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT /api/projects/:projectId - Update project
router.put('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, image, type } = req.body;
        
        const db = getDB();
        
        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (image) updateData.image = image;
        if (type) updateData.type = type;

        const result = await db.collection('projects').updateOne(
            { _id: projectId },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const updatedProject = await db.collection('projects').findOne({ _id: projectId });

        res.json({ 
            message: 'Project updated successfully',
            project: updatedProject
        });

    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:projectId - Delete project
router.delete('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const db = getDB();

        const result = await db.collection('projects').deleteOne({ _id: projectId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete related check-ins
        await db.collection('checkins').deleteMany({ projectId });

        res.json({ message: 'Project deleted successfully' });

    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// POST /api/projects/:projectId/checkout - Checkout project
router.post('/:projectId/checkout', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectId });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if user is a member
        if (!project.members.includes(userId)) {
            return res.status(403).json({ error: 'User is not a member of this project' });
        }

        // Check if already checked out
        if (project.status === 'checked-out') {
            return res.status(409).json({ 
                error: 'Project is already checked out',
                checkedOutBy: project.checkedOutBy
            });
        }

        // Checkout project
        await db.collection('projects').updateOne(
            { _id: projectId },
            { 
                $set: { 
                    status: 'checked-out',
                    checkedOutBy: userId
                }
            }
        );

        // Create checkout activity
        const checkoutActivity = {
            _id: `checkin${Date.now()}`,
            projectId,
            userId,
            type: 'checkout',
            message: 'Checked out project for editing',
            version: project.version,
            timestamp: new Date(),
            files: []
        };

        await db.collection('checkins').insertOne(checkoutActivity);

        res.json({ 
            message: 'Project checked out successfully',
            project: { ...project, status: 'checked-out', checkedOutBy: userId }
        });

    } catch (error) {
        console.error('Checkout project error:', error);
        res.status(500).json({ error: 'Failed to checkout project' });
    }
});

// POST /api/projects/:projectId/checkin - Checkin project
router.post('/:projectId/checkin', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, message, version, files } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ 
                error: 'userId and message are required' 
            });
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectId });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if project is checked out by this user
        if (project.status !== 'checked-out' || project.checkedOutBy !== userId) {
            return res.status(403).json({ 
                error: 'Project is not checked out by this user' 
            });
        }

        // Update project
        const updateData = {
            status: 'checked-in',
            checkedOutBy: null
        };

        if (version) updateData.version = version;
        if (files && files.length > 0) updateData.files = files;

        await db.collection('projects').updateOne(
            { _id: projectId },
            { $set: updateData }
        );

        // Create checkin activity
        const checkinActivity = {
            _id: `checkin${Date.now()}`,
            projectId,
            userId,
            type: 'checkin',
            message,
            version: version || project.version,
            timestamp: new Date(),
            files: files || []
        };

        await db.collection('checkins').insertOne(checkinActivity);

        const updatedProject = await db.collection('projects').findOne({ _id: projectId });

        res.json({ 
            message: 'Project checked in successfully',
            project: updatedProject
        });

    } catch (error) {
        console.error('Checkin project error:', error);
        res.status(500).json({ error: 'Failed to checkin project' });
    }
});

// POST /api/projects/:projectId/members - Add member to project
router.post('/:projectId/members', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectId });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if already a member
        if (project.members.includes(userId)) {
            return res.status(409).json({ error: 'User is already a member' });
        }

        // Add member
        await db.collection('projects').updateOne(
            { _id: projectId },
            { $push: { members: userId } }
        );

        res.json({ message: 'Member added successfully' });

    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// GET /api/projects/:projectId/activity - Get project activity feed
router.get('/:projectId/activity', async (req, res) => {
    try {
        const { projectId } = req.params;
        const db = getDB();

        const activity = await db.collection('checkins')
            .find({ projectId })
            .sort({ timestamp: -1 })
            .toArray();

        // Populate user info for each activity
        const activityWithUsers = await Promise.all(
            activity.map(async (item) => {
                const user = await db.collection('users')
                    .findOne({ _id: item.userId }, { projection: { password: 0 } });
                return { ...item, user };
            })
        );

        res.json({ activity: activityWithUsers });

    } catch (error) {
        console.error('Get project activity error:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

module.exports = router;



