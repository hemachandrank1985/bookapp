import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, User } from 'lucide-react';
import Dialog from '../components/Dialog';
import { formatDateReadable } from '../utils/dateHelpers';

export default function Books({
  books = [],
  chapters = [],
  addToast,
  setCurrentTab,
  setSelectedBookId,
  currentUser,
  managers = [],
  refreshData
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [publisher, setPublisher] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [editorName, setEditorName] = useState('Dr. Clara Sterling');
  const [totalChapters, setTotalChapters] = useState(5);
  const [status, setStatus] = useState('Planning');
  const [assignedManagerId, setAssignedManagerId] = useState('');

  const isAdmin = currentUser?.role === 'Admin';

  // Filter books based on user role (Admin sees all; Manager sees only theirs)
  const visibleBooks = isAdmin 
    ? books 
    : books.filter(b => b.assignedManagerId === currentUser.id);

  // Open modal for Adding (Admin-only)
  const handleAddClick = () => {
    if (!isAdmin) return;
    setEditingBook(null);
    setTitle('');
    setDiscipline('');
    setPublisher('');
    setTargetDate('');
    setEditorName('Dr. Clara Sterling');
    setTotalChapters(5);
    setStatus('Planning');
    setAssignedManagerId(managers[0]?.id || '');
    setIsModalOpen(true);
  };

  // Open modal for Editing (Admin-only)
  const handleEditClick = (book) => {
    if (!isAdmin) return;
    setEditingBook(book);
    setTitle(book.title);
    setDiscipline(book.discipline);
    setPublisher(book.publisher);
    setTargetDate(book.targetPublicationDate);
    setEditorName(book.editorName);
    setTotalChapters(book.totalChapters);
    setStatus(book.status);
    setAssignedManagerId(book.assignedManagerId || '');
    setIsModalOpen(true);
  };

  // Handle Save (Admin-only)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!title || !discipline || !publisher || !targetDate) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }

    const payload = {
      title,
      discipline,
      publisher,
      targetPublicationDate: targetDate,
      editorName,
      totalChapters: Number(totalChapters),
      status,
      assignedManagerId: assignedManagerId || null
    };

    try {
      let res;
      if (editingBook) {
        // Edit API Call
        res = await fetch(`/api/books/${editingBook.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Add API Call
        res = await fetch('/api/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        addToast(`Book "${title}" saved successfully!`, 'success');
        setIsModalOpen(false);
        refreshData(); // Reload collections from database
      } else {
        const errData = await res.json();
        addToast(errData.error || 'Failed to save book project.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving book project.', 'error');
    }
  };

  // Handle Delete (Admin-only)
  const handleDeleteClick = async (bookId, bookTitle) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to delete "${bookTitle}"? This will permanently delete the book and all its chapters from MongoDB.`)) {
      try {
        const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
        if (res.ok) {
          addToast(`Book "${bookTitle}" and all its chapters successfully deleted.`, 'info');
          refreshData(); // Reload collections from database
        } else {
          addToast('Failed to delete book.', 'error');
        }
      } catch (err) {
        console.error(err);
        addToast('Error deleting book.', 'error');
      }
    }
  };

  // Calculate progress metrics
  const getBookProgress = (bookId, totalExpected) => {
    const bookChapters = chapters.filter(c => c.bookId === bookId);
    const submittedCount = bookChapters.filter(c => 
      ['Submitted', 'Under Review', 'Revision Requested', 'Completed'].includes(c.status)
    ).length;

    const percentage = totalExpected > 0 ? Math.round((submittedCount / totalExpected) * 100) : 0;
    return {
      submittedCount,
      percentage: Math.min(percentage, 100)
    };
  };

  const handleViewChapters = (bookId) => {
    setSelectedBookId(bookId);
    setCurrentTab('chapters');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Books Management</h1>
          <span className="page-subtitle">
            {isAdmin 
              ? 'Administrator View: Configure books, target dates, and allocate ownership to managers' 
              : 'Project Manager View: Track submission progress for your allocated publications'}
          </span>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleAddClick}>
            <Plus size={16} />
            Add New Book
          </button>
        )}
      </div>

      {/* Grid of Books */}
      {visibleBooks.length > 0 ? (
        <div className="books-grid">
          {visibleBooks.map(book => {
            const progress = getBookProgress(book.id, book.totalChapters);
            const manager = managers.find(m => m.id === book.assignedManagerId);
            
            // Status color mapping for card badge
            let badgeClass = 'notstarted';
            if (book.status === 'Completed') badgeClass = 'completed';
            else if (book.status === 'Active') badgeClass = 'inprogress';
            else if (book.status === 'Under Review') badgeClass = 'review';

            return (
              <div key={book.id} className="book-card glass-card">
                <div className="book-card-header">
                  <div>
                    <span className="book-discipline">{book.discipline}</span>
                    <h3 className="book-title">{book.title}</h3>
                  </div>
                  <span className={`status-badge ${badgeClass}`}>{book.status}</span>
                </div>

                <div className="book-meta">
                  <div className="book-meta-item">
                    <span className="book-meta-label">Publisher</span>
                    <span className="book-meta-value">{book.publisher}</span>
                  </div>
                  <div className="book-meta-item">
                    <span className="book-meta-label">Target Date</span>
                    <span className="book-meta-value">{formatDateReadable(book.targetPublicationDate)}</span>
                  </div>
                  <div className="book-meta-item">
                    <span className="book-meta-label">Assigned Manager</span>
                    <span className="book-meta-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: manager ? 'var(--text-primary)' : 'var(--accent-orange)' }}>
                      <User size={12} />
                      {manager ? manager.name : 'Unassigned'}
                    </span>
                  </div>
                  <div className="book-meta-item">
                    <span className="book-meta-label">Total Chapters</span>
                    <span className="book-meta-value">{book.totalChapters}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="book-progress">
                  <div className="book-progress-info">
                    <span>Submission Progress</span>
                    <span>{progress.submittedCount} / {book.totalChapters} Ch ({progress.percentage}%)</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress.percentage}%` }}></div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="book-actions">
                  {isAdmin && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        onClick={() => handleEditClick(book)}
                        title="Edit Book Details"
                      >
                        <Edit2 size={13} />
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                        onClick={() => handleDeleteClick(book.id, book.title)}
                        title="Delete Book"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', gap: '0.25rem' }}
                    onClick={() => handleViewChapters(book.id)}
                    title="View Chapter Details"
                  >
                    <Eye size={13} />
                    Tracker
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state glass-card">
          <BookOpen size={48} />
          <h3>No Books Allocated</h3>
          <p>
            {isAdmin 
              ? 'Get started by creating your first academic book.' 
              : 'You do not have any publications allocated to your profile yet.'}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleAddClick}>
              <Plus size={16} />
              Add New Book
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Book Modal Dialog (Admin-only) */}
      {isAdmin && (
        <Dialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingBook ? 'Edit Book Details' : 'Add New Book'}
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Book Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Principles of Quantum Computing"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Subject / Discipline *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Science"
                  value={discipline}
                  onChange={e => setDiscipline(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Publisher *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Academic Press"
                  value={publisher}
                  onChange={e => setPublisher(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Target Publication Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Total Expected Chapters</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="form-input"
                  value={totalChapters}
                  onChange={e => setTotalChapters(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Allocate to Manager *</label>
                <select
                  className="form-select"
                  value={assignedManagerId}
                  onChange={e => setAssignedManagerId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a Manager</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Book Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Planning">Planning</option>
                  <option value="Active">Active</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Book Project
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
