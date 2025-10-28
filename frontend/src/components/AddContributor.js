import React, { useState, useEffect } from 'react';
import './AddContributor.css';

const AddContributor = ({ projectId, currentMembers, onMemberAdded, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (searchTerm.trim().length > 0) {
            const timeoutId = setTimeout(() => {
                searchUsers();
            }, 300); // Debounce search

            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    const searchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/search/users?q=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();

            if (response.ok) {
                // Filter out users who are already members
                const memberIds = currentMembers.map(m => m._id);
                const filteredResults = data.users.filter(user => !memberIds.includes(user._id));
                setSearchResults(filteredResults);
            } else {
                setError(data.error || 'Failed to search users');
            }
        } catch (err) {
            setError('Failed to search users');
            console.error('Search users error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async (user) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/projects/${projectId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user._id })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`${user.firstName} ${user.lastName} added as contributor!`);
                setSearchTerm('');
                setSearchResults([]);
                setSelectedUser(null);
                onMemberAdded();
                onClose();
            } else {
                setError(data.error || 'Failed to add member');
            }
        } catch (err) {
            setError('Failed to add member');
            console.error('Add member error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-contributor-modal">
            <div className="add-contributor-content">
                <div className="add-contributor-header">
                    <h3>Add Contributor</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <div className="add-contributor-body">
                    <div className="search-section">
                        <label>Search for users:</label>
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search by name, username, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {loading && <div className="loading-message">Searching...</div>}

                    {searchResults.length > 0 && (
                        <div className="search-results">
                            <p className="results-count">{searchResults.length} user(s) found</p>
                            <div className="results-list">
                                {searchResults.map(user => (
                                    <div key={user._id} className="user-result">
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt={user.firstName} />
                                                ) : (
                                                    <span>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="user-details">
                                                <span className="user-name">{user.firstName} {user.lastName}</span>
                                                <span className="user-username">@{user.username}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="add-btn"
                                            onClick={() => handleAddMember(user)}
                                            disabled={loading}
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchTerm.trim().length > 0 && !loading && searchResults.length === 0 && (
                        <div className="no-results">
                            No users found matching "{searchTerm}"
                        </div>
                    )}

                    {searchTerm.trim().length === 0 && (
                        <div className="instructions">
                            Start typing to search for users to add as contributors
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddContributor;
