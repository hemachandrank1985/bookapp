import React from 'react';
import { FileSpreadsheet, FileText, Printer, ShieldAlert } from 'lucide-react';
import { isOverdue } from '../utils/dateHelpers';

export default function Reports({ books, chapters, currentDate, addToast }) {
  // 1. Calculate reports summary data per book
  const reportsData = React.useMemo(() => {
    return books.map(book => {
      const bookChapters = chapters.filter(c => c.bookId === book.id);
      const total = bookChapters.length;
      
      const completed = bookChapters.filter(c => c.status === 'Completed').length;
      const overdue = bookChapters.filter(c => isOverdue(c.dueDate, c.status, currentDate)).length;
      
      const inprogress = bookChapters.filter(c => 
        ['In Progress', 'Submitted', 'Under Review', 'Revision Requested'].includes(c.status) &&
        !isOverdue(c.dueDate, c.status, currentDate)
      ).length;
      
      const notstarted = bookChapters.filter(c => 
        c.status === 'Not Started' &&
        !isOverdue(c.dueDate, c.status, currentDate)
      ).length;

      const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Extract authors of overdue chapters
      const overdueAuthorsSet = new Set();
      bookChapters
        .filter(c => isOverdue(c.dueDate, c.status, currentDate))
        .forEach(c => overdueAuthorsSet.add(c.authorName));
      const overdueAuthors = Array.from(overdueAuthorsSet);

      return {
        id: book.id,
        title: book.title,
        discipline: book.discipline,
        publisher: book.publisher,
        targetDate: book.targetPublicationDate,
        total,
        completed,
        inprogress,
        overdue,
        notstarted,
        completionPct,
        overdueAuthors
      };
    });
  }, [books, chapters, currentDate]);

  // 2. CSV Export handler
  const handleExportCSV = () => {
    if (reportsData.length === 0) {
      addToast('No report data to export.', 'warning');
      return;
    }

    // Build CSV Content
    const headers = [
      'Book Title',
      'Discipline',
      'Publisher',
      'Target Date',
      'Completion %',
      'Total Chapters',
      'Completed Chapters',
      'In Progress Chapters',
      'Overdue Chapters',
      'Not Started Chapters',
      'Overdue Authors'
    ];

    const rows = reportsData.map(row => [
      `"${row.title.replace(/"/g, '""')}"`,
      `"${row.discipline.replace(/"/g, '""')}"`,
      `"${row.publisher.replace(/"/g, '""')}"`,
      row.targetDate,
      `${row.completionPct}%`,
      row.total,
      row.completed,
      row.inprogress,
      row.overdue,
      row.notstarted,
      `"${row.overdueAuthors.join('; ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `book_chapter_editorial_report_${currentDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('CSV Report downloaded successfully!', 'success');
  };

  // 3. PDF print handler
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Reports & Analytics</h1>
          <span className="page-subtitle">Generate summaries, track overall book completeness, and export data</span>
        </div>
        <div className="report-export-buttons">
          <button className="btn btn-secondary" onClick={handlePrintPDF}>
            <Printer size={16} />
            Print / Save PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="reports-grid">
        {/* Core summary table card */}
        <div className="report-summary-table-card glass-card">
          <div className="report-header-row">
            <h2 className="report-header-title">Publications Overview Summary</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              As of simulated date: {currentDate}
            </span>
          </div>

          {reportsData.length > 0 ? (
            <div className="table-container">
              <table className="data-table" style={{ fontSize: '0.825rem' }}>
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Discipline</th>
                    <th>Target Date</th>
                    <th>Completion %</th>
                    <th style={{ textAlign: 'center' }}>Total Ch</th>
                    <th style={{ textAlign: 'center' }}>Done</th>
                    <th style={{ textAlign: 'center' }}>Active</th>
                    <th style={{ textAlign: 'center' }}>Overdue</th>
                    <th style={{ textAlign: 'center' }}>Not Started</th>
                    <th>Overdue Authors</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.map(row => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: '700', fontSize: '0.85rem' }}>{row.title}</td>
                      <td>{row.discipline}</td>
                      <td>{row.targetDate}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', width: '32px' }}>{row.completionPct}%</span>
                          <div className="progress-bar-container" style={{ width: '60px', height: '6px' }}>
                            <div className="progress-bar-fill" style={{ width: `${row.completionPct}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.total}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent-success)', fontWeight: '600' }}>{row.completed}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent-orange)', fontWeight: '600' }}>{row.inprogress}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent-danger)', fontWeight: '600' }}>{row.overdue}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600' }}>{row.notstarted}</td>
                      <td>
                        {row.overdueAuthors.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
                            <ShieldAlert size={12} style={{ color: 'var(--accent-danger)' }} />
                            {row.overdueAuthors.map(author => (
                              <span key={author} className="text-badge text-badge-danger" style={{ fontSize: '0.65rem' }}>
                                {author}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--accent-success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            None
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No publications found to report</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
