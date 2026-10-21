import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";

import {
  getProgressData,
  saveProgressData,
  logPomodoro,
  logBreak,
  getTimerState,
  saveTimerState,
  clearTimerState,
  fetchSessionSummary,
} from "../services/progressService.js";
import { useAuth } from "./AuthContext.jsx";
import { toast } from "react-toastify";

const POMODORO_MINUTES = 30;

const DEFAULT_USER_STATS = {
  totalFocusMinutes: 0,
  totalCompletedPomodoros: 0,
  unlockedRewards: [],
  activeTitleId: null,
  activeFrameId: null,
};

const PomodoroContext = createContext();

export const usePomodoro = () => useContext(PomodoroContext);

export const PomodoroProvider = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [statsRevision, setStatsRevision] = useState(0);
  const refreshStats = () => setStatsRevision((v) => v + 1);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem("pomodoroSettings");
    let parsed;
    try {
      parsed = savedSettings ? JSON.parse(savedSettings) : null;
    } catch {
      parsed = null;
    }
    return (
      parsed || {
        pomodoro: POMODORO_MINUTES,
        shortBreak: 5,
        longBreak: 15,
        coinsPerPomodoro: 10,
        pomodorosUntilLongBreak: 4,
        autoStartPomodoros: false,
        autoStartBreaks: false,
        themeColor: "default",
      }
    );
  });

  const [time, setTime] = useState(settings.pomodoro * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("pomodoro");
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const [userStats, setUserStats] = useState(DEFAULT_USER_STATS);

  const handleCompletion = useCallback(
    (isSkip = false) => {
      let nextMode = "pomodoro";
      let newPomodoroCount = pomodoroCount;

      if (mode === "pomodoro") {
        if (!isSkip) {
          const sessionKey = getTimerState()?.endTime ?? Date.now();
          const updated = logPomodoro(
            settings.pomodoro,
            settings.coinsPerPomodoro,
            sessionKey,
          );
          toast.success(
            ` Well done! You've earned ${settings.coinsPerPomodoro} coins!`,
          );

          newPomodoroCount++;

          setUserStats((prev) => ({
            ...prev,
            totalCompletedPomodoros: updated.userStats.totalCompletedPomodoros,
            totalFocusMinutes: updated.userStats.totalFocusMinutes,
          }));
          setPomodoroCount(newPomodoroCount);
        }

        nextMode =
          newPomodoroCount % settings.pomodorosUntilLongBreak === 0
            ? "longBreak"
            : "shortBreak";
      } else {
        if (mode === "shortBreak") {
          logBreak(settings.shortBreak);
          toast.info("Break finished. Time for the next session!");
        } else if (mode === "longBreak") {
          logBreak(settings.longBreak);
          toast.info("Long break finished. Ready to focus?");
          setPomodoroCount(0);
          newPomodoroCount = 0;
        }
        nextMode = "pomodoro";
      }

      setIsRunning(false);
      clearTimerState();

      setMode(nextMode);
      let newTime;
      switch (nextMode) {
        case "pomodoro":
          newTime = settings.pomodoro * 60;
          break;
        case "shortBreak":
          newTime = settings.shortBreak * 60;
          break;
        case "longBreak":
          newTime = settings.longBreak * 60;
          break;
        default:
          newTime = settings.pomodoro * 60;
      }
      setTime(newTime);

      const shouldAutoStart =
        (nextMode === "pomodoro" && settings.autoStartPomodoros) ||
        ((nextMode === "shortBreak" || nextMode === "longBreak") &&
          settings.autoStartBreaks);

      if (shouldAutoStart) {
        setIsRunning(true);
        saveTimerState({
          endTime: Date.now() + newTime * 1000,
          mode: nextMode,
          pomodoroCount: newPomodoroCount,
        });
      }
    },
    [mode, pomodoroCount, settings],
  );

  useEffect(() => {
    const savedState = getTimerState();
    if (!savedState) return;

    setMode(savedState.mode);
    setPomodoroCount(savedState.pomodoroCount);

    if (savedState.endTime) {
      const remainingSeconds = Math.round(
        (savedState.endTime - Date.now()) / 1000,
      );

      setTime(Math.max(remainingSeconds, 0));
      setIsRunning(true);
    } else if (savedState.remainingTime) {
      setTime(savedState.remainingTime);
      setIsRunning(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setUserStats(DEFAULT_USER_STATS);
    setStatsError(null);
    if (!accessToken || !user?.id) {
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    fetchSessionSummary(accessToken, controller.signal)
      .then((summary) => {
        if (controller.signal.aborted) return;
        const current = getProgressData();
        const stats = {
          ...DEFAULT_USER_STATS,
          ...current.userStats,
          totalCompletedPomodoros: summary.total_completed_sessions,
          totalFocusMinutes: summary.total_focus_minutes,
        };
        saveProgressData({ ...current, userStats: stats });
        setUserStats(stats);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setStatsError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setStatsLoading(false);
      });
    return () => controller.abort();
  }, [accessToken, user?.id, statsRevision]);

  useEffect(() => {
    let interval = null;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        const endTime = getTimerState()?.endTime;
        if (endTime)
          setTime(Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));
      }, 1000);
    } else if (isRunning && time <= 0) {
      handleCompletion();
    }
    return () => clearInterval(interval);
  }, [isRunning, time, handleCompletion]);

  const handleStart = () => {
    setIsRunning(true);

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
      case "pomodoro":
        newTime = settings.pomodoro * 60;
        break;
      case "shortBreak":
        newTime = settings.shortBreak * 60;
        break;
      case "longBreak":
        newTime = settings.longBreak * 60;
        break;
      default:
        newTime = settings.pomodoro * 60;
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
      case "pomodoro":
        newTime = settings.pomodoro * 60;
        break;
      case "shortBreak":
        newTime = settings.shortBreak * 60;
        break;
      case "longBreak":
        newTime = settings.longBreak * 60;
        break;
      default:
        newTime = settings.pomodoro * 60;
    }
    setTime(newTime);
  };

  const value = {
    time,
    mode,
    isRunning,
    settings,
    setSettings,
    pomodoroCount,
    handleStart,
    handlePause,
    handleReset,
    handleModeChange,
    handleSkip: () => handleCompletion(true),
    userStats,
    statsLoading,
    statsError,
    refreshStats,
    POMODORO_MINUTES,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
};
