const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// GET /api/projects - Get all projects or filter by user
router.get('/', async (req, res) => {
    try {
        const { userId, type } = req.query;
        const db = getDB();

        let query = {};
        if (userId) {
            // Handle both string and ObjectId formats for userId
            const userIdOptions = [userId];
            if (ObjectId.isValid(userId)) {
                try {
                    userIdOptions.push(new ObjectId(userId));
                } catch (e) {
                    // Ignore conversion error
                }
            }
            query.members = { $in: userIdOptions };
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

        // Convert string ID to ObjectId if it's a valid ObjectId format, otherwise use as string
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId; // fallback to string for old projects
        }

        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Get project activity (check-ins)
        const activity = await db.collection('checkins')
            .find({ projectId: project._id })
            .sort({ timestamp: -1 })
            .toArray();

        // Get owner info - try both ObjectId and string formats
        let owner;
        try {
            // First try with the ownerId as is
            owner = await db.collection('users')
                .findOne({ _id: project.ownerId }, { projection: { password: 0 } });

            // If not found and ownerId is a string that looks like an ObjectId, try converting it
            if (!owner && typeof project.ownerId === 'string' && ObjectId.isValid(project.ownerId)) {
                owner = await db.collection('users')
                    .findOne({ _id: new ObjectId(project.ownerId) }, { projection: { password: 0 } });
            }
        } catch (e) {
            console.error('Error fetching owner:', e);
        }

        // Get members info - handle both ObjectId and string formats
        const memberIds = project.members.map(memberId => {
            // Try to convert to ObjectId if it's a valid ObjectId string
            if (typeof memberId === 'string' && ObjectId.isValid(memberId)) {
                try {
                    return new ObjectId(memberId);
                } catch (e) {
                    return memberId;
                }
            }
            return memberId;
        });

        const members = await db.collection('users')
            .find({
                _id: {
                    $in: [...project.members, ...memberIds] // Try both original and converted IDs
                }
            }, { projection: { password: 0 } })
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

        // Convert ownerId to ObjectId if it's a valid ObjectId string
        let ownerIdToStore = ownerId;
        if (typeof ownerId === 'string' && ObjectId.isValid(ownerId)) {
            try {
                ownerIdToStore = new ObjectId(ownerId);
            } catch (e) {
                // Keep as string if conversion fails
                ownerIdToStore = ownerId;
            }
        }

        const newProject = {
            name,
            description,
            ownerId: ownerIdToStore,
            members: [ownerIdToStore],
            image: image || '/assets/images/default-project.jpg',
            type,
            tags: tags || [],
            version: req.body.version || '1.0.0',
            status: 'checked-in',
            checkedOutBy: null,
            createdAt: new Date(),
            files: files || [],
            downloads: 0,
            stars: 0
        };

        const result = await db.collection('projects').insertOne(newProject);

        // Get the inserted project with its MongoDB-generated _id
        const insertedProject = { ...newProject, _id: result.insertedId };

        // Create initial check-in
        const initialCheckin = {
            projectId: result.insertedId,
            userId: ownerId,
            type: 'checkin',
            message: 'Initial commit: Project created',
            version: insertedProject.version,
            timestamp: new Date(),
            files: files || []
        };

        await db.collection('checkins').insertOne(initialCheckin);

        res.status(201).json({
            message: 'Project created successfully',
            project: insertedProject
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
        const { name, description, image, type, tags, version } = req.body;

        const db = getDB();

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (image) updateData.image = image;
        if (type) updateData.type = type;
        if (tags) updateData.tags = tags;
        if (version) updateData.version = version;

        const result = await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const updatedProject = await db.collection('projects').findOne({ _id: projectIdQuery });

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

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const result = await db.collection('projects').deleteOne({ _id: projectIdQuery });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete related check-ins
        await db.collection('checkins').deleteMany({ projectId: projectIdQuery });

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

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        // Convert userId to ObjectId if valid
        let userIdToCheck = userId;
        if (typeof userId === 'string' && ObjectId.isValid(userId)) {
            try {
                userIdToCheck = new ObjectId(userId);
            } catch (e) {
                userIdToCheck = userId;
            }
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if user is a member (check both string and ObjectId formats)
        const isMember = project.members.some(memberId => {
            // Compare as strings
            const memberIdStr = memberId.toString();
            const userIdStr = userId.toString();
            return memberIdStr === userIdStr;
        });

        if (!isMember) {
            return res.status(403).json({ error: 'User is not a member of this project' });
        }

        // Check if already checked out
        if (project.status === 'checked-out') {
            return res.status(409).json({
                error: 'Project is already checked out',
                checkedOutBy: project.checkedOutBy
            });
        }

        // Checkout project - store userId in the same format as members
        await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            {
                $set: {
                    status: 'checked-out',
                    checkedOutBy: userIdToCheck
                }
            }
        );

        // Create checkout activity
        const checkoutActivity = {
            projectId: projectIdQuery,
            userId: userIdToCheck,
            type: 'checkout',
            message: 'Checked out project for editing',
            version: project.version,
            timestamp: new Date(),
            files: []
        };

        await db.collection('checkins').insertOne(checkoutActivity);

        res.json({
            message: 'Project checked out successfully',
            project: { ...project, status: 'checked-out', checkedOutBy: userIdToCheck }
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

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        // Convert userId to ObjectId if valid
        let userIdToCheck = userId;
        if (typeof userId === 'string' && ObjectId.isValid(userId)) {
            try {
                userIdToCheck = new ObjectId(userId);
            } catch (e) {
                userIdToCheck = userId;
            }
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if project is checked out by this user (compare as strings)
        const isCheckedOutByUser = project.checkedOutBy &&
            project.checkedOutBy.toString() === userId.toString();

        if (project.status !== 'checked-out' || !isCheckedOutByUser) {
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
            { _id: projectIdQuery },
            { $set: updateData }
        );

        // Create checkin activity
        const checkinActivity = {
            projectId: projectIdQuery,
            userId: userIdToCheck,
            type: 'checkin',
            message,
            version: version || project.version,
            timestamp: new Date(),
            files: files || []
        };

        await db.collection('checkins').insertOne(checkinActivity);

        const updatedProject = await db.collection('projects').findOne({ _id: projectIdQuery });

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

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const activity = await db.collection('checkins')
            .find({ projectId: projectIdQuery })
            .sort({ timestamp: -1 })
            .toArray();

        // Populate user info for each activity
        const activityWithUsers = await Promise.all(
            activity.map(async (item) => {
                // Handle both string and ObjectId formats for userId
                let user;
                try {
                    user = await db.collection('users')
                        .findOne({ _id: item.userId }, { projection: { password: 0 } });

                    // If not found and userId is a string that looks like an ObjectId, try converting it
                    if (!user && typeof item.userId === 'string' && ObjectId.isValid(item.userId)) {
                        user = await db.collection('users')
                            .findOne({ _id: new ObjectId(item.userId) }, { projection: { password: 0 } });
                    }
                } catch (e) {
                    console.error('Error fetching user for activity:', e);
                }

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



