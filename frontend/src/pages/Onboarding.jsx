import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, BookOpen, Target, GraduationCap, MoreHorizontal, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { PLANS, formatPrice } from './Pricing';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/progressService';

const STUDY_GOALS = [
    { id: 'jamb', label: 'JAMB / UTME', description: 'Joint Admissions & Matriculation', icon: Target },
    { id: 'waec', label: 'WAEC / SSCE', description: 'West African Senior Certificate', icon: BookOpen },
    { id: 'uni', label: 'University Exams', description: 'Undergraduate coursework & tests', icon: GraduationCap },
    { id: 'other', label: 'General Study', description: 'General learning & revision', icon: MoreHorizontal },
];

const STEPS = ['Goals', 'Account', 'Plan'];

const StepIndicator = ({ current }) => (
    <div className="flex items-center gap-0 mb-16">
        {STEPS.map((label, i) => {
            const num = i + 1;
            const isActive = num === current;
            const isDone = num < current;
            return (
                <React.Fragment key={label}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${isDone ? 'bg-primary text-white' :
                                isActive ? 'bg-slate-900 text-white' :
                                    'bg-slate-100 text-slate-400'
                            }`}>
                            {isDone ? <Check size={14} /> : num}
                        </div>
                        <span className={`text-sm font-semibold hidden sm:block ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                            {label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-4 transition-all ${num < current ? 'bg-primary' : 'bg-slate-200'}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

const InputField = ({ label, type = 'text', value, onChange, placeholder, required }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-3 border border-slate-200 rounded-md bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition-all"
        />
    </div>
);

const OnboardingPlanCard = ({ plan, onSelect, loading }) => {
    const isBasic = plan.id === 'basic';
    return (
        <div className={`relative flex flex-col rounded-md border bg-white p-6 transition-all ${plan.popular
                ? 'border-primary shadow-lg shadow-primary/10'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}>
            {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-md whitespace-nowrap">
                        {plan.badge}
                    </span>
                </div>
            )}

            <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{plan.description}</p>
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(plan.price)}</span>
                    {!isBasic && <span className="text-slate-400 text-sm font-medium">/mo</span>}
                </div>
            </div>

            <ul className="space-y-2.5 mb-8 flex-grow">
                {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                    </li>
                ))}
                {plan.features.length > 4 && (
                    <li className="text-xs text-slate-400 font-medium pl-6">+{plan.features.length - 4} more</li>
                )}
            </ul>

            <button
                onClick={() => onSelect(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 ${plan.popular
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
            >
                {loading === plan.id ? <Loader2 size={16} className="animate-spin" /> : (isBasic ? 'Start Free' : 'Select Plan')}
            </button>
        </div>
    );
};

const Onboarding = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, isAuthenticated } = useAuth();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [studyGoal, setStudyGoal] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [authToken, setAuthToken] = useState(null);

    useEffect(() => {
        const preselectedPlan = searchParams.get('plan');
        if (preselectedPlan && isAuthenticated) {
            navigate('/pricing');
        }
    }, [searchParams, isAuthenticated, navigate]);

    const handleQuestionSubmit = (e) => {
        e.preventDefault();
        if (!studyGoal) { toast.error('Please select your main study goal.'); return; }
        setStep(2);
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }

        try {
            setLoading(true);
            await axios.post(`${API_BASE_URL}/api/v1/auth/register`, { username, email, password, study_goal: studyGoal });
            const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, { username, password });

            if (loginResponse.data.access_token) {
                const token = loginResponse.data.access_token;
                setAuthToken(token);
                localStorage.setItem('accessToken', token);
                toast.success('Account created!');
                setStep(3);
            } else {
                toast.error('Login failed after registration.');
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const detail = err.response.data.detail;
                const message = Array.isArray(detail)
                    ? detail.map((d) => d.msg || JSON.stringify(d)).join(' | ')
                    : typeof detail === 'string' ? detail : 'Registration failed.';
                toast.error(message);
            } else {
                toast.error('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelection = async (planId) => {
        if (planId === 'basic') { login(authToken); return; }

        setLoading(planId);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                body: JSON.stringify({ plan: planId }),
            });
            const data = await response.json();
            if (!response.ok) { toast.error(data.detail || 'Failed to start checkout.'); setLoading(false); return; }
            window.location.href = data.authorization_url;
        } catch {
            toast.error('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Minimal header */}
            <header className="border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5">
                    <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
                    <span className="text-lg font-black tracking-tighter text-slate-900">
                        Work<span className="text-primary">Shop</span>
                    </span>
                </Link>
                <span className="text-sm text-slate-400 font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-slate-900 font-semibold hover:underline">Sign in</Link>
                </span>
            </header>

            <main className="flex-grow flex items-start justify-center px-6 py-16">
                {step < 3 ? (
                    /* Narrow centered form for steps 1 and 2 */
                    <div className="w-full max-w-lg">
                        <StepIndicator current={step} />

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">What are you studying for?</h1>
                                    <p className="text-slate-500 font-medium mb-10">This helps us personalise your experience.</p>

                                    <form onSubmit={handleQuestionSubmit} className="space-y-3">
                                        {STUDY_GOALS.map((goal) => {
                                            const Icon = goal.icon;
                                            const isSelected = studyGoal === goal.id;
                                            return (
                                                <label key={goal.id} className={`flex items-center gap-4 p-4 border rounded-md cursor-pointer transition-all ${isSelected ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                                                    }`}>
                                                    <input type="radio" name="studyGoal" value={goal.id} checked={isSelected} onChange={(e) => setStudyGoal(e.target.value)} className="sr-only" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{goal.label}</p>
                                                        <p className="text-xs text-slate-400 font-medium mt-0.5">{goal.description}</p>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-slate-900 bg-slate-900' : 'border-slate-300'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                                    </div>
                                                </label>
                                            );
                                        })}

                                        <div className="pt-4">
                                            <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-95">
                                                Continue <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create your account</h1>
                                    <p className="text-slate-500 font-medium mb-10">Your progress will be saved and synced across devices.</p>

                                    <form onSubmit={handleSignupSubmit} className="space-y-5">
                                        <InputField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. john_doe" required />
                                        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                                        <InputField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
                                        <InputField label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required />

                                        <div className="pt-2 space-y-3">
                                            <button type="submit" disabled={loading} className="w-full py-3.5 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95">
                                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                                            </button>
                                            <button type="button" onClick={() => setStep(1)} className="w-full py-3 text-slate-500 text-sm font-semibold hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5">
                                                <ArrowLeft size={14} /> Back
                                            </button>
                                        </div>
                                    </form>

                                    <p className="text-center text-xs text-slate-400 font-medium mt-8">
                                        By creating an account, you agree to our{' '}
                                        <span className="underline cursor-pointer hover:text-slate-600">Terms of Service</span> and{' '}
                                        <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    /* Full-width plan selection for step 3 */
                    <motion.div key="step3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full max-w-6xl">
                        <StepIndicator current={step} />

                        <div className="text-center mb-12">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Choose your plan</h1>
                            <p className="text-slate-500 font-medium">Start free and upgrade anytime. No hidden fees.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                            {PLANS.map((plan) => (
                                <OnboardingPlanCard key={plan.id} plan={plan} onSelect={handlePlanSelection} loading={loading} />
                            ))}
                        </div>

                        <p className="text-center text-xs text-slate-400 font-medium mt-8">
                            You can always change your plan from your account settings.
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
};

export default Onboarding;
