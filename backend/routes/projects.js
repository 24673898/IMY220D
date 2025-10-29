const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { optionalAuthenticate, authenticate, requireAdmin } = require('../middleware/auth');

// Configure multer for project image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/project-images');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: projectId-timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Configure multer for project files (documents, code, etc.)
const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const projectId = req.params.projectId;
        const uploadDir = path.join(__dirname, '../uploads/project-files', projectId);
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, uniqueSuffix + '-' + sanitizedName);
    }
});

const fileUpload = multer({
    storage: fileStorage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for project files
    }
});

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

// PUT /api/projects/:projectId - Update project (admin or member)
router.put('/:projectId', optionalAuthenticate, async (req, res) => {
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

        // Get project to check membership
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // If user is authenticated, check permissions
        if (req.user) {
            const isAdmin = req.user.role === 'admin';
            const isMember = project.members.some(memberId =>
                memberId.toString() === req.user._id.toString()
            );

            if (!isAdmin && !isMember) {
                return res.status(403).json({ error: 'Only project members or admin can update this project' });
            }
        }
        // If not authenticated, allow (for backward compatibility with old frontend)

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

// POST /api/projects/:projectId/image - Upload project image
router.post('/:projectId/image', upload.single('projectImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const { projectId } = req.params;
        const db = getDB();

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        // Get project to check if old image exists
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            // Delete uploaded file if project not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Project not found' });
        }

        // Delete old project image if it exists
        if (project.projectImage && project.projectImage.startsWith('/uploads/')) {
            const oldImagePath = path.join(__dirname, '..', project.projectImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Generate URL for the uploaded image
        const imageUrl = `/uploads/project-images/${req.file.filename}`;

        // Update project with new image URL
        const result = await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $set: { projectImage: imageUrl } }
        );

        const updatedProject = await db.collection('projects').findOne({ _id: projectIdQuery });

        res.json({
            message: 'Project image uploaded successfully',
            project: updatedProject,
            imageUrl
        });

    } catch (error) {
        console.error('Upload project image error:', error);
        // Delete uploaded file if there was an error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message || 'Failed to upload project image' });
    }
});

// DELETE /api/projects/:projectId - Delete project (admin or owner)
router.delete('/:projectId', optionalAuthenticate, async (req, res) => {
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

        // Get project to check ownership
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // If user is authenticated, check permissions
        if (req.user) {
            const isAdmin = req.user.role === 'admin';
            const isOwner = project.ownerId.toString() === req.user._id.toString();

            if (!isAdmin && !isOwner) {
                return res.status(403).json({ error: 'Only the project owner or admin can delete this project' });
            }
        }
        // If not authenticated, allow (for backward compatibility with old frontend)

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

        // Check if user is a project member
        const isMember = project.members.some(memberId =>
            memberId === userId ||
            memberId.toString() === userId ||
            memberId === userId.toString() ||
            memberId.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                error: 'Only project members can check in'
            });
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

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        // Convert userId to ObjectId if valid
        let userIdToAdd = userId;
        if (typeof userId === 'string' && ObjectId.isValid(userId)) {
            try {
                userIdToAdd = new ObjectId(userId);
            } catch (e) {
                userIdToAdd = userId;
            }
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if already a member (handle both string and ObjectId formats)
        const isMember = project.members.some(memberId =>
            memberId === userId ||
            memberId.toString() === userId ||
            memberId === userId.toString() ||
            memberId.toString() === userId.toString()
        );

        if (isMember) {
            return res.status(409).json({ error: 'User is already a member' });
        }

        // Add member (use the converted ObjectId)
        await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $push: { members: userIdToAdd } }
        );

        res.json({ message: 'Member added successfully' });

    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// PUT /api/projects/:projectId/owner - Transfer project ownership
router.put('/:projectId/owner', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { currentOwnerId, newOwnerId } = req.body;

        if (!currentOwnerId || !newOwnerId) {
            return res.status(400).json({ error: 'currentOwnerId and newOwnerId are required' });
        }

        if (currentOwnerId === newOwnerId) {
            return res.status(400).json({ error: 'New owner must be different from current owner' });
        }

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Verify current user is the owner
        if (project.ownerId.toString() !== currentOwnerId && project.ownerId !== currentOwnerId) {
            return res.status(403).json({ error: 'Only the project owner can transfer ownership' });
        }

        // Check if new owner is a project member
        const isNewOwnerMember = project.members.some(memberId =>
            memberId === newOwnerId ||
            memberId.toString() === newOwnerId ||
            memberId === newOwnerId.toString() ||
            memberId.toString() === newOwnerId.toString()
        );

        if (!isNewOwnerMember) {
            return res.status(400).json({ error: 'New owner must be a project member' });
        }

        // Convert newOwnerId to appropriate format
        let newOwnerIdToStore = newOwnerId;
        if (typeof newOwnerId === 'string' && ObjectId.isValid(newOwnerId)) {
            try {
                newOwnerIdToStore = new ObjectId(newOwnerId);
            } catch (e) {
                newOwnerIdToStore = newOwnerId;
            }
        }

        // Update project owner
        await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $set: { ownerId: newOwnerIdToStore } }
        );

        // Get updated project with new owner info
        const updatedProject = await db.collection('projects').findOne({ _id: projectIdQuery });
        const newOwner = await db.collection('users').findOne(
            { _id: newOwnerIdToStore },
            { projection: { password: 0 } }
        );

        res.json({
            message: 'Ownership transferred successfully',
            project: updatedProject,
            newOwner
        });

    } catch (error) {
        console.error('Transfer ownership error:', error);
        res.status(500).json({ error: 'Failed to transfer ownership' });
    }
});

// DELETE /api/projects/:projectId/members/:userId - Remove member from project
router.delete('/:projectId/members/:userId', async (req, res) => {
    try {
        const { projectId, userId } = req.params;

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Don't allow removing the owner
        if (project.ownerId === userId || project.ownerId.toString() === userId) {
            return res.status(400).json({ error: 'Cannot remove project owner' });
        }

        // Check if user is a member
        const isMember = project.members.some(memberId =>
            memberId === userId || memberId.toString() === userId
        );

        if (!isMember) {
            return res.status(404).json({ error: 'User is not a member of this project' });
        }

        // If project is checked out by this user, check it back in first
        if (project.status === 'checked-out' &&
            (project.checkedOutBy === userId || project.checkedOutBy?.toString() === userId)) {
            await db.collection('projects').updateOne(
                { _id: projectIdQuery },
                {
                    $set: {
                        status: 'checked-in',
                        checkedOutBy: null
                    }
                }
            );
        }

        // Remove member (handle both ObjectId and string formats)
        await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $pull: { members: userId } }
        );

        // Also try removing if stored as ObjectId
        try {
            if (ObjectId.isValid(userId)) {
                await db.collection('projects').updateOne(
                    { _id: projectIdQuery },
                    { $pull: { members: new ObjectId(userId) } }
                );
            }
        } catch (e) {
            // Ignore if ObjectId conversion fails
        }

        res.json({ message: 'Member removed successfully' });

    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// POST /api/projects/:projectId/files - Upload files to project
router.post('/:projectId/files', fileUpload.array('files', 10), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            // Clean up uploaded files if project not found
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if user is a project member
        const isMember = project.members.some(memberId =>
            memberId === userId ||
            memberId.toString() === userId ||
            memberId === userId.toString() ||
            memberId.toString() === userId.toString()
        );

        if (!isMember) {
            // Clean up uploaded files
            req.files.forEach(file => {
                fs.unlinkSync(file.path);
            });
            return res.status(403).json({ error: 'Only project members can upload files' });
        }

        // Prepare file documents
        const uploadedFiles = req.files.map(file => ({
            name: file.originalname,
            storedName: file.filename,
            size: file.size,
            path: `/uploads/project-files/${projectId}/${file.filename}`,
            uploadedAt: new Date(),
            uploadedBy: userId,
            mimetype: file.mimetype
        }));

        // Add files to project
        await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $push: { files: { $each: uploadedFiles } } }
        );

        res.json({
            message: 'Files uploaded successfully',
            files: uploadedFiles
        });

    } catch (error) {
        console.error('Upload files error:', error);
        // Clean up uploaded files on error
        if (req.files) {
            req.files.forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (e) {
                    console.error('Error deleting file:', e);
                }
            });
        }
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// GET /api/projects/:projectId/files/:filename - Download a specific file
router.get('/:projectId/files/:filename', async (req, res) => {
    try {
        const { projectId, filename } = req.params;

        console.log('Download request - projectId:', projectId, 'filename:', filename);

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            console.error('Project not found:', projectId);
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if file exists in project
        const fileDoc = project.files?.find(f => f.storedName === filename);
        if (!fileDoc) {
            console.error('File not found in project files:', filename);
            console.log('Available files:', project.files?.map(f => f.storedName));
            return res.status(404).json({ error: 'File not found in project' });
        }

        // Use the original projectId string for file path (not converted ObjectId)
        const filePath = path.join(__dirname, '../uploads/project-files', projectId, filename);
        console.log('File path:', filePath);

        // Check if file exists on disk
        if (!fs.existsSync(filePath)) {
            console.error('File not found on disk:', filePath);

            // Check if directory exists
            const dirPath = path.join(__dirname, '../uploads/project-files', projectId);
            console.log('Directory exists:', fs.existsSync(dirPath));
            if (fs.existsSync(dirPath)) {
                const filesInDir = fs.readdirSync(dirPath);
                console.log('Files in directory:', filesInDir);
            }

            return res.status(404).json({ error: 'File not found on server' });
        }

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.name}"`);
        res.setHeader('Content-Type', fileDoc.mimetype || 'application/octet-stream');

        console.log('Streaming file:', fileDoc.name);

        // Stream the file
        const fileStream = fs.createReadStream(filePath);

        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error reading file' });
            }
        });

        fileStream.pipe(res);

    } catch (error) {
        console.error('Download file error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
        }
    }
});

// DELETE /api/projects/:projectId/files/:filename - Delete a file
router.delete('/:projectId/files/:filename', async (req, res) => {
    try {
        const { projectId, filename } = req.params;
        const { userId } = req.query;

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

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if user is a project member
        const isMember = project.members.some(memberId =>
            memberId === userId ||
            memberId.toString() === userId ||
            memberId === userId.toString() ||
            memberId.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({ error: 'Only project members can delete files' });
        }

        // Find file in project
        const fileDoc = project.files?.find(f => f.storedName === filename);
        if (!fileDoc) {
            return res.status(404).json({ error: 'File not found in project' });
        }

        // Delete file from disk
        const filePath = path.join(__dirname, '../uploads/project-files', projectId, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove file from project document
        await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $pull: { files: { storedName: filename } } }
        );

        res.json({ message: 'File deleted successfully' });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
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

// PUT /api/projects/:projectId/discussion - Update project discussion (admin or member)
router.put('/:projectId/discussion', optionalAuthenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { discussion, userId } = req.body;

        // Convert string ID to ObjectId if valid
        let projectIdQuery;
        try {
            projectIdQuery = ObjectId.isValid(projectId) ? new ObjectId(projectId) : projectId;
        } catch (e) {
            projectIdQuery = projectId;
        }

        const db = getDB();
        const project = await db.collection('projects').findOne({ _id: projectIdQuery });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // If user is authenticated via middleware, check permissions
        if (req.user) {
            const isAdmin = req.user.role === 'admin';
            const isMember = project.members.some(memberId =>
                memberId.toString() === req.user._id.toString()
            );

            if (!isAdmin && !isMember) {
                return res.status(403).json({ error: 'Only project members or admin can update discussion' });
            }
        } else if (userId) {
            // For backward compatibility: check membership using userId from body
            const isMember = project.members.some(memberId =>
                memberId === userId ||
                memberId.toString() === userId ||
                memberId === userId.toString() ||
                memberId.toString() === userId.toString()
            );

            if (!isMember) {
                return res.status(403).json({ error: 'Only project members can update discussion' });
            }
        }
        // If neither authenticated nor userId provided, allow (for backward compatibility)

        // Update project discussion
        const updateData = {
            discussion: discussion || '',
            discussionUpdatedAt: new Date()
        };

        // Set discussionUpdatedBy if we have user info
        if (req.user) {
            updateData.discussionUpdatedBy = req.user._id;
        } else if (userId) {
            updateData.discussionUpdatedBy = userId;
        }

        await db.collection('projects').updateOne(
            { _id: projectIdQuery },
            { $set: updateData }
        );

        const updatedProject = await db.collection('projects').findOne({ _id: projectIdQuery });

        res.json({
            message: 'Discussion updated successfully',
            project: updatedProject
        });

    } catch (error) {
        console.error('Update discussion error:', error);
        res.status(500).json({ error: 'Failed to update discussion' });
    }
});

module.exports = router;



