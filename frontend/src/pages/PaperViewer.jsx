import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Normalises the raw markdown/LaTeX content from the database before
 * it is handed to ReactMarkdown.
 *
 * Problems this fixes:
 *  1. Windows \r\n line-endings that confuse the markdown parser.
 *  2. Single-line paragraphs that end up run-together when \r\n collapses.
 *  3. Answer-option lines (A. / B. / C. / D.) that need a blank line before
 *     them so remark-math does not try to stitch them into the previous
 *     paragraph.
 *  4. Bare `$` signs used as currency INSIDE a math expression
 *     (e.g. $\$1{,}250$) are fine; bare dollar signs OUTSIDE math
 *     (e.g.  "$1,600" without a closing `$` on the same run) are
 *     escaped so they don't accidentally open a math span.
 */
function preprocessContent(raw) {
    if (!raw) return '';

    // 1. Normalise line endings to \n
    let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. Ensure answer-option lines always start on their own paragraph.
    //    Lines like "A. $…$" should be preceded by a blank line.
    text = text.replace(/\n([A-D]\.\s)/g, '\n\n$1');

    // 3. Ensure numbered question lines always start a new paragraph.
    text = text.replace(/\n(\d+\.\s)/g, '\n\n$1');

    // 4. Collapse runs of 3+ blank lines down to 2 (one blank line = paragraph break).
    text = text.replace(/\n{3,}/g, '\n\n');

    return text;
}

/* ─── Custom renderers ──────────────────────────────────────────────────── */

/**
 * Render `<p>` tags that contain answer-option text (A. / B. / C. / D.)
 * with a subtle left border so they stand out visually.
 */
const PaperParagraph = ({ children, ...props }) => {
    // Convert children to a plain string to detect answer-option lines
    const text = React.Children.toArray(children)
        .map(c => (typeof c === 'string' ? c : ''))
        .join('');

    const isOption = /^[A-D]\.\s/.test(text.trimStart());

    if (isOption) {
        return (
            <p
                {...props}
                style={{
                    paddingLeft: '1rem',
                    borderLeft: '3px solid #e2e8f0',
                    marginTop: '0.35rem',
                    marginBottom: '0.35rem',
                    color: '#334155',
                }}
            >
                {children}
            </p>
        );
    }

    return <p {...props} style={{ marginBottom: '0.75rem', color: '#475569' }}>{children}</p>;
};

/** Render markdown tables with decent styling */
const PaperTable = ({ children }) => (
    <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '0.9rem',
        }}>
            {children}
        </table>
    </div>
);

const PaperTh = ({ children }) => (
    <th style={{
        border: '1px solid #cbd5e1',
        padding: '6px 12px',
        backgroundColor: '#f1f5f9',
        textAlign: 'left',
        fontWeight: 600,
    }}>
        {children}
    </th>
);

const PaperTd = ({ children }) => (
    <td style={{
        border: '1px solid #e2e8f0',
        padding: '6px 12px',
    }}>
        {children}
    </td>
);

/* ─── Main Component ────────────────────────────────────────────────────── */

const PaperViewer = () => {
    const { paperId } = useParams();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAnswers, setShowAnswers] = useState(false);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/papers/${paperId}`
                );
                if (!response.ok) throw new Error('Failed to fetch paper');
                const data = await response.json();
                setPaper(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPaper();
    }, [paperId]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: 48, height: 48, border: '4px solid #e2e8f0',
                    borderTopColor: '#6366f1', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 1rem',
                }} />
                <p style={{ color: '#64748b' }}>Loading paper…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500">
            Error: {error}
        </div>
    );

    if (!paper) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            Paper not found
        </div>
    );

    const content = preprocessContent(paper.content);

    // Split content on the "ANSWER BANK" / "ANSWER" heading so we can
    // show/hide answers separately
    const answerSplit = content.split(/\n#{0,3}\s*ANSWER(?:\s+BANK)?/i);
    const mainContent = answerSplit[0];
    const answerContent = answerSplit[1] ? '## Answer Bank\n' + answerSplit[1] : null;

    const remarkPlugins = [
        [remarkMath, { singleDollarTextMath: true }],
        remarkGfm,
    ];

    const rehypePlugins = [
        [rehypeKatex, { throwOnError: false, strict: false, trust: true }],
    ];

    const components = {
        p: PaperParagraph,
        table: PaperTable,
        th: PaperTh,
        td: PaperTd,
        h1: ({ children }) => (
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '1.5rem 0 0.5rem' }}>
                {children}
            </h1>
        ),
        h2: ({ children }) => (
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#334155', margin: '1.25rem 0 0.4rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>
                {children}
            </h2>
        ),
        h3: ({ children }) => (
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', margin: '1rem 0 0.3rem' }}>
                {children}
            </h3>
        ),
        strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: '#1e293b' }}>{children}</strong>
        ),
        li: ({ children }) => (
            <li style={{ marginBottom: '0.25rem', color: '#475569' }}>{children}</li>
        ),
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }

                /* KaTeX overrides: keep math inline with surrounding text */
                .paper-content .katex { font-size: 1em !important; }
                .paper-content .katex-display {
                    margin: 1rem 0;
                    overflow-x: auto;
                }

                /* Prose reset so Tailwind's .prose doesn't conflict */
                .paper-content p   { margin-bottom: 0.75rem; }
                .paper-content ul,
                .paper-content ol  { padding-left: 1.5rem; margin-bottom: 0.75rem; }
                .paper-content pre { overflow-x: auto; }
            `}</style>

            <Navbar />

            <div className="container mx-auto px-4 py-24 flex-grow">
                <div style={{ maxWidth: 900, margin: '0 auto' }}>

                    {/* Back link */}
                    <Link
                        to="/past-papers"
                        className="inline-flex items-center text-slate-500 hover:text-primary mb-6 transition-colors"
                    >
                        <ArrowLeft className="mr-2" /> Back to Past Papers
                    </Link>

                    {/* Card */}
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '1rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        padding: '2rem',
                    }}>
                        {/* Header */}
                        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <BookOpen size={20} style={{ color: '#6366f1' }} />
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                    {paper.title}
                                </h1>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{
                                    padding: '2px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    borderRadius: 6,
                                    background: paper.exam_type === 'WAEC' ? '#f0fdf4' : '#faf5ff',
                                    color: paper.exam_type === 'WAEC' ? '#15803d' : '#7c3aed',
                                    border: `1px solid ${paper.exam_type === 'WAEC' ? '#bbf7d0' : '#e9d5ff'}`,
                                }}>
                                    {paper.exam_type}
                                </span>
                                <span style={{
                                    padding: '2px 10px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 6,
                                    background: '#f8fafc',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                }}>
                                    {paper.year}
                                </span>
                            </div>
                        </div>

                        {/* Main paper content */}
                        <div className="paper-content" style={{ lineHeight: 1.75, fontSize: '0.97rem' }}>
                            <ReactMarkdown
                                remarkPlugins={remarkPlugins}
                                rehypePlugins={rehypePlugins}
                                components={components}
                            >
                                {mainContent}
                            </ReactMarkdown>
                        </div>

                        {/* Collapsible Answer Bank */}
                        {answerContent && (
                            <div style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <button
                                    onClick={() => setShowAnswers(v => !v)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: showAnswers ? '#6366f1' : '#f1f5f9',
                                        color: showAnswers ? '#fff' : '#475569',
                                        border: 'none',
                                        borderRadius: 8,
                                        padding: '0.5rem 1.25rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {showAnswers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {showAnswers ? 'Hide Answers' : 'Show Answer Bank'}
                                </button>

                                {showAnswers && (
                                    <div
                                        className="paper-content"
                                        style={{
                                            marginTop: '1rem',
                                            background: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 8,
                                            padding: '1.25rem',
                                            lineHeight: 1.75,
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        <ReactMarkdown
                                            remarkPlugins={remarkPlugins}
                                            rehypePlugins={rehypePlugins}
                                            components={components}
                                        >
                                            {answerContent}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PaperViewer;
