import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
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
    const isBasic = plan.id === 'basic';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative flex flex-col rounded-lg border bg-white transition-all overflow-hidden ${
                plan.popular ? 'border-slate-900 shadow-md' : 'border-slate-200 shadow-sm'
            }`}
        >
            <div className="p-8 flex-grow flex flex-col">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">{plan.description}</p>
                    </div>
                    {plan.badge && (
                        <span className="bg-slate-100 text-slate-900 text-xs font-semibold px-2 py-1 rounded">
                            {plan.badge}
                        </span>
                    )}
                    {isCurrentPlan && !plan.badge && (
                        <span className="bg-slate-100 text-slate-900 text-xs font-semibold px-2 py-1 rounded">
                            Current
                        </span>
                    )}
                </div>

                {/* Price */}
                <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900">
                            {formatPrice(plan.price)}
                        </span>
                        {!isBasic && (
                            <span className="text-slate-500 font-medium text-base">{plan.period}</span>
                        )}
                    </div>
                    {!isBasic && (
                        <p className="text-sm text-slate-500 mt-2 font-medium">Billed monthly. Cancel anytime.</p>
                    )}
                </div>

                {/* CTA Button */}
                <div className="mb-8">
                    {isBasic ? (
                        <div className="w-full py-2.5 rounded text-center bg-slate-50 text-slate-500 text-sm font-semibold border border-slate-200">
                            {isCurrentPlan ? 'Your current plan' : 'Free Forever'}
                        </div>
                    ) : isCurrentPlan ? (
                        <div className="w-full py-2.5 rounded text-center text-sm bg-slate-50 text-slate-900 font-semibold border border-slate-200">
                            Active Plan
                        </div>
                    ) : isDowngrade ? (
                        <div className="w-full py-2.5 rounded text-center bg-slate-50 text-slate-400 text-sm font-semibold border border-slate-200 cursor-not-allowed">
                            Lower Tier
                        </div>
                    ) : (
                        <button
                            onClick={() => onUpgrade(plan.id)}
                            disabled={loading === plan.id}
                            id={`upgrade-btn-${plan.id}`}
                            className={`w-full py-2.5 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
                                plan.popular
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {loading === plan.id ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                plan.cta
                            )}
                        </button>
                    )}
                </div>

                {/* Features */}
                <div className="space-y-4 flex-grow">
                    <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Includes</p>
                    {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <Check className="text-slate-900 mt-0.5 shrink-0" size={16} />
                            <span className="text-slate-600 text-sm font-medium">{feature}</span>
                        </div>
                    ))}
                    {plan.notIncluded.length > 0 && (
                        <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                            {plan.notIncluded.map((feature, i) => (
                                <div key={i} className="flex items-start gap-3 opacity-60">
                                    <X className="text-slate-400 mt-0.5 shrink-0" size={16} />
                                    <span className="text-slate-500 text-sm font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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

    // Handle Paystack callback
    const verifyPayment = useCallback(async (reference) => {
        if (!accessToken) return;
        setVerifying(true);
        try {
            const response = await fetch(`${API_BASE}/api/v1/subscriptions/verify/${reference}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                toast.success(`Payment successful! You're now on the ${data.tier?.toUpperCase()} plan.`);
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

            window.location.href = data.authorization_url;
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />

            {/* Verifying overlay */}
            <AnimatePresence>
                {verifying && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white/90 flex items-center justify-center"
                    >
                        <div className="text-left">
                            <Loader2 size={32} className="animate-spin text-slate-900 mb-4" />
                            <p className="text-lg font-semibold text-slate-900">Verifying your payment…</p>
                            <p className="text-slate-500 mt-2 font-medium">Please wait, this won't take long.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-grow pt-32 pb-24 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="max-w-3xl mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Pricing
                        </h1>
                        <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
                            Choose the plan that fits your study needs. Cancel anytime.
                        </p>
                    </div>

                    {/* Current plan banner */}
                    {isAuthenticated && currentTier !== 'basic' && (
                        <div className="max-w-3xl mb-12 p-6 rounded-lg bg-white border border-slate-200 shadow-sm flex items-start gap-4">
                            <Check className="text-slate-900 shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-bold text-slate-900">
                                    You're on the <span className="capitalize">{currentTier}</span> plan
                                    {user?.subscription_expiry && (
                                        <span className="font-medium text-slate-500">
                                            {' '}· Renews {new Date(user.subscription_expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    )}
                                </p>
                                <p className="text-slate-600 text-sm mt-2 font-medium">
                                    AI queries used today: {user?.ai_queries_today ?? 0}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Plans Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                        {PLANS.map((plan, index) => {
                            const planIndex = TIER_ORDER.indexOf(plan.id);
                            return (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isCurrentPlan={currentTier === plan.id}
                                    isDowngrade={isAuthenticated && planIndex < currentTierIndex}
                                    onUpgrade={handleUpgrade}
                                    loading={loadingPlan}
                                />
                            );
                        })}
                    </div>

                    {/* Guarantee Strip */}
                    <div className="mt-16 text-left">
                        <div className="inline-flex items-center gap-3 p-4 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 text-sm font-medium">
                            <AlertCircle size={16} className="text-slate-400 shrink-0" />
                            <span>Payments are securely processed by <strong className="text-slate-900 font-bold">Paystack</strong>. All prices are in Nigerian Naira (₦).</span>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mt-24 max-w-3xl">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    q: 'Can I cancel my subscription at any time?',
                                    a: 'Yes. You can cancel at any time. You will retain access to your paid features until the end of your billing period.'
                                },
                                {
                                    q: 'What happens when I hit the AI query limit?',
                                    a: 'On the Basic plan, you get 5 AI Tutor queries per day. Once reached, you will be prompted to upgrade. The counter resets at midnight.'
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
                                <div key={i} className="bg-white rounded-lg border border-slate-200 p-6">
                                    <h3 className="font-bold text-slate-900 mb-3 text-base">{faq.q}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed font-medium">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="mt-16 border-t border-slate-200 pt-8">
                        <p className="text-slate-600 font-medium text-sm">
                            Have more questions?{' '}
                            <a href="mailto:support@theworkshop.app" className="text-slate-900 font-bold hover:underline">
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
