import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

/*
 * Spotlight tour over the real UI. Each step points at an element marked
 * data-tour="<target>". The navbar has the same targets in its desktop bar
 * and its mobile drawer; the tour uses whichever one is visible, and on small
 * screens opens the drawer for the nav steps.
 */
const ALL_STEPS = [
    { target: 'nav-menu', mobileOnly: true, title: 'Your menu', body: 'Everything in The Workshop is in this menu. Let\'s go through it.' },
    { target: 'nav-dashboard', nav: true, title: 'Dashboard', body: 'Your home base: your stats, focus time and your Getting Started checklist.' },
    { target: 'nav-past-papers', nav: true, title: 'Past Papers', body: 'Real JAMB, WAEC and NECO papers. Attempt one under timed conditions and get it marked.' },
    { target: 'nav-revision-notes', nav: true, title: 'Revision Notes', body: 'Topic-by-topic notes for each of your subjects.' },
    { target: 'nav-study-suite', nav: true, title: 'Study Suite', body: 'Ask the AI tutor about your notes, quiz yourself and make flashcards. Works on tablets and laptops.' },
    { target: 'nav-community', nav: true, title: 'Community', body: 'Chat with other students, join study groups, share notes and climb the leaderboard.' },
    { target: 'nav-pomodoro', nav: true, title: 'Focus Timer', body: 'Start a Pomodoro session. It keeps running in the corner while you use the rest of the app, and every session counts towards rewards.' },
    { target: 'nav-more', nav: true, title: 'Tasks, Progress & Rewards', body: 'Plan your study with Tasks, see your stats in Progress, unlock titles and frames in Rewards, and send us Feedback.' },
    { target: 'nav-profile', nav: true, title: 'Your profile', body: 'Change your photo and details here. You can also replay this tour from your profile.' },
    { target: 'checklist', title: 'Getting Started', body: 'Tick these off to finish setting up. Each one takes you straight to the right place.' },
];

const DESKTOP_QUERY = '(min-width: 1280px)'; // matches the navbar's xl breakpoint
const PAD = 6;
const CARD_WIDTH = 320;
const GAP = 12;

const findVisible = (target) => {
    for (const el of document.querySelectorAll(`[data-tour="${target}"]`)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return el;
    }
    return null;
};

const Tour = () => {
    const { tourActive, endTour, setTourWantsMenu } = useOnboarding();
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState(null);
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
    const cardRef = useRef(null);

    useEffect(() => {
        const mq = window.matchMedia(DESKTOP_QUERY);
        const onChange = (e) => setIsDesktop(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Steps are chosen once the tour starts (after render, so the DOM is up to date):
    // skip the checklist step if the checklist isn't on the page
    const [steps, setSteps] = useState([]);
    useEffect(() => {
        if (!tourActive) { setSteps([]); return; }
        setSteps(ALL_STEPS.filter((s) =>
            (!s.mobileOnly || !isDesktop) &&
            (s.target !== 'checklist' || document.querySelector('[data-tour="checklist"]'))
        ));
    }, [tourActive, isDesktop]);

    useEffect(() => { if (tourActive) setIndex(0); }, [tourActive]);

    const step = steps[index];

    // Open the mobile drawer for nav steps, close it otherwise
    useEffect(() => {
        if (!step) return;
        setTourWantsMenu(!isDesktop && !!step.nav);
    }, [step, isDesktop, setTourWantsMenu]);

    // Bring the target into view, then follow it every frame (it may be animating in)
    useEffect(() => {
        if (!step) return;
        let frame;
        let scrolled = false;
        const track = () => {
            const el = findVisible(step.target);
            if (el && !scrolled) {
                el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                scrolled = true;
            }
            const r = el?.getBoundingClientRect();
            setRect((prev) => {
                if (!r) return prev === null ? prev : null;
                if (prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height) return prev;
                return { top: r.top, left: r.left, width: r.width, height: r.height };
            });
            frame = requestAnimationFrame(track);
        };
        track();
        return () => cancelAnimationFrame(frame);
    }, [step]);

    useLayoutEffect(() => { cardRef.current?.focus(); }, [index, steps]);

    const isLast = index === steps.length - 1;
    const next = useCallback(() => (isLast ? endTour('completed') : setIndex((i) => i + 1)), [isLast, endTour]);
    const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
    const skip = useCallback(() => endTour('skipped'), [endTour]);

    useEffect(() => {
        if (!tourActive) return;
        const onKey = (e) => {
            if (e.key === 'Escape') skip();
            else if (e.key === 'ArrowRight') next();
            else if (e.key === 'ArrowLeft') back();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [tourActive, next, back, skip]);

    if (!tourActive || !step) return null;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const compact = vw < 640;

    // Where the explanation card goes
    let cardStyle;
    if (!rect) {
        cardStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: Math.min(CARD_WIDTH, vw - 32) };
    } else if (compact) {
        // Phones: a sheet on whichever half of the screen the target isn't in
        const targetInTopHalf = rect.top + rect.height / 2 < vh / 2;
        cardStyle = targetInTopHalf ? { left: 16, right: 16, bottom: 16 } : { left: 16, right: 16, top: 16 };
    } else {
        const width = Math.min(CARD_WIDTH, vw - 32);
        const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), vw - width - 16);
        const below = rect.top + rect.height + PAD + GAP;
        cardStyle = below + 200 < vh
            ? { top: below, left, width }
            : { bottom: vh - rect.top + PAD + GAP, left, width };
    }

    return (
        <>
            {/* Swallows clicks so the page can't be used mid-tour */}
            <div className="fixed inset-0 z-[70]" onClick={(e) => e.stopPropagation()} />

            {rect ? (
                <div
                    aria-hidden="true"
                    className="fixed z-[71] rounded-md pointer-events-none transition-all duration-200 ring-2 ring-white/80"
                    style={{
                        top: rect.top - PAD,
                        left: rect.left - PAD,
                        width: rect.width + PAD * 2,
                        height: rect.height + PAD * 2,
                        boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)',
                    }}
                />
            ) : (
                <div aria-hidden="true" className="fixed inset-0 z-[71] bg-slate-900/60 pointer-events-none" />
            )}

            <div
                ref={cardRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="tour-title"
                aria-describedby="tour-body"
                className="fixed z-[72] bg-white rounded-md shadow-2xl border border-slate-100 p-5 outline-none"
                style={cardStyle}
            >
                <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] pt-1">
                        {index + 1} of {steps.length}
                    </p>
                    <button onClick={skip} aria-label="End tour" className="p-1.5 -mr-1.5 -mt-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
                        <X size={16} />
                    </button>
                </div>
                <h3 id="tour-title" className="text-lg font-extrabold text-slate-900 tracking-tight mb-1">{step.title}</h3>
                <p id="tour-body" className="text-sm text-slate-600 leading-relaxed mb-5">{step.body}</p>
                <div className="flex items-center justify-between gap-3">
                    <button onClick={skip} className="text-sm font-semibold text-slate-400 hover:text-slate-700">Skip tour</button>
                    <div className="flex gap-2">
                        {index > 0 && (
                            <button onClick={back} aria-label="Previous step" className="p-2.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <button onClick={next} className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90">
                            {isLast ? 'Done' : <>Next <ArrowRight size={16} /></>}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Tour;
