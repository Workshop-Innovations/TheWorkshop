import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Layers,
  MessageSquare,
  Check,
  ArrowUpRight,
} from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";

const tools = [
  {
    name: "Past papers",
    description:
      "Find a paper, work through the questions and review your answers.",
    to: "/past-papers",
    icon: BookOpen,
    label: "Practice with purpose",
  },
  {
    name: "Study suite",
    description:
      "Bring your notes together with explanations, quizzes and flashcards.",
    to: "/study-suite",
    icon: Layers,
    label: "Understand the topic",
  },
  {
    name: "Focus timer",
    description:
      "Set aside a distraction-free session and build a record of your effort.",
    to: "/pomodoro",
    icon: Clock,
    label: "Make time to learn",
  },
  {
    name: "Study community",
    description:
      "Discuss difficult questions and prepare alongside other learners.",
    to: "/community",
    icon: MessageSquare,
    label: "Work it out together",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] bg-white p-3 rounded-lg"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f6f9fb] pt-32 pb-16 sm:pt-40 sm:pb-24">
          <div
            className="absolute right-0 top-0 h-full w-1/3 bg-teal-50/60 pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-[1.15fr_1fr] items-center gap-12 lg:gap-20">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-teal-700 mb-6">
                Your space to learn
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.07] max-w-2xl">
                Less scattered.
                <br />
                <span className="text-primary">More prepared.</span>
              </h1>
              <p className="mt-7 text-lg leading-relaxed text-slate-600 max-w-xl">
                Turn your next study session into a clear next step. Practice
                past questions, understand your notes and make time for focused
                work.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  to="/register"
                  className="inline-flex justify-center items-center gap-3 rounded-lg bg-primary text-white py-4 px-6 font-semibold hover:bg-primary-dark"
                >
                  Start studying <ArrowRight size={18} />
                </Link>
                <a
                  href="#study-tools"
                  className="inline-flex justify-center items-center gap-3 rounded-lg border border-slate-300 bg-white py-4 px-6 font-semibold text-slate-700 hover:border-primary"
                >
                  Explore the tools
                </a>
              </div>
              <p className="mt-5 text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-primary/5 overflow-hidden">
              <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-lg">A session with a plan</span>
                <BookOpen size={22} className="text-teal-600" />
              </div>
              <ol className="p-6 sm:p-8 space-y-7">
                {[
                  [
                    "01",
                    "Choose one topic",
                    "Start with the part you want to understand.",
                  ],
                  [
                    "02",
                    "Give it your attention",
                    "Open your notes or a paper. Set a focus timer.",
                  ],
                  [
                    "03",
                    "Check what you learned",
                    "Review your answers and revisit the difficult parts.",
                  ],
                ].map(([number, title, description]) => (
                  <li key={number} className="flex gap-4">
                    <span className="shrink-0 grid place-items-center w-10 h-10 rounded-lg bg-slate-100 text-primary text-sm font-bold">
                      {number}
                    </span>
                    <div>
                      <h2 className="font-bold text-base">{title}</h2>
                      <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="px-6 sm:px-8 py-5 bg-primary text-white flex items-center gap-3 text-sm">
                <Check size={18} className="text-teal-300" /> Small steps.
                Steady progress.
              </div>
            </div>
          </div>
        </section>
        <section
          id="study-tools"
          className="max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-24 scroll-mt-24"
        >
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-teal-700 mb-4">
              Built around your study session
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              The tools you need.
              <br />
              One place to return to.
            </h2>
            <p className="text-slate-500 leading-relaxed mt-5">
              Move from practice to understanding, then make a little more
              progress tomorrow.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tools.map(({ name, description, to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="group rounded-xl border border-slate-200 p-6 hover:border-primary/40 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center mb-8">
                  <Icon size={24} className="text-primary" />
                  <ArrowUpRight
                    size={18}
                    className="text-slate-400 group-hover:text-primary"
                  />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 mb-2">
                  {label}
                </p>
                <h3 className="text-xl font-bold">{name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {description}
                </p>
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-primary text-white">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 sm:py-20 grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="text-teal-200 text-sm font-semibold mb-3">
                Make room for what matters
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Your next session starts here.
              </h2>
              <p className="text-white/70 mt-4 max-w-xl leading-relaxed">
                You don’t need to do everything today. Choose one thing and give
                it your attention.
              </p>
            </div>
            <Link
              to="/register"
              className="inline-flex justify-center items-center gap-3 rounded-lg bg-white text-primary font-bold px-6 py-4 hover:bg-teal-50"
            >
              Create your account <ArrowRight size={18} />
            </Link>
          </div>
        </section>
        <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
          <h2 className="text-3xl font-bold mb-8">Before you get started</h2>
          {[
            [
              "Where should I begin?",
              "Choose a topic or an exam paper, then set aside a focus session. Your dashboard brings the main tools together.",
            ],
            [
              "Can I study on my phone?",
              "Yes. The web app adapts to smaller screens, including the collaboration center.",
            ],
            [
              "Do I need AI to use WorkShop?",
              "No. You can use past papers, revision notes, focus sessions and the community independently. AI features depend on service availability.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="border-b border-slate-200 py-5">
              <summary className="cursor-pointer font-semibold pr-4">
                {q}
              </summary>
              <p className="text-slate-500 text-sm leading-relaxed mt-4">{a}</p>
            </details>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
