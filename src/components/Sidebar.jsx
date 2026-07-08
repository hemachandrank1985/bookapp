import React from 'react';
import { LayoutDashboard, BookOpen, BookMarked, Users, FileText, Bell, LogOut, Shield } from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, notificationCount, currentUser, onLogout }) {
  const navItems = React.useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'books', label: 'Books', icon: BookOpen },
      { id: 'chapters', label: 'Chapters', icon: BookMarked }
    ];

    if (currentUser?.role === 'Admin') {
      items.push({ id: 'managers', label: 'Managers', icon: Users });
    } else {
      items.push({ id: 'authors', label: 'Authors', icon: Users });
    }

    items.push(
      { id: 'reports', label: 'Reports', icon: FileText },
      { id: 'notifications', label: 'Notifications', icon: Bell, badge: true }
    );

    return items;
  }, [currentUser]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <BookMarked size={28} className="toast-icon-info" />
        <h2>BookFlow Portal</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(item.id)}
            >
              <div className="sidebar-link-content">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && notificationCount > 0 && (
                <span className="sidebar-badge">{notificationCount}</span>
              )}
            </button>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="sidebar-link"
          style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', borderRadius: 0, paddingTop: '1.25rem', color: 'rgba(239, 68, 68, 0.85)' }}
          title="Sign out of BookFlow Portal"
        >
          <div className="sidebar-link-content">
            <LogOut size={18} />
            <span>Logout</span>
          </div>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
          {currentUser?.role === 'Admin' ? <Shield size={12} className="toast-icon-info" /> : <Users size={12} className="toast-icon-success" />}
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{currentUser?.name}</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Logged in as {currentUser?.role}
        </div>
      </div>
    </aside>
  );
}
