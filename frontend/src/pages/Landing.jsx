import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBookOpen, FaRobot, FaUsers, FaRegClock, FaRocket,
  FaCheckCircle, FaGraduationCap, FaArrowRight, FaStar,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Landing = () => {


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-8 pb-12 lg:pt-10 lg:pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Simplified Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10" />
        {/* Soft centered glow instead of edge blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
              <span className="text-sm font-bold text-slate-600 tracking-wide">The #1 Study Platform for Africa</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Master Exams. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Build Your Future.
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Get instant access to thousands of past papers, 24/7 AI tutoring, and a community of students just like you.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/register" className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white text-lg font-bold rounded-xl shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
                Start Learning Free <FaArrowRight />
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto px-8 py-3 bg-white text-slate-700 text-lg font-bold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:-translate-y-1 transition-all">
                Explore Features
              </Link>
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-slate-500 font-medium">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] overflow-hidden`}>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                  </div>
                ))}
              </div>
              <span>Trusted by students across the continent</span>
            </div>
          </motion.div>

          {/* 3D Visuals */}
          <motion.div
            className="flex-1 relative w-full h-[500px] flex items-center justify-center perspective-1000"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ willChange: 'transform' }}
              className="absolute z-20 w-72 bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 top-10 left-0 lg:left-10 rotate-[-6deg]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-50 text-red-500 rounded-xl"><FaBookOpen className="text-xl" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Past Papers</h3>
                  <p className="text-xs text-slate-400">Instant Download</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">WAEC Math 2023</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Download</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">JAMB English 2023</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Download</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear", delay: 0.5 }}
              style={{ willChange: 'transform' }}
              className="absolute z-10 w-72 bg-slate-900 rounded-2xl shadow-2xl p-6 text-white border border-slate-700 top-20 right-0 lg:right-10 rotate-[6deg]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary rounded-xl text-white"><FaRobot className="text-xl" /></div>
                <div>
                  <h3 className="font-bold">AI Tutor</h3>
                  <p className="text-xs text-slate-400">Online 24/7</p>
                </div>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg mb-3 rounded-tl-none">
                <p className="text-xs text-slate-300">"Explain Newton's 2nd Law"</p>
              </div>
              <div className="bg-primary/20 border border-primary/20 p-3 rounded-lg rounded-tr-none">
                <p className="text-xs text-primary-light">"Sure! F=ma. Force equals mass times acceleration..."</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- PROBLEM / SOLUTION --- */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-slate-900 mb-6"
          >
            Exams are stressful. <br />
            <span className="text-slate-400">Studying shouldn't be.</span>
          </motion.h2>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-16">
            We know the struggle of finding resources, getting stuck on questions late at night, and feeling isolated. WorkShop fixes all of that.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Material Scarcity", icon: "📚", desc: "No more hunting for blurry photos of past papers.", solve: "Instant organized library." },
              { title: "Zero Support", icon: "🤷‍♂️", desc: "Stuck on a problem at 11 PM with no one to ask?", solve: "24/7 AI Explanations." },
              { title: "Motivation Loss", icon: "📉", desc: "Hard to keep going when you're studying alone.", solve: "Gamified Progress & Community." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm mb-4">{item.desc}</p>
                <div className="py-2 px-4 bg-green-100 text-green-700 text-sm font-bold rounded-lg inline-block">
                  ✓ {item.solve}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURE DEEP DIVES --- */}

      {/* 1. PAST PAPERS */}
      <section className="py-16 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-16">
          <motion.div
            className="flex-1 order-2 md:order-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="text-xs font-mono text-slate-400">past_papers_db.pdf</div>
                </div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 mb-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FaBookOpen className="text-primary" />
                      <span className="font-semibold text-slate-700">WAEC Mathematics 2023</span>
                    </div>
                    <FaArrowRight className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          <motion.div
            className="flex-1 order-1 md:order-2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6"><FaBookOpen /></div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Unlimited Past Papers</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Stop stressing about where to find practice material. We've curated thousands of past papers and memos, organized by grade and subject.
            </p>
            <ul className="space-y-3 mb-8">
              {['WAEC & JAMB Papers', 'Full Memos Included', 'Offline Access', 'Search by Topic'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                  <FaCheckCircle className="text-green-500" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* 2. AI TUTOR */}
      <section className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-16">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6"><FaRobot /></div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Your All-in-one Study Suite</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Stuck on a tricky concept? Don't wait for your teacher. Our AI tutor is trained on your curriculum and ready to explain things simply, 24/7.
            </p>
            <Link to="/ai-tutor" className="inline-flex items-center gap-2 text-purple-600 font-bold hover:underline">
              Try a demo conversation <FaArrowRight />
            </Link>
          </motion.div>
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-full max-w-md mx-auto bg-slate-900 rounded-3xl p-6 shadow-2xl relative border border-slate-700">
              <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-800/[0.2] bg-[length:20px_20px] rounded-3xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"><FaRobot /></div>
                <div className="text-white font-bold">TutorBot <span className="text-green-400 text-xs ml-2">● Online</span></div>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-300 text-sm">
                  Hello! I see you're studying Calculus. Need help with derivatives?
                </div>
                <div className="bg-purple-600 p-4 rounded-2xl rounded-tr-none text-white text-sm ml-auto w-fit max-w-[80%]">
                  Yes! How do I find the derivative of sin(x)?
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none text-slate-300 text-sm">
                  The derivative of <strong>sin(x)</strong> is simply <strong>cos(x)</strong>. Remember, it represents the rate of change!
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-16 bg-slate-900 text-white relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Start Improving Today</h2>
            <p className="text-slate-400">Three simple steps to better grades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Create Account", desc: "Sign up for free in less than 30 seconds." },
              { step: "02", title: "Select Subjects", desc: "Tell us what you're studying (e.g., Math, Physics)." },
              { step: "03", title: "Start Learning", desc: "Get instant tailored resources and study plans." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="text-6xl font-black text-white/5 absolute top-4 right-4">{item.step}</div>
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold mb-6">{i + 1}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-12">
          <h2 className="text-3xl font-bold">Students Love WorkShop</h2>
        </div>
        <div className="flex gap-6 overflow-hidden py-4">
          {/* Marquee effect would normally use a specialized library or custom CSS animation, keeping it simple grid for now */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Seyi Anjorin", role: "Grade 12 Student", text: "The past papers library saved my life during clean-up exams. Found everything I needed instantly!", rating: 5 },
              { name: "Chinwe Okeke", role: "Grade 11 Student", text: "I was failing Math, but the AI tutor helped me understand functions in a way my teacher never did.", rating: 5 },
              { name: "Fatima Yusuf", role: "Grade 10 Student", text: "The community is great. It's nice to know others are stressing about the same tests lol.", rating: 4 }
            ].map((t, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="flex text-yellow-400 mb-4 gap-1">{[...Array(t.rating)].map((_, r) => <FaStar key={r} />)}</div>
                <p className="text-slate-600 mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">{t.name[0]}</div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is WorkShop really free?", a: "Yes! You can access past papers and basic features completely for free. We also offer a premium plan for advanced AI usage." },
              { q: "What grades do you cover?", a: "We currently cover Grades 10 to 12 for the major subjects (Math, Sciences, English, etc.)." },
              { q: "Is the AI tutor accurate?", a: "Our AI is trained specifically on the national curriculum, but we always recommend double-checking with your textbooks!" }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary to-secondary rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">Ready to Ace Your Finals?</h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">Join thousands of students who are actively improving their grades every single day.</p>
            <Link to="/register" className="inline-block px-10 py-5 bg-white text-primary text-xl font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all">
              Join WorkShop Now
            </Link>
            <p className="mt-6 text-sm text-white/70">No credit card required • Cancel anytime</p>
          </div>
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
    <div className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="font-bold text-slate-800">{question}</span>
        {isOpen ? <FaChevronUp className="text-slate-400" /> : <FaChevronDown className="text-slate-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white px-6 pb-6 text-slate-500 leading-relaxed"
          >
            <div className="pt-4 border-t border-slate-100">{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Landing;
