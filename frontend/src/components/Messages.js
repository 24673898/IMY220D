import React, { useState, useEffect } from 'react';
import './Messages.css';

const Messages = ({ projectId }) => {
    const [sortBy, setSortBy] = useState('newest');
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!projectId) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/projects/${projectId}/activity`);

                if (!response.ok) {
                    throw new Error('Failed to fetch activity');
                }

                const data = await response.json();
                setActivity(data.activity || []);
            } catch (err) {
                console.error('Error fetching activity:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [projectId]);

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const activityDate = new Date(timestamp);
        const diffMs = now - activityDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const diffWeeks = Math.floor(diffMs / 604800000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
        return activityDate.toLocaleDateString();
    };

    const sortedMessages = [...activity].sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);

        if (sortBy === 'newest') {
            return dateB - dateA; // Newest first
        } else {
            return dateA - dateB; // Oldest first
        }
    });

    const formatMessage = (message) => {
        if (message.length > 150) {
            return message.substring(0, 150) + '...';
        }
        return message;
    };

    if (loading) {
        return (
            <div className="messages-container">
                <div className="messages-header">
                    <h3 className="messages-title">Project Activity</h3>
                </div>
                <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading activity...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="messages-container">
                <div className="messages-header">
                    <h3 className="messages-title">Project Activity</h3>
                </div>
                <div className="error" style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                    Failed to load activity: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="messages-container">
            <div className="messages-header">
                <h3 className="messages-title">Project Activity</h3>
                <div className="messages-controls">
                    <label htmlFor="sort-messages">Sort by:</label>
                    <select
                        id="sort-messages"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            <div className="messages-list">
                {sortedMessages.map(message => {
                    const userInitials = message.user
                        ? `${message.user.firstName?.charAt(0) || ''}${message.user.lastName?.charAt(0) || ''}`.toUpperCase() || '?'
                        : '?';
                    const userName = message.user
                        ? `${message.user.firstName || ''} ${message.user.lastName || ''}`.trim() || message.user.username || 'Unknown'
                        : 'Unknown';
                    const username = message.user?.username || 'unknown';

                    return (
                        <div key={message._id} className={`message-item ${message.type}`}>
                            <div className="message-avatar">
                                <div className="avatar-placeholder">
                                    <span>{userInitials}</span>
                                </div>
                                <div className={`activity-indicator ${message.type}`}>
                                    {message.type === 'checkin' ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                            </div>

                            <div className="message-content">
                                <div className="message-header">
                                    <div className="message-user-info">
                                        <span className="message-user-name">{userName}</span>
                                        <span className="message-username">@{username}</span>
                                    </div>
                                    <div className="message-meta">
                                        <span className={`message-type ${message.type}`}>
                                            {message.type === 'checkin' ? 'Checked In' : 'Checked Out'}
                                        </span>
                                        <span className="message-timestamp">{formatTimeAgo(message.timestamp)}</span>
                                    </div>
                                </div>

                                <div className="message-body">
                                    <p className="message-text">{formatMessage(message.message)}</p>

                                    {message.version && (
                                        <div className="message-version">
                                            <span className="version-label">Version:</span>
                                            <span className="version-number">{message.version}</span>
                                        </div>
                                    )}

                                    {message.files && message.files.length > 0 && (
                                        <div className="message-files">
                                            <span className="files-label">Files modified:</span>
                                            <div className="files-list">
                                                {message.files.map((file, index) => (
                                                    <span key={index} className="file-tag">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                                                  stroke="currentColor" strokeWidth="2"/>
                                                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                                                        </svg>
                                                        {file.name || file}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedMessages.length === 0 && (
                <div className="empty-messages">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                  stroke="currentColor" strokeWidth="2"/>
                        </svg>
                    </div>
                    <h4>No Activity Yet</h4>
                    <p>Project activity will appear here when members check in or check out files.</p>
                </div>
            )}
        </div>
    );
};

export default Messages;