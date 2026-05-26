import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <ShieldAlert size={32} className="text-primary" />
          </div>
          <h1>Admin Portal</h1>
          <p>Login to access the Pawber Control Center</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} />
                <input
                type="email"
                placeholder="admin@pawber.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Secure system access only.</p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 20px;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-secondary);
          padding: 40px;
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .login-logo {
          width: 64px;
          height: 64px;
          background: var(--primary-light);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .login-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .login-header p {
          color: var(--text-muted);
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .login-error {
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger);
          border-radius: 12px;
          color: var(--danger);
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
        }
        .w-full { width: 100%; }
        .login-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
