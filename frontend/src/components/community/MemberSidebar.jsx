import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import Leaderboard from './Leaderboard';
import './MemberSidebar.css';

const MemberSidebar = () => {
    const {
        members,
        currentCommunity,
        viewMode,
        startDM,
        user,
        onlineUsers
    } = useCommunity();

    const [showLeaderboard, setShowLeaderboard] = useState(false);

    if (viewMode === 'dms' || !currentCommunity) {
        return null;
    }

    const handleStartDM = async (member) => {
        if (member.user_id === user?.id) return; // Can't DM yourself
        await startDM(member.user_id);
    };

    // Separate online and offline members
    const onlineMemberIds = new Set(onlineUsers);
    const onlineMembers = members.filter(m => onlineMemberIds.has(m.user_id));
    const offlineMembers = members.filter(m => !onlineMemberIds.has(m.user_id));

    return (
        <div className="member-sidebar">
            {/* Leaderboard Button */}
            <div className="leaderboard-btn-container">
                <button
                    className="leaderboard-btn"
                    onClick={() => setShowLeaderboard(true)}
                >
                    🏆 Leaderboard
                </button>
            </div>

            <div className="member-section">
                <h4 className="member-section-title">
                    Online — {onlineMembers.length}
                </h4>
                {onlineMembers.map((member) => (
                    <div
                        key={member.id}
                        className="member-item"
                        onClick={() => handleStartDM(member)}
                        title={member.user_id === user?.id ? 'You' : 'Click to DM'}
                    >
                        <div className="member-avatar online">
                            {member.user_email?.charAt(0).toUpperCase() || '?'}
                            <span className="status-dot online"></span>
                        </div>
                        <div className="member-info">
                            <span className="member-name">
                                {member.user_email?.split('@')[0] || 'User'}
                                {member.user_id === user?.id && ' (you)'}
                            </span>
                            {member.role !== 'member' && (
                                <span className={`member-role ${member.role}`}>
                                    {member.role}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="member-section">
                <h4 className="member-section-title">
                    Offline — {offlineMembers.length}
                </h4>
                {offlineMembers.map((member) => (
                    <div
                        key={member.id}
                        className="member-item offline"
                        onClick={() => handleStartDM(member)}
                        title={member.user_id === user?.id ? 'You' : 'Click to DM'}
                    >
                        <div className="member-avatar">
                            {member.user_email?.charAt(0).toUpperCase() || '?'}
                            <span className="status-dot offline"></span>
                        </div>
                        <div className="member-info">
                            <span className="member-name">
                                {member.user_email?.split('@')[0] || 'User'}
                                {member.user_id === user?.id && ' (you)'}
                            </span>
                            {member.role !== 'member' && (
                                <span className={`member-role ${member.role}`}>
                                    {member.role}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showLeaderboard && (
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
            )}
        </div>
    );
};

export default MemberSidebar;
