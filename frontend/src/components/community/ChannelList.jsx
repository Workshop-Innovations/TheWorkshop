import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import StudyGroups from './StudyGroups';


// Default channels that always appear (frontend-only display, merged with backend channels)
const DEFAULT_CHANNEL_CATEGORIES = [
    {
        name: "📢 INFORMATION",
        collapsed: false,
        channels: [
            { id: 'default-welcome', name: 'welcome', icon: '👋', isDefault: true },
            { id: 'default-rules', name: 'rules-and-guidelines', icon: '📜', isDefault: true },
            { id: 'default-announcements', name: 'announcements', icon: '📣', isDefault: true },
        ]
    },
    {
        name: "💬 GENERAL",
        collapsed: false,
        channels: [
            { id: 'default-general', name: 'general', icon: '#', isDefault: true },
            { id: 'default-introductions', name: 'introductions', icon: '🙋', isDefault: true },
            { id: 'default-offtopic', name: 'off-topic', icon: '🎲', isDefault: true },
            { id: 'default-wins', name: 'wins-and-celebrations', icon: '🎉', isDefault: true },
        ]
    },
    {
        name: "📚 SUBJECT STUDY",
        collapsed: false,
        channels: [
            { id: 'default-math', name: 'mathematics', icon: '🔢', isDefault: true },
            { id: 'default-physics', name: 'physics', icon: '⚛️', isDefault: true },
            { id: 'default-chemistry', name: 'chemistry', icon: '🧪', isDefault: true },
            { id: 'default-biology', name: 'biology', icon: '🧬', isDefault: true },
            { id: 'default-english', name: 'english', icon: '📖', isDefault: true },
            { id: 'default-history', name: 'history', icon: '🏛️', isDefault: true },
        ]
    },
    {
        name: "❓ HELP & SUPPORT",
        collapsed: false,
        channels: [
            { id: 'default-homework', name: 'homework-help', icon: '📝', isDefault: true },
            { id: 'default-exam', name: 'exam-prep', icon: '📋', isDefault: true },
            { id: 'default-resources', name: 'resource-sharing', icon: '📂', isDefault: true },
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
        // For default channels, we create a pseudo-channel object
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
                            <span className="empty-icon">💬</span>
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

    // Community View
    if (!currentCommunity) {
        return (
            <div className="channel-list">
                <div className="channel-header">
                    <h3>Select a Server</h3>
                </div>
                <div className="channels-container">
                    <div className="empty-dm-state">
                        <span className="empty-icon">🏠</span>
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
            <div className="channel-header">
                <h3>{currentCommunity.name}</h3>
                <span className="invite-code" title="Invite Code">
                    Code: {currentCommunity.join_code}
                </span>
            </div>

            <div className="channel-actions">
                <button
                    className="action-btn study-groups-btn"
                    onClick={() => setShowStudyGroups(true)}
                >
                    📚 Study Groups
                </button>
            </div>

            <div className="channels-container">
                {/* Default Channel Categories */}
                {DEFAULT_CHANNEL_CATEGORIES.map((category) => (
                    <div key={category.name} className="category-section">
                        <div
                            className="channel-category"
                            onClick={() => toggleCategory(category.name)}
                        >
                            <span className={`category-arrow ${collapsedCategories[category.name] ? 'collapsed' : ''}`}>
                                ▼
                            </span>
                            <span className="category-name">{category.name}</span>
                        </div>

                        {!collapsedCategories[category.name] && (
                            <div className="category-channels">
                                {category.channels.map((channel) => (
                                    <div
                                        key={channel.id}
                                        className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
                                        onClick={() => handleChannelClick(channel)}
                                    >
                                        <span className="channel-icon">{channel.icon}</span>
                                        <span className="channel-name">{channel.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* User-created channels */}
                {userChannels.length > 0 && (
                    <div className="category-section">
                        <div
                            className="channel-category"
                            onClick={() => toggleCategory('user-channels')}
                        >
                            <span className={`category-arrow ${collapsedCategories['user-channels'] ? 'collapsed' : ''}`}>
                                ▼
                            </span>
                            <span className="category-name">📁 CUSTOM CHANNELS</span>
                            <button
                                className="add-channel-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCreateChannel(!showCreateChannel);
                                }}
                                title="Create Channel"
                            >
                                +
                            </button>
                        </div>

                        {!collapsedCategories['user-channels'] && (
                            <div className="category-channels">
                                {showCreateChannel && (
                                    <div className="create-channel-form">
                                        <input
                                            type="text"
                                            placeholder="channel-name"
                                            value={newChannelName}
                                            onChange={(e) => setNewChannelName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleCreateChannel()}
                                        />
                                        <button onClick={handleCreateChannel}>Create</button>
                                    </div>
                                )}
                                {userChannels.map((channel) => (
                                    <div
                                        key={channel.id}
                                        className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
                                        onClick={() => setCurrentChannel(channel)}
                                    >
                                        <span className="channel-hash">#</span>
                                        <span className="channel-name">{channel.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Add channel button if no user channels */}
                {userChannels.length === 0 && (
                    <div className="category-section">
                        <div className="channel-category">
                            <span className="category-arrow">▼</span>
                            <span className="category-name">📁 CUSTOM CHANNELS</span>
                            <button
                                className="add-channel-btn"
                                onClick={() => setShowCreateChannel(!showCreateChannel)}
                                title="Create Channel"
                            >
                                +
                            </button>
                        </div>
                        {showCreateChannel && (
                            <div className="category-channels">
                                <div className="create-channel-form">
                                    <input
                                        type="text"
                                        placeholder="channel-name"
                                        value={newChannelName}
                                        onChange={(e) => setNewChannelName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleCreateChannel()}
                                    />
                                    <button onClick={handleCreateChannel}>Create</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showStudyGroups && (
                <StudyGroups onClose={() => setShowStudyGroups(false)} />
            )}
        </div>
    );
};

export default ChannelList;
