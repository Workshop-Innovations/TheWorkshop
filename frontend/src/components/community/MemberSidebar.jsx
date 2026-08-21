import React, { useState, useRef, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import Leaderboard from './Leaderboard';
import { Trophy } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUtils';

const ProfileHoverCard = ({ member, onStartDM, isOwn, onClose }) => {
    const { fetchUserReputation } = useCommunity();
    const [rep, setRep] = useState(null);

    useEffect(() => {
        fetchUserReputation(member.user_id).then(data => setRep(data));
    }, [member.user_id]);

    const tierColor = {
        bronze: 'text-amber-600',
        silver: 'text-slate-400',
        gold: 'text-yellow-400',
        platinum: 'text-cyan-400',
    };

    return (
        <div className="absolute right-64 top-0 z-50 w-72 bg-slate-900 rounded-md shadow-2xl border border-slate-700 overflow-hidden">
            {/* Banner */}
            <div className="h-16 bg-gradient-to-r from-indigo-600 to-purple-600"></div>

            {/* Avatar */}
            <div className="px-4 pb-4">
                <div className="-mt-8 mb-3 relative inline-block">
                    <div className="w-16 h-16 rounded-sm bg-indigo-500 flex items-center justify-center text-white font-black text-2xl border-4 border-slate-900 overflow-hidden shadow-xl">
                        {member.user_profile_pic ? (
                            <img src={resolveImageUrl(member.user_profile_pic)} alt={member.user_email} className="w-full h-full object-cover" />
                        ) : (
                            member.user_email?.charAt(0).toUpperCase() || '?'
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <h3 className="text-white font-black text-base">
                        {member.user_email?.split('@')[0] || 'User'}
                    </h3>
                    <p className="text-slate-400 text-xs">{member.user_email}</p>
                    {member.role !== 'member' && (
                        <span className={`inline-block mt-1 text-[10px] uppercase font-black px-2 py-0.5 rounded-sm ${
                            member.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                            {member.role}
                        </span>
                    )}
                </div>

                {/* Stats */}
                {rep ? (
                    <div className="bg-slate-800 rounded-md p-3 mb-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-white font-black text-sm">{rep.reputation_points}</p>
                                <p className="text-slate-500 text-[10px]">Reputation</p>
                            </div>
                            <div>
                                <p className="text-white font-black text-sm">{rep.total_messages}</p>
                                <p className="text-slate-500 text-[10px]">Messages</p>
                            </div>
                            <div>
                                <p className="text-white font-black text-sm">{rep.helpful_votes}</p>
                                <p className="text-slate-500 text-[10px]">Upvotes</p>
                            </div>
                        </div>
                        {rep.badges?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700 flex flex-wrap gap-1.5">
                                {rep.badges.slice(0, 4).map(badge => (
                                    <span
                                        key={badge.id}
                                        className={`text-base`}
                                        title={`${badge.name}: ${badge.description}`}
                                    >
                                        {badge.icon}
                                    </span>
                                ))}
                                {rep.badges.length > 4 && (
                                    <span className="text-xs text-slate-500">+{rep.badges.length - 4} more</span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-slate-800 rounded-md p-3 mb-3 animate-pulse h-16"></div>
                )}

                {!isOwn && (
                    <button
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-md transition-colors"
                        onClick={() => { onStartDM(); onClose(); }}
                    >
                        Send Message
                    </button>
                )}
            </div>
        </div>
    );
};

const MemberSidebar = () => {
    const {
        members,
        currentCommunity,
        viewMode,
        startDM,
        user,
        onlineUsers,
        fetchUserReputation,
    } = useCommunity();

    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [hoveredMember, setHoveredMember] = useState(null);
    const [memberSearch, setMemberSearch] = useState('');
    const hoverTimeoutRef = useRef(null);

    if (viewMode === 'dms' || !currentCommunity) {
        return null;
    }

    const handleStartDM = async (member) => {
        if (member.user_id === user?.id) return;
        await startDM(member.user_id);
    };

    const handleMouseEnter = (member) => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredMember(member);
        }, 600);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredMember(null);
        }, 300);
    };

    const onlineMemberIds = new Set(onlineUsers);

    const filteredMembers = memberSearch
        ? members.filter(m =>
            m.user_email?.toLowerCase().includes(memberSearch.toLowerCase())
        )
        : members;

    const onlineMembers = filteredMembers.filter(m => onlineMemberIds.has(m.user_id));
    const offlineMembers = filteredMembers.filter(m => !onlineMemberIds.has(m.user_id));

    const renderMemberItem = (member, isOnline) => {
        const isOwn = member.user_id === user?.id;
        const isHovered = hoveredMember?.id === member.id;

        return (
            <div
                key={member.id}
                className={`relative flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-all group ${
                    isOnline ? '' : 'opacity-50 hover:opacity-100'
                } hover:bg-slate-700/60`}
                onClick={() => !isOwn && handleStartDM(member)}
                onMouseEnter={() => handleMouseEnter(member)}
                onMouseLeave={handleMouseLeave}
                title={isOwn ? 'You' : 'Click to DM'}
            >
                {/* Avatar with online indicator */}
                <div className="relative shrink-0">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-white font-bold text-xs overflow-hidden ${
                        isOnline ? 'bg-indigo-600' : 'bg-slate-600'
                    }`}>
                        {member.user_profile_pic ? (
                            <img
                                src={resolveImageUrl(member.user_profile_pic)}
                                alt={member.user_email}
                                className={`w-full h-full object-cover ${!isOnline ? 'grayscale' : ''}`}
                            />
                        ) : (
                            member.user_email?.charAt(0).toUpperCase() || '?'
                        )}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-sm border-2 border-slate-800 ${
                        isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}></span>
                </div>

                {/* Name & role */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold truncate ${isOnline ? 'text-slate-200' : 'text-slate-400'}`}>
                            {member.user_email?.split('@')[0] || 'User'}
                        </span>
                        {isOwn && <span className="text-[9px] text-slate-500">(you)</span>}
                    </div>
                    {member.role !== 'member' && (
                        <span className={`text-[9px] uppercase font-black tracking-wider ${
                            member.role === 'owner' ? 'text-amber-400' : 'text-red-400'
                        }`}>
                            {member.role}
                        </span>
                    )}
                </div>

                {/* Hover profile card */}
                {isHovered && (
                    <div
                        onMouseEnter={() => {
                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                            setHoveredMember(member);
                        }}
                        onMouseLeave={handleMouseLeave}
                    >
                        <ProfileHoverCard
                            member={member}
                            onStartDM={() => handleStartDM(member)}
                            isOwn={isOwn}
                            onClose={() => setHoveredMember(null)}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-800 overflow-hidden">
            {/* Leaderboard Button */}
            <div className="p-3 border-b border-slate-700/50 shrink-0">
                <button
                    className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-md shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm"
                    onClick={() => setShowLeaderboard(true)}
                >
                    <span><Trophy size={16} className="inline mr-1" /></span> Leaderboard
                </button>
            </div>

            {/* Member Search */}
            <div className="px-3 py-2 shrink-0">
                <div className="flex items-center gap-2 bg-slate-900/60 rounded-md px-2.5 py-1.5">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-slate-600 shrink-0">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                        type="text"
                        className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 focus:outline-none"
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-4">
                {/* Online */}
                {onlineMembers.length > 0 && (
                    <div className="mb-4">
                        <div className="px-2 py-1.5 mb-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Online - {onlineMembers.length}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            {onlineMembers.map(m => renderMemberItem(m, true))}
                        </div>
                    </div>
                )}

                {/* Offline */}
                {offlineMembers.length > 0 && (
                    <div>
                        <div className="px-2 py-1.5 mb-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Offline - {offlineMembers.length}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            {offlineMembers.map(m => renderMemberItem(m, false))}
                        </div>
                    </div>
                )}

                {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">
                        {memberSearch ? 'No members match your search' : 'No members yet'}
                    </div>
                )}
            </div>

            {showLeaderboard && (
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
            )}
        </div>
    );
};

export default MemberSidebar;
