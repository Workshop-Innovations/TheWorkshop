import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from '../context/CommunityContext';
import './CommunityPage.css';

const CommunityPage = () => {
    const {
        channels,
        currentChannel,
        setCurrentChannel,
        messages,
        sendMessage,
        voteMessage,
        onlineUsers,
        isConnected,
        user,
        loading,
        error
    } = useCommunity();

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            await sendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleVote = (messageId, currentVote, value) => {
        // If clicking the same vote, toggle it off (value 0)
        const newValue = currentVote === value ? 0 : value;
        voteMessage(messageId, newValue);
    };

    if (loading) return <div className="community-container loading">Loading community...</div>;
    if (error) return <div className="community-container error">Error: {error}</div>;

    return (
        <div className="community-container">
            <div className="channels-sidebar">
                <h3>Communities</h3>
                {channels.map(channel => (
                    <div
                        key={channel.id}
                        className={`channel-item ${currentChannel?.id === channel.id ? 'active' : ''}`}
                        onClick={() => setCurrentChannel(channel)}
                    >
                        r/{channel.name}
                    </div>
                ))}
            </div>

            <div className="chat-area">
                <div className="chat-header">
                    <div>
                        <h2>{currentChannel ? `r/${currentChannel.name}` : 'Select a community'}</h2>
                        {currentChannel?.description && <span className="channel-description">{currentChannel.description}</span>}
                    </div>
                    <div className="online-users">
                        {onlineUsers.length} online
                    </div>
                </div>

                <div className="messages-list">
                    {messages.map((msg, index) => {
                        const isOwn = msg.user_id === user?.id;
                        const score = msg.score || 0;
                        const userVote = msg.user_vote || 0; // 1, -1, or 0

                        return (
                            <div key={index} className="message-card">
                                <div className="vote-section">
                                    <button
                                        className={`vote-btn upvote ${userVote === 1 ? 'active' : ''}`}
                                        onClick={() => handleVote(msg.id, userVote, 1)}
                                    >
                                        ▲
                                    </button>
                                    <span className="vote-score">{score}</span>
                                    <button
                                        className={`vote-btn downvote ${userVote === -1 ? 'active' : ''}`}
                                        onClick={() => handleVote(msg.id, userVote, -1)}
                                    >
                                        ▼
                                    </button>
                                </div>
                                <div className="message-body">
                                    <div className="message-header">
                                        <span className="username">u/{msg.user_email ? msg.user_email.split('@')[0] : 'User'}</span>
                                        <span className="timestamp">
                                            • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="message-content">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form className="input-area" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder={`Message r/${currentChannel?.name || 'community'}`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={!currentChannel || !isConnected}
                    />
                    <button type="submit" disabled={!currentChannel || !isConnected}>
                        Post
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommunityPage;
