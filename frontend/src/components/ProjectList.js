import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditProject from './EditProject';
import './ProjectList.css';

const ProjectList = ({ userId, onCreateProject, isOwnProfile }) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingProject, setEditingProject] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, [userId]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const url = userId
                ? `/api/projects?userId=${userId}`
                : '/api/projects';

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setProjects(data.projects || []);
            } else {
                setError(data.error || 'Failed to fetch projects');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Fetch projects error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectClick = (project) => {
        navigate(`/project/${project._id}`);
    };

    const handleEditProject = (project, e) => {
        e.stopPropagation();
        // Format project data for EditProject component
        const formattedProject = {
            id: project._id,
            _id: project._id,
            name: project.name,
            description: project.description,
            type: project.type,
            version: project.version || '1.0.0',
            tags: project.tags || []
        };
        setEditingProject(formattedProject);
    };

    const handleSaveEdit = async (updatedData) => {
        try {
            const response = await fetch(`/api/projects/${updatedData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: updatedData.name,
                    description: updatedData.description,
                    type: updatedData.type,
                    tags: updatedData.hashtags
                })
            });

            if (response.ok) {
                setEditingProject(null);
                fetchProjects(); // Refresh the list
                alert('Project updated successfully!');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to update project');
            }
        } catch (err) {
            console.error('Update project error:', err);
            alert('Failed to update project');
        }
    };

    const handleCancelEdit = () => {
        setEditingProject(null);
    };

    const handleDeleteProject = async (project, e) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
            try {
                const response = await fetch(`/api/projects/${project._id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    fetchProjects(); // Refresh the list
                } else {
                    const data = await response.json();
                    alert(data.error || 'Failed to delete project');
                }
            } catch (err) {
                console.error('Delete project error:', err);
                alert('Failed to delete project');
            }
        }
    };

    const formatDate = (date) => {
        const now = new Date();
        const projectDate = new Date(date);
        const diffTime = Math.abs(now - projectDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return '1 week ago';
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return projectDate.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="project-list-card">
                <div className="loading">Loading projects...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="project-list-card">
                <div className="error">{error}</div>
            </div>
        );
    }

    // If editing a project, show the EditProject component
    if (editingProject) {
        return (
            <EditProject
                project={editingProject}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
            />
        );
    }

    return (
        <div className="project-list-card">
            <div className="project-list-header">
                <h3 className="project-list-title">{userId ? 'My Projects' : 'All Projects'}</h3>
                {onCreateProject && (
                    <button className="create-project-btn" onClick={onCreateProject}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        New Project
                    </button>
                )}
            </div>

            {projects.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                                  stroke="currentColor" strokeWidth="2"/>
                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                    </div>
                    <h4>No Projects Yet</h4>
                    <p>Create your first project to get started</p>
                    <button className="create-first-project-btn" onClick={onCreateProject}>
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="projects-grid">
                    {projects.map(project => (
                        <div
                            key={project._id}
                            className="project-card"
                            onClick={() => handleProjectClick(project)}
                        >
                            <div className="project-card-header">
                                <h4 className="project-name">{project.name}</h4>
                                {isOwnProfile && (
                                    <div className="project-actions">
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={(e) => handleEditProject(project, e)}
                                            title="Edit Project"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z"
                                                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={(e) => handleDeleteProject(project, e)}
                                            title="Delete Project"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"
                                                      stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="project-description">{project.description}</p>

                            <div className="project-tags">
                                {(project.tags || []).map((tag, index) => (
                                    <span key={index} className="project-tag">{tag}</span>
                                ))}
                            </div>

                            <div className="project-meta">
                                <div className="project-stats">
                                    <span className="stat">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                        {project.members ? project.members.length : 0}
                                    </span>
                                    <span className="stat">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        {project.downloads || 0}
                                    </span>
                                </div>

                                <span className={`project-status ${project.status === 'checked-in' ? 'checked-in' : 'checked-out'}`}>
                                    {project.status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                                </span>
                            </div>

                            <div className="project-footer">
                                <span className="last-modified">Updated {formatDate(project.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectList;