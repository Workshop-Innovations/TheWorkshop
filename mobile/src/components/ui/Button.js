import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style
}) {
    const getBackgroundColor = () => {
        if (disabled) return '#e5e7eb';
        switch (variant) {
            case 'primary': return '#0066FF';
            case 'secondary': return '#f3f4f6';
            case 'outline': return 'transparent';
            default: return '#0066FF';
        }
    };

    const getTextColor = () => {
        if (disabled) return '#9ca3af';
        switch (variant) {
            case 'primary': return '#ffffff';
            case 'secondary': return '#1f2937';
            case 'outline': return '#0066FF';
            default: return '#ffffff';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                variant === 'outline' && styles.outline,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        width: '100%',
    },
    outline: {
        borderWidth: 1.5,
        borderColor: '#0066FF',
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
