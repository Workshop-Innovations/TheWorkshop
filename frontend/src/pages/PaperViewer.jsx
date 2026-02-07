import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaArrowLeft } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const PaperViewer = () => {
    const { paperId } = useParams();
    const [paper, setPaper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPaper = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/papers/${paperId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch paper');
                }
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

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading paper...</div>;
    if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500">Error: {error}</div>;
    if (!paper) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Paper not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="container mx-auto px-4 py-24 flex-grow">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                    <Link to="/past-papers" className="inline-flex items-center text-slate-500 hover:text-primary mb-6 transition-colors">
                        <FaArrowLeft className="mr-2" /> Back to Past Papers
                    </Link>

                    <div className="mb-8 border-b border-slate-100 pb-4">
                        <h1 className="text-3xl font-bold text-slate-900">{paper.title}</h1>
                        <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded-md ${paper.exam_type === 'WAEC' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                {paper.exam_type}
                            </span>
                            <span className="px-2 py-1 bg-slate-100 text-xs font-semibold text-slate-600 rounded-md border border-slate-200">{paper.year}</span>
                        </div>
                    </div>

                    <article className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-primary prose-code:text-pink-600">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
                        >
                            {paper.content}
                        </ReactMarkdown>
                    </article>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PaperViewer;
