import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, X, ChevronLeft, Users, Lock, CheckCircle2, UserMinus, Clock, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';

const StudyGroups = ({ onClose }) => {
    const { currentCommunity, fetchStudyGroups, createStudyGroup, joinStudyGroup, leaveStudyGroup, fetchStudyGroupDetails, removeGroupMember, updateStudyGroup, deleteStudyGroup, user } = useCommunity();
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

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone and will delete all group channels and messages.')) return;
        const success = await deleteStudyGroup(groupId);
        if (success) {
            setViewMode('list');
            setSelectedGroup(null);
            loadGroups();
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
        <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
            <button className="text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors font-bold flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200" onClick={() => setViewMode('list')}>
                <ChevronLeft className="w-4 h-4" /> Back to Groups
            </button>

            <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{selectedGroup.name}</h2>
                    <div className="flex items-center gap-4 text-sm font-bold">
                        <span className="text-slate-600 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                            <Users className="w-4 h-4" /> {selectedGroup.member_count}/{selectedGroup.max_members}
                        </span>
                        {!selectedGroup.is_public && (
                            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-xs border border-amber-200">
                                <Lock className="w-3.5 h-3.5" /> Private
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <p className="text-slate-600 font-medium leading-relaxed mb-8">{selectedGroup.description}</p>

            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-400" />
                    Members ({selectedGroup.member_count})
                </h3>
                <div className="flex flex-col gap-3">
                    {/* Active Members */}
                    {selectedGroup.members?.filter(m => m.status === 'approved' || !m.status).map(member => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                    {member.user_email?.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-slate-900 tracking-tight">{member.user_email?.split('@')[0]}</span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${member.role === 'leader' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-200 text-slate-600 border border-slate-300'}`}>{member.role}</span>
                            </div>
                            {selectedGroup.creator_id === user?.id && member.user_id !== user?.id && (
                                <button
                                    className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-rose-200 flex items-center gap-1.5"
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    title="Remove member"
                                >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Pending Requests (Leader Only) */}
                    {selectedGroup.creator_id === user?.id && selectedGroup.members?.some(m => m.status === 'pending') && (
                        <div className="mt-8">
                            <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                                <Clock className="w-4 h-4" /> Pending Requests
                            </h4>
                            {selectedGroup.members?.filter(m => m.status === 'pending').map(member => (
                                <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-md border border-amber-200 shadow-sm mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
                                            {member.user_email?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-900">{member.user_email?.split('@')[0]}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="px-4 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5"
                                            onClick={() => handleApproveMember(member.user_id)}
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" /> Approve
                                        </button>
                                        <button
                                            className="px-4 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5"
                                            onClick={() => handleRejectMember(member.user_id)}
                                        >
                                            <ShieldAlert className="w-3.5 h-3.5" /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-6 border-t border-slate-200">
                {!selectedGroup.is_member ? (
                    <button
                        className="w-full py-3.5 bg-primary text-white rounded-md font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
                        onClick={() => handleJoin(selectedGroup.id)}
                        disabled={selectedGroup.member_count >= selectedGroup.max_members}
                    >
                        {!selectedGroup.is_public ? 'Request to Join' : (selectedGroup.member_count >= selectedGroup.max_members ? 'Group Full' : 'Join Group')}
                    </button>
                ) : (
                    selectedGroup.creator_id === user?.id ? (
                        <div className="text-center">
                            <button className="w-full py-3.5 bg-white text-rose-600 rounded-md font-bold hover:bg-rose-50 transition-colors border border-rose-200 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]" onClick={() => handleDeleteGroup(selectedGroup.id)}>
                                <Trash2 className="w-4 h-4" /> Delete Group
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            {selectedGroup.members?.find(m => m.user_id === user?.id)?.status === 'pending' ? (
                                <span className="flex items-center justify-center gap-2 w-full py-3 bg-amber-50 text-amber-700 rounded-md font-bold border border-amber-200 shadow-sm">
                                    <Clock className="w-4 h-4" /> Request Pending...
                                </span>
                            ) : (
                                <button className="w-full py-3.5 bg-white text-rose-600 rounded-md font-bold hover:bg-rose-50 transition-colors border border-rose-200 shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]" onClick={() => handleLeave(selectedGroup.id)}>
                                    <UserMinus className="w-4 h-4" /> Leave Group
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-[1000] backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-5xl max-h-[90vh] h-full rounded-md flex flex-col overflow-hidden shadow-2xl border border-slate-200" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 bg-slate-50 flex justify-between items-center border-b border-slate-200 shrink-0">
                    <h2 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-3 tracking-tight">
                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                            <BookOpen className="w-5 h-5 text-slate-700" />
                        </div>
                        Study Groups
                    </h2>
                    <button className="w-8 h-8 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {viewMode === 'details' && selectedGroup ? renderDetails() : (
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
                        <div className="px-6 py-4 shrink-0 bg-white border-b border-slate-200">
                            <button
                                className={`px-6 py-2.5 rounded-md font-bold text-sm transition-all shadow-sm active:scale-95 ${showCreateForm ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-primary text-white hover:bg-primary/90'}`}
                                onClick={() => setShowCreateForm(!showCreateForm)}
                            >
                                {showCreateForm ? 'Cancel' : '+ Create Group'}
                            </button>
                        </div>

                        {/* Create Form */}
                        {showCreateForm && (
                            <div className="px-6 py-5 shrink-0 bg-white border-b border-slate-200 shadow-sm relative z-10">
                                <form className="max-w-3xl mx-auto" onSubmit={handleCreate}>
                                    <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Create New Study Group</h3>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-[15px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                            placeholder="Group Name"
                                            value={newGroup.name}
                                            onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                            required
                                        />
                                        <textarea
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-[15px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
                                            placeholder="Description (optional)"
                                            rows="2"
                                            value={newGroup.description}
                                            onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                                        />
                                        <div className="flex flex-wrap gap-6 items-center p-4 bg-slate-50 rounded-md border border-slate-200">
                                            <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer accent-primary"
                                                    checked={newGroup.is_public}
                                                    onChange={e => setNewGroup({ ...newGroup, is_public: e.target.checked })}
                                                />
                                                Public Group
                                            </label>
                                            <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700">
                                                Max Members:
                                                <input
                                                    type="number"
                                                    className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                                    min="2"
                                                    max="100"
                                                    value={newGroup.max_members}
                                                    onChange={e => setNewGroup({ ...newGroup, max_members: parseInt(e.target.value) })}
                                                />
                                            </label>
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-md font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95 text-sm">
                                                Create Study Group
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Groups List */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {loading ? (
                                <div className="text-center text-slate-500 py-16 flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-sm animate-spin"></div>
                                    <p className="font-medium">Loading groups...</p>
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="text-center py-24 px-4 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-sm flex items-center justify-center mb-4 shadow-sm mx-auto">
                                        <BookOpen className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">No study groups yet</h3>
                                    <p className="text-slate-500 font-medium leading-relaxed">Create one to get started studying together with your classmates!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {groups.map(group => (
                                        <div 
                                            key={group.id} 
                                            className={`bg-white p-5 rounded-md border transition-all cursor-pointer group flex flex-col h-full ${group.is_member ? 'border-primary/40 shadow-sm bg-primary/5' : 'border-slate-200 shadow-sm hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5'}`} 
                                            onClick={() => handleViewDetails(group)}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 text-[16px] mb-3 flex items-start justify-between tracking-tight leading-snug">
                                                    <span className="truncate pr-3 group-hover:text-primary transition-colors">{group.name}</span>
                                                    {!group.is_public && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-1" />}
                                                </h3>
                                                {group.description && (
                                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">{group.description}</p>
                                                )}
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                                    <Users className="w-3.5 h-3.5" /> {group.member_count}/{group.max_members}
                                                </span>
                                                {group.is_member ? (
                                                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1 uppercase tracking-wider">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Joined
                                                    </span>
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
