import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import StudyGroups from './StudyGroups';
import {
    FaHashtag,
    FaChevronDown,
    FaPlus,
    FaUserFriends,
    FaCompass
} from 'react-icons/fa';
import { HiUserGroup } from "react-icons/hi";

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
        viewMode
    } = useCommunity();

    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [showStudyGroups, setShowStudyGroups] = useState(false);

    const handleCreateChannel = async () => {
        if (!newChannelName.trim() || !currentCommunity) return;
        await createChannel(currentCommunity.id, newChannelName);
        setNewChannelName('');
        setShowCreateChannel(false);
    };

    // DM View
    if (viewMode === 'dms') {
        return (
            <div className="flex flex-col h-full bg-slate-50">
                {/* DM Header */}
                <div className="h-12 flex items-center px-4 border-b border-slate-200 shrink-0 shadow-sm">
                    <h3 className="font-bold text-slate-700 text-sm">Direct Messages</h3>
                </div>

                {/* DM Actions */}
                <div className="p-3">
                    <button className="w-full py-2 px-3 bg-slate-200/60 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors">
                        Find Friends
                    </button>
                </div>

                {/* DM List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-0.5">
                    {dmConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 px-4">
                            <FaUserFriends className="text-3xl text-slate-300 mb-3" />
                            <p className="text-sm font-medium text-slate-500">No conversations yet</p>
                            <span className="text-xs text-slate-400 mt-1">Click on a member in any server to start a DM</span>
                        </div>
                    ) : (
                        dmConversations.map((dm) => (
                            <div
                                key={dm.id}
                                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-colors ${currentDM?.id === dm.id ? 'bg-slate-200/80 text-slate-900' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-800'}`}
                                onClick={() => setCurrentDM(dm)}
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                    {dm.other_user_email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium truncate">
                                        {dm.other_user_email?.split('@')[0] || 'User'}
                                    </span>
                                    {dm.last_message && (
                                        <span className="block text-xs text-slate-400 truncate">{dm.last_message}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // No community selected
    if (!currentCommunity) {
        return (
            <div className="flex flex-col h-full bg-slate-50">
                <div className="h-12 flex items-center justify-center px-4 border-b border-slate-200 shrink-0">
                    <h3 className="font-bold text-slate-700 text-sm">Select a Server</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                    <FaCompass className="text-3xl text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-500">Welcome!</p>
                    <span className="text-xs text-slate-400 mt-1">Select or create a server to get started</span>
                </div>
            </div>
        );
    }

    // Get channels from backend
    const safeChannels = Array.isArray(channels) ? channels : [];

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Server Header */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-slate-200 shrink-0 shadow-sm cursor-pointer hover:bg-slate-100/70 transition-colors">
                <h3 className="font-bold text-slate-800 text-sm truncate">{currentCommunity.name}</h3>
                <FaChevronDown className="text-slate-400 text-[10px] shrink-0" />
            </div>

            {/* Channels & Roles Bar */}
            <div className="px-2 pt-3 pb-1">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer transition-colors text-slate-500 hover:text-slate-700">
                    <HiUserGroup className="text-base" />
                    <span className="text-xs font-semibold">Channels & Roles</span>
                </div>
            </div>

            {/* Channel List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-4">
                {/* All channels grouped into a single section */}
                <div>
                    <div className="flex items-center justify-between px-2 pt-2 pb-1 group">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Channels — {safeChannels.length}
                        </span>
                        <button
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-all p-0.5 rounded hover:bg-slate-200"
                            onClick={() => setShowCreateChannel(!showCreateChannel)}
                            title="Create Channel"
                        >
                            <FaPlus size={10} />
                        </button>
                    </div>

                    {/* Create channel input */}
                    {showCreateChannel && (
                        <div className="px-2 pb-1">
                            <input
                                type="text"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                placeholder="new-channel-name"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateChannel()}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Channel items */}
                    <div className="space-y-0.5">
                        {safeChannels.map((channel) => (
                            <div
                                key={channel.id}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all group ${currentChannel?.id === channel.id
                                        ? 'bg-slate-200/80 text-slate-900 font-semibold'
                                        : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                                    }`}
                                onClick={() => setCurrentChannel(channel)}
                            >
                                <FaHashtag className="text-xs shrink-0 opacity-60" />
                                <span className="text-sm truncate">{channel.name}</span>
                            </div>
                        ))}
                    </div>

                    {safeChannels.length === 0 && (
                        <div className="px-2 py-4 text-center">
                            <p className="text-xs text-slate-400">No channels yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Study Groups */}
            <div className="p-2 border-t border-slate-200 shrink-0">
                <button
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-200/50 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-colors text-sm font-medium"
                    onClick={() => setShowStudyGroups(true)}
                >
                    <span>📚</span>
                    <span>Study Groups</span>
                </button>
            </div>

            {showStudyGroups && (
                <StudyGroups onClose={() => setShowStudyGroups(false)} />
            )}
        </div>
    );
};

export default ChannelList;
