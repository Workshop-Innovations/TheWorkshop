import Progress from './Progress'; // Assuming Progress.jsx is in the same directory
import { useState, useEffect } from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { FaPlay, FaPause, FaForward, FaRedo, FaCog, FaCoins } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ALL_PASSIVE_REWARDS } from '../constants/rewardConstants'; 
import { Link, useNavigate } from 'react-router-dom';

// --- ProgressView Component Definition (Updated) ---
const ProgressView = ({ totalCompletedPomodoros }) => {
  // Utility function to determine progress label
  const formatRequirementRemaining = (remaining) => {
    if (remaining === 1) return '1 session to go';
    return `${remaining} sessions to go`;
  };

  // 1. Calculate progress and remaining sessions
  const nextRewards = ALL_PASSIVE_REWARDS
    .map(reward => ({
      ...reward,
      sessionsRemaining: reward.requirement - totalCompletedPomodoros,
      progressPercent: Math.min(100, (totalCompletedPomodoros / reward.requirement) * 100)
    }))
    .filter(reward => reward.sessionsRemaining > 0) // Keep only unachieved rewards
    .sort((a, b) => a.sessionsRemaining - b.sessionsRemaining) // Sort by sessions remaining (closest first)
    .slice(0, 5); // Take the closest 5 rewards


  return (
    <motion.div
      key="progress-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto p-8 rounded-xl bg-[#1A1A1A] border border-white/10 shadow-2xl mt-4 sm:mt-8"
    >
      <div className="text-center mb-6 border-b border-white/10 pb-4">
        <h2 className="text-3xl font-extrabold text-white">Focus Challenges</h2>
        <p className="text-sm text-gray-400 mt-1">Total Completed Pomodoro Sessions</p>
        <div className="flex items-center justify-center gap-2 mt-2">
            <FaRedo className="text-blue-400 text-3xl" />
            <span className="text-4xl font-mono font-bold text-green-400">{totalCompletedPomodoros}</span>
            <span className="text-2xl text-gray-300">sessions</span>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-200">Closest Passive Rewards to Unlock</h3>

      {nextRewards.length === 0 ? (
        <p className="text-center text-gray-400 p-8 bg-[#242424] rounded-lg">
          You have achieved all tracked passive challenges!
        </p>
      ) : (
        <div className="space-y-4">
          {nextRewards.map((reward) => (
            <div key={reward.id} className="bg-[#242424] p-4 rounded-lg shadow-md border border-green-400/20">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-green-400">{reward.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">
                    {reward.type} Reward | Target: {reward.requirement} sessions
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-white font-semibold flex items-center gap-1 ${reward.type === 'title' ? 'text-purple-300' : 'text-blue-300'}`}>
                    Unlock: {reward.type}
                  </p>
                  <p className="text-sm text-red-300 mt-1 font-bold">
                    {formatRequirementRemaining(reward.sessionsRemaining)}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-600 rounded-full h-2.5">
                  <motion.div
                    className="bg-green-500 h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${reward.progressPercent}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ width: `${reward.progressPercent}%` }}
                  ></motion.div>
                </div>
                <p className="text-right text-xs text-gray-400 mt-1">{reward.progressPercent.toFixed(1)}% complete</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Define the Pomodoro Component:
const Pomodoro = () => {
  // Destructure all necessary values from the Pomodoro context
  const {
    time,
    mode,
    isRunning,
    settings,
    setSettings,
    handleStart,
    handlePause,
    handleReset,
    handleSkip,
    handleModeChange,
    pomodoroCount,
    userStats, // <-- Retrieve the userStats object from the context
  } = usePomodoro();


  // **FIXED: Now safely retrieving totalCompletedPomodoros from userStats**
  const totalCompletedPomodoros = userStats?.totalCompletedPomodoros || 0;


  const [currentView, setCurrentView] = useState('timer'); // 'timer' or 'progress'
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const handleSettingsSave = () => {
    setSettings(tempSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(tempSettings));
    setShowSettings(false);
    setTempSettings(null);
    toast.success('Settings saved!');
  };

  const modeColor = {
    pomodoro: 'bg-red-500',
    shortBreak: 'bg-blue-500',
    longBreak: 'bg-green-500',
  };


const SettingInput = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full p-2 bg-[#242424] rounded-md focus:outline-none focus:ring-2 focus:ring-white/20"
      min="1"
    />
  </div>
);

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-white/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
  </label>
);


  return (
    <div className={`min-h-screen bg-[#121212]`}>
      <Navbar />
      <ToastContainer theme="dark" position="bottom-right" />

      <div className="container mx-auto px-4 py-32 pt-24">
        
        {/* NEW: Timer/Progress Toggle Buttons added here */}
        <div className="flex justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('timer')}
              className={`py-2 px-6 rounded-l-full font-semibold transition-colors duration-200 text-sm md:text-base ${
                currentView === 'timer' ? 'bg-white text-black' : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#242424]'
              }`}
            >
              Timer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('progress')}
              className={`py-2 px-6 rounded-r-full font-semibold transition-colors duration-200 text-sm md:text-base ${
                currentView === 'progress' ? 'bg-white text-black' : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#242424]'
              }`}
            >
              Progress (Challenges)
            </motion.button>
        </div>


        {/* Conditional Rendering Logic */}
        <AnimatePresence mode="wait">
          {currentView === 'timer' && (
            <motion.div
              key="timer-view" // Key is essential for AnimatePresence
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className={`relative max-w-2xl mx-auto p-12 rounded-lg bg-[#1A1A1A] border border-white/10`}
            >
              
              {/* Existing Timer UI Content Starts Here */}
              <div className={`absolute top-4 right-4 h-3 w-3 rounded-full ${isRunning ? modeColor[mode] : 'bg-gray-500'}`} />

              <div className="flex justify-between items-center mb-12">
                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: mode === 'pomodoro' ? '' : '#242424'}}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-md font-semibold transition-all duration-300 ${
                      mode === 'pomodoro' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => handleModeChange('pomodoro')}
                  >
                    Pomodoro
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: mode === 'shortBreak' ? '' : '#242424'}}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-md font-semibold transition-all duration-300 ${
                      mode === 'shortBreak' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => handleModeChange('shortBreak')}
                  >
                    Short Break
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, backgroundColor: mode === 'longBreak' ? '' : '#242424'}}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-md font-semibold transition-all duration-300 ${
                      mode === 'longBreak' ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => handleModeChange('longBreak')}
                  >
                    Long Break
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white text-xl p-2 rounded-full hover:bg-white/10 transition-all duration-300"
                  onClick={() => {
                    setTempSettings(settings);
                    setShowSettings(true);
                  }}
                >
                  <FaCog />
                </motion.button>
              </div>

              <div className="text-center mb-12">
                <h1 className="text-8xl font-bold tracking-tighter">{formatTime(time)}</h1>
                <p className="text-gray-400 mt-2">Session {pomodoroCount} of {settings.pomodorosUntilLongBreak}</p>
              </div>

              <div className="flex justify-center items-center gap-8">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -15 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white text-2xl p-3 rounded-full hover:bg-white/10 transition-all duration-300"
                  onClick={handleReset}
                >
                  <FaRedo />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-black text-4xl w-24 h-24 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300"
                  onClick={isRunning ? handlePause : handleStart}
                >
                  {isRunning ? <FaPause /> : <FaPlay />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-gray-400 hover:text-white text-2xl p-3 rounded-full hover:bg-white/10 transition-all duration-300"
                  onClick={handleSkip}
                >
                  <FaForward />
                </motion.button>
              </div>
              {/* Existing Timer UI Content Ends Here */}

            </motion.div>
          )}
          {currentView === 'progress' && (
            // Pass the total completed pomodoros to the Progress View
            <ProgressView totalCompletedPomodoros={totalCompletedPomodoros} />
          )}
        </AnimatePresence>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-[#1A1A1A] p-6 rounded-lg w-full max-w-md border border-white/10"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <SettingInput label="Pomodoro" value={tempSettings?.pomodoro} onChange={val => setTempSettings({...tempSettings, pomodoro: val})} />
                <SettingInput label="Short Break" value={tempSettings?.shortBreak} onChange={val => setTempSettings({...tempSettings, shortBreak: val})} />
                <SettingInput label="Long Break" value={tempSettings?.longBreak} onChange={val => setTempSettings({...tempSettings, longBreak: val})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SettingInput label="Coins/Pomodoro" value={tempSettings?.coinsPerPomodoro} onChange={val => setTempSettings({...tempSettings, coinsPerPomodoro: val})} />
                <SettingInput label="Sessions/Long Break" value={tempSettings?.pomodorosUntilLongBreak} onChange={val => setTempSettings({...tempSettings, pomodorosUntilLongBreak: val})} />
              </div>
              <div className="flex justify-between items-center bg-[#242424] p-3 rounded-md">
                <label className="text-sm text-gray-300">Auto-start Pomodoros</label>
                <ToggleSwitch checked={tempSettings?.autoStartPomodoros} onChange={val => setTempSettings({...tempSettings, autoStartPomodoros: val})} />
              </div>
              <div className="flex justify-between items-center bg-[#242424] p-3 rounded-md">
                <label className="text-sm text-gray-300">Auto-start Breaks</label>
                <ToggleSwitch checked={tempSettings?.autoStartBreaks} onChange={val => setTempSettings({...tempSettings, autoStartBreaks: val})} />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-md font-bold border border-white/20 hover:bg-white/10 transition-all duration-300"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white text-black rounded-md font-bold border border-transparent hover:bg-gray-200 transition-all duration-300"
                onClick={handleSettingsSave}
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}


export default Pomodoro;
