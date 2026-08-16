import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { ClipboardCheck, X, Star, MessageCircle, ExternalLink, Plus, ChevronLeft, Send } from 'lucide-react';

const StarRating = ({ value, onChange, readonly = false }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
            <button
                key={star}
                type="button"
                disabled={readonly}
                onClick={() => !readonly && onChange && onChange(star)}
                className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${
                    star <= value ? 'text-yellow-400' : 'text-slate-200 hover:text-yellow-200'
                }`}
            >
                <Star className={`w-5 h-5 ${star <= value ? 'fill-yellow-400' : ''}`} />
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
            
            // Optimistically update the feedback count on the submission list item
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
        <div className="h-full flex flex-col bg-white">
            {/* Detail Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 shrink-0">
                <button
                    className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                    onClick={() => { setSelectedSubmission(null); setFeedbacks([]); setError(null); }}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-slate-900 font-bold text-lg truncate tracking-tight">{selectedSubmission.title}</h2>
                </div>
                {selectedSubmission.average_rating && (
                    <div className="flex items-center gap-2 shrink-0 bg-yellow-50 px-3 py-1.5 rounded-md border border-yellow-100">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-yellow-700 text-sm font-bold">{selectedSubmission.average_rating.toFixed(1)}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                {/* Submission Info */}
                <div className="px-8 py-6 bg-white border-b border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm overflow-hidden shrink-0">
                            {selectedSubmission.author_email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                            <p className="text-slate-900 font-bold text-[15px] tracking-tight">{selectedSubmission.author_email?.split('@')[0]}</p>
                            <p className="text-slate-500 font-medium text-xs">{formatDate(selectedSubmission.created_at)}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-md p-5 border border-slate-200">
                        <p className="text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedSubmission.content || <span className="text-slate-400 italic">No description provided.</span>}
                        </p>
                        {selectedSubmission.file_url && (
                            <a
                                href={selectedSubmission.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-bold transition-colors bg-primary/5 px-4 py-2 rounded-md border border-primary/20"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View Attached File
                            </a>
                        )}
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="px-8 py-6 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageCircle className="w-5 h-5 text-slate-400" />
                        <h3 className="text-slate-900 font-bold text-lg tracking-tight">Peer Feedback</h3>
                        <span className="bg-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md font-bold">
                            {feedbacks.length}
                        </span>
                    </div>

                    {/* Add Feedback Form (not own submission) */}
                    {user?.id !== selectedSubmission.author_id && (
                        <form className="mb-8 bg-white border border-slate-200 rounded-md p-6 shadow-sm" onSubmit={handleSubmitFeedback}>
                            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider mb-4">Add Your Review</h4>

                            <div className="flex items-center gap-4 mb-4 bg-slate-50 w-fit px-4 py-2 rounded-md border border-slate-200">
                                <label className="text-slate-600 text-sm font-bold">Rating:</label>
                                <StarRating
                                    value={newFeedback.rating}
                                    onChange={val => setNewFeedback({ ...newFeedback, rating: val })}
                                />
                                <span className="text-slate-500 font-bold text-sm bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{newFeedback.rating}/5</span>
                            </div>

                            <textarea
                                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-slate-900 placeholder-slate-400 text-[15px] font-medium focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none transition-all shadow-inner"
                                placeholder="Write constructive, helpful feedback..."
                                value={newFeedback.comments}
                                onChange={e => setNewFeedback({ ...newFeedback, comments: e.target.value })}
                                rows={3}
                                required
                            />

                            <div className="flex items-center justify-between mt-4">
                                {error && (
                                    <p className="text-rose-500 text-sm font-medium">{error}</p>
                                )}
                                <button
                                    type="submit"
                                    disabled={submittingFeedback || !newFeedback.comments.trim()}
                                    className="ml-auto px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {submittingFeedback ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-sm animate-spin"></div>
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Feedback List */}
                    {feedbackLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm font-medium gap-3">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-sm animate-spin"></div>
                            Loading feedback...
                        </div>
                    ) : feedbacks.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-md border border-slate-200 border-dashed">
                            <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-medium">No feedback yet. Be the first to review!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {feedbacks.map(fb => (
                                <div key={fb.id} className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                                                {fb.reviewer_email?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-sm tracking-tight">{fb.reviewer_email?.split('@')[0]}</p>
                                                <p className="text-slate-500 font-medium text-xs">{formatDate(fb.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 px-2.5 py-1 rounded-md border border-yellow-100">
                                            <StarRating value={fb.rating} readonly />
                                        </div>
                                    </div>
                                    <p className="text-slate-700 text-[15px] font-medium leading-relaxed">{fb.comments}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderList = () => (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Toolbar */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center gap-4 shrink-0">
                <button
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-md transition-all shadow-sm active:scale-95 ${
                        showCreateForm
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                    onClick={() => { setShowCreateForm(!showCreateForm); setError(null); }}
                >
                    {showCreateForm ? (
                        <><X className="w-4 h-4" />Cancel</>
                    ) : (
                        <><Plus className="w-4 h-4" />Submit Work</>
                    )}
                </button>
                <span className="text-xs font-bold text-slate-500 ml-auto bg-slate-100 px-3 py-1.5 rounded-md">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Create form (collapsed) */}
            {showCreateForm && (
                <div className="px-6 py-5 border-b border-slate-200 bg-white shrink-0 shadow-sm relative z-10">
                    <form onSubmit={handleCreate} className="space-y-4 max-w-3xl mx-auto">
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-[15px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                            placeholder="Title (e.g., Essay Draft 1, My Project)"
                            value={newSubmission.title}
                            onChange={e => setNewSubmission({ ...newSubmission, title: e.target.value })}
                            required
                            autoFocus
                        />
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-[15px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner resize-none"
                            placeholder="Describe your work, add text content, or paste code..."
                            value={newSubmission.content}
                            onChange={e => setNewSubmission({ ...newSubmission, content: e.target.value })}
                            rows={3}
                        />
                        <input
                            type="url"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-[15px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                            placeholder="External link (Google Doc, GitHub, etc.) Ã¢â‚¬â€ optional"
                            value={newSubmission.file_url}
                            onChange={e => setNewSubmission({ ...newSubmission, file_url: e.target.value })}
                        />
                        {error && (
                            <p className="text-rose-500 text-sm font-medium flex items-center gap-2 bg-rose-50 p-3 rounded-md border border-rose-100">
                                <AlertCircle className="w-4 h-4" />{error}
                            </p>
                        )}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={submitting || !newSubmission.title.trim()}
                                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-sm animate-spin"></div>}
                                {submitting ? 'Posting...' : 'Post Submission'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Submissions list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-sm animate-spin"></div>
                        <p className="text-slate-500 text-sm font-medium">Loading submissions...</p>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-sm mx-auto">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-sm flex items-center justify-center mb-4 shadow-sm">
                            <ClipboardCheck className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2 tracking-tight">No submissions yet</h3>
                        <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">Submit your work to get constructive peer feedback from the community</p>
                        <button
                            className="px-6 py-3 bg-primary text-white font-bold rounded-md hover:bg-primary/90 transition-all shadow-sm active:scale-95"
                            onClick={() => setShowCreateForm(true)}
                        >
                            Submit Your Work
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {submissions.map(sub => (
                            <div
                                key={sub.id}
                                className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-primary/40 rounded-md p-5 cursor-pointer transition-all group shadow-sm hover:shadow-md"
                                onClick={() => setSelectedSubmission(sub)}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <h3 className="text-slate-900 font-bold text-[16px] group-hover:text-primary transition-colors tracking-tight line-clamp-2">
                                        {sub.title}
                                    </h3>
                                    {sub.average_rating ? (
                                        <div className="flex items-center gap-1.5 shrink-0 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                            <span className="text-yellow-700 text-xs font-bold">{sub.average_rating.toFixed(1)}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded shrink-0 uppercase tracking-wide">Awaiting review</span>
                                    )}
                                </div>
                                {sub.content && (
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2 mb-4">
                                        {sub.content}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-500 border-t border-slate-100 pt-3 mt-auto">
                                    <span className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-sm bg-slate-100 flex items-center justify-center text-[10px]">
                                            {sub.author_email?.charAt(0).toUpperCase()}
                                        </div>
                                        {sub.author_email?.split('@')[0]}
                                    </span>
                                    <span className="text-slate-300">Ã¢â‚¬Â¢</span>
                                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md text-slate-600">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        {sub.feedback_count || 0} review{(sub.feedback_count || 0) !== 1 ? 's' : ''}
                                    </span>
                                    {sub.file_url && (
                                        <>
                                            <span className="text-slate-300">Ã¢â‚¬Â¢</span>
                                            <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                <ExternalLink className="w-3 h-3" /> Link
                                            </span>
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
        <div className="w-[450px] bg-white h-full flex flex-col border-l border-slate-200 shrink-0 shadow-sm z-10">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                            <ClipboardCheck className="w-5 h-5 text-slate-700" />
                        </div>
                        <div>
                            <h2 className="text-slate-900 font-bold text-lg tracking-tight">Peer Reviews</h2>
                            <p className="text-slate-500 font-medium text-xs">#{currentChannel?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden">
                    {selectedSubmission ? renderDetail() : renderList()}
                </div>
            </div>
    );
};

export default PeerReview;
