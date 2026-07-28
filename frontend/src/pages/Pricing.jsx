import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, Zap, Star, Crown, Rocket, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        price: 0,
        period: '/mo',
        description: 'Entry — free forever',
        badge: null,
        icon: Zap,
        color: 'from-slate-500 to-slate-700',
        borderColor: 'border-slate-200',
        accentColor: 'text-slate-600',
        features: [
            '5 AI Tutor queries per day',
            'Access to select Past Papers',
            'Basic Community Access',
            'Study Timer & Task Manager',
            'Flashcard Generation (3/day)',
        ],
        notIncluded: [
            'Unlimited AI Tutor',
            'Priority Support',
            'Advanced Analytics',
        ],
        popular: false,
        cta: 'Get Started Free',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 950,
        period: '/mo',
        description: 'The default paid tier',
        badge: null,
        icon: Star,
        color: 'from-blue-500 to-indigo-600',
        borderColor: 'border-blue-200',
        accentColor: 'text-blue-600',
        features: [
            '50 AI Tutor queries per day',
            'All Past Papers & Content',
            'Full Community Access',
            'Flashcard Generation (20/day)',
            'Detailed Progress Analytics',
            'Priority Community Support',
            '"Pro Member" Badge',
        ],
        notIncluded: [
            'Unlimited AI Tutor',
            'Dedicated Priority Support',
        ],
        popular: false,
        cta: 'Upgrade to Pro',
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 2000,
        period: '/mo',
        description: 'For serious study',
        badge: 'Most Popular',
        icon: Crown,
        color: 'from-violet-600 to-purple-700',
        borderColor: 'border-violet-400',
        accentColor: 'text-violet-600',
        features: [
            'Unlimited AI Tutor Access 24/7',
            'All Past Papers & Content',
            'Priority Community Access',
            'Unlimited Flashcard Generation',
            'Advanced Progress Analytics',
            'Custom Study Plans',
            'Priority Email Support',
            '"Premium Scholar" Badge',
        ],
        notIncluded: [],
        popular: true,
        cta: 'Upgrade to Premium',
    },
    {
        id: 'max',
        name: 'Max',
        price: 4500,
        period: '/mo',
        description: 'Everything unlocked',
        badge: 'Best Value',
        icon: Rocket,
        color: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-300',
        accentColor: 'text-amber-600',
        features: [
            'Everything in Premium',
            'Dedicated AI Study Coach',
            'VIP Community Status',
            'Early Access to New Features',
            'Priority Human Support',
            '"Max" Exclusive Badge',
            'Custom AI Persona Settings',
        ],
        notIncluded: [],
        popular: false,
        cta: 'Go Max',
    },
];

const TIER_ORDER = ['basic', 'pro', 'premium', 'max'];

const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `₦${price.toLocaleString()}`;
};

const PlanCard = ({ plan, isCurrentPlan, isDowngrade, onUpgrade, loading }) => {
    const Icon = plan.icon;
    const isBasic = plan.id === 'basic';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative flex flex-col rounded-3xl border-2 transition-all duration-300 overflow-hidden
                ${plan.popular
                    ? 'border-violet-400 shadow-2xl shadow-violet-500/20 scale-105 z-10'
                    : `${plan.borderColor} shadow-lg hover:shadow-xl hover:-translate-y-1`
                }
                ${isCurrentPlan ? 'ring-2 ring-offset-2 ring-green-400' : ''}
            `}
            style={{ background: 'white' }}
        >
            {/* Top gradient strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${plan.color}`} />

            {/* Badge */}
            {(plan.badge || isCurrentPlan) && (
                <div className="absolute top-4 right-4">
                    {isCurrentPlan ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-300">
                            Current Plan
                        </span>
                    ) : (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full text-white bg-gradient-to-r ${plan.color}`}>
                            {plan.badge}
                        </span>
                    )}
                </div>
            )}

            <div className="p-8 flex-grow flex flex-col">
                {/* Header */}
                <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} shadow-md mb-4`}>
                        <Icon className="text-white" size={22} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black ${isBasic ? 'text-slate-700' : plan.accentColor}`}>
                            {formatPrice(plan.price)}
                        </span>
                        {!isBasic && (
                            <span className="text-slate-400 font-medium text-lg">{plan.period}</span>
                        )}
                    </div>
                    {!isBasic && (
                        <p className="text-xs text-slate-400 mt-1">Billed monthly · Cancel anytime</p>
                    )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${plan.color}`}>
                                <Check className="text-white" size={11} strokeWidth={3} />
                            </div>
                            <span className="text-slate-700 text-sm font-medium">{feature}</span>
                        </div>
                    ))}
                    {plan.notIncluded.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 opacity-40">
                            <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-slate-200">
                                <X className="text-slate-500" size={11} strokeWidth={3} />
                            </div>
                            <span className="text-slate-500 text-sm">{feature}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                {isBasic ? (
                    <div className="w-full py-3.5 rounded-xl font-bold text-center bg-slate-100 text-slate-500 text-sm border border-slate-200">
                        {isCurrentPlan ? 'Your current plan' : 'Free Forever'}
                    </div>
                ) : isCurrentPlan ? (
                    <div className={`w-full py-3.5 rounded-xl font-bold text-center text-sm bg-green-50 text-green-700 border-2 border-green-300`}>
                        ✓ Active Plan
                    </div>
                ) : isDowngrade ? (
                    <div className="w-full py-3.5 rounded-xl font-bold text-center bg-slate-100 text-slate-400 text-sm border border-slate-200 cursor-not-allowed">
                        Lower Tier
                    </div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onUpgrade(plan.id)}
                        disabled={loading === plan.id}
                        id={`upgrade-btn-${plan.id}`}
                        className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 bg-gradient-to-r ${plan.color} shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-60`}
                    >
                        {loading === plan.id ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Redirecting...
                            </>
                        ) : (
                            <>
                                {plan.cta}
                                <ChevronRight size={16} />
                            </>
                        )}
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

const Pricing = () => {
    const { user, isAuthenticated, accessToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loadingPlan, setLoadingPlan] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const currentTier = user?.subscription_tier || 'basic';
    const currentTierIndex = TIER_ORDER.indexOf(currentTier);

    // Handle Paystack callback (called when Paystack redirects back)
    const verifyPayment = useCallback(async (reference) => {
        if (!accessToken) return;
        setVerifying(true);
        try {
            const response = await fetch(`${API_BASE}/api/v1/subscriptions/verify/${reference}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                toast.success(`🎉 Payment successful! You're now on the ${data.tier?.toUpperCase()} plan.`);
                // Refresh page to re-fetch user data
                window.location.reload();
            } else {
                toast.error(data.message || 'Payment verification failed.');
            }
        } catch (err) {
            toast.error('Could not verify payment. Please contact support.');
        } finally {
            setVerifying(false);
        }
    }, [accessToken]);

    // Check if returning from Paystack
    useEffect(() => {
        const status = searchParams.get('status');
        const ref = searchParams.get('ref');
        if (status === 'success' && ref) {
            verifyPayment(ref);
        }
    }, [searchParams, verifyPayment]);

    const handleUpgrade = async (planId) => {
        if (!isAuthenticated) {
            toast.info('Please log in to upgrade your plan.');
            navigate('/login?redirect=/pricing');
            return;
        }

        setLoadingPlan(planId);
        try {
            const response = await fetch(`${API_BASE}/api/v1/subscriptions/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ plan: planId }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.detail || 'Failed to start checkout. Please try again.');
                return;
            }

            // Redirect to Paystack checkout
            window.location.href = data.authorization_url;
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
            <Navbar />

            {/* Verifying overlay */}
            <AnimatePresence>
                {verifying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center"
                    >
                        <div className="text-center">
                            <Loader2 size={48} className="animate-spin text-violet-600 mx-auto mb-4" />
                            <p className="text-xl font-semibold text-slate-800">Verifying your payment…</p>
                            <p className="text-slate-500 mt-2">Please wait, this won't take long.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-grow pt-28 pb-24 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto mb-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-semibold mb-6 border border-violet-200">
                            <Zap size={14} />
                            Simple, transparent pricing
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-5 leading-tight tracking-tight">
                            Invest in Your{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                                Future.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-500 leading-relaxed">
                            Choose the plan that fits your study needs.{' '}
                            <span className="font-semibold text-slate-700">Cancel anytime.</span>
                        </p>
                    </motion.div>

                    {/* Current plan banner */}
                    {isAuthenticated && currentTier !== 'basic' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-2xl mx-auto mb-10 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 flex items-center gap-3"
                        >
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                <Check size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="font-semibold text-green-800 text-sm">
                                    You're on the <span className="capitalize">{currentTier}</span> plan
                                    {user?.subscription_expiry && (
                                        <span className="font-normal text-green-600">
                                            {' '}· Renews {new Date(user.subscription_expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    )}
                                </p>
                                <p className="text-green-600 text-xs mt-0.5">
                                    AI queries used today: {user?.ai_queries_today ?? 0}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-center mt-8">
                        {PLANS.map((plan, index) => {
                            const planIndex = TIER_ORDER.indexOf(plan.id);
                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <PlanCard
                                        plan={plan}
                                        isCurrentPlan={currentTier === plan.id}
                                        isDowngrade={isAuthenticated && planIndex < currentTierIndex}
                                        onUpgrade={handleUpgrade}
                                        loading={loadingPlan}
                                    />
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Guarantee Strip */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-16 text-center"
                    >
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-600 text-sm">
                            <AlertCircle size={16} className="text-amber-500" />
                            <span>Payments are securely processed by <strong className="text-slate-800">Paystack</strong>. All prices are in Nigerian Naira (₦).</span>
                        </div>
                    </motion.div>

                    {/* FAQ */}
                    <div className="mt-20 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-4">
                            {[
                                {
                                    q: 'Can I cancel my subscription at any time?',
                                    a: 'Yes! You can cancel at any time. You\'ll retain access to your paid features until the end of your billing period.'
                                },
                                {
                                    q: 'What happens when I hit the AI query limit?',
                                    a: 'On the Basic plan, you get 5 AI Tutor queries per day. Once reached, you\'ll be prompted to upgrade. The counter resets at midnight.'
                                },
                                {
                                    q: 'Can I upgrade or downgrade my plan?',
                                    a: 'You can upgrade to a higher tier at any time. Downgrades take effect at the end of your current billing period.'
                                },
                                {
                                    q: 'Is my payment information secure?',
                                    a: 'Absolutely. All payments are processed through Paystack, a PCI DSS compliant payment processor trusted across Africa.'
                                },
                            ].map((faq, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 transition-colors">
                                    <h3 className="font-semibold text-slate-900 mb-2 text-sm">{faq.q}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="mt-16 text-center">
                        <p className="text-slate-500">
                            Have more questions?{' '}
                            <a href="mailto:support@theworkshop.app" className="text-violet-600 font-semibold hover:underline">
                                Contact our support team
                            </a>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Pricing;
