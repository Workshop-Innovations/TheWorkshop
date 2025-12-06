import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCloudUploadAlt, FaMagic, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService';

const FlashcardCreate = () => {
    const navigate = useNavigate();
    const [fileUrl, setFileUrl] = useState('');
    const [fileName, setFileName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fileUrl || !fileName) {
            toast.error("Please provide a file URL and set name.");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/v1/flashcards/generate_from_file`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ file_url: fileUrl, file_name: fileName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate flashcards');
            }

            const data = await response.json();
            toast.success("Flashcards generated successfully!");
            navigate('/flashcards'); // Navigate to board to see all cards
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#121212] text-white">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
                <button
                    onClick={() => navigate('/flashcards')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <FaArrowLeft /> Back to Board
                </button>

                <div className="max-w-2xl mx-auto bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800 shadow-xl">
                    <div className="text-center mb-8">
                        <div className="bg-purple-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaMagic className="text-3xl text-purple-400" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Create New Flashcard Set</h1>
                        <p className="text-gray-400">Upload your notes and let AI generate study materials for you.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Set Name</label>
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="w-full bg-[#242424] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="e.g., Chemistry Notes"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">File URL (Publicly Accessible)</label>
                            <input
                                type="url"
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                className="w-full bg-[#242424] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="e.g., https://example.com/notes.pdf"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Note: The file must be accessible by Make.com (public URL).</p>
                        </div>

                        {/* File upload removed as per new requirement */}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            type="submit"
                            className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-2 ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                                }`}
                        >
                            {loading ? (
                                <><FaSpinner className="animate-spin" /> Generating Flashcards...</>
                            ) : (
                                <><FaMagic /> Generate Flashcards</>
                            )}
                        </motion.button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FlashcardCreate;
