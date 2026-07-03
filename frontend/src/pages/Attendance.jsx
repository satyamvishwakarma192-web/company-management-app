import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Attendance() {
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.attendance.summary().then(setSummary).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function checkIn() {
    setBusy(true); setError(''); setStatus('');
    try {
      await api.attendance.checkin();
      setStatus('Checked in successfully.');
      load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function checkOut() {
    setBusy(true); setError(''); setStatus('');
    try {
      await api.attendance.checkout();
      setStatus('Checked out successfully.');
      load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <div className="sub">Track check-ins and leave across the team</div>
        </div>
        <div className="flex-row">
          <button className="btn btn-ghost" onClick={checkIn} disabled={busy}>Check in</button>
          <button className="btn btn-accent" onClick={checkOut} disabled={busy}>Check out</button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {status && <div className="card" style={{ marginBottom: 16, borderLeft: '3px solid var(--sage)', fontSize: 13.5 }}>{status}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Present days</th>
              <th>Leave days</th>
              <th>Total records</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => (
              <tr key={s.employeeId}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.presentDays}</td>
                <td>{s.leaveDays}</td>
                <td>{s.totalRecords}</td>
              </tr>
            ))}
            {summary.length === 0 && <tr><td colSpan={4} className="empty-state">No attendance records yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
