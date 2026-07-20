import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from '../../context/CommunityContext';

const FindFriendsModal = ({ onClose }) => {
    const { searchUsers, startDM } = useCommunity();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingDM, setStartingDM] = useState(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            const data = await searchUsers(query);
            setResults(data || []);
            setLoading(false);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const handleStartDM = async (userId) => {
        setStartingDM(userId);
        await startDM(userId);
        setStartingDM(null);
        onClose();
    };

    const getRepLabel = (points) => {
        if (points >= 500) return { label: 'Legend', color: 'text-purple-400' };
        if (points >= 100) return { label: 'Top Contributor', color: 'text-amber-400' };
        if (points >= 50) return { label: 'Voice', color: 'text-blue-400' };
        if (points >= 10) return { label: 'Rising Star', color: 'text-emerald-400' };
        return { label: 'Newcomer', color: 'text-slate-400' };
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
            <div
                className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-700">
                    <h2 className="text-white font-black text-lg mb-3">Find Friends</h2>
                    <div className="flex items-center gap-3 bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-700 focus-within:border-indigo-500 transition-colors">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500 shrink-0">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none text-sm"
                            placeholder="Search by username or email..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {loading && (
                            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shrink-0"></div>
                        )}
                        {query && !loading && (
                            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {!query.trim() && (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="text-5xl mb-4 opacity-40">👥</div>
                            <p className="text-slate-400 font-semibold">Search for classmates</p>
                            <p className="text-slate-500 text-sm mt-1">Type a username or email to find people to message</p>
                        </div>
                    )}

                    {query.trim() && !loading && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="text-4xl mb-3 opacity-40">🔍</div>
                            <p className="text-slate-400 font-semibold">No users found</p>
                            <p className="text-slate-500 text-sm mt-1">Try a different search term</p>
                        </div>
                    )}

                    {results.map(u => {
                        const rep = getRepLabel(u.reputation_points || 0);
                        return (
                            <div
                                key={u.id}
                                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-700/50 transition-colors group"
                            >
                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden shadow-lg">
                                    {u.profile_pic ? (
                                        <img src={u.profile_pic} alt={u.username} className="w-full h-full object-cover" />
                                    ) : (
                                        u.username?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{u.username}</p>
                                    <p className="text-slate-500 text-xs truncate">{u.email}</p>
                                    <p className={`text-xs font-semibold mt-0.5 ${rep.color}`}>
                                        {u.reputation_points} pts · {rep.label}
                                    </p>
                                </div>

                                {/* Action */}
                                <button
                                    className="shrink-0 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleStartDM(u.id)}
                                    disabled={startingDM === u.id}
                                >
                                    {startingDM === u.id ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Opening...
                                        </div>
                                    ) : 'Message'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-700 flex justify-end">
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 font-semibold text-sm transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FindFriendsModal;
