import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FriendsList.css';

const FriendsList = ({ userId }) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

                            <div className="friend-status">
                                <span className={`status-dot ${friend.isOnline ? 'online' : 'offline'}`}></span>
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