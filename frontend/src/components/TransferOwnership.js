import React, { useState } from 'react';
import './TransferOwnership.css';

const TransferOwnership = ({ projectId, currentOwnerId, members, owner, onTransfer, onClose }) => {
    const [selectedMember, setSelectedMember] = useState('');
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter out current owner from member list
    const availableMembers = members.filter(member => member._id !== owner._id);

    const handleSelectMember = (memberId) => {
        setSelectedMember(memberId);
        setError(null);
    };

    const handleConfirm = () => {
        if (!selectedMember) {
            setError('Please select a new owner');
            return;
        }
        setConfirming(true);
    };

    const handleTransfer = async () => {
        if (!selectedMember) {
            setError('Please select a new owner');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/projects/${projectId}/owner`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentOwnerId: currentOwnerId,
                    newOwnerId: selectedMember
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Ownership transferred successfully!');
                onTransfer();
                onClose();
            } else {
                setError(data.error || 'Failed to transfer ownership');
                setConfirming(false);
            }
        } catch (err) {
            console.error('Transfer ownership error:', err);
            setError('Failed to transfer ownership');
            setConfirming(false);
        } finally {
            setLoading(false);
        }
    };

    const selectedMemberInfo = availableMembers.find(m => m._id === selectedMember);

    return (
        <div className="transfer-ownership-modal">
            <div className="transfer-ownership-content">
                <div className="transfer-ownership-header">
                    <h3>Transfer Project Ownership</h3>
                    {!confirming && (
                        <button className="close-btn" onClick={onClose}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    )}
                </div>

                <div className="transfer-ownership-body">
                    {!confirming ? (
                        <>
                            <div className="warning-box">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <div>
                                    <h4>Important</h4>
                                    <p>Transferring ownership will give another member full control over this project. You will become a regular member.</p>
                                </div>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            {availableMembers.length === 0 ? (
                                <div className="no-members-message">
                                    <p>No other members available. Add members to the project before transferring ownership.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="member-selection">
                                        <label>Select new owner:</label>
                                        <div className="members-list">
                                            {availableMembers.map(member => (
                                                <div
                                                    key={member._id}
                                                    className={`member-option ${selectedMember === member._id ? 'selected' : ''}`}
                                                    onClick={() => handleSelectMember(member._id)}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="newOwner"
                                                        value={member._id}
                                                        checked={selectedMember === member._id}
                                                        onChange={() => handleSelectMember(member._id)}
                                                    />
                                                    <div className="member-avatar">
                                                        {member.profileImage ? (
                                                            <img src={member.profileImage} alt={member.firstName} />
                                                        ) : (
                                                            <span>{member.firstName?.charAt(0)}{member.lastName?.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="member-name">{member.firstName} {member.lastName}</span>
                                                        <span className="member-username">@{member.username}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="transfer-actions">
                                        <button
                                            className="btn-cancel"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn-transfer"
                                            onClick={handleConfirm}
                                            disabled={!selectedMember}
                                        >
                                            Continue
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="confirmation-step">
                            <div className="confirmation-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                          stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <line x1="12" y1="9" x2="12" y2="13" stroke="#f59e0b" strokeWidth="2"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17" stroke="#f59e0b" strokeWidth="2"/>
                                </svg>
                            </div>

                            <h3>Are you absolutely sure?</h3>

                            {selectedMemberInfo && (
                                <div className="confirmation-details">
                                    <p>You are about to transfer ownership to:</p>
                                    <div className="selected-member-card">
                                        <div className="member-avatar large">
                                            {selectedMemberInfo.profileImage ? (
                                                <img src={selectedMemberInfo.profileImage} alt={selectedMemberInfo.firstName} />
                                            ) : (
                                                <span>{selectedMemberInfo.firstName?.charAt(0)}{selectedMemberInfo.lastName?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className="member-name">{selectedMemberInfo.firstName} {selectedMemberInfo.lastName}</div>
                                            <div className="member-username">@{selectedMemberInfo.username}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="confirmation-warning">
                                <p>This action cannot be undone. The new owner will have full control and can remove you from the project.</p>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <div className="confirmation-actions">
                                <button
                                    className="btn-back"
                                    onClick={() => setConfirming(false)}
                                    disabled={loading}
                                >
                                    Go Back
                                </button>
                                <button
                                    className="btn-confirm-transfer"
                                    onClick={handleTransfer}
                                    disabled={loading}
                                >
                                    {loading ? 'Transferring...' : 'Yes, Transfer Ownership'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransferOwnership;
