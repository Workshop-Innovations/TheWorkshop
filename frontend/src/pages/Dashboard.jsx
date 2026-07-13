import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Brain, UserCircle, Camera, X, Crown, BookOpen, Bot, Users, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { usePomodoro } from '../context/PomodoroContext';
import { REWARDS } from '../constants/rewardConstants';
import { API_BASE_URL } from '../services/progressService';
import ImageUploaderModal from '../components/ImageUploaderModal';

const Dashboard = () => {
    // Hooks and Context
    const { user, profilePic: contextProfilePic, updateProfilePic } = useAuth();
    const { userStats } = usePomodoro();
    const navigate = useNavigate();

    // State
    const [userEmail, setUserEmail] = useState(null);
    const [userName, setUserName] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Profile Customization States
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
            <div className="bg-white p-12 rounded-[24px] shadow-lg max-w-md w-full text-center">
                <div className="text-red-500 text-5xl mb-6 flex justify-center"><X /></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Connection Lost</h2>
                <p className="text-slate-500 mb-8">{error}</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold">
                    Retry Connection
                </button>
            </div>
        </div>
    );

    const currentUsername = userName || user?.username || userEmail || "User";
    const totalPomodoros = userStats?.totalCompletedPomodoros || 0;
    const totalTasks = totalUnlockedRewards;
    const totalFocusTime = totalPomodoros * 30 * 60;
    const focusHours = Math.floor(totalFocusTime / 3600);
    const focusMinutes = Math.floor((totalFocusTime % 3600) / 60);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
                
                {/* BENTO BOX GRID */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-7xl mx-auto">
                    
                    {/* HERO TILE (Spans 8 columns) */}
                    <div className="md:col-span-8 bg-white rounded-[32px] p-10 md:p-14 shadow-sm border border-slate-100/50 relative overflow-hidden flex flex-col justify-center card hover:shadow-md">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                        
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-10 relative z-10">
                            {/* Profile Picture */}
                            <div className="relative group cursor-pointer shrink-0" onClick={() => setIsSettingsOpen(true)}>
                                <div className="w-40 h-40 rounded-full relative">
                                    <div className="w-full h-full rounded-full overflow-hidden relative shadow-lg shadow-primary/10">
                                        {selectedProfilePic ? (
                                            <img src={selectedProfilePic} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                                <UserCircle className="w-20 h-20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-white text-slate-700 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform z-30">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    {currentFrame.framePath && (
                                        <img src={currentFrame.framePath} alt="Frame" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.3] z-20" />
                                    )}
                                </div>
                            </div>

                            {/* User Info */}
                            <div className="text-center sm:text-left flex flex-col justify-center h-full pt-2">
                                <div className="inline-flex items-center gap-2 mb-4">
                                    <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse"></span>
                                    <span className="text-xs font-bold text-slate-500 tracking-[0.15em] uppercase">Online & Ready</span>
                                </div>
                                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
                                    Hello, <span className="text-primary">{currentUsername}</span>
                                </h1>
                                <p className="text-slate-500 text-xl font-medium mb-8 max-w-md leading-relaxed">
                                    Welcome back to your workspace. You have earned the <span className="text-accent font-bold">{currentTitle.name}</span> title.
                                </p>
                                <div>
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOCUS TILE (Spans 4 columns) */}
                    <div className="md:col-span-4 bg-primary rounded-[32px] p-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden flex flex-col card hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30">
                        <div className="absolute -right-8 -top-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <div className="flex items-center gap-4 mb-10 opacity-80">
                            <Clock className="w-6 h-6" />
                            <span className="text-sm font-bold tracking-[0.15em] uppercase">Focus Time</span>
                        </div>
                        <div className="flex-grow flex flex-col justify-center mb-10">
                            <div className="text-7xl font-black tracking-tighter mb-2">{focusHours}<span className="text-3xl text-white/50 font-bold ml-1">h</span> {focusMinutes}<span className="text-3xl text-white/50 font-bold ml-1">m</span></div>
                            <p className="text-white/60 text-lg font-medium">Total deep work accumulated</p>
                        </div>
                        <Link to="/pomodoro" className="w-full py-5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center gap-3 font-bold transition-all group">
                            <Play className="w-5 h-5 fill-current" />
                            Start Session
                        </Link>
                    </div>

                    {/* STATS ROW (Spans 12 columns, split into 2 blocks) */}
                    <div className="md:col-span-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100/50 flex items-center gap-6 card hover:shadow-md">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Crown className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-800 mb-1">{totalTasks}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">Achievements</div>
                        </div>
                    </div>

                    <div className="md:col-span-6 bg-white p-8 rounded-[32px] shadow-sm border border-slate-100/50 flex items-center gap-6 card hover:shadow-md">
                        <div className="w-20 h-20 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                            <Brain className="w-10 h-10" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-slate-800 mb-1">{totalPomodoros}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">Study Sessions</div>
                        </div>
                    </div>

                    {/* QUICK ACCESS MODULES */}
                    <div className="md:col-span-12 mt-4">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-8 ml-2">Learning Arsenal</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <QuickLink to="/past-papers" icon={<BookOpen />} title="Past Papers" desc="Access exam papers & memos" />
                            <QuickLink to="/study-suite" icon={<Bot />} title="Study Suite" desc="All-in-one AI tutor" />
                            <QuickLink to="/community" icon={<Users />} title="Community" desc="Collaborate with peers" />
                            <QuickLink to="/pomodoro" icon={<Clock />} title="Focus Mode" desc="Distraction-free timer" />
                        </div>
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
                                className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                                    <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Profile Settings</h3>
                                    <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-3 rounded-full hover:bg-slate-100">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="p-10 overflow-y-auto custom-scrollbar bg-slate-50/50">
                                    {/* Profile Picture Section */}
                                    <section className="mb-12">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Avatar</h4>
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
                                            <div className="relative shrink-0">
                                                <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-4 border-white shadow-lg">
                                                    {selectedProfilePic ? (
                                                        <img src={selectedProfilePic} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : <UserCircle className="text-6xl text-slate-300" />}
                                                </div>
                                            </div>
                                            <div className="flex-grow space-y-4 text-center sm:text-left">
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => setIsUploaderOpen(true)}
                                                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm"
                                                    >
                                                        Upload Picture
                                                    </button>
                                                    <button
                                                        onClick={handleRemoveProfilePic}
                                                        disabled={!selectedProfilePic}
                                                        className={`px-6 py-3 rounded-xl font-bold transition-colors text-sm ${!selectedProfilePic ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <p className="text-xs font-medium text-slate-400">Square JPG/PNG recommended.</p>
                                            </div>
                                        </div>
                                    </section>
                                    
                                    <ImageUploaderModal
                                        isOpen={isUploaderOpen}
                                        onClose={() => setIsUploaderOpen(false)}
                                        onSave={handleProfilePicSave}
                                    />

                                    {/* Titles Section */}
                                    <section className="mb-12">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Honorary Title</h4>
                                            <span className="text-xs font-bold bg-accent/10 text-accent px-3 py-1.5 rounded-full">{totalPomodoros} Sessions</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {availableTitles.length > 0 ? availableTitles.map(title => (
                                                <button
                                                    key={title.id}
                                                    onClick={() => handleTitleChange(title)}
                                                    className={`p-6 rounded-[20px] text-left transition-all relative overflow-hidden card border-2 ${selectedTitle.id === title.id ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent bg-white shadow-sm hover:shadow-md hover:-translate-y-1'}`}
                                                >
                                                    <div className="font-extrabold text-slate-800 tracking-tight text-lg mb-1">{title.name}</div>
                                                    <div className="text-xs font-medium text-slate-500">Requires {title.requirement} sessions</div>
                                                    {selectedTitle.id === title.id && <div className="absolute top-4 right-4 text-primary"><CheckCircle2 className="w-5 h-5" /></div>}
                                                </button>
                                            )) : <p className="col-span-2 text-slate-400 text-center italic">Complete more sessions to unlock titles!</p>}
                                        </div>
                                    </section>

                                    {/* Frames Section */}
                                    <section>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Profile Frame</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                                            {availableFrames.length > 0 ? availableFrames.map(frame => (
                                                <button
                                                    key={frame.id}
                                                    onClick={() => handleFrameChange(frame)}
                                                    className={`p-6 rounded-[24px] flex flex-col items-center justify-center transition-all card border-2 ${selectedFrame.id === frame.id ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent bg-white shadow-sm hover:shadow-md hover:-translate-y-1'}`}
                                                >
                                                    <div className="relative w-20 h-20 mb-4">
                                                        <div className="absolute inset-3 bg-slate-100 rounded-full" />
                                                        <img src={frame.framePath} alt={frame.name} className="absolute inset-0 w-full h-full object-contain" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-800 tracking-tight mb-1">{frame.name}</span>
                                                    <span className="text-xs font-medium text-slate-400">{frame.requirement} Poms</span>
                                                </button>
                                            )) : <p className="col-span-3 text-slate-400 text-center italic">Complete more sessions to unlock frames!</p>}
                                        </div>
                                    </section>
                                </div>

                                <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        className="px-10 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
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

const QuickLink = ({ to, icon, title, desc }) => (
    <Link to={to} className="group block">
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100/50 card hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 h-full flex flex-col">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed flex-grow">{desc}</p>
            <div className="mt-6 flex items-center text-xs font-bold text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                Launch <ArrowRight className="w-4 h-4 ml-1" />
            </div>
        </div>
    </Link>
);

export default Dashboard;