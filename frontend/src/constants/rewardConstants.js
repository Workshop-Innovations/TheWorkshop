/**
 * Passive Rewards unlocked based on Focus Time (minutes).
 * These are titles and profile frames granted as milestones.
 */

// Titles (Flairs) unlocked based on Focus Time (minutes)
export const PASSIVE_TITLES = [
  { id: 'title-novice', name: 'Novice Focus', type: 'title', minutesRequired: 0, description: 'Completed your first session.' },
  { id: 'title-apprentice', name: 'Apprentice Timer', type: 'title', minutesRequired: 250, description: 'Completed 250 minutes of focus.' },
  { id: 'title-ninja', name: 'Focus Ninja', type: 'title', minutesRequired: 500, description: 'Completed 500 minutes of focus.' },
  { id: 'title-prodigy', name: 'Pomodoro Prodigy', type: 'title', minutesRequired: 1250, description: 'Completed 1250 minutes of focus.' },
  { id: 'title-master', name: 'Focus Master', type: 'title', minutesRequired: 2500, description: 'Completed 2500 minutes of focus.' },
  { id: 'title-legend', name: 'Time Lord', type: 'title', minutesRequired: 6250, description: 'Completed 6250 minutes of focus.' },
];

// Profile Frames unlocked based on Focus Time (minutes)
export const PASSIVE_FRAMES = [
  {
    id: 'frame-basic',
    name: 'Bronze Border',
    type: 'frame',
    minutesRequired: 0,
    description: 'Completed your first session.',
    framePath: './src/assets/frames/bronze.png'
  },
  {
    id: 'frame-silver',
    name: 'Silver Shine',
    type: 'frame',
    minutesRequired: 300,
    description: 'Completed 300 minutes of focus.',
    framePath: 'https://placehold.co/400x400/C0C0C0/000000?text=Silver' // Placeholder
  },
  {
    id: 'frame-fire',
    name: 'Fire Edge',
    type: 'frame',
    minutesRequired: 625,
    description: 'Completed 625 minutes of focus.',
    framePath: './src/assets/frames/fire.png'
  },
  {
    id: 'frame-gold',
    name: 'Golden Glory',
    type: 'frame',
    minutesRequired: 1000,
    description: 'Completed 1000 minutes of focus.',
    framePath: 'https://placehold.co/400x400/FFD700/000000?text=Gold' // Placeholder
  },
  {
    id: 'frame-green',
    name: 'Emerald Energy',
    type: 'frame',
    minutesRequired: 1875,
    description: 'Completed 1875 minutes of focus.',
    framePath: './src/assets/frames/emarald.png'
  },
  {
    id: 'frame-ice',
    name: 'Ice Glow',
    type: 'frame',
    minutesRequired: 3750,
    description: 'Completed 3750 minutes of focus.',
    framePath: './src/assets/frames/ice.png'
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