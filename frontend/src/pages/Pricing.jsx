import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaTimes, FaStar } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Pricing = () => {
    const plans = [
        {
            name: 'Free Student',
            price: 'R0',
            period: '/month',
            description: 'Essential resources for every student.',
            features: [
                'Access to all Past Papers',
                'Basic Community Access',
                'limited AI Tutor Queries (5/day)',
                'Study Timer',
            ],
            notIncluded: [
                'Unlimited AI Tutor',
                'Detailed Progress Analytics',
                'Priority Support'
            ],
            buttonText: 'Get Started',
            buttonLink: '/register',
            popular: false
        },
        {
            name: 'Premium Scholar',
            price: 'R149',
            period: '/month',
            description: 'Supercharge your grades with AI.',
            features: [
                'Everything in Free',
                'Unlimited AI Tutor Access 24/7',
                'Detailed Progress Analytics',
                'Custom Study Plans',
                'Priority Community Support',
                'Exclusive "Scholar" Badge'
            ],
            notIncluded: [],
            buttonText: 'Start Free Trial',
            buttonLink: '/register?plan=premium',
            popular: true
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
                            Invest in Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Future.</span>
                        </h1>
                        <p className="text-xl text-slate-600">
                            Choose the plan that fits your study needs. Cancel anytime.
                        </p>
                    </div>

                    {/* Pricing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {plans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col ${plan.popular
                                        ? 'bg-white border-primary shadow-2xl shadow-primary/10 scale-105 z-10'
                                        : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-xl'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                                        <FaStar className="text-yellow-300" /> Recommended
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                                        <span className="text-slate-500 font-medium">{plan.period}</span>
                                    </div>
                                    <p className="text-slate-500">{plan.description}</p>
                                </div>

                                <div className="space-y-4 mb-8 flex-grow">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="mt-1 min-w-[20px] text-green-500"><FaCheck /></div>
                                            <span className="text-slate-700 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                    {plan.notIncluded.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3 opacity-50">
                                            <div className="mt-1 min-w-[20px] text-slate-400"><FaTimes /></div>
                                            <span className="text-slate-500">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link
                                    to={plan.buttonLink}
                                    className={`w-full py-4 rounded-xl font-bold text-lg text-center transition-all ${plan.popular
                                            ? 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20 hover:-translate-y-1'
                                            : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    {plan.buttonText}
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Mini Section */}
                    <div className="mt-24 text-center">
                        <p className="text-slate-500 mb-4">Have specific questions?</p>
                        <a href="mailto:support@workshop.edu" className="text-primary font-bold hover:underline">Contact our support team</a>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Pricing;
