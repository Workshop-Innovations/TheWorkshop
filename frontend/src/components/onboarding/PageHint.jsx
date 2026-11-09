import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

// Pages must also be listed in ONBOARDING_FLAGS (backend/app/schemas.py) as "hint:<page>"
const HINTS = {
    'past-papers': { title: 'Past Papers', body: 'Filter by exam and subject, then open a paper. Attempt it under timed conditions and submit it to get it marked.' },
    'revision-notes': { title: 'Revision Notes', body: 'Pick a subject to see its topics, then open a topic for a summary you can revise from.' },
    'study-suite': { title: 'Study Suite', body: 'Upload your notes or a document, then chat with the AI tutor about it, quiz yourself or make flashcards.' },
    'community': { title: 'Community', body: 'Pick a channel to start chatting. Find friends, join study groups and check the leaderboard from the sidebars.' },
    'pomodoro': { title: 'Focus Timer', body: 'Press start for a focus session. You can leave this page: the timer keeps running in the corner. Each session counts towards titles and frames.' },
    'tasks': { title: 'Tasks', body: 'Add what you need to study and tick it off as you go.' },
    'progress': { title: 'Progress', body: 'Your focus time and study sessions over time. It fills up as you use the Focus Timer.' },
};

/**
 * A one-time tip shown the first time someone opens a page. Sits in the
 * bottom-left corner on desktop and along the bottom on phones; dismissing
 * it saves to the account so it doesn't come back on another device.
 */
const PageHint = ({ page }) => {
    const { loaded, hasFlag, dismissHint, tourActive, state } = useOnboarding();
    const hint = HINTS[page];

    if (!hint || !loaded || tourActive || !state.welcome_seen || hasFlag(`hint:${page}`)) return null;

    return (
        <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            role="note"
            aria-label={`Tip: ${hint.title}`}
            className="fixed z-[45] left-4 right-4 bottom-4 sm:right-auto sm:left-6 sm:bottom-6 sm:w-96 bg-white border border-slate-200 rounded-md shadow-xl p-4 flex gap-3"
        >
            <span className="w-9 h-9 shrink-0 rounded-md bg-amber-50 text-amber-500 flex items-center justify-center"><Lightbulb size={18} /></span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 mb-0.5">{hint.title}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{hint.body}</p>
                <button onClick={() => dismissHint(page)} className="mt-3 text-sm font-bold text-primary hover:underline">Got it</button>
            </div>
            <button onClick={() => dismissHint(page)} aria-label="Dismiss tip" className="p-1.5 -m-1 h-fit text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
                <X size={16} />
            </button>
        </motion.aside>
    );
};

export default PageHint;
