import { TasksApiResponse, LoginResponse, ApiError } from '@/types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error);
    }

    return response.json();
  }

  async login(password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async getTasks(): Promise<TasksApiResponse> {
    return this.request<TasksApiResponse>('/tasks');
  }
}

export const api = new ApiClient();

// LocalStorage helpers
const STORAGE_KEYS = {
  AUTH_TOKEN: 'todoist_projection_token',
  TASKS_CACHE: 'todoist_projection_cache',
  THEME: 'todoist_projection_theme',
} as const;

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  setToken(token: string) {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  removeToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  getTasksCache(): TasksApiResponse | null {
    const cached = localStorage.getItem(STORAGE_KEYS.TASKS_CACHE);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  },

  setTasksCache(data: TasksApiResponse) {
    localStorage.setItem(STORAGE_KEYS.TASKS_CACHE, JSON.stringify(data));
  },

  clearTasksCache() {
    localStorage.removeItem(STORAGE_KEYS.TASKS_CACHE);
  },

  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
  },

  setTheme(theme: 'light' | 'dark') {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },
};
