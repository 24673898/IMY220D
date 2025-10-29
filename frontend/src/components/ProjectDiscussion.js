import React, { useState, useEffect } from 'react';
import './ProjectDiscussion.css';

const ProjectDiscussion = ({ projectId, initialDiscussion = '', isProjectMember = false }) => {
    const [discussion, setDiscussion] = useState(initialDiscussion);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDiscussion, setEditedDiscussion] = useState(initialDiscussion);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setDiscussion(initialDiscussion);
        setEditedDiscussion(initialDiscussion);
    }, [initialDiscussion]);

    const getCurrentUser = () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    };

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
        const currentUser = getCurrentUser();
        if (!currentUser) {
            setError('Please log in to edit the discussion');
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
                {isProjectMember && !isEditing && (
                    <button className="edit-discussion-btn" onClick={handleEdit}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit
                    </button>
                )}
            </div>

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
                            {isProjectMember && (
                                <p className="discussion-hint">Click the "Edit" button to add project notes, goals, or discussion points.</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectDiscussion;
