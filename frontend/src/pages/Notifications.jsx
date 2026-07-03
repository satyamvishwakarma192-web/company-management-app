import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const canAnnounce = user?.role === 'owner' || user?.role === 'admin';
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.notifications.list().then(setItems).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function markRead(id) {
    await api.notifications.markRead(id);
    load();
  }

  async function sendAnnouncement(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true); setError('');
    try {
      await api.notifications.announce(message);
      setMessage('');
      load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <div className="sub">Task updates and company announcements</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {canAnnounce && (
        <form onSubmit={sendAnnouncement} className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginTop: 0 }}>Send announcement</div>
          <div className="flex-row">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message to all employees…" />
            <button className="btn btn-accent" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      )}

      <div className="list">
        {items.map((n) => (
          <div key={n.id} className={`card flex-row between ${n.read ? '' : ''}`} style={{ opacity: n.read ? 0.6 : 1 }}>
            <div>
              <div style={{ fontSize: 13.5 }}>{n.message}</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {!n.read && <button className="btn btn-ghost" onClick={() => markRead(n.id)}>Mark read</button>}
          </div>
        ))}
        {items.length === 0 && <div className="empty-state">You're all caught up.</div>}
      </div>
    </>
  );
}
