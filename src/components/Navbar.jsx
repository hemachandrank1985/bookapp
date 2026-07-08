import React from 'react';
import { Calendar, Shield, Users } from 'lucide-react';
import { formatDateReadable } from '../utils/dateHelpers';

export default function Navbar({ currentDate, setCurrentDate, currentUser }) {
  const handleDateChange = (e) => {
    if (e.target.value) {
      setCurrentDate(e.target.value);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        Book Workflow Editor Portal
      </div>

      <div className="navbar-actions">
        {/* Date override widget */}
        <div className="nav-date-picker" title="Change simulated system date to test overdue status">
          <Calendar size={14} />
          <span>Simulated Today:</span>
          <input
            type="date"
            className="nav-date-input"
            value={currentDate}
            onChange={handleDateChange}
          />
        </div>

        {/* User profile info */}
        {currentUser && (
          <div className="nav-user">
            <div className="nav-user-avatar">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="nav-user-info">
              <span className="nav-user-name" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {currentUser.name}
                {currentUser.role === 'Admin' ? (
                  <span className="text-badge text-badge-danger" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>Admin</span>
                ) : (
                  <span className="text-badge text-badge-success" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>PM</span>
                )}
              </span>
              <span className="nav-user-role">{currentUser.role === 'Admin' ? 'Administrator' : 'Project Manager'}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
