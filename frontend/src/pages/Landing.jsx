import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Bot, Users, Clock, ArrowRight,
  CheckCircle2, Star, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[calc(100dvh-1px)] pt-25 pb-30 px-6 overflow-hidden">       {/* Soft Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-6">
              Clear Explanations.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Actual Past Papers.</span>
            </h1>

            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed tracking-tight">
              A beautifully structured platform for serious students. Access verified past papers, detailed solutions, and focused study tools without the clutter.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group">
                Start Practicing
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 text-sm font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:shadow-md transition-all flex items-center justify-center active:scale-95">
                View Features
              </Link>
            </div>
          </motion.div>

          {/* Soft Premium Hero Visual */}
          <motion.div
            className="flex-1 w-full max-w-lg mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-full bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[24px] shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 tracking-tight text-lg">Recent Papers</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">Updated Today</p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white transition-all cursor-pointer group hover:shadow-sm">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">WAEC Mathematics 202{3 - i}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- PROBLEM / SOLUTION --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
              Built for <span className="text-primary">focus.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium tracking-tight">
              We eliminated distractions to provide a straightforward learning experience, wrapped in a premium interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Structured Material", icon: <BookOpen className="w-7 h-7" />, desc: "Verified past papers and standardized solutions in one place.", solve: "Organized Library", color: "text-primary", bg: "bg-primary/10" },
              { title: "Direct Answers", icon: <Bot className="w-7 h-7" />, desc: "Get straight-to-the-point explanations for complex problems.", solve: "Study Suite", color: "text-accent", bg: "bg-accent/10" },
              { title: "No Distractions", icon: <Clock className="w-7 h-7" />, desc: "Built-in tools to manage your time and track actual progress.", solve: "Focus Timer", color: "text-slate-600", bg: "bg-slate-100" }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all card">
                <div className={`${item.bg} ${item.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-3 tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">{item.desc}</p>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {item.solve}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURE DEEP DIVES --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-5">Verified Past Papers</h2>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
              Stop relying on incomplete or blurry documents. Access a highly organized database of past examinations, complete with standardized marking schemes.
            </p>
            <ul className="space-y-4">
              {['WAEC & JAMB Archives', 'Standardized Memos', 'Offline Access', 'Topic-based Search'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-bold text-base tracking-tight">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-8 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="border-b border-slate-100 pb-5 mb-5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Document Database</span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">v1.2.0</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-slate-50 rounded-xl border border-transparent flex items-center px-5">
                  <div className="w-1/2 h-2 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-white">The Process</h2>
            <p className="text-slate-400 text-lg font-medium tracking-tight">Three steps to access the platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Register", desc: "Create an account to save your progress." },
              { step: "02", title: "Configure", desc: "Set your specific examination boards and subjects." },
              { step: "03", title: "Execute", desc: "Begin accessing papers and utilizing the study suite." }
            ].map((item, i) => (
              <div key={i} className="p-8 flex flex-col items-center text-center bg-slate-800/50 backdrop-blur-md rounded-[24px] border border-slate-700 hover:bg-slate-800 transition-colors">
                <div className="text-[10px] font-bold text-primary mb-6 tracking-[0.2em] bg-primary/10 inline-block px-3 py-1.5 rounded-full">STEP {item.step}</div>
                <h3 className="text-xl font-extrabold mb-3 tracking-tight text-white">{item.title}</h3>
                <p className="text-slate-400 text-base font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-12 text-slate-900 tracking-tighter text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is the platform free?", a: "Core features including past paper access are free. Advanced study suite usage requires a subscription." },
              { q: "Which curriculums are supported?", a: "We support major West African examination boards (WAEC, JAMB) for Grades 10-12." },
              { q: "Are the marking schemes official?", a: "We provide standardized memos based on official marking guidelines." }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 px-6 bg-slate-50 text-center border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-slate-900">Begin Practice.</h2>
          <p className="text-lg text-slate-500 mb-10 font-medium tracking-tight">Join the standard platform for serious students.</p>
          <Link to="/register" className="inline-block px-8 py-4 bg-primary text-white text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark hover:-translate-y-1 active:scale-95 transition-all">
            Create Account
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Helper Components
const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-slate-50 rounded-[20px] border border-slate-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
      >
        <span className="font-extrabold text-slate-800 tracking-tight text-base">{question}</span>
        {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-slate-500 font-medium text-sm leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Landing;
