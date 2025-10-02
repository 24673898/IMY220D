const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// GET /api/users/:userId - Get user profile
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDB();
        
        const user = await db.collection('users').findOne({ _id: userId });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's projects
        const projects = await db.collection('projects').find({
            members: userId
        }).toArray();

        // Get user's activity (check-ins)
        const activity = await db.collection('checkins').find({
            userId: userId
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
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (bio !== undefined) updateData.bio = bio;
        if (location) updateData.location = location;
        if (website) updateData.website = website;
        if (name) updateData.name = name;
        if (birthday) updateData.birthday = birthday;
        if (work !== undefined) updateData.work = work;
        if (profileImage) updateData.profileImage = profileImage;

        const result = await db.collection('users').updateOne(
            { _id: userId },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedUser = await db.collection('users').findOne({ _id: userId });
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
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDB();

        // Delete user
        const result = await db.collection('users').deleteOne({ _id: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user's projects (where they are the owner)
        await db.collection('projects').deleteMany({ ownerId: userId });

        // Remove user from project members
        await db.collection('projects').updateMany(
            { members: userId },
            { $pull: { members: userId } }
        );

        // Delete user's friendships
        await db.collection('friends').deleteMany({
            $or: [{ userId }, { friendId: userId }]
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

        // Find accepted friendships
        const friendships = await db.collection('friends').find({
            userId: userId,
            status: 'accepted'
        }).toArray();

        const friendIds = friendships.map(f => f.friendId);

        // Get friend details
        const friends = await db.collection('users').find({
            _id: { $in: friendIds }
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