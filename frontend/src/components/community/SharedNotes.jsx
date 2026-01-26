import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import './SharedNotes.css';

const SharedNotes = ({ onClose }) => {
    const { currentChannel, fetchChannelNotes, createNote, updateNote, user } = useCommunity();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({ title: '', content: '' });

    useEffect(() => {
        if (currentChannel) {
            loadNotes();
        }
    }, [currentChannel]);

    const loadNotes = async () => {
        setLoading(true);
        const data = await fetchChannelNotes(currentChannel.id);
        setNotes(data || []);
        setLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        const newNote = await createNote(currentChannel.id, {
            title: formData.title,
            content: formData.content
        });

        if (newNote) {
            setNotes([newNote, ...notes]);
            setFormData({ title: '', content: '' });
            setSelectedNote(newNote);
            setIsEditing(false); // Go to view mode
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!selectedNote || !formData.title.trim()) return;

        const updated = await updateNote(selectedNote.id, {
            title: formData.title,
            content: formData.content,
            version: selectedNote.version
        });

        if (updated) {
            setNotes(notes.map(n => n.id === updated.id ? updated : n));
            setSelectedNote(updated);
            setIsEditing(false);
        } else {
            alert('Failed to update. Note may have been modified by someone else.');
            loadNotes(); // Refresh
        }
    };

    const startEditing = (note) => {
        if (!note) {
            // New note mode
            setFormData({ title: '', content: '' });
            setSelectedNote(null);
            setIsEditing(true);
        } else {
            // Edit existing
            setFormData({ title: note.title, content: note.content });
            setIsEditing(true);
        }
    };

    const renderEditor = () => (
        <div className="note-editor">
            <div className="editor-header">
                <button className="back-btn" onClick={() => setIsEditing(false)}>← Back</button>
                <h3>{selectedNote ? 'Edit Note' : 'New Note'}</h3>
            </div>
            <form onSubmit={selectedNote ? handleUpdate : handleCreate}>
                <input
                    type="text"
                    className="note-title-input"
                    placeholder="Note Title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                />
                <textarea
                    className="note-content-input"
                    placeholder="Write your note here... (Markdown supported)"
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                />
                <button type="submit" className="save-note-btn">
                    {selectedNote ? 'Save Changes' : 'Create Note'}
                </button>
            </form>
        </div>
    );

    const renderDetail = () => (
        <div className="note-detail">
            <div className="detail-header">
                <button className="back-btn" onClick={() => setSelectedNote(null)}>← Back to List</button>
                <div className="detail-actions">
                    <button className="edit-btn" onClick={() => startEditing(selectedNote)}>Edit</button>
                </div>
            </div>
            <h2 className="note-title">{selectedNote.title}</h2>
            <div className="note-meta">
                <span>By {selectedNote.creator_email}</span>
                <span>•</span>
                <span>Last updated {new Date(selectedNote.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="note-content">
                {selectedNote.content ? (
                    <div className="markdown-preview">
                        {selectedNote.content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                ) : (
                    <p className="empty-content">No content yet.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="shared-notes-overlay" onClick={onClose}>
            <div className="shared-notes-modal" onClick={e => e.stopPropagation()}>
                <div className="shared-notes-header">
                    <h2>📝 Shared Notes</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="shared-notes-body">
                    {/* List View */}
                    {!selectedNote && !isEditing && (
                        <>
                            <div className="notes-toolbar">
                                <button className="create-note-btn" onClick={() => startEditing(null)}>
                                    + New Note
                                </button>
                            </div>
                            <div className="notes-list">
                                {loading ? (
                                    <div className="loading">Loading...</div>
                                ) : notes.length === 0 ? (
                                    <div className="empty-state">No notes found in this channel.</div>
                                ) : (
                                    notes.map(note => (
                                        <div key={note.id} className="note-card" onClick={() => setSelectedNote(note)}>
                                            <h3>{note.title}</h3>
                                            <div className="note-card-meta">
                                                <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                                                <span>by {note.creator_email?.split('@')[0]}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}

                    {/* Editor View */}
                    {isEditing && renderEditor()}

                    {/* Detail View */}
                    {selectedNote && !isEditing && renderDetail()}
                </div>
            </div>
        </div>
    );
};

export default SharedNotes;
