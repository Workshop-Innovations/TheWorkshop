import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PomodoroProvider, usePomodoro } from "./context/PomodoroContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import MinimizedPomodoro from "./components/timer/MinimizedPomodoro.jsx";
import PrivateRoute from "./components/auth/PrivateRoute.jsx";
import AdminRoute from "./components/auth/AdminRoute.jsx";
import Landing from "./pages/Landing.jsx";
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Pomodoro = lazy(() => import("./pages/Pomodoro.jsx"));
const Tasks = lazy(() => import("./pages/Tasks.jsx"));
const Store = lazy(() => import("./pages/Store.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ComingSoon = lazy(() => import("./pages/ComingSoon.jsx"));
const Progress = lazy(() => import("./pages/Progress.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Materials = lazy(() => import("./pages/Materials.jsx"));
const CommunityPage = lazy(() => import("./pages/CommunityRoute.jsx"));
const PastPapers = lazy(() => import("./pages/PastPapers.jsx"));
const StudySuite = lazy(() => import("./pages/StudySuite.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const SubjectSummary = lazy(() => import("./pages/SubjectSummary.jsx"));
const RevisionNotes = lazy(() => import("./pages/RevisionNotes.jsx"));
const Pricing = lazy(() => import("./pages/Pricing.jsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.jsx"));
const PaperViewer = lazy(() => import("./pages/PaperViewer.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage.jsx"));

import ScrollToTop from "./components/layout/ScrollToTop.jsx";
import TopProgressBar from "./components/layout/TopProgressBar.jsx";

const AppContent = () => {
  const { isRunning } = usePomodoro();
  const location = useLocation();
  const showMinimizedTimer = isRunning && location.pathname !== "/pomodoro";

  return (
    <div className="min-h-screen bg-background-secondary text-slate-900 font-sans selection:bg-primary-light selection:text-white">
      <ScrollToTop />
      <TopProgressBar />
      <Suspense
        fallback={
          <div
            role="status"
            className="min-h-screen grid place-items-center text-primary"
          >
            Loading your workspace…
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/rewards"
            element={
              <PrivateRoute>
                <Store />
              </PrivateRoute>
            }
          />
          <Route path="/coming-soon" element={<ComingSoon />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/pomodoro"
            element={
              <PrivateRoute>
                <Pomodoro />
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <Tasks />
              </PrivateRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <PrivateRoute>
                <Progress />
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          <Route
            path="/materials"
            element={
              <PrivateRoute>
                <Materials />
              </PrivateRoute>
            }
          />

          <Route
            path="/past-papers"
            element={
              <PrivateRoute>
                <PastPapers />
              </PrivateRoute>
            }
          />
          <Route
            path="/papers/:paperId"
            element={
              <PrivateRoute>
                <PaperViewer />
              </PrivateRoute>
            }
          />
          <Route
            path="/study-suite"
            element={
              <PrivateRoute>
                <StudySuite />
              </PrivateRoute>
            }
          />
          <Route
            path="/community"
            element={
              <PrivateRoute>
                <CommunityPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/revision-notes"
            element={
              <PrivateRoute>
                <RevisionNotes />
              </PrivateRoute>
            }
          />
          <Route
            path="/subjects/:subjectId"
            element={
              <PrivateRoute>
                <SubjectSummary />
              </PrivateRoute>
            }
          />

          <Route path="/feedback" element={<FeedbackPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {showMinimizedTimer && <MinimizedPomodoro />}
    </div>
  );
};

function Workspace() {
  const { accessToken } = useAuth();
  return (
    <PomodoroProvider key={accessToken || "guest"}>
      <AppContent />
    </PomodoroProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Workspace />
      </AuthProvider>

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable={false}
        pauseOnHover
        icon={false}
      />
    </Router>
  );
}

export default App;
