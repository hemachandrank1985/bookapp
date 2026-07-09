import React from 'react';
import { BookOpen, BookMarked, CheckCircle, Clock, AlertTriangle, Calendar, User, ArrowRight } from 'lucide-react';
import { isOverdue, formatDateReadable, getDaysDifference } from '../utils/dateHelpers';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';

export default function Dashboard({ books = [], chapters = [], currentDate, setCurrentTab, setSelectedBookId }) {
  // 1. Calculations
  const totalBooks = books.length;
  const totalChapters = chapters.length;
  
  const completedChaptersCount = chapters.filter(c => c.status === 'Completed').length;
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

  const statusCounts = {};
  chapters.forEach(c => {
    const isChapterOverdue = isOverdue(c.dueDate, c.status, currentDate);
    const key = isChapterOverdue ? 'Overdue' : c.status;
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });

  const chartTotal = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const chartData = statuses.map(s => ({
    ...s,
    value: statusCounts[s.key] || 0
  })).filter(d => d.value > 0);

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
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Editorial Dashboard</h1>
          <span className="text-sm text-slate-400">Academic project progress tracking and statistics</span>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="glass-card border-indigo-500/20 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-slate-400">Total Books</span>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalBooks}</div>
            <p className="text-xs text-slate-500 mt-1">Active academic projects</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-indigo-500/20 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-slate-400">Total Chapters</span>
            <BookMarked className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalChapters}</div>
            <p className="text-xs text-slate-500 mt-1">Across all publications</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-emerald-500/20 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-slate-400">Completed</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="flex flex-col">
            <div className="text-2xl font-bold text-white">{completedChaptersCount}</div>
            <p className="text-xs text-slate-500 mt-1 mb-2">{completionPercentage}% overall completion</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-orange-500/20 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-slate-400">Pending</span>
            <Clock className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active chapters in progress</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-red-500/20 shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-sm font-medium text-slate-400">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{overdueCount}</div>
            <p className="text-xs text-slate-500 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bar chart - breakdown per book */}
        <Card className="md:col-span-2 glass-card">
          <CardHeader>
            <CardTitle>Chapter Progress per Book</CardTitle>
            <CardDescription>Visual breakdown of chapter stages across active publications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {bookProgressData.length > 0 ? (
                bookProgressData.map(book => (
                  <div key={book.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div
                      className="text-sm font-semibold text-slate-300 truncate w-full md:w-1/4 hover:underline cursor-pointer"
                      title={book.title}
                      onClick={() => handleBookClick(book.id)}
                    >
                      {book.title}
                    </div>
                    <div className="flex-1 flex bg-slate-800/50 rounded overflow-hidden h-4 items-center">
                      {book.completedPercent > 0 && (
                        <div className="bg-emerald-500 h-full" style={{ width: `${book.completedPercent}%` }} title={`Completed: ${book.completedPercent}%`} />
                      )}
                      {book.inprogressPercent > 0 && (
                        <div className="bg-orange-500 h-full" style={{ width: `${book.inprogressPercent}%` }} title={`In Progress: ${book.inprogressPercent}%`} />
                      )}
                      {book.overduePercent > 0 && (
                        <div className="bg-red-500 h-full" style={{ width: `${book.overduePercent}%` }} title={`Overdue: ${book.overduePercent}%`} />
                      )}
                      {book.notstartedPercent > 0 && (
                        <div className="bg-slate-600 h-full" style={{ width: `${book.notstartedPercent}%` }} title={`Not Started: ${book.notstartedPercent}%`} />
                      )}
                    </div>
                    <div className="text-right text-xs font-semibold text-slate-400 md:w-16">{book.completedPercent}%</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 text-sm py-8">No book projects available.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Donut chart - status breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Aggregation of chapter statuses</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-6">
            {chartTotal > 0 ? (
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg width="100%" height="100%" viewBox="0 0 42 42" className="transform -rotate-90">
                  <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
                  {donutSlices.map(slice => {
                    let strokeColor = "#cbd5e1"; // notstarted
                    if (slice.color === "completed") strokeColor = "#10b981";
                    else if (slice.color === "inprogress") strokeColor = "#f97316";
                    else if (slice.color === "review") strokeColor = "#eab308";
                    else if (slice.color === "overdue") strokeColor = "#ef4444";
                    
                    return (
                      <circle
                        key={slice.key}
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke={strokeColor}
                        strokeDasharray={slice.strokeDash}
                        strokeDashoffset={slice.strokeOffset}
                        strokeWidth="4.5"
                      />
                    );
                  })}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold text-white leading-none">{totalChapters}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">Chapters</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm py-12">No data available</div>
            )}
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-xs text-slate-400">
              {statuses.map(s => {
                const count = statusCounts[s.key] || 0;
                let dotColor = "bg-slate-500";
                if (s.color === "completed") dotColor = "bg-emerald-500";
                else if (s.color === "inprogress") dotColor = "bg-orange-500";
                else if (s.color === "review") dotColor = "bg-yellow-500";
                else if (s.color === "overdue") dotColor = "bg-red-500";

                return (
                  <div key={s.key} className="flex items-center gap-1.5" style={{ opacity: count > 0 ? 1 : 0.4 }}>
                    <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                    <span className="truncate">{s.label}: {count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Timeline & Overdue Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline View */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Submissions due in the next 30 days</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-indigo-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-4">
              {upcomingChapters.length > 0 ? (
                upcomingChapters.map(chapter => {
                  const book = books.find(b => b.id === chapter.bookId);
                  const diffDays = getDaysDifference(currentDate, chapter.dueDate);
                  let badgeColor = "bg-slate-800 text-slate-300";
                  if (diffDays === 0) badgeColor = "bg-red-500/10 text-red-400 border border-red-500/20";
                  else if (diffDays <= 7) badgeColor = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
                  else if (diffDays <= 14) badgeColor = "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";

                  return (
                    <div key={chapter.id} className="flex items-start gap-3 border-l-2 border-indigo-500/40 pl-3">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-200">Ch {chapter.chapterNumber}: {chapter.chapterTitle}</span>
                        <span className="text-xs text-slate-500">Book: {book?.title}</span>
                        <span className="text-xs text-slate-400 mt-1">Author: {chapter.authorName} ({formatDateReadable(chapter.dueDate)})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {diffDays === 0 ? 'Due Today' : `In ${diffDays} days`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 gap-2">
                  <Calendar className="h-8 w-8 text-slate-600" />
                  <span className="text-sm">No upcoming deadlines</span>
                  <p className="text-xs text-slate-600">No submissions are due in the next 30 days.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Color-coded Overdue Alerts */}
        <Card className="glass-card border-red-500/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle className="text-red-400">Overdue Alerts</CardTitle>
              <CardDescription>Chapters requiring immediate editorial contact</CardDescription>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3">
              {overdueCount > 0 ? (
                overdueChapters.map(chapter => {
                  const book = books.find(b => b.id === chapter.bookId);
                  const diffDays = getDaysDifference(chapter.dueDate, currentDate);
                  return (
                    <div key={chapter.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-lg p-3 hover:bg-red-500/8 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-200">Ch {chapter.chapterNumber}: {chapter.chapterTitle}</span>
                        <span className="text-xs text-slate-500">Book: {book?.title}</span>
                        <span className="text-xs text-slate-400 mt-1">
                          Author: {chapter.authorName} | Overdue by <strong className="text-red-400">{diffDays} days</strong>
                        </span>
                      </div>
                      <button
                        className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                        title="View in Chapter Tracker"
                        onClick={() => handleBookClick(chapter.bookId)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 gap-2">
                  <CheckCircle className="h-8 w-8 text-emerald-400/80" />
                  <span className="text-sm text-emerald-400/80 font-medium">All chapters on track</span>
                  <p className="text-xs text-slate-600">No chapters are currently overdue.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
