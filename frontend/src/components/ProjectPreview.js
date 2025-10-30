import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectPreview.css';

const ProjectPreview = ({ project }) => {
    const navigate = useNavigate();

    const handleTagClick = (e, tag) => {
        e.stopPropagation(); // Prevent project navigation
        // Navigate to search with tag
        navigate(`/search?q=${encodeURIComponent(tag)}`);
    };

    const handleProjectClick = () => {
        if (project.projectId) {
            navigate(`/project/${project.projectId}`);
        }
    };

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = `<span>${project.projectName?.charAt(0).toUpperCase() || '?'}</span>`;
        e.target.parentElement.appendChild(placeholder);
    };

    return (
        <div className="project-preview" onClick={handleProjectClick} style={{ cursor: 'pointer' }}>
            <div className="project-header">
                <h3 className="project-user">{project.userName}'s post</h3>
                <span className="project-timestamp">{project.timestamp}</span>
            </div>

            <div className="project-content">
                <div className="project-image-container">
                    <div className="project-image">
                        {project.image ? (
                            <img
                                src={project.image}
                                alt={project.projectName}
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="image-placeholder">
                                <span>{project.projectName?.charAt(0).toUpperCase() || '?'}</span>
                            </div>
                        )}
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
                                    onClick={(e) => handleTagClick(e, tag)}
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