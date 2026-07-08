import React, { useState } from 'react';
import { BookOpen, User, Mail, Lock, Key } from 'lucide-react';

export default function RegisterAdmin({ admins, onRegister, onBackToLogin, addToast }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Default security code to prevent random admin signups
  const SECURITY_CODE = 'BOOKFLOW2026';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !inviteCode) {
      addToast('Please fill in all fields.', 'warning');
      return;
    }

    if (inviteCode !== SECURITY_CODE) {
      addToast('Invalid Security Invite Code. Registration denied.', 'error');
      return;
    }

    // Delegate creation back to App.jsx to query backend Express API
    onRegister({
      name,
      email: email.toLowerCase(),
      password
    });
  };

  const hasAdmins = admins && admins.length > 0;

  return (
    <div className="login-wrapper">
      <div className="login-background"></div>
      
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-logo-container">
            <BookOpen size={36} className="login-logo-icon" />
          </div>
          <h1>Register Administrator</h1>
          <p className="login-subtitle">Configure the primary academic editorial account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="filter-input-search">
              <User size={16} style={{ left: '12px' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. Dr. Clara Sterling"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
          </div>

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
            <label className="form-label">Security Password</label>
            <div className="filter-input-search">
              <Lock size={16} style={{ left: '12px' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Choose a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Security Invite Code (Use: BOOKFLOW2026)</label>
            <div className="filter-input-search">
              <Key size={16} style={{ left: '12px' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Enter invite code to register"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}>
            Register & Log In
          </button>
        </form>

        {hasAdmins && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '0.6rem' }} 
              onClick={onBackToLogin}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
