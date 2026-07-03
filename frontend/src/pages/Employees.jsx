import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

const EMPTY_FORM = { name: '', email: '', department: '', grade: '', skills: '' };

export default function Employees() {
  const { user } = useAuth();
  const canManage = user?.role === 'owner' || user?.role === 'admin';
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  function load() {
    api.employees.list().then(setEmployees).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.employees.create({
        ...form,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <div className="sub">{employees.length} people in your organization</div>
        </div>
        {canManage && <button className="btn btn-accent" onClick={() => setShowForm(true)}>+ Add employee</button>}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Grade</th>
              <th>Skills</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="flex-row">
                    <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                      {e.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{e.email}</div>
                    </div>
                  </div>
                </td>
                <td>{e.department || '—'}</td>
                <td>{e.grade || '—'}</td>
                <td>
                  {(e.skills || []).slice(0, 4).map((s) => (
                    <span key={s} className="badge" style={{ marginRight: 4 }}>{s}</span>
                  ))}
                </td>
                <td><span className={`badge ${e.status === 'active' ? '' : 'priority-medium'}`}>{e.status}</span></td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={5} className="empty-state">No employees yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Add employee</h3>
            <form onSubmit={submit}>
              <div className="field">
                <label>Full name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Department</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Engineering" />
              </div>
              <div className="field">
                <label>Grade / level</label>
                <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Junior, Senior, Lead…" />
              </div>
              <div className="field">
                <label>Skills (comma separated)</label>
                <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="react, node, sql" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-accent" disabled={busy}>{busy ? 'Saving…' : 'Add employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
