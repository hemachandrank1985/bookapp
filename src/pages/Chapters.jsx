import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
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
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Chapter Tracker</h1>
          <span className="text-sm text-slate-400">
            {isManager 
              ? 'Manager Dashboard: View, edit progress, alter deadlines, and add comments' 
              : 'Administrator View: Read-only summary of active chapter submissions'}
          </span>
        </div>
        {isManager && (
          <Button
            onClick={handleAddClick}
            disabled={!selectedBookId || selectedBookId === 'All'}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Chapter
          </Button>
        )}
      </div>

      {/* Book selector & filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-900/20 p-4 rounded-xl border border-white/5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Active Book Project</label>
          <select
            className="flex h-9 w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
            value={selectedBookId || 'All'}
            onChange={e => setSelectedBookId(e.target.value === 'All' ? 'All' : String(e.target.value))}
          >
            <option value="All" className="bg-slate-950 text-white">All Books</option>
            {books.map(b => (
              <option key={b.id} value={b.id} className="bg-slate-950 text-white">{b.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Status Filter</label>
          <select
            className="flex h-9 w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All" className="bg-slate-950 text-white">All Statuses</option>
            <option value="Not Started" className="bg-slate-950 text-white">Not Started</option>
            <option value="In Progress" className="bg-slate-950 text-white">In Progress</option>
            <option value="Submitted" className="bg-slate-950 text-white">Submitted</option>
            <option value="Under Review" className="bg-slate-950 text-white">Under Review</option>
            <option value="Revision Requested" className="bg-slate-950 text-white">Revision Requested</option>
            <option value="Completed" className="bg-slate-950 text-white">Completed</option>
            <option value="Overdue" className="bg-slate-950 text-white">Overdue</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-1">
          <label className="text-xs font-semibold text-slate-400">Search Author</label>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
              placeholder="Author name..."
              value={authorSearch}
              onChange={e => setAuthorSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Due Date From</label>
          <Input
            type="date"
            className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Due Date To</label>
          <Input
            type="date"
            className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Chapters Table */}
      {paginatedChapters.length > 0 ? (
        <Card className="glass-card border-white/5 overflow-hidden shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-900/40">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold w-20 cursor-pointer" onClick={() => toggleSort('chapterNumber')}>
                    <span className="flex items-center gap-1">Ch No. <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-slate-400 font-bold">Chapter Title</TableHead>
                  <TableHead className="text-slate-400 font-bold">Author</TableHead>
                  <TableHead className="text-slate-400 font-bold w-44">Status</TableHead>
                  <TableHead className="text-slate-400 font-bold w-36 cursor-pointer" onClick={() => toggleSort('dueDate')}>
                    <span className="flex items-center gap-1">Due Date <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-slate-400 font-bold w-32">Submitted</TableHead>
                  <TableHead className="text-slate-400 font-bold w-44">Editor Notes</TableHead>
                  <TableHead className="text-slate-400 font-bold w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedChapters.map(chapter => {
                  const isChapterOverdue = isOverdue(chapter.dueDate, chapter.status, currentDate);
                  
                  // Status classes
                  let statusClass = 'notstarted';
                  if (isChapterOverdue) statusClass = 'overdue';
                  else if (chapter.status === 'Completed') statusClass = 'completed';
                  else if (chapter.status === 'In Progress') statusClass = 'inprogress';
                  else if (['Submitted', 'Under Review', 'Revision Requested'].includes(chapter.status)) statusClass = 'review';

                  return (
                    <TableRow key={chapter.id} className={`border-white/5 hover:bg-slate-900/10 ${getRowClass(chapter)}`}>
                      <TableCell className="font-bold text-slate-300">{chapter.chapterNumber}</TableCell>
                      <TableCell className="font-semibold text-slate-200">{chapter.chapterTitle}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{chapter.authorName}</span>
                          <span className="text-[10px] text-slate-500">{chapter.authorEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isManager ? (
                          <select
                            className={`inline-edit-select ${statusClass} rounded border border-white/5 bg-slate-900/80 px-2 py-0.5 text-xs text-white`}
                            value={chapter.status}
                            onChange={e => handleInlineStatusChange(chapter.id, e.target.value)}
                          >
                            <option value="Not Started" className="bg-slate-950 text-white">Not Started</option>
                            <option value="In Progress" className="bg-slate-950 text-white">In Progress</option>
                            <option value="Submitted" className="bg-slate-950 text-white">Submitted</option>
                            <option value="Under Review" className="bg-slate-950 text-white">Under Review</option>
                            <option value="Revision Requested" className="bg-slate-950 text-white">Revision Requested</option>
                            <option value="Completed" className="bg-slate-950 text-white">Completed</option>
                          </select>
                        ) : (
                          <span className={`status-badge ${statusClass} text-[10px] px-2 py-0.5 rounded-full font-semibold`}>
                            {isChapterOverdue ? 'Overdue' : chapter.status}
                          </span>
                        )}
                        {isChapterOverdue && (
                          <div className="text-[9px] text-red-400 font-bold mt-1">
                            Overdue Alert
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isManager ? (
                          <input
                            type="date"
                            className="inline-edit-date bg-slate-900/80 border border-white/5 text-xs text-slate-300 rounded px-2 py-0.5"
                            value={chapter.dueDate || ''}
                            onChange={e => handleInlineDateChange(chapter.id, e.target.value)}
                          />
                        ) : (
                          <span className="text-slate-300">{formatDateReadable(chapter.dueDate)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {chapter.submissionDate ? formatDateReadable(chapter.submissionDate) : (
                          <span className="text-slate-500 text-xs italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="truncate text-xs text-slate-400"
                            style={{ maxWidth: '100px' }}
                            title={chapter.editorNotes}
                          >
                            {chapter.editorNotes || 'No notes...'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                            onClick={() => handleNotesClick(chapter)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isManager ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                              onClick={() => handleEditClick(chapter)}
                              title="Edit Chapter"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                              onClick={() => handleDeleteClick(chapter.id, chapter.chapterTitle)}
                              title="Delete Chapter"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Locked</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center px-4 py-3 bg-slate-900/10 border-t border-white/5">
              <span className="text-xs text-slate-400">
                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, totalRows)} of {totalRows} chapters
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-7 h-7 border-white/10 text-slate-400 hover:bg-slate-800"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-7 h-7 border-white/10 text-slate-400 hover:bg-slate-800"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="empty-state glass-card flex flex-col items-center justify-center p-12 text-center border-white/5">
          <Search className="h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Chapters Found</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-4">There are no chapters registered in this project view.</p>
          {isManager && selectedBookId && selectedBookId !== 'All' && (
            <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
              <Plus className="h-4 w-4 mr-1" />
              Add Chapter
            </Button>
          )}
        </div>
      )}

      {/* Add / Edit Chapter Modal */}
      {isManager && (
        <Dialog open={isChapterModalOpen} onOpenChange={setIsChapterModalOpen}>
          <DialogContent className="max-w-lg border-white/10 text-white glass-card">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">{editingChapter ? 'Edit Chapter Details' : 'Add New Chapter'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveChapter} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Book Project *</label>
                <select
                  className="flex h-9 w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
                  value={bookId}
                  onChange={e => setBookId(e.target.value)}
                  required
                  disabled={editingChapter !== null}
                >
                  <option value="" disabled className="bg-slate-950 text-slate-400">Select a book</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-950 text-white">{b.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5 col-span-1">
                  <label className="text-xs font-semibold text-slate-400">Ch No. *</label>
                  <Input
                    type="number"
                    min="1"
                    className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
                    value={chapterNumber}
                    onChange={e => setChapterNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-3">
                  <label className="text-xs font-semibold text-slate-400">Chapter Title *</label>
                  <Input
                    type="text"
                    className="bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                    placeholder="Introduction to Quantum Physics"
                    value={chapterTitle}
                    onChange={e => setChapterTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Author Name *</label>
                  <Input
                    type="text"
                    className="bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                    placeholder="Dr. Aris Vance"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Author Email *</label>
                  <Input
                    type="email"
                    className="bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                    placeholder="aris.vance@example.edu"
                    value={authorEmail}
                    onChange={e => setAuthorEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Due Date *</label>
                  <Input
                    type="date"
                    className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Status</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="Not Started" className="bg-slate-950 text-white">Not Started</option>
                    <option value="In Progress" className="bg-slate-950 text-white">In Progress</option>
                    <option value="Submitted" className="bg-slate-950 text-white">Submitted</option>
                    <option value="Under Review" className="bg-slate-950 text-white">Under Review</option>
                    <option value="Revision Requested" className="bg-slate-950 text-white">Revision Requested</option>
                    <option value="Completed" className="bg-slate-950 text-white">Completed</option>
                  </select>
                </div>
              </div>

              {['Submitted', 'Completed'].includes(status) && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Submission Date</label>
                  <Input
                    type="date"
                    className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
                    value={submissionDate}
                    onChange={e => setSubmissionDate(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Editor Notes</label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
                  placeholder="Add editorial feedback or status notes..."
                  value={editorNotes}
                  onChange={e => setEditorNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-white/5">
                <Button type="button" variant="outline" onClick={() => setIsChapterModalOpen(false)} className="border-white/10 text-slate-300 hover:bg-slate-800">
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  Save Chapter
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Editor Notes Quick Dialog */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="max-w-md border-white/10 text-white glass-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              Notes for Ch {noteChapter?.chapterNumber}: {noteChapter?.chapterTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNotes} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Editorial Feedback & Notes</label>
              <textarea
                className="flex min-h-[160px] w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-2 text-sm shadow-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
                value={editorNotes}
                onChange={e => setEditorNotes(e.target.value)}
                placeholder="Awaiting revision of figures..."
                disabled={!isManager}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button type="button" variant="outline" onClick={() => setIsNotesModalOpen(false)} className="border-white/10 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              {isManager && (
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  Save Notes
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
