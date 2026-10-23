import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Bot, Users, Clock, ArrowRight,
  CheckCircle2, Star, ChevronDown, ChevronUp, Sparkles,
  GraduationCap, FileText, Brain, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Landing = () => {
  useEffect(() => {
    import('./Login');
    import('./Register');
  }, []);
  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 font-sans" role="main">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[calc(100dvh-1px)] pt-32 pb-24 px-6 flex items-center bg-white">

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
          <div
            className="w-full flex-1 text-center lg:text-left"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-6">
              WAEC, NECO & JAMB<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Past Papers Online.</span>
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed tracking-tight">
              Free access to verified WAEC past papers, NECO past questions, and JAMB CBT practice — with AI-powered explanations, marking schemes, and smart study tools built for West African students.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link to="/onboarding" className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white text-sm font-bold rounded-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group">
                Start Practicing Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 text-sm font-bold rounded-md shadow-sm border border-slate-200 hover:bg-slate-50 hover:shadow-md transition-all flex items-center justify-center active:scale-95">
                Browse Past Papers
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div
            className="hidden lg:block w-full flex-1 max-w-lg mx-auto lg:mx-0"
          >
            <div className="w-full bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-md shadow-2xl shadow-slate-200/50">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-800 tracking-tight text-lg">Recent Past Papers</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">Verified & Updated</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "WAEC Mathematics 2024",
                  "JAMB UTME Physics 2024",
                  "NECO English Language 2023",
                  "WAEC Chemistry 2023"
                ].map((examStr, i) => (
                  <Link to="/onboarding" key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-md border border-transparent hover:border-slate-200 hover:bg-white transition-all cursor-pointer group hover:shadow-sm">
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{examStr}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- EXAM BOARDS COVERED --- */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Covering all major West African examinations</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "WAEC / WASSCE", desc: "West African Senior School Certificate Examination past papers from 2000–2024" },
              { name: "NECO SSCE & GCE", desc: "National Examinations Council past questions with detailed solutions" },
              { name: "JAMB UTME / CBT", desc: "Joint Admissions and Matriculation Board CBT practice questions" },
              { name: "All Subjects", desc: "Mathematics, English, Physics, Chemistry, Biology, and more" }
            ].map((board, i) => (
              <div key={i} className="text-center p-6 bg-white rounded-md border border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-base tracking-tight mb-2">{board.name}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{board.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PROBLEM / SOLUTION --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
              AI-Powered Learning for <span className="text-primary">West African Students</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium tracking-tight">
              Stop wasting time searching for scattered past papers. WorkShop gives you verified WAEC, NECO, and JAMB past questions in one organized platform with AI that explains every answer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Verified Past Papers", icon: <BookOpen className="w-7 h-7" />, desc: "Complete archive of WAEC, NECO, and JAMB past papers with standardized marking schemes — no blurry scans or missing pages.", solve: "Organized by exam, year & subject" },
              { title: "AI Tutor & Explanations", icon: <Bot className="w-7 h-7" />, desc: "Get instant, step-by-step explanations for any past paper question. Our AI tutor breaks down complex problems in a way that makes sense.", solve: "24/7 AI-powered help" },
              { title: "Smart Study Tools", icon: <Clock className="w-7 h-7" />, desc: "Auto-generated flashcards, practice quizzes, focus timer, and study groups — everything you need to prepare for WAEC, NECO, or JAMB.", solve: "Complete study suite" }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-slate-50 rounded-md border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all card">
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

      {/* --- PAST PAPERS DEEP DIVE --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-5">Free WAEC, NECO & JAMB Past Papers</h2>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
              Access thousands of verified past examination papers from the West African Examinations Council (WAEC), National Examinations Council (NECO), and Joint Admissions and Matriculation Board (JAMB). Every paper comes with detailed solutions and marking schemes.
            </p>
            <ul className="space-y-4">
              {[
                'WAEC WASSCE & GCE past papers (2000–2024)',
                'NECO SSCE past questions with answers',
                'JAMB UTME CBT practice questions',
                'Detailed marking schemes & solutions',
                'Subject-by-subject and topic-based search',
                'AI-powered explanations for every question'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-bold text-base tracking-tight">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-8 rounded-md shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="border-b border-slate-100 pb-5 mb-5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Past Paper Archive</span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">Free Access</span>
            </div>
            <div className="space-y-3">
              {[
                { exam: "WAEC Mathematics", year: "2024", badge: "New" },
                { exam: "JAMB Physics (UTME)", year: "2024", badge: "New" },
                { exam: "NECO English", year: "2023", badge: "" },
                { exam: "WAEC Biology", year: "2023", badge: "" },
                { exam: "JAMB Chemistry", year: "2023", badge: "" }
              ].map((paper, i) => (
                <Link to="/onboarding" key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-md border border-transparent hover:border-slate-200 hover:bg-white transition-all cursor-pointer group hover:shadow-sm">
                  <div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{paper.exam}</span>
                    <span className="text-xs text-slate-400 ml-2">{paper.year}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paper.badge && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{paper.badge}</span>}
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- AI STUDY TOOLS --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 bg-slate-50 p-8 rounded-md border border-slate-100">
            <div className="border-b border-slate-100 pb-5 mb-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">AI Study Suite</span>
            </div>
            <div className="space-y-4">
              {[
                { icon: <Brain className="w-5 h-5 text-primary" />, title: "AI Tutor", desc: "Ask questions about any past paper and get detailed explanations" },
                { icon: <FileText className="w-5 h-5 text-accent" />, title: "Quiz Generator", desc: "Auto-generate practice quizzes from WAEC, NECO & JAMB content" },
                { icon: <Sparkles className="w-5 h-5 text-amber-500" />, title: "Smart Flashcards", desc: "AI creates flashcards from your study material for spaced repetition" },
                { icon: <Users className="w-5 h-5 text-emerald-500" />, title: "Study Community", desc: "Join study groups, share resources, and learn with other students" }
              ].map((tool, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-md border border-slate-100">
                  <div className="w-10 h-10 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                    {tool.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{tool.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-5">AI-Powered Study Tools for Exam Success</h2>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed font-medium">
              WorkShop goes beyond just past papers. Our AI-powered study suite helps Nigerian and West African students understand every concept, practice effectively, and walk into WAEC, NECO, or JAMB exams fully prepared.
            </p>
            <ul className="space-y-4">
              {[
                'Upload any document and chat with AI about it',
                'Generate quizzes from past paper content',
                'Create flashcards automatically for revision',
                'Track your study progress and focus time'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 font-bold text-base tracking-tight">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-white">Start Practicing in 3 Steps</h2>
            <p className="text-slate-400 text-lg font-medium tracking-tight">Free access to WAEC, NECO & JAMB past papers in under a minute.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Create Your Account", desc: "Sign up free with your email or Google account. No payment required to access past papers." },
              { step: "02", title: "Choose Your Exams", desc: "Select WAEC, NECO, or JAMB and pick your subjects — Mathematics, English, Sciences, and more." },
              { step: "03", title: "Start Practicing", desc: "Access past papers, get AI explanations, generate quizzes, and track your progress." }
            ].map((item, i) => (
              <div key={i} className="p-8 flex flex-col items-center text-center bg-slate-800/50 backdrop-blur-md rounded-md border border-slate-700 hover:bg-slate-800 transition-colors">
                <div className="text-[10px] font-bold text-primary mb-6 tracking-[0.2em] bg-primary/10 inline-block px-3 py-1.5 rounded-full">STEP {item.step}</div>
                <h3 className="text-xl font-extrabold mb-3 tracking-tight text-white">{item.title}</h3>
                <p className="text-slate-400 text-base font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- WHO IT'S FOR --- */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
              Built for Students Across <span className="text-primary">West Africa</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium tracking-tight">
              Whether you're preparing for WAEC in Nigeria, WASSCE in Ghana, or JAMB UTME anywhere in West Africa — WorkShop has the past papers and study tools you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <GraduationCap className="w-7 h-7 text-primary" />, title: "SS1 – SS3 Students", desc: "Preparing for WAEC WASSCE or NECO SSCE? Access past papers for every subject from Senior Secondary 1 through 3." },
              { icon: <FileText className="w-7 h-7 text-accent" />, title: "JAMB Candidates", desc: "Practicing for JAMB UTME? Get CBT-style past questions with instant AI-powered explanations and timed practice." },
              { icon: <Globe className="w-7 h-7 text-emerald-500" />, title: "West African Students", desc: "Students in Nigeria, Ghana, Sierra Leone, Gambia, and Liberia — all WAEC member countries are fully supported." }
            ].map((item, i) => (
              <div key={i} className="p-8 bg-white rounded-md border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                <div className="w-12 h-12 rounded-md bg-slate-50 flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-3 tracking-tight">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-black mb-4 text-slate-900 tracking-tighter text-center">Frequently Asked Questions</h2>
          <p className="text-center text-slate-500 font-medium mb-12">Everything you need to know about accessing WAEC, NECO & JAMB past papers on WorkShop.</p>
          <div className="space-y-4">
            {[
              { q: "Can I access WAEC, NECO and JAMB past papers for free?", a: "Yes. WorkShop provides free access to verified WAEC, NECO, and JAMB past papers across all major subjects including Mathematics, English, Physics, Chemistry, and Biology. Core features including the full past paper archive and AI-powered explanations are available on the free plan." },
              { q: "Which West African examination boards does WorkShop cover?", a: "WorkShop covers all major West African examination boards: WAEC (WASSCE and GCE), NECO (SSCE and GCE), and JAMB (UTME/CBT). Papers span from 2000 to 2024 and are organized by exam board, year, and subject for easy navigation." },
              { q: "How does the AI tutor help with WAEC and JAMB preparation?", a: "Our AI tutor provides instant, detailed explanations for any past paper question. Upload a document or select a past paper, ask your question, and get a step-by-step breakdown. It can also generate practice quizzes and flashcards from your study material to help you revise more effectively." },
              { q: "Can I practice JAMB CBT questions online?", a: "Yes. WorkShop includes JAMB UTME past questions organized by subject and year. You can practice online, get AI-powered explanations for each answer, and generate timed quizzes to simulate the JAMB CBT exam experience." },
              { q: "Are the marking schemes and solutions verified?", a: "All marking schemes on WorkShop are standardized based on official WAEC and NECO marking guidelines. Solutions are verified for accuracy so you can trust the material you're studying from." },
              { q: "Is WorkShop available for students outside Nigeria?", a: "Absolutely. WorkShop serves students across all WAEC member countries — Nigeria, Ghana, Sierra Leone, Gambia, and Liberia. Any student preparing for WAEC, NECO, or JAMB examinations can access the platform from anywhere with an internet connection." },
              { q: "What subjects are available for WAEC and NECO past papers?", a: "WorkShop covers all major WAEC and NECO subjects including Mathematics, English Language, Physics, Chemistry, Biology, Economics, Government, Literature in English, Further Mathematics, Accounting, and more. New subjects and papers are added regularly." },
              { q: "Do I need to pay to use WorkShop?", a: "No. Core features are completely free — including past paper access, marking schemes, and basic AI tutoring. Premium plans with unlimited AI queries and advanced study tools are available for students who want to go further." }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 px-6 bg-slate-50 text-center border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter text-slate-900">Start Practicing Today.</h2>
          <p className="text-lg text-slate-500 mb-10 font-medium tracking-tight">
            Join thousands of West African students using WorkShop to ace their WAEC, NECO & JAMB exams. Free to start — no credit card required.
          </p>
          <Link to="/onboarding" className="inline-block px-8 py-4 bg-primary text-white text-base font-bold rounded-md shadow-lg shadow-primary/20 hover:bg-primary-dark hover:-translate-y-1 active:scale-95 transition-all">
            Access Free Past Papers
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
    <div className="bg-slate-50 rounded-md border border-slate-100 overflow-hidden">
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
