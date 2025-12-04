import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaUndo, FaCheck } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../services/progressService';

const FlashcardStudy = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [set, setSet] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSet = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/flashcards/sets/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to load flashcards');
                const data = await response.json();
                setSet(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchSet();
    }, [id]);

    const handleNext = () => {
        if (currentIndex < (set?.flashcards?.length || 0) - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 200);
        }
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading...</div>;
    if (error) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-red-400">Error: {error}</div>;
    if (!set || !set.flashcards || set.flashcards.length === 0) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">No cards found in this set.</div>;

    const currentCard = set.flashcards[currentIndex];
    const progress = ((currentIndex + 1) / set.flashcards.length) * 100;

    return (
        <div className="min-h-screen flex flex-col bg-[#121212] text-white">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-16 flex flex-col items-center">

                {/* Header & Progress */}
                <div className="w-full max-w-3xl mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => navigate('/flashcards')} className="text-gray-400 hover:text-white flex items-center gap-2">
                            <FaArrowLeft /> Back
                        </button>
                        <h2 className="text-xl font-bold">{set.title}</h2>
                        <span className="text-gray-400">{currentIndex + 1} / {set.flashcards.length}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Flashcard Area */}
                <div className="perspective-1000 w-full max-w-2xl h-[400px] relative cursor-pointer group" onClick={handleFlip}>
                    <motion.div
                        className="w-full h-full relative preserve-3d transition-all duration-500"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-[#1A1A1A] border-2 border-gray-700 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-2xl group-hover:border-purple-500/50 transition-colors">
                            <span className="absolute top-6 left-6 text-xs font-bold text-purple-400 uppercase tracking-widest">Question</span>
                            <p className="text-2xl font-medium leading-relaxed">{currentCard.question}</p>
                            <p className="absolute bottom-6 text-sm text-gray-500">Click to flip</p>
                        </div>

                        {/* Back */}
                        <div
                            className="absolute inset-0 backface-hidden bg-[#242424] border-2 border-purple-600 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-2xl"
                            style={{ transform: 'rotateY(180deg)' }}
                        >
                            <span className="absolute top-6 left-6 text-xs font-bold text-green-400 uppercase tracking-widest">Answer</span>
                            <p className="text-2xl font-medium leading-relaxed">{currentCard.answer}</p>
                        </div>
                    </motion.div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-8 mt-12">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`p-4 rounded-full border-2 transition-all ${currentIndex === 0
                            ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                            : 'border-gray-600 text-white hover:border-purple-500 hover:bg-purple-500/10'
                            }`}
                    >
                        <FaArrowLeft className="text-xl" />
                    </button>

                    <button
                        onClick={handleFlip}
                        className="px-8 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                        {isFlipped ? <span className="flex items-center gap-2"><FaUndo /> Flip Back</span> : "Show Answer"}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentIndex === set.flashcards.length - 1}
                        className={`p-4 rounded-full border-2 transition-all ${currentIndex === set.flashcards.length - 1
                            ? 'border-gray-800 text-gray-600 cursor-not-allowed'
                            : 'border-gray-600 text-white hover:border-purple-500 hover:bg-purple-500/10'
                            }`}
                    >
                        <FaArrowRight className="text-xl" />
                    </button>
                </div>

            </main>
            <Footer />
        </div>
    );
};

export default FlashcardStudy;
