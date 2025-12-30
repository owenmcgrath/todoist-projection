import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import LoginForm from './LoginForm';
import ProjectList from './ProjectList';
import DarkModeToggle from './DarkModeToggle';
import ErrorBanner from './ErrorBanner';
import styles from '@/styles/App.module.css';
import { storage } from '@/utils/api';

export default function App() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { projects, isLoading: tasksLoading, error, fetchedAt } = useTasks();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.getTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storage.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Todoist</h1>
        <div className={styles.headerActions}>
          <DarkModeToggle theme={theme} onToggle={toggleTheme} />
          <button className={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}

      {tasksLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading tasks...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No tasks to display</p>
        </div>
      ) : (
        <>
          <ProjectList projects={projects} />
          {fetchedAt && (
            <p className={styles.fetchedAt}>
              Last updated: {new Date(fetchedAt).toLocaleString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
