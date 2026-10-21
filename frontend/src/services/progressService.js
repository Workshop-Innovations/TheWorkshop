import { API_BASE_URL } from "./api.js";
let lastLoggedSessionKey;

export { API_BASE_URL };

const getAuthToken = () => {
  return localStorage.getItem("accessToken");
};
const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const getInitialData = () => ({
  coins: 100,
  history: {},
  rewards: [],
  tasks: [],

  userStats: {
    totalFocusMinutes: 0,
    totalCompletedPomodoros: 0,
    unlockedRewards: [],
    activeTitleId: null,
    activeFrameId: null,
  },
});

export const getProgressData = () => {
  try {
    const data = localStorage.getItem("progressData");
    if (!data) {
      const initialData = getInitialData();
      saveProgressData(initialData);
      return initialData;
    }
    const parsedData = JSON.parse(data);

    const defaultStats = getInitialData().userStats;
    if (!parsedData.userStats) {
      parsedData.userStats = defaultStats;
    } else {
      parsedData.userStats = {
        ...defaultStats,
        ...parsedData.userStats,
      };
    }

    return parsedData;
  } catch (error) {
    console.error("Failed to parse progress data:", error);
    const initialData = getInitialData();
    saveProgressData(initialData);
    return initialData;
  }
};

export const saveProgressData = (data) => {
  localStorage.setItem("progressData", JSON.stringify(data));
};

const sendSessionLog = async (minutes) => {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn("User not authenticated. Skipping backend logging.");
    return;
  }
  const maxRetries = 3;
  let delay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/log/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          minutes_spent: minutes,
          session_type: "focus",
        }),
      });

      if (response.ok) return;

      if (response.status >= 500 && attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        console.error("Failed to log session to backend:", errorData);
        return;
      }
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        console.error("Final attempt failed to log session:", error);
      }
    }
  }
};

export const logPomodoro = (minutes, coinsEarned = 10, sessionKey) => {
  if (sessionKey !== undefined && sessionKey === lastLoggedSessionKey) {
    return getProgressData();
  }
  lastLoggedSessionKey = sessionKey;

  sendSessionLog(minutes);

  const data = getProgressData();
  const today = getToday();

  if (!data.history[today]) {
    data.history[today] = {
      pomodoros: 0,
      focusTime: 0,
      tasksCompleted: 0,
      breakTime: 0,
    };
  } else if (data.history[today].breakTime === undefined) {
    data.history[today].breakTime = 0;
  }

  data.history[today].pomodoros += 1;
  data.history[today].focusTime += minutes;
  data.coins += coinsEarned;

  data.userStats.totalCompletedPomodoros += 1;
  data.userStats.totalFocusMinutes =
    (data.userStats.totalFocusMinutes || 0) + minutes;

  saveProgressData(data);
  return data;
};

export const logBreak = (minutes) => {
  const data = getProgressData();
  const today = getToday();

  if (!data.history[today]) {
    data.history[today] = {
      pomodoros: 0,
      focusTime: 0,
      tasksCompleted: 0,
      breakTime: 0,
    };
  } else if (data.history[today].breakTime === undefined) {
    data.history[today].breakTime = 0;
  }

  data.history[today].breakTime += minutes;

  saveProgressData(data);
  return data;
};

export const setActiveReward = (type, rewardId) => {
  const data = getProgressData();
  if (type === "title") {
    data.userStats.activeTitleId = rewardId;
  } else if (type === "frame") {
    data.userStats.activeFrameId = rewardId;
  }
  saveProgressData(data);
  return data.userStats;
};

export const logTaskCompletion = (task) => {
  const data = getProgressData();
  const today = getToday();

  if (!data.history[today]) {
    data.history[today] = {
      pomodoros: 0,
      focusTime: 0,
      tasksCompleted: 0,
      breakTime: 0,
    };
  } else if (data.history[today].breakTime === undefined) {
    data.history[today].breakTime = 0;
  }

  data.history[today].tasksCompleted += 1;
  data.coins += 5;

  const updatedTasks = data.tasks.map((t) =>
    t.id === task.id ? { ...t, completed: true } : t,
  );
  data.tasks = updatedTasks;

  saveProgressData(data);
  return data;
};

export const createTask = (task) => {
  const data = getProgressData();
  if (!data.tasks) {
    data.tasks = [];
  }
  data.tasks.push(task);
  saveProgressData(data);
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

export const fetchCompletedSessions = async () => {
  const authToken = getAuthToken();
  if (!authToken) {
    console.error("Authentication token is missing. Cannot fetch sessions.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/log/sessions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      return Array.isArray(data) ? data : data.sessions || [];
    } else {
      console.error(`Failed to fetch sessions: ${response.statusText}`);

      return null;
    }
  } catch (error) {
    console.error("Network error during session fetch:", error);
    return null;
  }
};

export const redeemReward = (reward) => {
  const data = getProgressData();
  if (data.coins >= reward.cost) {
    data.coins -= reward.cost;
    const updatedRewards = data.rewards.map((r) =>
      r.id === reward.id
        ? { ...r, redeemed: true, redeemedAt: new Date().toISOString() }
        : r,
    );
    data.rewards = updatedRewards;
    saveProgressData(data);
  }
  return data;
};

export const saveTimerState = (state) => {
  localStorage.setItem(getTimerStorageKey(), JSON.stringify(state));
};

export const getTimerState = () => {
  const savedState = localStorage.getItem(getTimerStorageKey());
  try {
    return savedState ? JSON.parse(savedState) : null;
  } catch {
    return null;
  }
};

export const clearTimerState = () => {
  localStorage.removeItem(getTimerStorageKey());
};

export const fetchSessionSummary = async (token, signal) => {
  const response = await fetch(`${API_BASE_URL}/api/v1/log/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!response.ok) throw new Error("Unable to load focus totals");
  return response.json();
};

// Local partitioning only; token verification and authorization remain on the server.
export const getTimerStorageKey = () => {
  try {
    const token = getAuthToken();
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return `timerState:${payload.uid || payload.sub}`;
  } catch {
    return "timerState:guest";
  }
};
