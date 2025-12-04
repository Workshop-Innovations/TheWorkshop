import { useState, useEffect, useCallback } from 'react';
import { getProgressData, fetchCompletedSessions, fetchTasks } from '../services/progressService';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaCalendarAlt, FaCheckCircle, FaFire, FaClock, FaCoffee } from 'react-icons/fa';
import ActivityHistory from '../components/ActivityHistory';

const Progress = ({ setCurrentView }) => {
  const [progress, setProgress] = useState(null);

  // State for API-derived metrics
  const [apiStats, setApiStats] = useState({
    totalFocusHours: 0,
    totalSessions: 0,
    longestStreak: 0,
    historyStats: {},
    totalTasks: 0
  });

  // API Data Aggregation Logic
  const calculateProgress = useCallback((sessions, tasks) => {
    const stats = {};
    let totalSessions = 0;
    let totalFocusMinutes = 0;

    sessions.forEach(session => {
      const date = session.completion_time ? new Date(session.completion_time).toISOString().split('T')[0] : 'Unknown';

      if (session.session_type !== 'focus') return;

      const durationMinutes = session.minutes_spent;

      if (!stats[date]) {
        stats[date] = { pomodoros: 0, focusMinutes: 0 };
      }

      stats[date].pomodoros += 1;
      stats[date].focusMinutes += durationMinutes;
      totalSessions += 1;
      totalFocusMinutes += durationMinutes;
    });

    // Calculate Streak 
    const sortedDates = Object.keys(stats).sort();
    let currentStreak = 0;
    let maxStreak = 0;

    if (sortedDates.length > 0) {
      const isConsecutive = (d1, d2) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.round((date2.getTime() - date1.getTime()) / oneDay) === 1;
      };

      currentStreak = 1;
      maxStreak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        if (isConsecutive(sortedDates[i - 1], sortedDates[i])) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
        maxStreak = Math.max(maxStreak, currentStreak);
      }
    }

    setApiStats({
      totalSessions: totalSessions,
      totalFocusHours: (totalFocusMinutes / 60).toFixed(1),
      longestStreak: maxStreak,
      historyStats: stats,
      totalTasks: tasks.filter(t => t.completed).length
    });

  }, []);

  useEffect(() => {
    // 1. Load local data (for legacy support if needed, though we are moving away)
    const localData = getProgressData();
    setProgress(localData);

    // 2. Fetch sessions and tasks from API
    const loadApiProgress = async () => {
      try {
        const [sessions, tasks] = await Promise.all([
          fetchCompletedSessions(),
          fetchTasks()
        ]);
        calculateProgress(sessions, tasks);
      } catch (error) {
        console.error("Failed to load API progress data:", error);
      }
    };

    loadApiProgress();
  }, [calculateProgress]);

  if (!progress) {
    return <div>Loading...</div>;
  }

  const today = new Date().toISOString().split('T')[0];
  // We can still use local history for today's immediate feedback if we want, 
  // or we could rely on the API stats if we trust the backend is updated fast enough.
  // For now, let's stick to the local 'todayStats' for immediate feedback, 
  // but use API for lifetime stats.
  const todayStats = progress.history[today] || { pomodoros: 0, focusTime: 0, tasksCompleted: 0, breakTime: 0 };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Navbar />
      <div className="container mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Progress</h1>

          <div className="bg-[#1A1A1A] p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">Today's Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#242424] p-4 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105">
                <FaFire className="text-3xl text-red-500 mb-2" />
                <span className="text-2xl font-bold">{todayStats.pomodoros}</span>
                <span className="text-sm text-gray-400">Pomodoros</span>
              </div>
              <div className="bg-[#242424] p-4 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105">
                <FaClock className="text-3xl text-blue-500 mb-2" />
                <span className="text-2xl font-bold">{todayStats.focusTime}</span>
                <span className="text-sm text-gray-400">Focus Mins</span>
              </div>
              <div className="bg-[#242424] p-4 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105">
                <FaCoffee className="text-3xl text-green-500 mb-2" />
                <span className="text-2xl font-bold">{todayStats.breakTime}</span>
                <span className="text-sm text-gray-400">Break Mins</span>
              </div>
              <div className="bg-[#242424] p-4 rounded-lg flex flex-col items-center justify-center transition-transform hover:scale-105">
                <FaCheckCircle className="text-3xl text-purple-500 mb-2" />
                <span className="text-2xl font-bold">{todayStats.tasksCompleted}</span>
                <span className="text-sm text-gray-400">Tasks Done</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1A1A1A] p-6 rounded-lg md:col-span-3">
              <h2 className="text-2xl font-bold mb-4">Lifetime Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-[#242424] rounded-lg">
                  <FaClock className="text-3xl text-blue-400 mb-2" />
                  <span className="font-bold text-2xl text-white">{apiStats.totalFocusHours} hrs</span>
                  <span className="text-sm text-gray-400">Total Focus</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#242424] rounded-lg">
                  <FaFire className="text-3xl text-red-400 mb-2" />
                  <span className="font-bold text-2xl text-white">{apiStats.totalSessions}</span>
                  <span className="text-sm text-gray-400">Total Pomodoros</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#242424] rounded-lg">
                  <FaCalendarAlt className="text-3xl text-green-400 mb-2" />
                  <span className="font-bold text-2xl text-white">{apiStats.longestStreak} days</span>
                  <span className="text-sm text-gray-400">Longest Streak</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-[#242424] rounded-lg">
                  <FaCheckCircle className="text-3xl text-purple-400 mb-2" />
                  <span className="font-bold text-2xl text-white">{apiStats.totalTasks}</span>
                  <span className="text-sm text-gray-400">Total Tasks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <ActivityHistory history={apiStats.historyStats} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Progress;