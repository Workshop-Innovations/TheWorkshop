import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, localhost is 10.0.2.2. For iOS emulator, it's 127.0.0.1
// You can also use your local IP network address (e.g. 192.168.1.X:8000) for physical devices
// Process.env isn't supported the exact same way out-of-the-box without babel-plugin-dotenv, 
// but Expo allows EXPO_PUBLIC_ prefix for pure JS injection, or we use dynamic IP for dev:

const getBaseUrl = () => {
    // If explicitly set via environment variable:
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Defaults for dev
    if (__DEV__) {
        if (Platform.OS === 'web') {
            return 'http://localhost:8000';
        }
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:8000'; // Android emulator
        }
        return 'http://127.0.0.1:8000'; // iOS simulator
    }

    return 'https://your-production-url.theworkshop.app';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
