import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import Notifications from './pages/Notifications';

const PAGES = {
  dashboard: Dashboard,
  employees: Employees,
  projects: Projects,
  tasks: Tasks,
  attendance: Attendance,
  notifications: Notifications,
};

function Shell() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) return <div className="empty-state" style={{ paddingTop: 80 }}>Loading…</div>;
  if (!user) return <Login />;

  const Page = PAGES[page] || Dashboard;
  return (
    <Layout page={page} setPage={setPage}>
      <Page />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
