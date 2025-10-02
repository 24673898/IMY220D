import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Profile from '../components/Profile';
import EditProfile from '../components/EditProfile';
import ProjectList from '../components/ProjectList';
import CreateProject from '../components/CreateProject';
import FriendsList from '../components/FriendsList';
import './ProfilePage.css';

const ProfilePage = () => {
    const { id } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        projectsCount: 0,
        collaborationsCount: 0,
        friendsCount: 0
    });

    // Determine if viewing own profile (no ID = own profile)
    const isOwnProfile = !id;

    // Get current user ID from localStorage
    const getCurrentUserId = () => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            return parsedUser._id;
        }
        return null;
    };

    const userId = isOwnProfile ? getCurrentUserId() : id;

    // Fetch user data from backend
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                setLoading(false);
                setError('No user ID found');
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`http://localhost:3000/api/users/${userId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const data = await response.json();

                // Transform data to match frontend format
                const transformedUser = {
                    id: data.user._id,
                    firstName: data.user.firstName || '',
                    lastName: data.user.lastName || '',
                    email: data.user.email,
                    username: data.user.username,
                    bio: data.user.bio || '',
                    location: data.user.location || '',
                    website: data.user.website || '',
                    joinDate: data.user.createdAt ? new Date(data.user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
                    profileImage: data.user.profileImage || '/assets/images/default-user.jpg'
                };

                setUserData(transformedUser);

                // Fetch stats
                const friendsResponse = await fetch(`http://localhost:3000/api/users/${userId}/friends`);
                const friendsData = await friendsResponse.json();

                setStats({
                    projectsCount: data.projects?.length || 0,
                    collaborationsCount: data.projects?.filter(p => p.ownerId !== userId).length || 0,
                    friendsCount: friendsData.friends?.length || 0
                });

            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    // Handle profile save
    const handleProfileSave = async (formData) => {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const data = await response.json();

            // Update local userData state
            const transformedUser = {
                id: data.user._id,
                firstName: data.user.firstName || '',
                lastName: data.user.lastName || '',
                email: data.user.email,
                username: data.user.username,
                bio: data.user.bio || '',
                location: data.user.location || '',
                website: data.user.website || '',
                joinDate: userData.joinDate,
                profileImage: data.user.profileImage || '/assets/images/default-user.jpg'
            };

            setUserData(transformedUser);

            // Update localStorage if it's own profile
            if (isOwnProfile) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <Header />
                <div className="profile-container">
                    <div className="loading-message">Loading profile...</div>
                </div>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className="profile-page">
                <Header />
                <div className="profile-container">
                    <div className="error-message">
                        {error || 'User not found'}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <Header />
            <div className="profile-container">
                <div className="profile-main">
                    {isEditing && isOwnProfile ? (
                        <EditProfile
                            user={userData}
                            onCancel={() => setIsEditing(false)}
                            onSave={handleProfileSave}
                        />
                    ) : (
                        <Profile
                            user={userData}
                            stats={stats}
                            onEdit={isOwnProfile ? () => setIsEditing(true) : undefined}
                            isOwnProfile={isOwnProfile}
                        />
                    )}

                    {showCreateProject && isOwnProfile ? (
                        <CreateProject
                            onCancel={() => setShowCreateProject(false)}
                            onSave={() => setShowCreateProject(false)}
                        />
                    ) : (
                        <ProjectList
                            userId={userData.id}
                            onCreateProject={isOwnProfile ? () => setShowCreateProject(true) : undefined}
                            isOwnProfile={isOwnProfile}
                        />
                    )}
                </div>

                <div className="profile-sidebar">
                    <FriendsList userId={userId} />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;