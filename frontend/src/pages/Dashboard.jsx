import { useState, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  UserCircle,
  X,
  BookOpen,
  Bot,
  ArrowRight,
  Play,
  CheckCircle2,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { usePomodoro } from "../context/PomodoroContext.jsx";
import { REWARDS } from "../constants/rewardConstants.js";
const ImageUploaderModal = lazy(
  () => import("../components/profile/ImageUploaderModal.jsx"),
);

const Dashboard = () => {
  const { user, profilePic: contextProfilePic, updateProfilePic } = useAuth();
  const { userStats, statsLoading, statsError, refreshStats } = usePomodoro();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const selectedProfilePic = contextProfilePic;

  const [selectedTitle, setSelectedTitle] = useState(() => {
    let savedTitle;
    try {
      savedTitle = JSON.parse(localStorage.getItem("userTitle"));
    } catch {
      savedTitle = null;
    }
    return (
      savedTitle || REWARDS?.PASSIVE_TITLES.find((r) => r.id === "title-novice")
    );
  });
  const [selectedFrame, setSelectedFrame] = useState(() => {
    let savedFrame;
    try {
      savedFrame = JSON.parse(localStorage.getItem("userFrame"));
    } catch {
      savedFrame = null;
    }
    return (
      savedFrame || REWARDS?.PASSIVE_FRAMES.find((r) => r.id === "frame-basic")
    );
  });

  const isEarned = (reward) => {
    const { requirement } = reward;
    return userStats?.totalCompletedPomodoros >= requirement;
  };

  const availableTitles = REWARDS?.PASSIVE_TITLES?.filter(isEarned) || [];
  const availableFrames = REWARDS?.PASSIVE_FRAMES?.filter(isEarned) || [];
  const allRewards = [
    ...(REWARDS?.PASSIVE_TITLES || []),
    ...(REWARDS?.PASSIVE_FRAMES || []),
  ];
  const totalUnlockedRewards = allRewards.filter(isEarned).length;

  const currentTitle = selectedTitle || {
    name: "Loading...",
    className: "text-slate-500",
  };

  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const handleProfilePicSave = (compressedImage) => {
    return updateProfilePic(compressedImage);
  };

  const handleRemoveProfilePic = () => {
    updateProfilePic(null).catch(() =>
      alert("Unable to remove the picture. Please retry."),
    );
  };

  const handleTitleChange = (title) => {
    setSelectedTitle(title);
    localStorage.setItem("userTitle", JSON.stringify(title));
  };

  const handleFrameChange = (frame) => {
    setSelectedFrame(frame);
    localStorage.setItem("userFrame", JSON.stringify(frame));
  };

  const currentUsername = user?.username || "User";
  const totalPomodoros = userStats?.totalCompletedPomodoros || 0;
  const totalAchievements = totalUnlockedRewards;
  const totalFocusTime = (userStats?.totalFocusMinutes || 0) * 60;
  const focusHours = Math.floor(totalFocusTime / 3600);
  const focusMinutes = Math.floor((totalFocusTime % 3600) / 60);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f9fb] text-slate-900 font-sans">
      <Navbar />

      <main
        id="main-content"
        className="flex-grow max-w-7xl w-full mx-auto px-5 sm:px-8 pt-28 pb-16"
      >
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-teal-700 mb-3">
              Your workspace
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Hello, {currentUsername}
            </h1>
            <p className="mt-3 text-slate-500">
              Choose one thing to move forward today.
            </p>
          </div>
          <button
            aria-label="Customize profile"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-primary/40"
          >
            {selectedProfilePic ? (
              <img
                src={selectedProfilePic}
                alt=""
                width="40"
                height="40"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <UserCircle className="w-10 h-10 text-primary" />
            )}
            <span className="text-left">
              <span className="block text-sm font-semibold">
                {currentTitle.name}
              </span>
              <span className="block text-xs text-slate-500 mt-1">
                Customize profile
              </span>
            </span>
          </button>
        </header>
        {statsError && (
          <div
            role="alert"
            className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-xl text-sm"
          >
            Focus totals could not be refreshed.{" "}
            <button
              className="underline font-semibold ml-2"
              onClick={refreshStats}
            >
              Retry
            </button>
          </div>
        )}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 mb-8">
          <section className="rounded-2xl bg-primary p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="relative">
              <p className="text-teal-200 text-sm font-semibold mb-4">
                Make space for focused work
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight max-w-md">
                A little focus.
                <br />A clear next step.
              </h2>
              <p className="mt-4 max-w-md text-white/70 leading-relaxed text-sm">
                Pick a topic, set your timer and work at your own pace.
              </p>
              <Link
                to="/pomodoro"
                className="inline-flex items-center gap-3 mt-7 rounded-lg bg-white text-primary font-bold px-5 py-3"
              >
                <Play size={17} /> Start a focus session
              </Link>
            </div>
          </section>
          <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
              <Clock size={18} /> Total focus time
            </div>
            <p className="text-4xl sm:text-5xl font-bold text-primary tracking-tight mt-6">
              {statsLoading
                ? "…"
                : statsError
                  ? "—"
                  : `${focusHours}h ${focusMinutes}m`}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Time from your completed focus sessions.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-5 mt-6 border-t border-slate-100">
              <div>
                <p className="font-bold text-xl">
                  {statsLoading ? "…" : statsError ? "—" : totalPomodoros}
                </p>
                <p className="text-xs text-slate-500 mt-1">Study sessions</p>
              </div>
              <div>
                <p className="font-bold text-xl">
                  {statsLoading ? "…" : statsError ? "—" : totalAchievements}
                </p>
                <p className="text-xs text-slate-500 mt-1">Achievements</p>
              </div>
            </div>
          </section>
        </div>
        <section aria-labelledby="tools-title">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 id="tools-title" className="text-xl font-bold">
                Where would you like to start?
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Everything for your next study session.
              </p>
            </div>
            <Link
              to="/progress"
              className="text-primary text-sm font-semibold whitespace-nowrap"
            >
              Your progress
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickLink
              to="/past-papers"
              icon={<BookOpen />}
              title="Past papers"
              desc="Practice questions and review your answers."
            />
            <QuickLink
              to="/revision-notes"
              icon={<GraduationCap />}
              title="Revision notes"
              desc="Revisit a topic, one concept at a time."
            />
            <QuickLink
              to="/study-suite"
              icon={<Bot />}
              title="Study suite"
              desc="Work with your notes, quizzes and flashcards."
            />
            <QuickLink
              to="/community"
              icon={<MessageSquare />}
              title="Community"
              desc="Discuss questions with other learners."
            />
          </div>
        </section>

        {isSettingsOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <div className="bg-white rounded-md w-full max-w-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  Profile Settings
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-3 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar bg-slate-50/50">
                <section className="mb-12">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">
                    Avatar
                  </h4>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 bg-white p-8 rounded-md shadow-sm border border-slate-100">
                    <div className="relative shrink-0">
                      <div className="w-28 h-28 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center border-4 border-white shadow-lg">
                        {selectedProfilePic ? (
                          <img
                            src={selectedProfilePic}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserCircle className="text-6xl text-slate-300" />
                        )}
                      </div>
                    </div>
                    <div className="flex-grow space-y-4 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => setIsUploaderOpen(true)}
                          className="px-6 py-3 bg-primary text-white rounded-md font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm"
                        >
                          Upload Picture
                        </button>
                        <button
                          onClick={handleRemoveProfilePic}
                          disabled={!selectedProfilePic}
                          className={`px-6 py-3 rounded-md font-bold transition-colors text-sm ${!selectedProfilePic ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs font-medium text-slate-400">
                        Square JPG/PNG recommended.
                      </p>
                    </div>
                  </div>
                </section>

                <Suspense fallback={<p role="status">Loading image editor…</p>}>
                  <ImageUploaderModal
                    isOpen={isUploaderOpen}
                    onClose={() => setIsUploaderOpen(false)}
                    onSave={handleProfilePicSave}
                  />
                </Suspense>

                <section className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
                      Honorary Title
                    </h4>
                    <span className="text-xs font-bold bg-accent/10 text-accent px-3 py-1.5 rounded-full">
                      {totalPomodoros} Sessions
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {availableTitles.length > 0 ? (
                      availableTitles.map((title) => (
                        <button
                          key={title.id}
                          onClick={() => handleTitleChange(title)}
                          className={`p-6 rounded-md text-left transition-all relative overflow-hidden card border-2 ${selectedTitle.id === title.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-white shadow-sm hover:shadow-md hover:-translate-y-1"}`}
                        >
                          <div className="font-extrabold text-slate-800 tracking-tight text-lg mb-1">
                            {title.name}
                          </div>
                          <div className="text-xs font-medium text-slate-500">
                            Requires {title.requirement} sessions
                          </div>
                          {selectedTitle.id === title.id && (
                            <div className="absolute top-4 right-4 text-primary">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <p className="col-span-2 text-slate-400 text-center italic">
                        Complete more sessions to unlock titles!
                      </p>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">
                    Profile Frame
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {availableFrames.length > 0 ? (
                      availableFrames.map((frame) => (
                        <button
                          key={frame.id}
                          onClick={() => handleFrameChange(frame)}
                          className={`p-6 rounded-md flex flex-col items-center justify-center transition-all card border-2 ${selectedFrame.id === frame.id ? "border-primary bg-primary/5 shadow-md" : "border-transparent bg-white shadow-sm hover:shadow-md hover:-translate-y-1"}`}
                        >
                          <div className="relative w-20 h-20 mb-4">
                            <div className="absolute inset-3 bg-slate-100 rounded-full" />
                            <img
                              src={frame.framePath}
                              alt={frame.name}
                              className="absolute inset-0 w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-800 tracking-tight mb-1">
                            {frame.name}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {frame.requirement} Poms
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="col-span-3 text-slate-400 text-center italic">
                        Complete more sessions to unlock frames!
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-10 py-4 bg-primary text-white font-bold rounded-md hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const QuickLink = ({ to, icon, title, desc }) => (
  <Link to={to} className="group block">
    <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-md h-full flex flex-col">
      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-md flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm font-medium text-slate-500 leading-relaxed flex-grow">
        {desc}
      </p>
      <div className="mt-6 flex items-center text-xs font-bold text-primary tracking-wide text-slate-500 group-hover:text-primary">
        Launch <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  </Link>
);

export default Dashboard;
