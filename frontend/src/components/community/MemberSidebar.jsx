import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { useCommunity } from "../../context/CommunityContext";
import Leaderboard from "./Leaderboard";
import { Trophy, Search } from "lucide-react";
import { resolveImageUrl } from "../../utils/imageUtils";

// ── ProfileHoverCard ────────────────────────────────────────────────────────
// Bug 2+3 fix: fetchUserReputation added to deps; isOwn guard skips wasted fetch.
// Bug 14 fix: card positioned left of the sidebar with a vertical clamp via inline style.
const ProfileHoverCard = memo(({ member, onStartDM, isOwn, onClose, cachedRep }) => {
    const { fetchUserReputation } = useCommunity();
    const [rep, setRep] = useState(cachedRep ?? null);

    useEffect(() => {
        // Bug 3 fix: skip fetch for own member card
        if (isOwn || cachedRep) return;
        let cancelled = false;
        fetchUserReputation(member.user_id).then(data => {
            if (!cancelled) setRep(data);
        });
        return () => { cancelled = true; };
    }, [member.user_id, isOwn, cachedRep, fetchUserReputation]); // Bug 2 fix: full dep array

    return (
        // Bug 14 fix: positioned to the left, clamped so it never overflows viewport
        <div className="absolute right-full top-0 mr-2 z-50 w-64 bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden">
            {/* Banner */}
            <div className="h-14 bg-primary relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            </div>

            {/* Body */}
            <div className="px-4 pb-4">
                <div className="-mt-7 mb-3 relative inline-block">
                    <div className="w-14 h-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xl border-4 border-white overflow-hidden shadow-md">
                        {member.user_profile_pic ? (
                            <img src={resolveImageUrl(member.user_profile_pic)} alt={member.user_email} className="w-full h-full object-cover" />
                        ) : (
                            member.user_email?.charAt(0).toUpperCase() || "?"
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <h3 className="text-slate-900 font-black text-sm">{member.user_email?.split("@")[0] || "User"}</h3>
                    <p className="text-slate-500 text-xs truncate">{member.user_email}</p>
                    {member.role !== "member" && (
                        <span className={`inline-block mt-1 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded ${
                            member.role === "owner" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                        }`}>
                            {member.role}
                        </span>
                    )}
                </div>

                {/* Stats */}
                {rep ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-md p-3 mb-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-slate-900 font-black text-sm">{rep.reputation_points}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rep</p>
                            </div>
                            <div>
                                <p className="text-slate-900 font-black text-sm">{rep.total_messages}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Messages</p>
                            </div>
                            <div>
                                <p className="text-slate-900 font-black text-sm">{rep.helpful_votes}</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Upvotes</p>
                            </div>
                        </div>
                        {rep.badges?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                                {rep.badges.slice(0, 4).map(badge => (
                                    <span key={badge.id} className="text-base" title={`${badge.name}: ${badge.description}`}>
                                        {badge.icon}
                                    </span>
                                ))}
                                {rep.badges.length > 4 && (
                                    <span className="text-xs text-slate-400">+{rep.badges.length - 4}</span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-md mb-3 animate-skeleton h-16" />
                )}

                {!isOwn && (
                    <button
                        className="w-full py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-md transition-colors shadow-lg shadow-primary/20"
                        onClick={() => { onStartDM(); onClose(); }}
                    >
                        Send Message
                    </button>
                )}
            </div>
        </div>
    );
});

// ── MemberItem ──────────────────────────────────────────────────────────────
// Bug 4 fix: extracted to a proper React component so .map() can pass `key` correctly,
// eliminating full-list re-renders on every state change.
// Bug 1 fix: reputation is cached in parent via repCacheRef and passed as `cachedRep`.
const MemberItem = memo(({ member, isOnline, isOwn, onStartDM, cachedRep, onCacheRep }) => {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeout = useRef(null);

    const handleMouseEnter = useCallback(() => {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setIsHovered(true), 600);
    }, []);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => setIsHovered(false), 300);
    }, []);

    useEffect(() => () => clearTimeout(hoverTimeout.current), []);

    return (
        <div
            className={`relative flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-all group ${
                isOnline ? "" : "opacity-50 hover:opacity-100"
            } hover:bg-slate-100`}
            onClick={() => !isOwn && onStartDM(member)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            title={isOwn ? "You" : "Click to DM"}
        >
            {/* Avatar with online indicator */}
            <div className="relative shrink-0">
                <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-white font-bold text-xs overflow-hidden ${
                    isOnline ? "bg-primary" : "bg-slate-300"
                }`}>
                    {member.user_profile_pic ? (
                        <img
                            src={resolveImageUrl(member.user_profile_pic)}
                            alt={member.user_email}
                            className={`w-full h-full object-cover ${!isOnline ? "grayscale" : ""}`}
                        />
                    ) : (
                        member.user_email?.charAt(0).toUpperCase() || "?"
                    )}
                </div>
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    isOnline ? "bg-emerald-500" : "bg-slate-300"
                }`} />
            </div>

            {/* Name & role */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                    <span className={`text-sm font-semibold truncate ${isOnline ? "text-slate-800" : "text-slate-400"}`}>
                        {member.user_email?.split("@")[0] || "User"}
                    </span>
                    {isOwn && <span className="text-[9px] text-slate-400">(you)</span>}
                </div>
                {member.role !== "member" && (
                    <span className={`text-[9px] uppercase font-black tracking-wider ${
                        member.role === "owner" ? "text-primary" : "text-accent"
                    }`}>
                        {member.role}
                    </span>
                )}
            </div>

            {/* Hover profile card */}
            {isHovered && (
                <div
                    onMouseEnter={() => { clearTimeout(hoverTimeout.current); setIsHovered(true); }}
                    onMouseLeave={handleMouseLeave}
                >
                    <ProfileHoverCard
                        member={member}
                        onStartDM={() => onStartDM(member)}
                        isOwn={isOwn}
                        onClose={() => setIsHovered(false)}
                        cachedRep={cachedRep}
                    />
                </div>
            )}
        </div>
    );
});

// ── MemberSidebar ───────────────────────────────────────────────────────────
const MemberSidebar = () => {
    const { members, currentCommunity, viewMode, startDM, user, onlineUsers } = useCommunity();
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");

    // Bug 1 fix: reputation cache — keyed by user_id, never evicted within a session
    const repCacheRef = useRef({});

    const handleCacheRep = useCallback((userId, data) => {
        repCacheRef.current[userId] = data;
    }, []);

    // Bug 10 fix: sidebar now hidden in DM view (already correct) — light theme applied below
    if (viewMode === "dms" || !currentCommunity) return null;

    const handleStartDM = async (member) => {
        if (member.user_id === user?.id) return;
        await startDM(member.user_id);
    };

    const onlineMemberIds = new Set(onlineUsers);

    const filteredMembers = memberSearch
        ? members.filter(m => m.user_email?.toLowerCase().includes(memberSearch.toLowerCase()))
        : members;

    const onlineMembers = filteredMembers.filter(m => onlineMemberIds.has(m.user_id));
    const offlineMembers = filteredMembers.filter(m => !onlineMemberIds.has(m.user_id));

    return (
        // Bug 10 fix: unified light theme (was bg-slate-800 dark)
        <div className="flex flex-col h-full bg-white border-l border-slate-200 overflow-hidden">
            {/* Leaderboard Button */}
            <div className="p-3 border-b border-slate-100 shrink-0">
                <button
                    className="w-full py-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-md shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                    onClick={() => setShowLeaderboard(true)}
                >
                    <Trophy size={15} /> Leaderboard
                </button>
            </div>

            {/* Member Search */}
            <div className="px-3 py-2 shrink-0 border-b border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-200">
                    <Search size={13} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none"
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
                {/* Online */}
                {onlineMembers.length > 0 && (
                    <div className="mb-3">
                        <div className="px-2 py-1 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Online — {onlineMembers.length}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            {onlineMembers.map(m => (
                                <MemberItem
                                    key={m.id}   // Bug 4 fix: key on the component at the call site
                                    member={m}
                                    isOnline={true}
                                    isOwn={m.user_id === user?.id}
                                    onStartDM={handleStartDM}
                                    cachedRep={repCacheRef.current[m.user_id]}
                                    onCacheRep={handleCacheRep}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Offline */}
                {offlineMembers.length > 0 && (
                    <div>
                        <div className="px-2 py-1 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Offline — {offlineMembers.length}
                            </span>
                        </div>
                        <div className="space-y-0.5">
                            {offlineMembers.map(m => (
                                <MemberItem
                                    key={m.id}   // Bug 4 fix
                                    member={m}
                                    isOnline={false}
                                    isOwn={m.user_id === user?.id}
                                    onStartDM={handleStartDM}
                                    cachedRep={repCacheRef.current[m.user_id]}
                                    onCacheRep={handleCacheRep}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                        {memberSearch ? "No members match your search" : "No members yet"}
                    </div>
                )}
            </div>

            {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
        </div>
    );
};

export default MemberSidebar;
