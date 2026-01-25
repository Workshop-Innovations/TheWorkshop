import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaFileUpload, FaFileAlt, FaRobot } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService';
import { toast } from 'react-toastify';

const Tutor = () => {
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Auto-scroll to bottom of chat
    const endOfMessagesRef = useRef(null);

    const scrollToBottom = () => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    // Fetch documents on mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API_BASE_URL}/api/v1/tutor/documents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
                if (data.length > 0 && !selectedDoc) {
                    setSelectedDoc(data[0]); // Select first doc by default
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_BASE_URL}/api/v1/tutor/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            await fetchDocuments();
            toast.success("Document uploaded!");
        } catch (error) {
            toast.error("Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedDoc) return;

        const newUserMsg = { role: 'user', parts: [message] };
        setChatHistory(prev => [...prev, newUserMsg]);
        setMessage('');
        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const payload = {
                document_id: selectedDoc.id,
                message: newUserMsg.parts[0],
                history: chatHistory.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: msg.parts }))
            };

            const res = await fetch(`${API_BASE_URL}/api/v1/tutor/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to get response");

            const data = await res.json();
            const newAiMsg = { role: 'model', parts: [data.response] };
            setChatHistory(prev => [...prev, newAiMsg]);

        } catch (error) {
            toast.error("AI failed to respond. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background-secondary text-text-main">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-24 pb-20 flex gap-6 h-[calc(100vh-100px)]">
                {/* Sidebar: Document List */}
                <div className="w-1/4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hidden md:flex flex-col">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-primary">
                        <FaFileAlt /> Documents
                    </h2>

                    <div className="mb-6">
                        <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                            <input type="file" className="hidden" onChange={handleUpload} accept=".txt,.md,.py,.js" />
                            <div className="text-center">
                                {uploading ? <p>Uploading...</p> : (
                                    <>
                                        <FaFileUpload className="mx-auto text-2xl text-primary mb-2" />
                                        <span className="text-sm font-medium">Upload New Doc</span>
                                    </>
                                )}
                            </div>
                        </label>
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-2">
                        {documents.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => { setSelectedDoc(doc); setChatHistory([]); }} // Reset chat on switch
                                className={`w-full text-left p-3 rounded-lg text-sm transition-all ${selectedDoc?.id === doc.id ? 'bg-primary text-white' : 'hover:bg-gray-50 text-text-muted'}`}
                            >
                                {doc.filename}
                            </button>
                        ))}
                        {documents.length === 0 && <p className="text-sm text-text-muted text-center mt-10">No documents yet.</p>}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative">
                    {!selectedDoc ? (
                        <div className="flex flex-col items-center justify-center h-full text-text-muted">
                            <FaRobot className="text-6xl mb-4 text-primary/20" />
                            <p>Select or upload a document to start chatting.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">
                                    <FaRobot className="text-primary" />
                                    Chatting with: {selectedDoc.filename}
                                </h3>
                                <span className="text-xs text-text-muted">AI Tutor</span>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 space-y-4">
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                                ? 'bg-primary text-white rounded-br-none'
                                                : 'bg-gray-100 text-text-main rounded-bl-none'
                                            }`}>
                                            <p className="whitespace-pre-wrap">{msg.parts[0]}</p>
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-none">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={endOfMessagesRef} />
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-white">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Ask a question about the document..."
                                        className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !message.trim()}
                                        className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                                    >
                                        <FaPaperPlane />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Tutor;
