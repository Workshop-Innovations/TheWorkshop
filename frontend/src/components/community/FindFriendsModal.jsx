import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { Search, X, Users, MessageSquare } from 'lucide-react';
import { resolveImageUrl } from '../../utils/imageUtils';

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
    }, [query, searchUsers]);

    const handleStartDM = async (userId) => {
        setStartingDM(userId);
        await startDM(userId);
        setStartingDM(null);
        onClose();
    };

    const getRepLabel = (points) => {
        if (points >= 500) return { label: 'Legend', color: 'text-purple-600', bg: 'bg-purple-100' };
        if (points >= 100) return { label: 'Top Contributor', color: 'text-amber-600', bg: 'bg-amber-100' };
        if (points >= 50) return { label: 'Voice', color: 'text-blue-600', bg: 'bg-blue-100' };
        if (points >= 10) return { label: 'Rising Star', color: 'text-emerald-600', bg: 'bg-emerald-100' };
        return { label: 'Newcomer', color: 'text-slate-500', bg: 'bg-slate-100' };
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[10vh] px-4" onClick={onClose}>
            <div
                className="bg-white rounded-md w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-slate-200 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-slate-900 font-bold text-lg tracking-tight">Find Friends</h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-md px-4 py-3 border border-slate-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium"
                            placeholder="Search by username or email..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        {loading && (
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-sm animate-spin shrink-0"></div>
                        )}
                        {query && !loading && (
                            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto custom-scrollbar bg-white">
                    {!query.trim() && (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center mb-4 shadow-sm">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-bold tracking-tight">Search for classmates</p>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Type a username or email to find people to message</p>
                        </div>
                    )}

                    {query.trim() && !loading && results.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                            <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-center mb-4 shadow-sm">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-900 font-bold tracking-tight">No users found</p>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Try a different search term</p>
                        </div>
                    )}

                    {results.map(u => {
                        const rep = getRepLabel(u.reputation_points || 0);
                        return (
                            <div
                                key={u.id}
                                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors group"
                            >
                                {/* Avatar */}
                                <div className="w-11 h-11 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-base shrink-0 overflow-hidden shadow-sm">
                                    {u.profile_pic ? (
                                        <img src={resolveImageUrl(u.profile_pic)} alt={u.username} className="w-full h-full object-cover" />
                                    ) : (
                                        u.username?.charAt(0).toUpperCase() || '?'
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-slate-900 font-bold text-sm truncate tracking-tight">{u.username}</p>
                                    <p className="text-slate-500 text-xs truncate font-medium">{u.email}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs font-bold text-slate-600">{u.reputation_points} pts</span>
                                        <span className="text-slate-300">â€¢</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${rep.color} ${rep.bg}`}>
                                            {rep.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    className="shrink-0 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-50 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                                    onClick={() => handleStartDM(u.id)}
                                    disabled={startingDM === u.id}
                                >
                                    {startingDM === u.id ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-slate-300 border-t-primary rounded-sm animate-spin"></div>
                                            Opening
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            Message
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FindFriendsModal;
