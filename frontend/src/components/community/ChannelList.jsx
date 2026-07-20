import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import StudyGroups from './StudyGroups';
import FindFriendsModal from './FindFriendsModal';

const ChannelList = () => {
    const {
        currentCommunity,
        channels,
        currentChannel,
        setCurrentChannel,
        createChannel,
        dmConversations,
        currentDM,
        setCurrentDM,
        viewMode,
        setViewMode,
        unreadChannels,
        unreadDMs,
        markChannelAsRead,
        user,
    } = useCommunity();

    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [channelSearch, setChannelSearch] = useState('');
    const [showStudyGroups, setShowStudyGroups] = useState(false);
    const [showFindFriends, setShowFindFriends] = useState(false);

    const handleCreateChannel = async () => {
        if (!newChannelName.trim() || !currentCommunity) return;
        await createChannel(currentCommunity.id, newChannelName);
        setNewChannelName('');
        setShowCreateChannel(false);
    };

    const handleChannelClick = (channel) => {
        setCurrentChannel(channel);
        setViewMode('community');
        markChannelAsRead(channel.id);
    };

    const handleDMClick = (dm) => {
        setCurrentDM(dm);
        setViewMode('dms');
    };

    // Split channels
    const publicChannels = useMemo(() => {
        const safe = Array.isArray(channels) ? channels : [];
        const filtered = channelSearch
            ? safe.filter(ch => ch.name.toLowerCase().includes(channelSearch.toLowerCase()))
            : safe;
        return filtered.filter(ch => !ch.study_group_id);
    }, [channels, channelSearch]);

    const groupChannels = useMemo(() => {
        const safe = Array.isArray(channels) ? channels : [];
        const filtered = channelSearch
            ? safe.filter(ch => ch.name.toLowerCase().includes(channelSearch.toLowerCase()))
            : safe;
        return filtered.filter(ch => ch.study_group_id);
    }, [channels, channelSearch]);

    if (!currentCommunity) return null;

    return (
        <div className="flex flex-col h-full bg-[#1E293B]">
            {/* Header */}
            <div className="h-16 flex items-center px-5 border-b border-slate-700/50 shrink-0 bg-[#0F172A]/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        {currentCommunity.icon || '🛠️'}
                    </div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight truncate">
                        {currentCommunity.name}
                    </h3>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2 bg-[#0F172A] rounded-xl px-3 py-2 border border-slate-700/50 shadow-inner">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input
                        type="text"
                        className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                        placeholder="Search channels..."
                        value={channelSearch}
                        onChange={e => setChannelSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Unified Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-6 pb-4">
                
                {/* Channels Section */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1 mb-2 group">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Channels
                        </span>
                        <button
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-all p-1 rounded-md hover:bg-slate-700/50"
                            onClick={() => setShowCreateChannel(!showCreateChannel)}
                            title="Create Channel"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </button>
                    </div>

                    {showCreateChannel && (
                        <div className="mb-3 p-2 bg-[#0F172A]/50 rounded-xl border border-slate-700/50">
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-[#1E293B] border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                                placeholder="new-channel"
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleCreateChannel();
                                    if (e.key === 'Escape') setShowCreateChannel(false);
                                }}
                                autoFocus
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleCreateChannel} className="flex-1 py-1.5 bg-indigo-600/90 text-white text-xs font-bold rounded-md hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20">Create</button>
                                <button onClick={() => setShowCreateChannel(false)} className="flex-1 py-1.5 bg-slate-700 text-slate-300 text-xs font-bold rounded-md hover:bg-slate-600 transition-colors">Cancel</button>
                            </div>
                        </div>
                    )}

                    {publicChannels.map((channel) => {
                        const isActive = viewMode === 'community' && currentChannel?.id === channel.id;
                        const hasUnread = unreadChannels.has(channel.id);
                        return (
                            <div
                                key={channel.id}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group ${
                                    isActive
                                        ? 'bg-indigo-500/10 text-indigo-100 font-semibold'
                                        : hasUnread
                                            ? 'text-white hover:bg-slate-800/50 font-semibold'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                                onClick={() => handleChannelClick(channel)}
                            >
                                <span className={`text-lg opacity-50 shrink-0 ${isActive ? 'text-indigo-400 opacity-100' : hasUnread ? 'text-slate-300' : 'text-slate-500'}`}>#</span>
                                <span className="text-[15px] truncate flex-1">{channel.name}</span>
                                {hasUnread && !isActive && (
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Study Groups Section */}
                {groupChannels.length > 0 && (
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-1 mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Study Groups
                            </span>
                        </div>
                        {groupChannels.map((channel) => {
                            const isActive = viewMode === 'community' && currentChannel?.id === channel.id;
                            const hasUnread = unreadChannels.has(channel.id);
                            return (
                                <div
                                    key={channel.id}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                        isActive
                                            ? 'bg-indigo-500/10 text-indigo-100 font-semibold'
                                            : hasUnread
                                                ? 'text-white hover:bg-slate-800/50 font-semibold'
                                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                    }`}
                                    onClick={() => handleChannelClick(channel)}
                                >
                                    <span className={`text-sm shrink-0 ${isActive ? 'opacity-100' : 'opacity-50'}`}>🔒</span>
                                    <span className="text-[15px] truncate flex-1">{channel.name}</span>
                                    {hasUnread && !isActive && (
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Direct Messages Section */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-1 mb-2 group">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Direct Messages
                        </span>
                        <button
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-all p-1 rounded-md hover:bg-slate-700/50"
                            onClick={() => setShowFindFriends(true)}
                            title="Find Friends"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </button>
                    </div>

                    {dmConversations.map((dm) => {
                        const isActive = viewMode === 'dms' && currentDM?.id === dm.id;
                        const hasUnread = unreadDMs.has(dm.id);
                        return (
                            <div
                                key={dm.id}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all group ${
                                    isActive 
                                        ? 'bg-indigo-500/10 text-indigo-100' 
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                                onClick={() => handleDMClick(dm)}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-[#0F172A] border border-slate-700 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                                        {dm.other_user_profile_pic ? (
                                            <img src={dm.other_user_profile_pic} alt={dm.other_user_email} className="w-full h-full object-cover" />
                                        ) : (
                                            dm.other_user_email?.charAt(0).toUpperCase() || '?'
                                        )}
                                    </div>
                                    {hasUnread && (
                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full border-2 border-[#1E293B] shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className={`block text-[15px] truncate ${hasUnread ? 'font-bold text-white' : isActive ? 'font-semibold' : 'font-medium'}`}>
                                        {dm.other_user_email?.split('@')[0] || 'User'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {dmConversations.length === 0 && (
                        <div className="px-2 py-3">
                            <button
                                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-700 border-dashed"
                                onClick={() => setShowFindFriends(true)}
                            >
                                <span className="text-lg leading-none">+</span> Find Friends
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-[#0F172A]/40 border-t border-slate-700/50 backdrop-blur-md">
                <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 transition-colors text-sm font-bold border border-indigo-500/20"
                    onClick={() => setShowStudyGroups(true)}
                >
                    <span className="text-base">📚</span>
                    Browse Study Groups
                </button>
            </div>

            {showStudyGroups && (
                <StudyGroups onClose={() => setShowStudyGroups(false)} />
            )}
            {showFindFriends && (
                <FindFriendsModal onClose={() => setShowFindFriends(false)} />
            )}
        </div>
    );
};

export default ChannelList;
