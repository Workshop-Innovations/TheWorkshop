import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import './PeerReview.css';

const PeerReview = ({ onClose }) => {
    const { currentChannel, fetchSubmissions, createSubmission, submitFeedback, fetchSubmissionFeedback, user } = useCommunity();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Create Form State
    const [newSubmission, setNewSubmission] = useState({ title: '', content: '', file_url: '' });

    // Feedback Form State
    const [newFeedback, setNewFeedback] = useState({ rating: 5, comments: '' });

    useEffect(() => {
        if (currentChannel) {
            loadSubmissions();
        }
    }, [currentChannel]);

    useEffect(() => {
        if (selectedSubmission) {
            loadFeedback(selectedSubmission.id);
        }
    }, [selectedSubmission]);

    const loadSubmissions = async () => {
        setLoading(true);
        const data = await fetchSubmissions(currentChannel.id);
        setSubmissions(data || []);
        setLoading(false);
    };

    const loadFeedback = async (submissionId) => {
        const data = await fetchSubmissionFeedback(submissionId);
        setFeedbacks(data || []);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newSubmission.title.trim()) return;

        const created = await createSubmission(currentChannel.id, newSubmission);
        if (created) {
            setSubmissions([created, ...submissions]);
            setShowCreateForm(false);
            setNewSubmission({ title: '', content: '', file_url: '' });
        }
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!selectedSubmission || !newFeedback.comments.trim()) return;

        const added = await submitFeedback(selectedSubmission.id, newFeedback);
        if (added) {
            setFeedbacks([added, ...feedbacks]);
            setNewFeedback({ rating: 5, comments: '' });
            // Update local submission stats (optimistic)
            setSubmissions(submissions.map(s => {
                if (s.id === selectedSubmission.id) {
                    return { ...s, feedback_count: s.feedback_count + 1 };
                }
                return s;
            }));
        } else {
            alert("Failed to submit feedback. You may have already reviewed this or it's your own submission.");
        }
    };

    const renderStars = (rating) => {
        return "⭐".repeat(rating);
    };

    const renderDetail = () => (
        <div className="review-detail">
            <button className="back-btn" onClick={() => setSelectedSubmission(null)}>← Back to Submissions</button>

            <div className="submission-content">
                <h2>{selectedSubmission.title}</h2>
                <div className="submission-meta">
                    <span>By {selectedSubmission.author_email?.split('@')[0]}</span>
                    <span>•</span>
                    <span>{new Date(selectedSubmission.created_at).toLocaleDateString()}</span>
                </div>

                <div className="submission-body">
                    <p>{selectedSubmission.content}</p>
                    {selectedSubmission.file_url && (
                        <a href={selectedSubmission.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                            📎 View Attached File
                        </a>
                    )}
                </div>
            </div>

            <div className="feedback-section">
                <h3>Peer Feedback ({feedbacks.length})</h3>

                {/* Feedback Form - Only if not author */}
                {user?.id !== selectedSubmission.author_id && (
                    <form className="feedback-form" onSubmit={handleSubmitFeedback}>
                        <h4>Add Your Review</h4>
                        <div className="rating-input">
                            <label>Rating:</label>
                            <select
                                value={newFeedback.rating}
                                onChange={e => setNewFeedback({ ...newFeedback, rating: parseInt(e.target.value) })}
                            >
                                <option value="5">5 - Excellent</option>
                                <option value="4">4 - Good</option>
                                <option value="3">3 - Fair</option>
                                <option value="2">2 - Poor</option>
                                <option value="1">1 - Terrible</option>
                            </select>
                        </div>
                        <textarea
                            placeholder="Write constructive feedback..."
                            value={newFeedback.comments}
                            onChange={e => setNewFeedback({ ...newFeedback, comments: e.target.value })}
                            required
                        />
                        <button type="submit" className="submit-feedback-btn">Submit Feedback</button>
                    </form>
                )}

                <div className="feedback-list">
                    {feedbacks.map(fb => (
                        <div key={fb.id} className="feedback-item">
                            <div className="feedback-header">
                                <span className="feedback-author">{fb.reviewer_email?.split('@')[0]}</span>
                                <span className="feedback-rating">{renderStars(fb.rating)}</span>
                                <span className="feedback-time">{new Date(fb.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="feedback-comment">{fb.comments}</p>
                        </div>
                    ))}
                    {feedbacks.length === 0 && <p className="no-feedback">No feedback yet. Be the first!</p>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="peer-review-overlay" onClick={onClose}>
            <div className="peer-review-modal" onClick={e => e.stopPropagation()}>
                <div className="peer-review-header">
                    <h2>📋 Peer Reviews</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="peer-review-body">
                    {!selectedSubmission ? (
                        <>
                            <div className="reviews-toolbar">
                                <button
                                    className="create-submission-btn"
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                >
                                    {showCreateForm ? 'Cancel' : '+ Submit Work'}
                                </button>
                            </div>

                            {showCreateForm && (
                                <form className="create-submission-form" onSubmit={handleCreate}>
                                    <input
                                        type="text"
                                        placeholder="Title (e.g., Essay Draft 1)"
                                        value={newSubmission.title}
                                        onChange={e => setNewSubmission({ ...newSubmission, title: e.target.value })}
                                        required
                                    />
                                    <textarea
                                        placeholder="Description or Paste Text Content"
                                        value={newSubmission.content}
                                        onChange={e => setNewSubmission({ ...newSubmission, content: e.target.value })}
                                    />
                                    <input
                                        type="url"
                                        placeholder="External Link (Google Doc, GitHub, etc.) - Optional"
                                        value={newSubmission.file_url}
                                        onChange={e => setNewSubmission({ ...newSubmission, file_url: e.target.value })}
                                    />
                                    <button type="submit" className="submit-btn">Post Submission</button>
                                </form>
                            )}

                            <div className="submissions-list">
                                {loading ? (
                                    <div className="loading">Loading submissions...</div>
                                ) : submissions.length === 0 ? (
                                    <div className="empty-state">No submissions yet in this channel.</div>
                                ) : (
                                    submissions.map(sub => (
                                        <div key={sub.id} className="submission-card" onClick={() => setSelectedSubmission(sub)}>
                                            <div className="card-header">
                                                <h3>{sub.title}</h3>
                                                {sub.average_rating && <span className="avg-rating">⭐ {sub.average_rating.toFixed(1)}</span>}
                                            </div>
                                            <div className="card-meta">
                                                <span>by {sub.author_email?.split('@')[0]}</span>
                                                <span>💬 {sub.feedback_count} reviews</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        renderDetail()
                    )}
                </div>
            </div>
        </div>
    );
};

export default PeerReview;
