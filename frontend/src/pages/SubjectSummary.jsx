import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft, BookOpen } from 'lucide-react';
import TikzDiagram from '../components/TikzDiagram';

/** Normalise Windows line-endings so remark parses paragraphs correctly. */
function preprocessContent(raw) {
    if (!raw) return '';
    return raw
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n');
}

const remarkPlugins = [
    [remarkMath, { singleDollarTextMath: true }],
    remarkGfm,
];

const rehypePlugins = [
    [rehypeKatex, { throwOnError: false, strict: false, trust: true }],
];

const SubjectSummary = () => {
    const { subjectId } = useParams();
    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTopicId, setActiveTopicId] = useState(null);

    // New state for the content of the active topic
    const [activeTopicContent, setActiveTopicContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');

    // Fetch Subject Outline (Lightweight)
    useEffect(() => {
        const fetchSubject = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/subjects/${subjectId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch subject details');
                }
                const data = await response.json();
                setSubject(data);
                if (data.topics && data.topics.length > 0) {
                    setActiveTopicId(data.topics[0].id);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSubject();
    }, [subjectId]);

    // Remove the previous useEffect for tikzjax here, as it's now handled by TikzDiagram

    // Fetch Topic Content when activeTopicId changes
    useEffect(() => {
        if (!activeTopicId) return;

        const fetchTopicContent = async () => {
            setContentLoading(true);
            setActiveTab('summary');
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/topics/${activeTopicId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch topic content');
                }
                const data = await response.json();
                setActiveTopicContent(data.summary_content);
            } catch (err) {
                console.error("Error fetching topic content:", err);
                setActiveTopicContent("Failed to load content. Please try again.");
            } finally {
                setContentLoading(false);
            }
        };

        fetchTopicContent();
    }, [activeTopicId]);

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading subject...</div>;
    if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500">Error: {error}</div>;
    if (!subject) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Subject not found</div>;

    const activeTopic = subject.topics.find(t => t.id === activeTopicId);

    let summaryText = activeTopicContent || "";
    let questionsText = "";
    if (summaryText.includes('---EXAMPLE QUESTIONS---')) {
        const parts = summaryText.split('---EXAMPLE QUESTIONS---');
        summaryText = parts[0];
        questionsText = parts[1];
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="container mx-auto px-4 py-24 flex-grow">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link to="/past-papers" className="inline-flex items-center text-slate-500 hover:text-primary mb-4 transition-colors">
                            <ArrowLeft className="mr-2" /> Back to Past Papers
                        </Link>
                        <h1 className="text-4xl font-bold text-slate-900">{subject.name}</h1>
                        <p className="text-slate-600 mt-2">{subject.description}</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar - Topics List */}
                        <div className="w-full md:w-1/4">
                            <div className="bg-white rounded-md shadow-sm border border-slate-100 overflow-hidden sticky top-24">
                                {/* Course Topics Section */}
                                <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-700 flex items-center">
                                    <BookOpen className="mr-2" /> Course Topics
                                </div>
                                <div className="max-h-[40vh] overflow-y-auto border-b border-slate-100">
                                    {subject.topics.filter(t => !t.title.startsWith("Past Questions")).map((topic) => (
                                        <button
                                            key={topic.id}
                                            onClick={() => setActiveTopicId(topic.id)}
                                            className={`w-full text-left px-4 py-3 border-l-4 transition-all ${activeTopicId === topic.id
                                                ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                : 'border-transparent hover:bg-slate-50 text-slate-600'
                                                }`}
                                        >
                                            {topic.title}
                                        </button>
                                    ))}
                                    {subject.topics.filter(t => !t.title.startsWith("Past Questions")).length === 0 && (
                                        <div className="p-4 text-slate-400 text-sm">No topics available yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content - Topic Summary */}
                        <div className="w-full md:w-3/4">
                            <div className="bg-white rounded-md shadow-sm border border-slate-100 p-8 min-h-[500px]">
                                {activeTopic ? (
                                    <article className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-primary prose-code:text-pink-600">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                            <h2 className="text-3xl font-bold text-slate-900">{activeTopic.title}</h2>
                                            {questionsText && (
                                                <div className="flex items-center gap-2 mt-4 md:mt-0 bg-slate-100 p-1 rounded-md shrink-0">
                                                    <button 
                                                        onClick={() => setActiveTab('summary')}
                                                        className={`px-4 py-1.5 text-sm font-bold rounded transition-all ${activeTab === 'summary' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        Study Material
                                                    </button>
                                                    <button 
                                                        onClick={() => setActiveTab('questions')}
                                                        className={`px-4 py-1.5 text-sm font-bold rounded transition-all ${activeTab === 'questions' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        Practice Questions
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {contentLoading ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                                <p>Loading content...</p>
                                            </div>
                                        ) : (
                                            <div className="paper-content">
                                                <style>{`
                                                    .paper-content .katex { font-size: 1.1em !important; }
                                                    .paper-content .katex-display { margin: 1.5rem 0; overflow-x: auto; padding: 0.5rem 0; }
                                                `}</style>
                                                <ReactMarkdown
                                                    remarkPlugins={remarkPlugins}
                                                    rehypePlugins={rehypePlugins}
                                                    components={{
                                                        pre({node, children, ...props}) {
                                                            const codeElement = React.Children.toArray(children)[0];
                                                            if (React.isValidElement(codeElement) && codeElement.props.className?.includes('language-tikz')) {
                                                                return <TikzDiagram content={String(codeElement.props.children).replace(/\\n$/, '')} />;
                                                            }
                                                            return <pre {...props}>{children}</pre>;
                                                        }
                                                    }}
                                                >
                                                    {preprocessContent(activeTab === 'questions' ? questionsText : summaryText)}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                    </article>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <BookOpen className="text-6xl mb-4 opacity-20" />
                                        <p>Select a topic to view its summary.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default SubjectSummary;
