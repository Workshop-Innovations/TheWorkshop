import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';


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
        <div className="w-[72px] bg-slate-900 flex flex-col items-center py-4 gap-3 h-full shrink-0 z-20 shadow-xl overflow-y-auto no-scrollbar overflow-x-hidden">
            {/* Home Button (DMs) */}
            <div
                className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer group relative ${viewMode === 'dms' ? 'bg-primary text-white rounded-[16px]' : 'bg-slate-700 text-slate-100 hover:bg-primary hover:text-white'}`}
                onClick={handleHomeClick}
            >
                {viewMode === 'dms' && (
                    <div className="absolute -left-4 w-2 h-10 bg-white rounded-r-lg" />
                )}
                <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
                    <path d="M7 9h10v2H7zm0-3h10v2H7z" />
                </svg>
                {/* Tooltip */}
                <div className="absolute left-[70px] bg-black text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Direct Messages
                </div>
            </div>

            <div className="w-8 h-[2px] bg-slate-700/50 rounded-full my-1"></div>

            {/* Server Icons */}
            {communities.map((community) => (
                <div
                    key={community.id}
                    className="relative group w-full flex justify-center"
                >
                    {currentCommunity?.id === community.id && viewMode === 'community' && (
                        <div className="absolute -left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-white rounded-r-lg" />
                    )}

                    <div
                        className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer overflow-hidden relative ${currentCommunity?.id === community.id && viewMode === 'community' ? 'rounded-[16px] ring-2 ring-primary ring-offset-2 ring-offset-slate-900' : 'bg-slate-700 hover:bg-primary text-slate-100'}`}
                        onClick={() => handleServerClick(community)}
                    >
                        {community.icon ? (
                            <img src={community.icon} alt={community.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="font-bold text-lg">{community.name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>

                    {/* Tooltip */}
                    <div className="absolute left-[70px] top-1/2 -translate-y-1/2 bg-black text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                        {community.name}
                    </div>
                </div>
            ))}

            {/* Add Server Button */}
            <div
                className="w-12 h-12 rounded-[24px] bg-slate-700 text-emerald-500 hover:bg-emerald-500 hover:text-white hover:rounded-[16px] transition-all duration-300 flex items-center justify-center cursor-pointer group relative mt-2"
                onClick={openCreateModal}
            >
                <span className="text-3xl font-light pb-1">+</span>
                <div className="absolute left-[70px] bg-black text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    Add Server
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-slate-900 text-center mb-6">
                                {modalMode === 'create' ? 'Customize Your Server' : 'Join a Server'}
                            </h3>

                            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                                <button
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${modalMode === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setModalMode('create')}
                                >
                                    Create
                                </button>
                                <button
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${modalMode === 'join' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    onClick={() => setModalMode('join')}
                                >
                                    Join
                                </button>
                            </div>

                            {modalMode === 'create' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Server Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            placeholder="My Awesome Server"
                                            value={serverName}
                                            onChange={(e) => setServerName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleCreateServer()}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateServer}
                                        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
                                    >
                                        Create Server
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Invite Code</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            placeholder="dy83-k92m-..."
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleJoinServer()}
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={handleJoinServer}
                                        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/30"
                                    >
                                        Join Server
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex justify-end">
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-700 font-medium text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServerList;
