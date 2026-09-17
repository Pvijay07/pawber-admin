import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';
import {
  PawPrint,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldCheck,
  Activity,
  ArrowRight,
  AlertCircle,
  X,
  HelpCircle,
  CheckCircle2,
  LogOut,
  Zap,
} from 'lucide-react';
import './Login.css';

export default function Login() {
  const { user, isAdmin, signOut } = useAuth();
  const { isDark, toggle } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@pawber.com');
    setPassword('');
    setError(null);
  };

  const handleSignOutAndSwitch = async () => {
    try {
      await signOut();
      setError(null);
    } catch (err: any) {
      setError('Failed to sign out. Please try again.');
    }
  };

  return (
    <div className={`pawber-login-page ${isDark ? 'dark' : 'light'}`}>
      {/* Ambient background glow orbs */}
      <div className="login-ambient-orb login-ambient-orb-1" />
      <div className="login-ambient-orb login-ambient-orb-2" />
      <div className="login-ambient-orb login-ambient-orb-3" />
      <div className="login-grid-pattern" />

      <div className="login-split-layout">
        {/* ─── LEFT COLUMN: BRAND & PLATFORM PREVIEW ─── */}
        <div className="login-showcase-column">
          <div className="showcase-header">
            <div className="brand-badge">
              <div className="brand-icon-wrapper">
                <PawPrint size={24} />
              </div>
              <div className="brand-titles">
                <span className="brand-title">
                  Paw<span>ber</span>
                </span>
                <span className="brand-subtitle">Control Center</span>
              </div>
            </div>

            <div className="status-pill">
              <span className="status-pulse-dot" />
              <span>Systems Online</span>
            </div>
          </div>

          <div className="showcase-content">
            <div className="showcase-pill-tag">
              <Zap size={12} />
              Enterprise Administration
            </div>

            <h1 className="showcase-headline">
              Unified Pet Care <span>Operations Hub.</span>
            </h1>

            <p className="showcase-desc">
              Manage verified pet care providers, monitor live walk telemetries, resolve customer disputes, and oversee bookings in one secure, high-performance console.
            </p>

            <div className="showcase-feature-cards">
              <div className="showcase-card">
                <div className="showcase-card-icon accent">
                  <Activity size={22} />
                </div>
                <div className="showcase-card-info">
                  <h4>Real-Time Dispatch & Telemetry</h4>
                  <p>Live GPS tracking, walker safety checkpoints, and instant emergency alerts.</p>
                </div>
              </div>

              <div className="showcase-card">
                <div className="showcase-card-icon info">
                  <ShieldCheck size={22} />
                </div>
                <div className="showcase-card-info">
                  <h4>Role-Based Access Governance</h4>
                  <p>Strict access tiers, Supabase audit trails, and encrypted sensitive customer records.</p>
                </div>
              </div>

              <div className="showcase-card">
                <div className="showcase-card-icon purple">
                  <CheckCircle2 size={22} />
                </div>
                <div className="showcase-card-info">
                  <h4>Automated Provider Vetting</h4>
                  <p>Background check verifications, certification compliance, and payout audits.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="showcase-footer">
            <div className="telemetry-tag">
              <span>Pawber v2.4</span>
              <span>•</span>
              <span>Encrypted SSL</span>
              <span>•</span>
              <span>99.98% Operational Uptime</span>
            </div>
            <span>© {new Date().getFullYear()} Pawber Inc.</span>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LOGIN AUTH CONSOLE ─── */}
        <div className="login-console-column">
          <div className="login-top-bar">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggle}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <div className="login-form-card">
            <div className="console-card-header">
              <span className="console-badge">
                <ShieldCheck size={13} />
                Restricted Access
              </span>
              <h2>Administrator Sign In</h2>
              <p>Sign in with your authorized admin credentials to access the console.</p>
            </div>

            {/* Quick Demo Helper */}
            <div className="demo-fill-banner">
              <span>Quick fill for testing:</span>
              <button
                type="button"
                className="demo-fill-btn"
                onClick={handleDemoFill}
                title="Fill admin email"
              >
                <Zap size={12} />
                admin@pawber.com
              </button>
            </div>

            {/* Non-Admin Logged In Warning Callout */}
            {user && !isAdmin && (
              <div className="auth-alert-box warning">
                <AlertCircle size={18} className="auth-alert-icon" />
                <div className="auth-alert-content">
                  <strong>Non-Admin Account Detected</strong>
                  <p>
                    You are signed in as <em>{user.email}</em>, but this account lacks administrator rights.
                  </p>
                  <div className="auth-alert-actions">
                    <button
                      type="button"
                      className="signout-btn"
                      onClick={handleSignOutAndSwitch}
                    >
                      <LogOut size={13} />
                      Sign Out & Switch Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="auth-alert-box error">
                <AlertCircle size={18} className="auth-alert-icon" />
                <div className="auth-alert-content">
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form" noValidate>
              <div className="auth-form-group">
                <div className="auth-form-label-row">
                  <label htmlFor="admin-email">Email Address</label>
                </div>
                <div className="auth-input-container">
                  <div className="auth-input-icon">
                    <Mail size={18} />
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    className="auth-input"
                    placeholder="admin@pawber.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <div className="auth-form-label-row">
                  <label htmlFor="admin-password">Password</label>
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => setShowHelpModal(true)}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="auth-input-container">
                  <div className="auth-input-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-remember-row">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    className="remember-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember this workstation</span>
                </label>

                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setShowHelpModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <HelpCircle size={13} />
                  Need Help?
                </button>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="auth-spinner" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Access Console</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="console-card-footer">
              <div className="security-badges">
                <span className="security-badge-item">
                  <ShieldCheck size={13} />
                  256-Bit SSL
                </span>
                <span>•</span>
                <span className="security-badge-item">Audit Logged</span>
                <span>•</span>
                <span className="security-badge-item">Role Guard</span>
              </div>
              <p className="security-note">
                Authorized administrative personnel only. All access attempts are logged with IP & timestamp.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── HELP / RECOVERY MODAL ─── */}
      {showHelpModal && (
        <div
          className="login-modal-backdrop"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="login-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-modal-header">
              <h3>Admin Access & Recovery</h3>
              <button
                type="button"
                className="login-modal-close"
                onClick={() => setShowHelpModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="login-modal-body">
              <p>
                Admin credentials are provisioned by your system administrator or Supabase project owner.
              </p>
              <p>
                Authorized admin emails configured for automatic access:
              </p>
              <div className="login-modal-code">
                admin@pawber.com<br />
                admin@petsfolio.com
              </div>
              <p>
                To reset an admin password or invite a new administrator, log in to your Supabase project dashboard under <strong>Authentication &gt; Users</strong> or reach out to security@pawber.com.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
