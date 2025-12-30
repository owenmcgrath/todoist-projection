import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { TasksState, ProjectWithTasks, Label } from '@/types';
import { api, storage } from '@/utils/api';
import { useAuth } from './AuthContext';

type TasksAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; projects: ProjectWithTasks[]; labels: Label[]; syncToken: string }
  | { type: 'FETCH_FAILURE'; error: string }
  | { type: 'LOAD_CACHE'; projects: ProjectWithTasks[]; labels: Label[]; syncToken: string; fetchedAt: string }
  | { type: 'CLEAR' };

const initialState: TasksState = {
  projects: [],
  labels: [],
  syncToken: null,
  fetchedAt: null,
  isLoading: true,
  error: null,
};

function tasksReducer(state: TasksState, action: TasksAction): TasksState {
  switch (action.type) {
    case 'FETCH_START':
      // Only show loading spinner if we have no data yet
      return { ...state, isLoading: state.projects.length === 0, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        projects: action.projects,
        labels: action.labels,
        syncToken: action.syncToken,
        fetchedAt: new Date().toISOString(),
        isLoading: false,
        error: null,
      };
    case 'FETCH_FAILURE':
      return { ...state, isLoading: false, error: action.error };
    case 'LOAD_CACHE':
      return {
        ...state,
        projects: action.projects,
        labels: action.labels,
        syncToken: action.syncToken,
        fetchedAt: action.fetchedAt,
        isLoading: false,
      };
    case 'CLEAR':
      return initialState;
    default:
      return state;
  }
}

interface TasksContextValue extends TasksState {
  fetchTasks: () => Promise<void>;
  clearTasks: () => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

// Polling interval in milliseconds (30 seconds)
const POLL_INTERVAL = 30000;

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(tasksReducer, initialState);
  const { isAuthenticated } = useAuth();
  const pollIntervalRef = useRef<number | null>(null);

  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await api.getTasks();
      storage.setTasksCache(data);
      dispatch({
        type: 'FETCH_SUCCESS',
        projects: data.projects,
        labels: data.labels,
        syncToken: data.syncToken,
      });
    } catch (error) {
      const cached = storage.getTasksCache();
      if (cached) {
        dispatch({
          type: 'LOAD_CACHE',
          projects: cached.projects,
          labels: cached.labels,
          syncToken: cached.syncToken,
          fetchedAt: cached.fetchedAt,
        });
        dispatch({
          type: 'FETCH_FAILURE',
          error: `Using cached data. ${error instanceof Error ? error.message : 'Failed to fetch'}`,
        });
      } else {
        dispatch({
          type: 'FETCH_FAILURE',
          error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        });
      }
    }
  }, []);

  const clearTasks = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  // Setup polling when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchTasks();

    // Start polling for updates every 10 seconds
    pollIntervalRef.current = window.setInterval(() => {
      fetchTasks();
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchTasks]);

  // Clear tasks when logged out
  useEffect(() => {
    if (!isAuthenticated) {
      clearTasks();
    }
  }, [isAuthenticated, clearTasks]);

  return (
    <TasksContext.Provider value={{ ...state, fetchTasks, clearTasks }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
