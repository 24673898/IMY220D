import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import Header from '../components/Header';
import Profile from '../components/Profile';
import EditProfile from '../components/EditProfile';
import ProjectList from '../components/ProjectList';
import CreateProject from '../components/CreateProject';
import FriendsList from '../components/FriendsList';
import { userAPI } from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Added navigate for redirect after delete
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
    const [isFriend, setIsFriend] = useState(false);
    const [friendActionLoading, setFriendActionLoading] = useState(false);

    // Determine if viewing own profile (no ID = own profile)
    const isOwnProfile = !id;

    // Get current user ID from localStorage - memoized to prevent unnecessary recalculations
    const getCurrentUserId = useCallback(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            return parsedUser._id;
        }
        return null;
    }, []);

    // Memoize userId to prevent unnecessary re-renders
    const userId = useMemo(() => {
        return isOwnProfile ? getCurrentUserId() : id;
    }, [isOwnProfile, id, getCurrentUserId]);

   const handleDeleteProfile = async () => {
    if (!userId) {
        alert('Cannot delete profile: User ID not found');
        return;
    }

    // Final confirmation
    const confirmed = window.confirm(
        'WARNING: This will permanently delete your profile, all your projects, and all associated data. This action cannot be undone. Are you absolutely sure?'
    );

    if (!confirmed) {
        return;
    }

    try {
        // Get the current user data to ensure we have the correct ID format
        const currentUser = JSON.parse(localStorage.getItem('user'));
        const userToDeleteId = currentUser?._id || userId;

        console.log('Attempting to delete user with ID:', userToDeleteId);

        await userAPI.deleteProfile(userToDeleteId);

        // Clear localStorage and redirect to home page
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // if you have tokens
        
        alert('Profile deleted successfully');
        navigate('/'); // Redirect to home page

    } catch (err) {
        console.error('Error deleting profile:', err);
        alert(`Failed to delete profile: ${err.message}`);
    }
};

    // Fetch user data from backend
    useEffect(() => {
        let isMounted = true; // Track if component is still mounted

        const fetchUserData = async () => {
            if (!userId) {
                if (isMounted) {
                    setLoading(false);
                    setError('Please log in to view profile');
                    console.error('No user ID found. User might not be logged in.');
                }
                return;
            }

            try {
                if (isMounted) {
                    setLoading(true);
                }
                console.log('Fetching user data for userId:', userId);
                const data = await userAPI.getProfile(userId);

                if (!isMounted) return; // Don't update state if unmounted

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
                const friendsData = await userAPI.getFriends(userId);

                if (!isMounted) return; // Don't update state if unmounted

                setStats({
                    projectsCount: data.projects?.length || 0,
                    collaborationsCount: data.projects?.filter(p => p.ownerId !== userId).length || 0,
                    friendsCount: friendsData.friends?.length || 0
                });

                // Check if this user is a friend (only if viewing another user's profile)
                if (!isOwnProfile) {
                    const currentUserId = getCurrentUserId();
                    if (currentUserId) {
                        const myFriendsData = await userAPI.getFriends(currentUserId);

                        if (!isMounted) return; // Don't update state if unmounted

                        const isFriendStatus = myFriendsData.friends?.some(friend => friend._id === userId);
                        setIsFriend(isFriendStatus);
                    }
                }

            } catch (err) {
                console.error('Error fetching user data:', err);
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUserData();

        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, [userId, isOwnProfile, getCurrentUserId]);

    // Handle profile save
    const handleProfileSave = async (formData) => {
        try {
            const data = await userAPI.updateProfile(userId, formData);

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

    // Handle send friend request
    const handleSendFriendRequest = async () => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || !userId) return;

        try {
            setFriendActionLoading(true);
            await userAPI.sendFriendRequest(currentUserId, userId);

            setIsFriend(true);
            setStats(prev => ({ ...prev, friendsCount: prev.friendsCount + 1 }));
            alert('Friend request sent successfully!');
        } catch (err) {
            console.error('Error sending friend request:', err);
            alert(err.message || 'Failed to send friend request. Please try again.');
        } finally {
            setFriendActionLoading(false);
        }
    };

    // Handle unfriend
    const handleUnfriend = async () => {
        const currentUserId = getCurrentUserId();
        if (!currentUserId || !userId) return;

        if (!window.confirm(`Are you sure you want to unfriend ${userData.username}?`)) {
            return;
        }

        try {
            setFriendActionLoading(true);
            await userAPI.unfriend(currentUserId, userId);

            setIsFriend(false);
            setStats(prev => ({ ...prev, friendsCount: Math.max(0, prev.friendsCount - 1) }));
            alert('Friend removed successfully');
        } catch (err) {
            console.error('Error unfriending user:', err);
            alert('Failed to unfriend user. Please try again.');
        } finally {
            setFriendActionLoading(false);
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
                            onDelete={isOwnProfile ? handleDeleteProfile : undefined}
                            isOwnProfile={isOwnProfile}
                            isFriend={isFriend}
                            onSendFriendRequest={handleSendFriendRequest}
                            onUnfriend={handleUnfriend}
                            friendActionLoading={friendActionLoading}
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