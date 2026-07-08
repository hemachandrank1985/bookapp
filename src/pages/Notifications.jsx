import React from 'react';
import { Bell, Clock, AlertTriangle, ShieldAlert, Eye, CheckCircle2 } from 'lucide-react';
import { isOverdue, isDueWithinRange, formatDateReadable } from '../utils/dateHelpers';

export default function Notifications({
  books = [],
  chapters = [],
  currentDate,
  acknowledgedAlertKeys = [],
  setAcknowledgedAlertKeys,
  addToast,
  setCurrentTab,
  setSelectedBookId
}) {
  
  // 1. Generate active alerts based on current chapters and date
  const alerts = React.useMemo(() => {
    const list = [];
    
    chapters.forEach(chapter => {
      const book = books.find(b => b.id === chapter.bookId);
      const bookTitle = book ? book.title : 'Unknown Book';
      
      // Category A: Overdue
      if (isOverdue(chapter.dueDate, chapter.status, currentDate)) {
        const key = `${chapter.id}-overdue`;
        list.push({
          key,
          id: chapter.id,
          bookId: chapter.bookId,
          type: 'overdue',
          title: `Chapter ${chapter.chapterNumber} Overdue`,
          message: `"${chapter.chapterTitle}" assigned to ${chapter.authorName} was due on ${formatDateReadable(chapter.dueDate)}.`,
          dueDate: chapter.dueDate,
          bookTitle,
          authorName: chapter.authorName,
          severity: 'danger'
        });
      }
      
      // Category B: Due in next 7 days
      else if (isDueWithinRange(chapter.dueDate, currentDate, 7, chapter.status)) {
        const key = `${chapter.id}-due7`;
        list.push({
          key,
          id: chapter.id,
          bookId: chapter.bookId,
          type: 'due7',
          title: `Due in Next 7 Days`,
          message: `"${chapter.chapterTitle}" (Ch ${chapter.chapterNumber}) is due on ${formatDateReadable(chapter.dueDate)}.`,
          dueDate: chapter.dueDate,
          bookTitle,
          authorName: chapter.authorName,
          severity: 'warning'
        });
      }
      
      // Category C: Awaiting Review
      if (['Submitted', 'Under Review'].includes(chapter.status)) {
        const key = `${chapter.id}-review`;
        list.push({
          key,
          id: chapter.id,
          bookId: chapter.bookId,
          type: 'review',
          title: `Awaiting Editor Review`,
          message: `"${chapter.chapterTitle}" (Ch ${chapter.chapterNumber}) by ${chapter.authorName} was marked as "${chapter.status}".`,
          dueDate: chapter.dueDate,
          bookTitle,
          authorName: chapter.authorName,
          severity: 'info'
        });
      }
    });
    
    return list;
  }, [chapters, books, currentDate]);

  // Filter out acknowledged ones
  const activeAlerts = alerts.filter(alert => !acknowledgedAlertKeys.includes(alert.key));
  
  // Categorized lists
  const overdueAlerts = activeAlerts.filter(a => a.type === 'overdue');
  const upcomingAlerts = activeAlerts.filter(a => a.type === 'due7');
  const reviewAlerts = activeAlerts.filter(a => a.type === 'review');

  const handleAcknowledge = (key, title) => {
    setAcknowledgedAlertKeys(prev => [...prev, key]);
    addToast(`Alert "${title}" acknowledged.`, 'success');
  };

  const handleAcknowledgeAll = () => {
    const unackedKeys = activeAlerts.map(a => a.key);
    if (unackedKeys.length === 0) return;
    setAcknowledgedAlertKeys(prev => [...prev, ...unackedKeys]);
    addToast('All active alerts acknowledged.', 'success');
  };

  const handleActionClick = (bookId) => {
    setSelectedBookId(bookId);
    setCurrentTab('chapters');
  };

  const renderAlertIcon = (severity) => {
    switch (severity) {
      case 'danger':
        return <ShieldAlert size={18} style={{ color: 'var(--accent-danger)' }} />;
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--accent-orange)' }} />;
      case 'info':
      default:
        return <Clock size={18} style={{ color: 'var(--accent-primary)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Notifications & Alerts</h1>
          <span className="page-subtitle">Track immediate deadlines, overdue reviews, and editor-actionable tasks</span>
        </div>
        {activeAlerts.length > 0 && (
          <button className="btn btn-secondary" onClick={handleAcknowledgeAll}>
            <CheckCircle2 size={16} />
            Acknowledge All
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section 1: Overdue Chapters */}
        <div className="glass-card layout-card">
          <h2 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-danger)', marginBottom: '1rem' }}>
            <ShieldAlert size={20} />
            Overdue Submissions ({overdueAlerts.length})
          </h2>
          
          {overdueAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {overdueAlerts.map(alert => (
                <div key={alert.key} className="alert-item" style={{ borderLeftColor: 'var(--accent-danger)' }}>
                  <div className="alert-item-content">
                    <strong className="alert-item-title">{alert.title}</strong>
                    <span className="alert-item-desc">{alert.message}</span>
                    <span className="alert-item-meta">Book: {alert.bookTitle} | Author: {alert.authorName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', gap: '0.25rem' }}
                      onClick={() => handleActionClick(alert.bookId)}
                    >
                      <Eye size={12} />
                      Track
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                      onClick={() => handleAcknowledge(alert.key, alert.title)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No unacknowledged overdue alerts.</p>
          )}
        </div>

        {/* Section 2: Due in 7 Days */}
        <div className="glass-card layout-card">
          <h2 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-orange)', marginBottom: '1rem' }}>
            <Clock size={20} />
            Upcoming Deadlines (Next 7 Days) ({upcomingAlerts.length})
          </h2>
          
          {upcomingAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {upcomingAlerts.map(alert => (
                <div key={alert.key} className="alert-item" style={{ borderLeftColor: 'var(--accent-orange)', background: 'rgba(249, 115, 22, 0.03)' }}>
                  <div className="alert-item-content">
                    <strong className="alert-item-title" style={{ color: '#fed7aa' }}>{alert.title}</strong>
                    <span className="alert-item-desc">{alert.message}</span>
                    <span className="alert-item-meta">Book: {alert.bookTitle} | Author: {alert.authorName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', gap: '0.25rem' }}
                      onClick={() => handleActionClick(alert.bookId)}
                    >
                      <Eye size={12} />
                      Track
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                      onClick={() => handleAcknowledge(alert.key, alert.title)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No upcoming deadlines in the next 7 days.</p>
          )}
        </div>

        {/* Section 3: Awaiting Editor Review */}
        <div className="glass-card layout-card">
          <h2 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
            <Bell size={20} />
            Submissions Awaiting Review ({reviewAlerts.length})
          </h2>
          
          {reviewAlerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reviewAlerts.map(alert => (
                <div key={alert.key} className="alert-item" style={{ borderLeftColor: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.03)' }}>
                  <div className="alert-item-content">
                    <strong className="alert-item-title" style={{ color: '#c7d2fe' }}>{alert.title}</strong>
                    <span className="alert-item-desc">{alert.message}</span>
                    <span className="alert-item-meta">Book: {alert.bookTitle} | Author: {alert.authorName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', gap: '0.25rem' }}
                      onClick={() => handleActionClick(alert.bookId)}
                    >
                      <Eye size={12} />
                      Review
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                      onClick={() => handleAcknowledge(alert.key, alert.title)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No submissions currently awaiting your review.</p>
          )}
        </div>
      </div>
    </div>
  );
}
