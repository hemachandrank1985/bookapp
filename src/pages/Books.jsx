import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, User, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
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
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Books Management</h1>
          <span className="text-sm text-slate-400">
            {isAdmin 
              ? 'Administrator View: Configure books, target dates, and allocate ownership to managers' 
              : 'Project Manager View: Track submission progress for your allocated publications'}
          </span>
        </div>
        {isAdmin && (
          <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-1">
            <Plus className="h-4 w-4" />
            Add New Book
          </Button>
        )}
      </div>

      {/* Grid of Books */}
      {visibleBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleBooks.map(book => {
            const progress = getBookProgress(book.id, book.totalChapters);
            const manager = managers.find(m => m.id === book.assignedManagerId);
            
            // Status color mapping for card badge
            let badgeClass = 'notstarted';
            if (book.status === 'Completed') badgeClass = 'completed';
            else if (book.status === 'Active') badgeClass = 'inprogress';
            else if (book.status === 'Under Review') badgeClass = 'review';

            return (
              <Card key={book.id} className="glass-card flex flex-col justify-between border-white/5 shadow-md">
                <CardHeader className="flex flex-row justify-between items-start pb-2">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{book.discipline}</span>
                    <CardTitle className="text-base font-bold text-white truncate max-w-[200px]" title={book.title}>{book.title}</CardTitle>
                  </div>
                  <span className={`status-badge ${badgeClass} text-[10px] font-bold px-2 py-0.5 rounded-full`}>{book.status}</span>
                </CardHeader>

                <CardContent className="pt-2 pb-4">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-b border-white/5 pb-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500">Publisher</span>
                      <span className="font-semibold text-slate-300 truncate">{book.publisher}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500">Target Date</span>
                      <span className="font-semibold text-slate-300">{formatDateReadable(book.targetPublicationDate)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500">Assigned Manager</span>
                      <span className="font-semibold flex items-center gap-1 text-slate-300 truncate">
                        <User className="h-3 w-3 text-slate-500" />
                        {manager ? manager.name : <span className="text-orange-400">Unassigned</span>}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-500">Total Chapters</span>
                      <span className="font-semibold text-slate-300">{book.totalChapters}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex flex-col gap-1.5 mt-4">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                      <span>Submission Progress</span>
                      <span>{progress.submittedCount} / {book.totalChapters} Ch ({progress.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress.percentage}%` }}></div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2 pt-2 border-t border-white/5 justify-end">
                  {isAdmin && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
                        onClick={() => handleEditClick(book)}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20"
                        onClick={() => handleDeleteClick(book.id, book.title)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                    onClick={() => handleViewChapters(book.id)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Tracker
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="empty-state glass-card flex flex-col items-center justify-center p-12 text-center border-white/5">
          <BookOpen className="h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Books Allocated</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-4">
            {isAdmin 
              ? 'Get started by creating your first academic book.' 
              : 'You do not have any publications allocated to your profile yet.'}
          </p>
          {isAdmin && (
            <Button onClick={handleAddClick} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
              <Plus className="h-4 w-4 mr-1" />
              Add New Book
            </Button>
          )}
        </div>
      )}

      {/* Add / Edit Book Modal Dialog (Admin-only) */}
      {isAdmin && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg border-white/10 text-white glass-card">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">{editingBook ? 'Edit Book Details' : 'Add New Book'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Book Title *</label>
                <Input
                  type="text"
                  className="bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                  placeholder="Principles of Quantum Computing"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Subject / Discipline *</label>
                  <Input
                    type="text"
                    className="bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                    placeholder="Computer Science"
                    value={discipline}
                    onChange={e => setDiscipline(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Publisher *</label>
                  <Input
                    type="text"
                    className="bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                    placeholder="Academic Press"
                    value={publisher}
                    onChange={e => setPublisher(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Target Publication Date *</label>
                  <Input
                    type="date"
                    className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Total Expected Chapters</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
                    value={totalChapters}
                    onChange={e => setTotalChapters(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Allocate to Manager *</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
                    value={assignedManagerId}
                    onChange={e => setAssignedManagerId(e.target.value)}
                    required
                  >
                    <option value="" disabled className="bg-slate-950 text-slate-400">Select a Manager</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id} className="bg-slate-950 text-white">{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Book Status</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-white/10 bg-slate-900/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 text-white"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="Planning" className="bg-slate-950 text-white">Planning</option>
                    <option value="Active" className="bg-slate-950 text-white">Active</option>
                    <option value="Under Review" className="bg-slate-950 text-white">Under Review</option>
                    <option value="Completed" className="bg-slate-950 text-white">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-white/5">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/10 text-slate-300 hover:bg-slate-800">
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                  Save Book Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
