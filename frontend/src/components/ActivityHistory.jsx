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
    <div className="bg-white p-8 rounded-md shadow-sm border border-slate-100/50">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.15em] mb-10">Last 7 Days</h2>
      <div className="flex justify-between items-end gap-2 h-48">
        {data.map(({ date, pomodoros, tasksCompleted }) => (
          <div key={date} className="flex-1 flex flex-col items-center gap-2 text-center">
            <div className="w-full h-full flex items-end">
              <motion.div 
                className="w-full bg-primary/15 rounded-t-md hover:bg-primary relative transition-colors"
                style={{ height: `${(pomodoros / maxPomodoros) * 100}%` }}
                initial={{ height: 0 }}
                animate={{ height: `${(pomodoros / maxPomodoros) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-700">{pomodoros}</div>
              </motion.div>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-6 pt-6 border-t border-slate-100 text-sm font-medium text-slate-400">
        Upgrade to Premium to view history up to one year.
      </div>
    </div>
  );
};

export default ActivityHistory;
