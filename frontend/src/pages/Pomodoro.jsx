import React, { useState, useEffect } from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { FaPlay, FaPause, FaForward, FaRedo, FaCog, FaCoins, FaCheckCircle, FaFire } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ALL_PASSIVE_REWARDS } from '../constants/rewardConstants';
import { Link, useNavigate } from 'react-router-dom';

// --- ProgressView Component Definition (Updated) ---
const ProgressView = ({ totalCompletedPomodoros }) => {
  const formatRequirementRemaining = (remaining) => {
    if (remaining === 1) return '1 session to go';
    return `${remaining} sessions to go`;
  };

  const nextRewards = ALL_PASSIVE_REWARDS
    .map(reward => ({
      ...reward,
      sessionsRemaining: reward.requirement - totalCompletedPomodoros,
      progressPercent: Math.min(100, (totalCompletedPomodoros / reward.requirement) * 100)
    }))
    .filter(reward => reward.sessionsRemaining > 0)
    .sort((a, b) => a.sessionsRemaining - b.sessionsRemaining)
    .slice(0, 5);

  return (
    <motion.div
      key="progress-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto p-8 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 mt-4 sm:mt-8"
    >
      <div className="text-center mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Focus Challenges</h2>
        <p className="text-sm text-slate-500 mt-2 font-medium uppercase tracking-wide">Total Pomodoros Completed</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="p-3 bg-green-50 rounded-full text-green-600">
            <FaFire className="text-2xl" />
          </div>
          <span className="text-5xl font-extrabold text-slate-800">{totalCompletedPomodoros}</span>
          <span className="text-xl text-slate-400 font-medium self-end mb-2">sessions</span>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-2">
        <span className="w-2 h-6 bg-primary rounded-full"></span>
        Next Rewards to Unlock
      </h3>

      {nextRewards.length === 0 ? (
        <p className="text-center text-slate-500 p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 italic">
          You have achieved all tracked passive challenges! Impressive work!
        </p>
      ) : (
        <div className="space-y-4">
          {nextRewards.map((reward) => (
            <div key={reward.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-primary/30 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{reward.name}</p>
                  <p className="text-xs text-slate-500 mt-1 capitalize font-medium px-2 py-0.5 bg-white rounded-md inline-block shadow-sm">
                    {reward.type} Reward • Target: {reward.requirement}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${reward.type === 'title' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {reward.type}
                  </p>
                  <p className="text-sm text-amber-600 font-bold">
                    {formatRequirementRemaining(reward.sessionsRemaining)}
                  </p>
                </div>
              </div>
              <div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${reward.progressPercent}%` }}
                    transition={{ duration: 0.8 }}
                  ></motion.div>
                </div>
                <p className="text-right text-xs text-slate-400 mt-2 font-medium">{reward.progressPercent.toFixed(0)}% complete</p>
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
    userStats,
  } = usePomodoro();

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
    toast.success('Settings saved!', {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };

  const modeColors = {
    pomodoro: 'bg-primary border-primary',
    shortBreak: 'bg-secondary border-secondary',
    longBreak: 'bg-indigo-500 border-indigo-500',
  };

  const modeTextColors = {
    pomodoro: 'text-primary',
    shortBreak: 'text-secondary',
    longBreak: 'text-indigo-500',
  };

  const SettingInput = ({ label, value, onChange }) => (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-slate-800 font-semibold transition-all"
        min="1"
      />
    </div>
  );

  const ToggleSwitch = ({ checked, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
    </label>
  );


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Navbar />
      {/* Toast container must be light theme now */}
      <ToastContainer position="bottom-right" theme="light" />

      <div className="flex-grow container mx-auto px-4 py-28 flex flex-col items-center">

        {/* View Toggle */}
        <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 mb-10 flex">
          <button
            onClick={() => setCurrentView('timer')}
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${currentView === 'timer' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Focus Timer
          </button>
          <button
            onClick={() => setCurrentView('progress')}
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${currentView === 'progress' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            My Progress
          </button>
        </div>


        <AnimatePresence mode="wait">
          {currentView === 'timer' && (
            <motion.div
              key="timer-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
              className="w-full max-w-xl"
            >
              <div className="relative bg-white rounded-3xl p-8 sm:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* Background Progress Circle or Decoration could go here */}
                <div className={`absolute top-0 left-0 w-full h-2 ${modeColors[mode].split(' ')[0]}`} />

                {/* Header Controls */}
                <div className="flex justify-between items-center mb-10">
                  <div className="flex gap-2">
                    {['pomodoro', 'shortBreak', 'longBreak'].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleModeChange(m)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${mode === m
                          ? `bg-slate-900 text-white shadow-lg`
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        {m.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { setTempSettings(settings); setShowSettings(true); }}
                    className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <FaCog className="text-xl" />
                  </button>
                </div>

                {/* Timer Display */}
                <div className="text-center mb-12 relative z-10">
                  <div className={`text-8xl sm:text-9xl font-black tracking-tighter mb-4 tabular-nums ${modeTextColors[mode]} drop-shadow-sm`}>
                    {formatTime(time)}
                  </div>
                  <p className="text-slate-400 font-medium uppercase tracking-widest text-sm">
                    Session {pomodoroCount} • Target: {settings.pomodorosUntilLongBreak}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-6 sm:gap-10">
                  <button
                    onClick={handleReset}
                    className="p-4 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                    title="Reset Timer"
                  >
                    <FaRedo className="text-2xl" />
                  </button>

                  <button
                    onClick={isRunning ? handlePause : handleStart}
                    className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl text-white shadow-xl hover:scale-105 active:scale-95 transition-all ${modeColors[mode].split(' ')[0]}`}
                  >
                    {isRunning ? <FaPause /> : <FaPlay className="ml-2" />}
                  </button>

                  <button
                    onClick={handleSkip}
                    className="p-4 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                    title="Skip Session"
                  >
                    <FaForward className="text-2xl" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          {currentView === 'progress' && (
            <ProgressView totalCompletedPomodoros={totalCompletedPomodoros} />
          )}
        </AnimatePresence>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <motion.div
            className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            <h2 className="text-2xl font-bold mb-8 text-slate-800">Timer Settings</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <SettingInput label="Pomodoro" value={tempSettings?.pomodoro} onChange={val => setTempSettings({ ...tempSettings, pomodoro: val })} />
                <SettingInput label="Short Break" value={tempSettings?.shortBreak} onChange={val => setTempSettings({ ...tempSettings, shortBreak: val })} />
                <SettingInput label="Long Break" value={tempSettings?.longBreak} onChange={val => setTempSettings({ ...tempSettings, longBreak: val })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Coins input could be hidden if we don't want user editing it easily, but keeping it per original */}
                <SettingInput label="Coins/Session" value={tempSettings?.coinsPerPomodoro} onChange={val => setTempSettings({ ...tempSettings, coinsPerPomodoro: val })} />
                <SettingInput label="Sessions/Set" value={tempSettings?.pomodorosUntilLongBreak} onChange={val => setTempSettings({ ...tempSettings, pomodorosUntilLongBreak: val })} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="font-semibold text-slate-700">Auto-start Pomodoros</span>
                  <ToggleSwitch checked={tempSettings?.autoStartPomodoros} onChange={val => setTempSettings({ ...tempSettings, autoStartPomodoros: val })} />
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="font-semibold text-slate-700">Auto-start Breaks</span>
                  <ToggleSwitch checked={tempSettings?.autoStartBreaks} onChange={val => setTempSettings({ ...tempSettings, autoStartBreaks: val })} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
              <button
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
                onClick={handleSettingsSave}
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}


export default Pomodoro;
