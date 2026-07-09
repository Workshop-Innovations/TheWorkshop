import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Settings, CreditCard, Bell, ChevronRight, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function Profile() {
    const { user, profilePic, logout } = useAuth();

    const MenuItem = ({ icon: Icon, title, onPress, destructive }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.menuIconBox, destructive && { backgroundColor: '#fee2e2' }]}>
                <Icon size={20} color={destructive ? '#ef4444' : '#475569'} />
            </View>
            <Text style={[styles.menuTitle, destructive && { color: '#ef4444' }]}>{title}</Text>
            <ChevronRight size={20} color={destructive ? '#fee2e2' : '#cbd5e1'} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {profilePic ? (
                            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <UserIcon color="#94a3b8" size={32} />
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>{user?.username || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>

                    <TouchableOpacity style={styles.editButton}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.menuCard}>
                        <MenuItem icon={Settings} title="Preferences" />
                        <View style={styles.divider} />
                        <MenuItem icon={Bell} title="Notifications" />
                        <View style={styles.divider} />
                        <MenuItem icon={CreditCard} title="Subscription & Billing" />
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <View style={styles.menuCard}>
                        <MenuItem icon={LogOut} title="Log Out" onPress={logout} destructive />
                    </View>
                </View>

                <Text style={styles.versionText}>The Workshop Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc' },
    container: { padding: 24, paddingBottom: 60 },
    header: { marginBottom: 24, alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },

    profileCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2
    },
    avatarContainer: { marginBottom: 16 },
    avatarImage: { width: 88, height: 88, borderRadius: 44 },
    avatarPlaceholder: {
        width: 88, height: 88, borderRadius: 44, backgroundColor: '#f1f5f9',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed'
    },
    userName: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    userEmail: { fontSize: 14, color: '#64748b', marginBottom: 20 },
    editButton: {
        backgroundColor: '#0066FF',
        paddingHorizontal: 24, paddingVertical: 10, borderRadius: 99
    },
    editButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

    menuSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 },
    menuCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: '#334155' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 68 },
    versionText: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 16 }
});
