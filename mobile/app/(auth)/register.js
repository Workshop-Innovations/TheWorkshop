import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!username || !email || !password) {
            Alert.alert("Validation", "Please fill out all fields.");
            return;
        }

        setLoading(true);
        try {
            // Typically backends have a slightly different body for register
            const response = await api.post('/api/v1/auth/register', {
                email,
                username,
                password
            });
            // Try to login automatically, or navigate to login
            Alert.alert("Success", "Account created successfully.", [
                { text: "OK", onPress: () => router.replace('/(auth)/login') }
            ]);
        } catch (err) {
            const msg = err.response?.data?.detail || "Registration failed.";
            Alert.alert("Registration Failed", typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.container}
                >
                    <ScrollView contentContainerStyle={styles.scroll}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join The Workshop today</Text>
                        </View>

                        <View style={styles.form}>
                            <Input
                                label="Username"
                                placeholder="Choose a username"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                            <Input
                                label="Email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                            <Input
                                label="Password"
                                placeholder="Create a secure password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />

                            <Button
                                title="Sign Up"
                                onPress={handleRegister}
                                loading={loading}
                                style={styles.btn}
                            />

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    btn: {
        marginTop: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#64748b',
        fontSize: 14,
    },
    link: {
        color: '#0066FF',
        fontSize: 14,
        fontWeight: '600',
    }
});
