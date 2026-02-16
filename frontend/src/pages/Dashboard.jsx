import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaClock, FaBrain, FaUserCircle, FaCamera, FaTimes, FaCrown, FaBookOpen, FaRobot, FaUsers } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getProgressData } from '../services/progressService';
import { useAuth } from '../context/AuthContext';
import { usePomodoro } from '../context/PomodoroContext';
import { REWARDS } from '../constants/rewardConstants';
import { API_BASE_URL } from '../services/progressService';
import ImageUploaderModal from '../components/ImageUploaderModal';

const StatCard = ({ icon: Icon, title, value, colorClass, iconClass }) => (
    <motion.div
        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
    >
        <div className="flex items-center gap-5">
            <div className={`p-4 rounded-xl ${colorClass} flex items-center justify-center`}>
                <Icon className={`${iconClass} text-2xl`} />
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide">{title}</h3>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    </motion.div>
);

const FeatureCard = ({ to, icon, title, description, delay }) => (
    <Link to={to} className="block h-full">
        <motion.div
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-800 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </motion.div>
    </Link>
);

// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
    // Hooks and Context
    const { user, profilePic: contextProfilePic, updateProfilePic } = useAuth(); // renamed to avoid clash if needed, or just usage
    const { userStats } = usePomodoro();
    const navigate = useNavigate();

    // State
    const [userEmail, setUserEmail] = useState(null);
    const [userName, setUserName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Profile Customization States
    // Use contextProfilePic directly instead of local state for consistency
    const selectedProfilePic = contextProfilePic;

    const [selectedTitle, setSelectedTitle] = useState(() => {
        const savedTitle = JSON.parse(localStorage.getItem('userTitle'));
        return savedTitle || (REWARDS?.PASSIVE_TITLES.find(r => r.id === 'title-novice'));
    });
    const [selectedFrame, setSelectedFrame] = useState(() => {
        const savedFrame = JSON.parse(localStorage.getItem('userFrame'));
        return savedFrame || (REWARDS?.PASSIVE_FRAMES.find(r => r.id === 'frame-basic'));
    });

    // --- REWARD LOGIC ---
    const isEarned = (reward) => {
        const { requirement } = reward;
        return userStats?.totalCompletedPomodoros >= requirement;
    };

    const availableTitles = REWARDS?.PASSIVE_TITLES?.filter(isEarned) || [];
    const availableFrames = REWARDS?.PASSIVE_FRAMES?.filter(isEarned) || [];
    const allRewards = [...(REWARDS?.PASSIVE_TITLES || []), ...(REWARDS?.PASSIVE_FRAMES || [])];
    const totalUnlockedRewards = allRewards.filter(isEarned).length;

    const currentTitle = selectedTitle || { name: 'Loading...', className: 'text-slate-500' };
    const currentFrame = selectedFrame || { framePath: '', name: 'Basic' };

    // --- IMAGE HANDLERS ---
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);

    const handleProfilePicSave = (compressedImage) => {
        updateProfilePic(compressedImage);
        // selectedProfilePic is now derived from context in the render, or we can sync it here if needed, 
        // but cleaner to use context directly. See render changes.
    };

    const handleRemoveProfilePic = () => {
        updateProfilePic(null);
    };

    const handleTitleChange = (title) => {
        setSelectedTitle(title);
        localStorage.setItem('userTitle', JSON.stringify(title));
    };

    const handleFrameChange = (frame) => {
        setSelectedFrame(frame);
        localStorage.setItem('userFrame', JSON.stringify(frame));
    };

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchUserData = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    signal: signal
                });
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        localStorage.removeItem('accessToken');
                        navigate('/login');
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setUserEmail(data.email);
                setUserName(data.username);
            } catch (err) {
                if (err.name === 'AbortError') return;
                setError(err.message || "Failed to load user data.");
                localStorage.removeItem('accessToken');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
        return () => controller.abort();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-md w-full text-center">
                <div className="text-red-500 text-5xl mb-4 ml-auto mr-auto w-fit"><FaTimes /></div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors">
                    Retry
                </button>
            </div>
        </div>
    );

    const currentUsername = userName || user?.username || userEmail || "User";
    const totalPomodoros = userStats?.totalCompletedPomodoros || 0;
    const totalTasks = totalUnlockedRewards;
    const totalFocusTime = totalPomodoros * 30 * 60;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-28">

                {/* Header Section */}
                <header className="mb-12">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-light/20 to-secondary-light/20 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            {/* Profile Picture */}
                            <div className="relative group cursor-pointer" onClick={() => setIsSettingsOpen(true)}>
                                <div className="w-32 h-32 rounded-full relative mt-2">
                                    <div className="w-full h-full rounded-full overflow-hidden relative">
                                        {selectedProfilePic ? (
                                            <img src={selectedProfilePic} alt="Profile" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-5xl">
                                                <FaUserCircle />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-white text-slate-700 p-2 rounded-full shadow-md border border-slate-100 group-hover:scale-110 transition-transform z-30">
                                        <FaCamera className="text-sm" />
                                    </div>
                                    {/* Frame Overlay - positioned last to be on top and outline the entire picture */}
                                    {currentFrame.framePath && (
                                        <img src={currentFrame.framePath} alt="Frame" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.20] z-20" />
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="text-center md:text-left flex-grow">
                                <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-100">
                                    {currentTitle.name}
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">
                                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{currentUsername}!</span>
                                </h1>
                                <p className="text-slate-500 text-lg">Your educational journey continues here.</p>
                            </div>

                            {/* Action Button */}
                            <div>
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                >
                                    Customize Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard
                        icon={FaCrown}
                        title="Achievements"
                        value={totalTasks}
                        colorClass="bg-amber-50"
                        iconClass="text-amber-500"
                    />
                    <StatCard
                        icon={FaBrain}
                        title="Study Sessions"
                        value={totalPomodoros}
                        colorClass="bg-teal-50"
                        iconClass="text-primary"
                    />
                    <StatCard
                        icon={FaClock}
                        title="Focus Time"
                        value={`${Math.floor(totalFocusTime / 3600)}h ${Math.floor((totalFocusTime % 3600) / 60)}m`}
                        colorClass="bg-sky-50"
                        iconClass="text-secondary"
                    />
                </div>

                {/* Quick Access Grid (Refactored for Education) */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                        <span className="w-1 h-8 bg-primary rounded-full"></span>
                        Learning Tools
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard to="/past-papers" icon={<FaBookOpen />} title="Past Papers" description="Access exam papers & memos." delay={0.1} />
                        <FeatureCard to="/study-suite" icon={<FaRobot />} title="Study Suite" description="All-in-one AI tutor." delay={0.2} />
                        <FeatureCard to="/community" icon={<FaUsers />} title="Community" description="Study with peers." delay={0.3} />
                        <FeatureCard to="/pomodoro" icon={<FaClock />} title="Focus Mode" description="Distraction-free timer." delay={0.4} />
                    </div>
                </div>



                {/* Profile Customization Modal */}
                <AnimatePresence>
                    {isSettingsOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSettingsOpen(false)}
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-2xl font-bold text-slate-800">Customize Profile</h3>
                                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm hover:shadow">
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="p-8 overflow-y-auto custom-scrollbar">
                                    {/* Profile Picture Section */}
                                    <section className="mb-10">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Profile Picture</h4>
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-4 border-white shadow-md">
                                                    {selectedProfilePic ? (
                                                        <img src={selectedProfilePic} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : <FaUserCircle className="text-4xl text-slate-300" />}
                                                </div>
                                            </div>
                                            <div className="flex-grow space-y-3">
                                                <button
                                                    onClick={() => setIsUploaderOpen(true)}
                                                    className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/30"
                                                >
                                                    Upload New Picture
                                                </button>
                                                <button
                                                    onClick={handleRemoveProfilePic}
                                                    disabled={!selectedProfilePic}
                                                    className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold transition-colors ml-0 sm:ml-3 ${!selectedProfilePic ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                                >
                                                    Remove
                                                </button>
                                                {/* Image Uploader Modal */}
                                                <ImageUploaderModal
                                                    isOpen={isUploaderOpen}
                                                    onClose={() => setIsUploaderOpen(false)}
                                                    onSave={handleProfilePicSave}
                                                />
                                                <p className="text-xs text-slate-400">Recommended: Square JPG/PNG. Images will be auto-optimized.</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Titles Section */}
                                    <section className="mb-10">
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex justify-between items-center">
                                            <span>Title</span>
                                            <span className="text-xs normal-case bg-green-50 text-green-700 px-2 py-1 rounded-full">{totalPomodoros} Pomodoros Earned</span>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {availableTitles.length > 0 ? availableTitles.map(title => (
                                                <button
                                                    key={title.id}
                                                    onClick={() => handleTitleChange(title)}
                                                    className={`p-4 rounded-xl text-left transition-all border-2 relative overflow-hidden ${selectedTitle.id === title.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/50 hover:bg-slate-50'}`}
                                                >
                                                    <div className="font-bold text-slate-800 uppercase tracking-wide">{title.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1">Requires {title.requirement} Pomodoros</div>
                                                    {selectedTitle.id === title.id && <div className="absolute top-2 right-2 text-primary"><FaCheckCircle /></div>}
                                                </button>
                                            )) : <p className="col-span-2 text-slate-400 text-center italic">Complete more sessions to unlock titles!</p>}
                                        </div>
                                    </section>

                                    {/* Frames Section */}
                                    <section>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Avatar Frames</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {availableFrames.length > 0 ? availableFrames.map(frame => (
                                                <button
                                                    key={frame.id}
                                                    onClick={() => handleFrameChange(frame)}
                                                    className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all border-2 ${selectedFrame.id === frame.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-primary/50 hover:bg-slate-50'}`}
                                                >
                                                    <div className="relative w-16 h-16 mb-3">
                                                        <div className="absolute inset-2 bg-slate-200 rounded-full" />
                                                        <img src={frame.framePath} alt={frame.name} className="absolute inset-0 w-full h-full object-contain" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-700">{frame.name}</span>
                                                    <span className="text-xs text-slate-400">{frame.requirement} Poms</span>
                                                </button>
                                            )) : <p className="col-span-3 text-slate-400 text-center italic">Complete more sessions to unlock frames!</p>}
                                        </div>
                                    </section>
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                                    >
                                        Save & Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
            <Footer />
        </div>
    );
};

// Helper for check circle icon
const FaCheckCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export default Dashboard;