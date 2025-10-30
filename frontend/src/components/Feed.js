import React, { useState, useEffect } from 'react';
import ProjectPreview from './ProjectPreview';
import './Feed.css';

const Feed = () => {
    const [activeTab, setActiveTab] = useState('global');
    const [sortBy, setSortBy] = useState('date');
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Get current user on mount
    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            setCurrentUserId(parsedUser._id);
        }
    }, []);

    // Fetch activity when tab or userId changes
    useEffect(() => {
        fetchActivity();
    }, [activeTab, currentUserId]);

    const fetchActivity = async () => {
        if (!currentUserId && activeTab === 'local') {
            return; // Can't fetch local without user ID
        }

        try {
            setLoading(true);
            setError(null);

            const endpoint = activeTab === 'local'
                ? `/api/checkins/local/${currentUserId}`
                : '/api/checkins/global';

            const response = await fetch(endpoint);

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

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const now = new Date();
        const activityDate = new Date(timestamp);
        const diffMs = now - activityDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return activityDate.toLocaleDateString();
    };

    // Helper to fix image path
    const getImagePath = (imagePath) => {
        if (!imagePath) return null;
        // Skip default placeholder images
        if (imagePath.includes('default-project.jpg')) return null;
        // If path doesn't start with /, add it
        if (imagePath.startsWith('uploads/')) {
            return `/${imagePath}`;
        }
        return imagePath;
    };

    // Transform activity data to match ProjectPreview format
    const transformedProjects = activity.map(item => {
        // Use projectImage field first (where uploads are stored), fallback to image
        const projectImage = item.project?.projectImage || item.project?.image;

        return {
            id: item._id,
            userName: item.user ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.user.username : 'Unknown',
            projectName: item.project?.name || 'Unknown Project',
            content: item.message || '',
            image: getImagePath(projectImage),
            tags: item.project?.tags?.map(tag => tag.startsWith('#') ? tag : `#${tag}`) || [],
            status: item.type === 'checkin' ? 'Checked In' : 'Checked Out',
            timestamp: formatTimeAgo(item.timestamp),
            projectId: item.projectId
        };
    });

    // Sort projects
    const sortedProjects = [...transformedProjects].sort((a, b) => {
        switch (sortBy) {
            case 'date':
                return 0; // Already sorted by date from backend
            case 'name':
                return a.projectName.localeCompare(b.projectName);
            case 'popularity':
                // Could be based on stars/downloads if available
                return 0;
            default:
                return 0;
        }
    });

    return (
        <div className="feed">
            <div className="feed-header">
                <h2 className="feed-title">Activity Feed</h2>
                
                {/* Local/Global Toggle */}
                <div className="feed-controls">
                    <div className="feed-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
                            onClick={() => setActiveTab('local')}
                        >
                            Local
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
                            onClick={() => setActiveTab('global')}
                        >
                            Global
                        </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="sort-dropdown">
                        <label htmlFor="sort">Sort</label>
                        <select 
                            id="sort" 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="date">Recent</option>
                            <option value="popularity">Popular</option>
                            <option value="name">Name</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Project List */}
            <div className="feed-content">
                {loading && (
                    <div className="feed-loading" style={{ padding: '2rem', textAlign: 'center' }}>
                        Loading activity...
                    </div>
                )}

                {error && (
                    <div className="feed-error" style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                        Error: {error}
                    </div>
                )}

                {!loading && !error && sortedProjects.length === 0 && (
                    <div className="feed-empty" style={{ padding: '3rem', textAlign: 'center' }}>
                        <h3>No Activity Yet</h3>
                        <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                            {activeTab === 'local'
                                ? 'Check in some projects or connect with friends to see activity here.'
                                : 'No activity found. Be the first to check in a project!'}
                        </p>
                    </div>
                )}

                {!loading && !error && sortedProjects.map(project => (
                    <ProjectPreview
                        key={project.id}
                        project={project}
                    />
                ))}
            </div>
        </div>
    );
};

export default Feed;