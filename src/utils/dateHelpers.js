/**
 * Date helper utilities for the Book Chapter Workflow Management Portal.
 * All functions accept a custom 'todayStr' (YYYY-MM-DD) to support simulated current dates.
 */

// Parse YYYY-MM-DD string into a clean Date object at local midnight
export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month is 0-indexed in JS Date
  return new Date(year, month - 1, day);
};

// Check if a chapter is overdue
export const isOverdue = (dueDateStr, status, todayStr) => {
  if (status === 'Completed') return false;
  if (!dueDateStr) return false;
  
  const dueDate = parseDate(dueDateStr);
  const today = parseDate(todayStr);
  
  if (!dueDate || !today) return false;
  return dueDate < today;
};

// Get difference in days between two date strings (date2 - date1)
export const getDaysDifference = (dateStr1, dateStr2) => {
  const d1 = parseDate(dateStr1);
  const d2 = parseDate(dateStr2);
  if (!d1 || !d2) return 0;
  
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format YYYY-MM-DD into a human-readable format (e.g. "Oct 12, 2026")
export const formatDateReadable = (dateStr) => {
  if (!dateStr) return 'N/A';
  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return dateStr;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Check if a date is within a future range (e.g., today to today + X days)
export const isDueWithinRange = (dueDateStr, todayStr, rangeDays, status) => {
  if (status === 'Completed') return false;
  if (!dueDateStr) return false;

  const diff = getDaysDifference(todayStr, dueDateStr);
  // Due in the next rangeDays, starting from today (0 to rangeDays)
  return diff >= 0 && diff <= rangeDays;
};

// Check if a date is exactly today
export const isDueToday = (dueDateStr, todayStr, status) => {
  if (status === 'Completed') return false;
  if (!dueDateStr) return false;
  return dueDateStr === todayStr;
};
