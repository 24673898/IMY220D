const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// GET /api/checkins/local/:userId - Get local activity feed (user + friends)
router.get('/local/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDB();

        // Convert userId to ObjectId if valid
        let userIdQuery = userId;
        if (typeof userId === 'string' && ObjectId.isValid(userId)) {
            try {
                userIdQuery = new ObjectId(userId);
            } catch (e) {
                userIdQuery = userId;
            }
        }

        // Get user's friends
        const friendships = await db.collection('friends')
            .find({ userId: userIdQuery, status: 'accepted' })
            .toArray();

        const friendIds = friendships.map(f => f.friendId);
        const allUserIds = [userIdQuery, userId, ...friendIds]; // Include both formats

        // Get projects where user or friends are members
        const projects = await db.collection('projects')
            .find({ members: { $in: allUserIds } })
            .toArray();

        const projectIds = projects.map(p => p._id);

        // Get activity from these projects
        const activity = await db.collection('checkins')
            .find({ projectId: { $in: projectIds } })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        // Populate user and project info
        const activityWithDetails = await Promise.all(
            activity.map(async (item) => {
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
                    console.error('Error fetching user for activity:', e);
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
                    console.error('Error fetching project for activity:', e);
                }

                return { ...item, user, project };
            })
        );

        res.json({ activity: activityWithDetails });

    } catch (error) {
        console.error('Get local activity error:', error);
        res.status(500).json({ error: 'Failed to fetch local activity' });
    }
});

// GET /api/checkins/global - Get global activity feed (all users)
router.get('/global', async (req, res) => {
    try {
        const db = getDB();

        // Get all activity
        const activity = await db.collection('checkins')
            .find({})
            .sort({ timestamp: -1 })
            .limit(50) // Limit to 50 most recent
            .toArray();

        // Populate user and project info
        const activityWithDetails = await Promise.all(
            activity.map(async (item) => {
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
                    console.error('Error fetching user for activity:', e);
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
                    console.error('Error fetching project for activity:', e);
                }

                return { ...item, user, project };
            })
        );

        res.json({ activity: activityWithDetails });

    } catch (error) {
        console.error('Get global activity error:', error);
        res.status(500).json({ error: 'Failed to fetch global activity' });
    }
});

module.exports = router;



