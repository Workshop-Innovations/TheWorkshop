import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PomodoroProvider, usePomodoro } from './context/PomodoroContext';
import { AuthProvider } from './context/AuthContext';
const CommunityProviderWrapper = lazy(() => import('./context/CommunityWrapper'));
import MinimizedPomodoro from './components/MinimizedPomodoro';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ProfilePictureGate from './components/ProfilePictureGate';
import ScrollToTop from './components/ScrollToTop';
import TopProgressBar from './components/TopProgressBar';
import GlobalLoader from './components/GlobalLoader';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pomodoro = lazy(() => import('./pages/Pomodoro'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Store = lazy(() => import('./pages/Store'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ComingSoon = lazy(() => import('./pages/ComingSoon'));
const Progress = lazy(() => import('./pages/Progress'));
const Profile = lazy(() => import('./pages/Profile'));
const Materials = lazy(() => import('./pages/Materials'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const PastPapers = lazy(() => import('./pages/PastPapers'));
const StudySuite = lazy(() => import('./pages/StudySuite'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SubjectSummary = lazy(() => import('./pages/SubjectSummary'));
const RevisionNotes = lazy(() => import('./pages/RevisionNotes'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const PaperViewer = lazy(() => import('./pages/PaperViewer'));
const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/About'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

const AppContent = () => {
  const { isRunning } = usePomodoro();
  const location = useLocation();
  const showMinimizedTimer = isRunning && location.pathname !== '/pomodoro';

  return (
    <div className="min-h-screen bg-background-secondary text-slate-900 font-sans selection:bg-primary-light selection:text-white">
      <ScrollToTop />
      <TopProgressBar />
      <Suspense fallback={<GlobalLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/rewards" element={<PrivateRoute><Store /></PrivateRoute>} />
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

        {/* Education Pivot Routes */}
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
              <ProfilePictureGate>
                <CommunityProviderWrapper>
                  <CommunityPage />
                </CommunityProviderWrapper>
              </ProfilePictureGate>
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
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>

      {showMinimizedTimer && <MinimizedPomodoro />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <PomodoroProvider>
          <AppContent />
        </PomodoroProvider>
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