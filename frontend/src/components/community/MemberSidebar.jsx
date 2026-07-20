import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import Leaderboard from './Leaderboard';

const MemberSidebar = () => {
    const {
        members,
        currentCommunity,
        viewMode,
        startDM,
        user,
        onlineUsers
    } = useCommunity();

    const [showLeaderboard, setShowLeaderboard] = useState(false);

    if (viewMode === 'dms' || !currentCommunity) {
        return null;
    }

    const handleStartDM = async (member) => {
        if (member.user_id === user?.id) return; // Can't DM yourself
        await startDM(member.user_id);
    };

    // Separate online and offline members
    const onlineMemberIds = new Set(onlineUsers);
    const onlineMembers = members.filter(m => onlineMemberIds.has(m.user_id));
    const offlineMembers = members.filter(m => !onlineMemberIds.has(m.user_id));

    return (
        <div className="flex flex-col h-full bg-[#1E293B] overflow-hidden">
            {/* Leaderboard Button */}
            <div className="p-5 border-b border-slate-700/50 bg-[#0F172A]/40 backdrop-blur-md shrink-0">
                <button
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    onClick={() => setShowLeaderboard(true)}
                >
                    <span className="text-lg">🏆</span> 
                    <span className="tracking-wide">Leaderboard</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-6 space-y-8">
                {/* Online Members */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                        Online — {onlineMembers.length}
                    </h4>
                    {onlineMembers.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#0F172A]/80 transition-all group"
                            onClick={() => handleStartDM(member)}
                            title={member.user_id === user?.id ? 'You' : 'Click to DM'}
                        >
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm overflow-hidden transform group-hover:scale-105 transition-transform shadow-md">
                                    {member.user_profile_pic ? (
                                        <img src={member.user_profile_pic} alt={member.user_email} className="w-full h-full object-cover" />
                                    ) : (
                                        member.user_email?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>
                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-[#1E293B] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                    <span className={`font-semibold text-[15px] truncate tracking-tight ${member.user_id === user?.id ? 'text-indigo-400' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                                        {member.user_email?.split('@')[0] || 'User'}
                                        {member.user_id === user?.id && <span className="text-[10px] text-indigo-500/70 font-bold ml-1.5 uppercase bg-indigo-500/10 px-1 rounded">(you)</span>}
                                    </span>
                                </div>
                                {member.role !== 'member' && (
                                    <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md inline-block mt-1 tracking-wider ${member.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {member.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {onlineMembers.length === 0 && (
                        <div className="px-4 py-2 text-slate-500 text-sm font-medium">No one is online right now.</div>
                    )}
                </div>

                {/* Offline Members */}
                <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
                        Offline — {offlineMembers.length}
                    </h4>
                    {offlineMembers.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#0F172A]/50 transition-all group"
                            onClick={() => handleStartDM(member)}
                            title={member.user_id === user?.id ? 'You' : 'Click to DM'}
                        >
                            <div className="relative shrink-0 grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden shadow-sm">
                                    {member.user_profile_pic ? (
                                        <img src={member.user_profile_pic} alt={member.user_email} className="w-full h-full object-cover" />
                                    ) : (
                                        member.user_email?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>
                                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-slate-600 border-[3px] border-[#1E293B] rounded-full"></span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-medium text-[15px] text-slate-400 group-hover:text-slate-300 transition-colors truncate tracking-tight">
                                        {member.user_email?.split('@')[0] || 'User'}
                                        {member.user_id === user?.id && <span className="text-[10px] text-slate-500 font-bold ml-1.5 uppercase bg-slate-800 px-1 rounded">(you)</span>}
                                    </span>
                                </div>
                                {member.role !== 'member' && (
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md inline-block mt-1 tracking-wider opacity-60 group-hover:opacity-100 ${member.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {member.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showLeaderboard && (
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
            )}
        </div>
    );
};

export default MemberSidebar;
