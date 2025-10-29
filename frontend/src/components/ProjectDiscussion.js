import React, { useState, useEffect } from 'react';
import { isAdmin, getCurrentUser as getUser } from '../utils/adminHelpers';
import './ProjectDiscussion.css';

const ProjectDiscussion = ({ projectId, initialDiscussion = '', isProjectMember = false }) => {
    const [discussion, setDiscussion] = useState(initialDiscussion);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDiscussion, setEditedDiscussion] = useState(initialDiscussion);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Get current user and check admin status
    const currentUser = getUser();
    const userIsAdmin = isAdmin(currentUser);
    const canEditDiscussion = isProjectMember || userIsAdmin;

    useEffect(() => {
        setDiscussion(initialDiscussion);
        setEditedDiscussion(initialDiscussion);
    }, [initialDiscussion]);

    const handleEdit = () => {
        setIsEditing(true);
        setEditedDiscussion(discussion);
        setError(null);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedDiscussion(discussion);
        setError(null);
    };

    const handleSave = async () => {
        if (!currentUser) {
            setError('Please log in to edit the discussion');
            return;
        }

        if (!canEditDiscussion) {
            setError('You do not have permission to edit this discussion');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/projects/${projectId}/discussion`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    discussion: editedDiscussion,
                    userId: currentUser._id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setDiscussion(editedDiscussion);
                setIsEditing(false);
                if (userIsAdmin && !isProjectMember) {
                    alert('Discussion updated successfully (as admin)');
                }
            } else {
                setError(data.error || 'Failed to update discussion');
            }
        } catch (err) {
            console.error('Update discussion error:', err);
            setError('Failed to connect to server');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="project-discussion">
            <div className="discussion-header">
                <h3>Project Discussion</h3>
                {canEditDiscussion && !isEditing && (
                    <button className="edit-discussion-btn" onClick={handleEdit}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {userIsAdmin && !isProjectMember ? 'Edit (Admin)' : 'Edit'}
                    </button>
                )}
            </div>

            {userIsAdmin && !isProjectMember && (
                <div style={{
                    backgroundColor: '#fff3cd',
                    color: '#856404',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    border: '1px solid #ffeaa7'
                }}>
                    <strong>Admin Mode:</strong> You can edit this discussion with admin privileges.
                </div>
            )}

            {error && (
                <div className="discussion-error">
                    {error}
                </div>
            )}

            {isEditing ? (
                <div className="discussion-edit">
                    <textarea
                        className="discussion-textarea"
                        value={editedDiscussion}
                        onChange={(e) => setEditedDiscussion(e.target.value)}
                        placeholder="Enter project discussion notes, goals, or updates..."
                        rows="10"
                    />
                    <div className="discussion-actions">
                        <button
                            className="btn-save"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            className="btn-cancel"
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="discussion-view">
                    {discussion ? (
                        <div className="discussion-content">
                            {discussion.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    ) : (
                        <div className="discussion-empty">
                            <p>No discussion yet.</p>
                            {canEditDiscussion && (
                                <p className="discussion-hint">
                                    Click the "Edit" button to add project notes, goals, or discussion points.
                                    {userIsAdmin && !isProjectMember && ' (Admin access)'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectDiscussion;
