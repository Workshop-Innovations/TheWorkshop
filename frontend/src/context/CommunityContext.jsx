import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

const API_BASE = 'http://127.0.0.1:8000/api/v1/community';

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
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const ws = useRef(null);

    // ==================== FETCH USER ====================
    const fetchUser = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/v1/users/me', {
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
                setCommunities(data);
                if (data.length > 0 && !currentCommunity) {
                    setCurrentCommunity(data[0]);
                }
                return data;
            }
        } catch (error) {
            console.error("Failed to fetch communities", error);
        }
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
                if (data.length > 0 && !currentChannel) {
                    setCurrentChannel(data[0]);
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
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const sendMessage = async (content) => {
        if (!currentChannel || !content.trim()) return;

        // For default (frontend-only) channels, just add locally
        if (currentChannel.isDefault) {
            const localMessage = {
                id: Date.now(),
                content,
                timestamp: new Date().toISOString(),
                user_id: user?.id,
                channel_id: currentChannel.id,
                user_email: user?.email,
                score: 0,
                user_vote: 0
            };
            setMessages(prev => [...prev, localMessage]);
            return;
        }

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
                // Add to local state immediately (WebSocket will also broadcast but this ensures instant feedback)
                setMessages(prev => [...prev, newMessage]);
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
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

    // ==================== WEBSOCKET ====================
    useEffect(() => {
        if (!token || !currentChannel) return;

        if (ws.current) {
            ws.current.close();
        }

        const wsUrl = `ws://127.0.0.1:8000/ws/community/${currentChannel.slug}?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("Connected to chat");
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.current.onclose = () => {
            console.log("Disconnected from chat");
            setIsConnected(false);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [currentChannel, token]);

    const handleWebSocketMessage = (data) => {
        if (data.type === 'message') {
            setMessages(prev => [...prev, data]);
        } else if (data.type === 'vote_update') {
            setMessages(prev => prev.map(msg =>
                msg.id === data.message_id
                    ? { ...msg, score: data.score }
                    : msg
            ));
        } else if (data.type === 'dm_message') {
            if (currentDM && data.conversation_id === currentDM.id) {
                setDmMessages(prev => [...prev, data]);
            }
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
                fetchDMConversations()
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
            setCurrentChannel(null);
        }
    }, [currentCommunity, token]);

    // When channel changes, fetch messages
    useEffect(() => {
        if (currentChannel && token) {
            fetchMessages(currentChannel.id);
        }
    }, [currentChannel, token]);

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
                return await response.json();
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
        return null; // Return null if failed or self-review
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

        // View mode
        viewMode,
        setViewMode,

        // Connection
        onlineUsers,
        isConnected,
        loading,
        error,

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

