import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const EMPTY_FORM = { name: '', description: '', department: '', budget: '', startDate: '', endDate: '' };

export default function Projects({ onOpenProject }) {
  const { user } = useAuth();
  const canManage = ['owner', 'admin', 'manager'].includes(user?.role);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  function load() {
    api.projects.list().then(setProjects).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.projects.create({ ...form, budget: Number(form.budget) || 0 });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id, status) {
    await api.projects.update(id, { status });
    load();
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <div className="sub">{projects.length} projects tracked</div>
        </div>
        {canManage && <button className="btn btn-accent" onClick={() => setShowForm(true)}>+ New project</button>}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-2">
        {projects.map((p) => (
          <div key={p.id} className={`card pulse-card status-${p.status === 'in_progress' ? 'in_progress' : p.status}`}>
            <div className="flex-row between" style={{ marginBottom: 6 }}>
              <h3 style={{ fontSize: 16 }}>{p.name}</h3>
              {canManage ? (
                <select value={p.status} onChange={(e) => changeStatus(p.id, e.target.value)} style={{ width: 'auto', fontSize: 12 }}>
                  <option value="planning">Planning</option>
                  <option value="in_progress">In progress</option>
                  <option value="on_hold">On hold</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <span className="badge">{p.status}</span>
              )}
            </div>
            <p className="muted" style={{ fontSize: 13, margin: '0 0 12px' }}>{p.description || 'No description yet.'}</p>
            <div className="flex-row between" style={{ marginBottom: 6, fontSize: 12.5 }}>
              <span className="muted">{p.taskCount} tasks</span>
              <span className="mono">{p.progress}%</span>
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${p.progress}%` }} /></div>
            {p.budget > 0 && (
              <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                Budget ₹{p.budget.toLocaleString('en-IN')} · Spent ₹{(p.actualCost || 0).toLocaleString('en-IN')}
              </div>
            )}
          </div>
        ))}
        {projects.length === 0 && <div className="empty-state">No projects yet. Create one to get started.</div>}
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New project</h3>
            <form onSubmit={submit}>
              <div className="field">
                <label>Project name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="field">
                <label>Department</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div className="grid grid-2">
                <div className="field">
                  <label>Start date</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="field">
                  <label>End date</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Budget (₹)</label>
                <input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-accent" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
