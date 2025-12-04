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
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const categories = ['General', 'Science', 'History', 'Math', 'Literature', 'Programming', 'Languages'];

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !title) {
            toast.error("Please provide a title and upload a document.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('file', file);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE_URL}/api/v1/flashcards/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate flashcards');
            }

            const data = await response.json();
            toast.success("Flashcards generated successfully!");
            navigate(`/flashcards/${data.id}`);
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">Set Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-[#242424] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="e.g., Biology Chapter 1"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-[#242424] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Upload Document (Text/PDF)</label>
                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-purple-500 transition-colors bg-[#242424]/50">
                                <input
                                    type="file"
                                    id="file-upload"
                                    accept=".txt,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                    <FaCloudUploadAlt className="text-4xl text-gray-500 mb-2" />
                                    <span className="text-purple-400 font-semibold text-lg">Click to upload</span>
                                    <span className="text-gray-500 text-sm mt-1">
                                        {file ? file.name : "Supported formats: .txt, .pdf"}
                                    </span>
                                </label>
                            </div>
                        </div>

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
