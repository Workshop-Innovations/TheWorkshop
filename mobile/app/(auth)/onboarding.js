import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Rocket, Sparkles, Target } from 'lucide-react-native';
import Button from '../../src/components/ui/Button';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Welcome to The Workshop',
        description: 'Your ultimate hub for focused studying, collaboration, and unlocking your true productivity potential.',
        icon: Rocket,
        color: '#E0E7FF',
        iconColor: '#4F46E5',
    },
    {
        id: '2',
        title: 'Master Your Time',
        description: 'Leverage our integrated Pomodoro timers and smart task tracking to destroy procrastination and get things done.',
        icon: Target,
        color: '#FEF08A',
        iconColor: '#CA8A04',
    },
    {
        id: '3',
        title: 'Learn Together',
        description: 'Join dynamic study communities, share resources, and connect with peers who share your goals.',
        icon: Sparkles,
        color: '#D1FAE5',
        iconColor: '#059669',
    }
];

export default function Onboarding() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef(null);

    const viewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems && viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
        } else {
            router.replace('/(auth)/login');
        }
    };

    const handleSkip = () => {
        router.replace('/(auth)/login');
    };

    const MemoizedSlide = React.memo(({ item }) => {
        const IconComponent = item.icon;
        return (
            <View style={styles.slide}>
                <View style={[styles.imageContainer, { backgroundColor: item.color }]}>
                    <IconComponent size={width * 0.3} color={item.iconColor} strokeWidth={1.5} />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
        );
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.skipHeader}>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 3 }}>
                <Animated.ScrollView
                    ref={slidesRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    scrollEventThrottle={32}
                    onMomentumScrollEnd={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.x / width);
                        setCurrentIndex(index);
                    }}
                >
                    {SLIDES.map((item) => (
                        <MemoizedSlide key={item.id} item={item} />
                    ))}
                </Animated.ScrollView>
            </View>

            <Paginator SLIDES={SLIDES} scrollX={scrollX} />

            <View style={styles.footer}>
                <Button
                    title={currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
                    onPress={handleNext}
                />
            </View>
        </SafeAreaView>
    );
}

function Paginator({ SLIDES, scrollX }) {
    return (
        <View style={styles.paginatorContainer}>
            {SLIDES.map((_, i) => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [10, 24, 10],
                    extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                const backgroundColor = scrollX.interpolate({
                    inputRange,
                    outputRange: ['#cbd5e1', '#0066FF', '#cbd5e1'],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        style={[styles.dot, { width: dotWidth, opacity, backgroundColor }]}
                        key={i.toString()}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    skipHeader: {
        paddingHorizontal: 24,
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        zIndex: 10,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
    },
    slide: {
        width,
        alignItems: 'center',
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    imageContainer: {
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: width * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 48,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
    },
    title: {
        fontWeight: '800',
        fontSize: 28,
        marginBottom: 16,
        color: '#0f172a',
        textAlign: 'center',
    },
    description: {
        fontWeight: '400',
        color: '#64748b',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 24,
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 10,
        borderRadius: 5,
        marginHorizontal: 6,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    }
});
