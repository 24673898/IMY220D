import React from 'react';
import './Project.css';

const Project = ({ project, onEdit, currentUserId = 1 }) => {
    const isOwner = project.owner.id === currentUserId;
    const canEdit = isOwner; // Could also check if user is collaborator

    const handleCheckIn = () => {
        if (project.status === 'Checked Out') {
            console.log('Check in project:', project.name);
            // TODO: Implement check in functionality
        }
    };

    const handleDownload = () => {
        console.log('Download project:', project.name);
        // TODO: Implement download functionality
    };

    const handleStar = () => {
        console.log('Star project:', project.name);
        // TODO: Implement star functionality
    };

    const handleTagClick = (tag) => {
        console.log('Search for tag:', tag);
        // TODO: Implement hashtag search
    };

    return (
        <div className="project-card">
            <div className="project-header">
                <div className="project-image-section">
                    <div className="project-image">
                        <div className="image-placeholder">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                                      stroke="currentColor" strokeWidth="1.5"/>
                                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5"/>
                                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5"/>
                                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                        </div>
                    </div>
                    
                    <div className="project-actions">
                        <button className="action-btn download-btn" onClick={handleDownload}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" 
                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Download
                        </button>
                        
                        <button className="action-btn star-btn" onClick={handleStar}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" 
                                         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Star
                        </button>
                    </div>
                </div>
                
                <div className="project-info">
                    <div className="project-title-section">
                        <h1 className="project-title">{project.name}</h1>
                        {canEdit && (
                            <button className="edit-project-btn" onClick={onEdit}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" 
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z" 
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Edit Project
                            </button>
                        )}
                    </div>
                    
                    <div className="project-meta-row">
                        <span className="project-owner">
                            by <strong>{project.owner.firstName} {project.owner.lastName}</strong> 
                            (@{project.owner.username})
                        </span>
                        <span className={`project-status ${project.status === 'Checked In' ? 'checked-in' : 'checked-out'}`}>
                            {project.status}
                        </span>
                    </div>
                    
                    <p className="project-description">{project.description}</p>
                    
                    <div className="project-details">
                        <div className="detail-item">
                            <span className="detail-label">Type:</span>
                            <span className="detail-value">{project.type}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Version:</span>
                            <span className="detail-value">{project.version}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Created:</span>
                            <span className="detail-value">{project.createdDate}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Last Modified:</span>
                            <span className="detail-value">{project.lastModified}</span>
                        </div>
                    </div>
                    
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
                </div>
            </div>
            
            <div className="project-stats">
                <div className="stat-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" 
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="stat-number">{project.downloads}</span>
                    <span className="stat-label">Downloads</span>
                </div>
                
                <div className="stat-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2" 
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="stat-number">{project.stars}</span>
                    <span className="stat-label">Stars</span>
                </div>
                
                <div className="stat-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span className="stat-number">{project.collaborators.length + 1}</span>
                    <span className="stat-label">Collaborators</span>
                </div>
            </div>
        </div>
    );
};

export default Project;