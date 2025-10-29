import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAPI } from '../services/api';
import { isAdmin, getCurrentUser } from '../utils/adminHelpers';
import './SearchInput.css';

const SearchInput = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const currentUser = getCurrentUser();
    const userIsAdmin = isAdmin(currentUser);

    // Fetch all users when @ is typed (admin only)
    useEffect(() => {
        const fetchUsers = async () => {
            if (searchTerm.startsWith('@') && userIsAdmin) {
                setLoading(true);
                try {
                    const result = await searchAPI.getAllUsers(currentUser._id);
                    setUserSuggestions(result.users || []);
                    setShowDropdown(true);
                } catch (error) {
                    console.error('Error fetching users:', error);
                    setUserSuggestions([]);
                }
                setLoading(false);
            } else {
                setShowDropdown(false);
                setUserSuggestions([]);
            }
        };

        fetchUsers();
    }, [searchTerm, userIsAdmin, currentUser]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            // Navigate to search results page with the search term
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchTerm(''); // Clear the input after search
            setShowDropdown(false);
        }
    };

    const handleUserSelect = (user) => {
        setSearchTerm(`@${user.username}`);
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    return (
        <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder={userIsAdmin ? "Search users, projects... (type @ to see all users)" : "Search users, projects, messages..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="search-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M21 21L16.514 16.506M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>

                {/* Autocomplete dropdown for admin users */}
                {showDropdown && userIsAdmin && (
                    <div ref={dropdownRef} className="search-autocomplete-dropdown">
                        {loading ? (
                            <div className="autocomplete-loading">Loading users...</div>
                        ) : userSuggestions.length > 0 ? (
                            <>
                                <div className="autocomplete-header">
                                    Select a user ({userSuggestions.length} total)
                                </div>
                                <div className="autocomplete-list">
                                    {userSuggestions.map(user => (
                                        <div
                                            key={user._id}
                                            className="autocomplete-item"
                                            onClick={() => handleUserSelect(user)}
                                        >
                                            <div className="autocomplete-user-avatar">
                                                {user.profileImage ? (
                                                    <img src={user.profileImage} alt={user.username} />
                                                ) : (
                                                    <span>{user.username?.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="autocomplete-user-info">
                                                <div className="autocomplete-user-name">
                                                    {user.name || user.username}
                                                    {user.role === 'admin' && (
                                                        <span className="autocomplete-admin-badge">ADMIN</span>
                                                    )}
                                                </div>
                                                <div className="autocomplete-username">@{user.username}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="autocomplete-empty">No users found</div>
                        )}
                    </div>
                )}
            </div>
        </form>
    );
};

export default SearchInput;