import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.reports.dashboard(), api.projects.list(), api.tasks.list()])
      .then(([s, p, t]) => { setStats(s); setProjects(p); setTasks(t); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!stats) return <div className="empty-state">Loading dashboard…</div>;

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">A snapshot of your organization right now.</div>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <div className="card stat-card">
          <div className="label">Headcount</div>
          <div className="value">{stats.headcount}</div>
          <div className="hint">{stats.activeEmployees} active</div>
        </div>
        <div className="card stat-card">
          <div className="label">Present today</div>
          <div className="value">{stats.presentToday}</div>
          <div className="hint">of {stats.headcount} employees</div>
        </div>
        <div className="card stat-card">
          <div className="label">Active projects</div>
          <div className="value">{stats.projectCount}</div>
          <div className="hint">{stats.overdueTasks} overdue tasks</div>
        </div>
        <div className="card stat-card">
          <div className="label">Budget used</div>
          <div className="value">{stats.budgetUtilizationPct}%</div>
          <div className="hint">₹{stats.totalActualCost.toLocaleString('en-IN')} of ₹{stats.totalBudget.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="section-title">Projects</div>
          <div className="list">
            {projects.length === 0 && <div className="empty-state">No projects yet.</div>}
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex-row between" style={{ marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{p.name}</strong>
                  <span className="muted mono" style={{ fontSize: 12.5 }}>{p.progress}%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${p.progress}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="section-title">Recent tasks</div>
          <div className="list">
            {recentTasks.length === 0 && <div className="empty-state">No tasks yet.</div>}
            {recentTasks.map((t) => (
              <div key={t.id} className={`pulse-card status-${t.status}`}>
                <div className="flex-row between">
                  <span style={{ fontSize: 13.5 }}>{t.title}</span>
                  <span className={`badge priority-${t.priority}`}>{t.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
