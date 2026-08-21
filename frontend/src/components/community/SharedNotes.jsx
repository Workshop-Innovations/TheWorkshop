import React, { useState, useEffect, useRef } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { FileText, Plus, X, Edit2, AlertCircle, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const remarkPlugins = [
    [remarkMath, { singleDollarTextMath: true }],
    remarkGfm,
];

const rehypePlugins = [
    [rehypeKatex, { throwOnError: false, strict: false, trust: true }],
];

const SharedNotes = ({ onClose }) => {
    const { currentChannel, fetchChannelNotes, createNote, updateNote, user } = useCommunity();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [tikzLoaded, setTikzLoaded] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '' });
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (currentChannel) loadNotes();
    }, [currentChannel]);

    useEffect(() => {
        if (isEditing) titleInputRef.current?.focus();
    }, [isEditing]);

    // Load TikZJax script dynamically
    useEffect(() => {
        if (!document.getElementById('tikzjax-script')) {
            const script = document.createElement('script');
            script.id = 'tikzjax-script';
            script.src = 'https://tikzjax.com/v1/tikzjax.js';
            script.async = true;
            script.onload = () => setTikzLoaded(true);
            document.head.appendChild(script);

            const link = document.createElement('link');
            link.id = 'tikzjax-css';
            link.rel = 'stylesheet';
            link.href = 'https://tikzjax.com/v1/fonts.css';
            document.head.appendChild(link);
        } else {
            setTikzLoaded(true);
        }
    }, []);

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
            setError('Failed to save - the note may have been edited by someone else. Refreshing...');
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
        <form onSubmit={selectedNote ? handleUpdate : handleCreate} className="h-full flex flex-col bg-slate-50">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 shrink-0 bg-white">
                <button
                    type="button"
                    className="text-slate-500 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100 mr-2"
                    onClick={() => setIsEditing(false)}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-slate-900 font-bold text-sm tracking-tight">{selectedNote ? 'Edit Note' : 'New Note'}</h3>
                <div className="flex-1"></div>
                <button
                    type="submit"
                    disabled={saving || !formData.title.trim()}
                    className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                >
                    {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-sm animate-spin"></div>}
                    {saving ? 'Saving...' : selectedNote ? 'Save Changes' : 'Create Note'}
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <input
                    ref={titleInputRef}
                    type="text"
                    className="w-full px-8 py-5 bg-white border-b border-slate-200 text-slate-900 font-bold text-2xl placeholder-slate-400 focus:outline-none tracking-tight"
                    placeholder="Note title..."
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                />
                <textarea
                    className="flex-1 w-full px-8 py-6 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none resize-none text-[15px] leading-relaxed custom-scrollbar"
                    placeholder="Write your note here... You can use markdown formatting."
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
            </div>
        </form>
    );

    const renderDetail = () => (
        <div className="h-full flex flex-col bg-white">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 shrink-0">
                <button
                    className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                    onClick={() => setSelectedNote(null)}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-slate-900 font-bold text-xl truncate tracking-tight">{selectedNote.title}</h2>
                </div>
                <button
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-md transition-colors flex items-center gap-2 shadow-sm"
                    onClick={() => startEditing(selectedNote)}
                >
                    <Edit2 className="w-4 h-4" />
                    Edit
                </button>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 shrink-0">
                <span className="text-xs text-slate-500 font-medium">
                    By <span className="text-slate-700 font-bold">{selectedNote.creator_email?.split('@')[0]}</span>
                </span>
                <span className="text-slate-300"></span>
                <span className="text-xs text-slate-500 font-medium">
                    Updated {formatDate(selectedNote.updated_at)}
                </span>
                {selectedNote.version > 1 && (
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        v{selectedNote.version}
                    </span>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-white">
                {selectedNote.content ? (
                    <div className="prose prose-slate max-w-none prose-headings:tracking-tight prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 paper-content">
                        <style>{`
                            .paper-content .katex { font-size: 1em !important; }
                            .paper-content .katex-display { margin: 1rem 0; overflow-x: auto; }
                        `}</style>
                        <ReactMarkdown
                            remarkPlugins={remarkPlugins}
                            rehypePlugins={rehypePlugins}
                            components={{
                                pre({node, children, ...props}) {
                                    const codeElement = React.Children.toArray(children)[0];
                                    if (React.isValidElement(codeElement) && codeElement.props.className?.includes('language-tikz')) {
                                        const content = String(codeElement.props.children);
                                        return (
                                            <div className="tikz-diagram flex justify-center my-6 overflow-x-auto bg-slate-50 p-4 rounded-md border border-slate-100 not-prose min-h-[100px] items-center">
                                                {tikzLoaded ? (
                                                    <div dangerouslySetInnerHTML={{ __html: `<script type="text/tikz">${content.replace(/</g, '\\<')}</script>` }} />
                                                ) : (
                                                    <div className="text-slate-400 text-sm animate-pulse">Loading diagram engine...</div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return <pre {...props}>{children}</pre>;
                                }
                            }}
                        >
                            {selectedNote.content}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <FileText className="w-16 h-16 text-slate-200 mb-4" />
                        <p className="text-slate-500 text-sm font-medium">This note is empty.</p>
                        <button
                            className="mt-4 text-primary text-sm font-bold hover:text-primary/80 transition-colors flex items-center gap-1"
                            onClick={() => startEditing(selectedNote)}
                        >
                            <Edit2 className="w-4 h-4" /> Add content
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderList = () => (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Toolbar */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-4 shrink-0">
                <button
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                    onClick={() => startEditing(null)}
                >
                    <Plus className="w-4 h-4" />
                    New Note
                </button>
                <span className="text-xs font-bold text-slate-500 ml-auto bg-slate-100 px-3 py-1.5 rounded-md">{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-sm animate-spin"></div>
                        <p className="text-slate-500 text-sm font-medium">Loading notes...</p>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-sm flex items-center justify-center mb-4 shadow-sm">
                            <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2 tracking-tight">No shared notes yet</h3>
                        <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">Create a note to share knowledge, summaries, or study plans with your community.</p>
                        <button
                            className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                            onClick={() => startEditing(null)}
                        >
                            Create First Note
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {notes.map(note => (
                            <div
                                key={note.id}
                                className="bg-white border border-slate-200 hover:border-primary/40 rounded-md p-5 cursor-pointer transition-all group shadow-sm hover:shadow-md"
                                onClick={() => { setSelectedNote(note); setIsEditing(false); }}
                            >
                                <div className="flex items-start gap-3 mb-2">
                                    <div className="mt-0.5 w-8 h-8 rounded-md bg-primary/5 flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold text-[15px] leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                                        {note.title}
                                    </h3>
                                </div>
                                
                                {note.content && (
                                    <p className="text-slate-500 text-xs leading-relaxed line-clamp-3 mb-4 font-medium pl-11">
                                        {note.content.replace(/^[#*-\s]+/gm, '')}
                                    </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-sm bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                            {note.creator_email?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">
                                            {note.creator_email?.split('@')[0]}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">
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
        <div className="w-[450px] bg-white h-full flex flex-col border-l border-slate-200 shrink-0 shadow-sm z-10">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                            <FileText className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                            <h2 className="text-slate-900 font-bold text-lg tracking-tight">Shared Notes</h2>
                            <p className="text-slate-500 text-xs font-medium">
                                #{currentChannel?.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-6 mt-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-sm font-medium flex items-center gap-3 shrink-0">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        {error}
                        <button className="ml-auto text-rose-600 hover:text-rose-800 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm" onClick={() => setError(null)}>Dismiss</button>
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
    );
};

export default SharedNotes;
