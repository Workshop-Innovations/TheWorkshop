import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Target, BookOpen, Clock, Bot, MessageSquare, Check, ChevronDown, ChevronRight, X, PartyPopper, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { STUDY_GOALS } from '../../constants/studyGoals';
import ImageUploaderModal from '../ImageUploaderModal';

// Ids match the checklist computed in backend/app/routes/users.py (_onboarding_state)
const ITEMS = [
    { id: 'photo', icon: Camera, label: 'Upload a profile picture', hint: 'Needed to join Community chat' },
    { id: 'goal', icon: Target, label: 'Choose your study goal', hint: 'So we can point you to the right material' },
    { id: 'paper', icon: BookOpen, label: 'Open a past paper', hint: 'Practise under real exam conditions', to: '/past-papers' },
    { id: 'focus', icon: Clock, label: 'Finish a focus session', hint: 'One Pomodoro on the Focus Timer', to: '/pomodoro' },
    { id: 'tutor', icon: Bot, label: 'Ask the AI tutor a question', hint: 'In the Study Suite (tablet or laptop)', to: '/study-suite' },
    { id: 'community', icon: MessageSquare, label: 'Say hi in Community', hint: 'Send your first message', to: '/community' },
];

/** Dashboard checklist that stays until every step is done or the user hides it. */
const GettingStartedCard = () => {
    const { updateProfilePic, updateUser } = useAuth();
    const { state, update, refresh } = useOnboarding();
    const [open, setOpen] = useState(true);
    const [uploaderOpen, setUploaderOpen] = useState(false);
    const [pickingGoal, setPickingGoal] = useState(false);
    const [busy, setBusy] = useState(null);

    if (!state || state.checklist_dismissed) return null;

    const checklist = state.checklist || {};
    const doneCount = ITEMS.filter((i) => checklist[i.id]).length;
    const allDone = doneCount === ITEMS.length;
    const dismiss = () => update({ checklist_dismissed: true });

    const savePhoto = async (image) => {
        setBusy('photo');
        await updateProfilePic(image);
        await refresh();
        setBusy(null);
    };

    const saveGoal = async (goal) => {
        setBusy('goal');
        if (await updateUser({ study_goal: goal })) setPickingGoal(false);
        setBusy(null);
    };

    return (
        <section data-tour="checklist" aria-labelledby="getting-started-title" className="md:col-span-12 bg-white rounded-md border border-slate-100/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 p-6 sm:px-8">
                <button
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="getting-started-list"
                    className="flex-1 min-w-0 flex items-center gap-4 text-left"
                >
                    <ProgressRing done={doneCount} total={ITEMS.length} />
                    <div className="min-w-0">
                        <h2 id="getting-started-title" className="text-lg font-extrabold text-slate-900 tracking-tight">
                            {allDone ? "You're all set up" : 'Getting started'}
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                            {allDone ? 'Nice work. You know your way around now.' : `${doneCount} of ${ITEMS.length} done`}
                        </p>
                    </div>
                    <ChevronDown size={20} className={`ml-auto shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={dismiss} aria-label="Hide Getting Started" title="Hide" className="p-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 shrink-0">
                    <X size={18} />
                </button>
            </div>

            {open && (
                <div id="getting-started-list" className="border-t border-slate-100">
                    {allDone ? (
                        <div className="p-6 sm:px-8 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                            <PartyPopper className="text-accent shrink-0" size={28} />
                            <p className="text-sm text-slate-600 font-medium flex-1">Every step is done. You can replay the tour from your profile any time.</p>
                            <button onClick={dismiss} className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90">Hide this</button>
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-slate-100">
                            {ITEMS.map((item) => {
                                const done = !!checklist[item.id];
                                const content = <ItemRow item={item} done={done} busy={busy === item.id} />;
                                const rowClass = 'w-full h-full text-left block p-4 sm:px-8 bg-white transition-colors';

                                if (done) return <li key={item.id} className={rowClass}>{content}</li>;
                                if (item.to) return <li key={item.id} className="bg-white"><Link to={item.to} className={`${rowClass} hover:bg-slate-50`}>{content}</Link></li>;
                                if (item.id === 'goal' && pickingGoal) {
                                    return (
                                        <li key={item.id} className={rowClass}>
                                            <p className="text-sm font-bold text-slate-800 mb-3">What are you studying for?</p>
                                            <div className="flex flex-wrap gap-2">
                                                {STUDY_GOALS.map((g) => (
                                                    <button key={g.id} disabled={!!busy} onClick={() => saveGoal(g.id)} className="px-3 py-2 text-xs font-bold rounded-md border border-slate-200 hover:border-primary hover:text-primary disabled:opacity-50">
                                                        {g.label}
                                                    </button>
                                                ))}
                                                {busy === 'goal' && <Loader2 size={16} className="animate-spin text-slate-400 self-center" />}
                                            </div>
                                        </li>
                                    );
                                }
                                const onClick = item.id === 'photo' ? () => setUploaderOpen(true) : () => setPickingGoal(true);
                                return <li key={item.id} className="bg-white"><button onClick={onClick} className={`${rowClass} hover:bg-slate-50`}>{content}</button></li>;
                            })}
                        </ul>
                    )}
                </div>
            )}

            <ImageUploaderModal isOpen={uploaderOpen} onClose={() => setUploaderOpen(false)} onSave={savePhoto} />
        </section>
    );
};

const ItemRow = ({ item, done, busy }) => {
    const Icon = item.icon;
    return (
        <span className="flex items-center gap-4">
            <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${done ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : done ? <Check size={18} strokeWidth={3} /> : <Icon size={16} />}
            </span>
            <span className="min-w-0 flex-1">
                <span className={`block text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.label}</span>
                {!done && <span className="block text-xs text-slate-500">{item.hint}</span>}
            </span>
            {!done && <ChevronRight size={16} className="text-slate-300 shrink-0" />}
            <span className="sr-only">{done ? '(done)' : '(not done yet)'}</span>
        </span>
    );
};

const ProgressRing = ({ done, total }) => {
    const r = 18;
    const c = 2 * Math.PI * r;
    return (
        <span className="relative w-12 h-12 shrink-0" aria-hidden="true">
            <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
                <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-slate-100" />
                <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-accent transition-all duration-500"
                    strokeDasharray={c} strokeDashoffset={c * (1 - done / total)} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700">{done}/{total}</span>
        </span>
    );
};

export default GettingStartedCard;
