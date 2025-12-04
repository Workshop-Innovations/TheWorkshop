import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
// Note: setActiveReward is not yet imported here, but you will need it later.
// FIX: Added .js extension to resolve bundler path error
import { getProgressData, saveProgressData, logPomodoro, logBreak, getTimerState, saveTimerState, clearTimerState } from '../services/progressService.js';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const POMODORO_MINUTES = 30; // Base time for calculations (matches default setting)


const DEFAULT_USER_STATS = {
    totalCompletedPomodoros: 0,
    unlockedRewards: [],
    activeTitleId: null,
    activeFrameId: null,
};

const PomodoroContext = createContext();

export const usePomodoro = () => useContext(PomodoroContext);

export const PomodoroProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        return savedSettings ? JSON.parse(savedSettings) : {
            pomodoro: POMODORO_MINUTES, // Using the constant here
            shortBreak: 5,
            longBreak: 15,
            coinsPerPomodoro: 10,
            pomodorosUntilLongBreak: 4,
            autoStartPomodoros: false,
            autoStartBreaks: false,
            themeColor: 'default',
        };
    });

    const [time, setTime] = useState(settings.pomodoro * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('pomodoro');
    const [pomodoroCount, setPomodoroCount] = useState(0);

    // Stats state remains for basic tracking
    const [userStats, setUserStats] = useState(DEFAULT_USER_STATS);

    const handleCompletion = useCallback((isSkip = false) => {

        let nextMode = 'pomodoro';
        let newPomodoroCount = pomodoroCount;

        let newUserStats = { ...userStats };

        if (mode === 'pomodoro') {
            if (!isSkip) {
                // 1. Log Pomodoro
                // FIX: Pass pomodoroCount + 1 to ensure it's > lastLoggedPomodoroCount (0)
                logPomodoro(settings.pomodoro, pomodoroCount + 1);
                // REMOVED: toast.success(`🎉 Well done! You've earned ${settings.coinsPerPomodoro} coins!`);

                newPomodoroCount++;

                // 2. Update Total Pomodoros in Stats
                newUserStats.totalCompletedPomodoros += 1;
                // FIX: Update totalFocusMinutes in state so Dashboard updates immediately
                newUserStats.totalFocusMinutes = (newUserStats.totalFocusMinutes || 0) + settings.pomodoro;

                // 3. Update Service and Local State
                const currentProgress = getProgressData();
                saveProgressData({ ...currentProgress, userStats: newUserStats });

                setUserStats(newUserStats);
                setPomodoroCount(newPomodoroCount);
            }

            nextMode = newPomodoroCount % settings.pomodorosUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';

        } else {
            // Break completion logic
            if (mode === 'shortBreak') {
                logBreak(settings.shortBreak);
                toast.info('Break finished. Time for the next session!');
            } else if (mode === 'longBreak') {
                logBreak(settings.longBreak);
                toast.info('Long break finished. Ready to focus?');
                setPomodoroCount(0);
                newPomodoroCount = 0;
            }
            nextMode = 'pomodoro';
        }

        // IMPORTANT: Clear running status and persistence first
        setIsRunning(false);
        clearTimerState();

        setMode(nextMode);
        let newTime;
        switch (nextMode) {
            case 'pomodoro': newTime = settings.pomodoro * 60; break;
            case 'shortBreak': newTime = settings.shortBreak * 60; break;
            case 'longBreak': newTime = settings.longBreak * 60; break;
            default: newTime = settings.pomodoro * 60;
        }
        setTime(newTime);

        const shouldAutoStart = (nextMode === 'pomodoro' && settings.autoStartPomodoros) ||
            ((nextMode === 'shortBreak' || nextMode === 'longBreak') && settings.autoStartBreaks);

        if (shouldAutoStart) {
            setIsRunning(true);
            saveTimerState({ endTime: Date.now() + newTime * 1000, mode: nextMode, pomodoroCount: newPomodoroCount });
        }
    }, [mode, pomodoroCount, settings, userStats]);

    // 1. Initial Load of Timer and User Stats State
    useEffect(() => {
        // Load Timer State
        const savedState = getTimerState();
        let shouldComplete = false;

        if (savedState) {
            setMode(savedState.mode);
            setPomodoroCount(savedState.pomodoroCount);

            if (savedState.endTime) {
                const remainingSeconds = Math.round((savedState.endTime - Date.now()) / 1000);
                if (remainingSeconds > 0) {
                    setTime(remainingSeconds);
                    setIsRunning(true);
                } else {
                    // Timer expired while offline. Flag it for completion.
                    shouldComplete = true;
                }
            } else if (savedState.remainingTime) {
                setTime(savedState.remainingTime);
                setIsRunning(false);
            }
        }

        // FIX for Maximum update depth exceeded: Run completion logic after state checks.
        if (shouldComplete) {
            handleCompletion();
            // Return early to ensure the stats loading doesn't interfere with the completion state update.
            return;
        }

        // Load User Stats (Runs only if shouldComplete is false)
        try {
            const data = getProgressData();
            if (data && data.userStats) {
                setUserStats(prevStats => ({
                    ...DEFAULT_USER_STATS,
                    ...data.userStats
                }));
            }
        } catch (e) {
            console.error("Error loading progress data:", e);
        }
    }, [handleCompletion]);

    // 2. Timer Interval
    useEffect(() => {
        let interval = null;
        if (isRunning && time > 0) {
            interval = setInterval(() => setTime(t => t - 1), 1000);
        } else if (isRunning && time <= 0) {
            handleCompletion();
        }
        return () => clearInterval(interval);
    }, [isRunning, time, handleCompletion]);

    // 3. Update timer when settings change (if not running)
    useEffect(() => {
        if (!isRunning) {
            let newTime;
            switch (mode) {
                case 'pomodoro': newTime = settings.pomodoro * 60; break;
                case 'shortBreak': newTime = settings.shortBreak * 60; break;
                case 'longBreak': newTime = settings.longBreak * 60; break;
                default: newTime = settings.pomodoro * 60;
            }
            setTime(newTime);
        }
    }, [settings, mode, isRunning]);

    const handleStart = () => {
        setIsRunning(true);
        // FIX: Ensuring the saveTimerState object is correctly closed (syntax fix)
        saveTimerState({ endTime: Date.now() + time * 1000, mode, pomodoroCount });
    };

    const handlePause = () => {
        setIsRunning(false);
        saveTimerState({ remainingTime: time, mode, pomodoroCount });
    };

    const handleReset = () => {
        setIsRunning(false);
        clearTimerState();
        let newTime;
        switch (mode) {
            case 'pomodoro': newTime = settings.pomodoro * 60; break;
            case 'shortBreak': newTime = settings.shortBreak * 60; break;
            case 'longBreak': newTime = settings.longBreak * 60; break;
            default: newTime = settings.pomodoro * 60;
        }
        setTime(newTime);
    };

    const handleModeChange = (newMode) => {
        if (mode === newMode) return;
        setIsRunning(false);
        clearTimerState();
        setMode(newMode);
        let newTime;
        switch (newMode) {
            case 'pomodoro': newTime = settings.pomodoro * 60; break;
            case 'shortBreak': newTime = settings.shortBreak * 60; break;
            case 'longBreak': newTime = settings.longBreak * 60; break;
            default: newTime = settings.pomodoro * 60;
        }
        setTime(newTime);
    };

    const value = {
        time, mode, isRunning, settings, setSettings, pomodoroCount,
        handleStart, handlePause, handleReset, handleModeChange,
        handleSkip: () => handleCompletion(true),
        userStats,
        POMODORO_MINUTES,
    };

    return (
        <PomodoroContext.Provider value={value}>
            {children}
        </PomodoroContext.Provider>
    );
};