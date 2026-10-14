import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import {
    Bot, Send, Upload, Lightbulb, List, FileText, Loader2, X,
    ArrowLeft, ArrowRight, Trash2, MessageSquare,
    File, CheckCircle, XCircle, RotateCcw,
    Zap, Brain, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../services/progressService';
import { useAuth } from '../context/AuthContext';

const API_BASE = API_BASE_URL;

// ── Lightweight markdown → HTML renderer ─────────────────────────────────────
const renderMarkdown = (text) => {
    if (!text) return '';
    // Escape HTML first
    let t = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // Bold / italic / code
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
    t = t.replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-primary">$1</code>');
    // Headers
    t = t.replace(/^### (.+)$/gm, '<h3 class="font-bold text-[13px] text-slate-800 mt-3 mb-1">$1</h3>');
    t = t.replace(/^## (.+)$/gm, '<h2 class="font-bold text-sm text-slate-800 mt-3 mb-1">$1</h2>');
    t = t.replace(/^# (.+)$/gm, '<h1 class="font-bold text-base text-slate-800 mt-3 mb-1">$1</h1>');
    // Lists
    t = t.replace(/^[-*] (.+)$/gm, '<li class="ml-3 list-disc text-slate-700 mb-0.5 text-sm">$1</li>');
    t = t.replace(/^\d+\. (.+)$/gm, '<li class="ml-3 list-decimal text-slate-700 mb-0.5 text-sm">$1</li>');
    // Paragraphs
    t = t.replace(/\n\n+/g, '</p><p class="mb-2 text-sm text-slate-700 leading-relaxed">');
    t = t.replace(/\n/g, '<br/>');
    return `<p class="mb-2 text-sm text-slate-700 leading-relaxed">${t}</p>`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
};

// ── Component ────────────────────────────────────────────────────────────────
const StudySuite = () => {
    const { accessToken: token } = useAuth();

    // Document state
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [documentContent, setDocumentContent] = useState(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);

    // Right panel tabs
    const [activeTab, setActiveTab] = useState('chat');

    // Chat
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef(null);

    // Quiz
    const [quiz, setQuiz] = useState(null);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    // Flashcards
    const [flashcards, setFlashcards] = useState(null);
    const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => { fetchDocuments(); }, []);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isSending]);
    useEffect(() => () => { if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl); }, [pdfBlobUrl]);

    // ── Data fetching ─────────────────────────────────────────────────────────
    const fetchDocuments = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setDocuments(await res.json());
        } catch { /* silent */ }
    };

    // ── Upload ────────────────────────────────────────────────────────────────
    const uploadFile = async (file) => {
        if (!token) { toast.error('Please log in to upload files.'); return; }
        if (!file) return;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.pdf', '.txt', '.md'].includes(ext)) {
            toast.error('Only PDF, TXT, and Markdown files are supported.');
            return;
        }
        setIsUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                const newDoc = await res.json();
                toast.success(`"${newDoc.filename}" uploaded! ✅`);
                fetchDocuments();
                handleSelectDocument(newDoc.id);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`Upload failed: ${err.detail || 'Unknown error'}`);
            }
        } catch {
            toast.error('Upload failed — check your connection.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileInput = (e) => { uploadFile(e.target.files[0]); e.target.value = ''; };
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); uploadFile(e.dataTransfer.files[0]); };

    // ── Select document ───────────────────────────────────────────────────────
    const handleSelectDocument = async (docId) => {
        if (!token || docId === selectedDoc) return;
        setIsLoadingDoc(true);
        setSelectedDoc(docId);
        setMessages([]);
        setQuiz(null); setFlashcards(null);
        setQuizAnswers({}); setQuizSubmitted(false);
        setFlashcardIndex(0); setIsFlipped(false);
        setActiveTab('chat');
        if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }

        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/documents/${docId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocumentContent(data);
                if (data.file_type === 'pdf') {
                    setIsLoadingPdf(true);
                    try {
                        // Fetch as authenticated blob — avoids Supabase redirect/CSP blocking in iframes
                        const pdfRes = await fetch(
                            `${API_BASE}/api/v1/tutor/files/${docId}?token=${encodeURIComponent(token)}`
                        );
                        if (pdfRes.ok) {
                            const rawBlob = await pdfRes.blob();
                            // Force application/pdf MIME type — the redirect chain (backend → Supabase)
                            // may return application/octet-stream or text/plain, which causes the
                            // browser to display raw PDF bytes as text instead of rendering the PDF.
                            const pdfBlob = new Blob([await rawBlob.arrayBuffer()], { type: 'application/pdf' });
                            setPdfBlobUrl(URL.createObjectURL(pdfBlob));
                        } else {
                            toast.warning('PDF preview unavailable. AI features still work.');
                        }
                    } catch {
                        toast.warning('Could not load PDF preview.');
                    } finally {
                        setIsLoadingPdf(false);
                    }
                }
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`Could not load document: ${err.detail || 'Unknown error'}`);
                setSelectedDoc(null);
            }
        } catch {
            toast.error('Network error loading document.');
            setSelectedDoc(null);
        } finally {
            setIsLoadingDoc(false);
        }
    };

    // ── Delete document ───────────────────────────────────────────────────────
    const handleDeleteDocument = async (docId, filename, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/documents/${docId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok || res.status === 204) {
                toast.success(`"${filename}" deleted.`);
                setDocuments(prev => prev.filter(d => d.id !== docId));
                if (selectedDoc === docId) {
                    setSelectedDoc(null); setDocumentContent(null);
                    if (pdfBlobUrl) { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }
                }
            } else {
                toast.error('Could not delete document.');
            }
        } catch {
            toast.error('Network error. Could not delete.');
        }
    };

    // ── Chat ──────────────────────────────────────────────────────────────────
    const sendMessage = async () => {
        if (!inputMessage.trim() || !selectedDoc || isSending) return;
        const userMsg = inputMessage;
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsSending(true);
        try {
            // Local error bubbles ("⚠️ Connection error…") aren't real model turns — don't send them as history
            const history = messages.filter(m => !m.isError).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [m.content]
            }));
            const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_id: selectedDoc, message: userMsg, history }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'model', content: data.response }]);
            } else {
                const err = await res.json().catch(() => ({}));
                const msg = err.detail || 'Sorry, I encountered an error.';
                setMessages(prev => [...prev, { role: 'model', content: `⚠️ ${msg}`, isError: true }]);
                if (res.status === 402) toast.warning(msg);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'model', content: '⚠️ Connection error. Please try again.', isError: true }]);
        } finally {
            setIsSending(false);
        }
    };

    // ── Generate quiz ─────────────────────────────────────────────────────────
    const handleGenerateQuiz = async () => {
        if (!selectedDoc || isGeneratingQuiz || isGeneratingFlashcards) return;
        setIsGeneratingQuiz(true);
        setActiveTab('quiz');
        setQuizAnswers({}); setQuizSubmitted(false);
        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/generate/quiz`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_id: selectedDoc }),
            });
            if (res.ok) {
                const data = await res.json();
                setQuiz(data.questions);
                toast.success('Quiz generated! Good luck 🎯');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`Quiz generation failed: ${err.detail || 'Please try again.'}`);
                setActiveTab('chat');
            }
        } catch {
            toast.error('Quiz generation failed — check your connection.');
            setActiveTab('chat');
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    // ── Generate flashcards ───────────────────────────────────────────────────
    const handleGenerateFlashcards = async () => {
        if (!selectedDoc || isGeneratingFlashcards || isGeneratingQuiz) return;
        setIsGeneratingFlashcards(true);
        setActiveTab('flashcards');
        setFlashcardIndex(0); setIsFlipped(false);
        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/generate/flashcards`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_id: selectedDoc }),
            });
            if (res.ok) {
                const data = await res.json();
                setFlashcards(data.flashcards);
                toast.success('Flashcards ready! 🃏');
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(`Flashcard generation failed: ${err.detail || 'Please try again.'}`);
                setActiveTab('chat');
            }
        } catch {
            toast.error('Flashcard generation failed — check your connection.');
            setActiveTab('chat');
        } finally {
            setIsGeneratingFlashcards(false);
        }
    };

    // ── Derived state ─────────────────────────────────────────────────────────
    const quizScore = quiz ? quiz.filter((q, i) => quizAnswers[i] === q.correct_answer).length : 0;
    const answeredCount = Object.keys(quizAnswers).length;
    const isGenerating = isGeneratingQuiz || isGeneratingFlashcards;

    const FileIcon = ({ type }) => type === 'pdf'
        ? <FileText size={13} className="text-red-400 flex-shrink-0" />
        : <File size={13} className="text-blue-400 flex-shrink-0" />;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Scoped styles for flashcard 3D flip & prose */}
            <style>{`
                .fc-scene { perspective: 1200px; width: 100%; height: 100%; }
                .fc-card {
                    position: relative; width: 100%; height: 100%;
                    transform-style: preserve-3d;
                    transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .fc-card.flipped { transform: rotateY(180deg); }
                .fc-face {
                    position: absolute; inset: 0;
                    backface-visibility: hidden; -webkit-backface-visibility: hidden;
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; padding: 28px; border-radius: 16px;
                    text-align: center;
                }
                .fc-front {
                    background: linear-gradient(135deg, #154c79 0%, #1e6ba8 100%);
                }
                .fc-back {
                    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
                    transform: rotateY(180deg);
                }
                .chat-prose p { margin-bottom: 6px; }
                .chat-prose p:last-child { margin-bottom: 0; }
                .chat-prose li { margin-left: 12px; }
                .chat-prose strong { font-weight: 700; }
            `}</style>

            <Navbar />

            {/* Main content — fills viewport below navbar */}
            <div className="flex flex-col" style={{ marginTop: '64px', height: 'calc(100vh - 64px)' }}>

                {/* ── Top bar ─────────────────────────────────────────────── */}
                <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Brain size={18} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900 text-sm leading-none">Study Suite</h1>
                            <p className="text-[11px] text-slate-400 mt-0.5">AI-powered document study tool</p>
                        </div>
                    </div>
                </div>

                {/* ── 3-panel area ─────────────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
                    <div className="flex-shrink-0 w-60 bg-white border-r border-slate-200 flex flex-col overflow-hidden">

                        {/* Upload button */}
                        <div className="flex-shrink-0 p-3 border-b border-slate-100">
                            <label className={`flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-primary text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-primary/90 active:scale-[0.98] transition-all ${isUploading ? 'opacity-70 cursor-wait' : ''}`}>
                                {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                {isUploading ? 'Uploading…' : 'Upload Document'}
                                <input type="file" className="hidden" onChange={handleFileInput} accept=".txt,.md,.pdf" disabled={isUploading} />
                            </label>
                            <p className="text-[10px] text-slate-400 text-center mt-1.5">PDF · TXT · Markdown</p>
                        </div>

                        {/* Document list */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {documents.length === 0 ? (
                                <div className="p-5 text-center text-slate-400 mt-6">
                                    <FileText size={28} className="mx-auto mb-2 opacity-25" />
                                    <p className="text-xs font-medium">No documents yet</p>
                                    <p className="text-[10px] mt-0.5">Upload a file to begin.</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-0.5">
                                    {documents.map(doc => (
                                        <button
                                            key={doc.id}
                                            onClick={() => handleSelectDocument(doc.id)}
                                            className={`w-full text-left px-2.5 py-2 rounded-lg transition-all group relative border ${
                                                selectedDoc === doc.id
                                                    ? 'bg-primary/8 border-primary/25'
                                                    : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <FileIcon type={doc.file_type} />
                                                <div className="min-w-0 flex-1 leading-tight">
                                                    <p className={`text-[11px] font-semibold truncate ${selectedDoc === doc.id ? 'text-primary' : 'text-slate-700'}`}>
                                                        {doc.filename}
                                                    </p>
                                                    <p className="text-[9px] text-slate-400 mt-0.5">{formatDate(doc.created_at)}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteDocument(doc.id, doc.filename, e)}
                                                    className="opacity-0 group-hover:opacity-100 ml-0.5 p-0.5 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── CENTER: Document viewer ───────────────────────── */}
                    <div
                        className={`flex-1 flex flex-col overflow-hidden transition-colors relative ${isDragging ? 'bg-primary/5 ring-2 ring-inset ring-primary' : 'bg-slate-50'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {isDragging && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                <div className="bg-white rounded-md shadow-2xl p-10 border-2 border-dashed border-primary text-center">
                                    <Upload size={40} className="text-primary mx-auto mb-2 animate-bounce" />
                                    <p className="font-bold text-slate-700">Drop file to upload</p>
                                </div>
                            </div>
                        )}

                        {/* Viewer toolbar */}
                        <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                            <FileText size={13} className="text-slate-300" />
                            <span className="text-xs text-slate-500 truncate flex-1">
                                {documentContent ? documentContent.filename : 'No document selected'}
                            </span>
                            {documentContent?.file_type && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${documentContent.file_type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                    {documentContent.file_type.toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Viewer content */}
                        <div className="flex-1 overflow-hidden relative">
                            {isLoadingDoc ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <Loader2 size={28} className="animate-spin text-primary" />
                                    <p className="text-xs text-slate-400">Loading document…</p>
                                </div>
                            ) : !selectedDoc ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                        <Upload size={24} className="text-slate-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">No document selected</p>
                                        <p className="text-xs text-slate-400 mt-1">Upload a file or pick one from the sidebar.</p>
                                    </div>
                                    <p className="text-[10px] text-slate-300 border border-dashed border-slate-200 rounded-lg px-3 py-1.5">
                                        Supports drag &amp; drop
                                    </p>
                                </div>
                            ) : documentContent?.file_type === 'pdf' ? (
                                isLoadingPdf ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <Loader2 size={28} className="animate-spin text-primary" />
                                        <p className="text-xs text-slate-400">Loading PDF preview…</p>
                                    </div>
                                ) : pdfBlobUrl ? (
                                    <iframe
                                        src={pdfBlobUrl}
                                        className="w-full h-full border-0"
                                        title={documentContent.filename}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                                        <FileText size={36} className="text-slate-200" />
                                        <p className="text-sm font-semibold text-slate-500">PDF preview unavailable</p>
                                        <p className="text-xs text-slate-400">AI chat and generation features still work — use the panel on the right.</p>
                                    </div>
                                )
                            ) : (
                                <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                                        {documentContent?.content}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT PANEL: Tabs ─────────────────────────────── */}
                    <div className="flex-shrink-0 w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden">

                        {/* Tab bar */}
                        <div className="flex-shrink-0 flex border-b border-slate-200">
                            {[
                                { id: 'chat', label: 'AI Chat', icon: <MessageSquare size={12} /> },
                                { id: 'quiz', label: 'Quiz', icon: <List size={12} />, count: quiz?.length },
                                { id: 'flashcards', label: 'Flashcards', icon: <Lightbulb size={12} />, count: flashcards?.length },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold transition-all border-b-2 ${
                                        activeTab === tab.id
                                            ? 'border-primary text-primary bg-primary/3'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count != null && (
                                        <span className="px-1 py-0.5 bg-primary/10 text-primary text-[9px] rounded font-bold">
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* ── Chat tab ──────────────────────────────────── */}
                        {activeTab === 'chat' && (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar bg-slate-50/60">
                                    {!selectedDoc ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6 gap-2">
                                            <Bot size={32} className="opacity-20" />
                                            <p className="text-xs font-medium text-slate-500">Select a document</p>
                                            <p className="text-[11px]">to start your AI study session.</p>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-2">
                                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                                                <Sparkles size={20} className="text-white" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 mt-1">Ready to help!</p>
                                            <p className="text-[11px] text-slate-400">
                                                Ask me anything about <span className="font-semibold text-slate-600">{documentContent?.filename}</span>.
                                            </p>
                                        </div>
                                    ) : null}

                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                                            {msg.role !== 'user' && (
                                                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <Bot size={10} className="text-white" />
                                                </div>
                                            )}
                                            <div className={`py-2.5 px-3 rounded-md max-w-[88%] shadow-sm ${
                                                msg.role === 'user'
                                                    ? 'bg-primary text-white rounded-tr-sm'
                                                    : msg.isError
                                                        ? 'bg-red-50 border border-red-100 text-red-700 rounded-tl-sm'
                                                        : 'bg-white border border-slate-100 rounded-tl-sm'
                                            }`}>
                                                {msg.role === 'user' ? (
                                                    <p className="text-xs leading-relaxed">{msg.content}</p>
                                                ) : (
                                                    <div
                                                        className="chat-prose"
                                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isSending && (
                                        <div className="flex justify-start gap-2">
                                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                                <Bot size={10} className="text-white" />
                                            </div>
                                            <div className="py-3 px-4 bg-white border border-slate-100 rounded-md rounded-tl-sm shadow-sm">
                                                <div className="flex gap-1 items-center h-3">
                                                    {[0, 150, 300].map(d => (
                                                        <span key={d} className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat input */}
                                <div className="flex-shrink-0 p-3 bg-white border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={e => setInputMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            disabled={!selectedDoc || isSending}
                                            placeholder={selectedDoc ? 'Ask a question…' : 'Select a document first…'}
                                            className="flex-1 px-3 py-2 text-xs bg-slate-50 rounded-md border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!selectedDoc || isSending || !inputMessage.trim()}
                                            className="p-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-all disabled:opacity-40"
                                        >
                                            <Send size={13} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Quiz tab ───────────────────────────────────── */}
                        {activeTab === 'quiz' && (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                {isGeneratingQuiz ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <Loader2 size={28} className="animate-spin text-primary" />
                                        <p className="text-xs text-slate-400">Generating quiz questions…</p>
                                    </div>
                                ) : !quiz ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                                        <List size={36} className="text-slate-200" />
                                        <p className="text-sm font-semibold text-slate-500">No quiz yet</p>
                                        <p className="text-xs text-slate-400">Select a document and generate a quiz from the sidebar.</p>
                                        {selectedDoc && (
                                            <button onClick={handleGenerateQuiz} className="mt-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all">
                                                Generate Quiz
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* Quiz header */}
                                        <div className="flex-shrink-0 px-3 py-2.5 border-b border-slate-100 bg-white flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">
                                                    {quizSubmitted ? `Score: ${quizScore} / ${quiz.length}` : `${answeredCount} / ${quiz.length} answered`}
                                                </p>
                                                <div className="w-32 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            quizSubmitted
                                                                ? quizScore / quiz.length >= 0.7 ? 'bg-green-500' : 'bg-amber-500'
                                                                : 'bg-primary'
                                                        }`}
                                                        style={{ width: `${quizSubmitted ? (quizScore / quiz.length) * 100 : (answeredCount / quiz.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={() => { setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false); }} className="text-slate-300 hover:text-red-400 transition-all">
                                                <X size={14} />
                                            </button>
                                        </div>

                                        {/* Questions */}
                                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                            {quiz.map((q, qi) => (
                                                <div key={qi} className="bg-slate-50 rounded-md p-3 border border-slate-100">
                                                    <p className="text-[11px] font-bold text-slate-800 mb-2">{qi + 1}. {q.question}</p>
                                                    <div className="space-y-1.5">
                                                        {q.options.map((opt, oi) => {
                                                            const sel = quizAnswers[qi] === opt;
                                                            const correct = quizSubmitted && opt === q.correct_answer;
                                                            const wrong = quizSubmitted && sel && !correct;
                                                            return (
                                                                <button
                                                                    key={oi}
                                                                    onClick={() => !quizSubmitted && setQuizAnswers(p => ({ ...p, [qi]: opt }))}
                                                                    disabled={quizSubmitted}
                                                                    className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] border transition-all flex items-center gap-2 ${
                                                                        correct ? 'bg-green-50 border-green-400 text-green-800'
                                                                        : wrong ? 'bg-red-50 border-red-400 text-red-800'
                                                                        : sel ? 'bg-primary/8 border-primary text-primary'
                                                                        : 'bg-white border-slate-200 hover:border-primary/30 hover:bg-primary/3 text-slate-700'
                                                                    }`}
                                                                >
                                                                    {correct ? <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
                                                                     : wrong ? <XCircle size={11} className="text-red-500 flex-shrink-0" />
                                                                     : <span className={`w-2.5 h-2.5 rounded-full border flex-shrink-0 ${sel ? 'bg-primary border-primary' : 'border-slate-300'}`} />}
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Quiz actions */}
                                        <div className="flex-shrink-0 p-3 border-t border-slate-100 flex gap-2">
                                            {!quizSubmitted ? (
                                                <button
                                                    onClick={() => setQuizSubmitted(true)}
                                                    disabled={answeredCount < quiz.length}
                                                    className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-40"
                                                >
                                                    Submit Quiz
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-all"
                                                >
                                                    <RotateCcw size={11} /> Retake
                                                </button>
                                            )}
                                            <button
                                                onClick={handleGenerateQuiz}
                                                disabled={isGenerating}
                                                className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-40"
                                                title="Generate new quiz"
                                            >
                                                <Zap size={13} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── Flashcards tab ─────────────────────────────── */}
                        {activeTab === 'flashcards' && (
                            <div className="flex flex-col flex-1 overflow-hidden">
                                {isGeneratingFlashcards ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <Loader2 size={28} className="animate-spin text-accent" />
                                        <p className="text-xs text-slate-400">Generating flashcards…</p>
                                    </div>
                                ) : !flashcards ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                                        <Lightbulb size={36} className="text-slate-200" />
                                        <p className="text-sm font-semibold text-slate-500">No flashcards yet</p>
                                        <p className="text-xs text-slate-400">Select a document and generate flashcards from the sidebar.</p>
                                        {selectedDoc && (
                                            <button onClick={handleGenerateFlashcards} className="mt-1 px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:bg-accent/90 transition-all">
                                                Generate Flashcards
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col flex-1 overflow-hidden p-4">
                                        {/* Header */}
                                        <div className="flex-shrink-0 flex items-center justify-between mb-3">
                                            <p className="text-xs font-bold text-slate-700">
                                                Card {flashcardIndex + 1} / {flashcards.length}
                                            </p>
                                            <button onClick={() => setFlashcards(null)} className="text-slate-300 hover:text-red-400 transition-all">
                                                <X size={14} />
                                            </button>
                                        </div>

                                        {/* Progress dots */}
                                        <div className="flex-shrink-0 flex gap-1 flex-wrap mb-4">
                                            {flashcards.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setFlashcardIndex(i); setIsFlipped(false); }}
                                                    className={`h-1.5 rounded-full transition-all ${i === flashcardIndex ? 'bg-accent w-4' : 'bg-slate-200 w-1.5 hover:bg-slate-300'}`}
                                                />
                                            ))}
                                        </div>

                                        {/* 3D Flip Card */}
                                        <div
                                            className="fc-scene flex-1 cursor-pointer select-none"
                                            style={{ minHeight: '180px' }}
                                            onClick={() => setIsFlipped(v => !v)}
                                        >
                                            <div className={`fc-card ${isFlipped ? 'flipped' : ''}`}>
                                                <div className="fc-face fc-front">
                                                    <div>
                                                        <p className="text-[9px] uppercase tracking-[0.15em] text-white/50 font-bold mb-3">Term</p>
                                                        <p className="text-base font-bold text-white leading-snug">
                                                            {flashcards[flashcardIndex]?.term}
                                                        </p>
                                                        <p className="text-[9px] text-white/40 mt-4">Tap to flip</p>
                                                    </div>
                                                </div>
                                                <div className="fc-face fc-back">
                                                    <div>
                                                        <p className="text-[9px] uppercase tracking-[0.15em] text-white/50 font-bold mb-3">Definition</p>
                                                        <p className="text-xs text-white leading-relaxed">
                                                            {flashcards[flashcardIndex]?.definition}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Navigation */}
                                        <div className="flex-shrink-0 flex items-center justify-between mt-4">
                                            <button
                                                onClick={() => { setFlashcardIndex(i => Math.max(0, i - 1)); setIsFlipped(false); }}
                                                disabled={flashcardIndex === 0}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30"
                                            >
                                                <ArrowLeft size={12} /> Prev
                                            </button>
                                            <button
                                                onClick={handleGenerateFlashcards}
                                                disabled={isGenerating}
                                                title="Regenerate"
                                                className="p-2 text-slate-300 hover:text-accent transition-all disabled:opacity-30"
                                            >
                                                <RotateCcw size={13} />
                                            </button>
                                            <button
                                                onClick={() => { setFlashcardIndex(i => Math.min(flashcards.length - 1, i + 1)); setIsFlipped(false); }}
                                                disabled={flashcardIndex === flashcards.length - 1}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30"
                                            >
                                                Next <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* ─────────────────────────────────────────────────── */}
                </div>
            </div>
        </div>
    );
};

export default StudySuite;
