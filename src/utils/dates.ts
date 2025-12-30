import { DueDate } from '@/types';

/**
 * Check if a date string is within the last 48 hours
 */
export function isWithinLast48Hours(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  
  const date = new Date(dateStr);
  const now = new Date();
  const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff >= 0 && hoursDiff <= 48;
}

/**
 * Get the start of today in local timezone
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Get due date status for styling
 */
export type DueDateStatus = 'overdue' | 'today' | 'tomorrow' | 'this-week' | 'future' | 'no-date';

export function getDueDateStatus(due: DueDate | null): DueDateStatus {
  if (!due) return 'no-date';
  
  const dueDate = new Date(due.datetime || due.date);
  const today = getStartOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // For datetime, compare with current time; for date-only, compare with end of day
  const compareDate = due.datetime 
    ? new Date() 
    : new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
  
  if (dueDate < compareDate && !due.datetime) {
    // For date-only, check if it's before today
    const dueDateOnly = new Date(due.date);
    if (dueDateOnly < today) {
      return 'overdue';
    }
  } else if (due.datetime && dueDate < new Date()) {
    return 'overdue';
  }
  
  const dueDateOnly = new Date(due.date);
  
  if (dueDateOnly.getTime() === today.getTime()) {
    return 'today';
  }
  
  if (dueDateOnly.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  }
  
  if (dueDateOnly < nextWeek) {
    return 'this-week';
  }
  
  return 'future';
}

/**
 * Format due date for display
 */
export function formatDueDate(due: DueDate | null): string {
  if (!due) return '';
  
  const status = getDueDateStatus(due);
  const dueDate = new Date(due.date);
  
  switch (status) {
    case 'overdue': {
      const days = Math.floor((getStartOfToday().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days} days ago`;
      return formatDate(dueDate);
    }
    case 'today':
      return due.datetime ? formatTime(new Date(due.datetime)) : 'Today';
    case 'tomorrow':
      return due.datetime ? `Tomorrow ${formatTime(new Date(due.datetime))}` : 'Tomorrow';
    case 'this-week':
      return formatWeekday(dueDate);
    default:
      return formatDate(dueDate);
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Get CSS color class for due date status
 */
export function getDueDateColor(status: DueDateStatus): string {
  switch (status) {
    case 'overdue':
      return '#d1453b'; // Red
    case 'today':
      return '#058527'; // Green
    case 'tomorrow':
      return '#692fc2'; // Purple
    case 'this-week':
      return '#246fe0'; // Blue
    default:
      return 'inherit';
  }
}
