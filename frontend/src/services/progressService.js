// --- Global State for API Logging Guard ---
let lastLoggedPomodoroCount = 0;

// 🎯 UPDATED FIX: Use Vite Environment Variables (import.meta.env)
// The VITE_API_BASE_URL will be set by:
// 1. .env.local (for local development)
// 2. Render Environment Variables (for production deployment)
// The fallback (||) ensures local development works even if the .env file is missing.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Helper function to retrieve the authentication token
const getAuthToken = () => {
    // Use the globally provided token for authentication
    return typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
};
const getToday = () => {
    return new Date().toISOString().split('T')[0];
};

const getInitialData = () => ({
    history: {},
    rewards: [], // Typically for purchasable/redeemable items
    tasks: [],
    // NEW: Structure for tracking overall user progress and passive rewards
    userStats: {
        totalCompletedPomodoros: 0, // Used for calculating hours and unlocking time-based rewards
        totalFocusMinutes: 0,       // NEW: Track total focus time in minutes
        unlockedRewards: [],      // IDs of passive rewards (titles/frames) unlocked by time
        activeTitleId: null,      // ID of the currently equipped title/flair
        activeFrameId: null,      // ID of the currently equipped profile frame
    }
});

export const getProgressData = () => {
    try {
        const data = localStorage.getItem('progressData');
        if (!data) {
            const initialData = getInitialData();
            saveProgressData(initialData);
            return initialData;
        }
        const parsedData = JSON.parse(data);

        // --- Migration/Safety Logic: Ensure the new userStats keys exist ---
        const defaultStats = getInitialData().userStats;
        if (!parsedData.userStats) {
            // If userStats is completely missing, use defaults
            parsedData.userStats = defaultStats;
        } else {
            // Merge in any missing keys (e.g., if we added activeFrameId later)
            parsedData.userStats = {
                ...defaultStats,
                ...parsedData.userStats,
            };
            // Backfill totalFocusMinutes if it's 0 but we have pomodoros (assuming 25m avg)
            if (!parsedData.userStats.totalFocusMinutes && parsedData.userStats.totalCompletedPomodoros > 0) {
                parsedData.userStats.totalFocusMinutes = parsedData.userStats.totalCompletedPomodoros * 25;
            }
        }
        // --- End Migration Logic ---

        return parsedData;

    } catch (error) {
        console.error("Failed to parse progress data:", error);
        const initialData = getInitialData();
        saveProgressData(initialData);
        return initialData;
    }
};

export const saveProgressData = (data) => {
    localStorage.setItem('progressData', JSON.stringify(data));
};

export const logPomodoro = async (minutes, currentCount) => {
    // 1. API Logging Check: Only proceed if this is a new, unlogged count
    if (currentCount > lastLoggedPomodoroCount) {
        const authToken = getAuthToken();
        if (authToken) {
            const maxRetries = 3;
            let delay = 1000;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    // Uses the dynamically set API_BASE_URL
                    // FIX: Correct endpoint is /api/v1/log/session
                    const response = await fetch(`${API_BASE_URL}/api/v1/log/session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                        body: JSON.stringify({
                            session_type: 'focus',
                            minutes_spent: minutes,
                        }),
                    });

                    if (response.ok) {
                        lastLoggedPomodoroCount = currentCount; // SUCCESS: Update the tracker
                        console.log(`Pomodoro #${currentCount} successfully logged to backend.`);
                        break; // Exit retry loop on success
                    } else {
                        // Retry on server errors (5xx)
                        if (response.status >= 500 && attempt < maxRetries - 1) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                            delay *= 2;
                        } else {
                            const errorData = await response.json().catch(() => ({ message: response.statusText }));
                            console.error('Failed to log session to backend:', errorData);
                            break;
                        }
                    }
                } catch (error) {
                    if (attempt < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                    } else {
                        console.error('Final attempt failed to log session:', error);
                    }
                }
            }
        } else {
            console.warn("User not authenticated. Skipping backend logging.");
        }
    }

    // 2. Local Storage Logging (Always keep this for immediate frontend progress/coins)
    const data = getProgressData();
    const today = getToday();

    if (!data.history[today]) {
        data.history[today] = { pomodoros: 0, focusTime: 0, tasksCompleted: 0, breakTime: 0 };
    } else if (data.history[today].breakTime === undefined) {
        data.history[today].breakTime = 0;
    }

    // Only increment if we haven't logged this count yet (local tracker)
    if (currentCount > lastLoggedPomodoroCount || !currentCount) {
        data.history[today].pomodoros += 1;
        data.history[today].focusTime += minutes;
        // NEW: Update total completed pomodoros for reward tracking
        data.userStats.totalCompletedPomodoros += 1;
        // NEW: Update total focus minutes
        if (!data.userStats.totalFocusMinutes) data.userStats.totalFocusMinutes = 0;
        data.userStats.totalFocusMinutes += minutes;
    }

    saveProgressData(data);
    return data;
};

export const logBreak = (minutes) => {
    const data = getProgressData();
    const today = getToday();

    if (!data.history[today]) {
        data.history[today] = { pomodoros: 0, focusTime: 0, tasksCompleted: 0, breakTime: 0 };
    } else if (data.history[today].breakTime === undefined) {
        data.history[today].breakTime = 0;
    }

    data.history[today].breakTime += minutes;

    saveProgressData(data);
    return data;
};

// NEW FUNCTION: To set the currently active reward (Title or Frame)
// This will be called from your RewardsPage
export const setActiveReward = (type, rewardId) => {
    const data = getProgressData();
    if (type === 'title') {
        data.userStats.activeTitleId = rewardId;
    } else if (type === 'frame') {
        data.userStats.activeFrameId = rewardId;
    }
    saveProgressData(data);
    return data.userStats;
};

export const logTaskCompletion = async (task) => {
    const data = getProgressData();
    const today = getToday();

    if (!data.history[today]) {
        data.history[today] = { pomodoros: 0, focusTime: 0, tasksCompleted: 0, breakTime: 0 };
    } else if (data.history[today].breakTime === undefined) {
        data.history[today].breakTime = 0;
    }

    data.history[today].tasksCompleted += 1;
    data.coins += 5;

    // mark task as completed
    const updatedTasks = data.tasks.map(t => t.id === task.id ? { ...t, completed: true } : t);
    data.tasks = updatedTasks;
    saveProgressData(data);

    // Sync with backend
    const authToken = getAuthToken();
    if (authToken && task.id) { // Ensure task has an ID and user is authenticated
        try {
            await fetch(`${API_BASE_URL}/api/v1/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ completed: true }),
            });
        } catch (error) {
            console.error("Failed to sync task completion to backend:", error);
        }
    }

    return data;
};

export const createTask = async (task) => {
    const data = getProgressData();
    if (!data.tasks) {
        data.tasks = [];
    }

    // Optimistic update for local storage (using temporary ID if needed, but ideally we wait for backend)
    // For now, we push to local storage to keep UI snappy, but we should replace with backend response

    const authToken = getAuthToken();
    if (authToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/tasks/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(task),
            });

            if (response.ok) {
                const newTask = await response.json();
                data.tasks.push(newTask); // Use the task from backend with real ID
                saveProgressData(data);
                return data;
            }
        } catch (error) {
            console.error("Failed to create task on backend:", error);
        }
    }

    // Fallback for offline or error (optional, but good for UX)
    // If we rely purely on backend, we might not push here if fetch fails.
    // But for this specific request, let's assume we want to sync.
    // If backend fails, we might have a task without an ID or a local ID.
    // For simplicity in this fix, we only save if backend succeeds or if we want local-only fallback.
    // Given the requirement is to fix stats, and stats rely on backend, we prioritize backend.

    return data;
};

export const spendCoins = (amount) => {
    const data = getProgressData();
    if (data.coins >= amount) {
        data.coins -= amount;
        saveProgressData(data);
    }
    return data;
};

export const createReward = (reward) => {
    const data = getProgressData();
    data.rewards.push(reward);
    saveProgressData(data);
    return data;
};

/**
 * Fetches all completed sessions for the authenticated user from the backend.
 * This data will be used to calculate daily progress.
 */
export const fetchCompletedSessions = async () => {
    const authToken = getAuthToken(); // Assuming getAuthToken is defined at the top of this file
    if (!authToken) {
        console.error("Authentication token is missing. Cannot fetch sessions.");
        return [];
    }

    try {
        // Uses the dynamically set API_BASE_URL
        const response = await fetch(`${API_BASE_URL}/api/v1/sessions/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data.sessions || []; // Assuming backend returns an array of sessions
        } else {
            console.error(`Failed to fetch sessions: ${response.statusText}`);
            // Fallback for failed fetch, perhaps returning local data?
            return [];
        }
    } catch (error) {
        console.error('Network error during session fetch:', error);
        return [];
    }
};

/**
 * Fetches all tasks for the authenticated user from the backend.
 */
export const fetchTasks = async () => {
    const authToken = getAuthToken();
    if (!authToken) {
        console.error("Authentication token is missing. Cannot fetch tasks.");
        return [];
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/tasks/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (response.ok) {
            const tasks = await response.json();
            return tasks || [];
        } else {
            console.error(`Failed to fetch tasks: ${response.statusText}`);
            return [];
        }
    } catch (error) {
        console.error('Network error during task fetch:', error);
        return [];
    }
};

export const redeemReward = (reward) => {
    const data = getProgressData();
    if (data.coins >= reward.cost) {
        data.coins -= reward.cost;
        const updatedRewards = data.rewards.map(r =>
            r.id === reward.id ? { ...r, redeemed: true, redeemedAt: new Date().toISOString() } : r
        );
        data.rewards = updatedRewards;
        saveProgressData(data);
    }
    return data;
};

export const saveTimerState = (state) => {
    localStorage.setItem('timerState', JSON.stringify(state));
};

export const getTimerState = () => {
    const savedState = localStorage.getItem('timerState');
    return savedState ? JSON.parse(savedState) : null;
};

export const clearTimerState = () => {
    localStorage.removeItem('timerState');
};