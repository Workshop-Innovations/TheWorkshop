import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';

const StudyGroups = ({ onClose }) => {
    const { currentCommunity, fetchStudyGroups, createStudyGroup, joinStudyGroup, leaveStudyGroup, fetchStudyGroupDetails, removeGroupMember, user } = useCommunity();
    const { accessToken } = useAuth();
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'details'
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', is_public: true, max_members: 20 });

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
        const details = await fetchStudyGroupDetails(group.id);
        if (details) {
            setSelectedGroup(details);
            setViewMode('details');
        }
    };

    const updateMemberStatus = async (groupId, userId, status) => {
        try {
            const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1`;
            const response = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
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
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            <button className="text-sm text-slate-500 hover:text-primary mb-6 transition-colors font-medium flex items-center gap-1" onClick={() => setViewMode('list')}>
                ← Back to Groups
            </button>

            <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedGroup.name}</h2>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-600 font-medium">👥 {selectedGroup.member_count}/{selectedGroup.max_members} Members</span>
                        {!selectedGroup.is_public && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold border border-amber-200">🔒 Private</span>}
                    </div>
                </div>
            </div>

            <p className="text-slate-600 leading-relaxed mb-8">{selectedGroup.description}</p>

            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Members ({selectedGroup.member_count})</h3>
                <div className="flex flex-col gap-2">
                    {/* Active Members */}
                    {selectedGroup.members?.filter(m => m.status === 'approved' || !m.status).map(member => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-800">{member.user_email?.split('@')[0]}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${member.role === 'leader' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>{member.role}</span>
                            </div>
                            {selectedGroup.creator_id === user?.id && member.user_id !== user?.id && (
                                <button
                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
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
                        <div className="mt-6">
                            <h4 className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3 border-t border-slate-200 pt-4">Pending Requests</h4>
                            {selectedGroup.members?.filter(m => m.status === 'pending').map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-slate-800">{member.user_email?.split('@')[0]}</span>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 italic">Pending</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-3 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-bold rounded-lg transition-colors"
                                            onClick={() => handleApproveMember(member.user_id)}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            className="px-3 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold rounded-lg transition-colors"
                                            onClick={() => handleRejectMember(member.user_id)}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
                {!selectedGroup.is_member ? (
                    <button
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleJoin(selectedGroup.id)}
                        disabled={selectedGroup.member_count >= selectedGroup.max_members}
                    >
                        {!selectedGroup.is_public ? 'Request to Join' : (selectedGroup.member_count >= selectedGroup.max_members ? 'Full' : 'Join Group')}
                    </button>
                ) : (
                    selectedGroup.creator_id !== user?.id && (
                        <div className="text-center">
                            {selectedGroup.members?.find(m => m.user_id === user?.id)?.status === 'pending' ? (
                                <span className="block w-full py-3 bg-amber-100 text-amber-700 rounded-xl font-bold italic">Request Pending...</span>
                            ) : (
                                <button className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors border border-rose-200" onClick={() => handleLeave(selectedGroup.id)}>
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
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 bg-slate-50 flex justify-between items-center border-b border-slate-200 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-2">
                        <span>📚</span> Study Groups
                    </h2>
                    <button className="text-3xl text-slate-400 hover:text-slate-800 transition-colors" onClick={onClose}>×</button>
                </div>

                {viewMode === 'details' && selectedGroup ? renderDetails() : (
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                        <div className="p-6 pb-2 shrink-0">
                            <button
                                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${showCreateForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'}`}
                                onClick={() => setShowCreateForm(!showCreateForm)}
                            >
                                {showCreateForm ? 'Cancel' : '+ Create Group'}
                            </button>
                        </div>

                        {/* Create Form */}
                        {showCreateForm && (
                            <div className="px-6 mb-4 shrink-0">
                                <form className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" onSubmit={handleCreate}>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Study Group</h3>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="Group Name"
                                            value={newGroup.name}
                                            onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                            required
                                        />
                                        <textarea
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                                            placeholder="Description (optional)"
                                            rows="2"
                                            value={newGroup.description}
                                            onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                                        />
                                        <div className="flex flex-wrap gap-6 items-center">
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                                                    checked={newGroup.is_public}
                                                    onChange={e => setNewGroup({ ...newGroup, is_public: e.target.checked })}
                                                />
                                                Public Group
                                            </label>
                                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                Max Members:
                                                <input
                                                    type="number"
                                                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-primary transition-all"
                                                    min="2"
                                                    max="100"
                                                    value={newGroup.max_members}
                                                    onChange={e => setNewGroup({ ...newGroup, max_members: parseInt(e.target.value) })}
                                                />
                                            </label>
                                        </div>
                                        <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 text-sm mt-2">
                                            Create Study Group
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Groups List */}
                        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
                            {loading ? (
                                <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-4">
                                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                    <p>Loading groups...</p>
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="text-center py-20 px-4">
                                    <span className="text-6xl block mb-4 opacity-50">📖</span>
                                    <h3 className="text-xl font-bold text-slate-700 mb-2">No study groups yet</h3>
                                    <p className="text-slate-500">Create one to get started!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groups.map(group => (
                                        <div 
                                            key={group.id} 
                                            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col h-full ${group.is_member ? 'border-primary/30 shadow-md ring-1 ring-primary/10' : 'border-slate-200 shadow-sm hover:border-primary hover:shadow-md hover:-translate-y-1'}`} 
                                            onClick={() => handleViewDetails(group)}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center justify-between">
                                                    <span className="truncate pr-2">{group.name}</span>
                                                    {!group.is_public && <span className="shrink-0 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">Private</span>}
                                                </h3>
                                                {group.description && (
                                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{group.description}</p>
                                                )}
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-400">
                                                    👥 {group.member_count}/{group.max_members}
                                                </span>
                                                {group.is_member ? (
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">✓ Joined</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">View Details &rarr;</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyGroups;
