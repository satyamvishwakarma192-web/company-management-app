import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><span className="mark" /> Company OS</div>
        <p className="tag">
          {mode === 'login' ? 'Sign in to manage your organization.' : 'Create the first owner account for your company.'}
        </p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={update('name')} required placeholder="Satyam Sharma" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={update('email')} required placeholder="you@company.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={update('password')} required minLength={6} placeholder="••••••••" />
          </div>
          {mode === 'register' && (
            <div className="field">
              <label>Department (optional)</label>
              <input value={form.department} onChange={update('department')} placeholder="Engineering" />
            </div>
          )}
          <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="toggle-row">
          {mode === 'login' ? (
            <>No account yet? <button onClick={() => setMode('register')}>Register</button></>
          ) : (
            <>Already have one? <button onClick={() => setMode('login')}>Sign in</button></>
          )}
        </div>

        {mode === 'login' && (
          <div className="demo-hint">
            Demo accounts (password <code>password123</code>):<br />
            Owner &nbsp;<code>owner@company.com</code><br />
            Manager <code>manager@company.com</code><br />
            Employee <code>rahul@company.com</code>
          </div>
        )}
      </div>
    </div>
  );
}
