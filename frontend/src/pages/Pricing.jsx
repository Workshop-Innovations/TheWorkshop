import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaGlobeAmericas } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Pricing = () => {
    const [currency, setCurrency] = useState('USD');
    const [symbol, setSymbol] = useState('$');
    const [price, setPrice] = useState('11.99');
    const [country, setCountry] = useState('United States');
    const [loading, setLoading] = useState(true);

    // Spotify-like pricing map (approximate)
    const pricingMap = {
        'US': { price: '11.99', currency: 'USD', symbol: '$' },
        'GB': { price: '11.99', currency: 'GBP', symbol: '£' },
        'IN': { price: '119.00', currency: 'INR', symbol: '₹' },
        'NG': { price: '1300.00', currency: 'NGN', symbol: '₦' },
        'CA': { price: '10.99', currency: 'CAD', symbol: '$' },
        'AU': { price: '12.99', currency: 'AUD', symbol: '$' },
        'DE': { price: '10.99', currency: 'EUR', symbol: '€' },
        'FR': { price: '10.99', currency: 'EUR', symbol: '€' },
        'BR': { price: '21.90', currency: 'BRL', symbol: 'R$' },
        'JP': { price: '980', currency: 'JPY', symbol: '¥' },
        // Add more as needed, fallback to USD
    };

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();

                if (data && data.country_code) {
                    const countryCode = data.country_code;
                    setCountry(data.country_name);

                    if (pricingMap[countryCode]) {
                        const localPrice = pricingMap[countryCode];
                        setPrice(localPrice.price);
                        setCurrency(localPrice.currency);
                        setSymbol(localPrice.symbol);
                    } else if (data.currency === 'EUR') {
                        setPrice('10.99');
                        setCurrency('EUR');
                        setSymbol('€');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch location data:", error);
                // Keep default USD
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, []);

    const features = [
        { name: "Unlimited Flashcards", free: true, pro: true },
        { name: "Basic Pomodoro Timer", free: true, pro: true },
        { name: "Community Access", free: true, pro: true },
        { name: "AI Tutor Access", free: false, pro: true },
        { name: "Advanced Analytics", free: false, pro: true },
        { name: "Custom Themes", free: false, pro: true },
        { name: "Priority Support", free: false, pro: true },
        { name: "Ad-free Experience", free: false, pro: true },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-background-secondary text-text-main">
            <Navbar />

            <main className="flex-grow container mx-auto px-4 pt-32 pb-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6 font-medium text-sm">
                            <FaGlobeAmericas />
                            <span>Localized Pricing for {loading ? '...' : country}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-text-main">
                            Invest in Your <span className="text-primary">Superpowers</span>
                        </h1>
                        <p className="text-xl text-text-muted">
                            Start for free, upgrade when you're ready to master your workflow.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 flex flex-col relative overflow-hidden"
                    >
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold">Free</span>
                            </div>
                            <p className="text-text-muted mt-4">Perfect for getting organized.</p>
                        </div>

                        <div className="flex-grow space-y-4 mb-8">
                            {features.map((feature, idx) => (
                                <div key={`free-${idx}`} className="flex items-center gap-3">
                                    {feature.free ? (
                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs">
                                            <FaCheck />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                            <FaTimes />
                                        </div>
                                    )}
                                    <span className={feature.free ? 'text-text-main' : 'text-gray-400'}>{feature.name}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-4 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/5 transition-colors">
                            Get Started
                        </button>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-primary text-white rounded-2xl p-8 shadow-xl flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 bg-secondary text-xs uppercase font-bold px-3 py-1 rounded-bl-xl">
                            Most Popular
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold mb-2">Pro Scholar</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold">{symbol}{price}</span>
                                <span className="text-white/70">/month</span>
                            </div>
                            <p className="text-white/80 mt-4">For serious students & professionals.</p>
                        </div>

                        <div className="flex-grow space-y-4 mb-8">
                            {features.map((feature, idx) => (
                                <div key={`pro-${idx}`} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">
                                        <FaCheck />
                                    </div>
                                    <span className="text-white font-medium">{feature.name}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-4 rounded-xl bg-white text-primary font-bold hover:bg-gray-100 transition-colors shadow-lg">
                            Upgrade Now
                        </button>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Pricing;
