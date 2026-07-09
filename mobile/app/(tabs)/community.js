import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Hash, MessageCircle } from 'lucide-react-native';

const MOCK_COMMUNITIES = [
    { id: '1', name: 'General Discussion', members: 1240, lastActive: '2m ago' },
    { id: '2', name: 'Study Group - Math', members: 532, lastActive: '15m ago' },
    { id: '3', name: 'Project Collaborations', members: 89, lastActive: '1h ago' },
];

export default function Community() {
    const [searchQuery, setSearchQuery] = useState('');

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.communityCard} activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
                <Hash color="#0066FF" size={24} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardStats}>{item.members} members • active {item.lastActive}</Text>
            </View>
            <View style={styles.joinButton}>
                <Text style={styles.joinText}>View</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Communities</Text>
                <TouchableOpacity style={styles.iconButton}>
                    <MessageCircle color="#0f172a" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Search color="#9ca3af" size={20} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search communities..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={MOCK_COMMUNITIES}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16
    },
    title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
    iconButton: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 1
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        marginHorizontal: 24,
        marginBottom: 24,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    searchIcon: { marginRight: 12 },
    searchInput: { flex: 1, fontSize: 16, color: '#0f172a' },

    listContainer: { paddingHorizontal: 24, paddingBottom: 40 },
    communityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1
    },
    avatarContainer: {
        width: 52, height: 52, borderRadius: 16, backgroundColor: '#e0e7ff',
        justifyContent: 'center', alignItems: 'center', marginRight: 16
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
    cardStats: { fontSize: 13, color: '#64748b' },
    joinButton: {
        backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99
    },
    joinText: { color: '#0f172a', fontSize: 13, fontWeight: '600' }
});
