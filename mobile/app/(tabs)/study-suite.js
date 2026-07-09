import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react-native';
import Button from '../../src/components/ui/Button';

export default function StudySuite() {
    // Simple Pomodoro State
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [mode, setMode] = useState('focus'); // focus, shortBreak, longBreak

    useEffect(() => {
        let timer;
        if (isRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
            // Logic for switching modes could go here
        }
        return () => clearInterval(timer);
    }, [isRunning, timeLeft]);

    const toggleTimer = () => setIsRunning(!isRunning);

    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(mode === 'focus' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60);
    };

    const setTimerMode = (newMode) => {
        setIsRunning(false);
        setMode(newMode);
        setTimeLeft(newMode === 'focus' ? 25 * 60 : newMode === 'shortBreak' ? 5 * 60 : 15 * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Study Suite</Text>
                    <Text style={styles.subtitle}>Pomodoro Timer</Text>
                </View>

                <View style={styles.modeTabs}>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'focus' && styles.activeTab]}
                        onPress={() => setTimerMode('focus')}
                    >
                        <Briefcase size={16} color={mode === 'focus' ? '#fff' : '#64748b'} style={styles.tabIcon} />
                        <Text style={[styles.tabText, mode === 'focus' && styles.activeTabText]}>Focus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'shortBreak' && styles.activeTab]}
                        onPress={() => setTimerMode('shortBreak')}
                    >
                        <Coffee size={16} color={mode === 'shortBreak' ? '#fff' : '#64748b'} style={styles.tabIcon} />
                        <Text style={[styles.tabText, mode === 'shortBreak' && styles.activeTabText]}>Short Break</Text>
                    </TouchableOpacity>
                </View>

                <View style={[
                    styles.timerCircle,
                    mode === 'shortBreak' && styles.timerCircleBreak
                ]}>
                    <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.modeText}>
                        {mode === 'focus' ? 'Stay Focused' : 'Take a breather'}
                    </Text>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.iconButton} onPress={resetTimer}>
                        <RotateCcw size={24} color="#64748b" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.playButton} onPress={toggleTimer}>
                        {isRunning ? (
                            <Pause size={32} color="#fff" fill="#fff" />
                        ) : (
                            <Play size={32} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
                        )}
                    </TouchableOpacity>

                    <View style={[styles.iconButton, { opacity: 0 }]} />
                </View>

                <View style={styles.sessionStats}>
                    <Text style={styles.statsTitle}>Today's Sessions</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Pomodoros</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>0h 0m</Text>
                            <Text style={styles.statLabel}>Focus Time</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc' },
    container: { padding: 24, paddingBottom: 40, alignItems: 'center' },
    header: { alignItems: 'center', marginBottom: 32, width: '100%' },
    title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
    subtitle: { fontSize: 15, color: '#64748b' },

    modeTabs: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 99,
        padding: 6,
        marginBottom: 48,
        width: '100%',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 99,
    },
    activeTab: { backgroundColor: '#0066FF', shadowColor: '#0066FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    tabIcon: { marginRight: 6 },
    tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    activeTabText: { color: '#ffffff' },

    timerCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 8,
        borderColor: '#0066FF',
        marginBottom: 48,
        shadowColor: '#0066FF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    timerCircleBreak: { borderColor: '#10b981', shadowColor: '#10b981' },
    timeText: { fontSize: 64, fontWeight: '800', color: '#0f172a', letterSpacing: 2 },
    modeText: { fontSize: 16, color: '#64748b', marginTop: 8, fontWeight: '500' },

    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 48 },
    playButton: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: '#0066FF',
        justifyContent: 'center', alignItems: 'center', marginHorizontal: 32,
        shadowColor: '#0066FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6
    },
    iconButton: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffffff',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2
    },

    sessionStats: { width: '100%', backgroundColor: '#ffffff', borderRadius: 16, padding: 20 },
    statsTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 4 },
    statNumber: { fontSize: 20, fontWeight: '700', color: '#0066FF', marginBottom: 4 },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' }
});
