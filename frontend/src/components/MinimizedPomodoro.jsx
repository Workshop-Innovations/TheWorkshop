import { usePomodoro } from '../context/PomodoroContext';
import { Play, Pause, Forward, Maximize } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MinimizedPomodoro = () => {
  const { time, isRunning, mode, handleStart, handlePause, handleSkip } = usePomodoro();
  const navigate = useNavigate();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExpand = () => {
    navigate('/pomodoro');
  };

  const modeDetails = {
    pomodoro: { color: 'border-primary text-primary', label: 'Focus Time' },
    shortBreak: { color: 'border-accent text-accent', label: 'Short Break' },
    longBreak: { color: 'border-accent text-accent', label: 'Long Break' },
  }

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: window.innerWidth - 300, top: 0, bottom: window.innerHeight - 150 }}
      initial={{ y: 200, opacity: 0 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: isRunning ? [1, 1.02, 1] : 1,
      }}
      exit={{ y: 200, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 20,
        scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
      }}
      className={`fixed bottom-8 right-8 bg-white p-5 rounded-2xl shadow-2xl z-50 cursor-grab w-72 border-2 ${modeDetails[mode].color}`}
      whileDrag={{ cursor: 'grabbing' }}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-sm tracking-widest uppercase mb-1">{modeDetails[mode].label}</p>
          <p className="text-5xl font-extrabold tracking-tighter text-slate-800">{formatTime(time)}</p>
        </div>
        <div className="flex flex-col gap-2 text-slate-400">
          <motion.button whileHover={{ scale: 1.1, color: '#154c79' }} whileTap={{ scale: 0.9 }} onClick={handleExpand} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><Maximize className="w-5 h-5" /></motion.button>
          {isRunning ? (
            <motion.button whileHover={{ scale: 1.1, color: '#154c79' }} whileTap={{ scale: 0.9 }} onClick={handlePause} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><Pause className="w-5 h-5" fill="currentColor" /></motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.1, color: '#154c79' }} whileTap={{ scale: 0.9 }} onClick={handleStart} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><Play className="w-5 h-5" fill="currentColor" /></motion.button>
          )}
          <motion.button whileHover={{ scale: 1.1, color: '#154c79' }} whileTap={{ scale: 0.9 }} onClick={handleSkip} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><Forward className="w-5 h-5" /></motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default MinimizedPomodoro;
