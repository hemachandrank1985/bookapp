import React, { useState } from 'react';
import { Plus, UserX, UserPlus, Mail } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';

export default function Managers({
  managers = [],
  books = [],
  chapters = [],
  addToast,
  refreshData
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('manager'); // default simple password

  // Handle Add Manager
  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (res.ok) {
        addToast(`Project Manager "${name}" successfully registered!`, 'success');
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPassword('manager');
        refreshData();
      } else {
        addToast(data.error || 'Failed to register manager.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error registering manager.', 'error');
    }
  };

  // Handle Delete Manager
  const handleDelete = async (managerId, managerName) => {
    if (window.confirm(`Are you sure you want to delete Manager "${managerName}"? All their allocated books will become "Unassigned" in MongoDB.`)) {
      try {
        const res = await fetch(`/api/managers/${managerId}`, { method: 'DELETE' });
        if (res.ok) {
          addToast(`Manager "${managerName}" deleted. Assigned books have been released to Unassigned.`, 'info');
          refreshData();
        } else {
          addToast('Failed to delete manager.', 'error');
        }
      } catch (err) {
        console.error(err);
        addToast('Error deleting manager.', 'error');
      }
    }
  };

  // Compute workload for each manager
  const getManagerWorkload = (managerId) => {
    const managerBooks = books.filter(b => b.assignedManagerId === String(managerId));
    const bookIds = managerBooks.map(b => b.id);
    const managerChaptersCount = chapters.filter(c => bookIds.includes(c.bookId)).length;
    
    return {
      booksCount: managerBooks.length,
      chaptersCount: managerChaptersCount,
      books: managerBooks
    };
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Editorial Staff (Managers)</h1>
          <span className="text-sm text-slate-400">Configure editorial staff, audit workloads, and adjust book ownership</span>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium gap-1">
          <UserPlus className="h-4 w-4" />
          Register Manager
        </Button>
      </div>

      {/* Managers Table */}
      {managers.length > 0 ? (
        <Card className="glass-card border-white/5 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-900/40">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold">Manager Name</TableHead>
                  <TableHead className="text-slate-400 font-bold">Email Address</TableHead>
                  <TableHead className="text-center text-slate-400 font-bold">Allocated Books</TableHead>
                  <TableHead className="text-center text-slate-400 font-bold">Chapters Monitored</TableHead>
                  <TableHead className="text-slate-400 font-bold">Assigned Publications</TableHead>
                  <TableHead className="text-slate-400 font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map(manager => {
                  const workload = getManagerWorkload(manager.id);
                  return (
                    <TableRow key={manager.id} className="border-white/5 hover:bg-slate-900/10">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-xs font-bold text-indigo-400">
                            {manager.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-bold text-slate-200">{manager.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{manager.email}</TableCell>
                      <TableCell className="text-center font-bold text-slate-200 text-base">
                        {workload.booksCount}
                      </TableCell>
                      <TableCell className="text-center font-bold text-orange-400 text-base">
                        {workload.chaptersCount}
                      </TableCell>
                      <TableCell>
                        {workload.books.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {workload.books.map(b => (
                              <span key={b.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate" style={{ maxWidth: '120px' }}>
                                {b.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">None Assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                          onClick={() => handleDelete(manager.id, manager.name)}
                          title="Delete Manager"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="empty-state glass-card flex flex-col items-center justify-center p-12 text-center border-white/5">
          <UserPlus className="h-12 w-12 text-slate-500 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Managers Registered</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-4">Please register a project manager to assign books and monitor workflows.</p>
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
            <UserPlus className="h-4 w-4 mr-1" />
            Register Manager
          </Button>
        </div>
      )}

      {/* Register Manager Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md border-white/10 text-white glass-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Register New Project Manager</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Full Name *</label>
              <Input
                type="text"
                className="bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                placeholder="Mary Curie"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Email Address *</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder-slate-500 focus-visible:ring-indigo-500"
                  placeholder="mary.curie@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Security Password *</label>
              <Input
                type="password"
                className="bg-slate-900/50 border-white/10 text-white focus-visible:ring-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-white/5">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/10 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                Register Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
