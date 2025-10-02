import React, { useState } from 'react';
import ProjectPreview from './ProjectPreview';
import './Feed.css';

const Feed = () => {
    const [activeTab, setActiveTab] = useState('local');
    const [sortBy, setSortBy] = useState('date');

    // Dummy data for demonstration
    const projects = [
        {
            id: 1,
            userName: "Franky",
            projectName: "React Dashboard",
            content: "Created a modern dashboard with React hooks and context API",
            image: "/assets/images/project1.jpg",
            tags: ["#react", "#javascript"],
            status: "Checked In",
            timestamp: "2 hours ago"
        },
        {
            id: 2,
            userName: "Alex",
            projectName: "Node.js API",
            content: "Built RESTful API with authentication and MongoDB integration",
            image: "/assets/images/project2.jpg",
            tags: ["#nodejs", "#mongodb"],
            status: "Checked Out",
            timestamp: "5 hours ago"
        },
        {
            id: 3,
            userName: "Sarah",
            projectName: "Vue.js Website",
            content: "Responsive website with Vue.js and Vuetify components",
            image: "/assets/images/project3.jpg",
            tags: ["#vuejs", "#css"],
            status: "Checked In",
            timestamp: "1 day ago"
        }
    ];

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
                {projects.map(project => (
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