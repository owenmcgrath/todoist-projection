import { Project, Task, Label, ProjectWithTasks, TaskWithSubtasks } from '@/types';
import { sortTasks } from './sorting';
import { isWithinLast48Hours } from './dates';

/**
 * Transform raw Todoist API data into nested structure for UI
 */
export function transformTodoistData(
  projects: Project[],
  items: Task[],
  labels: Label[],
  completedItems: Task[] = []
): { projects: ProjectWithTasks[]; labels: Label[] } {
  // Combine active and recently completed items
  const allItems = [...items, ...completedItems];
  
  // Build task hierarchy
  const taskMap = new Map<string, TaskWithSubtasks>();
  const rootTasks = new Map<string, TaskWithSubtasks[]>();

  // First pass: create TaskWithSubtasks for each item
  allItems.forEach((item) => {
    if (item.is_deleted) return;
    
    const taskWithSubtasks: TaskWithSubtasks = {
      ...item,
      subtasks: [],
      isRecentlyCompleted: item.checked && isWithinLast48Hours(item.completed_at),
    };
    taskMap.set(item.id, taskWithSubtasks);
  });

  // Second pass: build parent-child relationships
  taskMap.forEach((task) => {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      const parent = taskMap.get(task.parent_id)!;
      parent.subtasks.push(task);
    } else {
      // Root task - group by project
      const projectTasks = rootTasks.get(task.project_id) || [];
      projectTasks.push(task);
      rootTasks.set(task.project_id, projectTasks);
    }
  });

  // Sort subtasks within each parent
  taskMap.forEach((task) => {
    task.subtasks = sortTasks(task.subtasks);
  });

  // Build project list with tasks
  const projectsWithTasks: ProjectWithTasks[] = projects
    .filter((p) => !p.is_deleted && !p.is_archived)
    .map((project) => {
      const tasks = rootTasks.get(project.id) || [];
      return {
        id: project.id,
        name: project.name,
        color: project.color,
        parent_id: project.parent_id,
        order: project.order,
        child_order: project.child_order,
        is_inbox_project: project.is_inbox_project,
        collapsed: project.collapsed,
        shared: project.shared,
        view_style: project.view_style,
        sections: [], // No section support yet - all tasks in default section
        tasks: sortTasks(tasks),
      };
    })
    // Filter out empty projects (no active tasks and no recently completed)
    .filter((project) => {
      return hasVisibleTasks(project.tasks);
    })
    // Sort projects by order
    .sort((a, b) => {
      // Inbox always first
      if (a.is_inbox_project) return -1;
      if (b.is_inbox_project) return 1;
      return a.order - b.order;
    });

  return {
    projects: projectsWithTasks,
    labels: labels.filter((l) => l.name), // Filter out empty labels
  };
}

/**
 * Check if a project has any visible tasks (active or recently completed)
 */
function hasVisibleTasks(tasks: TaskWithSubtasks[]): boolean {
  return tasks.some((task) => {
    if (!task.checked || task.isRecentlyCompleted) {
      return true;
    }
    return hasVisibleTasks(task.subtasks);
  });
}

/**
 * Todoist color name to hex mapping
 */
export const TODOIST_COLORS: Record<string, string> = {
  berry_red: '#b8255f',
  red: '#db4035',
  orange: '#ff9933',
  yellow: '#fad000',
  olive_green: '#afb83b',
  lime_green: '#7ecc49',
  green: '#299438',
  mint_green: '#6accbc',
  teal: '#158fad',
  sky_blue: '#14aaf5',
  light_blue: '#96c3eb',
  blue: '#4073ff',
  grape: '#884dff',
  violet: '#af38eb',
  lavender: '#eb96eb',
  magenta: '#e05194',
  salmon: '#ff8d85',
  charcoal: '#808080',
  grey: '#b8b8b8',
  taupe: '#ccac93',
};

/**
 * Get hex color for Todoist color name
 */
export function getProjectColor(colorName: string): string {
  return TODOIST_COLORS[colorName] || TODOIST_COLORS.charcoal;
}

/**
 * Priority colors matching Todoist
 */
export const PRIORITY_COLORS: Record<number, string> = {
  4: '#d1453b', // P1 - Red (urgent)
  3: '#eb8909', // P2 - Orange
  2: '#246fe0', // P3 - Blue
  1: 'transparent', // P4 - No color (normal)
};

/**
 * Get priority display info
 */
export function getPriorityInfo(priority: number): { color: string; label: string } {
  return {
    color: PRIORITY_COLORS[priority] || 'transparent',
    label: `P${5 - priority}`, // Convert API priority to display (4 -> P1, 1 -> P4)
  };
}
