const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// GET /api/users/:userId - Get user profile
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDB();

        // Try to find user with the ID (handles both string IDs and ObjectIds)
        let user;
        try {
            // First try as ObjectId
            user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        } catch (e) {
            // If ObjectId conversion fails, try as string
            user = await db.collection('users').findOne({ _id: userId });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's projects (try both ObjectId and string formats)
        let projects = await db.collection('projects').find({
            $or: [
                { members: userId },
                { members: user._id }
            ]
        }).toArray();

        // Get user's activity (check-ins)
        let activity = await db.collection('checkins').find({
            $or: [
                { userId: userId },
                { userId: user._id }
            ]
        }).sort({ timestamp: -1 }).limit(10).toArray();

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        res.json({
            user: userWithoutPassword,
            projects,
            activity
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// PUT /api/users/:userId - Update user profile
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, username, email, bio, location, website, name, birthday, work, profileImage } = req.body;

        const db = getDB();

        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName || '';
        if (lastName !== undefined) updateData.lastName = lastName || '';
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (bio !== undefined) updateData.bio = bio || '';
        if (location !== undefined) updateData.location = location || '';
        if (website !== undefined) updateData.website = website || '';
        if (name !== undefined) updateData.name = name || '';
        if (birthday !== undefined) updateData.birthday = birthday || '';
        if (work !== undefined) updateData.work = work || '';
        if (profileImage !== undefined) updateData.profileImage = profileImage;

        // Try to update with ObjectId first, then string
        let result;
        let queryId;
        try {
            queryId = new ObjectId(userId);
            result = await db.collection('users').updateOne(
                { _id: queryId },
                { $set: updateData }
            );
        } catch (e) {
            queryId = userId;
            result = await db.collection('users').updateOne(
                { _id: queryId },
                { $set: updateData }
            );
        }

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = await db.collection('users').findOne({ _id: queryId });
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
            message: 'Profile updated successfully',
            user: userWithoutPassword
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// DELETE /api/users/:userId - Delete user profile
// DELETE /api/users/:userId - Delete user profile
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDB();

        console.log('Attempting to delete user with ID:', userId);

        // Try to delete with ObjectId first, then with string
        let result;
        try {
            // First try as ObjectId
            result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
        } catch (e) {
            // If ObjectId conversion fails, try as string
            console.log('ObjectId conversion failed, trying as string ID');
            result = await db.collection('users').deleteOne({ _id: userId });
        }

        if (result.deletedCount === 0) {
            console.log('User not found with ID:', userId);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('User deleted successfully, cleaning up related data...');

        // Delete user's projects (where they are the owner)
        await db.collection('projects').deleteMany({ 
            $or: [
                { ownerId: new ObjectId(userId) },
                { ownerId: userId }
            ]
        });

        // Remove user from project members (handle both ObjectId and string)
        await db.collection('projects').updateMany(
            { 
                $or: [
                    { members: userId },
                    { members: new ObjectId(userId) }
                ]
            },
            { 
                $pull: { 
                    members: { 
                        $in: [userId, new ObjectId(userId)] 
                    } 
                } 
            }
        );

        // Delete user's friendships (handle both ObjectId and string)
        await db.collection('friends').deleteMany({
            $or: [
                { userId: userId },
                { userId: new ObjectId(userId) },
                { friendId: userId },
                { friendId: new ObjectId(userId) }
            ]
        });

        // Delete user's check-ins
        await db.collection('checkins').deleteMany({
            $or: [
                { userId: userId },
                { userId: new ObjectId(userId) }
            ]
        });

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET /api/users/:userId/friends - Get user's friends
router.get('/:userId/friends', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDB();

        // Find accepted friendships (handle both ObjectId and string)
        const friendships = await db.collection('friends').find({
            $or: [
                { userId: userId },
                { userId: userId }
            ],
            status: 'accepted'
        }).toArray();

        const friendIds = friendships.map(f => f.friendId);

        // Get friend details (handle both ObjectId and string formats)
        const friends = await db.collection('users').find({
            $or: [
                { _id: { $in: friendIds } },
                { _id: { $in: friendIds.map(id => {
                    try {
                        return new ObjectId(id);
                    } catch (e) {
                        return id;
                    }
                }) } }
            ]
        }).project({ password: 0 }).toArray();

        res.json({ friends });

    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

// POST /api/users/:userId/friends - Send friend request
router.post('/:userId/friends', async (req, res) => {
    try {
        const { userId } = req.params;
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({ error: 'friendId is required' });
        }

        const db = getDB();

        // Check if friendship already exists
        const existingFriendship = await db.collection('friends').findOne({
            $or: [
                { userId, friendId },
                { userId: friendId, friendId: userId }
            ]
        });

        if (existingFriendship) {
            return res.status(409).json({ 
                error: 'Friend request already exists or users are already friends' 
            });
        }

        // Create friend request (auto-accept for simplicity)
        const friendships = [
            {
                userId,
                friendId,
                status: 'accepted',
                createdAt: new Date()
            },
            {
                userId: friendId,
                friendId: userId,
                status: 'accepted',
                createdAt: new Date()
            }
        ];

        await db.collection('friends').insertMany(friendships);

        res.status(201).json({ 
            message: 'Friend request sent and accepted' 
        });

    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

// DELETE /api/users/:userId/friends/:friendId - Unfriend user
router.delete('/:userId/friends/:friendId', async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        const db = getDB();

        // Delete both friendship records
        await db.collection('friends').deleteMany({
            $or: [
                { userId, friendId },
                { userId: friendId, friendId: userId }
            ]
        });

        res.json({ message: 'Friend removed successfully' });

    } catch (error) {
        console.error('Unfriend error:', error);
        res.status(500).json({ error: 'Failed to unfriend user' });
    }
});

module.exports = router;