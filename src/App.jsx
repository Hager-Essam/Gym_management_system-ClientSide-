import { Route, Routes, Navigate } from 'react-router-dom';
import GuestRoute from './components/routing/GuestRoute.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import ScrollToHash from './components/routing/ScrollToHash.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MemberDashboard from './pages/MemberDashboard.jsx';
import CoachDashboard from './pages/CoachDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import MemberDirectoryPage from './pages/MemberDirectoryPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import MemberProfilePage from './pages/MemberProfilePage.jsx';
import MemberSubscriptionPage from './pages/MemberSubscriptionPage.jsx';
import PlanDetailsPage from './pages/PlanDetailsPage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import SubscribePage from './pages/SubscribePage.jsx';

// Smart dashboard router that redirects based on user role
function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Admin gets full Admin Dashboard
  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  // Manager goes to Member Directory (Operations)
  if (user.role === 'manager') {
    return <Navigate to="/operations/members" replace />;
  }

  // Coach goes to Coach Dashboard
  if (user.role === 'coach') {
    return <CoachDashboard />;
  }

  // Member goes to Member Dashboard
  return <MemberDashboard />;
}

// The route table: which component shows for which URL.
export default function App() {
  return (
    <>
      <ScrollToHash />

      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/plans/:planId" element={<PlanDetailsPage />} />

        {/* Only for logged-OUT visitors (logged-in users are redirected away) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Only for logged-IN users */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/dashboard/member" element={<MemberDashboard />} />
          <Route path="/dashboard/coach" element={<CoachDashboard />} />
          {/* Legacy dashboard page */}
          <Route path="/dashboard/simple" element={<DashboardPage />} />
          {/* Operations pages */}
          <Route path="/operations/members" element={<MemberDirectoryPage />} />

          {/* Member-only pages */}
          <Route element={<ProtectedRoute roles={['member']} />}>
            <Route path="/subscribe/:planId" element={<SubscribePage />} />
            <Route path="/member/profile" element={<MemberProfilePage />} />
            <Route
              path="/member/subscription"
              element={<MemberSubscriptionPage />}
            />
          </Route>
        </Route>

        {/* Anything else */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
