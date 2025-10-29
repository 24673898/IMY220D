import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Project from '../components/Project';
import EditProject from '../components/EditProject';
import FilesList from '../components/FilesList';
import Messages from '../components/Messages';
import AddContributor from '../components/AddContributor';
import TransferOwnership from '../components/TransferOwnership';
import ProjectDiscussion from '../components/ProjectDiscussion';
import { isAdmin, getCurrentUser as getUser } from '../utils/adminHelpers';
import AdminBadge from '../components/AdminBadge';
import './ProjectPage.css';

const ProjectPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [projectData, setProjectData] = useState(null);
    const [owner, setOwner] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New states for checkout/checkin functionality
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkinLoading, setCheckinLoading] = useState(false);
    const [checkinMessage, setCheckinMessage] = useState('');
    const [showCheckinForm, setShowCheckinForm] = useState(false);
    const [newFiles, setNewFiles] = useState([]);

    // New states for contributor management
    const [showAddContributor, setShowAddContributor] = useState(false);
    const [showTransferOwnership, setShowTransferOwnership] = useState(false);

    // Get current user and admin status
    const currentUser = getUser();
    const userIsAdmin = isAdmin(currentUser);
    const currentUserId = currentUser?._id;

    const isProjectMember = currentUser && members.some(member => member._id === currentUser._id);
    const isProjectOwner = currentUser && owner && owner._id === currentUser._id;
    const isProjectCheckedOut = projectData?.status === 'checked-out';
    const isCheckedOutByCurrentUser = isProjectCheckedOut && projectData?.checkedOutBy === currentUser?._id;

    // Admin permission checks
    const canEditProject = useMemo(() => {
        if (!currentUser || !projectData) return false;
        if (userIsAdmin) return true; // Admins can edit all projects
        return isProjectMember; // Regular users must be members
    }, [currentUser, userIsAdmin, projectData, isProjectMember]);

    const canDeleteProject = useMemo(() => {
        if (!currentUser || !projectData) return false;
        if (userIsAdmin) return true; // Admins can delete all projects
        return isProjectOwner; // Regular users must be owners
    }, [currentUser, userIsAdmin, projectData, isProjectOwner]);

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

    // CHECKOUT FUNCTIONALITY
    const handleCheckout = async () => {
        if (!currentUser) {
            alert('Please log in to check out projects');
            return;
        }

        if (!isProjectMember) {
            alert('You must be a project member to check out this project');
            return;
        }

        setCheckoutLoading(true);
        try {
            const response = await fetch(`/api/projects/${id}/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: currentUser._id })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Project checked out successfully! You can now make changes.');
                fetchProject(); // Refresh project data
            } else {
                alert(data.error || 'Failed to check out project');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Failed to check out project');
        } finally {
            setCheckoutLoading(false);
        }
    };

    // CHECKIN FUNCTIONALITY
    const handleCheckin = async () => {
        if (!checkinMessage.trim()) {
            alert('Please provide a check-in message');
            return;
        }

        setCheckinLoading(true);
        try {
            const response = await fetch(`/api/projects/${id}/checkin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUser._id,
                    message: checkinMessage,
                    version: projectData?.version,
                    files: newFiles.length > 0 ? newFiles : projectData?.files || []
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Project checked in successfully!');
                setCheckinMessage('');
                setNewFiles([]);
                setShowCheckinForm(false);
                fetchProject(); // Refresh project data
            } else {
                alert(data.error || 'Failed to check in project');
            }
        } catch (err) {
            console.error('Checkin error:', err);
            alert('Failed to check in project');
        } finally {
            setCheckinLoading(false);
        }
    };

    // FILE UPLOAD FUNCTIONALITY (simulated)
    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        const newFileList = files.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        }));
        setNewFiles(prev => [...prev, ...newFileList]);
    };

    const handleRemoveFile = (index) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveMember = async (memberId) => {
        // Check permissions - owner or admin
        if (!isProjectOwner && !userIsAdmin) {
            alert('Only the project owner or admin can remove members');
            return;
        }

        const memberToRemove = members.find(m => m._id === memberId);
        const confirmMessage = userIsAdmin && !isProjectOwner
            ? `Are you sure you want to remove ${memberToRemove?.firstName} ${memberToRemove?.lastName} from this project as an ADMIN?`
            : `Are you sure you want to remove ${memberToRemove?.firstName} ${memberToRemove?.lastName} from this project?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${id}/members/${memberId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                alert(userIsAdmin && !isProjectOwner ? 'Member removed successfully (as admin)' : 'Member removed successfully');
                fetchProject(); // Refresh project data
            } else {
                alert(data.error || 'Failed to remove member');
            }
        } catch (err) {
            console.error('Remove member error:', err);
            alert('Failed to remove member');
        }
    };

    const handleEdit = () => {
        if (!canEditProject) {
            alert('You do not have permission to edit this project');
            return;
        }
        setIsEditing(true);
    };

    const handleSaveEdit = async (updatedProject) => {
        if (!canEditProject || !currentUserId) {
            alert('You do not have permission to edit this project');
            return;
        }

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUserId,
                    name: updatedProject.name,
                    description: updatedProject.description,
                    type: updatedProject.type,
                    version: updatedProject.version,
                    tags: updatedProject.hashtags
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(userIsAdmin && !isProjectOwner ? 'Project updated successfully (as admin)' : 'Project updated successfully');
                setIsEditing(false);
                fetchProject(); // Refresh project data
            } else {
                alert(data.error || 'Failed to update project');
            }
        } catch (error) {
            console.error('Update project error:', error);
            alert('Failed to update project');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!canDeleteProject) {
            alert('You do not have permission to delete this project');
            return;
        }

        const confirmMessage = userIsAdmin && !isProjectOwner
            ? `WARNING: You are about to delete "${projectData.name}" as an ADMIN. This will permanently delete the project and all its data. This action cannot be undone. Are you absolutely sure?`
            : `Are you sure you want to delete "${projectData.name}"? This action cannot be undone and will delete all project data.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: currentUserId })
            });

            const data = await response.json();

            if (response.ok) {
                alert(userIsAdmin && !isProjectOwner ? 'Project deleted successfully (as admin)' : 'Project deleted successfully');
                navigate('/projects'); // Redirect to projects page
            } else {
                alert(data.error || 'Failed to delete project');
            }
        } catch (err) {
            console.error('Delete project error:', err);
            alert('Failed to delete project');
        }
    };

    const formatProjectData = () => {
        if (!projectData || !owner) return null;

        return {
            ...projectData,
            owner: {
                id: owner._id,
                firstName: owner.firstName,
                lastName: owner.lastName,
                username: owner.username,
                role: owner.role // Include role for admin badge
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

    if (error || !projectData || !owner) {
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

    // Additional safety check
    if (!formattedProject) {
        return (
            <div className="project-page">
                <Header />
                <div className="project-container">
                    <div className="loading">Loading project data...</div>
                </div>
            </div>
        );
    }

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
                        {userIsAdmin && !isProjectOwner && !isProjectMember && (
                            <div className="admin-notice" style={{
                                backgroundColor: '#fff3cd',
                                color: '#856404',
                                padding: '12px',
                                borderRadius: '4px',
                                marginBottom: '16px',
                                border: '1px solid #ffeaa7'
                            }}>
                                <strong>Admin Mode:</strong> You are viewing this project with admin privileges.
                            </div>
                        )}
                        <Project
                            project={formattedProject}
                            onEdit={canEditProject ? handleEdit : undefined}
                            onDelete={canDeleteProject ? handleDelete : undefined}
                            isAdmin={userIsAdmin}
                            isOwner={isProjectOwner}
                            isMember={isProjectMember}
                        />
                        
                        {/* COLLABORATION CONTROLS */}
                        <div className="collaboration-controls">
                            <div className="project-status">
                                <strong>Status: </strong>
                                <span className={`status-badge ${projectData.status}`}>
                                    {projectData.status === 'checked-in' ? 'Checked In' : 'Checked Out'}
                                </span>
                                {isProjectCheckedOut && (
                                    <span className="checked-out-by">
                                        by {projectData.checkedOutBy === currentUser?._id ? 'You' : 'Another user'}
                                    </span>
                                )}
                            </div>

                            <div className="collaboration-buttons">
                                {!isProjectCheckedOut && isProjectMember && (
                                    <button 
                                        className="btn-checkout"
                                        onClick={handleCheckout}
                                        disabled={checkoutLoading}
                                    >
                                        {checkoutLoading ? 'Checking Out...' : 'Check Out Project'}
                                    </button>
                                )}

                                {isCheckedOutByCurrentUser && !showCheckinForm && (
                                    <button 
                                        className="btn-checkin"
                                        onClick={() => setShowCheckinForm(true)}
                                    >
                                        Check In Changes
                                    </button>
                                )}

                                {isProjectCheckedOut && !isCheckedOutByCurrentUser && (
                                    <div className="checkout-warning">
                                        Project is currently checked out by another user
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CHECKIN FORM */}
                        {showCheckinForm && (
                            <div className="checkin-form">
                                <h3>Check In Changes</h3>
                                <div className="form-group">
                                    <label>Check-in Message:</label>
                                    <textarea
                                        value={checkinMessage}
                                        onChange={(e) => setCheckinMessage(e.target.value)}
                                        placeholder="Describe the changes you made..."
                                        rows="3"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Upload Updated Files:</label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                    />
                                    {newFiles.length > 0 && (
                                        <div className="file-preview">
                                            <h4>New Files:</h4>
                                            {newFiles.map((file, index) => (
                                                <div key={index} className="file-item">
                                                    <span>{file.name}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveFile(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-actions">
                                    <button 
                                        className="btn-primary"
                                        onClick={handleCheckin}
                                        disabled={checkinLoading || !checkinMessage.trim()}
                                    >
                                        {checkinLoading ? 'Checking In...' : 'Check In'}
                                    </button>
                                    <button 
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowCheckinForm(false);
                                            setCheckinMessage('');
                                            setNewFiles([]);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        
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
                                    className={`tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('discussion')}
                                >
                                    Discussion
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
                                            <div className="collaborators-header">
                                                <h3>Collaborators</h3>
                                                <div className="collaborators-actions">
                                                    {isProjectMember && (
                                                        <button
                                                            className="add-contributor-btn"
                                                            onClick={() => setShowAddContributor(true)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                            </svg>
                                                            Add Contributor
                                                        </button>
                                                    )}
                                                    {isProjectOwner && (
                                                        <button
                                                            className="transfer-ownership-btn"
                                                            onClick={() => setShowTransferOwnership(true)}
                                                            title="Transfer ownership"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                                <path d="M17 11l-5-5-5 5M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                <path d="M19 19H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                            </svg>
                                                            Transfer Ownership
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
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

                                                {members.filter(member => member._id !== owner._id).map(member => (
                                                    <div key={member._id} className="collaborator">
                                                        <div className="collaborator-left">
                                                            <div className="collaborator-avatar">
                                                                <span>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</span>
                                                            </div>
                                                            <div className="collaborator-info">
                                                                <span className="collaborator-name">{member.firstName} {member.lastName}</span>
                                                                <span className="collaborator-role">Member</span>
                                                            </div>
                                                        </div>
                                                        {(isProjectOwner || userIsAdmin) && (
                                                            <button
                                                                className="remove-member-btn"
                                                                onClick={() => handleRemoveMember(member._id)}
                                                                title={userIsAdmin && !isProjectOwner ? "Remove member (Admin)" : "Remove member"}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'files' && (
                                    <FilesList
                                        projectId={projectData._id}
                                        canUpload={isProjectMember}
                                        onFilesUpdate={setNewFiles}
                                    />
                                )}

                                {activeTab === 'discussion' && (
                                    <ProjectDiscussion
                                        projectId={projectData._id}
                                        initialDiscussion={projectData.discussion || ''}
                                        isProjectMember={isProjectMember}
                                    />
                                )}

                                {activeTab === 'activity' && (
                                    <Messages projectId={projectData._id} />
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Add Contributor Modal */}
                {showAddContributor && (
                    <AddContributor
                        projectId={id}
                        currentMembers={members}
                        onMemberAdded={fetchProject}
                        onClose={() => setShowAddContributor(false)}
                        isOwner={isProjectOwner}
                        currentUserId={currentUser?._id}
                    />
                )}

                {/* Transfer Ownership Modal */}
                {showTransferOwnership && (
                    <TransferOwnership
                        projectId={id}
                        currentOwnerId={currentUser?._id}
                        members={members}
                        owner={owner}
                        onTransfer={fetchProject}
                        onClose={() => setShowTransferOwnership(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ProjectPage;