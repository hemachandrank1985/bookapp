import React from 'react';
import { BookOpen, BookMarked, CheckCircle, Clock, AlertTriangle, Calendar, User, ArrowRight } from 'lucide-react';
import { isOverdue, formatDateReadable, getDaysDifference } from '../utils/dateHelpers';

export default function Dashboard({ books, chapters, currentDate, setCurrentTab, setSelectedBookId }) {
  // 1. Calculations
  const totalBooks = books.length;
  const totalChapters = chapters.length;
  
  const completedChaptersCount = chapters.filter(c => c.status === 'Completed').count || chapters.filter(c => c.status === 'Completed').length;
  const overdueChapters = chapters.filter(c => isOverdue(c.dueDate, c.status, currentDate));
  const overdueCount = overdueChapters.length;
  
  // Pending chapters: started or not started but NOT completed and NOT overdue
  const pendingChapters = chapters.filter(c => c.status !== 'Completed' && !isOverdue(c.dueDate, c.status, currentDate));
  const pendingCount = pendingChapters.length;
  
  const completionPercentage = totalChapters > 0 ? Math.round((completedChaptersCount / totalChapters) * 100) : 0;

  // 2. Status Breakdown for Donut Chart
  const statuses = [
    { key: 'Completed', label: 'Completed', color: 'completed' },
    { key: 'In Progress', label: 'In Progress', color: 'inprogress' },
    { key: 'Submitted', label: 'Submitted', color: 'review' },
    { key: 'Under Review', label: 'Under Review', color: 'review' },
    { key: 'Revision Requested', label: 'Revision Requested', color: 'review' },
    { key: 'Overdue', label: 'Overdue', color: 'overdue' },
    { key: 'Not Started', label: 'Not Started', color: 'notstarted' }
  ];

  const statusCounts = statuses.reduce((acc, status) => {
    if (status.key === 'Overdue') {
      acc[status.key] = overdueCount;
    } else {
      // If a chapter is overdue, we count it as 'Overdue' instead of its base status for the chart
      acc[status.key] = chapters.filter(c => c.status === status.key && !isOverdue(c.dueDate, c.status, currentDate)).length;
    }
    return acc;
  }, {});

  // Donut SVG Calculations
  const chartData = statuses.map(s => ({
    ...s,
    value: statusCounts[s.key] || 0
  })).filter(d => d.value > 0);

  const chartTotal = chartData.reduce((sum, d) => sum + d.value, 0);
  
  let accumulatedPercent = 0;
  const donutSlices = chartData.map(d => {
    const percentage = chartTotal > 0 ? (d.value / chartTotal) * 100 : 0;
    const strokeDash = `${percentage} ${100 - percentage}`;
    const strokeOffset = 100 - accumulatedPercent + 25; // 25 to start at top (12 o'clock)
    accumulatedPercent += percentage;
    return {
      ...d,
      percentage,
      strokeDash,
      strokeOffset
    };
  });

  // 3. Stacked Bar Chart per Book
  const bookProgressData = books.map(book => {
    const bookChapters = chapters.filter(c => c.bookId === book.id);
    const total = bookChapters.length;
    if (total === 0) return { ...book, completed: 0, inprogress: 0, overdue: 0, notstarted: 0, total: 0 };
    
    const completed = bookChapters.filter(c => c.status === 'Completed').length;
    const overdue = bookChapters.filter(c => isOverdue(c.dueDate, c.status, currentDate)).length;
    const inprogress = bookChapters.filter(c => c.status !== 'Completed' && c.status !== 'Not Started' && !isOverdue(c.dueDate, c.status, currentDate)).length;
    const notstarted = bookChapters.filter(c => c.status === 'Not Started' && !isOverdue(c.dueDate, c.status, currentDate)).length;
    
    return {
      ...book,
      completedPercent: Math.round((completed / total) * 100),
      inprogressPercent: Math.round((inprogress / total) * 100),
      overduePercent: Math.round((overdue / total) * 100),
      notstartedPercent: Math.round((notstarted / total) * 100),
      total
    };
  });

  // 4. Timeline (Chapters due in the next 30 days)
  const upcomingChapters = chapters
    .filter(c => {
      if (c.status === 'Completed') return false;
      const diff = getDaysDifference(currentDate, c.dueDate);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5); // Limit to top 5 upcoming

  const handleBookClick = (bookId) => {
    setSelectedBookId(bookId);
    setCurrentTab('chapters');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Editorial Dashboard</h1>
          <span className="page-subtitle">Academic project progress tracking and statistics</span>
        </div>
      </div>

      {/* KPI Section */}
      <div className="kpi-container">
        <div className="kpi-card glass-card" style={{ '--card-accent': 'var(--accent-primary)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Total Books</span>
            <BookOpen size={20} className="kpi-icon" />
          </div>
          <div className="kpi-value">{totalBooks}</div>
          <div className="kpi-footer">Active academic projects</div>
        </div>

        <div className="kpi-card glass-card" style={{ '--card-accent': 'var(--accent-primary)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Total Chapters</span>
            <BookMarked size={20} className="kpi-icon" />
          </div>
          <div className="kpi-value">{totalChapters}</div>
          <div className="kpi-footer">Across all publications</div>
        </div>

        <div className="kpi-card glass-card" style={{ '--card-accent': 'var(--accent-success)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Completed</span>
            <CheckCircle size={20} className="kpi-icon" />
          </div>
          <div className="kpi-value">{completedChaptersCount}</div>
          <div className="kpi-footer">{completionPercentage}% overall completion</div>
          <div className="kpi-progress-bar">
            <div className="kpi-progress-fill" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>

        <div className="kpi-card glass-card" style={{ '--card-accent': 'var(--accent-orange)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Pending</span>
            <Clock size={20} className="kpi-icon" />
          </div>
          <div className="kpi-value">{pendingCount}</div>
          <div className="kpi-footer">Active chapters in progress</div>
        </div>

        <div className="kpi-card glass-card" style={{ '--card-accent': 'var(--accent-danger)' }}>
          <div className="kpi-header">
            <span className="kpi-title">Overdue</span>
            <AlertTriangle size={20} className="kpi-icon" />
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-danger)' }}>{overdueCount}</div>
          <div className="kpi-footer">Requires immediate attention</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Bar chart - breakdown per book */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3 className="chart-title">Chapter Progress per Book</h3>
          </div>
          <div className="chart-body">
            <div className="bar-chart-wrapper">
              {bookProgressData.map(book => (
                <div key={book.id} className="bar-row">
                  <div
                    className="bar-label"
                    title={book.title}
                    onClick={() => handleBookClick(book.id)}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {book.title}
                  </div>
                  <div className="bar-container">
                    {book.completedPercent > 0 && (
                      <div className="bar-segment completed" style={{ width: `${book.completedPercent}%` }} title={`Completed: ${book.completedPercent}%`} />
                    )}
                    {book.inprogressPercent > 0 && (
                      <div className="bar-segment inprogress" style={{ width: `${book.inprogressPercent}%` }} title={`In Progress: ${book.inprogressPercent}%`} />
                    )}
                    {book.overduePercent > 0 && (
                      <div className="bar-segment overdue" style={{ width: `${book.overduePercent}%` }} title={`Overdue: ${book.overduePercent}%`} />
                    )}
                    {book.notstartedPercent > 0 && (
                      <div className="bar-segment notstarted" style={{ width: `${book.notstartedPercent}%` }} title={`Not Started: ${book.notstartedPercent}%`} />
                    )}
                  </div>
                  <div className="bar-value">{book.completedPercent}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut chart - status breakdown */}
        <div className="chart-card glass-card" style={{ position: 'relative' }}>
          <div className="chart-header">
            <h3 className="chart-title">Status Breakdown</h3>
          </div>
          <div className="chart-body" style={{ flexDirection: 'column' }}>
            {chartTotal > 0 ? (
              <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut-chart-svg">
                  <circle cx="21" cy="21" r="15.91549430918954" className="donut-hole" />
                  <circle cx="21" cy="21" r="15.91549430918954" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" fill="transparent" />
                  {donutSlices.map(slice => (
                    <circle
                      key={slice.key}
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      className={`donut-segment ${slice.color}`}
                      strokeDasharray={slice.strokeDash}
                      strokeDashoffset={slice.strokeOffset}
                      strokeWidth="4.5"
                      fill="transparent"
                    />
                  ))}
                </svg>
                <div className="donut-center-text">
                  <span className="donut-center-val">{totalChapters}</span>
                  <span className="donut-center-lbl">Chapters</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No data available</div>
            )}
            
            <div className="chart-legend">
              {statuses.map(s => {
                const count = statusCounts[s.key] || 0;
                return (
                  <div key={s.key} className="legend-item" style={{ opacity: count > 0 ? 1 : 0.5 }}>
                    <div className={`legend-color status-badge ${s.color}`} style={{ width: '8px', height: '8px', padding: 0 }}></div>
                    <span>{s.label} ({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Timeline & Overdue Alerts */}
      <div className="timeline-alerts-grid">
        {/* Timeline View */}
        <div className="timeline-card glass-card">
          <div className="chart-header">
            <h3 className="chart-title">Upcoming Deadlines (Next 30 Days)</h3>
            <Calendar size={18} className="kpi-icon" />
          </div>
          <div className="timeline-list">
            {upcomingChapters.length > 0 ? (
              upcomingChapters.map(chapter => {
                const book = books.find(b => b.id === chapter.bookId);
                const diffDays = getDaysDifference(currentDate, chapter.dueDate);
                let timelineColor = 'var(--text-secondary)';
                if (diffDays === 0) timelineColor = 'var(--accent-danger)';
                else if (diffDays <= 7) timelineColor = 'var(--accent-orange)';
                else if (diffDays <= 14) timelineColor = 'var(--accent-warning)';

                return (
                  <div key={chapter.id} className="timeline-item" style={{ '--timeline-color': timelineColor }}>
                    <div className="timeline-indicator">
                      <Clock size={14} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-content-header">
                        <span className="timeline-title">Ch {chapter.chapterNumber}: {chapter.chapterTitle}</span>
                        <span className="timeline-date">
                          {diffDays === 0 ? 'Due Today' : `In ${diffDays} days`}
                        </span>
                      </div>
                      <div className="timeline-book">Book: {book?.title}</div>
                      <div className="timeline-author">Author: {chapter.authorName} ({formatDateReadable(chapter.dueDate)})</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <Calendar size={36} />
                <h3>No upcoming deadlines</h3>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>There are no chapter submissions due in the next 30 days.</p>
              </div>
            )}
          </div>
        </div>

        {/* Color-coded Overdue Alerts */}
        <div className="alerts-card glass-card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ color: 'var(--accent-danger)' }}>Overdue Alerts</h3>
            <AlertTriangle size={18} style={{ color: 'var(--accent-danger)' }} />
          </div>
          <div className="alerts-list">
            {overdueCount > 0 ? (
              overdueChapters.map(chapter => {
                const book = books.find(b => b.id === chapter.bookId);
                const diffDays = getDaysDifference(chapter.dueDate, currentDate);
                return (
                  <div key={chapter.id} className="alert-item">
                    <div className="alert-item-content">
                      <span className="alert-item-title">Ch {chapter.chapterNumber}: {chapter.chapterTitle}</span>
                      <span className="alert-item-desc">Book: {book?.title}</span>
                      <span className="alert-item-meta">
                        Author: {chapter.authorName} | Overdue by <strong style={{ color: 'var(--accent-danger)' }}>{diffDays} days</strong> (Due {formatDateReadable(chapter.dueDate)})
                      </span>
                    </div>
                    <button
                      className="alert-ack-btn"
                      title="Nudge Author (Chapters Tab)"
                      onClick={() => handleBookClick(chapter.bookId)}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <CheckCircle size={36} style={{ color: 'var(--accent-success)' }} />
                <h3 style={{ color: 'var(--accent-success)' }}>All chapters on track</h3>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>No chapters are currently overdue based on the simulated today's date.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
