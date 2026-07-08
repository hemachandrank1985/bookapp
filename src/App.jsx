import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Chapters from './pages/Chapters';
import Authors from './pages/Authors';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Managers from './pages/Managers';
import Login from './pages/Login';
import RegisterAdmin from './pages/RegisterAdmin';
import ToastContainer from './components/Toast';

import { useLocalStorage } from './hooks/useLocalStorage';
import { isOverdue, isDueWithinRange } from './utils/dateHelpers';

export default function App() {
  // Global React States synced with MongoDB backend
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [managers, setManagers] = useState([]);
  const [adminsCount, setAdminsCount] = useState(0);
  
  // UI Loading State
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom Date and Alert Acknowledgments remain local to the editor's browser session
  const [currentDate, setCurrentDate] = useLocalStorage('portal_system_date', '2026-07-08');
  const [acknowledgedAlertKeys, setAcknowledgedAlertKeys] = useLocalStorage('portal_acked_alerts', []);
  const [currentUser, setCurrentUser] = useLocalStorage('portal_current_user', null);

  // UI Navigation States
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedBookId, setSelectedBookId] = useState('All');
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);

  // Toasts State
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 1. Fetch All Database Records on Mount / Auth changes
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Admin count to see if we need configuration
      const adminRes = await fetch('/api/auth/admins');
      const adminData = await adminRes.json();
      setAdminsCount(adminData.count || 0);

      // If user is logged in, fetch books, chapters, and managers
      if (currentUser) {
        const [booksRes, chaptersRes, managersRes] = await Promise.all([
          fetch('/api/books'),
          fetch('/api/chapters'),
          fetch('/api/managers')
        ]);

        const [booksData, chaptersData, managersData] = await Promise.all([
          booksRes.json(),
          chaptersRes.json(),
          managersRes.json()
        ]);

        setBooks(Array.isArray(booksData) ? booksData : []);
        setChapters(Array.isArray(chaptersData) ? chaptersData : []);
        setManagers(Array.isArray(managersData) ? managersData : []);
      }
    } catch (err) {
      console.error('Error fetching database records:', err);
      addToast('Error communicating with the database server.', 'error');
      setBooks([]);
      setChapters([]);
      setManagers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // Logout Handler
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentTab('dashboard');
    setSelectedBookId('All');
    addToast('You have logged out of the portal.', 'info');
  };

  // Login handler
  const handleLoginSubmit = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setCurrentUser(data);
        addToast(`Welcome back, ${data.name}!`, 'success');
      } else {
        addToast(data.error || 'Invalid credentials.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error logging in.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Register Admin Handler
  const handleRegisterAdmin = async (name, email, password) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (res.ok) {
        setCurrentUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: 'Admin'
        });
        setIsRegisteringAdmin(false);
        addToast(`Administrator profile registered successfully!`, 'success');
      } else {
        addToast(data.error || 'Failed to register administrator.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error registering admin.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Derive visible books based on current user's role
  const visibleBooks = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return books;
    return books.filter(b => b.assignedManagerId === currentUser.id);
  }, [books, currentUser]);

  // Derive visible book IDs
  const visibleBookIds = useMemo(() => {
    return visibleBooks.map(b => b.id);
  }, [visibleBooks]);

  // Filter chapters based on visible books
  const visibleChapters = useMemo(() => {
    if (!currentUser) return [];
    return chapters.filter(c => visibleBookIds.includes(c.bookId));
  }, [chapters, visibleBookIds, currentUser]);

  // Derive Sidebar badge count
  const notificationCount = useMemo(() => {
    if (!currentUser) return 0;
    let count = 0;
    visibleChapters.forEach(c => {
      if (isOverdue(c.dueDate, c.status, currentDate) && !acknowledgedAlertKeys.includes(`${c.id}-overdue`)) {
        count++;
      }
      if (isDueWithinRange(c.dueDate, currentDate, 7, c.status) && !acknowledgedAlertKeys.includes(`${c.id}-due7`)) {
        count++;
      }
      if (['Submitted', 'Under Review'].includes(c.status) && !acknowledgedAlertKeys.includes(`${c.id}-review`)) {
        count++;
      }
    });
    return count;
  }, [visibleChapters, currentDate, acknowledgedAlertKeys, currentUser]);

  // 1. Show database loading spinner first to avoid login page setup flashes
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#0b0f19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Syncing database...
        </span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 2. Redirect to Registration or Login if not authenticated
  if (!currentUser) {
    if (isRegisteringAdmin || adminsCount === 0) {
      return (
        <>
          <RegisterAdmin
            admins={adminsCount > 0 ? [{ email: 'exists' }] : []} // Pass placeholder if admins count > 0 to restrict route
            onRegister={(newAdmin) => handleRegisterAdmin(newAdmin.name, newAdmin.email, newAdmin.password)}
            onBackToLogin={() => setIsRegisteringAdmin(false)}
            addToast={addToast}
          />
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
      );
    }

    return (
      <>
        <Login
          adminsCount={adminsCount}
          onLogin={(credentials) => handleLoginSubmit(credentials.email, credentials.password)}
          onNavigateToRegister={() => setIsRegisteringAdmin(true)}
          addToast={addToast}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  // Tab Page router
  const renderTabPage = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            books={visibleBooks}
            chapters={visibleChapters}
            currentDate={currentDate}
            setCurrentTab={setCurrentTab}
            setSelectedBookId={setSelectedBookId}
          />
        );
      case 'books':
        return (
          <Books
            books={books}
            setBooks={setBooks}
            chapters={chapters}
            addToast={addToast}
            setCurrentTab={setCurrentTab}
            setSelectedBookId={setSelectedBookId}
            currentUser={currentUser}
            managers={managers}
            refreshData={fetchData}
          />
        );
      case 'chapters':
        return (
          <Chapters
            books={visibleBooks}
            chapters={chapters}
            setChapters={setChapters}
            currentDate={currentDate}
            addToast={addToast}
            selectedBookId={selectedBookId}
            setSelectedBookId={setSelectedBookId}
            currentUser={currentUser}
            refreshData={fetchData}
          />
        );
      case 'authors':
        return (
          <Authors
            books={visibleBooks}
            chapters={visibleChapters}
            currentDate={currentDate}
            addToast={addToast}
          />
        );
      case 'reports':
        return (
          <Reports
            books={visibleBooks}
            chapters={visibleChapters}
            currentDate={currentDate}
            addToast={addToast}
          />
        );
      case 'notifications':
        return (
          <Notifications
            books={visibleBooks}
            chapters={visibleChapters}
            currentDate={currentDate}
            acknowledgedAlertKeys={acknowledgedAlertKeys}
            setAcknowledgedAlertKeys={setAcknowledgedAlertKeys}
            addToast={addToast}
            setCurrentTab={setCurrentTab}
            setSelectedBookId={setSelectedBookId}
          />
        );
      case 'managers':
        if (currentUser.role !== 'Admin') {
          return (
            <Dashboard
              books={visibleBooks}
              chapters={visibleChapters}
              currentDate={currentDate}
              setCurrentTab={setCurrentTab}
              setSelectedBookId={setSelectedBookId}
            />
          );
        }
        return (
          <Managers
            managers={managers}
            setManagers={setManagers}
            books={books}
            setBooks={setBooks}
            chapters={chapters}
            addToast={addToast}
            refreshData={fetchData}
          />
        );
      default:
        return (
          <Dashboard
            books={visibleBooks}
            chapters={visibleChapters}
            currentDate={currentDate}
            setCurrentTab={setCurrentTab}
            setSelectedBookId={setSelectedBookId}
          />
        );
    }
  };

  return (
    <div className="app-container">

      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        notificationCount={notificationCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      <div className="main-content">
        <Navbar
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          currentUser={currentUser}
        />
        
        <main style={{ flex: 1 }}>
          {renderTabPage()}
        </main>
      </div>

      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />
    </div>
  );
}
