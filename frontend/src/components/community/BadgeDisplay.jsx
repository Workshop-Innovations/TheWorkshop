import React from 'react';
import './BadgeDisplay.css';

const BadgeDisplay = ({ badges, size = 'medium', showTooltip = true }) => {
    if (!badges || badges.length === 0) return null;

    const getTierGradient = (tier) => {
        switch (tier) {
            case 'platinum':
                return 'linear-gradient(135deg, #e5e4e2, #a8a8a8)';
            case 'gold':
                return 'linear-gradient(135deg, #ffd700, #ffb700)';
            case 'silver':
                return 'linear-gradient(135deg, #c0c0c0, #808080)';
            case 'bronze':
                return 'linear-gradient(135deg, #cd7f32, #8b4513)';
            default:
                return 'linear-gradient(135deg, #667eea, #764ba2)';
        }
    };

    const sizeClasses = {
        small: 'badge-sm',
        medium: 'badge-md',
        large: 'badge-lg'
    };

    return (
        <div className={`badge-display ${sizeClasses[size]}`}>
            {badges.slice(0, 5).map(badge => (
                <div
                    key={badge.id}
                    className="badge-item"
                    style={{ background: getTierGradient(badge.tier) }}
                    title={showTooltip ? `${badge.name}: ${badge.description}` : ''}
                >
                    <span className="badge-icon">{badge.icon}</span>
                    {size === 'large' && (
                        <span className="badge-name">{badge.name}</span>
                    )}
                </div>
            ))}
            {badges.length > 5 && (
                <div className="badge-more">
                    +{badges.length - 5}
                </div>
            )}
        </div>
    );
};

export default BadgeDisplay;
