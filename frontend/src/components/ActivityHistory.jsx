import React from 'react';
import { motion } from 'framer-motion';

const ActivityHistory = ({ history }) => {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const data = last7Days.map(date => ({
    date,
    ...(history[date] || { pomodoros: 0, tasksCompleted: 0 }),
  }));

  const maxPomodoros = Math.max(1, ...data.map(d => d.pomodoros));

  return (
    <div className="bg-[#1A1A1A] p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Last 7 Days Activity</h2>
      <div className="flex justify-between items-end gap-2 h-48">
        {data.map(({ date, pomodoros, tasksCompleted }) => (
          <div key={date} className="flex-1 flex flex-col items-center gap-2 text-center">
            <div className="w-full h-full flex items-end">
              <motion.div
                className="w-full bg-white/10 rounded-t-md hover:bg-white/20 relative"
                style={{ height: `${(pomodoros / maxPomodoros) * 100}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${(pomodoros / maxPomodoros) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold">{pomodoros}</div>
              </motion.div>
            </div>
            <span className="text-xs text-gray-400">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
          </div>
        ))}
      </div>
    </div>

  );
};

export default ActivityHistory;
