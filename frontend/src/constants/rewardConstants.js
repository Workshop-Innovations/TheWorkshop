/**
 * Passive Rewards unlocked based on totalCompletedPomodoros (count).
 * These are titles and profile frames granted as milestones.
 */

import { Link, useNavigate } from 'react-router-dom';



// Titles (Flairs) unlocked based on Pomodoro count
export const PASSIVE_TITLES = [
  { id: 'title-novice', name: 'Novice Focus', type: 'title', requirement: 0, description: 'Completed your first session.' },
  { id: 'title-apprentice', name: 'Apprentice Timer', type: 'title', requirement: 10, description: 'Completed 10 focus sessions.' },
  { id: 'title-prodigy', name: 'Pomodoro Prodigy', type: 'title', requirement: 50, description: 'Completed 50 focus sessions.' },
  { id: 'title-master', name: 'Focus Master', type: 'title', requirement: 100, description: 'Completed 100 focus sessions.' },
  { id: 'title-legend', name: 'Time Lord', type: 'title', requirement: 250, description: 'Completed 250 focus sessions.' },
];

// Profile Frames unlocked based on Pomodoro count
export const PASSIVE_FRAMES = [
  { 
    id: 'frame-basic', 
    name: 'Bronze Border', 
    type: 'frame', 
    requirement: 0, 
    description: 'Completed your first session.',
    framePath: './src/assets/frames/bronze.png' // Added framePath
  },
  { 
    id: 'frame-fire', 
    name: 'Fire Edge', 
    type: 'frame', 
    requirement: 25, 
    description: 'Completed 25 focus sessions.',
    framePath: './src/assets/frames/fire.png' // Added framePath
  },
  { 
    id: 'frame-green', 
    name: 'Emarald Energy', 
    type: 'frame', 
    requirement: 75, 
    description: 'Completed 75 focus sessions.',
    framePath: './src/assets/frames/emarald.png' // Added framePath
  },
  { 
    id: 'frame-ice', 
    name: 'ice Glow', 
    type: 'frame', 
    requirement: 150, 
    description: 'Completed 150 focus sessions.',
    framePath: './src/assets/frames/ice.png' // Added framePath
  },
];

// Combine all passive rewards for easier looping/checking
export const ALL_PASSIVE_REWARDS = [...PASSIVE_TITLES, ...PASSIVE_FRAMES];

// Export all rewards combined (passive and store rewards if you have them)
export const REWARDS = {
    PASSIVE_TITLES,
    PASSIVE_FRAMES,
    ALL_PASSIVE_REWARDS,
    // Add STORE_REWARDS here later
}