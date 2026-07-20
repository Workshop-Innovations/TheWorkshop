import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import SharedNotes from './SharedNotes';
import PeerReview from './PeerReview';

const COMMON_EMOJIS = ['😀','😂','🥲','😍','🤔','😮','🥳','😎','🤯','👍','👎','❤️','🔥','✅','⭐','💡','📚','🎉','🙏','💪','🤝','💬','📝','🏆','⚡','🎯','🚀','✨','💯','🤖'];

const ChatArea = () => {
    const {
        currentChannel,
        currentCommunity,
        messages,
        sendMessage,
        editMessage,
        deleteMessage,
        voteMessage,
        currentDM,
        dmMessages,
        sendDMMessage,
        viewMode,
        user,
        createReply,
        getThread,
        markChannelAsRead,
    } = useCommunity();

    const [inputValue, setInputValue] = useState('');
    const [replyInputValue, setReplyInputValue] = useState('');
    const [activeThread, setActiveThread] = useState(null);
    const [threadData, setThreadData] = useState(null);
    const [loadingThread, setLoadingThread] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showReviews, setShowReviews] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [sending, setSending] = useState(false);

    // Edit state
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Delete confirm
    const [deletingMessageId, setDeletingMessageId] = useState(null);

    // Hover state for action bar
    const [hoveredMessageId, setHoveredMessageId] = useState(null);

    const messagesEndRef = useRef(null);
    const threadEndRef = useRef(null);
    const inputRef = useRef(null);
    const editInputRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, dmMessages]);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [threadData]);

    // Auto-focus edit input
    useEffect(() => {
        if (editingMessageId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.selectionStart = editInputRef.current.value.length;
        }
    }, [editingMessageId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || sending) return;
        setSending(true);
        if (viewMode === 'dms' && currentDM) {
            await sendDMMessage(inputValue);
        } else if (currentChannel) {
            await sendMessage(inputValue);
        }
        setInputValue('');
        setSending(false);
        setShowEmojiPicker(false);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
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

    const handleStartEdit = (msg) => {
        setEditingMessageId(msg.id);
        setEditValue(msg.content);
        setHoveredMessageId(null);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditValue('');
    };

    const handleSaveEdit = async (messageId) => {
        if (!editValue.trim()) return;
        await editMessage(messageId, editValue);
        setEditingMessageId(null);
        setEditValue('');
    };

    const handleEditKeyDown = (e, messageId) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit(messageId);
        }
        if (e.key === 'Escape') handleCancelEdit();
    };

    const handleDeleteConfirm = async (messageId) => {
        await deleteMessage(messageId);
        setDeletingMessageId(null);
        if (activeThread?.id === messageId) handleCloseThread();
    };

    const handleEmojiSelect = (emoji) => {
        setInputValue(prev => prev + emoji);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return `Today at ${formatTime(timestamp)}`;
        if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${formatTime(timestamp)}`;
        return `${date.toLocaleDateString()} ${formatTime(timestamp)}`;
    };

    const shouldShowDateDivider = (messages, index) => {
        if (index === 0) return true;
        const prev = new Date(messages[index - 1].timestamp);
        const curr = new Date(messages[index].timestamp);
        return prev.toDateString() !== curr.toDateString();
    };

    const getDateLabel = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Render a single message
    const renderMessage = (msg, index, isThread = false, msgList = []) => {
        const isOwn = msg.user_id === user?.id;
        const score = msg.score || 0;
        const userVote = msg.user_vote || 0;
        const replyCount = msg.reply_count || 0;
        const isEditing = editingMessageId === msg.id;
        const isDeleting = deletingMessageId === msg.id;
        const isHovered = hoveredMessageId === msg.id;

        const showDivider = !isThread && msgList.length > 0 && shouldShowDateDivider(msgList, index);

        return (
            <React.Fragment key={msg.id || index}>
                {showDivider && (
                    <div className="flex items-center gap-4 my-6 px-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-[#0F172A] px-3 py-1 rounded-full border border-slate-800">
                            {getDateLabel(msg.timestamp)}
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent opacity-50"></div>
                    </div>
                )}

                <div
                    className={`flex gap-4 group px-6 py-2 transition-all duration-200 relative ${
                        isHovered ? 'bg-[#1E293B]/60' : 'hover:bg-[#1E293B]/40'
                    }`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg overflow-hidden mt-1 transform group-hover:scale-105 transition-transform">
                        {msg.user_profile_pic ? (
                            <img src={msg.user_profile_pic} alt={msg.user_email} className="w-full h-full object-cover" />
                        ) : (
                            msg.user_email?.charAt(0).toUpperCase() || '?'
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-baseline gap-3 mb-1">
                            <span className={`font-bold text-[15px] ${isOwn ? 'text-indigo-400' : 'text-slate-200'} hover:underline cursor-pointer tracking-tight`}>
                                {msg.user_email?.split('@')[0] || 'User'}
                                {isOwn && <span className="text-[11px] font-medium text-indigo-500/70 ml-2 uppercase tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded">You</span>}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{formatDate(msg.timestamp)}</span>
                        </div>

                        {/* Content / Edit mode */}
                        {isEditing ? (
                            <div className="mt-2">
                                <textarea
                                    ref={editInputRef}
                                    className="w-full bg-[#0F172A] text-slate-200 text-sm rounded-xl px-4 py-3 border border-indigo-500/50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none shadow-inner"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => handleEditKeyDown(e, msg.id)}
                                    rows={2}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-slate-500 font-medium">esc to <button className="text-indigo-400 hover:text-indigo-300 transition-colors" onClick={handleCancelEdit}>cancel</button> • enter to <button className="text-indigo-400 hover:text-indigo-300 transition-colors font-bold" onClick={() => handleSaveEdit(msg.id)}>save</button></span>
                                </div>
                            </div>
                        ) : isDeleting ? (
                            <div className="mt-2 bg-rose-950/30 border border-rose-900/50 rounded-xl px-4 py-3 backdrop-blur-sm">
                                <p className="text-sm text-slate-300 mb-3 font-medium">Are you sure you want to delete this message?</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleDeleteConfirm(msg.id)}
                                        className="px-4 py-1.5 bg-rose-600/90 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/20"
                                    >Delete</button>
                                    <button
                                        onClick={() => setDeletingMessageId(null)}
                                        className="px-4 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
                                    >Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content}
                            </div>
                        )}

                        {/* Message Actions */}
                        {!isEditing && !isDeleting && (
                            <div className={`flex items-center gap-3 mt-2 transition-all duration-200 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
                                {/* Voting */}
                                <div className="flex items-center bg-[#0F172A] rounded-lg px-2 py-1 border border-slate-700/50 gap-1.5 shadow-sm">
                                    <button
                                        className={`p-1 rounded-md transition-all ${userVote === 1 ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                                        onClick={() => handleVote(msg.id, userVote, 1)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 4l-8 8h6v8h4v-8h6z" /></svg>
                                    </button>
                                    <span className={`text-xs font-bold min-w-[20px] text-center ${userVote === 1 ? 'text-emerald-400' : userVote === -1 ? 'text-rose-400' : 'text-slate-400'}`}>{score}</span>
                                    <button
                                        className={`p-1 rounded-md transition-all ${userVote === -1 ? 'text-rose-400 bg-rose-400/10' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                                        onClick={() => handleVote(msg.id, userVote, -1)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 20l8-8h-6v-8h-4v8h-6z" /></svg>
                                    </button>
                                </div>

                                {/* Thread Reply */}
                                {!isThread && !msg.parent_id && (
                                    <button
                                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-300 bg-[#0F172A] hover:bg-indigo-500/10 border border-slate-700/50 hover:border-indigo-500/30 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                                        onClick={() => handleOpenThread(msg)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" /></svg>
                                        {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
                                    </button>
                                )}

                                {/* Own message actions */}
                                {isOwn && (
                                    <>
                                        <button
                                            className="text-xs font-semibold text-slate-400 hover:text-slate-200 bg-[#0F172A] hover:bg-slate-800 border border-slate-700/50 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                                            onClick={() => handleStartEdit(msg)}
                                        >Edit</button>
                                        <button
                                            className="text-xs font-semibold text-slate-400 hover:text-rose-400 bg-[#0F172A] hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-all shadow-sm"
                                            onClick={() => setDeletingMessageId(msg.id)}
                                        >Delete</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </React.Fragment>
        );
    };

    // DM View
    if (viewMode === 'dms') {
        if (!currentDM) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-[#0F172A]">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20 shadow-2xl">
                        <div className="text-5xl opacity-80">💬</div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Your Messages</h2>
                    <p className="text-slate-400 text-sm max-w-sm leading-relaxed">Select a conversation or find a new friend to start chatting privately.</p>
                </div>
            );
        }

        return (
            <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#0F172A]">
                {/* DM Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-700/50 shrink-0 bg-[#0F172A]/80 backdrop-blur-xl shadow-sm z-10">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm mr-4 overflow-hidden shrink-0 shadow-lg">
                        {currentDM.other_user_profile_pic ? (
                            <img src={currentDM.other_user_profile_pic} alt={currentDM.other_user_email} className="w-full h-full object-cover" />
                        ) : (
                            currentDM.other_user_email?.charAt(0).toUpperCase() || '?'
                        )}
                    </div>
                    <span className="text-white font-extrabold text-lg tracking-tight truncate flex-1">
                        @{currentDM.other_user_email?.split('@')[0] || 'User'}
                    </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar bg-gradient-to-b from-[#0F172A] to-[#1E293B]/20">
                    {dmMessages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                            <div key={msg.id || index} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 self-end overflow-hidden shadow-md">
                                    {msg.sender_profile_pic ? (
                                        <img src={msg.sender_profile_pic} alt={msg.sender_email} className="w-full h-full object-cover" />
                                    ) : (
                                        msg.sender_email?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>
                                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                    <div className={`py-3 px-5 text-[15px] leading-relaxed shadow-lg ${
                                        isOwn
                                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-br-sm'
                                            : 'bg-[#1E293B] text-slate-200 border border-slate-700/50 rounded-2xl rounded-bl-sm'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-500 mt-1.5 px-1">{formatTime(msg.timestamp)}</span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-6 pb-6 pt-4 shrink-0 bg-[#0F172A]">
                    <form
                        className="flex items-end gap-3 bg-[#1E293B] rounded-2xl px-5 py-3 border border-slate-700/50 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner"
                        onSubmit={handleSend}
                    >
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none focus:outline-none text-slate-200 placeholder-slate-500 py-2 text-[15px]"
                            placeholder={`Message @${currentDM.other_user_email?.split('@')[0] || 'User'}`}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="p-2.5 text-indigo-400 bg-indigo-500/10 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-500/10 disabled:hover:text-indigo-400 disabled:cursor-not-allowed mb-0.5"
                            disabled={!inputValue.trim() || sending}
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Community channel empty state
    if (!currentChannel) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-[#0F172A]">
                <div className="w-24 h-24 bg-[#1E293B] rounded-full flex items-center justify-center mb-6 border border-slate-700/50 shadow-2xl">
                    <div className="text-5xl text-slate-600 font-light">#</div>
                </div>
                <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Select a channel</h2>
                <p className="text-slate-400 text-sm max-w-sm leading-relaxed">Pick a channel from the sidebar to start chatting with the community.</p>
            </div>
        );
    }

    const parentMessages = messages.filter(msg => !msg.parent_id);

    return (
        <div className="flex-1 flex h-full relative overflow-hidden min-w-0 bg-[#0F172A]">
            <div className="flex-1 flex flex-col h-full relative min-w-0">
                {/* Channel Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700/50 shrink-0 bg-[#0F172A]/80 backdrop-blur-xl shadow-sm z-10">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-slate-500 font-light text-2xl">#</span>
                        <div className="flex flex-col min-w-0">
                            <h2 className="font-extrabold text-white text-lg tracking-tight truncate">{currentChannel.name}</h2>
                            {currentChannel.description && (
                                <span className="text-[13px] font-medium text-slate-400 truncate max-w-sm hidden sm:block">{currentChannel.description}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-slate-300 hover:text-white rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all text-sm font-bold shadow-sm"
                            onClick={() => setShowReviews(true)}
                        >
                            <span className="text-lg leading-none">📋</span><span className="hidden sm:inline">Reviews</span>
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] text-slate-300 hover:text-white rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all text-sm font-bold shadow-sm"
                            onClick={() => setShowNotes(true)}
                        >
                            <span className="text-lg leading-none">📝</span><span className="hidden sm:inline">Notes</span>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar bg-gradient-to-b from-[#0F172A] to-[#1E293B]/20" onClick={() => setShowEmojiPicker(false)}>
                    {parentMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1E293B] to-slate-800 flex items-center justify-center mb-6 shadow-2xl border border-slate-700/50">
                                <span className="text-5xl text-slate-500 font-light">#</span>
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Welcome to #{currentChannel.name}!</h3>
                            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                                {currentChannel.description || 'This is the start of the conversation. Be the first to say something!'}
                            </p>
                        </div>
                    ) : (
                        parentMessages.map((msg, index) => renderMessage(msg, index, false, parentMessages))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="px-6 pb-6 pt-2 shrink-0 bg-[#0F172A]">
                    <div className="bg-[#1E293B] rounded-2xl border border-slate-700/50 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner overflow-hidden">
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                            <div className="p-4 border-b border-slate-700/50 flex flex-wrap gap-2 bg-[#0F172A]/50" onClick={e => e.stopPropagation()}>
                                {COMMON_EMOJIS.map(emoji => (
                                    <button
                                        key={emoji}
                                        className="text-2xl hover:bg-slate-700 rounded-xl p-1.5 transition-colors transform hover:scale-110"
                                        onClick={() => handleEmojiSelect(emoji)}
                                    >{emoji}</button>
                                ))}
                            </div>
                        )}
                        <form className="flex items-end gap-3 px-5 py-3" onSubmit={handleSend}>
                            <button
                                type="button"
                                className="text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-indigo-500/10 transition-colors p-2 rounded-xl shrink-0 mb-1"
                                onClick={e => { e.stopPropagation(); setShowEmojiPicker(prev => !prev); }}
                                title="Emoji"
                            >
                                <span className="text-xl leading-none">😊</span>
                            </button>
                            <textarea
                                ref={inputRef}
                                className="flex-1 bg-transparent border-none focus:outline-none text-slate-200 placeholder-slate-500 py-2.5 text-[15px] resize-none max-h-40"
                                placeholder={`Message #${currentChannel.name}`}
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                onKeyDown={handleInputKeyDown}
                                rows={1}
                            />
                            <button
                                type="submit"
                                className="p-3 text-indigo-400 bg-indigo-500/10 rounded-xl hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-500/10 disabled:hover:text-indigo-400 disabled:cursor-not-allowed mb-1 shrink-0"
                                disabled={!inputValue.trim() || sending}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Thread Panel */}
            {activeThread && (
                <div className="w-96 border-l border-slate-700/50 bg-[#0F172A] flex flex-col h-full shadow-[-20px_0_40px_rgba(0,0,0,0.3)] absolute right-0 top-0 z-30 sm:relative sm:shadow-none">
                    <div className="h-16 flex items-center justify-between px-6 border-b border-slate-700/50 bg-[#0F172A]/80 backdrop-blur-xl shrink-0">
                        <div>
                            <h3 className="font-extrabold text-white text-[15px] tracking-tight">Thread</h3>
                            <p className="text-[13px] font-medium text-slate-400">#{currentChannel.name}</p>
                        </div>
                        <button
                            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                            onClick={handleCloseThread}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
                        {loadingThread ? (
                            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                                <span className="text-sm font-medium">Loading thread...</span>
                            </div>
                        ) : threadData ? (
                            <>
                                <div className="pb-4 border-b border-slate-700/50 mb-6">
                                    {renderMessage(threadData.parent, 0, true)}
                                </div>

                                <div className="flex items-center gap-4 py-2 mb-4 px-6">
                                    <div className="h-px bg-slate-700/50 flex-1"></div>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-[#1E293B] px-3 py-1 rounded-full border border-slate-700/50">
                                        {threadData.total_replies} {threadData.total_replies === 1 ? 'reply' : 'replies'}
                                    </span>
                                    <div className="h-px bg-slate-700/50 flex-1"></div>
                                </div>

                                {threadData.replies.map((reply, index) => (
                                    <div key={reply.id} className="pl-4 border-l-2 border-indigo-500/20 ml-6 mr-2 py-1 mb-2 hover:border-indigo-500/50 transition-colors">
                                        {renderMessage(reply, index, true)}
                                    </div>
                                ))}
                                <div ref={threadEndRef} />
                            </>
                        ) : null}
                    </div>

                    <div className="p-4 border-t border-slate-700/50 bg-[#0F172A] shrink-0">
                        <form className="bg-[#1E293B] rounded-xl border border-slate-700/50 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 overflow-hidden shadow-inner" onSubmit={handleSendReply}>
                            <input
                                type="text"
                                className="w-full px-4 py-3 text-[15px] focus:outline-none bg-transparent text-slate-200 placeholder-slate-500"
                                placeholder="Reply to thread..."
                                value={replyInputValue}
                                onChange={e => setReplyInputValue(e.target.value)}
                            />
                            <div className="bg-[#0F172A]/50 px-3 py-2 flex justify-end border-t border-slate-700/30">
                                <button
                                    type="submit"
                                    className="px-5 py-1.5 bg-indigo-600/90 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-md shadow-indigo-900/20"
                                    disabled={!replyInputValue.trim()}
                                >
                                    Reply ↵
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showNotes && <SharedNotes onClose={() => setShowNotes(false)} />}
            {showReviews && <PeerReview onClose={() => setShowReviews(false)} />}
        </div>
    );
};

export default ChatArea;
