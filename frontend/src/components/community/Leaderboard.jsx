import React, { useState, useEffect, useCallback } from 'react';
import { useCommunity } from '../../context/CommunityContext';

const PERIODS = [
    { key: 'all_time', label: 'All Time' },
    { key: 'this_month', label: 'This Month' },
    { key: 'this_week', label: 'This Week' },
];

const TIER_STYLES = {
    bronze:   { bg: 'bg-amber-900/30',  border: 'border-amber-600/40', text: 'text-amber-500',  label: 'Bronze' },
    silver:   { bg: 'bg-slate-700/40',  border: 'border-slate-400/30', text: 'text-slate-300',  label: 'Silver' },
    gold:     { bg: 'bg-yellow-900/30', border: 'border-yellow-500/40', text: 'text-yellow-400', label: 'Gold' },
    platinum: { bg: 'bg-cyan-900/30',   border: 'border-cyan-500/40',  text: 'text-cyan-400',   label: 'Platinum' },
};

const getRankTier = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return null;
};

const Leaderboard = ({ onClose }) => {
    const { fetchLeaderboard, user } = useCommunity();
    const [activePeriod, setActivePeriod] = useState('all_time');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadLeaderboard = useCallback(async (period) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchLeaderboard(20, period);
            if (result) {
                setData(result);
            } else {
                setError('Failed to load leaderboard data.');
            }
        } catch {
            setError('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    }, [fetchLeaderboard]);

    useEffect(() => {
        loadLeaderboard(activePeriod);
    }, [activePeriod]);

    const handlePeriodChange = (period) => {
        if (period !== activePeriod) {
            setActivePeriod(period);
        }
    };

    const myEntry = data?.leaderboard?.find(e => e.user_id === user?.id);
    const topThree = data?.leaderboard?.slice(0, 3) || [];
    const restOfTop = data?.leaderboard?.slice(3) || [];

    // Podium arrangement: 2nd, 1st, 3rd
    const podiumOrder = topThree.length >= 3
        ? [topThree[1], topThree[0], topThree[2]]
        : topThree;

    const podiumSizes = {
        0: { height: 'h-20', bg: 'bg-gradient-to-t from-slate-600 to-slate-500', medal: '🥈', textSize: 'text-sm', avatarSize: 'w-12 h-12', rank: 2 },
        1: { height: 'h-28', bg: 'bg-gradient-to-t from-yellow-700 to-yellow-500', medal: '👑', textSize: 'text-base', avatarSize: 'w-14 h-14', rank: 1 },
        2: { height: 'h-16', bg: 'bg-gradient-to-t from-amber-800 to-amber-600', medal: '🥉', textSize: 'text-sm', avatarSize: 'w-11 h-11', rank: 3 },
    };

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🏆</span>
                            <div>
                                <h2 className="text-white font-black text-xl leading-tight">Community Leaderboard</h2>
                                <p className="text-amber-100/70 text-xs mt-0.5">Top contributors ranked by reputation</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Period tabs */}
                    <div className="flex bg-black/20 rounded-xl p-1 mt-4 gap-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activePeriod === p.key
                                        ? 'bg-white text-amber-700 shadow-md'
                                        : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`}
                                onClick={() => handlePeriodChange(p.key)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-sm">Loading leaderboard...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <span className="text-5xl mb-4">⚠️</span>
                            <p className="text-slate-300 font-bold mb-1">Failed to load</p>
                            <p className="text-slate-500 text-sm mb-4">{error}</p>
                            <button
                                onClick={() => loadLeaderboard(activePeriod)}
                                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-500 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : !data?.leaderboard?.length ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <span className="text-6xl mb-4 opacity-40">📊</span>
                            <p className="text-slate-300 font-bold mb-1">No data yet</p>
                            <p className="text-slate-500 text-sm">Send messages and get upvotes to appear here!</p>
                        </div>
                    ) : (
                        <>
                            {/* Podium */}
                            {topThree.length >= 2 && (
                                <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-slate-800/80 to-transparent">
                                    <div className="flex items-end justify-center gap-3 h-44">
                                        {podiumOrder.map((entry, idx) => {
                                            if (!entry) return null;
                                            const style = podiumSizes[idx];
                                            const isMe = entry.user_id === user?.id;
                                            return (
                                                <div key={entry.user_id} className="flex flex-col items-center gap-1 flex-1 max-w-[140px]">
                                                    {/* Crown for 1st */}
                                                    {style.rank === 1 && (
                                                        <span className="text-2xl mb-0.5 animate-bounce">👑</span>
                                                    )}

                                                    {/* Avatar */}
                                                    <div className={`${style.avatarSize} rounded-full overflow-hidden border-2 ${
                                                        style.rank === 1 ? 'border-yellow-400' :
                                                        style.rank === 2 ? 'border-slate-400' : 'border-amber-600'
                                                    } shadow-lg flex-shrink-0 bg-indigo-600 flex items-center justify-center text-white font-black ${isMe ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900' : ''}`}>
                                                        {entry.profile_pic ? (
                                                            <img src={entry.profile_pic} alt={entry.email} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-lg">{entry.email?.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>

                                                    <p className={`font-bold truncate w-full text-center ${style.textSize} ${isMe ? 'text-indigo-400' : 'text-white'}`}>
                                                        {entry.email?.split('@')[0]}
                                                        {isMe && ' (you)'}
                                                    </p>

                                                    <p className="text-xs text-slate-400 font-semibold">{entry.reputation_points} pts</p>

                                                    {/* Podium bar */}
                                                    <div className={`w-full ${style.height} ${style.bg} rounded-t-xl flex items-start justify-center pt-2`}>
                                                        <span className="text-white font-black text-sm">{style.rank}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* My Position Banner (if not in top 3) */}
                            {myEntry && myEntry.rank > 3 && (
                                <div className="mx-4 mb-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0">
                                        {myEntry.profile_pic ? (
                                            <img src={myEntry.profile_pic} alt={myEntry.email} className="w-full h-full object-cover" />
                                        ) : (
                                            myEntry.email?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-bold text-sm truncate">Your Position</p>
                                        <p className="text-indigo-300 text-xs">{myEntry.reputation_points} pts · #{myEntry.rank}</p>
                                    </div>
                                    <span className="text-indigo-400 font-black text-lg">#{myEntry.rank}</span>
                                </div>
                            )}

                            {/* Rankings list */}
                            <div className="px-4 pb-4 space-y-1">
                                {(topThree.length >= 3 ? restOfTop : data.leaderboard).map((entry) => {
                                    const isMe = entry.user_id === user?.id;
                                    const rankTier = getRankTier(entry.rank);
                                    const tierStyle = rankTier ? TIER_STYLES[rankTier] : null;

                                    return (
                                        <div
                                            key={entry.user_id}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                                                isMe
                                                    ? 'bg-indigo-600/20 border border-indigo-500/30'
                                                    : 'hover:bg-slate-800/60'
                                            }`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                                tierStyle
                                                    ? `${tierStyle.bg} border ${tierStyle.border} ${tierStyle.text}`
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {entry.rank}
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                {entry.profile_pic ? (
                                                    <img src={entry.profile_pic} alt={entry.email} className="w-full h-full object-cover" />
                                                ) : (
                                                    entry.email?.charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold text-sm truncate ${isMe ? 'text-indigo-400' : 'text-white'}`}>
                                                    {entry.email?.split('@')[0]}
                                                    {isMe && <span className="text-xs font-normal text-slate-400 ml-1">(you)</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {entry.total_messages} msgs · {entry.helpful_votes} upvotes
                                                </p>
                                            </div>

                                            {/* Badges (top earned) */}
                                            {entry.top_badges?.length > 0 && (
                                                <div className="flex gap-1 shrink-0">
                                                    {entry.top_badges.slice(0, 3).map((badge, i) => (
                                                        <span key={i} className="text-base" title={badge.name}>{badge.icon}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Score */}
                                            <div className="text-right shrink-0">
                                                <p className="font-black text-white text-sm">{entry.reputation_points}</p>
                                                <p className="text-[10px] text-slate-500">pts</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-center shrink-0">
                    <p className="text-xs text-slate-600">
                        Rankings update in real-time based on messages & upvotes received
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
