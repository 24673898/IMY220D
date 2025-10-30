import React from 'react';
import AdminBadge from './AdminBadge';
import './Project.css';

const Project = ({ project, onEdit, onDelete, isAdmin, isOwner, isMember, currentUserId = 1 }) => {
    // Use passed props for permission checks
    const canEdit = onEdit !== undefined;
    const canDelete = onDelete !== undefined;

    const handleCheckIn = () => {
        if (project.status === 'Checked Out') {
            console.log('Check in project:', project.name);
            // TODO: Implement check in functionality
        }
    };

    const handleTagClick = (tag) => {
        console.log('Search for tag:', tag);
        // TODO: Implement hashtag search
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = `
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                      stroke="currentColor" stroke-width="1.5"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="1.5"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="1.5"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="1.5"/>
            </svg>
        `;
        e.target.parentElement.appendChild(placeholder);
    };

    return (
        <div className="project-card">
            <div className="project-header">
                <div className="project-image-section">
                    <div className="project-image">
                        {project.image ? (
                            <img
                                src={project.image}
                                alt={project.name}
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="image-placeholder">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                          stroke="currentColor" strokeWidth="1.5"/>
                                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.5"/>
                                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.5"/>
                                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.5"/>
                                </svg>
                            </div>
                        )}
                    </div>
                    
                </div>
                
                <div className="project-info">
                    <div className="project-title-section">
                        <h1 className="project-title">{project.name}</h1>
                        <div className="project-actions-group">
                            {canEdit && (
                                <button className="edit-project-btn" onClick={onEdit}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                                              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {isAdmin && !isOwner ? 'Edit Project (Admin)' : 'Edit Project'}
                                </button>
                            )}
                            {canDelete && (
                                <button className="delete-project-btn" onClick={onDelete} style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px'
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                                              stroke="currentColor" strokeWidth="2"/>
                                        <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    {isAdmin && !isOwner ? 'Delete Project (Admin)' : 'Delete Project'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="project-meta-row">
                        <span className="project-owner">
                            by <strong>{project.owner.firstName} {project.owner.lastName}</strong>
                            <AdminBadge isAdmin={project.owner.role === 'admin'} style={{marginLeft: '4px'}} />
                            <span style={{color: '#666'}}> (@{project.owner.username})</span>
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