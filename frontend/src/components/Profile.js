import React from 'react';
import AdminBadge from './AdminBadge';
import './Profile.css';

const Profile = ({ user, stats = { projectsCount: 0, collaborationsCount: 0, friendsCount: 0 }, onEdit, onDelete, isOwnProfile, isFriend, onSendFriendRequest, onUnfriend, friendActionLoading, isAdmin, currentUserRole }) => {
    const [imageError, setImageError] = React.useState(false);

    const getInitials = () => {
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
        } else if (user.username) {
            return user.username.charAt(0).toUpperCase();
        }
        return 'U';
    };

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className="profile-card">
            <div className="profile-header">
                <div className="profile-avatar">
                    {user.profileImage && user.profileImage !== '/assets/images/default-user.jpg' && !imageError ? (
                        <img
                            src={user.profileImage}
                            alt={user.username}
                            className="avatar-image"
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="avatar-placeholder">
                            <span>{getInitials()}</span>
                        </div>
                    )}
                </div>

                <div className="profile-info">
                    <h1 className="profile-name">
                        {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.username}
                        <AdminBadge isAdmin={user.role === 'admin'} />
                    </h1>
                    <p className="profile-username">@{user.username}</p>
                    {/* Only show bio if it's own profile, friends, or admin */}
                    {(isOwnProfile || isFriend || isAdmin) && (
                        <p className="profile-bio">{user.bio || 'No bio available'}</p>
                    )}
                    {/* Show privacy message for non-friends */}
                    {!isOwnProfile && !isFriend && !isAdmin && (
                        <p className="profile-bio privacy-message" style={{color: '#6c757d', fontStyle: 'italic'}}>
                            Add as friend to view full profile
                        </p>
                    )}
                </div>

                <div className="profile-actions">
                    {(onEdit || onDelete) ? (
                        <>
                            {!isOwnProfile && isAdmin && (
                                <div className="admin-notice" style={{fontSize: '12px', color: '#dc3545', marginBottom: '8px'}}>
                                    Admin Controls
                                </div>
                            )}
                            {onEdit && (
                                <button className="edit-profile-btn" onClick={onEdit}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {isOwnProfile ? 'Edit Profile' : 'Edit User (Admin)'}
                                </button>
                            )}
                            {onDelete && (
                                <button className="delete-profile-btn" onClick={onDelete}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                              stroke="currentColor" strokeWidth="2"/>
                                        <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    {isOwnProfile ? 'Delete Profile' : 'Delete User (Admin)'}
                                </button>
                            )}
                        </>
                    ) : !isOwnProfile && (
                        <>
                            {isFriend ? (
                                <button
                                    className="unfriend-profile-btn"
                                    onClick={onUnfriend}
                                    disabled={friendActionLoading}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                                        <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="18" y1="8" x2="23" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <line x1="23" y1="8" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    {friendActionLoading ? 'Removing...' : 'Unfriend'}
                                </button>
                            ) : (
                                <button
                                    className="add-friend-profile-btn"
                                    onClick={onSendFriendRequest}
                                    disabled={friendActionLoading}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                                        <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <line x1="17" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    {friendActionLoading ? 'Sending...' : 'Add Friend'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Only show details if it's own profile, friends, or admin */}
            {(isOwnProfile || isFriend || isAdmin) && (
                <div className="profile-details">
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-number">{stats.projectsCount}</span>
                            <span className="stat-label">Projects</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.collaborationsCount}</span>
                            <span className="stat-label">Collaborations</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{stats.friendsCount}</span>
                            <span className="stat-label">Friends</span>
                        </div>
                    </div>

                    <div className="profile-meta">
                        {user.location && (
                            <div className="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke="currentColor" strokeWidth="2"/>
                                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <span>{user.location}</span>
                            </div>
                        )}

                        {user.website && (
                            <div className="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="m14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <a href={user.website} target="_blank" rel="noopener noreferrer" className="profile-link">{user.website}</a>
                            </div>
                        )}

                        {user.joinDate && (
                            <div className="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <span>Joined {user.joinDate}</span>
                            </div>
                        )}

                        {user.email && (
                            <div className="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                                          stroke="currentColor" strokeWidth="2"/>
                                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <span>{user.email}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;