import { useEffect, useState } from 'react';
import { api } from '../api';

const COLUMNS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
];
const EMPTY_FORM = { title: '', description: '', projectId: '', priority: 'medium', dueDate: '', assignees: [] };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  function load() {
    Promise.all([api.tasks.list(), api.projects.list(), api.employees.list()])
      .then(([t, p, e]) => { setTasks(t); setProjects(p); setEmployees(e); })
      .catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.tasks.create({ ...form, projectId: form.projectId || null });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function move(task, status) {
    await api.tasks.update(task.id, { status });
    load();
  }

  function projectName(id) {
    return projects.find((p) => p.id === id)?.name || '—';
  }

  function toggleAssignee(id) {
    setForm((f) => ({
      ...f,
      assignees: f.assignees.includes(id) ? f.assignees.filter((a) => a !== id) : [...f.assignees, id],
    }));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <div className="sub">{tasks.length} tasks across all projects</div>
        </div>
        <button className="btn btn-accent" onClick={() => setShowForm(true)}>+ New task</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-3">
        {COLUMNS.map((col) => (
          <div key={col.key}>
            <div className="section-title">{col.label} · {tasks.filter((t) => t.status === col.key).length}</div>
            <div className="list">
              {tasks.filter((t) => t.status === col.key).map((t) => (
                <div key={t.id} className={`card pulse-card status-${t.status}`}>
                  <div className="flex-row between" style={{ marginBottom: 6 }}>
                    <strong style={{ fontSize: 13.5 }}>{t.title}</strong>
                    <span className={`badge priority-${t.priority}`}>{t.priority}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{projectName(t.projectId)}</div>
                  {t.dueDate && <div className="muted" style={{ fontSize: 11.5, marginBottom: 8 }}>Due {t.dueDate}</div>}
                  <select value={t.status} onChange={(e) => move(t, e.target.value)} style={{ fontSize: 12 }}>
                    {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              ))}
              {tasks.filter((t) => t.status === col.key).length === 0 && (
                <div className="empty-state" style={{ padding: '14px 0' }}>Nothing here.</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New task</h3>
            <form onSubmit={submit}>
              <div className="field">
                <label>Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="field">
                <label>Project</label>
                <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">No project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-2">
                <div className="field">
                  <label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="field">
                  <label>Due date</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Assignees</label>
                <div className="list" style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {employees.map((emp) => (
                    <label key={emp.id} className="flex-row" style={{ fontWeight: 400, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={form.assignees.includes(emp.id)}
                        onChange={() => toggleAssignee(emp.id)}
                      />
                      {emp.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-accent" disabled={busy}>{busy ? 'Creating…' : 'Create task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
