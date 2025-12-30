import { TaskWithSubtasks } from '@/types';

/**
 * Sort tasks by priority (highest first), then by due date (earliest first)
 */
export function sortTasks(tasks: TaskWithSubtasks[]): TaskWithSubtasks[] {
  return [...tasks].sort((a, b) => {
    // Completed tasks go to bottom
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }

    // Sort by priority (4 = P1 highest, 1 = P4 lowest)
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }

    // Sort by due date (earliest first, no date last)
    const dateA = getDueDateTimestamp(a);
    const dateB = getDueDateTimestamp(b);

    if (dateA === null && dateB === null) {
      return a.child_order - b.child_order;
    }
    if (dateA === null) return 1;
    if (dateB === null) return -1;

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // Fall back to original order
    return a.child_order - b.child_order;
  });
}

/**
 * Get timestamp from due date for sorting
 */
function getDueDateTimestamp(task: TaskWithSubtasks): number | null {
  if (!task.due) return null;
  
  // Use datetime if available, otherwise date
  const dateStr = task.due.datetime || task.due.date;
  if (!dateStr) return null;
  
  return new Date(dateStr).getTime();
}
