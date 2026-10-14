import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Send, Star, CheckCircle2, AlertCircle, MessageSquarePlus } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const WEBHOOK_URL = 'https://hook.eu1.make.com/5dakyq4j796vsvukh6957o2wrfgcqf3q';

const CATEGORIES = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'ux', label: 'UI / UX Feedback' },
    { value: 'content', label: 'Content Feedback' },
    { value: 'general', label: 'General Feedback' },
    { value: 'other', label: 'Other' },
];

const StarRating = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className="group transition-transform hover:scale-110 active:scale-95"
            >
                <Star
                    size={28}
                    className={`transition-colors ${n <= value
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 group-hover:text-amber-300'
                        }`}
                />
            </button>
        ))}
    </div>
);

const FeedbackPage = () => {
    const { user } = useAuth();

    const [form, setForm] = useState({
        name: user?.username || '',
        email: user?.email || '',
        category: '',
        rating: 0,
        message: '',
    });
    const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
    const [errorMsg, setErrorMsg] = useState('');

    const set = (field) => (e) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            setErrorMsg('Please fill in all required fields.');
            return;
        }
        if (form.rating === 0) {
            setErrorMsg('Please select a rating.');
            return;
        }
        setErrorMsg('');
        setStatus('submitting');

        const payload = {
            ...form,
            submitted_at: new Date().toISOString(),
        };

        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok || res.status === 200) {
                setStatus('success');
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center px-4 pt-32 pb-24">
                <div className="w-full max-w-lg">
                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center bg-white p-12 rounded-md shadow-xl shadow-slate-200/50 border border-slate-100"
                            >
                                <h1 className="text-3xl font-extrabold mb-3 tracking-tight text-slate-900">Thank you!</h1>
                                <p className="text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
                                    Your feedback has been received. We read every single submission and it helps us make Workshop better for everyone.
                                </p>
                                <Link
                                    to={user ? '/dashboard' : '/'}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-md transition-all hover:scale-[1.02] shadow-xl shadow-primary/30"
                                >
                                    Back to {user ? 'Dashboard' : 'Home'}
                                </Link>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-slate-900">Beta Feedback</h1>
                                    <p className="text-slate-500 text-sm">
                                        Found a bug? Have an idea? We're all ears.
                                    </p>
                                </div>

                                {/* Card */}
                                <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-md p-8">
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Name + Email */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                    Name <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={form.name}
                                                    onChange={set('name')}
                                                    placeholder="Your name"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                    Email <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={form.email}
                                                    onChange={set('email')}
                                                    placeholder="you@email.com"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                Category
                                            </label>
                                            <select
                                                value={form.category}
                                                onChange={set('category')}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">Select a category…</option>
                                                {CATEGORIES.map(c => (
                                                    <option key={c.value} value={c.value}>{c.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Rating */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                Overall Rating <span className="text-rose-500">*</span>
                                            </label>
                                            <StarRating value={form.rating} onChange={(n) => setForm(p => ({ ...p, rating: n }))} />
                                            {form.rating > 0 && (
                                                <p className="text-xs text-slate-500 mt-1.5 font-medium">
                                                    {['', 'Poor', 'Below average', 'Average', 'Good', 'Excellent'][form.rating]}
                                                </p>
                                            )}
                                        </div>

                                        {/* Message */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                                Your Feedback <span className="text-rose-500">*</span>
                                            </label>
                                            <textarea
                                                required
                                                rows={5}
                                                value={form.message}
                                                onChange={set('message')}
                                                placeholder="Tell us what you think, what's broken, or what you'd love to see…"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                                            />
                                        </div>

                                        {/* Error */}
                                        {(errorMsg || status === 'error') && (
                                            <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-md px-4 py-3">
                                                <AlertCircle size={16} />
                                                {errorMsg || 'Failed to send feedback. Please try again.'}
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={status === 'submitting'}
                                            className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary/90 text-white font-extrabold rounded-md transition-all hover:scale-[1.01] active:scale-95 shadow-xl shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm"
                                        >
                                            {status === 'submitting' ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Sending…
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={16} /> Submit Feedback
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                <p className="text-center text-slate-500 text-xs mt-6 font-medium">
                                    Your feedback shapes the product. Thank you
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default FeedbackPage;
