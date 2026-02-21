import React, { useState, useRef, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import SharedNotes from './SharedNotes';
import PeerReview from './PeerReview';


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
            <div key={msg.id || index} className={`flex gap-3 group px-2 py-1 rounded-lg transition-colors hover:bg-slate-50/50 ${isOwn ? '' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 shadow-sm border border-white">
                    {msg.user_email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-slate-800 text-sm hover:underline cursor-pointer">
                            {msg.user_email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(msg.timestamp)}
                        </span>
                    </div>
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                    </div>

                    {/* Message Actions / Footer */}
                    <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Voting */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                            <button
                                className={`p-1 rounded hover:bg-slate-200 transition-colors ${userVote === 1 ? 'text-primary' : 'text-slate-400'}`}
                                onClick={() => handleVote(msg.id, userVote, 1)}
                                title="Upvote"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M12 4l-8 8h6v8h4v-8h6z" />
                                </svg>
                            </button>
                            <span className={`text-xs font-bold px-1 min-w-[20px] text-center ${userVote !== 0 ? 'text-primary' : 'text-slate-500'}`}>
                                {score}
                            </span>
                            <button
                                className={`p-1 rounded hover:bg-slate-200 transition-colors ${userVote === -1 ? 'text-red-500' : 'text-slate-400'}`}
                                onClick={() => handleVote(msg.id, userVote, -1)}
                                title="Downvote"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M12 20l8-8h-6v-8h-4v8h-6z" />
                                </svg>
                            </button>
                        </div>

                        {!isThread && !msg.parent_id && (
                            <button
                                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-primary transition-colors hover:bg-slate-100 px-2 py-1 rounded"
                                onClick={() => handleOpenThread(msg)}
                            >
                                <span>💬</span>
                                <span>{replyCount > 0 ? `${replyCount} Replies` : 'Reply'}</span>
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
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 h-full p-6 text-center">
                    <div className="text-6xl mb-4 opacity-50">💬</div>
                    <h2 className="text-xl font-bold text-slate-700 mb-2">Select a conversation</h2>
                    <p className="text-slate-500">Choose a friend from the sidebar to start chatting</p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">
                <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0 bg-white z-10">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm mr-3">
                        {currentDM.other_user_email?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <h2 className="font-bold text-slate-800 text-lg truncate flex-1">
                        @{currentDM.other_user_email?.split('@')[0] || 'User'}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 custom-scrollbar">
                    {dmMessages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id || index} className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 self-start mt-1">
                                    {msg.sender_email?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1 px-1">
                                        <span className="font-bold text-xs text-slate-700">
                                            {msg.sender_email?.split('@')[0] || 'User'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {formatDate(msg.timestamp)}
                                        </span>
                                    </div>
                                    <div className={`py-2 px-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isOwn ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                    <form
                        className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-primary/50 focus-within:bg-white transition-all shadow-inner"
                        onSubmit={handleSend}
                    >
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 py-2"
                            placeholder={`Message @${currentDM.other_user_email?.split('@')[0] || 'User'}`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!inputValue.trim()}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Community View
    if (!currentChannel) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 h-full p-6 text-center">
                <div className="text-6xl mb-4 opacity-50">#</div>
                <h2 className="text-xl font-bold text-slate-700 mb-2">Select a channel</h2>
                <p className="text-slate-500">Choose a channel from the sidebar to start chatting</p>
            </div>
        );
    }

    // Filter out replies from main message list (show only parent messages)
    const parentMessages = messages.filter(msg => !msg.parent_id);

    return (
        <div className="flex-1 flex h-full relative overflow-hidden min-w-0">
            <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 shrink-0 bg-white z-10 shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-2xl text-slate-400 font-light">#</span>
                        <div className="flex flex-col min-w-0">
                            <h2 className="font-bold text-slate-800 text-lg truncate">{currentChannel.name}</h2>
                            {currentChannel.description && (
                                <span className="text-xs text-slate-500 truncate max-w-md">{currentChannel.description}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold"
                            onClick={() => setShowReviews(true)}
                            title="Peer Reviews"
                        >
                            <span className="text-base">📋</span> <span className="hidden sm:inline">Reviews</span>
                        </button>
                        <button
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold"
                            onClick={() => setShowNotes(true)}
                            title="Shared Notes"
                        >
                            <span className="text-base">📝</span> <span className="hidden sm:inline">Notes</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-1 custom-scrollbar">
                    {parentMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <span className="text-3xl text-slate-300 font-light">#</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-1">Welcome to #{currentChannel.name}</h3>
                            <p className="text-slate-400 text-sm max-w-sm">
                                {currentChannel.description || 'This is the beginning of the conversation. Send a message to get started!'}
                            </p>
                        </div>
                    ) : (
                        parentMessages.map((msg, index) => renderMessage(msg, index))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                    <form
                        className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-1 border border-slate-200 focus-within:border-primary/50 focus-within:bg-white focus-within:shadow-sm transition-all"
                        onSubmit={handleSend}
                    >
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 py-2.5 text-sm"
                            placeholder={`Message #${currentChannel.name}`}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="p-2 text-slate-400 rounded-lg hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                            disabled={!inputValue.trim()}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Thread Panel */}
            {activeThread && (
                <div className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col h-full shadow-xl absolute right-0 top-0 z-30 sm:relative sm:shadow-none animate-in slide-in-from-right duration-200">
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 bg-slate-50 shrink-0">
                        <h3 className="font-bold text-slate-700">Thread</h3>
                        <button
                            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                            onClick={handleCloseThread}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                        {loadingThread ? (
                            <div className="flex items-center justify-center h-20 text-slate-400 text-sm">Loading thread...</div>
                        ) : threadData ? (
                            <>
                                {/* Parent message */}
                                <div className="pb-4 border-b border-slate-200 mb-4">
                                    {renderMessage(threadData.parent, 0, true)}
                                </div>

                                {/* Replies */}
                                <div className="flex items-center gap-4 py-2 mb-2">
                                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{threadData.total_replies} {threadData.total_replies === 1 ? 'reply' : 'replies'}</span>
                                    <div className="h-[1px] bg-slate-200 flex-1"></div>
                                </div>

                                {threadData.replies.map((reply, index) => (
                                    <div key={reply.id} className="pl-4 border-l-2 border-slate-200">
                                        {renderMessage(reply, index, true)}
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </>
                        ) : null}
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                        <form className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" onSubmit={handleSendReply}>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm focus:outline-none placeholder-slate-400"
                                placeholder="Reply to thread..."
                                value={replyInputValue}
                                onChange={(e) => setReplyInputValue(e.target.value)}
                            />
                            <div className="bg-slate-50 px-2 py-1 flex justify-end border-t border-slate-100">
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!replyInputValue.trim()}
                                >
                                    Reply
                                </button>
                            </div>
                        </form>
                    </div>
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
