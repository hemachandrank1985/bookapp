import React, { useState } from 'react';
import { Plus, UserX, UserPlus, Mail } from 'lucide-react';
import Dialog from '../components/Dialog';

export default function Managers({
  managers,
  books,
  chapters,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Editorial Staff (Managers)</h1>
          <span className="page-subtitle">Configure editorial staff, audit workloads, and adjust book ownership</span>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} />
          Register Manager
        </button>
      </div>

      {/* Managers Table */}
      {managers.length > 0 ? (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Manager Name</th>
                  <th>Email Address</th>
                  <th style={{ textAlign: 'center' }}>Allocated Books</th>
                  <th style={{ textAlign: 'center' }}>Chapters Monitored</th>
                  <th>Assigned Publications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managers.map(manager => {
                  const workload = getManagerWorkload(manager.id);
                  return (
                    <tr key={manager.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="nav-user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                            {manager.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span style={{ fontWeight: '700' }}>{manager.name}</span>
                        </div>
                      </td>
                      <td>{manager.email}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem' }}>
                        {workload.booksCount}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-orange)' }}>
                        {workload.chaptersCount}
                      </td>
                      <td>
                        {workload.books.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {workload.books.map(b => (
                              <span key={b.id} className="text-badge text-badge-success" style={{ fontSize: '0.68rem' }}>
                                {b.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                            None Assigned
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          className="inline-edit-note-btn"
                          onClick={() => handleDelete(manager.id, manager.name)}
                          title="Delete Manager"
                        >
                          <UserX size={14} style={{ color: 'var(--accent-danger)' }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state glass-card">
          <UserPlus size={48} />
          <h3>No Managers Registered</h3>
          <p>Please register a project manager to assign books and monitor workflows.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setIsModalOpen(true)}>
            <UserPlus size={16} />
            Register Manager
          </button>
        </div>
      )}

      {/* Register Manager Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Project Manager"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Mary Curie"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <div className="filter-input-search">
              <Mail size={14} />
              <input
                type="email"
                className="form-input"
                placeholder="e.g. mary.curie@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Security Password *</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Account
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
