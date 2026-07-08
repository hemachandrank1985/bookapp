import React, { useState } from 'react';
import { BookOpen, Shield, Users, Mail, Lock } from 'lucide-react';

export default function Login({ adminsCount, onLogin, onNavigateToRegister, addToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password.', 'warning');
      return;
    }
    
    // Dispatch login action back to App.jsx to handle async API connection
    onLogin({ email, password });
  };

  const hasAdmins = adminsCount > 0;

  return (
    <div className="login-wrapper">
      <div className="login-background"></div>
      
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-logo-container">
            <BookOpen size={36} className="login-logo-icon" />
          </div>
          <h1>BookFlow Portal</h1>
          <p className="login-subtitle">Academic Book Chapter Workflow Management</p>
        </div>

        {!hasAdmins ? (
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <div className="alert-item" style={{ borderLeftColor: 'var(--accent-warning)', background: 'rgba(234, 179, 8, 0.05)', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div className="alert-item-content">
                <strong className="alert-item-title" style={{ color: 'var(--accent-warning)' }}>Initial Setup Required</strong>
                <span className="alert-item-desc" style={{ fontSize: '0.8rem' }}>No administrator accounts are registered in the database. Please register the primary Administrator account to configure the portal.</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.8rem' }}
              onClick={onNavigateToRegister}
            >
              Register Primary Admin
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="filter-input-search">
                  <Mail size={16} style={{ left: '12px' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. clara.sterling@bookflow.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="filter-input-search">
                  <Lock size={16} style={{ left: '12px' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}>
                Access Portal
              </button>
            </form>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem' }}
                onClick={onNavigateToRegister}
              >
                Register another Admin Account
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
