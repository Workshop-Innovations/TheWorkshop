import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaClock, FaListAlt, FaChartBar, FaStore, FaCoins, FaTasks, FaBrain, FaUserCircle} from 'react-icons/fa';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getProgressData } from '../services/progressService';
import { useAuth } from '../context/AuthContext';
import { usePomodoro } from '../context/PomodoroContext';
import { REWARDS } from '../constants/rewardConstants'; 
import { API_BASE_URL } from '../services/progressService';

const StatCard = ({ icon, title, value }) => (
    <motion.div className="bg-[#1A1A1A] p-6 rounded-lg" whileHover={{ scale: 1.01, backgroundColor: '#242424' }} transition={{ duration: 0.2 }}>
        <div className="flex items-center gap-4">
            <div className="text-3xl text-white/50">{icon}</div>
            <div>
                <h3 className="text-gray-400 mb-1">{title}</h3>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </div>
    </motion.div>
);

const FeatureCard = ({ to, icon, title, description }) => (
    <Link to={to} className="block">
        <motion.div className="bg-[#1A1A1A] p-6 rounded-lg hover:bg-[#242424] transition-colors" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <div className="text-3xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </motion.div>
    </Link>
);
// --- MAIN DASHBOARD COMPONENT ---
const Dashboard = () => {
    // Hooks and Context (Must be imported/available globally)
    const { username } = useAuth();
    const { userStats } = usePomodoro();
    const navigate = useNavigate();

    // State
    const [userEmail, setUserEmail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [imageUploadError, setImageUploadError] = useState(null);

    // Profile Customization States
    const [selectedProfilePic, setSelectedProfilePic] = useState(() => {
        const savedPic = localStorage.getItem('userProfilePic');
        return savedPic || null;
    });

    const [selectedTitle, setSelectedTitle] = useState(() => {
        const savedTitle = JSON.parse(localStorage.getItem('userTitle'));
        return savedTitle || (REWARDS?.PASSIVE_TITLES.find(r => r.id === 'title-novice'));
    });
    const [selectedFrame, setSelectedFrame] = useState(() => {
        const savedFrame = JSON.parse(localStorage.getItem('userFrame'));
        // NOTE: The fallback frame now must contain the framePath property
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

    // Fallback constants (The frame no longer needs a className fallback)
    const currentTitle = selectedTitle || { name: 'Loading...', className: 'text-gray-500' };
    const currentFrame = selectedFrame || { framePath: '', name: 'Basic' }; // Added name for safety

    // --- IMAGE HANDLERS ---
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        setImageUploadError(null);

        if (!file) return;

        const MAX_SIZE = 500000;
        if (file.size > MAX_SIZE) {
            setImageUploadError("Image size must be less than 500KB.");
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            setSelectedProfilePic(base64String);
            localStorage.setItem('userProfilePic', base64String);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveProfilePic = () => {
        setSelectedProfilePic(null);
        localStorage.removeItem('userProfilePic');
        setImageUploadError(null);
    };
    // --- END IMAGE HANDLERS ---

    // Handlers for title/frame selection
    const handleTitleChange = (title) => {
        setSelectedTitle(title);
        localStorage.setItem('userTitle', JSON.stringify(title));
    };

    const handleFrameChange = (frame) => {
        setSelectedFrame(frame);
        localStorage.setItem('userFrame', JSON.stringify(frame));
    };

    // FIXED useEffect: (No change in logic, only included for completeness)
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
                    signal: signal // Use the AbortController signal
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
            } catch (err) {
                // Ignore AbortError which happens on cleanup
                if (err.name === 'AbortError') {
                    return;
                }
                setError(err.message || "Failed to load user data.");
                localStorage.removeItem('accessToken');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();

        // Cleanup function
        return () => {
            controller.abort();
        };
    }, [navigate]);

    if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Loading dashboard...</div>;
    if (error) return <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">Error: {error}</div>;

    const currentUsername = username || userEmail || "User";
    const totalPomodoros = userStats?.totalCompletedPomodoros || 0;
    const totalTasks = totalUnlockedRewards; // Renamed for clarity in the stat card
    // Assuming 30 minutes per pomodoro, convert to seconds
    const totalFocusTime = totalPomodoros * 30 * 60; 


    return (
        <div className="min-h-screen flex flex-col bg-[#121212] text-white">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 pt-24 pb-16">
                {/* Redesigned Header: Profile Picture and Title */}
                <header className="mb-12 flex flex-wrap justify-between items-start gap-6">
                    <div className="flex items-center gap-6 p-4 bg-[#1A1A1A] rounded-xl shadow-lg border border-gray-700/50">
                        {/* 🚨 UPDATED Profile Picture Display with Image Frame */}
                        <div className={`relative w-33 h-33 flex items-center justify-center`}>
                            {/* Frame Image Layer (Behind the profile picture, using currentFrame.framePath) */}
                            {currentFrame.framePath && (
                                <img
                                    src={currentFrame.framePath}
                                    alt={`${currentFrame.name} Frame`}
                                    // Use absolute positioning to sit over the profile container
                                    className="absolute inset-0 w-full h-full object-contain rounded-full z-20" 
                                />
                            )}
                            
                            {/* Inner Profile Picture Container Layer (z-20 to ensure it sits over the frame image) */}
                            <div className="w-20 h-20 bg-[#242424] rounded-full flex items-center justify-center overflow-hidden z-10">
                                {selectedProfilePic ? (
                                    <img
                                        src={selectedProfilePic}
                                        alt="User Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl text-purple-400">
                                        <FaUserCircle />
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Title and Welcome Message - Uses selectedTitle */}
                        <div>
                            <p className={`text-sm font-semibold uppercase ${currentTitle.className} tracking-wider mb-1`}>
                                {currentTitle.name}
                            </p>
                            <h1 className="text-4xl font-extrabold">
                                Welcome back, <span className="text-purple-400">{currentUsername}!</span>
                            </h1>
                            <p className="text-gray-400 mt-1">Here's a quick look at your workspace.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Profile Customization Button */}
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center justify-center px-4 py-2 bg-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition-colors h-fit"
                        >
                            Customize Profile
                        </button>
                    </div>
                </header>

                {/* Stat Cards - Tasks Completed now counts unlocked rewards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <StatCard icon={<FaTasks />} title="Rewards Unlocked" value={totalTasks} />
                    <StatCard icon={<FaBrain />} title="Pomodoros" value={totalPomodoros} />
                    <StatCard icon={<FaClock />} title="Focus Time" value={`${Math.floor(totalFocusTime / 3600)}h ${Math.floor((totalFocusTime % 3600) / 60)}m`} />
                </div>

                <h2 className="text-2xl font-bold mb-6">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-10">
                    <FeatureCard to="/pomodoro" icon={<FaClock />} title="Pomodoro" description="Focus timer and work sessions" />
                    <FeatureCard to="/tasks" icon={<FaListAlt />} title="To-Do" description="Manage your tasks and projects" />
                    <FeatureCard to="/progress" icon={<FaChartBar />} title="Progress" description="View your productivity stats" />
                    <FeatureCard to="/rewards" icon={<FaTasks />} title="Rewards" description="View your unlocked frames and titles" />
                </div>

                <motion.div className="mt-8 bg-gradient-to-r from-purple-500 to-indigo-500 p-6 rounded-lg" whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold mb-2">Exciting Features Coming Soon!</h3>
                            <p className="text-white/80">Check out what's in development</p>
                        </div>
                        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                            <Link to="/coming-soon" className="px-6 py-3 bg-white text-black border border-transparent rounded-md font-bold hover:bg-gray-200 transition-colors">Learn More</Link>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Profile Customization Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#121212] p-8 rounded-xl w-full max-w-2xl border border-purple-500/50 shadow-2xl"
                        >
                            <h3 className="text-3xl font-bold mb-6 text-purple-400">Profile Customization</h3>

                            {/* Profile Picture Uploader (No change needed) */}
                            <div className="mb-8 border-b border-gray-700 pb-6">
                                <h4 className="text-xl font-semibold mb-3 text-gray-300">Custom Profile Picture</h4>
                                <input
                                    type="file"
                                    id="profilePicUpload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <div className="flex gap-4 mb-2">
                                    <button
                                        onClick={() => document.getElementById('profilePicUpload').click()}
                                        className="flex-1 px-4 py-2 bg-purple-600 rounded-lg text-white font-semibold hover:bg-purple-700 transition-colors"
                                    >
                                        Upload New Image (Max 500KB)
                                    </button>
                                    <button
                                        onClick={handleRemoveProfilePic}
                                        disabled={!selectedProfilePic}
                                        className={`flex-1 px-4 py-2 rounded-lg text-white font-semibold transition-colors ${!selectedProfilePic ? 'bg-gray-700 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        Remove Custom Image
                                    </button>
                                </div>
                                {imageUploadError && (
                                    <p className="text-red-400 text-sm mt-2">{imageUploadError}</p>
                                )}
                            </div>

                            {/* Title Selector (No change needed) */}
                            <div className="mb-8 border-b border-gray-700 pb-6">
                                <h4 className="text-xl font-semibold mb-3 text-gray-300">Select Title (Earned: {totalPomodoros} Pomodoros)</h4>
                                <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-2">
                                    {availableTitles.length > 0 ? (
                                        availableTitles.map(title => (
                                            <button
                                                key={title.id}
                                                onClick={() => handleTitleChange(title)}
                                                className={`p-3 rounded-lg text-left transition-all border-2 ${selectedTitle.id === title.id ? 'border-purple-500 bg-[#242424]' : 'border-gray-700 hover:border-purple-600'}`}
                                            >
                                                <p className={`text-lg font-bold uppercase ${title.className}`}>{title.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Requires: {title.requirement} Pomodoros
                                                </p>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 col-span-2">No titles unlocked yet. Complete Pomodoros!</p>
                                    )}
                                </div>
                            </div>

                            {/* 🚨 UPDATED Frame Selector */}
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-3 text-gray-300">Select Frame (Earned: {totalPomodoros} Pomodoros)</h4>
                                <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto pr-2">
                                    {availableFrames.length > 0 ? (
                                        availableFrames.map(frame => (
                                            <button
                                                key={frame.id}
                                                onClick={() => handleFrameChange(frame)}
                                                className={`p-3 rounded-lg text-left transition-all border-2 ${selectedFrame.id === frame.id ? 'border-purple-500 bg-[#242424]' : 'border-gray-700 hover:border-purple-600'}`}
                                            >
                                                {/* FIXED: Replaced the old div with an <img> for the frame preview */}
                                                <div className="w-10 h-10 inline-block mr-2 align-middle relative">
                                                    {/* Inner circle for profile picture preview (simulated) */}
                                                    <div className="absolute inset-0 m-1 bg-[#242424] rounded-full z-10 border border-gray-500"></div>

                                                    {/* Frame image preview - uses framePath */}
                                                    <img
                                                        src={frame.framePath}
                                                        alt={`${frame.name} Preview`}
                                                        className="absolute inset-0 w-full h-full object-contain rounded-full z-20"
                                                    />
                                                </div>

                                                <span className="font-medium">{frame.name}</span>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Requires: {frame.requirement} Pomodoros
                                                </p>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 col-span-2">No frames unlocked yet. Complete Pomodoros!</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="w-full mt-4 px-6 py-3 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 transition-colors"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Dashboard;