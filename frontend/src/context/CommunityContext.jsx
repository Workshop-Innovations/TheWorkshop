import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/community`;
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const CommunityProvider = ({ children }) => {
    const { accessToken, logout } = useAuth();
    const token = accessToken;

    // User state
    const [user, setUser] = useState(null);

    // Community (Server) state
    const [communities, setCommunities] = useState([]);
    const [currentCommunity, setCurrentCommunity] = useState(null);

    // Channel state
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);

    // Messages state
    const [messages, setMessages] = useState([]);

    // Members state
    const [members, setMembers] = useState([]);

    // DM state
    const [dmConversations, setDmConversations] = useState([]);
    const [currentDM, setCurrentDM] = useState(null);
    const [dmMessages, setDmMessages] = useState([]);

    // View mode: 'community' or 'dms'
    const [viewMode, setViewMode] = useState('community');

    // Connection state
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Refs to access latest state in WebSocket closures without triggering reconnects
    const currentChannelRef = useRef(currentChannel);
    const currentDMRef = useRef(currentDM);
    const viewModeRef = useRef(viewMode);

    useEffect(() => { currentChannelRef.current = currentChannel; }, [currentChannel]);
    useEffect(() => { currentDMRef.current = currentDM; }, [currentDM]);
    useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);

    // Unread tracking: Set of channel IDs that have unread messages
    const [unreadChannels, setUnreadChannels] = useState(new Set());
    const [unreadDMs, setUnreadDMs] = useState(new Set());

    // WebSocket ref
    const wsRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ==================== FETCH USER ====================
    const fetchUser = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/v1/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else if (response.status === 401) {
                logout();
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
        }
    };

    // ==================== COMMUNITY (SERVER) FUNCTIONS ====================
    const fetchCommunities = async () => {
        try {
            const response = await fetch(`${API_BASE}/communities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const uniqueCommunities = data.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
                setCommunities(uniqueCommunities);
                if (!currentCommunity && uniqueCommunities.length > 0) {
                    setCurrentCommunity(uniqueCommunities[0]);
                }
                return uniqueCommunities;
            }
        } catch (error) {
            console.error("Failed to fetch communities", error);
        }
        setCommunities([]);
        return [];
    };

    const createCommunity = async (name, icon = null) => {
        try {
            const response = await fetch(`${API_BASE}/communities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, icon })
            });
            if (response.ok) {
                const newCommunity = await response.json();
                setCommunities(prev => [...prev, newCommunity]);
                setCurrentCommunity(newCommunity);
                setViewMode('community');
                return newCommunity;
            }
        } catch (error) {
            console.error("Failed to create community", error);
        }
        return null;
    };

    const joinCommunity = async (joinCode) => {
        try {
            const response = await fetch(`${API_BASE}/communities/join?join_code=${joinCode}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                await fetchCommunities();
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to join');
            }
        } catch (error) {
            console.error("Failed to join community", error);
            throw error;
        }
    };

    const getCommunityJoinCode = async (communityId) => {
        try {
            const response = await fetch(`${API_BASE}/communities/${communityId}/join-code`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to fetch join code", error);
        }
        return null;
    };

    // ==================== CHANNEL FUNCTIONS ====================
    const fetchChannels = async (communityId) => {
        if (!communityId) return;
        try {
            const response = await fetch(`${API_BASE}/communities/${communityId}/channels`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setChannels(data);
                if (data.length > 0) {
                    setCurrentChannel(data[0]);
                } else {
                    setCurrentChannel(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch channels", error);
        }
    };

    const createChannel = async (communityId, name, description = '', channelType = 'text') => {
        try {
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            const response = await fetch(`${API_BASE}/communities/${communityId}/channels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, slug, description, channel_type: channelType })
            });
            if (response.ok) {
                const newChannel = await response.json();
                setChannels(prev => [...prev, newChannel]);
                return newChannel;
            }
        } catch (error) {
            console.error("Failed to create channel", error);
        }
        return null;
    };

    // ==================== MESSAGE FUNCTIONS ====================
    const fetchMessages = async (channelId) => {
        if (!channelId) return;
        try {
            const response = await fetch(`${API_BASE}/channels/${channelId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
                // Mark channel as read when we load messages
                setUnreadChannels(prev => {
                    const next = new Set(prev);
                    next.delete(channelId);
                    return next;
                });
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const sendMessage = async (content) => {
        if (!currentChannel || !content.trim()) return;

        try {
            const response = await fetch(`${API_BASE}/channels/${currentChannel.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (response.ok) {
                const newMessage = await response.json();
                setMessages(prev => [...prev, newMessage]);
            } else {
                console.error("Failed to send message, status:", response.status);
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const editMessage = async (messageId, content) => {
        if (!currentChannel || !content.trim()) return null;
        try {
            const response = await fetch(`${API_BASE}/channels/${currentChannel.id}/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (response.ok) {
                const updated = await response.json();
                setMessages(prev => prev.map(msg => msg.id === messageId ? updated : msg));
                return updated;
            }
        } catch (error) {
            console.error("Failed to edit message", error);
        }
        return null;
    };

    const deleteMessage = async (messageId) => {
        if (!currentChannel) return false;
        try {
            const response = await fetch(`${API_BASE}/channels/${currentChannel.id}/messages/${messageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
                return true;
            }
        } catch (error) {
            console.error("Failed to delete message", error);
        }
        return false;
    };

    const voteMessage = async (messageId, value) => {
        if (!currentChannel) return;
        try {
            const response = await fetch(
                `${API_BASE}/channels/${currentChannel.id}/messages/${messageId}/vote?vote_value=${value}`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (response.ok) {
                const updatedMessage = await response.json();
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId ? updatedMessage : msg
                ));
            }
        } catch (error) {
            console.error("Failed to vote", error);
        }
    };

    const markChannelAsRead = useCallback((channelId) => {
        setUnreadChannels(prev => {
            const next = new Set(prev);
            next.delete(channelId);
            return next;
        });
    }, []);

    // ==================== USER SEARCH ====================
    const searchUsers = async (query) => {
        if (!query.trim()) return [];
        try {
            const response = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to search users", error);
        }
        return [];
    };

    // ==================== MEMBERS FUNCTIONS ====================
    const fetchMembers = async (communityId) => {
        if (!communityId) return;
        try {
            const response = await fetch(`${API_BASE}/communities/${communityId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            }
        } catch (error) {
            console.error("Failed to fetch members", error);
        }
    };

    // ==================== DM FUNCTIONS ====================
    const fetchDMConversations = async () => {
        try {
            const response = await fetch(`${API_BASE}/dms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDmConversations(data);
            }
        } catch (error) {
            console.error("Failed to fetch DM conversations", error);
        }
    };

    const startDM = async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/dms/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const conversation = await response.json();
                await fetchDMConversations();
                setCurrentDM(conversation);
                setViewMode('dms');
                return conversation;
            }
        } catch (error) {
            console.error("Failed to start DM", error);
        }
        return null;
    };

    const fetchDMMessages = async (conversationId) => {
        if (!conversationId) return;
        try {
            const response = await fetch(`${API_BASE}/dms/${conversationId}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDmMessages(data);
                // Mark DM as read
                setUnreadDMs(prev => {
                    const next = new Set(prev);
                    next.delete(conversationId);
                    return next;
                });
            }
        } catch (error) {
            console.error("Failed to fetch DM messages", error);
        }
    };

    const sendDMMessage = async (content) => {
        if (!currentDM || !content.trim()) return;
        try {
            const response = await fetch(`${API_BASE}/dms/${currentDM.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (response.ok) {
                const newMsg = await response.json();
                setDmMessages(prev => [...prev, newMsg]);
            }
        } catch (error) {
            console.error("Failed to send DM", error);
        }
    };

    // ==================== ONLINE USERS ====================
    const fetchOnlineUsers = async () => {
        try {
            const response = await fetch(`${API_BASE}/users/online`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setOnlineUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch online users", error);
        }
    };

    // ==================== EFFECTS ====================

    // Initial load
    useEffect(() => {
        if (token) {
            setLoading(true);
            Promise.all([
                fetchUser(),
                fetchCommunities(),
                fetchDMConversations(),
                fetchOnlineUsers()
            ]).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    // When community changes, fetch its channels and members
    useEffect(() => {
        if (currentCommunity && token) {
            fetchChannels(currentCommunity.id);
            fetchMembers(currentCommunity.id);
        }
    }, [currentCommunity, token]);

    // When channel changes, fetch messages and mark as read
    useEffect(() => {
        if (currentChannel && token) {
            fetchMessages(currentChannel.id);
        }
    }, [currentChannel, token]);

    // WebSocket connection for real-time messaging
    useEffect(() => {
        if (!token) return;

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const wsBase = apiBase.replace(/^http/, 'ws');
        const wsUrl = `${wsBase}/ws/community/global?token=${token}`;

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            console.log(`[WS] Connected to channel: ${currentChannel.slug}`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'message' || data.type === 'reply') {
                    // Deduplicate: the sender already added the message via HTTP response
                    setMessages(prev => {
                        if (prev.some(m => m.id === data.id)) return prev;
                        // If we're in a different channel or view, mark as unread and DO NOT append
                        if (data.channel_id !== currentChannelRef.current?.id || viewModeRef.current !== 'community') {
                            setUnreadChannels(p => new Set([...p, data.channel_id]));
                            return prev;
                        }
                        return [...prev, {
                            id: data.id,
                            content: data.content,
                            user_id: data.user_id,
                            channel_id: data.channel_id,
                            timestamp: data.timestamp,
                            user_email: data.user_email,
                            user_profile_pic: data.user_profile_pic,
                            parent_id: data.parent_id || null,
                            score: 0,
                            user_vote: 0,
                            reply_count: 0
                        }];
                    });
                } else if (data.type === 'message_edited') {
                    setMessages(prev => prev.map(msg =>
                        msg.id === data.id ? { ...msg, content: data.content } : msg
                    ));
                } else if (data.type === 'message_deleted') {
                    setMessages(prev => prev.filter(msg => msg.id !== data.id));
                } else if (data.type === 'user_online') {
                    setOnlineUsers(prev => {
                        if (prev.includes(data.user_id)) return prev;
                        return [...prev, data.user_id];
                    });
                } else if (data.type === 'user_offline') {
                    setOnlineUsers(prev => prev.filter(id => id !== data.user_id));
                } else if (data.type === 'dm_message') {
                    // If it's for a DM conversation we have open, add it
                    if (data.conversation_id === currentDMRef.current?.id && viewModeRef.current === 'dms') {
                        setDmMessages(prev => {
                            if (prev.some(m => m.id === data.id)) return prev;
                            return [...prev, {
                                id: data.id,
                                content: data.content,
                                sender_id: data.sender_id,
                                sender_email: data.sender_email,
                                sender_profile_pic: data.sender_profile_pic,
                                timestamp: data.timestamp,
                                conversation_id: data.conversation_id
                            }];
                        });
                    } else {
                        setUnreadDMs(prev => new Set([...prev, data.conversation_id]));
                    }
                }
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };

        ws.onerror = (err) => {
            console.error('[WS] WebSocket error:', err);
            setIsConnected(false);
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            console.log(`[WS] Disconnected from global websocket`, event.code);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    // Include currentChannel.id and currentDM.id so that the closures in onmessage get the latest values.
    // However, recreating the websocket on every channel switch defeats the purpose of a global WS.
    // We should use a ref for currentChannel and currentDM to avoid reconnecting.
    }, [token]);

    // When DM changes, fetch DM messages
    useEffect(() => {
        if (currentDM && token) {
            fetchDMMessages(currentDM.id);
        }
    }, [currentDM, token]);

    // ==================== GAMIFICATION FUNCTIONS ====================
    const fetchLeaderboard = async (limit = 20, period = 'all_time') => {
        try {
            const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}&period=${period}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        }
        return null;
    };

    const fetchMyReputation = async () => {
        try {
            const response = await fetch(`${API_BASE}/users/me/reputation`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to fetch reputation", error);
        }
        return null;
    };

    const fetchUserReputation = async (userId) => {
        try {
            const response = await fetch(`${API_BASE}/users/${userId}/reputation`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to fetch user reputation", error);
        }
        return null;
    };

    const fetchAllBadges = async () => {
        try {
            const response = await fetch(`${API_BASE}/badges`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to fetch badges", error);
        }
        return [];
    };

    const seedBadges = async () => {
        try {
            const response = await fetch(`${API_BASE}/badges/seed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to seed badges", error);
        }
        return null;
    };

    // ==================== THREADING FUNCTIONS ====================
    const createReply = async (channelId, messageId, content) => {
        try {
            const response = await fetch(`${API_BASE}/channels/${channelId}/messages/${messageId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            if (response.ok) {
                const reply = await response.json();
                // Update reply_count of parent message optimistically
                setMessages(prev => prev.map(msg =>
                    msg.id === messageId ? { ...msg, reply_count: (msg.reply_count || 0) + 1 } : msg
                ));
                return reply;
            }
        } catch (error) {
            console.error("Failed to create reply", error);
        }
        return null;
    };

    const getThread = async (channelId, messageId) => {
        try {
            const response = await fetch(`${API_BASE}/channels/${channelId}/messages/${messageId}/thread`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to get thread", error);
        }
        return null;
    };

    // ==================== STUDY GROUP FUNCTIONS ====================
    const fetchStudyGroups = async (communityId) => {
        try {
            const response = await fetch(`${API_BASE}/communities/${communityId}/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to fetch study groups", error);
        }
        return [];
    };

    const createStudyGroup = async (communityId, groupData) => {
        try {
            const response = await fetch(`${API_BASE}/communities/${communityId}/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(groupData)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to create study group", error);
        }
        return null;
    };

    const joinStudyGroup = async (groupId) => {
        try {
            const response = await fetch(`${API_BASE}/groups/${groupId}/join`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.ok;
        } catch (error) {
            console.error("Failed to join study group", error);
        }
        return false;
    };

    const leaveStudyGroup = async (groupId) => {
        try {
            const response = await fetch(`${API_BASE}/groups/${groupId}/leave`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.ok;
        } catch (error) {
            console.error("Failed to leave study group", error);
        }
    };

    const fetchStudyGroupDetails = async (groupId) => {
        try {
            const response = await fetch(`${API_BASE}/groups/${groupId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error("Failed to fetch group details", error);
        }
        return null;
    };

    const removeGroupMember = async (groupId, userId) => {
        try {
            const response = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.ok;
        } catch (error) {
            console.error("Failed to remove group member", error);
        }
        return false;
    };

    // --- Shared Notes ---
    const fetchChannelNotes = async (channelId) => {
        try {
            const response = await fetch(`${API_BASE}/channels/${channelId}/notes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.error("Failed to fetch notes", error);
        }
        return [];
    };

    const createNote = async (channelId, noteData) => {
        try {
            const response = await fetch(`${API_BASE}/channels/${channelId}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(noteData)
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.error("Failed to create note", error);
        }
        return null;
    };

    const updateNote = async (noteId, noteData) => {
        try {
            const response = await fetch(`${API_BASE}/notes/${noteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(noteData)
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.error("Failed to update note", error);
        }
        return null;
    };

    // --- Peer Reviews ---
    const fetchSubmissions = async (channelId) => {
        try {
            const response = await fetch(`${API_BASE}/channels/${channelId}/submissions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        }
        return [];
    };

    const createSubmission = async (channelId, data) => {
        try {
            const response = await fetch(`${API_BASE}/channels/${channelId}/submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.error("Failed to create submission", error);
        }
        return null;
    };

    const submitFeedback = async (submissionId, data) => {
        try {
            const response = await fetch(`${API_BASE}/submissions/${submissionId}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.error("Failed to submit feedback", error);
        }
        return null;
    };

    const fetchSubmissionFeedback = async (submissionId) => {
        try {
            const response = await fetch(`${API_BASE}/submissions/${submissionId}/feedback`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) return await response.json();
        } catch (error) {
            console.error("Failed to fetch feedback", error);
        }
        return [];
    };

    // ==================== CONTEXT VALUE ====================
    const value = {
        // User
        user,

        // Communities
        communities,
        currentCommunity,
        setCurrentCommunity,
        createCommunity,
        joinCommunity,
        getCommunityJoinCode,

        // Channels
        channels,
        currentChannel,
        setCurrentChannel,
        createChannel,

        // Study Groups
        fetchStudyGroups,
        createStudyGroup,
        joinStudyGroup,
        leaveStudyGroup,
        fetchStudyGroupDetails,
        removeGroupMember,

        // Notes
        fetchChannelNotes,
        createNote,
        updateNote,

        // Peer Reviews
        fetchSubmissions,
        createSubmission,
        submitFeedback,
        fetchSubmissionFeedback,

        // Messages
        messages,
        sendMessage,
        editMessage,
        deleteMessage,
        voteMessage,

        // Threading
        createReply,
        getThread,

        // Members
        members,

        // DMs
        dmConversations,
        currentDM,
        setCurrentDM,
        dmMessages,
        startDM,
        sendDMMessage,
        fetchDMConversations,

        // User Search
        searchUsers,

        // View mode
        viewMode,
        setViewMode,

        // Connection
        onlineUsers,
        isConnected,
        loading,
        error,

        // Unread tracking
        unreadChannels,
        unreadDMs,
        markChannelAsRead,

        // Refresh functions
        fetchCommunities,
        fetchChannels,
        fetchMembers,

        // Gamification
        fetchLeaderboard,
        fetchMyReputation,
        fetchUserReputation,
        fetchAllBadges,
        seedBadges
    };

    return (
        <CommunityContext.Provider value={value}>
            {children}
        </CommunityContext.Provider>
    );
};
