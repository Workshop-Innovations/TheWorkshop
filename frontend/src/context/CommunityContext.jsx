import { API_BASE_URL } from "../services/api.js";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext.jsx";

const CommunityContext = createContext();

export const useCommunity = () => useContext(CommunityContext);

const API_BASE = `${API_BASE_URL}/api/v1/community`;

export const CommunityProvider = ({ children }) => {
  const { accessToken, user } = useAuth();
  const token = accessToken;

  const [communities, setCommunities] = useState([]);
  const [currentCommunity, setCurrentCommunity] = useState(null);

  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);

  const [messages, setMessages] = useState([]);

  const [members, setMembers] = useState([]);

  const [dmConversations, setDmConversations] = useState([]);
  const [currentDM, setCurrentDM] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);

  const [viewMode, setViewMode] = useState("community");

  const [onlineUsers, setOnlineUsers] = useState([]);

  const currentChannelRef = useRef(currentChannel);
  const currentDMRef = useRef(currentDM);
  const viewModeRef = useRef(viewMode);

  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);
  useEffect(() => {
    currentDMRef.current = currentDM;
  }, [currentDM]);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  const [unreadChannels, setUnreadChannels] = useState(new Set());
  const [unreadDMs, setUnreadDMs] = useState(new Set());

  const wsRef = useRef(null);
  const wsReconnectTimeout = useRef(null);
  const wsReconnectDelay = useRef(1000);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCommunities = async () => {
    try {
      const response = await fetch(`${API_BASE}/communities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const uniqueCommunities = data.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
        );
        setCommunities(uniqueCommunities);
        if (!currentCommunity && uniqueCommunities.length > 0) {
          setCurrentCommunity(uniqueCommunities[0]);
        }
        return uniqueCommunities;
      }
    } catch (error) {
      console.error("Failed to fetch communities", error);
    }
    setError("Unable to load communities. Please retry.");
    return [];
  };

  const createCommunity = async (name, icon = null) => {
    try {
      const response = await fetch(`${API_BASE}/communities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, icon }),
      });
      if (response.ok) {
        const newCommunity = await response.json();
        setCommunities((prev) => [...prev, newCommunity]);

        setChannels([]);
        setMessages([]);
        setCurrentChannel(null);
        setCurrentCommunity(newCommunity);
        setViewMode("community");
        return newCommunity;
      }
    } catch (error) {
      console.error("Failed to create community", error);
    }
    return null;
  };

  const joinCommunity = async (joinCode) => {
    try {
      const response = await fetch(
        `${API_BASE}/communities/join?join_code=${joinCode}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        await fetchCommunities();
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to join");
      }
    } catch (error) {
      console.error("Failed to join community", error);
      throw error;
    }
  };

  const getCommunityJoinCode = async (communityId) => {
    try {
      const response = await fetch(
        `${API_BASE}/communities/${communityId}/join-code`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch join code", error);
    }
    return null;
  };

  const fetchChannels = async (communityId) => {
    if (!communityId) return;
    try {
      const response = await fetch(
        `${API_BASE}/communities/${communityId}/channels`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setChannels(data);

        setCurrentChannel((prev) => {
          if (prev && prev.community_id === communityId) return prev;
          return data.length > 0 ? data[0] : null;
        });
      }
    } catch (error) {
      console.error("Failed to fetch channels", error);
    }
  };

  const createChannel = async (
    communityId,
    name,
    description = "",
    channelType = "text",
  ) => {
    try {
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      const response = await fetch(
        `${API_BASE}/communities/${communityId}/channels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            slug,
            description,
            channel_type: channelType,
          }),
        },
      );
      if (response.ok) {
        const newChannel = await response.json();
        setChannels((prev) => [...prev, newChannel]);
        return newChannel;
      }
    } catch (error) {
      console.error("Failed to create channel", error);
    }
    return null;
  };

  const fetchMessages = async (channelId) => {
    if (!channelId) return;
    try {
      const response = await fetch(
        `${API_BASE}/channels/${channelId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        if (currentChannelRef.current?.id !== channelId) return;
        setMessages(data);

        setUnreadChannels((prev) => {
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
    const channelId = currentChannel?.id;
    if (!channelId || !content.trim())
      throw new Error("Choose a channel first.");
    const response = await fetch(`${API_BASE}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Message was not sent. Please retry.");
    const saved = await response.json();
    if (currentChannelRef.current?.id === channelId) {
      setMessages((prev) =>
        prev.some((m) => m.id === saved.id) ? prev : [...prev, saved],
      );
    }
    return saved;
  };

  const editMessage = async (messageId, content) => {
    if (!currentChannel || !content.trim()) return null;
    try {
      const response = await fetch(
        `${API_BASE}/channels/${currentChannel.id}/messages/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        },
      );
      if (response.ok) {
        const updated = await response.json();
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? updated : msg)),
        );
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
      const response = await fetch(
        `${API_BASE}/channels/${currentChannel.id}/messages/${messageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
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
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? updatedMessage : msg)),
        );
      }
    } catch (error) {
      console.error("Failed to vote", error);
    }
  };

  const markChannelAsRead = useCallback((channelId) => {
    setUnreadChannels((prev) => {
      const next = new Set(prev);
      next.delete(channelId);
      return next;
    });
  }, []);

  const searchUsers = async (query) => {
    if (!query.trim()) return [];
    try {
      const response = await fetch(
        `${API_BASE}/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to search users", error);
    }
    return [];
  };

  const fetchMembers = async (communityId) => {
    if (!communityId) return;
    try {
      const response = await fetch(
        `${API_BASE}/communities/${communityId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Failed to fetch members", error);
    }
  };

  const fetchDMConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/dms`, {
        headers: { Authorization: `Bearer ${token}` },
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
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const conversation = await response.json();
        await fetchDMConversations();
        setCurrentDM(conversation);
        setViewMode("dms");
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
      const response = await fetch(
        `${API_BASE}/dms/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        if (currentDMRef.current?.id !== conversationId) return;
        setDmMessages(data);

        setUnreadDMs((prev) => {
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
    const conversationId = currentDM?.id;
    if (!conversationId || !content.trim())
      throw new Error("Choose a conversation first.");
    const response = await fetch(`${API_BASE}/dms/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Message was not sent. Please retry.");
    const saved = await response.json();
    if (currentDMRef.current?.id === conversationId) {
      setDmMessages((prev) =>
        prev.some((m) => m.id === saved.id) ? prev : [...prev, saved],
      );
    }
    return saved;
  };

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/online`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch online users", error);
    }
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError(null);
      Promise.all([
        fetchCommunities(),
        fetchDMConversations(),
        fetchOnlineUsers(),
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (currentCommunity && token) {
      setChannels([]);
      setMessages([]);
      setCurrentChannel(null);
      fetchChannels(currentCommunity.id);
      fetchMembers(currentCommunity.id);
    }
  }, [currentCommunity?.id, token]);

  useEffect(() => {
    if (currentChannel && token) {
      fetchMessages(currentChannel.id);
    }
  }, [currentChannel, token]);

  const reconnectRefresh = useRef(null);
  const connectedBefore = useRef(false);
  useEffect(() => {
    reconnectRefresh.current = () => {
      if (currentChannelRef.current)
        fetchMessages(currentChannelRef.current.id);
      if (currentDMRef.current) fetchDMMessages(currentDMRef.current.id);
      fetchOnlineUsers();
    };
  });

  const connectWebSocket = useCallback(() => {
    if (!token) return;

    const apiBase = API_BASE_URL;
    const wsBase = apiBase.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/ws/community/global?token=${token}`;

    if (wsRef.current) {
      wsRef.current.close(1000, "Reconnecting");
      wsRef.current = null;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      wsReconnectDelay.current = 1000; // Reset backoff on success
      if (connectedBefore.current) reconnectRefresh.current?.();
      connectedBefore.current = true;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "message" || data.type === "reply") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            if (
              data.channel_id !== currentChannelRef.current?.id ||
              viewModeRef.current !== "community"
            ) {
              setUnreadChannels((p) => new Set([...p, data.channel_id]));
              return prev;
            }
            return [
              ...prev,
              {
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
                reply_count: 0,
              },
            ];
          });
        } else if (data.type === "message_edited") {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id ? { ...msg, content: data.content } : msg,
            ),
          );
        } else if (data.type === "message_deleted") {
          setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
        } else if (data.type === "user_online") {
          setOnlineUsers((prev) => {
            if (prev.includes(data.user_id)) return prev;
            return [...prev, data.user_id];
          });
        } else if (data.type === "user_offline") {
          setOnlineUsers((prev) => prev.filter((id) => id !== data.user_id));
        } else if (data.type === "dm_message") {
          if (
            data.conversation_id === currentDMRef.current?.id &&
            viewModeRef.current === "dms"
          ) {
            setDmMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev;
              return [
                ...prev,
                {
                  id: data.id,
                  content: data.content,
                  sender_id: data.sender_id,
                  sender_email: data.sender_email,
                  sender_profile_pic: data.sender_profile_pic,
                  timestamp: data.timestamp,
                  conversation_id: data.conversation_id,
                },
              ];
            });
          } else {
            setUnreadDMs((prev) => new Set([...prev, data.conversation_id]));
          }
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] WebSocket error:", err);
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      // Reconnect with exponential backoff — skip on intentional close (1000)

      if (event.code !== 1000 && event.code !== 1008 && token) {
        const delay = wsReconnectDelay.current;
        console.log(
          `[WS] Disconnected (code ${event.code}). Reconnecting in ${delay}ms...`,
        );
        wsReconnectTimeout.current = setTimeout(() => {
          wsReconnectDelay.current = Math.min(delay * 2, 30000);
          connectWebSocket();
        }, delay);
      } else {
        console.log(`[WS] Closed cleanly (code ${event.code})`);
      }
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    connectWebSocket();
    return () => {
      if (wsReconnectTimeout.current) clearTimeout(wsReconnectTimeout.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close(1000, "Unmounting");
        wsRef.current = null;
      }
    };
  }, [token, connectWebSocket]);

  useEffect(() => {
    if (currentDM && token) {
      fetchDMMessages(currentDM.id);
    }
  }, [currentDM, token]);

  const fetchLeaderboard = async (limit = 20, period = "all_time") => {
    try {
      const response = await fetch(
        `${API_BASE}/leaderboard?limit=${limit}&period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to seed badges", error);
    }
    return null;
  };

  const createReply = async (channelId, messageId, content) => {
    try {
      const response = await fetch(
        `${API_BASE}/channels/${channelId}/messages/${messageId}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        },
      );
      if (response.ok) {
        const reply = await response.json();

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, reply_count: (msg.reply_count || 0) + 1 }
              : msg,
          ),
        );
        return reply;
      }
    } catch (error) {
      console.error("Failed to create reply", error);
    }
    return null;
  };

  const getThread = async (channelId, messageId) => {
    try {
      const response = await fetch(
        `${API_BASE}/channels/${channelId}/messages/${messageId}/thread`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Failed to get thread", error);
    }
    return null;
  };

  const fetchStudyGroups = async (communityId) => {
    try {
      const response = await fetch(
        `${API_BASE}/communities/${communityId}/groups`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
      const response = await fetch(
        `${API_BASE}/communities/${communityId}/groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(groupData),
        },
      );
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
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to leave study group", error);
    }
    return false;
  };

  const fetchStudyGroupDetails = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const response = await fetch(
        `${API_BASE}/groups/${groupId}/members/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.ok;
    } catch (error) {
      console.error("Failed to remove group member", error);
    }
    return false;
  };

  const updateStudyGroup = async (groupId, groupData) => {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(groupData),
      });
      if (response.ok) return await response.json();
    } catch (error) {
      console.error("Failed to update study group", error);
    }
    return null;
  };

  const deleteStudyGroup = async (groupId) => {
    try {
      const response = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to delete study group", error);
    }
    return false;
  };

  const updateChannel = async (channelId, channelData) => {
    try {
      const response = await fetch(`${API_BASE}/channels/${channelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(channelData),
      });
      if (response.ok) {
        const updated = await response.json();
        setChannels((prev) =>
          prev.map((ch) => (ch.id === channelId ? updated : ch)),
        );
        if (currentChannel?.id === channelId) setCurrentChannel(updated);
        return updated;
      }
    } catch (error) {
      console.error("Failed to update channel", error);
    }
    return null;
  };

  const deleteChannel = async (channelId) => {
    try {
      const response = await fetch(`${API_BASE}/channels/${channelId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setChannels((prev) => prev.filter((ch) => ch.id !== channelId));
        if (currentChannel?.id === channelId) setCurrentChannel(null);
        return true;
      }
    } catch (error) {
      console.error("Failed to delete channel", error);
    }
    return false;
  };

  const fetchChannelNotes = async (channelId) => {
    try {
      const response = await fetch(`${API_BASE}/channels/${channelId}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(noteData),
      });
      if (response.ok) return await response.json();
    } catch (error) {
      console.error("Failed to update note", error);
    }
    return null;
  };

  const fetchSubmissions = async (channelId) => {
    try {
      const response = await fetch(
        `${API_BASE}/channels/${channelId}/submissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) return await response.json();
    } catch (error) {
      console.error("Failed to fetch submissions", error);
    }
    return [];
  };

  const createSubmission = async (channelId, data) => {
    try {
      const response = await fetch(
        `${API_BASE}/channels/${channelId}/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        },
      );
      if (response.ok) return await response.json();
    } catch (error) {
      console.error("Failed to create submission", error);
    }
    return null;
  };

  const submitFeedback = async (submissionId, data) => {
    try {
      const response = await fetch(
        `${API_BASE}/submissions/${submissionId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        },
      );
      if (response.ok) return await response.json();
    } catch (error) {
      console.error("Failed to submit feedback", error);
    }
    return null;
  };

  const fetchSubmissionFeedback = async (submissionId) => {
    try {
      const response = await fetch(
        `${API_BASE}/submissions/${submissionId}/feedback`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) return await response.json();
    } catch (error) {
      console.error("Failed to fetch feedback", error);
    }
    return [];
  };

  const value = {
    user,

    communities,
    currentCommunity,
    setCurrentCommunity,
    createCommunity,
    joinCommunity,
    getCommunityJoinCode,

    channels,
    currentChannel,
    setCurrentChannel,
    createChannel,
    updateChannel,
    deleteChannel,

    fetchStudyGroups,
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
    fetchStudyGroupDetails,
    removeGroupMember,
    updateStudyGroup,
    deleteStudyGroup,

    fetchChannelNotes,
    createNote,
    updateNote,

    fetchSubmissions,
    createSubmission,
    submitFeedback,
    fetchSubmissionFeedback,

    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    voteMessage,

    createReply,
    getThread,

    members,

    dmConversations,
    currentDM,
    setCurrentDM,
    dmMessages,
    startDM,
    sendDMMessage,
    fetchDMConversations,

    searchUsers,

    viewMode,
    setViewMode,

    onlineUsers,
    isConnected,
    loading,
    error,

    unreadChannels,
    unreadDMs,
    markChannelAsRead,

    fetchCommunities,
    fetchChannels,
    fetchMembers,

    fetchLeaderboard,
    fetchMyReputation,
    fetchUserReputation,
    fetchAllBadges,
    seedBadges,
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};
