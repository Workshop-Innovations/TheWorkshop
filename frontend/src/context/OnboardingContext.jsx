import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import API_BASE_URL from '../config';
import { useAuth } from './AuthContext';

/**
 * New-user walkthrough state, stored on the account so it follows the user
 * between devices: welcome seen, tour completed/skipped, Getting Started
 * checklist (worked out on the server) and which page hints were dismissed.
 */
const OnboardingContext = createContext(null);

export const useOnboarding = () => {
    const ctx = useContext(OnboardingContext);
    if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
    return ctx;
};

export const OnboardingProvider = ({ children }) => {
    const { accessToken, user } = useAuth();
    const [state, setState] = useState(null); // null until loaded
    const [tourActive, setTourActive] = useState(false);
    // The tour opens the mobile nav drawer so it can point at the links inside it
    const [tourWantsMenu, setTourWantsMenu] = useState(false);

    const request = useCallback(async (method, body) => {
        if (!accessToken) return null;
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/users/me/onboarding`, {
                method,
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    ...(body ? { 'Content-Type': 'application/json' } : {}),
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) return null;
            const data = await res.json();
            setState(data);
            return data;
        } catch (err) {
            console.error('Onboarding request failed:', err);
            return null;
        }
    }, [accessToken]);

    const refresh = useCallback(() => request('GET'), [request]);

    // Reload whenever the account changes (login, new profile picture, study goal...)
    useEffect(() => {
        if (!accessToken || !user) {
            setState(null);
            return;
        }
        refresh();
    }, [accessToken, user, refresh]);

    const update = useCallback((patch) => {
        // Optimistic, so dismissing something hides it straight away
        setState((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            for (const key of ['welcome_seen', 'tour_status', 'checklist_dismissed']) {
                if (patch[key] !== undefined) next[key] = patch[key];
            }
            if (patch.add_flags?.length) next.flags = [...new Set([...prev.flags, ...patch.add_flags])];
            return next;
        });
        return request('PATCH', patch);
    }, [request]);

    const hasFlag = useCallback((flag) => !!state?.flags?.includes(flag), [state]);

    const dismissHint = useCallback((page) => update({ add_flags: [`hint:${page}`] }), [update]);

    const markDid = useCallback((action) => {
        if (state && !state.flags.includes(`did:${action}`)) update({ add_flags: [`did:${action}`] });
    }, [state, update]);

    const startTour = useCallback(() => setTourActive(true), []);

    const endTour = useCallback((status) => {
        setTourActive(false);
        setTourWantsMenu(false);
        update({ tour_status: status });
    }, [update]);

    // "Take the tour again": page hints come back too
    const replayTour = useCallback(async () => {
        await request('PATCH', { reset: true, checklist_dismissed: false });
        setTourActive(true);
    }, [request]);

    const value = {
        state,
        loaded: !!state,
        tourActive,
        tourWantsMenu,
        setTourWantsMenu,
        update,
        refresh,
        hasFlag,
        dismissHint,
        markDid,
        startTour,
        endTour,
        replayTour,
    };

    return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};
