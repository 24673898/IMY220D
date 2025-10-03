import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';
import './FriendsList.css';

const FriendsList = ({ userId }) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unfriendingId, setUnfriendingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFriends = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`http://localhost:3000/api/users/${userId}/friends`);

                if (!response.ok) {
                    throw new Error('Failed to fetch friends');
                }

                const data = await response.json();

                // Transform friends data
                const transformedFriends = data.friends.map(friend => ({
                    id: friend._id,
                    name: friend.firstName && friend.lastName
                        ? `${friend.firstName} ${friend.lastName}`
                        : friend.name || friend.username,
                    username: friend.username,
                    profileImage: friend.profileImage || '/assets/images/default-user.jpg',
                    isOnline: false // You can implement online status later
                }));

                setFriends(transformedFriends);
            } catch (err) {
                console.error('Error fetching friends:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, [userId]);

    const handleFriendClick = (friend) => {
        navigate(`/profile/${friend.id}`);
    };

    const handleUnfriend = async (friendId, friendName, e) => {
        e.stopPropagation(); // Prevent navigation when clicking unfriend

        if (!window.confirm(`Are you sure you want to unfriend ${friendName}?`)) {
            return;
        }

        try {
            setUnfriendingId(friendId);
            await userAPI.unfriend(userId, friendId);

            // Remove friend from local state
            setFriends(friends.filter(friend => friend.id !== friendId));
        } catch (err) {
            console.error('Error unfriending user:', err);
            alert('Failed to unfriend user. Please try again.');
        } finally {
            setUnfriendingId(null);
        }
    };

    if (loading) {
        return (
            <div className="friends-list">
                <div className="friends-header">
                    <h3 className="friends-title">Friends</h3>
                </div>
                <div className="friends-content">
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading friends...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="friends-list">
                <div className="friends-header">
                    <h3 className="friends-title">Friends</h3>
                </div>
                <div className="friends-content">
                    <p style={{ textAlign: 'center', padding: '20px', color: '#f44336' }}>Failed to load friends</p>
                </div>
            </div>
        );
    }

    return (
        <div className="friends-list">
            <div className="friends-header">
                <h3 className="friends-title">Friends</h3>
                <span className="friends-count">{friends.length}</span>
            </div>

            <div className="friends-content">
                {friends.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No friends yet</p>
                ) : (
                    friends.map(friend => (
                        <div
                            key={friend.id}
                            className="friend-item"
                            onClick={() => handleFriendClick(friend)}
                        >
                            <div className="friend-avatar">
                                {/* Placeholder avatar */}
                                <div className="avatar-placeholder">
                                    <span>{friend.name.charAt(0)}</span>
                                </div>
                                {friend.isOnline && <div className="online-indicator"></div>}
                            </div>

                            <div className="friend-info">
                                <h4 className="friend-name">{friend.name}</h4>
                                <p className="friend-username">@{friend.username}</p>
                            </div>

                            <div className="friend-actions">
                                <button
                                    className="unfriend-btn"
                                    onClick={(e) => handleUnfriend(friend.id, friend.name, e)}
                                    disabled={unfriendingId === friend.id}
                                    title="Unfriend"
                                >
                                    {unfriendingId === friend.id ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                            <line x1="18" y1="8" x2="23" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                            <line x1="23" y1="8" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button className="add-friend-btn">
                <span className="plus-icon">+</span>
                Add Friends
            </button>
        </div>
    );
};

export default FriendsList;