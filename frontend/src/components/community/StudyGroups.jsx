import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import './StudyGroups.css';

const StudyGroups = ({ onClose }) => {
    const { currentCommunity, fetchStudyGroups, createStudyGroup, joinStudyGroup, leaveStudyGroup, user } = useCommunity();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'

    useEffect(() => {
        if (currentCommunity) {
            loadGroups();
        }
    }, [currentCommunity]);

    const loadGroups = async () => {
        setLoading(true);
        const data = await fetchStudyGroups(currentCommunity.id);
        setGroups(data || []);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newGroup.name.trim()) return;

        const created = await createStudyGroup(currentCommunity.id, newGroup);
        if (created) {
            setGroups([...groups, created]);
            setShowCreateForm(false);
            setNewGroup({ name: '', description: '', is_public: true, max_members: 20 });
        }
    };

    const handleJoin = async (groupId) => {
        const success = await joinStudyGroup(groupId);
        if (success) {
            loadGroups();
            if (viewMode === 'details' && selectedGroup?.id === groupId) {
                handleViewDetails(selectedGroup);
            }
        }
    };

    const handleLeave = async (groupId) => {
        const success = await leaveStudyGroup(groupId);
        if (success) {
            loadGroups();
            if (viewMode === 'details' && selectedGroup?.id === groupId) {
                setViewMode('list');
                setSelectedGroup(null);
            }
        }
    };

    const handleViewDetails = async (group) => {
        const { fetchStudyGroupDetails } = await import('../../context/CommunityContext'); // Dynamic import hack if needed, but context has it
        // Actually we get it from hook
        const details = await fetchStudyGroupDetails(group.id);
        if (details) {
            setSelectedGroup(details);
            setViewMode('details');
        }
    };

    // We need to destructure the new functions from useCommunity
    const { fetchStudyGroupDetails, removeGroupMember } = useCommunity();

    const updateMemberStatus = async (groupId, userId, status) => {
        try {
            const token = localStorage.getItem('token');
            const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;
            const response = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (response.ok) return true;
        } catch (e) {
            console.error(e);
        }
        return false;
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;

        const success = await removeGroupMember(selectedGroup.id, userId);
        if (success) {
            handleViewDetails(selectedGroup);
        }
    };

    const handleApproveMember = async (userId) => {
        const success = await updateMemberStatus(selectedGroup.id, userId, "approved");
        if (success) {
            handleViewDetails(selectedGroup);
        }
    };

    const handleRejectMember = async (userId) => {
        if (!window.confirm('Reject this request?')) return;
        const success = await removeGroupMember(selectedGroup.id, userId);
        if (success) {
            handleViewDetails(selectedGroup);
        }
    };

    const renderDetails = () => (
        <div className="group-details">
            <button className="back-btn" onClick={() => setViewMode('list')}>← Back to Groups</button>

            <div className="details-header">
                <h2>{selectedGroup.name}</h2>
                <div className="details-meta">
                    <span className="member-count">👥 {selectedGroup.member_count}/{selectedGroup.max_members}</span>
                    {!selectedGroup.is_public && <span className="private-badge">🔒 Private</span>}
                </div>
            </div>

            <p className="details-description">{selectedGroup.description}</p>

            <div className="members-section">
                <h3>Members ({selectedGroup.member_count})</h3>
                <div className="members-list">
                    {/* Active Members */}
                    {selectedGroup.members?.filter(m => m.status === 'approved' || !m.status).map(member => (
                        <div key={member.id} className="member-item">
                            <div className="member-info">
                                <span className="member-email">{member.user_email}</span>
                                <span className={`member-role role-${member.role}`}>{member.role}</span>
                            </div>
                            {selectedGroup.creator_id === user?.id && member.user_id !== user?.id && (
                                <button
                                    className="remove-member-btn"
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    title="Remove member"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Pending Requests (Leader Only) */}
                    {selectedGroup.creator_id === user?.id && selectedGroup.members?.some(m => m.status === 'pending') && (
                        <>
                            <h4 className="pending-header">Pending Requests</h4>
                            {selectedGroup.members?.filter(m => m.status === 'pending').map(member => (
                                <div key={member.id} className="member-item pending">
                                    <div className="member-info">
                                        <span className="member-email">{member.user_email}</span>
                                        <span className="member-role role-pending">Pending</span>
                                    </div>
                                    <div className="pending-actions">
                                        <button
                                            className="approve-btn"
                                            onClick={() => handleApproveMember(member.user_id)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="reject-btn"
                                            onClick={() => handleRejectMember(member.user_id)}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div className="details-actions">
                {!selectedGroup.is_member ? (
                    <button
                        className="join-btn"
                        onClick={() => handleJoin(selectedGroup.id)}
                        disabled={selectedGroup.member_count >= selectedGroup.max_members}
                    >
                        {!selectedGroup.is_public ? 'Request to Join' : (selectedGroup.member_count >= selectedGroup.max_members ? 'Full' : 'Join Group')}
                    </button>
                ) : (
                    selectedGroup.creator_id !== user?.id && (
                        <div className="member-status-display">
                            {selectedGroup.members?.find(m => m.user_id === user?.id)?.status === 'pending' ? (
                                <span className="pending-status-msg">Request Pending...</span>
                            ) : (
                                <button className="leave-btn" onClick={() => handleLeave(selectedGroup.id)}>
                                    Leave Group
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );

    return (
        <div className="study-groups-overlay" onClick={onClose}>
            <div className="study-groups-modal" onClick={e => e.stopPropagation()}>
                <div className="study-groups-header">
                    <h2>📚 Study Groups</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {viewMode === 'details' && selectedGroup ? renderDetails() : (
                    <>
                        <div className="study-groups-toolbar">
                            <button
                                className="create-group-btn"
                                onClick={() => setShowCreateForm(!showCreateForm)}
                            >
                                {showCreateForm ? 'Cancel' : '+ Create Group'}
                            </button>
                        </div>

                        {/* Create Form */}
                        {showCreateForm && (
                            <form className="create-group-form" onSubmit={handleCreate}>
                                <input
                                    type="text"
                                    placeholder="Group Name"
                                    value={newGroup.name}
                                    onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                    required
                                />
                                <textarea
                                    placeholder="Description (optional)"
                                    value={newGroup.description}
                                    onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                                />
                                <div className="form-row">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newGroup.is_public}
                                            onChange={e => setNewGroup({ ...newGroup, is_public: e.target.checked })}
                                        />
                                        Public Group
                                    </label>
                                    <label>
                                        Max Members:
                                        <input
                                            type="number"
                                            min="2"
                                            max="100"
                                            value={newGroup.max_members}
                                            onChange={e => setNewGroup({ ...newGroup, max_members: parseInt(e.target.value) })}
                                        />
                                    </label>
                                </div>
                                <button type="submit" className="submit-btn">Create Study Group</button>
                            </form>
                        )}

                        {/* Groups List */}
                        <div className="study-groups-content">
                            {loading ? (
                                <div className="loading">Loading groups...</div>
                            ) : groups.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📖</div>
                                    <p>No study groups yet. Create one to get started!</p>
                                </div>
                            ) : (
                                <div className="groups-list">
                                    {groups.map(group => (
                                        <div key={group.id} className={`group-card ${group.is_member ? 'joined' : ''}`} onClick={() => handleViewDetails(group)}>
                                            <div className="group-info">
                                                <h3>{group.name}</h3>
                                                {group.description && (
                                                    <p className="group-description">{group.description}</p>
                                                )}
                                                <div className="group-meta">
                                                    <span className="member-count">
                                                        👥 {group.member_count}/{group.max_members}
                                                    </span>
                                                    {!group.is_public && (
                                                        <span className="private-badge">🔒 Private</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="group-actions">
                                                {group.is_member ? (
                                                    <>
                                                        <span className="joined-badge">✓ Joined</span>
                                                    </>
                                                ) : (
                                                    <span className="view-details-hint">View Details &rarr;</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StudyGroups;
