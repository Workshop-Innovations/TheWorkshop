import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import './Leaderboard.css';

const Leaderboard = ({ onClose }) => {
    const { members, user } = useCommunity();
    const [loading, setLoading] = useState(true);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [myPosition, setMyPosition] = useState(null);

    useEffect(() => {
        generateLeaderboard();
    }, [members]);

    const generateLeaderboard = () => {
        setLoading(true);

        // For now, we'll simulate message counts based on members
        // In production, this would come from an API endpoint
        const mockData = members.map((member, index) => ({
            user_id: member.user_id,
            email: member.user_email,
            messages_this_month: Math.floor(Math.random() * 150) + 10, // Simulated
            avatar_initial: member.user_email?.charAt(0).toUpperCase() || '?'
        }));

        // Sort by messages (descending)
        mockData.sort((a, b) => b.messages_this_month - a.messages_this_month);

        // Add rank
        const ranked = mockData.map((entry, idx) => ({
            ...entry,
            rank: idx + 1
        }));

        setLeaderboardData(ranked);

        // Find user's position
        const userEntry = ranked.find(e => e.user_id === user?.id);
        if (userEntry) {
            setMyPosition(userEntry);
        }

        setLoading(false);
    };

    const topThree = leaderboardData.slice(0, 3);
    const restOfTop10 = leaderboardData.slice(3, 10);

    // Arrange podium: [2nd, 1st, 3rd]
    const podiumOrder = topThree.length >= 3
        ? [topThree[1], topThree[0], topThree[2]]
        : topThree;

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="leaderboard-header">
                    <div className="header-content">
                        <span className="trophy-icon">🏆</span>
                        <div className="header-text">
                            <h2>Leaderboard</h2>
                            <span className="subtitle">Messages This Month</span>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="leaderboard-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading leaderboard...</p>
                        </div>
                    ) : (
                        <>
                            {/* Podium Section */}
                            {topThree.length >= 3 && (
                                <div className="podium-section">
                                    <div className="podium">
                                        {/* 2nd Place */}
                                        <div className="podium-spot second">
                                            <div className="podium-avatar silver">
                                                {podiumOrder[0]?.avatar_initial}
                                            </div>
                                            <span className="podium-medal">🥈</span>
                                            <span className="podium-name">{podiumOrder[0]?.email?.split('@')[0]}</span>
                                            <span className="podium-score">{podiumOrder[0]?.messages_this_month} msgs</span>
                                            <div className="podium-bar silver-bar">
                                                <span className="podium-rank">2</span>
                                            </div>
                                        </div>

                                        {/* 1st Place */}
                                        <div className="podium-spot first">
                                            <div className="crown-icon">👑</div>
                                            <div className="podium-avatar gold">
                                                {podiumOrder[1]?.avatar_initial}
                                            </div>
                                            <span className="podium-medal">🥇</span>
                                            <span className="podium-name">{podiumOrder[1]?.email?.split('@')[0]}</span>
                                            <span className="podium-score">{podiumOrder[1]?.messages_this_month} msgs</span>
                                            <div className="podium-bar gold-bar">
                                                <span className="podium-rank">1</span>
                                            </div>
                                        </div>

                                        {/* 3rd Place */}
                                        <div className="podium-spot third">
                                            <div className="podium-avatar bronze">
                                                {podiumOrder[2]?.avatar_initial}
                                            </div>
                                            <span className="podium-medal">🥉</span>
                                            <span className="podium-name">{podiumOrder[2]?.email?.split('@')[0]}</span>
                                            <span className="podium-score">{podiumOrder[2]?.messages_this_month} msgs</span>
                                            <div className="podium-bar bronze-bar">
                                                <span className="podium-rank">3</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Your Position Card */}
                            {myPosition && (
                                <div className="my-position-card">
                                    <div className="my-position-label">Your Position</div>
                                    <div className="my-position-content">
                                        <div className="my-rank-badge">#{myPosition.rank}</div>
                                        <div className="my-info">
                                            <span className="my-name">{myPosition.email?.split('@')[0]}</span>
                                            <span className="my-score">{myPosition.messages_this_month} messages this month</span>
                                        </div>
                                        {myPosition.rank <= 3 && (
                                            <span className="top-badge">🔥 Top 3!</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Rest of Top 10 */}
                            {restOfTop10.length > 0 && (
                                <div className="rankings-list">
                                    <h3 className="list-title">Top 10</h3>
                                    {restOfTop10.map(entry => (
                                        <div
                                            key={entry.user_id}
                                            className={`ranking-item ${entry.user_id === user?.id ? 'is-me' : ''}`}
                                        >
                                            <div className="rank-number">#{entry.rank}</div>
                                            <div className="ranking-avatar">
                                                {entry.avatar_initial}
                                            </div>
                                            <div className="ranking-info">
                                                <span className="ranking-name">
                                                    {entry.email?.split('@')[0]}
                                                    {entry.user_id === user?.id && <span className="you-tag">You</span>}
                                                </span>
                                            </div>
                                            <div className="ranking-score">
                                                <span className="score-value">{entry.messages_this_month}</span>
                                                <span className="score-label">msgs</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty State */}
                            {leaderboardData.length === 0 && (
                                <div className="empty-state">
                                    <span className="empty-icon">📊</span>
                                    <p>No activity yet this month</p>
                                    <span className="empty-hint">Start sending messages to climb the leaderboard!</span>
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
