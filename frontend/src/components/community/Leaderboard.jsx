import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { useAuth } from '../../context/AuthContext';

const Leaderboard = ({ onClose }) => {
    const { user } = useCommunity();
    const { accessToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [myPosition, setMyPosition] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/community/leaderboard?limit=20`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setLeaderboardData(data.entries);
                    const userEntry = data.entries.find(e => e.user_id === user?.id);
                    if (userEntry) setMyPosition(userEntry);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [accessToken, user]);

    const topThree = leaderboardData.slice(0, 3);
    const restOfTop10 = leaderboardData.slice(3, 10);

    // Arrange podium: [2nd, 1st, 3rd]
    const podiumOrder = topThree.length >= 3
        ? [topThree[1], topThree[0], topThree[2]]
        : topThree;

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🏆</span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 m-0">Leaderboard</h2>
                            <span className="text-sm text-slate-500">Reputation Points</span>
                        </div>
                    </div>
                    <button className="text-3xl text-slate-400 hover:text-slate-800 transition-colors" onClick={onClose}>×</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {loading ? (
                        <div className="text-center text-slate-500 py-12 flex flex-col items-center gap-4">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p>Loading leaderboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Podium Section */}
                            {topThree.length >= 3 && (
                                <div className="flex items-end justify-center gap-4 h-64 mb-10 pt-8">
                                    {/* 2nd Place */}
                                    <div className="flex flex-col items-center w-28 relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-slate-300 flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-xl overflow-hidden shadow-lg z-10 -mb-4">
                                            {podiumOrder[0]?.profile_pic ? (
                                                <img src={podiumOrder[0].profile_pic} alt="2nd" className="w-full h-full object-cover" />
                                            ) : (
                                                podiumOrder[0]?.email?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-20 drop-shadow-md">🥈</span>
                                        <div className="bg-slate-200 w-full h-28 rounded-t-lg flex flex-col items-center pt-6 shadow-inner relative">
                                            <span className="text-sm font-bold text-slate-700 truncate w-full text-center px-1">{podiumOrder[0]?.email?.split('@')[0]}</span>
                                            <span className="text-xs text-slate-500 font-medium">{podiumOrder[0]?.reputation_points} pts</span>
                                            <span className="text-3xl font-black text-slate-300/50 absolute bottom-2">2</span>
                                        </div>
                                    </div>

                                    {/* 1st Place */}
                                    <div className="flex flex-col items-center w-32 relative">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl z-20 animate-bounce drop-shadow-md">👑</div>
                                        <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center bg-amber-50 text-amber-700 font-bold text-2xl overflow-hidden shadow-[0_0_15px_rgba(251,191,36,0.5)] z-10 -mb-4">
                                            {podiumOrder[1]?.profile_pic ? (
                                                <img src={podiumOrder[1].profile_pic} alt="1st" className="w-full h-full object-cover" />
                                            ) : (
                                                podiumOrder[1]?.email?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl z-20 drop-shadow-md">🥇</span>
                                        <div className="bg-amber-100 w-full h-36 rounded-t-lg flex flex-col items-center pt-6 shadow-inner relative">
                                            <span className="text-base font-bold text-amber-900 truncate w-full text-center px-1">{podiumOrder[1]?.email?.split('@')[0]}</span>
                                            <span className="text-xs text-amber-700 font-bold">{podiumOrder[1]?.reputation_points} pts</span>
                                            <span className="text-4xl font-black text-amber-500/30 absolute bottom-2">1</span>
                                        </div>
                                    </div>

                                    {/* 3rd Place */}
                                    <div className="flex flex-col items-center w-28 relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-amber-700/60 flex items-center justify-center bg-amber-900/10 text-amber-900/60 font-bold text-xl overflow-hidden shadow-lg z-10 -mb-4">
                                            {podiumOrder[2]?.profile_pic ? (
                                                <img src={podiumOrder[2].profile_pic} alt="3rd" className="w-full h-full object-cover" />
                                            ) : (
                                                podiumOrder[2]?.email?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl z-20 drop-shadow-md">🥉</span>
                                        <div className="bg-amber-900/10 w-full h-24 rounded-t-lg flex flex-col items-center pt-6 shadow-inner relative">
                                            <span className="text-sm font-bold text-amber-900/70 truncate w-full text-center px-1">{podiumOrder[2]?.email?.split('@')[0]}</span>
                                            <span className="text-xs text-amber-700/60 font-medium">{podiumOrder[2]?.reputation_points} pts</span>
                                            <span className="text-3xl font-black text-amber-900/10 absolute bottom-2">3</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Your Position Card */}
                            {myPosition && (
                                <div className="mb-8">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Your Position</div>
                                    <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                                            #{myPosition.rank}
                                        </div>
                                        <div className="flex-1">
                                            <span className="block font-bold text-slate-800">{myPosition.email?.split('@')[0]}</span>
                                            <span className="text-sm text-slate-500">{myPosition.reputation_points} pts</span>
                                        </div>
                                        {myPosition.rank <= 3 && (
                                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">🔥 Top 3!</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Rest of Top 10 */}
                            {restOfTop10.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Top 10</h3>
                                    {restOfTop10.map(entry => (
                                        <div
                                            key={entry.user_id}
                                            className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${entry.user_id === user?.id ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                                        >
                                            <div className="w-8 font-bold text-slate-400 text-center">#{entry.rank}</div>
                                            <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 font-bold text-sm overflow-hidden shrink-0 shadow-sm">
                                                {entry.profile_pic ? (
                                                    <img src={entry.profile_pic} alt={entry.email} className="w-full h-full object-cover" />
                                                ) : (
                                                    entry.email?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-semibold text-slate-800 truncate block">
                                                    {entry.email?.split('@')[0]}
                                                    {entry.user_id === user?.id && <span className="ml-2 text-[10px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">You</span>}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-slate-700">{entry.reputation_points}</span>
                                                <span className="text-xs text-slate-400 ml-1">pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {leaderboardData.length === 0 && (
                                <div className="text-center text-slate-500 py-12">
                                    <span className="text-4xl block mb-4 opacity-50">📊</span>
                                    <p className="font-medium text-slate-700">No activity yet</p>
                                    <span className="text-sm">Start sending messages to climb the leaderboard!</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
