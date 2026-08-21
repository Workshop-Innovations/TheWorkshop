import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, BookOpen, CheckCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export const PaperContext = createContext();


/**
 * Step 1 ’ Normalises the raw markdown/LaTeX content from the database.
 * NOTE: Does NOT inject interactive markers here.
 * That happens AFTER the answer-bank split so markers never pollute the rubric.
 */
function preprocessContent(raw) {
    if (!raw) return '';
    let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Ensure answer-option lines (A’…F) start their own paragraph
    text = text.replace(/\n([A-F]\.[ \t])/g, '\n\n$1');
    // Ensure numbered question lines start a new paragraph
    text = text.replace(/\n(?!#)(\d{1,3})\.[ \t]/g, '\n\n$1. ');
    // Collapse 3+ blank lines ’  1 blank line
    text = text.replace(/\n{3,}/g, '\n\n');
    return text;
}

/**
 * Step 2 ’ Inject interactive input markers.
 * Called ONLY on the questions section (never on answer content).
 * BUG FIX: uses a function-form .replace() so `opt` is correctly captured,
 * not the literal string "$1".
 */
function injectInteractiveMarkers(text) {
    let currentQ = 'unknown';
    const optionsSeenForCurrentQ = new Set();
    
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const qMatch = lines[i].match(/^(\d{1,3})\.[ \t]/);
        if (qMatch) {
            currentQ = qMatch[1];
            optionsSeenForCurrentQ.clear();
        }

        // Correct regex: function replacement captures opt properly
        lines[i] = lines[i].replace(/^([A-F])\.[ \t](.*)/, (_, opt, rest) => {
            if (opt === 'A' && optionsSeenForCurrentQ.has('A')) {
                const num = parseInt(currentQ, 10);
                if (!isNaN(num)) {
                    currentQ = (num + 1).toString();
                } else {
                    currentQ = currentQ + '_next';
                }
                optionsSeenForCurrentQ.clear();
            }
            optionsSeenForCurrentQ.add(opt);
            return `[__MCQ__](input://mcq?q=${currentQ}&opt=${opt}) ${opt}. ${rest}`;
        });

        lines[i] = lines[i].replace(/\[ESSAY\]/g, `[__ESSAY__](input://essay?q=${currentQ})`);
        lines[i] = lines[i].replace(/\[STRUCTURED\]/g, `[__STRUCTURED__](input://structured?q=${currentQ})`);
        lines[i] = lines[i].replace(/\[CALC\]/g, `[__CALC__](input://calc?q=${currentQ})`);
        lines[i] = lines[i].replace(/(^|[^\!])\[DIAGRAM:([^\]]+)\]/g, '$1[__DIAGRAM__](input://diagram?label=$2)');
    }
    return lines.join('\n');
}

/* ’’’ Custom renderers (defined outside component to prevent re-creation) ’’ */

const PaperParagraph = ({ children, ...props }) => {
    const text = React.Children.toArray(children)
        .map(c => (typeof c === 'string' ? c : ''))
        .join('');
    // Fixed: A-F (was A-D)
    const isOption = /^[A-F]\.\s/.test(text.trimStart());
    if (isOption) {
        return (
            <p {...props} style={{
                paddingLeft: '1rem',
                borderLeft: '3px solid #e2e8f0',
                marginTop: '0.35rem',
                marginBottom: '0.35rem',
                color: '#334155',
            }}>
                {children}
            </p>
        );
    }
    return <p {...props} style={{ marginBottom: '0.75rem', color: '#475569' }}>{children}</p>;
};

const PaperTable = ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
            {children}
        </table>
    </div>
);

const PaperTh = ({ children }) => (
    <th style={{ border: '1px solid #cbd5e1', padding: '6px 12px', backgroundColor: '#f1f5f9', textAlign: 'left', fontWeight: 600 }}>
        {children}
    </th>
);

const PaperTd = ({ children }) => (
    <td style={{ border: '1px solid #e2e8f0', padding: '6px 12px' }}>
        {children}
    </td>
);

/* ’’’ Feedback Renderer ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’ */

const FeedbackView = ({ feedbackData, score }) => {
    let parsed = null;
    try { parsed = JSON.parse(feedbackData); } catch { /* fall through */ }

    if (!parsed) return <p className="text-slate-600">No detailed feedback available.</p>;

    // The AI returns { total_score, feedback: { "1": "...", "2": "..." } }
    const feedbackMap = parsed.feedback || parsed;
    const entries = Object.entries(feedbackMap);

    return (
        <div className="space-y-3">
            <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl font-black text-green-600">{score ?? 0}</span>
                <span className="text-slate-500 text-sm font-medium">estimated marks</span>
            </div>
            {entries.map(([key, val]) => (
                <div key={key} className="bg-white border border-slate-200 rounded-md p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Question {key}
                    </p>
                    <p className="text-sm text-slate-700">{typeof val === 'string' ? val : JSON.stringify(val)}</p>
                </div>
            ))}
        </div>
    );
};

/* ’’’ Main Component ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’ */

const PaperMarkdownComponents = {
    p:      PaperParagraph,
    table:  PaperTable,
    th:     PaperTh,
    td:     PaperTd,
    h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '1.5rem 0 0.5rem' }}>{children}</h1>,
    h2: ({ children }) => <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#334155', margin: '1.25rem 0 0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>{children}</h2>,
    h3: ({ children }) => <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', margin: '1rem 0 0.3rem' }}>{children}</h3>,
    strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#1e293b' }}>{children}</strong>,
    li:     ({ children }) => <li style={{ marginBottom: '0.25rem', color: '#475569' }}>{children}</li>,
    img: ({ src, alt }) => {
        const resolvedSrc = src && src.startsWith('/')
            ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${src}`
            : src;
        return (
            <img src={resolvedSrc} alt={alt || ''} style={{
                maxWidth: '100%', height: 'auto', borderRadius: '4px',
                margin: '1rem auto', display: 'block', border: '1px solid #e2e8f0',
            }} />
        );
    },
    a: PaperLink,
};

// PaperLink MUST be a proper named React component (not an inline function in an
// object literal) so that useContext() obeys the Rules of Hooks.
// Putting useContext inside a plain object property caused React error #310.
function PaperLink({ href, children }) {
    // Always call the hook unconditionally at the top level.
    const ctx = useContext(PaperContext);
    const { mode, userAnswers, handleAnswerChange } = ctx || {};

    if (href && href.startsWith('input://')) {
        const url = new URL(href);
        const type = url.hostname;
        const q    = url.searchParams.get('q');

        if (mode !== 'practice' && type !== 'diagram') {
            return null;
        }

        if (type === 'diagram') {
            const label = url.searchParams.get('label');
            return (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'1.5rem', margin:'1rem 0', border:'2px dashed #cbd5e1', background:'#f8fafc', color:'#64748b' }}>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.25rem' }}>Missing Diagram</span>
                    <code style={{ fontSize:'0.75rem', background:'#e2e8f0', padding:'2px 8px', color:'#475569' }}>{label}</code>
                </div>
            );
        }

        if (type === 'mcq') {
            const opt = url.searchParams.get('opt');
            return (
                <input
                    type="radio"
                    name={`q_${q}`}
                    value={opt}
                    checked={(userAnswers || {})[q] === opt}
                    onChange={e => handleAnswerChange && handleAnswerChange(q, e.target.value)}
                    className="mr-2 accent-indigo-600 w-4 h-4 cursor-pointer"
                />
            );
        }

        if (type === 'essay') {
            return (
                <textarea
                    className="w-full mt-2 p-3 border border-slate-300 rounded-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-y text-sm"
                    rows={6}
                    placeholder="Type your essay answer here..."
                    value={(userAnswers || {})[q] || ''}
                    onChange={e => handleAnswerChange && handleAnswerChange(q, e.target.value)}
                />
            );
        }

        if (type === 'structured') {
            return (
                <input
                    type="text"
                    className="w-full mt-2 p-2 border border-slate-300 rounded-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm"
                    placeholder="Type your short answer..."
                    value={(userAnswers || {})[q] || ''}
                    onChange={e => handleAnswerChange && handleAnswerChange(q, e.target.value)}
                />
            );
        }

        if (type === 'calc') {
            return (
                <div className="mt-2">
                    <input
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm font-mono"
                        placeholder="Final answer"
                        value={(userAnswers || {})[q] || ''}
                        onChange={e => handleAnswerChange && handleAnswerChange(q, e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1 italic">
                        Note: In the real exam you must show all steps and working for full marks. For this practice, just enter your final answer.
                    </p>
                </div>
            );
        }
    }
    return (
        <a href={href} className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
}

// Remark / rehype plugins are module-level constants so they are never
// recreated on every render (e.g. on every timer tick in practice mode).
const REMARK_PLUGINS = [
    [remarkMath, { singleDollarTextMath: true }],
    remarkGfm,
];
const REHYPE_PLUGINS = [
    [rehypeKatex, { throwOnError: false, strict: false, trust: true }],
];

const PaperViewer = () => {
    const { paperId } = useParams();
    const [paper, setPaper]               = useState(null);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [activeTab, setActiveTab]       = useState('questions');
    const [mode, setMode]                 = useState('read'); // 'read' | 'practice' | 'results'
    const [userAnswers, setUserAnswers]   = useState({});
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [testResult, setTestResult]     = useState(null);
    const [submitError, setSubmitError]   = useState(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Ref so the timer interval can always call the latest handleSubmitTest
    // without a stale-closure dependency on userAnswers
    const submitRef = useRef(null);
    const token = localStorage.getItem('accessToken');

    // ’’ Fetch paper ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’
    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/papers/${paperId}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                if (!response.ok) throw new Error('Failed to fetch paper');
                const data = await response.json();
                setPaper(data);
                setTimeRemaining((data.duration_minutes ?? 60) * 60);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPaper();
    }, [paperId]);

    // ’’ Memoised content processing ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’
    // Only re-runs when paper.content changes ’ NOT on every second tick
    const { mainContent, answerContent } = useMemo(() => {
        if (!paper?.content) return { mainContent: '', answerContent: null };
        const base = preprocessContent(paper.content);
        // Split first ’ THEN inject markers only into questions section
        const parts = base.split(/\n#{1,3}\s*ANSWER(?:S|\s+BANK)?\s*\n/i);
        const rawMain   = parts[0];
        const rawAnswer = parts.length > 1 ? '## Answer Bank\n\n' + parts.slice(1).join('') : null;
        return {
            mainContent:   injectInteractiveMarkers(rawMain),
            answerContent: rawAnswer,
        };
    }, [paper?.content]);

    // ’’ Handlers ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’
    const handleAnswerChange = useCallback((q, val) => {
        setUserAnswers(prev => ({ ...prev, [q]: val }));
    }, []);

    const handleSubmitTest = useCallback(async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // FIXED: correct localStorage key ('accessToken' not 'access_token')
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/papers/${paperId}/grade`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        paper_id: paperId,
                        answers_data: JSON.stringify(userAnswers),
                    }),
                }
            );
            if (response.ok) {
                const data = await response.json();
                setTestResult(data);
                setMode('results');
                window.scrollTo(0, 0);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setSubmitError(errorData.detail || response.statusText || 'Submission failed. Please try again.');
            }
        } catch (e) {
            console.error(e);
            setSubmitError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [paperId, userAnswers, isSubmitting]);

    // Keep ref in sync so the timer can call it without a stale closure
    useEffect(() => {
        submitRef.current = handleSubmitTest;
    }, [handleSubmitTest]);

    // ’’ Timer ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’
    // FIXED: does NOT list timeRemaining as a dependency ’ avoids the
    // interval-per-second bug and prevents stale-closure on handleSubmitTest
    useEffect(() => {
        if (mode !== 'practice' || isSubmitting) return;
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    submitRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [mode, isSubmitting]);

    // ’’ Mode transitions ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’
    const enterPractice = useCallback(() => {
        setUserAnswers({});
        setTestResult(null);
        // Reset timer every time we enter practice mode
        setTimeRemaining((paper?.duration_minutes ?? 60) * 60);
        setActiveTab('questions');
        setMode('practice');
    }, [paper?.duration_minutes]);

    const exitPractice = useCallback(() => {
        setShowExitConfirm(true);
    }, []);

    const confirmExit = useCallback(() => {
        setShowExitConfirm(false);
        setMode('read');
        setUserAnswers({});
        setTimeRemaining((paper?.duration_minutes ?? 60) * 60);
    }, [paper?.duration_minutes]);

    const formatTime = (seconds) => {
        if (seconds === null || seconds === undefined) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // contextValue MUST be declared here (before any early returns)
    // so that useContext in PaperLink always has access to the context.
    // Moving this after an early-return would violate the Rules of Hooks.
    const contextValue = useMemo(() => ({
        mode,
        userAnswers,
        handleAnswerChange
    }), [mode, userAnswers, handleAnswerChange]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 48, height: 48, border: '4px solid #e2e8f0',
                    borderTopColor: '#6366f1', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
                }} />
                <p style={{ color: '#64748b' }}>Loading paper...</p>
            </div>
        </div>
    );
    if (error) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
            <div style={{ maxWidth: 480, width:'100%', background:'#fff', border:'1px solid #fee2e2', borderRadius:4, padding:'2rem', textAlign:'center' }}>
                <p style={{ color:'#ef4444', fontWeight:700, fontSize:'1.1rem', marginBottom:'0.5rem' }}>Failed to load paper</p>
                <p style={{ color:'#64748b', fontSize:'0.9rem', marginBottom:'1.5rem' }}>{error}</p>
                <Link to="/past-papers" style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', color:'#6366f1', fontWeight:600, textDecoration:'none' }}>
                    <ArrowLeft size={16} /> Back to Past Papers
                </Link>
            </div>
        </div>
    );
    if (!paper) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">Paper not found</div>
    );

    // ’’ Remark / Rehype plugins ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’

    // ’’ Markdown component map ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’// ’’ Render ’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’’

    return (
        <>
        <PaperContext.Provider value={contextValue}>
            <div className="min-h-screen bg-slate-50 flex flex-col">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .paper-content .katex { font-size: 1em !important; }
                .paper-content .katex-display { margin: 1rem 0; overflow-x: auto; }
                .paper-content p   { margin-bottom: 0.75rem; }
                .paper-content ul  { padding-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: disc; }
                .paper-content ol  { padding-left: 1.5rem; margin-bottom: 0.75rem; list-style-type: decimal; }
                .paper-content pre { overflow-x: auto; }
            `}</style>

            <Navbar />

            <div className="container mx-auto px-4 py-24 flex-grow">
                <div style={{ maxWidth: 900, margin: '0 auto' }}>

                    <Link to="/past-papers" className="inline-flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
                        <ArrowLeft className="mr-2" /> Back to Past Papers
                    </Link>

                    <div style={{
                        background: '#ffffff', borderRadius: '4px',
                        border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '2rem',
                    }}>

                        {/* ’’ Header ’’ */}
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <BookOpen size={20} style={{ color: '#6366f1' }} />
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    {paper.title}
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                {/* Badges */}
                                <div className="flex gap-2 flex-wrap">
                                    <span style={{
                                        padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 3,
                                        background: paper.exam_type === 'WAEC' ? '#f0fdf4' : '#faf5ff',
                                        color: paper.exam_type === 'WAEC' ? '#15803d' : '#7c3aed',
                                        border: `1px solid ${paper.exam_type === 'WAEC' ? '#bbf7d0' : '#e9d5ff'}`,
                                    }}>
                                        {paper.exam_type}
                                    </span>
                                    <span style={{
                                        padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 3,
                                        background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0',
                                    }}>
                                        {paper.year}
                                    </span>
                                    <span style={{
                                        padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: 3,
                                        background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
                                    }}>
                                        {paper.duration_minutes ?? 60} mins
                                    </span>
                                </div>

                                {/* Timer + Mode toggle */}
                                <div className="flex items-center gap-3">
                                    {mode === 'practice' && (
                                        <div className={`flex items-center gap-1.5 font-mono font-bold text-lg px-3 py-1 rounded-md border ${
                                            timeRemaining <= 300
                                                ? 'text-red-600 bg-red-50 border-red-200'
                                                : 'text-indigo-600 bg-indigo-50 border-indigo-100'
                                        }`}>
                                            {formatTime(timeRemaining)}
                                        </div>
                                    )}
                                    {mode === 'read' && (
                                        <button
                                            onClick={enterPractice}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-sm transition-colors shadow-sm"
                                        >
                                            Start Practice Mode
                                        </button>
                                    )}
                                    {mode === 'practice' && (
                                        <button
                                            onClick={exitPractice}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-bold text-sm transition-colors"
                                        >
                                            End Practice
                                        </button>
                                    )}
                                    {mode === 'results' && (
                                        <button
                                            onClick={enterPractice}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold text-sm transition-colors"
                                        >
                                            Retry
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ’’ Results View ’’ */}
                        {mode === 'results' && testResult && (
                            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-md">
                                <h2 className="text-xl font-bold text-green-800 mb-5 flex items-center gap-2">
                                    <CheckCircle size={22} /> Test Submitted!
                                </h2>
                                <FeedbackView feedbackData={testResult.feedback_data} score={testResult.score} />
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => { setMode('read'); setActiveTab('answers'); }}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold text-sm transition-colors"
                                    >
                                        Review Answer Bank
                                    </button>
                                    <button
                                        onClick={() => { setMode('read'); setActiveTab('questions'); }}
                                        className="px-4 py-2 bg-white text-green-700 border border-green-300 hover:bg-green-50 rounded-md font-bold text-sm transition-colors"
                                    >
                                        View Questions
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ’’ Tabs (only in read mode when answers exist) ’’ */}
                        {answerContent && mode === 'read' && (
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1rem' }}>
                                {[
                                    { id: 'questions', label: 'Questions',   icon: <FileText size={16} />,   activeColor: '#6366f1' },
                                    { id: 'answers',   label: 'Answer Bank', icon: <CheckCircle size={16} />, activeColor: '#10b981' },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.75rem 1rem', background: 'none', border: 'none',
                                            borderBottom: activeTab === tab.id ? `3px solid ${tab.activeColor}` : '3px solid transparent',
                                            color: activeTab === tab.id ? tab.activeColor : '#64748b',
                                            fontWeight: activeTab === tab.id ? 700 : 600,
                                            fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s',
                                        }}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ’’ Content Area ’’ */}
                        {mode !== 'results' && (
                            (!answerContent || activeTab === 'questions') ? (
                                <div className="paper-content" style={{ lineHeight: 1.75, fontSize: '0.97rem' }}>
                                    <ReactMarkdown 
                                        remarkPlugins={REMARK_PLUGINS} 
                                        rehypePlugins={REHYPE_PLUGINS} 
                                        components={PaperMarkdownComponents}
                                        urlTransform={(value) => value}
                                    >
                                        {mainContent}
                                    </ReactMarkdown>

                                    {mode === 'practice' && (
                                        <div className="mt-10 pt-6 border-t border-slate-100 text-right">
                                            <button
                                                onClick={handleSubmitTest}
                                                disabled={isSubmitting}
                                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-md font-bold text-base transition-colors shadow-md"
                                            >
                                                {isSubmitting ? 'Submitting...' : 'Submit Test'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="paper-content" style={{
                                    lineHeight: 1.75, fontSize: '0.97rem',
                                    background: '#f8fafc', border: '1px solid #e2e8f0',
                                    borderRadius: '4px', padding: '1.5rem',
                                }}>
                                    <ReactMarkdown 
                                        remarkPlugins={REMARK_PLUGINS} 
                                        rehypePlugins={REHYPE_PLUGINS} 
                                        components={PaperMarkdownComponents}
                                        urlTransform={(value) => value}
                                    >
                                        {answerContent}
                                    </ReactMarkdown>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
        </PaperContext.Provider>

        {/* Exit Practice Confirm Modal */}
        {showExitConfirm && (
            <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ background:'#fff', borderRadius:4, border:'1px solid #e2e8f0', padding:'2rem', maxWidth:400, width:'100%', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.12)' }}>
                    <p style={{ fontWeight:700, fontSize:'1.05rem', color:'#1e293b', marginBottom:'0.5rem' }}>Exit practice mode?</p>
                    <p style={{ color:'#64748b', fontSize:'0.9rem', marginBottom:'1.5rem' }}>Your answers will be lost and the timer will reset.</p>
                    <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
                        <button onClick={confirmExit} style={{ padding:'0.5rem 1.5rem', background:'#ef4444', color:'#fff', border:'none', borderRadius:4, fontWeight:700, cursor:'pointer' }}>Exit</button>
                        <button onClick={() => setShowExitConfirm(false)} style={{ padding:'0.5rem 1.5rem', background:'#f1f5f9', color:'#334155', border:'1px solid #e2e8f0', borderRadius:4, fontWeight:600, cursor:'pointer' }}>Stay</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default PaperViewer;
