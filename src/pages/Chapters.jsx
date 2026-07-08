import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Dialog from '../components/Dialog';
import { isOverdue, formatDateReadable } from '../utils/dateHelpers';

export default function Chapters({
  books = [],
  chapters = [],
  currentDate,
  addToast,
  selectedBookId,
  setSelectedBookId,
  currentUser,
  refreshData
}) {
  // Filters State
  const [statusFilter, setStatusFilter] = useState('All');
  const [authorSearch, setAuthorSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting State
  const [sortField, setSortField] = useState('chapterNumber');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Modals state
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [noteChapter, setNoteChapter] = useState(null);

  // Form State for Chapter Modal
  const [bookId, setBookId] = useState('');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [status, setStatus] = useState('Not Started');
  const [dueDate, setDueDate] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [editorNotes, setEditorNotes] = useState('');

  const isManager = currentUser?.role === 'Manager';

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBookId, statusFilter, authorSearch, startDate, endDate]);

  // Set default book selection if selectedBookId changes
  useEffect(() => {
    if (selectedBookId) {
      setBookId(selectedBookId);
    } else if (books.length > 0) {
      setBookId('All');
    }
  }, [selectedBookId, books]);

  // Update chapter on MongoDB
  const updateChapterApi = async (chapterId, updatedFields) => {
    const original = chapters.find(c => c.id === chapterId);
    if (!original) return;

    const payload = {
      bookId: original.bookId,
      chapterNumber: original.chapterNumber,
      chapterTitle: original.chapterTitle,
      authorName: original.authorName,
      authorEmail: original.authorEmail,
      status: original.status,
      dueDate: original.dueDate,
      submissionDate: original.submissionDate,
      editorNotes: original.editorNotes,
      ...updatedFields
    };

    try {
      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        refreshData();
        return true;
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to update chapter.', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      addToast('Error communicating with database.', 'error');
      return false;
    }
  };

  // Handle Inline Status Change (Manager-only)
  const handleInlineStatusChange = async (chapterId, newStatus) => {
    if (!isManager) {
      addToast('Only allocated Managers can edit chapter progress.', 'warning');
      return;
    }

    const original = chapters.find(c => c.id === chapterId);
    let updatedSubDate = original.submissionDate;
    
    if (['Submitted', 'Completed'].includes(newStatus) && !original.submissionDate) {
      updatedSubDate = currentDate;
    } else if (!['Submitted', 'Completed'].includes(newStatus)) {
      updatedSubDate = null;
    }

    const success = await updateChapterApi(chapterId, {
      status: newStatus,
      submissionDate: updatedSubDate
    });

    if (success) {
      addToast(`Chapter ${original.chapterNumber} status updated to "${newStatus}".`, 'success');
    }
  };

  // Handle Inline Date Change (Manager-only)
  const handleInlineDateChange = async (chapterId, newDate) => {
    if (!isManager) {
      addToast('Only allocated Managers can edit chapter deadlines.', 'warning');
      return;
    }

    const success = await updateChapterApi(chapterId, { dueDate: newDate });
    if (success) {
      addToast(`Chapter deadline updated successfully.`, 'success');
    }
  };

  // Open Edit Note Modal
  const handleNotesClick = (chapter) => {
    setNoteChapter(chapter);
    setEditorNotes(chapter.editorNotes || '');
    setIsNotesModalOpen(true);
  };

  // Save Notes Modal
  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!isManager) {
      addToast('Only Managers can edit notes.', 'warning');
      setIsNotesModalOpen(false);
      return;
    }
    
    if (!noteChapter) return;
    
    const success = await updateChapterApi(noteChapter.id, { editorNotes });
    if (success) {
      addToast('Editor notes updated.', 'success');
      setIsNotesModalOpen(false);
    }
  };

  // Open Add Chapter (Manager-only)
  const handleAddClick = () => {
    if (!isManager) return;
    setEditingChapter(null);
    setChapterNumber(chapters.filter(c => c.bookId === String(bookId)).length + 1 || 1);
    setChapterTitle('');
    setAuthorName('');
    setAuthorEmail('');
    setStatus('Not Started');
    setDueDate('');
    setSubmissionDate('');
    setEditorNotes('');
    setIsChapterModalOpen(true);
  };

  // Open Edit Chapter (Manager-only)
  const handleEditClick = (chapter) => {
    if (!isManager) return;
    setEditingChapter(chapter);
    setBookId(chapter.bookId);
    setChapterNumber(chapter.chapterNumber);
    setChapterTitle(chapter.chapterTitle);
    setAuthorName(chapter.authorName);
    setAuthorEmail(chapter.authorEmail);
    setStatus(chapter.status);
    setDueDate(chapter.dueDate || '');
    setSubmissionDate(chapter.submissionDate || '');
    setEditorNotes(chapter.editorNotes || '');
    setIsChapterModalOpen(true);
  };

  // Save Chapter Modal (Manager-only)
  const handleSaveChapter = async (e) => {
    e.preventDefault();
    if (!isManager) return;

    if (!bookId || bookId === 'All' || !chapterTitle || !authorName || !authorEmail || !dueDate) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }

    let finalSubDate = submissionDate || null;
    if (['Submitted', 'Completed'].includes(status) && !finalSubDate) {
      finalSubDate = currentDate;
    }

    const payload = {
      bookId: String(bookId),
      chapterNumber: Number(chapterNumber),
      chapterTitle,
      authorName,
      authorEmail,
      status,
      dueDate,
      submissionDate: finalSubDate,
      editorNotes
    };

    try {
      let res;
      if (editingChapter) {
        res = await fetch(`/api/chapters/${editingChapter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        addToast(`Chapter saved successfully!`, 'success');
        setIsChapterModalOpen(false);
        refreshData();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to save chapter.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving chapter.', 'error');
    }
  };

  // Delete Chapter (Manager-only)
  const handleDeleteClick = async (chapterId, title) => {
    if (!isManager) return;
    if (window.confirm(`Are you sure you want to delete chapter "${title}"?`)) {
      try {
        const res = await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' });
        if (res.ok) {
          addToast(`Chapter deleted.`, 'info');
          refreshData();
        } else {
          addToast('Failed to delete chapter.', 'error');
        }
      } catch (err) {
        console.error(err);
        addToast('Error deleting chapter.', 'error');
      }
    }
  };

  // Toggle Sorting
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Sort Pipeline
  const filteredChapters = chapters
    .filter(chapter => {
      // Must be a chapter of the visible books
      const visibleBookIds = books.map(b => b.id);
      if (!visibleBookIds.includes(chapter.bookId)) return false;

      // Book filter
      if (selectedBookId && selectedBookId !== 'All' && chapter.bookId !== String(selectedBookId)) {
        return false;
      }
      
      // Status filter
      if (statusFilter !== 'All') {
        const isOverdueItem = isOverdue(chapter.dueDate, chapter.status, currentDate);
        if (statusFilter === 'Overdue' && !isOverdueItem) return false;
        if (statusFilter !== 'Overdue' && isOverdueItem) return false;
        if (statusFilter !== 'Overdue' && chapter.status !== statusFilter) return false;
      }

      // Author search
      if (authorSearch && !chapter.authorName.toLowerCase().includes(authorSearch.toLowerCase())) {
        return false;
      }

      // Date range filter
      if (startDate && chapter.dueDate && chapter.dueDate < startDate) return false;
      if (endDate && chapter.dueDate && chapter.dueDate > endDate) return false;

      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortField === 'dueDate') {
        valA = a.dueDate || '';
        valB = b.dueDate || '';
      } else if (sortField === 'status') {
        const statusWeight = {
          'Overdue': 0,
          'Revision Requested': 1,
          'Under Review': 2,
          'Submitted': 3,
          'In Progress': 4,
          'Not Started': 5,
          'Completed': 6
        };
        const statusA = isOverdue(a.dueDate, a.status, currentDate) ? 'Overdue' : a.status;
        const statusB = isOverdue(b.dueDate, b.status, currentDate) ? 'Overdue' : b.status;
        valA = statusWeight[statusA] ?? 9;
        valB = statusWeight[statusB] ?? 9;
      } else {
        valA = a.chapterNumber;
        valB = b.chapterNumber;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Paginated chapters
  const totalRows = filteredChapters.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedChapters = filteredChapters.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const getRowClass = (chapter) => {
    if (isOverdue(chapter.dueDate, chapter.status, currentDate)) return 'row-overdue';
    
    switch (chapter.status) {
      case 'Completed': return 'row-completed';
      case 'In Progress': return 'row-inprogress';
      case 'Submitted':
      case 'Under Review':
      case 'Revision Requested':
        return 'row-review';
      case 'Not Started':
      default:
        return 'row-notstarted';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Chapter Tracker</h1>
          <span className="page-subtitle">
            {isManager 
              ? 'Manager Dashboard: View, edit progress, alter deadlines, and add comments' 
              : 'Administrator View: Read-only summary of active chapter submissions'}
          </span>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={handleAddClick} disabled={!selectedBookId || selectedBookId === 'All'}>
            <Plus size={16} />
            Add Chapter
          </button>
        )}
      </div>

      {/* Book selector & filters */}
      <div className="filter-row">
        <div className="filter-item">
          <label className="form-label">Active Book Project</label>
          <select
            className="form-select"
            value={selectedBookId || 'All'}
            onChange={e => setSelectedBookId(e.target.value === 'All' ? 'All' : String(e.target.value))}
          >
            <option value="All">All Books</option>
            {books.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label className="form-label">Status Filter</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Revision Requested">Revision Requested</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        <div className="filter-item" style={{ flex: 1.5 }}>
          <label className="form-label">Search Author</label>
          <div className="filter-input-search">
            <Search size={14} />
            <input
              type="text"
              className="form-input"
              placeholder="Search by author name..."
              value={authorSearch}
              onChange={e => setAuthorSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-item">
          <label className="form-label">Due Date From</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label className="form-label">Due Date To</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Chapters Table */}
      {paginatedChapters.length > 0 ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('chapterNumber')} style={{ cursor: 'pointer' }}>
                    Ch No. <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th>Chapter Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th onClick={() => toggleSort('dueDate')} style={{ cursor: 'pointer' }}>
                    Due Date <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                  </th>
                  <th>Submitted</th>
                  <th>Editor Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedChapters.map(chapter => {
                  const isChapterOverdue = isOverdue(chapter.dueDate, chapter.status, currentDate);
                  
                  // Status classes
                  let statusClass = 'notstarted';
                  if (isChapterOverdue) statusClass = 'overdue';
                  else if (chapter.status === 'Completed') statusClass = 'completed';
                  else if (chapter.status === 'In Progress') statusClass = 'inprogress';
                  else if (['Submitted', 'Under Review', 'Revision Requested'].includes(chapter.status)) statusClass = 'review';

                  return (
                    <tr key={chapter.id} className={getRowClass(chapter)}>
                      <td>{chapter.chapterNumber}</td>
                      <td style={{ fontWeight: '600' }}>{chapter.chapterTitle}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{chapter.authorName}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{chapter.authorEmail}</span>
                        </div>
                      </td>
                      <td>
                        {isManager ? (
                          <select
                            className={`inline-edit-select ${statusClass}`}
                            value={chapter.status}
                            onChange={e => handleInlineStatusChange(chapter.id, e.target.value)}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Revision Requested">Revision Requested</option>
                            <option value="Completed">Completed</option>
                          </select>
                        ) : (
                          <span className={`status-badge ${statusClass}`}>
                            {isChapterOverdue ? 'Overdue' : chapter.status}
                          </span>
                        )}
                        {isChapterOverdue && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--accent-danger)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                            Overdue Alert
                          </div>
                        )}
                      </td>
                      <td>
                        {isManager ? (
                          <input
                            type="date"
                            className="inline-edit-date"
                            value={chapter.dueDate || ''}
                            onChange={e => handleInlineDateChange(chapter.id, e.target.value)}
                          />
                        ) : (
                          <span>{formatDateReadable(chapter.dueDate)}</span>
                        )}
                      </td>
                      <td>
                        {chapter.submissionDate ? formatDateReadable(chapter.submissionDate) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            className="text-truncate"
                            style={{ maxWidth: '120px', display: 'inline-block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                            title={chapter.editorNotes}
                          >
                            {chapter.editorNotes || 'No notes...'}
                          </span>
                          <button
                            className="inline-edit-note-btn"
                            onClick={() => handleNotesClick(chapter)}
                            title={isManager ? "Edit Notes" : "View Notes"}
                          >
                            <FileText size={14} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {isManager ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="inline-edit-note-btn"
                              onClick={() => handleEditClick(chapter)}
                              title="Edit Chapter"
                            >
                              <Edit2 size={13} style={{ color: 'var(--text-secondary)' }} />
                            </button>
                            <button
                              className="inline-edit-note-btn"
                              onClick={() => handleDeleteClick(chapter.id, chapter.chapterTitle)}
                              title="Delete Chapter"
                            >
                              <Trash2 size={13} style={{ color: 'var(--accent-danger)' }} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-container">
            <span className="pagination-info">
              Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows} chapters
            </span>
            <div className="pagination-buttons">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state glass-card">
          <Search size={48} />
          <h3>No Chapters Found</h3>
          <p>There are no chapters registered in this project view.</p>
          {isManager && selectedBookId && selectedBookId !== 'All' && (
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={handleAddClick}>
              <Plus size={16} />
              Add Chapter
            </button>
          )}
        </div>
      )}

      {/* Add / Edit Chapter Modal */}
      {isManager && (
        <Dialog
          isOpen={isChapterModalOpen}
          onClose={() => setIsChapterModalOpen(false)}
          title={editingChapter ? 'Edit Chapter Details' : 'Add New Chapter'}
        >
          <form onSubmit={handleSaveChapter} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label">Book Project *</label>
              <select
                className="form-select"
                value={bookId}
                onChange={e => setBookId(e.target.value)}
                required
                disabled={editingChapter !== null}
              >
                <option value="" disabled>Select a book</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>

            <div className="grid-cols-4">
              <div className="form-group" style={{ gridColumn: 'span 1' }}>
                <label className="form-label">Ch No. *</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={chapterNumber}
                  onChange={e => setChapterNumber(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label className="form-label">Chapter Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Introduction to Quantum Physics"
                  value={chapterTitle}
                  onChange={e => setChapterTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Author Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Aris Vance"
                  value={authorName}
                  onChange={e => setAuthorName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Author Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. aris.vance@example.edu"
                  value={authorEmail}
                  onChange={e => setAuthorEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-cols-2">
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Revision Requested">Revision Requested</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {['Submitted', 'Completed'].includes(status) && (
              <div className="form-group">
                <label className="form-label">Submission Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={submissionDate}
                  onChange={e => setSubmissionDate(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Editor Notes</label>
              <textarea
                className="form-textarea"
                placeholder="Add editorial feedback or status notes..."
                value={editorNotes}
                onChange={e => setEditorNotes(e.target.value)}
              />
            </div>

            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setIsChapterModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Chapter
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Editor Notes Quick Dialog */}
      <Dialog
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        title={`Notes for Ch ${noteChapter?.chapterNumber}: ${noteChapter?.chapterTitle}`}
      >
        <form onSubmit={handleSaveNotes}>
          <div className="form-group">
            <label className="form-label">Editorial Feedback & Notes</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '160px' }}
              value={editorNotes}
              onChange={e => setEditorNotes(e.target.value)}
              placeholder="e.g. Awaiting revision of figures..."
              disabled={!isManager}
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsNotesModalOpen(false)}>
              Cancel
            </button>
            {isManager && (
              <button type="submit" className="btn btn-primary">
                Save Notes
              </button>
            )}
          </div>
        </form>
      </Dialog>
    </div>
  );
}
