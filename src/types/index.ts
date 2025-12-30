// Todoist API Types
export interface Project {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  order: number;
  child_order: number;
  is_inbox_project?: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  collapsed: boolean;
  shared: boolean;
  view_style: 'list' | 'board';
}

export interface Section {
  id: string;
  project_id: string;
  name: string;
  order: number;
  is_deleted: boolean;
  is_archived: boolean;
  collapsed: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  section_id: string | null;
  parent_id: string | null;
  content: string;
  description: string;
  priority: 1 | 2 | 3 | 4; // 4 = P1 (urgent), 1 = P4 (normal)
  due: DueDate | null;
  labels: string[];
  checked: boolean;
  is_deleted: boolean;
  child_order: number;
  added_at: string;
  completed_at?: string | null;
}

export interface DueDate {
  date: string;
  datetime?: string;
  is_recurring: boolean;
  timezone?: string;
  string?: string;
  lang?: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  order: number;
  is_favorite: boolean;
}

// Transformed types for UI
export interface SectionWithTasks {
  id: string | null; // null for "no section" tasks
  name: string | null;
  order: number;
  tasks: TaskWithSubtasks[];
}

export interface ProjectWithTasks extends Omit<Project, 'is_deleted' | 'is_archived'> {
  sections: SectionWithTasks[];
  tasks: TaskWithSubtasks[]; // Keep for backwards compatibility - all tasks flat
}

export interface TaskWithSubtasks extends Omit<Task, 'is_deleted'> {
  subtasks: TaskWithSubtasks[];
  isRecentlyCompleted: boolean;
}

// API Response Types
export interface TodoistSyncResponse {
  projects: Project[];
  items: Task[];
  labels: Label[];
  sync_token: string;
  full_sync: boolean;
}

export interface CompletedItemsResponse {
  items: CompletedItem[];
}

export interface CompletedItem {
  id: string;
  task_id: string;
  content: string;
  project_id: string;
  completed_at: string;
  item_object?: Task;
}

// App State Types
export interface TasksState {
  projects: ProjectWithTasks[];
  labels: Label[];
  syncToken: string | null;
  fetchedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API Request/Response Types
export interface LoginRequest {
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface TasksApiResponse {
  projects: ProjectWithTasks[];
  labels: Label[];
  syncToken: string;
  fetchedAt: string;
}

export interface ApiError {
  error: string;
  cached?: TasksApiResponse;
}

// Webhook Types
export interface WebhookEvent {
  event_name: string;
  user_id: string;
  event_data: Task | Project;
  triggered_at: string;
  version: string;
  initiator?: {
    id: string;
    email: string;
    full_name: string;
  };
}

// SSE Event Types
export type SSEEventType = 
  | 'task_added'
  | 'task_updated'
  | 'task_completed'
  | 'task_uncompleted'
  | 'task_deleted'
  | 'project_updated'
  | 'heartbeat';

export interface SSEEvent {
  type: SSEEventType;
  data: Task | Project | { timestamp: number };
}
