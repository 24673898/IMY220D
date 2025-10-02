import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom'; // Added Link import
import Header from '../components/Header';
import { searchAPI } from '../services/api';
import './SearchPage.css';

const SearchPage = () => {
    const [results, setResults] = useState({ users: [], projects: [], checkins: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const location = useLocation();

    // Get search query from URL
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q');

    useEffect(() => {
        if (query) {
            performSearch(query);
        }
    }, [query]);

    const performSearch = async (searchQuery) => {
        setLoading(true);
        setError(null);

        try {
            // Search all categories simultaneously
            const [usersResults, projectsResults, checkinsResults] = await Promise.all([
                searchAPI.searchUsers(searchQuery),
                searchAPI.searchProjects(searchQuery),
                searchAPI.searchCheckins(searchQuery)
            ]);

            setResults({
                users: usersResults.users || [],
                projects: projectsResults.projects || [],
                checkins: checkinsResults.checkins || []
            });

        } catch (err) {
            setError(err.message);
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="search-page">
            <Header />
            <div className="search-page-content">
                <div className="search-results-container">
                    <h1 className="search-title">
                        {query ? `Search Results for "${query}"` : 'Search'}
                    </h1>

                    {loading && (
                        <div className="loading-message">Searching...</div>
                    )}

                    {error && (
                        <div className="error-message">
                            Error: {error}
                        </div>
                    )}

                    {/* Users Results */}
                    {results.users.length > 0 && (
                        <div className="results-section">
                            <h2>Users ({results.users.length})</h2>
                            <div className="users-grid">
                                {results.users.map(user => (
                                    <div key={user._id} className="user-card">
                                        <div className="user-avatar">
                                            {user.profileImage ? (
                                                <img src={user.profileImage} alt={user.username} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {user.username?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <h3>{user.name || user.username}</h3>
                                            <p className="username">@{user.username}</p>
                                            {user.bio && <p className="user-bio">{user.bio}</p>}
                                        </div>
                                        {/* FIXED: Use Link instead of <a> */}
                                        <Link to={`/profile/${user._id}`} className="view-profile-btn">
                                            View Profile
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects Results */}
                    {results.projects.length > 0 && (
                        <div className="results-section">
                            <h2>Projects ({results.projects.length})</h2>
                            <div className="projects-grid">
                                {results.projects.map(project => (
                                    <div key={project._id} className="project-card">
                                        <div className="project-image">
                                            {project.image ? (
                                                <img src={project.image} alt={project.name} />
                                            ) : (
                                                <div className="project-image-placeholder">
                                                    {project.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="project-info">
                                            <h3>{project.name}</h3>
                                            <p className="project-description">{project.description}</p>
                                            <div className="project-meta">
                                                <span className="project-type">{project.type}</span>
                                                {project.tags && project.tags.map((tag, index) => (
                                                    <span key={index} className="tag">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {/* FIXED: Use Link instead of <a> */}
                                        <Link to={`/project/${project._id}`} className="view-project-btn">
                                            View Project
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Check-ins Results */}
                    {results.checkins.length > 0 && (
                        <div className="results-section">
                            <h2>Check-in Messages ({results.checkins.length})</h2>
                            <div className="checkins-list">
                                {results.checkins.map(checkin => (
                                    <div key={checkin._id} className="checkin-card">
                                        <div className="checkin-header">
                                            <div className="checkin-user">
                                                {checkin.user && (
                                                    <>
                                                        <div className="user-avatar-small">
                                                            {checkin.user.profileImage ? (
                                                                <img src={checkin.user.profileImage} alt={checkin.user.username} />
                                                            ) : (
                                                                <span>{checkin.user.username?.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <span>{checkin.user.name || checkin.user.username}</span>
                                                    </>
                                                )}
                                            </div>
                                            <span className="checkin-date">
                                                {new Date(checkin.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="checkin-message">{checkin.message}</p>
                                        {checkin.project && (
                                            <div className="checkin-project">
                                                In project: {/* FIXED: Use Link instead of <a> */}
                                                <Link to={`/project/${checkin.project._id}`}>
                                                    {checkin.project.name}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && query && 
                     results.users.length === 0 && 
                     results.projects.length === 0 && 
                     results.checkins.length === 0 && (
                        <div className="no-results">
                            No results found for "{query}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchPage;