import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlus, FaLayerGroup, FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService'; // Assuming this is where API_BASE_URL is

const FlashcardBoard = () => {
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSets = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/flashcards/sets`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch flashcard sets');
                }

                const data = await response.json();
                setSets(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSets();
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-[#121212] text-white">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Flashcards</h1>
                        <p className="text-gray-400">Master your subjects with AI-generated flashcards.</p>
                    </div>
                    <Link to="/flashcards/create">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors"
                        >
                            <FaPlus /> Create New Set
                        </motion.button>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Loading your flashcards...</div>
                ) : error ? (
                    <div className="text-center py-20 text-red-400">Error: {error}</div>
                ) : sets.length === 0 ? (
                    <div className="text-center py-20 bg-[#1A1A1A] rounded-xl border border-gray-800">
                        <FaLayerGroup className="text-6xl text-gray-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">No Flashcard Sets Yet</h3>
                        <p className="text-gray-400 mb-6">Create your first set to start studying!</p>
                        <Link to="/flashcards/create" className="text-purple-400 hover:text-purple-300 font-semibold">
                            Get Started &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sets.map((set) => (
                            <motion.div
                                key={set.id}
                                whileHover={{ y: -5 }}
                                className="bg-[#1A1A1A] p-6 rounded-xl border border-gray-800 hover:border-purple-500/50 transition-colors group cursor-pointer"
                                onClick={() => navigate(`/flashcards/${set.id}`)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                                        {set.category}
                                    </div>
                                    <FaLayerGroup className="text-gray-600 group-hover:text-purple-500 transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{set.title}</h3>
                                <div className="flex items-center text-gray-500 text-sm gap-4 mt-4">
                                    <span className="flex items-center gap-1">
                                        <FaCalendarAlt /> {new Date(set.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
                                    <span className="text-sm font-semibold text-gray-400 group-hover:text-white flex items-center gap-2 transition-colors">
                                        Study Now <FaArrowRight />
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default FlashcardBoard;
