import React, { useState, useEffect } from 'react';
import { Mail, ShieldAlert, Award, FileText, Send, Check } from 'lucide-react';
import Dialog from '../components/Dialog';
import { isOverdue, formatDateReadable } from '../utils/dateHelpers';

export default function Authors({ books = [], chapters = [], currentDate, addToast }) {
  const [selectedAuthorEmail, setSelectedAuthorEmail] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Email form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // 1. Derive Authors from Chapters
  const authors = React.useMemo(() => {
    const authorMap = {};
    
    chapters.forEach(chapter => {
      const email = chapter.authorEmail;
      if (!email) return;

      const isChapterOverdue = isOverdue(chapter.dueDate, chapter.status, currentDate);
      
      if (!authorMap[email]) {
        authorMap[email] = {
          name: chapter.authorName,
          email: email,
          chaptersAssigned: [],
          completedCount: 0,
          pendingCount: 0,
          overdueCount: 0
        };
      }
      
      authorMap[email].chaptersAssigned.push(chapter);
      
      if (chapter.status === 'Completed') {
        authorMap[email].completedCount += 1;
      } else if (isChapterOverdue) {
        authorMap[email].overdueCount += 1;
      } else {
        authorMap[email].pendingCount += 1;
      }
    });
    
    return Object.values(authorMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [chapters, currentDate]);

  // Set default selected author
  useEffect(() => {
    if (authors.length > 0 && !selectedAuthorEmail) {
      setSelectedAuthorEmail(authors[0].email);
    }
  }, [authors, selectedAuthorEmail]);

  // Find active author
  const activeAuthor = authors.find(a => a.email === selectedAuthorEmail) || authors[0] || null;

  // Open Compose Email Dialog
  const handleComposeEmailClick = () => {
    if (!activeAuthor) return;

    const overdueList = activeAuthor.chaptersAssigned
      .filter(c => isOverdue(c.dueDate, c.status, currentDate))
      .map(c => `- Ch ${c.chapterNumber}: "${c.chapterTitle}" (Due: ${formatDateReadable(c.dueDate)})`)
      .join('\n');

    const pendingList = activeAuthor.chaptersAssigned
      .filter(c => c.status !== 'Completed' && !isOverdue(c.dueDate, c.status, currentDate))
      .map(c => `- Ch ${c.chapterNumber}: "${c.chapterTitle}" (Due: ${formatDateReadable(c.dueDate)}, Current Status: ${c.status})`)
      .join('\n');

    setEmailSubject(`Urgent: Book Chapter Submission Status Update`);
    
    let body = `Dear ${activeAuthor.name},\n\nI hope this email finds you well.\n\nI am writing to check in on the progress of your chapter submissions for our upcoming academic publication. Below is the current status of your assigned chapters:\n\n`;
    
    if (overdueList) {
      body += `OVERDUE CHAPTERS:\n${overdueList}\n\n`;
    }
    
    if (pendingList) {
      body += `UPCOMING CHAPTERS:\n${pendingList}\n\n`;
    }
    
    body += `Please let me know if you need any assistance or if we need to adjust the schedule.\n\nBest regards,\nDr. Clara Sterling\nLead Academic Editor`;

    setEmailBody(body);
    setIsEmailModalOpen(true);
  };

  // Send simulated reminder email
  const handleSendEmail = (e) => {
    e.preventDefault();
    if (!activeAuthor) return;

    addToast(`Reminder email successfully dispatched to ${activeAuthor.name} (${activeAuthor.email})!`, 'success');
    setIsEmailModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Author Management</h1>
          <span className="page-subtitle">View author profiles, assignment status, and trigger email alerts</span>
        </div>
      </div>

      {authors.length > 0 ? (
        <div className="authors-container">
          {/* Left Column: Author List */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
              All Contributing Authors ({authors.length})
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '580px' }}>
              {authors.map(author => (
                <div
                  key={author.email}
                  className={`author-item-row ${selectedAuthorEmail === author.email ? 'active' : ''}`}
                  onClick={() => setSelectedAuthorEmail(author.email)}
                >
                  <div className="author-item-info">
                    <span className="author-item-name">{author.name}</span>
                    <span className="author-item-email">{author.email}</span>
                  </div>
                  
                  <div className="author-item-badge-group">
                    {author.overdueCount > 0 && (
                      <span className="text-badge text-badge-danger" title={`${author.overdueCount} Overdue`}>
                        {author.overdueCount} Overdue
                      </span>
                    )}
                    {author.pendingCount > 0 && (
                      <span className="text-badge text-badge-warning" title={`${author.pendingCount} Pending`}>
                        {author.pendingCount} Pending
                      </span>
                    )}
                    {author.completedCount > 0 && (
                      <span className="text-badge text-badge-success" title={`${author.completedCount} Completed`}>
                        {author.completedCount} Done
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Author Profiles & Chapters */}
          {activeAuthor && (
            <div className="author-profile-card glass-card">
              <div className="author-profile-header">
                <div className="author-profile-meta">
                  <span className="author-profile-name">{activeAuthor.name}</span>
                  <span className="author-profile-email">{activeAuthor.email}</span>
                </div>
                <button className="btn btn-primary" onClick={handleComposeEmailClick}>
                  <Mail size={16} />
                  Send Reminder
                </button>
              </div>

              {/* Stats boxes */}
              <div className="author-stats-summary">
                <div className="author-stat-box">
                  <div className="author-stat-box-val" style={{ '--stat-color': 'var(--accent-success)' }}>
                    {activeAuthor.completedCount}
                  </div>
                  <div className="author-stat-box-lbl">Completed</div>
                </div>
                <div className="author-stat-box">
                  <div className="author-stat-box-val" style={{ '--stat-color': 'var(--accent-orange)' }}>
                    {activeAuthor.pendingCount}
                  </div>
                  <div className="author-stat-box-lbl">Pending</div>
                </div>
                <div className="author-stat-box">
                  <div className="author-stat-box-val" style={{ '--stat-color': 'var(--accent-danger)' }}>
                    {activeAuthor.overdueCount}
                  </div>
                  <div className="author-stat-box-lbl">Overdue</div>
                </div>
              </div>

              {/* Assigned Chapters Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Assigned Chapters & Submissions ({activeAuthor.chaptersAssigned.length})
                </h3>

                <div className="author-chapters-list" style={{ overflowY: 'auto', maxHeight: '280px', paddingRight: '0.5rem' }}>
                  {activeAuthor.chaptersAssigned.map(chapter => {
                    const book = books.find(b => b.id === chapter.bookId);
                    const isChapterOverdue = isOverdue(chapter.dueDate, chapter.status, currentDate);
                    
                    let statusClass = 'notstarted';
                    if (isChapterOverdue) statusClass = 'overdue';
                    else if (chapter.status === 'Completed') statusClass = 'completed';
                    else if (chapter.status === 'In Progress') statusClass = 'inprogress';
                    else if (['Submitted', 'Under Review', 'Revision Requested'].includes(chapter.status)) statusClass = 'review';

                    return (
                      <div key={chapter.id} className="author-chapter-card">
                        <div className="author-chapter-card-header">
                          <div>
                            <span className="author-chapter-book">Book: {book?.title || 'Unknown Project'}</span>
                            <h4 className="author-chapter-title">Ch {chapter.chapterNumber}: {chapter.chapterTitle}</h4>
                          </div>
                          <span className={`status-badge ${statusClass}`}>
                            {isChapterOverdue ? 'Overdue' : chapter.status}
                          </span>
                        </div>
                        
                        <div className="author-chapter-meta">
                          <span>Deadline: {formatDateReadable(chapter.dueDate)}</span>
                          {chapter.submissionDate ? (
                            <span style={{ color: 'var(--accent-success)' }}>
                              Submitted: {formatDateReadable(chapter.submissionDate)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Not Submitted Yet</span>
                          )}
                        </div>
                        {chapter.editorNotes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--border-color)', marginTop: '0.25rem' }}>
                            <strong>Editor Notes:</strong> {chapter.editorNotes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state glass-card">
          <Mail size={48} />
          <h3>No Authors Found</h3>
          <p>Authors are automatically generated when you add chapters to your books.</p>
        </div>
      )}

      {/* Compose Email Modal */}
      <Dialog
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title={`Compose Reminder Email to ${activeAuthor?.name}`}
      >
        <form onSubmit={handleSendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Recipient Email</label>
            <input
              type="text"
              className="form-input"
              value={activeAuthor?.email || ''}
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Subject</label>
            <input
              type="text"
              className="form-input"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message Body</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '220px' }}
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              required
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsEmailModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Send size={14} />
              Send Simulated Email
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
