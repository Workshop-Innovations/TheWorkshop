import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaRobot, FaPaperPlane, FaUpload, FaLightbulb, FaListAlt, FaFileAlt, FaSpinner, FaTimes, FaCheck, FaUndo, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { API_BASE_URL } from '../services/progressService';

const API_BASE = API_BASE_URL;

const AITutor = () => {
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [documentContent, setDocumentContent] = useState('');
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [isDragging, setIsDragging] = useState(false);

    // Chat State
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef(null);

    // Generator State
    const [isGenerating, setIsGenerating] = useState(false);
    const [genType, setGenType] = useState(null); // 'quiz' or 'flashcards'
    const [generatedContent, setGeneratedContent] = useState(null); // { type, data }

    // Quiz State
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    // Flashcard State
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchDocuments();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchDocuments = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setDocuments(await res.json());
            }
        } catch (e) {
            console.error("Failed to fetch docs", e);
        }
    };

    const uploadFile = async (file) => {
        if (!file || !token) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const newDoc = await res.json();
                fetchDocuments();
                handleSelectDocument(newDoc.id);
            } else {
                alert('Upload failed.');
            }
        } catch (e) {
            console.error("Upload error", e);
            alert('Upload failed.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        uploadFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        uploadFile(file);
    };

    const handleSelectDocument = async (docId) => {
        if (!token) return;
        setIsLoadingDoc(true);
        setSelectedDoc(docId);
        setMessages([]);
        setGeneratedContent(null);

        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/documents/${docId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocumentContent(data.content);
            }
        } catch (e) {
            console.error("Failed to load document", e);
        } finally {
            setIsLoadingDoc(false);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !selectedDoc || isSending) return;

        const userMessage = inputMessage;
        setInputMessage('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsSending(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [m.content]
            }));

            const res = await fetch(`${API_BASE}/api/v1/tutor/chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_id: selectedDoc, message: userMessage, history }),
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { role: 'model', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', content: 'Connection error. Please try again.' }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleGenerate = async (type) => {
        if (!selectedDoc || isGenerating) return;
        setIsGenerating(true);
        setGenType(type);
        setGeneratedContent(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setFlashcardIndex(0);
        setIsFlipped(false);

        try {
            const res = await fetch(`${API_BASE}/api/v1/tutor/generate/${type}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ document_id: selectedDoc }),
            });
            if (res.ok) {
                const data = await res.json();
                setGeneratedContent({ type, data: type === 'quiz' ? data.questions : data.flashcards });
            } else {
                alert(`Failed to generate ${type}. Please try again.`);
            }
        } catch (e) {
            console.error(`Generation error`, e);
            alert(`Generation failed.`);
        } finally {
            setIsGenerating(false);
            setGenType(null);
        }
    };

    const handleQuizAnswer = (qIndex, option) => {
        if (quizSubmitted) return;
        setQuizAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const renderQuiz = () => {
        const questions = generatedContent?.data || [];
        const score = questions.filter((q, i) => quizAnswers[i] === q.correct_answer).length;

        return (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">📝 Quiz</h2>
                    {quizSubmitted && <span className="font-bold text-lg text-primary">Score: {score}/{questions.length}</span>}
                    <button onClick={() => setGeneratedContent(null)} className="p-2 text-slate-400 hover:text-red-500"><FaTimes /></button>
                </div>
                <div className="space-y-6">
                    {questions.map((q, qIndex) => (
                        <div key={qIndex} className="p-4 bg-slate-50 rounded-xl">
                            <p className="font-semibold text-slate-800 mb-3">{qIndex + 1}. {q.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt, oIndex) => {
                                    const isSelected = quizAnswers[qIndex] === opt;
                                    const isCorrect = quizSubmitted && opt === q.correct_answer;
                                    const isWrong = quizSubmitted && isSelected && opt !== q.correct_answer;
                                    return (
                                        <button
                                            key={oIndex}
                                            onClick={() => handleQuizAnswer(qIndex, opt)}
                                            disabled={quizSubmitted}
                                            className={`p-3 text-left rounded-lg border-2 transition-all ${isCorrect ? 'bg-green-100 border-green-500 text-green-800' : isWrong ? 'bg-red-100 border-red-500 text-red-800' : isSelected ? 'bg-primary/10 border-primary' : 'bg-white border-slate-200 hover:border-primary'}`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-center gap-4">
                    {!quizSubmitted ? (
                        <button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < questions.length} className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50">
                            Submit Quiz
                        </button>
                    ) : (
                        <button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }} className="flex items-center gap-2 px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">
                            <FaUndo /> Retake
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderFlashcards = () => {
        const cards = generatedContent?.data || [];
        const card = cards[flashcardIndex];
        if (!card) return null;

        return (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex flex-col items-center h-[400px]">
                <div className="flex justify-between items-center w-full mb-4">
                    <h2 className="text-xl font-bold text-slate-800">🃏 Flashcards</h2>
                    <button onClick={() => setGeneratedContent(null)} className="p-2 text-slate-400 hover:text-red-500"><FaTimes /></button>
                </div>
                <div onClick={() => setIsFlipped(!isFlipped)} className="flex-grow w-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-primary/5 to-secondary/10 rounded-xl border-2 border-dashed border-slate-200 p-6">
                    <p className="text-center text-xl font-semibold text-slate-700">
                        {isFlipped ? card.definition : card.term}
                    </p>
                </div>
                <p className="text-xs text-slate-400 mt-2 mb-4">Click to {isFlipped ? 'see term' : 'flip'}</p>
                <div className="flex items-center gap-6">
                    <button onClick={() => { setFlashcardIndex(i => Math.max(0, i - 1)); setIsFlipped(false); }} disabled={flashcardIndex === 0} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 disabled:opacity-30"><FaArrowLeft /></button>
                    <span className="font-bold text-slate-600">{flashcardIndex + 1} / {cards.length}</span>
                    <button onClick={() => { setFlashcardIndex(i => Math.min(cards.length - 1, i + 1)); setIsFlipped(false); }} disabled={flashcardIndex === cards.length - 1} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 disabled:opacity-30"><FaArrowRight /></button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-grow flex flex-col lg:flex-row gap-6 p-6 pt-24">
                {/* Left Panel: Document Viewer */}
                <div
                    className={`relative lg:w-1/2 flex flex-col bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden transition-all ${isDragging ? 'border-primary border-2 bg-primary/5' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-20 backdrop-blur-sm">
                            <div className="text-center p-8 border-4 border-dashed border-primary rounded-3xl animate-pulse">
                                <FaUpload className="text-6xl text-primary mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-slate-700">Drop file to upload</h3>
                            </div>
                        </div>
                    )}

                    {/* Document Header / Toolbar */}
                    <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaFileAlt className="text-xl" />
                            <h2 className="font-bold text-lg">Study Material</h2>
                        </div>
                        <label className={`flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg cursor-pointer hover:bg-white/30 transition-all ${isUploading ? 'opacity-50' : ''}`}>
                            {isUploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                            <span className="font-semibold text-sm">{isUploading ? 'Uploading...' : 'Upload'}</span>
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.pdf" disabled={isUploading} />
                        </label>
                    </div>
                    {/* Document Selector */}
                    {documents.length > 0 && (
                        <div className="p-2 border-b border-slate-100 flex gap-2 overflow-x-auto">
                            {documents.map(doc => (
                                <button key={doc.id} onClick={() => handleSelectDocument(doc.id)} className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-all ${selectedDoc === doc.id ? 'bg-primary text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    {doc.filename}
                                </button>
                            ))}
                        </div>
                    )}
                    {/* Content */}
                    <div className="flex-grow p-6 overflow-y-auto bg-slate-50/50 prose prose-sm max-w-none">
                        {isLoadingDoc ? <div className="flex justify-center items-center h-full"><FaSpinner className="animate-spin text-4xl text-primary" /></div> :
                            selectedDoc ? <pre className="whitespace-pre-wrap font-sans text-slate-700">{documentContent}</pre> :
                                <div className="flex flex-col justify-center items-center h-full text-slate-400 text-center">
                                    <FaUpload className="text-5xl mb-4" />
                                    <p>Drag and drop a file or upload to get started.</p>
                                </div>
                        }
                    </div>
                    {/* Generate Buttons */}
                    {selectedDoc && (
                        <div className="p-4 border-t border-slate-100 bg-white flex gap-4 justify-center">
                            <button onClick={() => handleGenerate('quiz')} disabled={isGenerating} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-wait">
                                {isGenerating && genType === 'quiz' ? <FaSpinner className="animate-spin" /> : <FaListAlt />}
                                Generate Quiz
                            </button>
                            <button onClick={() => handleGenerate('flashcards')} disabled={isGenerating} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-wait">
                                {isGenerating && genType === 'flashcards' ? <FaSpinner className="animate-spin" /> : <FaLightbulb />}
                                Generate Flashcards
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel: Chat / Generated Content */}
                <div className="lg:w-1/2 flex flex-col">
                    {generatedContent ? (
                        generatedContent.type === 'quiz' ? renderQuiz() : renderFlashcards()
                    ) : (
                        <div className="flex-grow bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col">
                            {/* Chat Header */}
                            <div className="bg-primary p-4 text-white flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full"><FaRobot className="text-xl" /></div>
                                <div>
                                    <h1 className="font-bold text-lg">AI Study Tutor</h1>
                                    <p className="text-white/80 text-xs">Ask questions about your uploaded material.</p>
                                </div>
                            </div>
                            {/* Chat Messages */}
                            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50">
                                {!selectedDoc && (
                                    <div className="flex justify-center items-center h-full text-slate-400 text-center p-8">
                                        <p>Select or upload a document to start chatting with the AI Tutor.</p>
                                    </div>
                                )}
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${msg.role === 'user' ? 'bg-secondary text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isSending && <div className="flex justify-start"><div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm"><FaSpinner className="animate-spin text-primary" /></div></div>}
                                <div ref={chatEndRef} />
                            </div>
                            {/* Chat Input */}
                            <div className="p-4 bg-white border-t border-slate-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={selectedDoc ? "Type your question..." : "Select a document first..."}
                                        className="flex-grow p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        disabled={!selectedDoc || isSending}
                                    />
                                    <button onClick={sendMessage} disabled={!selectedDoc || isSending || !inputMessage.trim()} className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                                        <FaPaperPlane />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AITutor;
