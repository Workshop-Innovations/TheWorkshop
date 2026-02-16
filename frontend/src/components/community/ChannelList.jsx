import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import StudyGroups from './StudyGroups';
import {
    FaHashtag,
    FaVolumeUp,
    FaChevronDown,
    FaChevronRight,
    FaPlus,
    FaUserFriends,
    FaCompass
} from 'react-icons/fa';
import { HiUserGroup } from "react-icons/hi";

// Default channels with React Icons
const DEFAULT_CHANNEL_CATEGORIES = [
    {
        name: "INFORMATION",
        collapsed: false,
        channels: [
            { id: 'default-welcome', name: 'welcome', icon: <FaHashtag />, isDefault: true },
            { id: 'default-rules', name: 'rules-and-guidelines', icon: <FaHashtag />, isDefault: true },
            { id: 'default-announcements', name: 'announcements', icon: <FaVolumeUp />, isDefault: true }, // Using generic icon for announcements
        ]
    },
    {
        name: "GENERAL",
        collapsed: false,
        channels: [
            { id: 'default-general', name: 'general', icon: <FaHashtag />, isDefault: true },
            { id: 'default-introductions', name: 'introductions', icon: <FaHashtag />, isDefault: true },
            { id: 'default-offtopic', name: 'off-topic', icon: <FaHashtag />, isDefault: true },
            { id: 'default-wins', name: 'wins-and-celebrations', icon: <FaHashtag />, isDefault: true },
        ]
    },
    {
        name: "SUBJECT STUDY",
        collapsed: false,
        channels: [
            { id: 'default-math', name: 'mathematics', icon: <FaHashtag />, isDefault: true },
            { id: 'default-physics', name: 'physics', icon: <FaHashtag />, isDefault: true },
            { id: 'default-chemistry', name: 'chemistry', icon: <FaHashtag />, isDefault: true },
            { id: 'default-biology', name: 'biology', icon: <FaHashtag />, isDefault: true },
            { id: 'default-english', name: 'english', icon: <FaHashtag />, isDefault: true },
            { id: 'default-history', name: 'history', icon: <FaHashtag />, isDefault: true },
        ]
    },
    {
        name: "HELP & SUPPORT",
        collapsed: false,
        channels: [
            { id: 'default-homework', name: 'homework-help', icon: <FaHashtag />, isDefault: true },
            { id: 'default-exam', name: 'exam-prep', icon: <FaHashtag />, isDefault: true },
            { id: 'default-resources', name: 'resource-sharing', icon: <FaHashtag />, isDefault: true },
        ]
    }
];

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
    const [collapsedCategories, setCollapsedCategories] = useState({});

    const handleCreateChannel = async () => {
        if (!newChannelName.trim() || !currentCommunity) return;
        await createChannel(currentCommunity.id, newChannelName);
        setNewChannelName('');
        setShowCreateChannel(false);
    };

    const toggleCategory = (categoryName) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const handleChannelClick = (channel) => {
        if (channel.isDefault) {
            setCurrentChannel({
                id: channel.id,
                name: channel.name,
                description: `Welcome to #${channel.name}`,
                channel_type: 'text',
                isDefault: true
            });
        } else {
            setCurrentChannel(channel);
        }
    };

    // DM View
    if (viewMode === 'dms') {
        return (
            <div className="channel-list">
                <div className="channel-header">
                    <h3>Direct Messages</h3>
                </div>
                <div className="channels-container">
                    <div className="dm-actions">
                        <button className="find-friends-btn">Find Friends</button>
                    </div>
                    {dmConversations.length === 0 ? (
                        <div className="empty-dm-state">
                            <span className="empty-icon"><FaUserFriends /></span>
                            <p>No conversations yet</p>
                            <span className="empty-hint">Click on a member in any server to start a DM</span>
                        </div>
                    ) : (
                        dmConversations.map((dm) => (
                            <div
                                key={dm.id}
                                className={`channel-item dm-item ${currentDM?.id === dm.id ? 'active' : ''}`}
                                onClick={() => setCurrentDM(dm)}
                            >
                                <div className="dm-avatar">
                                    {dm.other_user_email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="dm-info">
                                    <span className="dm-name">
                                        {dm.other_user_email?.split('@')[0] || 'User'}
                                    </span>
                                    {dm.last_message && (
                                        <span className="dm-preview">{dm.last_message}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Community View - If detailed view
    if (!currentCommunity) {
        return (
            <div className="channel-list">
                <div className="channel-header center">
                    <h3>Select a Server</h3>
                </div>
                <div className="channels-container empty">
                    <div className="empty-dm-state">
                        <span className="empty-icon"><FaCompass /></span>
                        <p>Welcome!</p>
                        <span className="empty-hint">Select or create a server to get started</span>
                    </div>
                </div>
            </div>
        );
    }

    // Get user-created channels (from backend)
    const safeChannels = Array.isArray(channels) ? channels : [];
    const userChannels = safeChannels.filter(ch => ch.channel_type === 'text');

    return (
        <div className="channel-list">
            {/* Server Header */}
            <div className="server-header">
                <h3 className="server-name">{currentCommunity.name}</h3>
                <FaChevronDown className="server-header-icon" />
            </div>

            {/* Channels & Roles Item (Visual) */}
            <div className="channel-actions-bar">
                <div className="menu-item">
                    <HiUserGroup className="menu-icon" />
                    <span>Channels & Roles</span>
                </div>
            </div>

            <div className="channels-scroll-area">
                {/* Default Channel Categories */}
                {DEFAULT_CHANNEL_CATEGORIES.map((category) => (
                    <div key={category.name} className="channel-category-group">
                        <div
                            className="category-header"
                            onClick={() => toggleCategory(category.name)}
                        >
                            <span className={`category-chevron ${collapsedCategories[category.name] ? 'collapsed' : ''}`}>
                                <FaChevronDown size={10} />
                            </span>
                            <span className="category-label">{category.name}</span>
                        </div>

                        {!collapsedCategories[category.name] && (
                            <div className="category-channels-list">
                                {category.channels.map((channel) => (
                                    <div
                                        key={channel.id}
                                        className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
                                        onClick={() => handleChannelClick(channel)}
                                    >
                                        <span className="channel-icon-wrapper">
                                            {channel.icon}
                                        </span>
                                        <span className="channel-name-text">{channel.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* User-created channels */}
                <div className="channel-category-group">
                    <div
                        className="category-header"
                        onClick={() => toggleCategory('user-channels')}
                    >
                        <span className={`category-chevron ${collapsedCategories['user-channels'] ? 'collapsed' : ''}`}>
                            <FaChevronDown size={10} />
                        </span>
                        <span className="category-label">CUSTOM CHANNELS</span>
                        <button
                            className="add-channel-btn-icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCreateChannel(!showCreateChannel);
                            }}
                            title="Create Channel"
                        >
                            <FaPlus size={10} />
                        </button>
                    </div>

                    {!collapsedCategories['user-channels'] && (
                        <div className="category-channels-list">
                            {showCreateChannel && (
                                <div className="create-channel-input-wrapper">
                                    <input
                                        type="text"
                                        className="new-channel-input"
                                        placeholder="new-channel"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleCreateChannel()}
                                        autoFocus
                                    />
                                </div>
                            )}
                            {userChannels.map((channel) => (
                                <div
                                    key={channel.id}
                                    className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
                                    onClick={() => setCurrentChannel(channel)}
                                >
                                    <span className="channel-icon-wrapper">
                                        <FaHashtag />
                                    </span>
                                    <span className="channel-name-text">{channel.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Actions (Study Groups) */}
            <div className="sidebar-footer">
                <button
                    className="sidebar-footer-btn"
                    onClick={() => setShowStudyGroups(true)}
                >
                    <span className="icon">📚</span>
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
