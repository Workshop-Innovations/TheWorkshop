import React, { useState, useRef, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import SharedNotes from './SharedNotes';
import PeerReview from './PeerReview';
import './ChatArea.css';

const ChatArea = () => {
    const {
        currentChannel,
        currentCommunity,
        messages,
        sendMessage,
        voteMessage,
        currentDM,
        dmMessages,
        sendDMMessage,
        viewMode,
        user,
        createReply,
        getThread
    } = useCommunity();

    const [inputValue, setInputValue] = useState('');
    const [replyInputValue, setReplyInputValue] = useState('');
    const [activeThread, setActiveThread] = useState(null);
    const [threadData, setThreadData] = useState(null);
    const [loadingThread, setLoadingThread] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showReviews, setShowReviews] = useState(false);
    const messagesEndRef = useRef(null);
    const threadEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, dmMessages]);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [threadData]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        if (viewMode === 'dms' && currentDM) {
            await sendDMMessage(inputValue);
        } else if (currentChannel) {
            await sendMessage(inputValue);
        }
        setInputValue('');
    };

    const handleVote = (messageId, currentVote, value) => {
        const newValue = currentVote === value ? 0 : value;
        voteMessage(messageId, newValue);
    };

    const handleOpenThread = async (msg) => {
        if (!currentChannel || !msg.id) return;
        setActiveThread(msg);
        setLoadingThread(true);
        const thread = await getThread(currentChannel.id, msg.id);
        setThreadData(thread);
        setLoadingThread(false);
    };

    const handleCloseThread = () => {
        setActiveThread(null);
        setThreadData(null);
        setReplyInputValue('');
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyInputValue.trim() || !currentChannel || !activeThread) return;

        const reply = await createReply(currentChannel.id, activeThread.id, replyInputValue);
        if (reply && threadData) {
            setThreadData({
                ...threadData,
                replies: [...threadData.replies, reply],
                total_replies: threadData.total_replies + 1
            });
        }
        setReplyInputValue('');
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today at ' + formatTime(timestamp);
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday at ' + formatTime(timestamp);
        }
        return date.toLocaleDateString() + ' ' + formatTime(timestamp);
    };

    // Render message component
    const renderMessage = (msg, index, isThread = false) => {
        const isOwn = msg.user_id === user?.id;
        const score = msg.score || 0;
        const userVote = msg.user_vote || 0;
        const replyCount = msg.reply_count || 0;

        return (
            <div key={msg.id || index} className={`message ${isOwn ? 'own' : ''}`}>
                <div className="message-avatar">
                    {msg.user_email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="message-content-wrapper">
                    <div className="message-header">
                        <span className="message-author">
                            {msg.user_email?.split('@')[0] || 'User'}
                        </span>
                        <span className="message-time">
                            {formatDate(msg.timestamp)}
                        </span>
                    </div>
                    <div className="message-content">{msg.content}</div>
                    <div className="message-actions">
                        <button
                            className={`vote-btn ${userVote === 1 ? 'active upvote' : ''}`}
                            onClick={() => handleVote(msg.id, userVote, 1)}
                        >
                            ▲
                        </button>
                        <span className="vote-score">{score}</span>
                        <button
                            className={`vote-btn ${userVote === -1 ? 'active downvote' : ''}`}
                            onClick={() => handleVote(msg.id, userVote, -1)}
                        >
                            ▼
                        </button>
                        {!isThread && !msg.parent_id && (
                            <button
                                className="reply-btn"
                                onClick={() => handleOpenThread(msg)}
                            >
                                💬 {replyCount > 0 ? replyCount : 'Reply'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // DM View
    if (viewMode === 'dms') {
        if (!currentDM) {
            return (
                <div className="chat-area">
                    <div className="chat-placeholder">
                        <div className="placeholder-icon">💬</div>
                        <h2>Select a conversation</h2>
                        <p>Choose a friend from the sidebar to start chatting</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="chat-area">
                <div className="chat-header">
                    <span className="dm-header-avatar">
                        {currentDM.other_user_email?.charAt(0).toUpperCase() || '?'}
                    </span>
                    <h2>@{currentDM.other_user_email?.split('@')[0] || 'User'}</h2>
                </div>

                <div className="messages-container">
                    {dmMessages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id || index} className={`message ${isOwn ? 'own' : ''}`}>
                                <div className="message-avatar">
                                    {msg.sender_email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="message-content-wrapper">
                                    <div className="message-header">
                                        <span className="message-author">
                                            {msg.sender_email?.split('@')[0] || 'User'}
                                        </span>
                                        <span className="message-time">
                                            {formatDate(msg.timestamp)}
                                        </span>
                                    </div>
                                    <div className="message-content">{msg.content}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form className="message-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder={`Message @${currentDM.other_user_email?.split('@')[0] || 'User'}`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button type="submit">Send</button>
                </form>
            </div>
        );
    }

    // Community View
    if (!currentChannel) {
        return (
            <div className="chat-area">
                <div className="chat-placeholder">
                    <div className="placeholder-icon">#</div>
                    <h2>Select a channel</h2>
                    <p>Choose a channel from the sidebar to start chatting</p>
                </div>
            </div>
        );
    }

    // Filter out replies from main message list (show only parent messages)
    const parentMessages = messages.filter(msg => !msg.parent_id);

    return (
        <div className={`chat-area ${activeThread ? 'with-thread' : ''}`}>
            <div className="chat-main">
                <div className="chat-header">
                    <span className="channel-hash-header">#</span>
                    <div className="channel-header-info">
                        <h2>{currentChannel.name}</h2>
                        {currentChannel.description && (
                            <span className="channel-description">{currentChannel.description}</span>
                        )}
                    </div>
                    <div className="header-actions">
                        <button
                            className="notes-toggle-btn"
                            onClick={() => setShowReviews(true)}
                            title="Peer Reviews"
                        >
                            📋 Reviews
                        </button>
                        <button
                            className="notes-toggle-btn"
                            onClick={() => setShowNotes(true)}
                            title="Shared Notes"
                        >
                            📝 Notes
                        </button>
                    </div>
                </div>

                <div className="messages-container">
                    {parentMessages.map((msg, index) => renderMessage(msg, index))}
                    <div ref={messagesEndRef} />
                </div>

                <form className="message-input" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder={`Message #${currentChannel.name}`}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button type="submit">Send</button>
                </form>
            </div>

            {/* Thread Panel */}
            {activeThread && (
                <div className="thread-panel">
                    <div className="thread-header">
                        <h3>Thread</h3>
                        <button className="close-thread-btn" onClick={handleCloseThread}>×</button>
                    </div>

                    <div className="thread-messages">
                        {loadingThread ? (
                            <div className="thread-loading">Loading thread...</div>
                        ) : threadData ? (
                            <>
                                {/* Parent message */}
                                <div className="thread-parent">
                                    {renderMessage(threadData.parent, 0, true)}
                                </div>

                                {/* Replies */}
                                <div className="thread-replies-divider">
                                    <span>{threadData.total_replies} {threadData.total_replies === 1 ? 'reply' : 'replies'}</span>
                                </div>

                                {threadData.replies.map((reply, index) => (
                                    <div key={reply.id} className="thread-reply">
                                        {renderMessage(reply, index, true)}
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </>
                        ) : null}
                    </div>

                    <form className="thread-input" onSubmit={handleSendReply}>
                        <input
                            type="text"
                            placeholder="Reply to thread..."
                            value={replyInputValue}
                            onChange={(e) => setReplyInputValue(e.target.value)}
                        />
                        <button type="submit">Reply</button>
                    </form>
                </div>
            )}

            {/* Shared Notes Modal */}
            {showNotes && <SharedNotes onClose={() => setShowNotes(false)} />}

            {/* Peer Reviews Modal */}
            {showReviews && <PeerReview onClose={() => setShowReviews(false)} />}
        </div>
    );
};

export default ChatArea;
