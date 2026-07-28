import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from '../../context/CommunityContext';

const SharedNotes = ({ onClose }) => {
    const { currentChannel, fetchChannelNotes, createNote, updateNote, user } = useCommunity();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (currentChannel) loadNotes();
    }, [currentChannel]);

    useEffect(() => {
        if (isEditing) titleInputRef.current?.focus();
    }, [isEditing]);

    const loadNotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchChannelNotes(currentChannel.id);
            setNotes(data || []);
        } catch {
            setError('Failed to load notes');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        setSaving(true);
        const newNote = await createNote(currentChannel.id, {
            title: formData.title,
            content: formData.content,
        });
        setSaving(false);
        if (newNote) {
            setNotes([newNote, ...notes]);
            setFormData({ title: '', content: '' });
            setSelectedNote(newNote);
            setIsEditing(false);
        } else {
            setError('Failed to create note');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedNote || !formData.title.trim()) return;
        setSaving(true);
        const updated = await updateNote(selectedNote.id, {
            title: formData.title,
            content: formData.content,
            version: selectedNote.version,
        });
        setSaving(false);
        if (updated) {
            setNotes(notes.map(n => n.id === updated.id ? updated : n));
            setSelectedNote(updated);
            setIsEditing(false);
            setError(null);
        } else {
            setError('Failed to save — the note may have been edited by someone else. Refreshing...');
            loadNotes();
        }
    };

    const startEditing = (note = null) => {
        if (note) {
            setFormData({ title: note.title, content: note.content || '' });
        } else {
            setFormData({ title: '', content: '' });
            setSelectedNote(null);
        }
        setIsEditing(true);
        setError(null);
    };

    const formatDate = (ts) => new Date(ts).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const renderEditor = () => (
        <form onSubmit={selectedNote ? handleUpdate : handleCreate} className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-700 shrink-0">
                <button
                    type="button"
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 mr-1"
                    onClick={() => setIsEditing(false)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h3 className="text-white font-bold text-sm">{selectedNote ? 'Edit Note' : 'New Note'}</h3>
                <div className="flex-1"></div>
                <button
                    type="submit"
                    disabled={saving || !formData.title.trim()}
                    className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                    {saving ? 'Saving...' : selectedNote ? 'Save Changes' : 'Create Note'}
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <input
                    ref={titleInputRef}
                    type="text"
                    className="w-full px-6 py-4 bg-transparent border-b border-slate-700/50 text-white font-black text-xl placeholder-slate-600 focus:outline-none"
                    placeholder="Note title..."
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                />
                <textarea
                    className="flex-1 w-full px-6 py-4 bg-transparent text-slate-300 placeholder-slate-600 focus:outline-none resize-none text-sm leading-relaxed"
                    placeholder="Write your note here... You can use markdown formatting."
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
            </div>
        </form>
    );

    const renderDetail = () => (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-700 shrink-0">
                <button
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 mr-1"
                    onClick={() => setSelectedNote(null)}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-white font-black text-base truncate">{selectedNote.title}</h2>
                </div>
                <button
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    onClick={() => startEditing(selectedNote)}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                    Edit
                </button>
            </div>

            <div className="px-6 py-2 border-b border-slate-700/40 flex items-center gap-4 shrink-0">
                <span className="text-xs text-slate-500">
                    By <span className="text-slate-400 font-semibold">{selectedNote.creator_email?.split('@')[0]}</span>
                </span>
                <span className="text-slate-700">·</span>
                <span className="text-xs text-slate-500">
                    Updated {formatDate(selectedNote.updated_at)}
                </span>
                {selectedNote.version > 1 && (
                    <span className="text-xs bg-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                        v{selectedNote.version}
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
                {selectedNote.content ? (
                    <div className="prose prose-sm max-w-none">
                        {selectedNote.content.split('\n').map((line, i) => (
                            line.trim() === '' ? <br key={i} /> :
                            line.startsWith('# ') ? <h1 key={i} className="text-white text-xl font-black mt-4 mb-2">{line.replace(/^#+ /, '')}</h1> :
                            line.startsWith('## ') ? <h2 key={i} className="text-white text-lg font-bold mt-3 mb-1.5">{line.replace(/^#+ /, '')}</h2> :
                            line.startsWith('### ') ? <h3 key={i} className="text-white text-base font-bold mt-2 mb-1">{line.replace(/^#+ /, '')}</h3> :
                            line.startsWith('- ') || line.startsWith('* ') ? <li key={i} className="text-slate-300 text-sm leading-relaxed ml-4">{line.replace(/^[-*] /, '')}</li> :
                            <p key={i} className="text-slate-300 text-sm leading-relaxed mb-1">{line}</p>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="text-4xl mb-3 opacity-30">📄</span>
                        <p className="text-slate-500 text-sm">This note is empty.</p>
                        <button
                            className="mt-3 text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors"
                            onClick={() => startEditing(selectedNote)}
                        >
                            Add content →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderList = () => (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3 shrink-0">
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
                    onClick={() => startEditing(null)}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    New Note
                </button>
                <span className="text-xs text-slate-500 ml-auto">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 text-sm">Loading notes...</p>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <span className="text-6xl mb-4 opacity-30">📝</span>
                        <h3 className="text-white font-bold text-base mb-1">No shared notes yet</h3>
                        <p className="text-slate-500 text-sm mb-5">Create a note to share knowledge with your community</p>
                        <button
                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors"
                            onClick={() => startEditing(null)}
                        >
                            Create First Note
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 rounded-xl p-4 cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-lg"
                                onClick={() => { setSelectedNote(note); setIsEditing(false); }}
                            >
                                <h3 className="text-white font-bold text-sm truncate mb-1.5 group-hover:text-indigo-300 transition-colors">
                                    {note.title}
                                </h3>
                                {note.content && (
                                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-3">
                                        {note.content.replace(/^[#*-\s]+/gm, '')}
                                    </p>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        {note.creator_email?.split('@')[0]}
                                    </span>
                                    <span className="text-xs text-slate-600">
                                        {new Date(note.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-800 rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                            <span className="text-xl">📝</span>
                        </div>
                        <div>
                            <h2 className="text-white font-black text-base">Shared Notes</h2>
                            <p className="text-slate-500 text-xs">
                                #{currentChannel?.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-6 mt-3 px-4 py-2.5 bg-red-900/30 border border-red-700/40 rounded-xl text-red-300 text-sm flex items-center gap-2 shrink-0">
                        <span>⚠️</span>{error}
                        <button className="ml-auto text-red-400 hover:text-red-300 text-xs font-bold" onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-hidden">
                    {isEditing
                        ? renderEditor()
                        : selectedNote
                            ? renderDetail()
                            : renderList()
                    }
                </div>
            </div>
        </div>
    );
};

export default SharedNotes;
