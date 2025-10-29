import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import Header from '../components/Header';
import Profile from '../components/Profile';
import EditProfile from '../components/EditProfile';
import ProjectList from '../components/ProjectList';
import CreateProject from '../components/CreateProject';
import FriendsList from '../components/FriendsList';
import { userAPI } from '../services/api';
import { isAdmin, getCurrentUser, canEdit, canDelete } from '../utils/adminHelpers';
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

    // Get current logged-in user
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?._id;
    const userIsAdmin = isAdmin(currentUser);

    // Determine if viewing own profile (no ID = own profile)
    const isOwnProfile = !id;

    // Get current user ID from localStorage - memoized to prevent unnecessary recalculations
    const getCurrentUserId_old = useCallback(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            return parsedUser._id;
        }
        return null;
    }, []);

    // Memoize userId to prevent unnecessary re-renders
    const userId = useMemo(() => {
        return isOwnProfile ? currentUserId : id;
    }, [isOwnProfile, id, currentUserId]);

    // Check if current user can edit/delete this profile
    const canEditProfile = useMemo(() => {
        if (!currentUser || !userId) return false;
        return userIsAdmin || currentUserId === userId;
    }, [currentUser, userId, currentUserId, userIsAdmin]);

    const canDeleteProfile = useMemo(() => {
        if (!currentUser || !userId) return false;
        // Admins cannot delete their own account
        if (userIsAdmin && currentUserId === userId) return false;
        return userIsAdmin || currentUserId === userId;
    }, [currentUser, userId, currentUserId, userIsAdmin]);

   const handleDeleteProfile = async () => {
    if (!userId || !currentUserId) {
        alert('Cannot delete profile: User ID not found');
        return;
    }

    // Check permissions
    if (!canDeleteProfile) {
        alert('You do not have permission to delete this profile');
        return;
    }

    // Different confirmation messages for admin vs self-delete
    const confirmMessage = userIsAdmin && userId !== currentUserId
        ? `WARNING: You are about to delete ${userData?.username}'s profile as an ADMIN. This will permanently delete their profile, all their projects, and all associated data. This action cannot be undone. Are you absolutely sure?`
        : 'WARNING: This will permanently delete your profile, all your projects, and all associated data. This action cannot be undone. Are you absolutely sure?';

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) {
        return;
    }

    try {
        console.log('Attempting to delete user with ID:', userId);

        await userAPI.deleteProfile(currentUserId, userId);

        // If deleting own profile, clear localStorage
        if (userId === currentUserId) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }

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
                    profileImage: data.user.profileImage || '/assets/images/default-user.jpg',
                    role: data.user.role // Include role for admin badge
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
                    const currentLoggedUser = getCurrentUser();
                    const loggedUserId = currentLoggedUser?._id;
                    if (loggedUserId) {
                        const myFriendsData = await userAPI.getFriends(loggedUserId);

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
    }, [userId, isOwnProfile]);

    // Handle profile save
    const handleProfileSave = async (formData) => {
        if (!canEditProfile) {
            alert('You do not have permission to edit this profile');
            return;
        }

        try {
            const data = await userAPI.updateProfile(currentUserId, userId, formData);

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
                profileImage: data.user.profileImage || '/assets/images/default-user.jpg',
                role: data.user.role // Preserve role
            };

            setUserData(transformedUser);

            // Update localStorage if it's own profile
            if (isOwnProfile) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            setIsEditing(false);
            alert(userIsAdmin && !isOwnProfile ? 'User profile updated successfully (as admin)' : 'Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert(`Failed to update profile: ${err.message}`);
        }
    };

    // Handle send friend request
    const handleSendFriendRequest = async () => {
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
                    {isEditing && canEditProfile ? (
                        <EditProfile
                            user={userData}
                            onCancel={() => setIsEditing(false)}
                            onSave={handleProfileSave}
                        />
                    ) : (
                        <Profile
                            user={userData}
                            stats={stats}
                            onEdit={canEditProfile ? () => setIsEditing(true) : undefined}
                            onDelete={canDeleteProfile ? handleDeleteProfile : undefined}
                            isOwnProfile={isOwnProfile}
                            isFriend={isFriend}
                            onSendFriendRequest={handleSendFriendRequest}
                            onUnfriend={handleUnfriend}
                            friendActionLoading={friendActionLoading}
                            isAdmin={userIsAdmin}
                            currentUserRole={currentUser?.role}
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