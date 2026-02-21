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
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
            {/* Leaderboard Button */}
            <div className="p-4 border-b border-slate-200">
                <button
                    className="w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    onClick={() => setShowLeaderboard(true)}
                >
                    <span>🏆</span> Leaderboard
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                        Online — {onlineMembers.length}
                    </h4>
                    {onlineMembers.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200/50 transition-colors group"
                            onClick={() => handleStartDM(member)}
                            title={member.user_id === user?.id ? 'You' : 'Click to DM'}
                        >
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
                                    {member.user_email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-50 rounded-full"></span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium text-sm truncate ${member.user_id === user?.id ? 'text-slate-900' : 'text-slate-700'}`}>
                                        {member.user_email?.split('@')[0] || 'User'}
                                        {member.user_id === user?.id && <span className="text-xs text-slate-400 font-normal ml-1">(you)</span>}
                                    </span>
                                </div>
                                {member.role !== 'member' && (
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${member.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {member.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                        Offline — {offlineMembers.length}
                    </h4>
                    {offlineMembers.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200/50 transition-colors group opacity-70 hover:opacity-100"
                            onClick={() => handleStartDM(member)}
                            title={member.user_id === user?.id ? 'You' : 'Click to DM'}
                        >
                            <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs grayscale">
                                    {member.user_email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-400 border-2 border-slate-50 rounded-full"></span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm text-slate-600 truncate">
                                        {member.user_email?.split('@')[0] || 'User'}
                                        {member.user_id === user?.id && <span className="text-xs text-slate-400 font-normal ml-1">(you)</span>}
                                    </span>
                                </div>
                                {member.role !== 'member' && (
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${member.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
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
