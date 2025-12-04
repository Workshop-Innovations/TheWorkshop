import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

export const CommunityProvider = ({ children }) => {
    const { accessToken, logout } = useAuth();
    const token = accessToken; // Alias for consistency
    const [user, setUser] = useState(null);
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const ws = useRef(null);

    // Fetch user details and channels on mount or when token is available
    useEffect(() => {
        if (token) {
            fetchUser();
            fetchChannels();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8001/api/v1/users/me', {
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

    const fetchChannels = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8001/api/v1/community/channels', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setChannels(data);
                if (data.length > 0 && !currentChannel) {
                    setCurrentChannel(data[0]);
                }
                setError(null);
            } else if (response.status === 401) {
                setError("Session expired. Please login again.");
                logout();
            } else {
                setError(`Failed to load channels: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch channels", error);
            setError(`Connection Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch messages when current channel changes
    useEffect(() => {
        if (currentChannel && token) {
            fetchMessages(currentChannel.slug);
        }
    }, [currentChannel, token]);

    const fetchMessages = async (channelSlug) => {
        try {
            const response = await fetch(`http://127.0.0.1:8001/api/v1/community/channels/${channelSlug}/messages`, {
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

    // WebSocket connection
    useEffect(() => {
        if (!token || !currentChannel) return;

        // Close existing connection
        if (ws.current) {
            ws.current.close();
        }

        const wsUrl = `ws://127.0.0.1:8001/ws/community/${currentChannel.slug}?token=${token}`;
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
        } else if (data.type === 'user_joined') {
            // Ideally fetch online users list again or add to list
            // For now, let's just log or show a system message if we wanted
            // But we can also update onlineUsers state if we track it locally
            fetchOnlineUsers();
        } else if (data.type === 'user_left') {
            fetchOnlineUsers();
        } else if (data.type === 'vote_update') {
            setMessages(prev => prev.map(msg =>
                msg.id === data.message_id
                    ? { ...msg, score: data.score }
                    : msg
            ));
        }
    };

    const fetchOnlineUsers = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8001/api/v1/community/users/online', {
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

    const sendMessage = async (content) => {
        if (!currentChannel || !content.trim()) return;

        try {
            await fetch(`http://127.0.0.1:8001/api/v1/community/channels/${currentChannel.slug}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            // The message will be received via WebSocket, so we don't need to add it manually here
            // to avoid duplication, unless we want optimistic UI updates.
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const voteMessage = async (messageId, value) => {
        try {
            const response = await fetch(`http://127.0.0.1:8001/api/v1/community/channels/${currentChannel.slug}/messages/${messageId}/vote?vote_value=${value}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

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

    return (
        <CommunityContext.Provider value={{
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
        }}>
            {children}
        </CommunityContext.Provider>
    );
};
