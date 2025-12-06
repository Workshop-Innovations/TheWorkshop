import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaRedo, FaCheck, FaTimes, FaLightbulb } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { API_BASE_URL } from '../services/progressService';

const FlashcardCollectionStudy = () => {
    const { collectionId } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState(null);
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [finished, setFinished] = useState(false);
    const [score, setScore] = useState({ correct: 0, incorrect: 0 });

    useEffect(() => {
        const fetchCollection = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/flashcards/collections/${collectionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch collection');
                }

                const data = await response.json();
                setCollection(data);
                setCards(data.cards || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [collectionId, navigate]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleNext = (known) => {
        setScore(prev => ({
            ...prev,
            [known ? 'correct' : 'incorrect']: prev[known ? 'correct' : 'incorrect'] + 1
        }));

        setIsFlipped(false);
        if (currentIndex < cards.length - 1) {
            setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
        } else {
            setFinished(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setFinished(false);
        setScore({ correct: 0, incorrect: 0 });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
            <div className="text-xl text-gray-400">Loading collection...</div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
            <div className="text-xl text-red-400">Error: {error}</div>
        </div>
    );

    if (!collection || cards.length === 0) return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
            <div className="text-xl text-gray-400">No cards found in this collection.</div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-[#121212] text-white">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-16 flex flex-col items-center">
                <div className="w-full max-w-4xl mb-8 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/flashcards')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaArrowLeft /> Back to Board
                    </button>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">{collection.name}</h2>
                        <p className="text-sm text-gray-500">
                            Card {currentIndex + 1} of {cards.length}
                        </p>
                    </div>
                    <div className="w-24"></div> {/* Spacer for centering */}
                </div>

                {finished ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#1A1A1A] p-8 rounded-2xl border border-gray-800 text-center max-w-md w-full"
                    >
                        <h3 className="text-3xl font-bold mb-6 text-purple-400">Session Complete!</h3>
                        <div className="flex justify-center gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-green-400 mb-2">{score.correct}</div>
                                <div className="text-sm text-gray-400">Known</div>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold text-red-400 mb-2">{score.incorrect}</div>
                                <div className="text-sm text-gray-400">Learning</div>
                            </div>
                        </div>
                        <button
                            onClick={handleRestart}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto transition-colors"
                        >
                            <FaRedo /> Study Again
                        </button>
                    </motion.div>
                ) : (
                    <div className="w-full max-w-2xl perspective-1000">
                        <div className="relative h-[400px] w-full cursor-pointer group" onClick={handleFlip}>
                            <motion.div
                                className="w-full h-full absolute preserve-3d transition-all duration-500"
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                            >
                                {/* Front */}
                                <div className="absolute w-full h-full backface-hidden bg-[#1A1A1A] border-2 border-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl group-hover:border-purple-500/30 transition-colors">
                                    <div className="absolute top-6 left-6 text-purple-500/50 text-sm font-bold tracking-wider uppercase">
                                        Term
                                    </div>
                                    <h3 className="text-3xl font-bold leading-relaxed">
                                        {cards[currentIndex].term}
                                    </h3>
                                    <div className="absolute bottom-6 text-gray-500 text-sm flex items-center gap-2">
                                        <FaLightbulb /> Click to flip
                                    </div>
                                </div>

                                {/* Back */}
                                <div
                                    className="absolute w-full h-full backface-hidden bg-[#1A1A1A] border-2 border-purple-900/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
                                    style={{ transform: "rotateY(180deg)" }}
                                >
                                    <div className="absolute top-6 left-6 text-purple-400/50 text-sm font-bold tracking-wider uppercase">
                                        Definition
                                    </div>
                                    <p className="text-xl text-gray-300 leading-relaxed">
                                        {cards[currentIndex].definition}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex justify-center gap-4 mt-8">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(false); }}
                                className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all w-40 justify-center"
                            >
                                <FaTimes /> Hard
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(true); }}
                                className="bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-900/50 px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all w-40 justify-center"
                            >
                                <FaCheck /> Easy
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FlashcardCollectionStudy;
