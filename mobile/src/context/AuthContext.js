import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import api from '../services/api';

const setToken = async (token) => {
    if (Platform.OS === 'web') {
        localStorage.setItem('accessToken', token);
    } else {
        await SecureStore.setItemAsync('accessToken', token);
    }
};

const getToken = async () => {
    if (Platform.OS === 'web') {
        return localStorage.getItem('accessToken');
    } else {
        return await SecureStore.getItemAsync('accessToken');
    }
};

const removeToken = async () => {
    if (Platform.OS === 'web') {
        localStorage.removeItem('accessToken');
    } else {
        await SecureStore.deleteItemAsync('accessToken');
    }
};

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profilePic, setProfilePic] = useState(null);

    const router = useRouter();
    const segments = useSegments();

    // Load token from secure storage on mount
    useEffect(() => {
        const loadToken = async () => {
            try {
                const token = await getToken();
                const pic = await AsyncStorage.getItem('userProfilePic');
                if (pic) setProfilePic(pic);

                if (token) {
                    setAccessToken(token);
                    await fetchUserProfile(token);
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Failed to load auth state", e);
                setLoading(false);
            }
        };
        loadToken();
    }, []);

    // Protect routes based on auth state
    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!accessToken && !inAuthGroup) {
            // Redirect to onboarding if not authenticated and not in auth group (like root /)
            router.replace('/(auth)/onboarding');
        } else if (accessToken && inAuthGroup) {
            // Redirect to dashboard if authenticated but trying to access login/register/onboarding
            router.replace('/(tabs)/dashboard');
        }
    }, [accessToken, loading, segments]);

    const fetchUserProfile = useCallback(async (token) => {
        try {
            setLoading(true);
            const response = await api.get('/api/v1/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUser(response.data);
            if (response.data.profile_pic) {
                setProfilePic(response.data.profile_pic);
                await AsyncStorage.setItem('userProfilePic', response.data.profile_pic);
            }
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            // Assuming 401 means invalid token
            if (error.response && error.response.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (token) => {
        try {
            await setToken(token);
            setAccessToken(token);
            await fetchUserProfile(token);
            router.replace('/(tabs)/dashboard');
        } catch (e) {
            Alert.alert('Login Error', 'Failed to save login session.');
        }
    }, [fetchUserProfile, router]);

    const logout = useCallback(async () => {
        try {
            await removeToken();
            await AsyncStorage.removeItem('userProfilePic');
            setAccessToken(null);
            setUser(null);
            setProfilePic(null);
            router.replace('/(auth)/login');
        } catch (e) {
            console.error('Logout failed', e);
        }
    }, [router]);

    const updateProfilePic = useCallback(async (newPicBase64) => {
        if (newPicBase64) {
            setProfilePic(newPicBase64);
            await AsyncStorage.setItem('userProfilePic', newPicBase64);
        } else {
            setProfilePic(null);
            await AsyncStorage.removeItem('userProfilePic');
        }

        if (accessToken) {
            try {
                await api.patch('/api/v1/users/me',
                    { profile_pic: newPicBase64 },
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
            } catch (error) {
                console.error("Error saving profile picture:", error);
                Alert.alert('Error', 'Failed to save profile picture to server.');
            }
        }
    }, [accessToken]);

    const authContextValue = {
        accessToken,
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!accessToken,
        profilePic,
        updateProfilePic
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
