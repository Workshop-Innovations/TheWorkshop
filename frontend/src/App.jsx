import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PomodoroProvider, usePomodoro } from './context/PomodoroContext';
import { AuthProvider } from './context/AuthContext';
import { CommunityProvider } from './context/CommunityContext';
import MinimizedPomodoro from './components/MinimizedPomodoro';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute'; // Import AdminRoute
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Pomodoro from './pages/Pomodoro';
import Tasks from './pages/Tasks';
import Store from './pages/Store';
import Login from './pages/Login';
import Register from './pages/Register';
import ComingSoon from './pages/ComingSoon';
import Feedback from './pages/Feedback';
import Progress from './pages/Progress';
import Profile from './pages/Profile';
import Materials from './pages/Materials';
import CommunityPage from './pages/CommunityPage';
import PastPapers from './pages/PastPapers';
import StudySuite from './pages/StudySuite';
// import Community from './pages/Community'; // Removed: Redundant
import AdminDashboard from './pages/AdminDashboard'; // Import AdminDashboard
import SubjectSummary from './pages/SubjectSummary';
import Pricing from './pages/Pricing';
import PaperViewer from './pages/PaperViewer';

import ScrollToTop from './components/ScrollToTop';

const AppContent = () => {
  const { isRunning } = usePomodoro();
  const showMinimizedTimer = isRunning && location.pathname !== '/pomodoro';

  return (
    <div className="min-h-screen bg-background-secondary text-slate-900 font-sans selection:bg-primary-light selection:text-white">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/rewards" element={<Store />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/feedback" element={<Feedback />} />

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
          path="/subjects/:subjectId"
          element={
            <PrivateRoute>
              <SubjectSummary />
            </PrivateRoute>
          }
        />
      </Routes>

      <AnimatePresence>
        {showMinimizedTimer && <MinimizedPomodoro />}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <PomodoroProvider>
          <CommunityProvider>
            <AppContent />
          </CommunityProvider>
        </PomodoroProvider>
      </AuthProvider>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;