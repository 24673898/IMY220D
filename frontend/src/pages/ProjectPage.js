import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Project from '../components/Project';
import EditProject from '../components/EditProject';
import FilesList from '../components/FilesList';
import Messages from '../components/Messages';
import './ProjectPage.css';

const ProjectPage = () => {
    const { id } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [projectData, setProjectData] = useState(null);
    const [owner, setOwner] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchProject();
        }
    }, [id]);

    const fetchProject = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${id}`);
            const data = await response.json();

            if (response.ok) {
                setProjectData(data.project);
                setOwner(data.owner);
                setMembers(data.members || []);
            } else {
                setError(data.error || 'Failed to fetch project');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Fetch project error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = (updatedProject) => {
        console.log('Project updated:', updatedProject);
        setIsEditing(false);
        fetchProject(); // Refresh project data
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const formatProjectData = () => {
        if (!projectData || !owner) return null;

        return {
            ...projectData,
            owner: {
                id: owner._id,
                firstName: owner.firstName,
                lastName: owner.lastName,
                username: owner.username
            },
            collaborators: members,
            status: projectData.status === 'checked-in' ? 'Checked In' : 'Checked Out',
            createdDate: new Date(projectData.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            lastModified: new Date(projectData.createdAt).toLocaleDateString(),
            downloads: projectData.downloads || 0,
            stars: projectData.stars || 0
        };
    };

    if (loading) {
        return (
            <div className="project-page">
                <Header />
                <div className="project-container">
                    <div className="loading">Loading project...</div>
                </div>
            </div>
        );
    }

    if (error || !projectData) {
        return (
            <div className="project-page">
                <Header />
                <div className="project-container">
                    <div className="error">{error || 'Project not found'}</div>
                </div>
            </div>
        );
    }

    const formattedProject = formatProjectData();

    return (
        <div className="project-page">
            <Header />
            <div className="project-container">
                {isEditing ? (
                    <EditProject
                        project={formattedProject}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                    />
                ) : (
                    <>
                        <Project
                            project={formattedProject}
                            onEdit={handleEdit}
                        />
                        
                        <div className="project-tabs">
                            <div className="tab-nav">
                                <button 
                                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    Overview
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('files')}
                                >
                                    Files
                                </button>
                                <button 
                                    className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('activity')}
                                >
                                    Activity
                                </button>
                            </div>
                            
                            <div className="tab-content">
                                {activeTab === 'overview' && (
                                    <div className="overview-content">
                                        <div className="project-stats-grid">
                                            <div className="stat-card">
                                                <h4>Downloads</h4>
                                                <span className="stat-number">{formattedProject.downloads || 0}</span>
                                            </div>
                                            <div className="stat-card">
                                                <h4>Stars</h4>
                                                <span className="stat-number">{formattedProject.stars || 0}</span>
                                            </div>
                                            <div className="stat-card">
                                                <h4>Collaborators</h4>
                                                <span className="stat-number">{members.length}</span>
                                            </div>
                                            <div className="stat-card">
                                                <h4>Version</h4>
                                                <span className="stat-number">{formattedProject.version}</span>
                                            </div>
                                        </div>

                                        <div className="collaborators-section">
                                            <h3>Collaborators</h3>
                                            <div className="collaborators-list">
                                                <div className="collaborator owner">
                                                    <div className="collaborator-avatar">
                                                        <span>{owner.firstName?.charAt(0)}{owner.lastName?.charAt(0)}</span>
                                                    </div>
                                                    <div className="collaborator-info">
                                                        <span className="collaborator-name">{owner.firstName} {owner.lastName}</span>
                                                        <span className="collaborator-role">Owner</span>
                                                    </div>
                                                </div>

                                                {members.map(member => (
                                                    <div key={member._id} className="collaborator">
                                                        <div className="collaborator-avatar">
                                                            <span>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</span>
                                                        </div>
                                                        <div className="collaborator-info">
                                                            <span className="collaborator-name">{member.firstName} {member.lastName}</span>
                                                            <span className="collaborator-role">Member</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'files' && (
                                    <FilesList projectId={projectData._id} />
                                )}

                                {activeTab === 'activity' && (
                                    <Messages projectId={projectData._id} />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProjectPage;