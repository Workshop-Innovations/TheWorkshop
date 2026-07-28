import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';

const StarRating = ({ value, onChange, readonly = false }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                type="button"
                disabled={readonly}
                onClick={() => !readonly && onChange && onChange(star)}
                className={`text-xl transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-125'} ${
                    star <= value ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-300'
                }`}
            >
                ★
            </button>
        ))}
    </div>
);

const PeerReview = ({ onClose }) => {
    const {
        currentChannel,
        fetchSubmissions,
        createSubmission,
        submitFeedback,
        fetchSubmissionFeedback,
        user,
    } = useCommunity();

    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Create submission form
    const [newSubmission, setNewSubmission] = useState({ title: '', content: '', file_url: '' });

    // Feedback form
    const [newFeedback, setNewFeedback] = useState({ rating: 5, comments: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        if (currentChannel) loadSubmissions();
    }, [currentChannel]);

    useEffect(() => {
        if (selectedSubmission) loadFeedback(selectedSubmission.id);
    }, [selectedSubmission]);

    const loadSubmissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchSubmissions(currentChannel.id);
            setSubmissions(data || []);
        } catch {
            setError('Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const loadFeedback = async (submissionId) => {
        setFeedbackLoading(true);
        const data = await fetchSubmissionFeedback(submissionId);
        setFeedbacks(data || []);
        setFeedbackLoading(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newSubmission.title.trim()) return;
        setSubmitting(true);
        const created = await createSubmission(currentChannel.id, newSubmission);
        setSubmitting(false);
        if (created) {
            setSubmissions([created, ...submissions]);
            setShowCreateForm(false);
            setNewSubmission({ title: '', content: '', file_url: '' });
            setError(null);
        } else {
            setError('Failed to submit work. Please try again.');
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!selectedSubmission || !newFeedback.comments.trim()) return;
        setSubmittingFeedback(true);
        const added = await submitFeedback(selectedSubmission.id, newFeedback);
        setSubmittingFeedback(false);
        if (added) {
            setFeedbacks([added, ...feedbacks]);
            setNewFeedback({ rating: 5, comments: '' });
            setSubmissions(prev => prev.map(s =>
                s.id === selectedSubmission.id
                    ? { ...s, feedback_count: (s.feedback_count || 0) + 1 }
                    : s
            ));
            setError(null);
        } else {
            setError('Could not submit feedback. You may have already reviewed this, or it is your own submission.');
        }
    };

    const formatDate = (ts) => new Date(ts).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    const renderDetail = () => (
        <div className="h-full flex flex-col">
            {/* Detail Header */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-700 shrink-0">
                <button
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700 mr-1"
                    onClick={() => { setSelectedSubmission(null); setFeedbacks([]); setError(null); }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-white font-black text-sm truncate">{selectedSubmission.title}</h2>
                </div>
                {selectedSubmission.average_rating && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <StarRating value={Math.round(selectedSubmission.average_rating)} readonly />
                        <span className="text-yellow-400 text-xs font-bold">{selectedSubmission.average_rating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Submission Info */}
                <div className="px-6 py-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                            {selectedSubmission.author_email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-slate-200 font-semibold text-sm">{selectedSubmission.author_email?.split('@')[0]}</p>
                            <p className="text-slate-500 text-xs">{formatDate(selectedSubmission.created_at)}</p>
                        </div>
                    </div>

                    <div className="bg-slate-700/40 rounded-xl p-4 border border-slate-600/40">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedSubmission.content || <span className="text-slate-500 italic">No description provided.</span>}
                        </p>
                        {selectedSubmission.file_url && (
                            <a
                                href={selectedSubmission.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                                </svg>
                                View Attached File
                            </a>
                        )}
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="px-6 py-4">
                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <span>💬</span>
                        Peer Feedback
                        <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {feedbacks.length}
                        </span>
                    </h3>

                    {/* Add Feedback Form (not own submission) */}
                    {user?.id !== selectedSubmission.author_id && (
                        <form className="mb-6 bg-slate-700/30 border border-slate-600/50 rounded-xl p-4" onSubmit={handleSubmitFeedback}>
                            <h4 className="text-slate-200 font-bold text-xs uppercase tracking-wider mb-3">Add Your Review</h4>

                            <div className="flex items-center gap-3 mb-3">
                                <label className="text-slate-400 text-xs font-semibold">Rating:</label>
                                <StarRating
                                    value={newFeedback.rating}
                                    onChange={val => setNewFeedback({ ...newFeedback, rating: val })}
                                />
                                <span className="text-slate-500 text-xs">{newFeedback.rating}/5</span>
                            </div>

                            <textarea
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                                placeholder="Write constructive, helpful feedback..."
                                value={newFeedback.comments}
                                onChange={e => setNewFeedback({ ...newFeedback, comments: e.target.value })}
                                rows={3}
                                required
                            />

                            <div className="flex items-center justify-between mt-3">
                                {error && (
                                    <p className="text-red-400 text-xs">{error}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={submittingFeedback || !newFeedback.comments.trim()}
                                    className="ml-auto px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submittingFeedback && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                                    Submit Feedback
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Feedback List */}
                    {feedbackLoading ? (
                        <div className="flex items-center justify-center py-8 text-slate-500 text-sm gap-2">
                            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                            Loading feedback...
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 text-sm">No feedback yet. Be the first to review!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {feedbacks.map(fb => (
                                <div key={fb.id} className="bg-slate-700/40 border border-slate-600/40 rounded-xl p-4">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                {fb.reviewer_email?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-slate-200 font-semibold text-sm">{fb.reviewer_email?.split('@')[0]}</p>
                                                <p className="text-slate-500 text-xs">{formatDate(fb.created_at)}</p>
                                            </div>
                                        </div>
                                        <StarRating value={fb.rating} readonly />
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed">{fb.comments}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderList = () => (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3 shrink-0">
                <button
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-xl transition-all ${
                        showCreateForm
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                    }`}
                    onClick={() => { setShowCreateForm(!showCreateForm); setError(null); }}
                >
                    {showCreateForm ? (
                        <><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>Cancel</>
                    ) : (
                        <><svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>Submit Work</>
                    )}
                </button>
                <span className="text-xs text-slate-500 ml-auto">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Create form (collapsed) */}
            {showCreateForm && (
                <div className="px-4 py-3 border-b border-slate-700 bg-slate-700/20 shrink-0">
                    <form onSubmit={handleCreate} className="space-y-3">
                        <input
                            type="text"
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Title (e.g., Essay Draft 1, My Project)"
                            value={newSubmission.title}
                            onChange={e => setNewSubmission({ ...newSubmission, title: e.target.value })}
                            required
                            autoFocus
                        />
                        <textarea
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            placeholder="Describe your work, add text content, or paste code..."
                            value={newSubmission.content}
                            onChange={e => setNewSubmission({ ...newSubmission, content: e.target.value })}
                            rows={3}
                        />
                        <input
                            type="url"
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="External link (Google Doc, GitHub, etc.) — optional"
                            value={newSubmission.file_url}
                            onChange={e => setNewSubmission({ ...newSubmission, file_url: e.target.value })}
                        />
                        {error && (
                            <p className="text-red-400 text-xs flex items-center gap-1.5">
                                <span>⚠️</span>{error}
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={submitting || !newSubmission.title.trim()}
                            className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {submitting ? 'Posting...' : 'Post Submission'}
                        </button>
                    </form>
                </div>
            )}

            {/* Submissions list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="text-slate-500 text-sm">Loading submissions...</p>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <span className="text-6xl mb-4 opacity-30">📋</span>
                        <h3 className="text-white font-bold text-base mb-1">No submissions yet</h3>
                        <p className="text-slate-500 text-sm mb-5">Submit your work to get peer feedback from the community</p>
                        <button
                            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors"
                            onClick={() => setShowCreateForm(true)}
                        >
                            Submit Your Work
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {submissions.map(sub => (
                            <div
                                key={sub.id}
                                className="bg-slate-700/40 hover:bg-slate-700/70 border border-slate-600/40 hover:border-slate-500/60 rounded-xl p-4 cursor-pointer transition-all group hover:-translate-y-0.5 hover:shadow-lg"
                                onClick={() => setSelectedSubmission(sub)}
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="text-white font-bold text-sm group-hover:text-indigo-300 transition-colors truncate flex-1">
                                        {sub.title}
                                    </h3>
                                    {sub.average_rating ? (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-yellow-400 text-sm">★</span>
                                            <span className="text-yellow-400 text-xs font-bold">{sub.average_rating.toFixed(1)}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-500 shrink-0">Awaiting review</span>
                                    )}
                                </div>
                                {sub.content && (
                                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">
                                        {sub.content}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span>by {sub.author_email?.split('@')[0]}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <span>💬</span>
                                        {sub.feedback_count || 0} review{(sub.feedback_count || 0) !== 1 ? 's' : ''}
                                    </span>
                                    {sub.file_url && (
                                        <>
                                            <span>·</span>
                                            <span className="text-indigo-400">🔗 Link</span>
                                        </>
                                    )}
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
                className="bg-slate-800 rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col border border-slate-700 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
                            <span className="text-xl">📋</span>
                        </div>
                        <div>
                            <h2 className="text-white font-black text-base">Peer Reviews</h2>
                            <p className="text-slate-500 text-xs">#{currentChannel?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden">
                    {selectedSubmission ? renderDetail() : renderList()}
                </div>
            </div>
        </div>
    );
};

export default PeerReview;
