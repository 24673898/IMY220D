import React from 'react';
import './ProjectPreview.css';

const ProjectPreview = ({ project }) => {
    const handleTagClick = (tag) => {
       
        console.log('Search for tag:', tag);
    };

    return (
        <div className="project-preview">
            <div className="project-header">
                <h3 className="project-user">{project.userName}'s post</h3>
                <span className="project-timestamp">{project.timestamp}</span>
            </div>
            
            <div className="project-content">
                <div className="project-image-container">
                    <div className="project-image">
                        {/* Placeholder for project image */}
                        <div className="image-placeholder">
                            <span>Image</span>
                        </div>
                    </div>
                </div>
                
                <div className="project-details">
                    <h4 className="project-name">{project.projectName}</h4>
                    <p className="project-description">{project.content}</p>
                    
                    <div className="project-footer">
                        <div className="project-tags">
                            {project.tags.map((tag, index) => (
                                <button
                                    key={index}
                                    className="project-tag"
                                    onClick={() => handleTagClick(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        
                        <div className="project-status">
                            <span className={`status-badge ${project.status === 'Checked In' ? 'checked-in' : 'checked-out'}`}>
                                {project.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectPreview;