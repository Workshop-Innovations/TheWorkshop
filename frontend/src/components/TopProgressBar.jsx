import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopProgressBar
 * A thin, animated progress bar at the very top of the viewport that fires on
 * every route change. Purely CSS-driven — no overlay, no spinner, no blocking UI.
 */
const TopProgressBar = () => {
    const location = useLocation();
    const [visible, setVisible] = useState(false);
    const [width, setWidth] = useState(0);
    const timerRef = useRef(null);
    const completeRef = useRef(null);

    useEffect(() => {
        // Clear any running timers
        clearTimeout(timerRef.current);
        clearTimeout(completeRef.current);

        // Start: snap to 5% then animate to ~85%
        setWidth(5);
        setVisible(true);

        timerRef.current = setTimeout(() => setWidth(75), 80);

        // Complete: shoot to 100%, then fade out
        completeRef.current = setTimeout(() => {
            setWidth(100);
            setTimeout(() => {
                setVisible(false);
                setWidth(0);
            }, 300);
        }, 500);

        return () => {
            clearTimeout(timerRef.current);
            clearTimeout(completeRef.current);
        };
    }, [location.pathname]);

    if (!visible && width === 0) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
            aria-hidden="true"
        >
            <div
                style={{
                    width: `${width}%`,
                    transition: width === 5
                        ? 'width 80ms ease-out'
                        : width === 75
                        ? 'width 400ms cubic-bezier(0.1, 0.5, 0.5, 1)'
                        : 'width 200ms ease-in',
                    opacity: visible ? 1 : 0,
                    transitionProperty: 'width, opacity',
                }}
                className="h-full bg-primary"
            />
        </div>
    );
};

export default TopProgressBar;
