import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { getProgressData, fetchCompletedSessions } from '../services/progressService'; // Added fetchCompletedSessions
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaCalendarAlt, FaCheckCircle, FaCoins, FaGift, FaFire, FaClock, FaCoffee } from 'react-icons/fa';
import ActivityHistory from '../components/ActivityHistory';

const Progress = ({ setCurrentView }) => { // <--- MODIFIED: Added setCurrentView prop
  const [progress, setProgress] = useState(null);
  
  // <--- NEW: State for API-derived metrics
  const [apiStats, setApiStats] = useState({
    totalFocusHours: 0,
    totalSessions: 0,
    longestStreak: 0,
    historyStats: {}
  });

  // <--- NEW: API Data Aggregation Logic (useCallback ensures efficiency)
  const calculateProgress = useCallback((sessions) => {
    const stats = {};
    let totalSessions = 0;
    let totalFocusMinutes = 0;

    sessions.forEach(session => {
      const date = session.completedAt ? new Date(session.completedAt).toISOString().split('T')[0] : 'Unknown';
      
      if (session.mode !== 'pomodoro') return; 

      const durationMinutes = session.duration / 60;

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
      historyStats: stats
    });
    
  }, []); // <--- END NEW

  useEffect(() => {
    // <--- MODIFIED: Fetch local data AND API data
    // 1. Load local data (for coins, rewards, tasks, which are still local)
    const localData = getProgressData();
    setProgress(localData);

    // 2. Fetch sessions from API (for accurate progress/streaks)
    const loadApiProgress = async () => {
      try {
        const sessions = await fetchCompletedSessions();
        calculateProgress(sessions);
      } catch (error) {
        console.error("Failed to load API progress data:", error);
      }
    };

    loadApiProgress();
  }, [calculateProgress]); // <--- MODIFIED: Dependency array includes calculateProgress

  if (!progress) {
    return <div>Loading...</div>;
  }

  const today = new Date().toISOString().split('T')[0];
  // NOTE: todayStats still uses local history for consistency with the rest of the section
  const todayStats = progress.history[today] || { pomodoros: 0, focusTime: 0, tasksCompleted: 0, breakTime: 0 };

  const redeemedRewards = progress.rewards.filter(r => r.redeemed);

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
            <div className="bg-[#1A1A1A] p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Lifetime Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg"><FaCoins /> Total Coins</span>
                  <span className="font-bold text-2xl text-yellow-400">{progress.coins}</span>
                </div>
                {/* <--- NEW: Display API-derived Total Focus Hours */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg"><FaClock /> Total Focus</span>
                  <span className="font-bold text-2xl text-blue-400">{apiStats.totalFocusHours} hrs</span>
                </div>
                {/* <--- NEW: Display API-derived Total Sessions */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg"><FaFire /> Total Pomodoros</span>
                  <span className="font-bold text-2xl text-red-400">{apiStats.totalSessions}</span>
                </div>
                {/* <--- NEW: Display API-derived Longest Streak */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg"><FaCalendarAlt /> Longest Streak</span>
                  <span className="font-bold text-2xl text-green-400">{apiStats.longestStreak} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg"><FaCheckCircle /> Total Tasks</span>
                  <span className="font-bold text-2xl">{progress.tasks.filter(t => t.completed).length}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1A1A1A] p-6 rounded-lg md:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Redeemed Rewards</h2>
              {redeemedRewards.length > 0 ? (
                <div className="space-y-4">
                  {redeemedRewards.map(reward => (
                    <div key={reward.id} className="flex items-center justify-between p-3 bg-[#242424] rounded-md">
                      <div className="flex items-center gap-3">
                        <FaGift className="text-xl" />
                        <div>
                          <p className="font-semibold">{reward.name}</p>
                          <p className="text-sm text-gray-400">Redeemed on {new Date(reward.redeemedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="font-bold text-yellow-500">-{reward.cost} coins</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No rewards redeemed yet.</p>
              )}
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