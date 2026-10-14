import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { getProgressData, fetchCompletedSessions } from '../services/progressService'; // Added fetchCompletedSessions
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, CheckCircle2, Coins, Gift, Flame, Clock, Coffee } from 'lucide-react';
import ActivityHistory from '../components/ActivityHistory';
import GlobalLoader from '../components/GlobalLoader';

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
      // Field names match the backend SessionLogResponse
      // (completion_time / session_type / minutes_spent)
      const date = session.completion_time ? new Date(session.completion_time).toISOString().split('T')[0] : 'Unknown';

      if (session.session_type !== 'focus' && session.session_type !== 'pomodoro') return;

      const durationMinutes = session.minutes_spent || 0;

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
        if (sessions) calculateProgress(sessions);
      } catch (error) {
        console.error("Failed to load API progress data:", error);
      }
    };

    loadApiProgress();
  }, [calculateProgress]); // <--- MODIFIED: Dependency array includes calculateProgress

  if (!progress) {
    return <GlobalLoader message="Loading Progress..." />;
  }

  const today = new Date().toISOString().split('T')[0];
  // NOTE: todayStats still uses local history for consistency with the rest of the section
  const todayStats = progress.history[today] || { pomodoros: 0, focusTime: 0, tasksCompleted: 0, breakTime: 0 };

  const redeemedRewards = progress.rewards.filter(r => r.redeemed);

  const todayTiles = [
    { icon: <Flame className="w-6 h-6" />, value: todayStats.pomodoros, label: 'Pomodoros', tone: 'primary' },
    { icon: <Clock className="w-6 h-6" />, value: todayStats.focusTime, label: 'Focus Mins', tone: 'primary' },
    { icon: <Coffee className="w-6 h-6" />, value: todayStats.breakTime, label: 'Break Mins', tone: 'accent' },
    { icon: <CheckCircle2 className="w-6 h-6" />, value: todayStats.tasksCompleted, label: 'Tasks Done', tone: 'accent' },
  ];

  const lifetimeStats = [
    { icon: <Coins className="w-4 h-4" />, label: 'Total Coins', value: progress.coins },
    { icon: <Clock className="w-4 h-4" />, label: 'Total Focus', value: `${apiStats.totalFocusHours} hrs` },
    { icon: <Flame className="w-4 h-4" />, label: 'Total Pomodoros', value: apiStats.totalSessions },
    { icon: <Calendar className="w-4 h-4" />, label: 'Longest Streak', value: `${apiStats.longestStreak} days` },
    { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Total Tasks', value: progress.tasks.filter(t => t.completed).length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-2">My Progress</h1>
          <p className="text-slate-500 text-lg font-medium mb-12">Track your focus, streaks and rewards over time.</p>

          {/* Today's Stats */}
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-6 ml-1">Today</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {todayTiles.map(tile => (
              <div key={tile.label} className="bg-white p-6 rounded-md shadow-sm border border-slate-100/50 card hover:shadow-md flex flex-col">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-6 ${tile.tone === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {tile.icon}
                </div>
                <div className="text-4xl font-black text-slate-800 mb-1">{tile.value}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">{tile.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Lifetime Stats */}
            <div className="bg-primary text-white p-8 rounded-md shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-sm font-bold text-white/70 uppercase tracking-[0.15em] mb-8 relative">Lifetime</h2>
              <div className="space-y-5 relative">
                {lifetimeStats.map(stat => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium text-white/70">{stat.icon} {stat.label}</span>
                    <span className="font-black text-xl">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Redeemed Rewards */}
            <div className="bg-white p-8 rounded-md shadow-sm border border-slate-100/50 md:col-span-2">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">Redeemed Rewards</h2>
              {redeemedRewards.length > 0 ? (
                <div className="space-y-3">
                  {redeemedRewards.map(reward => (
                    <div key={reward.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-md">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{reward.name}</p>
                          <p className="text-xs font-medium text-slate-400">Redeemed on {new Date(reward.redeemedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">-{reward.cost} coins</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-md flex items-center justify-center mb-4">
                    <Gift className="w-7 h-7" />
                  </div>
                  <p className="text-slate-500 font-medium">No rewards redeemed yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <ActivityHistory history={apiStats.historyStats} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Progress;