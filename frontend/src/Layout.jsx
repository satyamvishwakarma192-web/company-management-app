import { useAuth } from './AuthContext';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'employees', label: 'Employees' },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'notifications', label: 'Notifications' },
];

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function Layout({ page, setPage, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="mark" /> Company OS</div>
        <nav className="list" style={{ gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-link ${page === item.key ? 'active' : ''}`}
              onClick={() => setPage(item.key)}
            >
              <span className="dot" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="flex-row" style={{ marginBottom: 8 }}>
            <div className="avatar">{initials(user?.name)}</div>
            <div>
              <div className="who">{user?.name}</div>
              <div style={{ textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
