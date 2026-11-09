import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, GraduationCap, Bot, Users, Clock, ListChecks, Camera, ArrowRight, Compass, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { STUDY_GOALS } from '../../constants/studyGoals';
import ImageUploaderModal from '../ImageUploaderModal';

const FEATURES = [
    { icon: BookOpen, title: 'Past Papers', desc: 'Practise real exam papers and get them marked.' },
    { icon: GraduationCap, title: 'Revision Notes', desc: 'Topic-by-topic notes for every subject.' },
    { icon: Bot, title: 'Study Suite', desc: 'AI tutor, quizzes and flashcards.' },
    { icon: Users, title: 'Community', desc: 'Chat, study groups and the leaderboard.' },
    { icon: Clock, title: 'Focus Timer', desc: 'Pomodoro sessions that earn you rewards.' },
    { icon: ListChecks, title: 'Tasks & Progress', desc: 'Plan your study and watch it add up.' },
];

/**
 * One-time welcome shown on a new account's first dashboard visit:
 * what's in the app, then anything missing from their profile (study goal,
 * photo), then the option of a guided tour. Every step can be skipped.
 */
const WelcomeModal = () => {
    const { user, profilePic, updateProfilePic, updateUser } = useAuth();
    const { update, refresh, startTour } = useOnboarding();

    // Fixed when the modal opens, so filling a step in doesn't remove it mid-flow
    const [steps] = useState(() => [
        'welcome',
        ...(!user?.study_goal ? ['goal'] : []),
        ...(!profilePic ? ['photo'] : []),
        'tour',
    ]);
    const [index, setIndex] = useState(0);
    const [goal, setGoal] = useState(user?.study_goal || '');
    const [saving, setSaving] = useState(false);
    const [uploaderOpen, setUploaderOpen] = useState(false);

    const step = steps[index];
    const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));

    const finish = ({ takeTour = false } = {}) => {
        update({ welcome_seen: true, ...(takeTour ? {} : { tour_status: 'skipped' }) });
        if (takeTour) startTour();
    };

    const saveGoal = async () => {
        if (!goal) return next();
        setSaving(true);
        const ok = await updateUser({ study_goal: goal });
        setSaving(false);
        if (ok) next();
    };

    const savePhoto = async (image) => {
        setSaving(true);
        await updateProfilePic(image);
        await refresh();
        setSaving(false);
    };

    const firstName = user?.username || 'there';

    return (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-white w-full sm:max-w-2xl rounded-t-xl sm:rounded-md shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
            >
                {/* Header: progress dots + close */}
                <div className="flex items-center justify-between px-6 pt-5">
                    <div className="flex gap-1.5" aria-label={`Step ${index + 1} of ${steps.length}`}>
                        {steps.map((s, i) => (
                            <span key={s} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-primary' : i < index ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-slate-200'}`} />
                        ))}
                    </div>
                    <button onClick={() => finish()} aria-label="Close welcome" className="p-2 -mr-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 sm:px-10 pb-8 pt-2 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                            {step === 'welcome' && (
                                <>
                                    <h2 id="welcome-title" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 mb-2">
                                        Welcome to The Workshop, <span className="text-primary">{firstName}</span>
                                    </h2>
                                    <p className="text-slate-500 font-medium mb-6">Here's what you can do here.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                        {FEATURES.map(({ icon: Icon, title, desc }) => (
                                            <div key={title} className="flex items-start gap-3 p-3 rounded-md border border-slate-100 bg-slate-50/60">
                                                <span className="w-9 h-9 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Icon size={18} /></span>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{title}</p>
                                                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <PrimaryButton onClick={next}>Let's get you set up <ArrowRight size={18} /></PrimaryButton>
                                </>
                            )}

                            {step === 'goal' && (
                                <>
                                    <h2 id="welcome-title" className="text-2xl font-black text-slate-900 tracking-tight mt-2 mb-2">What are you studying for?</h2>
                                    <p className="text-slate-500 font-medium mb-6">We'll use this to point you to the right papers and notes.</p>
                                    <div className="space-y-2.5 mb-8">
                                        {STUDY_GOALS.map(({ id, label, description, icon: Icon }) => (
                                            <label key={id} className={`flex items-center gap-4 p-4 border rounded-md cursor-pointer transition-all ${goal === id ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'}`}>
                                                <input type="radio" name="welcome-goal" value={id} checked={goal === id} onChange={() => setGoal(id)} className="sr-only" />
                                                <Icon size={20} className={goal === id ? 'text-slate-900' : 'text-slate-400'} />
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{label}</p>
                                                    <p className="text-xs text-slate-500">{description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <PrimaryButton onClick={saveGoal} disabled={saving}>
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                                    </PrimaryButton>
                                    <SkipButton onClick={next} />
                                </>
                            )}

                            {step === 'photo' && (
                                <div className="text-center">
                                    <h2 id="welcome-title" className="text-2xl font-black text-slate-900 tracking-tight mt-2 mb-2">Put a face to your name</h2>
                                    <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                                        Your photo shows up in Community, study groups and on the leaderboard. You'll need one to join the chat.
                                    </p>
                                    <button
                                        onClick={() => setUploaderOpen(true)}
                                        className="relative w-32 h-32 mx-auto mb-8 rounded-full overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors"
                                        aria-label="Choose a profile photo"
                                    >
                                        {saving ? <Loader2 className="animate-spin" /> : profilePic ? <img src={profilePic} alt="Your profile" className="w-full h-full object-cover" /> : <Camera size={36} />}
                                    </button>
                                    {profilePic ? (
                                        <PrimaryButton onClick={next}>Looks good <ArrowRight size={18} /></PrimaryButton>
                                    ) : (
                                        <>
                                            <PrimaryButton onClick={() => setUploaderOpen(true)} disabled={saving}>
                                                <Camera size={18} /> Upload a photo
                                            </PrimaryButton>
                                            <SkipButton onClick={next} />
                                        </>
                                    )}
                                    <ImageUploaderModal isOpen={uploaderOpen} onClose={() => setUploaderOpen(false)} onSave={savePhoto} />
                                </div>
                            )}

                            {step === 'tour' && (
                                <div className="text-center">
                                    <span className="w-16 h-16 mx-auto mt-2 mb-6 rounded-full bg-accent/10 text-accent flex items-center justify-center"><Compass size={30} /></span>
                                    <h2 id="welcome-title" className="text-2xl font-black text-slate-900 tracking-tight mb-2">You're all set</h2>
                                    <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">
                                        Want a 30-second tour of where everything is? You can replay it any time from your profile.
                                    </p>
                                    <PrimaryButton onClick={() => finish({ takeTour: true })}>Show me around <ArrowRight size={18} /></PrimaryButton>
                                    <SkipButton onClick={() => finish()}>I'll explore on my own</SkipButton>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

const PrimaryButton = ({ children, ...props }) => (
    <button {...props} className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-60">
        {children}
    </button>
);

const SkipButton = ({ children = 'Skip for now', ...props }) => (
    <button {...props} className="w-full mt-2 py-3 text-sm font-semibold text-slate-500 hover:text-slate-800">
        {children}
    </button>
);

export default WelcomeModal;
