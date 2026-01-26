import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import './ServerList.css';

const ServerList = () => {
    const {
        communities,
        currentCommunity,
        setCurrentCommunity,
        createCommunity,
        joinCommunity,
        viewMode,
        setViewMode,
        setCurrentDM
    } = useCommunity();

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'join'
    const [serverName, setServerName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    const handleHomeClick = () => {
        setViewMode('dms');
        setCurrentCommunity(null);
        setCurrentDM(null);
    };

    const handleServerClick = (community) => {
        setViewMode('community');
        setCurrentCommunity(community);
    };

    const handleCreateServer = async () => {
        if (!serverName.trim()) return;
        try {
            await createCommunity(serverName);
            setShowModal(false);
            setServerName('');
            setError('');
        } catch (err) {
            setError('Failed to create server');
        }
    };

    const handleJoinServer = async () => {
        if (!joinCode.trim()) return;
        try {
            await joinCommunity(joinCode);
            setShowModal(false);
            setJoinCode('');
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to join server');
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setShowModal(true);
        setError('');
    };

    const openJoinModal = () => {
        setModalMode('join');
        setShowModal(true);
        setError('');
    };

    return (
        <div className="server-list">
            {/* Home Button (DMs) */}
            <div
                className={`server-icon home-icon ${viewMode === 'dms' ? 'active' : ''}`}
                onClick={handleHomeClick}
                title="Direct Messages"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
                    <path d="M7 9h10v2H7zm0-3h10v2H7z" />
                </svg>
            </div>

            <div className="server-separator"></div>

            {/* Server Icons */}
            {communities.map((community) => (
                <div
                    key={community.id}
                    className={`server-icon ${currentCommunity?.id === community.id && viewMode === 'community' ? 'active' : ''}`}
                    onClick={() => handleServerClick(community)}
                    title={community.name}
                >
                    {community.icon ? (
                        <img src={community.icon} alt={community.name} />
                    ) : (
                        <span>{community.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>
            ))}

            {/* Add Server Button */}
            <div className="server-icon add-server" onClick={openCreateModal} title="Add a Server">
                <span>+</span>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-tabs">
                            <button
                                className={modalMode === 'create' ? 'active' : ''}
                                onClick={() => setModalMode('create')}
                            >
                                Create
                            </button>
                            <button
                                className={modalMode === 'join' ? 'active' : ''}
                                onClick={() => setModalMode('join')}
                            >
                                Join
                            </button>
                        </div>

                        {modalMode === 'create' ? (
                            <div className="modal-form">
                                <h3>Create a Server</h3>
                                <input
                                    type="text"
                                    placeholder="Server Name"
                                    value={serverName}
                                    onChange={(e) => setServerName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateServer()}
                                />
                                <button onClick={handleCreateServer}>Create</button>
                            </div>
                        ) : (
                            <div className="modal-form">
                                <h3>Join a Server</h3>
                                <input
                                    type="text"
                                    placeholder="Invite Code"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleJoinServer()}
                                />
                                <button onClick={handleJoinServer}>Join</button>
                            </div>
                        )}

                        {error && <p className="modal-error">{error}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServerList;
