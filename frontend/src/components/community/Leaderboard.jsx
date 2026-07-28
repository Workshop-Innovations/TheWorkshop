import React, { useState, useEffect, useCallback } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { Trophy, X, Medal, Crown } from 'lucide-react';

const PERIODS = [
    { key: 'all_time', label: 'All Time' },
    { key: 'this_month', label: 'This Month' },
    { key: 'this_week', label: 'This Week' },
];

const TIER_STYLES = {
    bronze:   { bg: 'bg-amber-100',  border: 'border-amber-200', text: 'text-amber-700',  label: 'Bronze' },
    silver:   { bg: 'bg-slate-100',  border: 'border-slate-300', text: 'text-slate-600',  label: 'Silver' },
    gold:     { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', label: 'Gold' },
    platinum: { bg: 'bg-cyan-50',   border: 'border-cyan-200',  text: 'text-cyan-700',   label: 'Platinum' },
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
    }, [activePeriod, loadLeaderboard]);

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
        0: { height: 'h-20', bg: 'bg-slate-200', medal: <Medal className="w-5 h-5 text-slate-500" />, textSize: 'text-sm', avatarSize: 'w-12 h-12', rank: 2 },
        1: { height: 'h-28', bg: 'bg-yellow-100', medal: <Crown className="w-6 h-6 text-yellow-500" />, textSize: 'text-base', avatarSize: 'w-14 h-14', rank: 1 },
        2: { height: 'h-16', bg: 'bg-amber-100', medal: <Medal className="w-5 h-5 text-amber-600" />, textSize: 'text-sm', avatarSize: 'w-11 h-11', rank: 3 },
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50 px-6 py-5 shrink-0 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-slate-900 font-bold text-xl leading-tight tracking-tight">Leaderboard</h2>
                                <p className="text-slate-500 font-medium text-xs mt-0.5">Top contributors by reputation</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Period tabs */}
                    <div className="flex bg-slate-200/50 rounded-xl p-1 mt-6 gap-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activePeriod === p.key
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                                onClick={() => handlePeriodChange(p.key)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium text-sm">Loading leaderboard...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <span className="text-5xl mb-4">⚠️</span>
                            <p className="text-slate-900 font-bold mb-1">Failed to load</p>
                            <p className="text-slate-500 text-sm mb-4">{error}</p>
                            <button
                                onClick={() => loadLeaderboard(activePeriod)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : !data?.leaderboard?.length ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                            <Trophy className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-slate-900 font-bold mb-1">No data yet</p>
                            <p className="text-slate-500 font-medium text-sm">Send messages and get upvotes to appear here!</p>
                        </div>
                    ) : (
                        <>
                            {/* Podium */}
                            {topThree.length >= 2 && (
                                <div className="px-6 pt-8 pb-4 bg-white border-b border-slate-200">
                                    <div className="flex items-end justify-center gap-3 h-44">
                                        {podiumOrder.map((entry, idx) => {
                                            if (!entry) return null;
                                            const style = podiumSizes[idx];
                                            const isMe = entry.user_id === user?.id;
                                            return (
                                                <div key={entry.user_id} className="flex flex-col items-center gap-1 flex-1 max-w-[140px]">
                                                    {style.rank === 1 && (
                                                        <div className="mb-0.5 animate-bounce">
                                                            {style.medal}
                                                        </div>
                                                    )}

                                                    <div className={`${style.avatarSize} rounded-full overflow-hidden border-2 ${
                                                        style.rank === 1 ? 'border-yellow-400' :
                                                        style.rank === 2 ? 'border-slate-300' : 'border-amber-400'
                                                    } shadow-sm flex-shrink-0 bg-slate-100 flex items-center justify-center text-slate-600 font-black ${isMe ? 'ring-2 ring-primary ring-offset-2 ring-offset-white' : ''}`}>
                                                        {entry.profile_pic ? (
                                                            <img src={entry.profile_pic} alt={entry.email} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-lg">{entry.email?.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>

                                                    <p className={`font-bold truncate w-full text-center tracking-tight ${style.textSize} ${isMe ? 'text-primary' : 'text-slate-900'}`}>
                                                        {entry.email?.split('@')[0]}
                                                        {isMe && ' (you)'}
                                                    </p>

                                                    <p className="text-xs text-slate-500 font-medium">{entry.reputation_points} pts</p>

                                                    <div className={`w-full ${style.height} ${style.bg} rounded-t-xl flex items-start justify-center pt-2 border border-b-0 ${
                                                        style.rank === 1 ? 'border-yellow-200' :
                                                        style.rank === 2 ? 'border-slate-300' : 'border-amber-200'
                                                    }`}>
                                                        <span className="text-slate-900/60 font-black text-sm">{style.rank}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* My Position Banner (if not in top 3) */}
                            {myEntry && myEntry.rank > 3 && (
                                <div className="mx-4 mt-4 mb-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                                    <div className="w-9 h-9 rounded-full bg-white border border-primary/20 flex items-center justify-center text-primary font-black text-sm overflow-hidden shrink-0">
                                        {myEntry.profile_pic ? (
                                            <img src={myEntry.profile_pic} alt={myEntry.email} className="w-full h-full object-cover" />
                                        ) : (
                                            myEntry.email?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 font-bold text-sm truncate tracking-tight">Your Position</p>
                                        <p className="text-slate-600 font-medium text-xs">{myEntry.reputation_points} pts · #{myEntry.rank}</p>
                                    </div>
                                    <span className="text-primary font-black text-lg">#{myEntry.rank}</span>
                                </div>
                            )}

                            {/* Rankings list */}
                            <div className="px-4 py-4 space-y-1">
                                {(topThree.length >= 3 ? restOfTop : data.leaderboard).map((entry) => {
                                    const isMe = entry.user_id === user?.id;
                                    const rankTier = getRankTier(entry.rank);
                                    const tierStyle = rankTier ? TIER_STYLES[rankTier] : null;

                                    return (
                                        <div
                                            key={entry.user_id}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all border border-transparent ${
                                                isMe
                                                    ? 'bg-primary/5 border-primary/20 shadow-sm'
                                                    : 'hover:bg-white hover:border-slate-200 hover:shadow-sm'
                                            }`}
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                                tierStyle
                                                    ? `${tierStyle.bg} border ${tierStyle.border} ${tierStyle.text}`
                                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                            }`}>
                                                {entry.rank}
                                            </div>

                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                                {entry.profile_pic ? (
                                                    <img src={entry.profile_pic} alt={entry.email} className="w-full h-full object-cover" />
                                                ) : (
                                                    entry.email?.charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className={`font-bold text-sm truncate tracking-tight ${isMe ? 'text-primary' : 'text-slate-900'}`}>
                                                    {entry.email?.split('@')[0]}
                                                    {isMe && <span className="text-xs font-medium text-slate-500 ml-1">(you)</span>}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {entry.total_messages} msgs · {entry.helpful_votes} upvotes
                                                </p>
                                            </div>

                                            {entry.top_badges?.length > 0 && (
                                                <div className="flex gap-1 shrink-0">
                                                    {entry.top_badges.slice(0, 3).map((badge, i) => (
                                                        <span key={i} className="text-base" title={badge.name}>{badge.icon}</span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-slate-900 text-sm">{entry.reputation_points}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">pts</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-white border-t border-slate-200 text-center shrink-0">
                    <p className="text-xs font-medium text-slate-500">
                        Rankings update in real-time based on messages & upvotes received
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
