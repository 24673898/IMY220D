import React, { useState } from 'react';
import './Messages.css';

const Messages = ({ projectId }) => {
    const [sortBy, setSortBy] = useState('newest');

    // Dummy messages data
    const messagesData = [
        {
            id: 1,
            type: 'checkin',
            user: {
                name: 'Frank Johnson',
                username: 'frankdev',
                avatar: 'FJ'
            },
            message: 'Fixed authentication bug and updated user dashboard components. Added responsive design improvements for mobile devices.',
            version: '2.1.0',
            timestamp: '2 hours ago',
            files: ['auth.js', 'Dashboard.jsx', 'mobile.css']
        },
        {
            id: 2,
            type: 'checkout',
            user: {
                name: 'Sarah Wilson',
                username: 'sarahdev',
                avatar: 'SW'
            },
            message: 'Working on the new analytics module integration',
            version: '2.0.8',
            timestamp: '1 day ago',
            files: []
        },
        {
            id: 3,
            type: 'checkin',
            user: {
                name: 'Mike Chen',
                username: 'mikechen',
                avatar: 'MC'
            },
            message: 'Added data validation and error handling for user forms. Improved API error responses.',
            version: '2.0.8',
            timestamp: '3 days ago',
            files: ['validation.js', 'api-handler.js', 'error-utils.js']
        },
        {
            id: 4,
            type: 'checkout',
            user: {
                name: 'Lisa Brown',
                username: 'lisab',
                avatar: 'LB'
            },
            message: 'Checking out to work on database optimization',
            version: '2.0.7',
            timestamp: '5 days ago',
            files: []
        },
        {
            id: 5,
            type: 'checkin',
            user: {
                name: 'Frank Johnson',
                username: 'frankdev',
                avatar: 'FJ'
            },
            message: 'Initial project setup with React, Express, and MongoDB. Added basic authentication flow.',
            version: '1.0.0',
            timestamp: '2 weeks ago',
            files: ['server.js', 'app.js', 'auth.js', 'package.json']
        }
    ];

    const sortedMessages = [...messagesData].sort((a, b) => {
        if (sortBy === 'newest') {
            return a.id - b.id; // Higher ID = more recent (reversed for demo)
        } else {
            return b.id - a.id; // Lower ID = older
        }
    });

    const formatMessage = (message) => {
        if (message.length > 150) {
            return message.substring(0, 150) + '...';
        }
        return message;
    };

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
                {sortedMessages.map(message => (
                    <div key={message.id} className={`message-item ${message.type}`}>
                        <div className="message-avatar">
                            <div className="avatar-placeholder">
                                <span>{message.user.avatar}</span>
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
                                    <span className="message-user-name">{message.user.name}</span>
                                    <span className="message-username">@{message.user.username}</span>
                                </div>
                                <div className="message-meta">
                                    <span className={`message-type ${message.type}`}>
                                        {message.type === 'checkin' ? 'Checked In' : 'Checked Out'}
                                    </span>
                                    <span className="message-timestamp">{message.timestamp}</span>
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

                                {message.files.length > 0 && (
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
                                                    {file}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
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