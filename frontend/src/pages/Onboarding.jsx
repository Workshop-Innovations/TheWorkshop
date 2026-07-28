import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, BookOpen, Target, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { PLANS, formatPrice } from './Pricing';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../services/progressService';

const Onboarding = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, isAuthenticated } = useAuth();
    
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Step 1: Questions
    const [studyGoal, setStudyGoal] = useState('');
    
    // Step 2: Signup
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Auth token after signup
    const [authToken, setAuthToken] = useState(null);

    useEffect(() => {
        // If they came with a plan selected from pricing page
        const preselectedPlan = searchParams.get('plan');
        if (preselectedPlan) {
            // We still need them to go through the flow if not authenticated
            if (isAuthenticated) {
                navigate('/pricing');
            }
        }
    }, [searchParams, isAuthenticated, navigate]);

    const handleQuestionSubmit = (e) => {
        e.preventDefault();
        if (!studyGoal) {
            toast.error('Please tell us your main study goal.');
            return;
        }
        setStep(2);
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }
        
        try {
            setLoading(true);
            
            // 1. Register
            await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
                username,
                email,
                password,
                study_goal: studyGoal,
            });
            
            // 2. Login to get token
            const loginResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
                username,
                password,
            });
            
            if (loginResponse.data.access_token) {
                const token = loginResponse.data.access_token;
                setAuthToken(token);
                // We save it locally so Paystack redirect or reload works
                localStorage.setItem('accessToken', token);
                toast.success('Account created successfully!');
                setStep(3);
            } else {
                toast.error('Failed to log in automatically.');
            }
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                const detail = err.response.data.detail;
                const message = Array.isArray(detail)
                  ? detail.map((d) => d.msg || JSON.stringify(d)).join(' | ')
                  : typeof detail === 'string'
                  ? detail
                  : 'Registration failed. Please try again.';
                toast.error(message);
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelection = async (planId) => {
        if (planId === 'basic') {
            // Log them in fully and redirect to dashboard
            login(authToken);
            return;
        }

        setLoading(planId);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/subscriptions/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ plan: planId }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.detail || 'Failed to start checkout. Please try again.');
                setLoading(false);
                return;
            }

            // Redirect to Paystack
            window.location.href = data.authorization_url;
        } catch (err) {
            toast.error('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />
            
            <main className="flex-grow pt-24 pb-24 px-6 flex items-center justify-center">
                <div className="w-full max-w-4xl mx-auto">
                    
                    {/* Stepper Header */}
                    <div className="mb-12 flex items-center justify-center space-x-4 md:space-x-8">
                        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                            <span className="hidden sm:inline font-semibold">Goals</span>
                        </div>
                        <div className={`h-1 w-12 rounded ${step >= 2 ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                        
                        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                            <span className="hidden sm:inline font-semibold">Account</span>
                        </div>
                        <div className={`h-1 w-12 rounded ${step >= 3 ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                        
                        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                            <span className="hidden sm:inline font-semibold">Plan</span>
                        </div>
                    </div>

                    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Welcome to TheWorkshop! 👋</h2>
                                    <p className="text-slate-600 mb-8 font-medium">Let's personalize your experience. What are you studying for?</p>
                                    
                                    <form onSubmit={handleQuestionSubmit} className="space-y-6 max-w-md mx-auto">
                                        <div className="space-y-4">
                                            {[
                                                { id: 'jamb', label: 'JAMB / UTME', icon: <Target size={20} /> },
                                                { id: 'waec', label: 'WAEC / SSCE', icon: <BookOpen size={20} /> },
                                                { id: 'uni', label: 'University Exams', icon: <Target size={20} /> },
                                                { id: 'other', label: 'General Study / Other', icon: <BookOpen size={20} /> },
                                            ].map((goal) => (
                                                <label 
                                                    key={goal.id} 
                                                    className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                                                        studyGoal === goal.id ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'
                                                    }`}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        name="studyGoal" 
                                                        value={goal.id} 
                                                        checked={studyGoal === goal.id}
                                                        onChange={(e) => setStudyGoal(e.target.value)}
                                                        className="hidden"
                                                    />
                                                    <div className={`mr-4 ${studyGoal === goal.id ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {goal.icon}
                                                    </div>
                                                    <span className={`font-semibold ${studyGoal === goal.id ? 'text-slate-900' : 'text-slate-700'}`}>
                                                        {goal.label}
                                                    </span>
                                                    {studyGoal === goal.id && (
                                                        <Check className="ml-auto text-slate-900" size={20} />
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                        
                                        <button 
                                            type="submit" 
                                            className="w-full py-4 px-6 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Continue <ArrowRight size={20} />
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="text-center">
                                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create your account</h2>
                                        <p className="text-slate-600 mb-8 font-medium">You need an account to save your progress.</p>
                                    </div>
                                    <form onSubmit={handleSignupSubmit} className="space-y-5 max-w-md mx-auto">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50"
                                                placeholder="Choose a username"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50"
                                                placeholder="Create a password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50"
                                                placeholder="Confirm your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                            />
                                        </div>
                                        
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full py-4 px-6 mt-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                        >
                                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <div className="text-center mb-12">
                                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Choose your plan</h2>
                                        <p className="text-slate-600 font-medium">Select a subscription to supercharge your studies.</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {PLANS.map((plan) => (
                                            <div key={plan.id} className={`flex flex-col p-6 rounded-2xl border ${plan.popular ? 'border-slate-900 shadow-lg ring-1 ring-slate-900' : 'border-slate-200'}`}>
                                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                                <p className="text-sm text-slate-500 mt-1 mb-6 h-10">{plan.description}</p>
                                                
                                                <div className="mb-6 flex items-baseline">
                                                    <span className="text-3xl font-bold text-slate-900">{formatPrice(plan.price)}</span>
                                                    {plan.id !== 'basic' && <span className="text-slate-500 ml-1">/mo</span>}
                                                </div>
                                                
                                                <ul className="space-y-3 mb-8 flex-grow">
                                                    {plan.features.slice(0, 4).map((feature, i) => (
                                                        <li key={i} className="flex items-start text-sm font-medium text-slate-700">
                                                            <Check className="text-slate-900 mr-2 shrink-0 mt-0.5" size={16} />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                                
                                                <button
                                                    onClick={() => handlePlanSelection(plan.id)}
                                                    disabled={loading === plan.id}
                                                    className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                                                        plan.popular 
                                                        ? 'bg-slate-900 text-white hover:bg-slate-800' 
                                                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {loading === plan.id ? <Loader2 size={18} className="animate-spin" /> : (plan.id === 'basic' ? 'Start Free' : 'Select Plan')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Onboarding;
