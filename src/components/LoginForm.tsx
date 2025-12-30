import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/styles/LoginForm.module.css';

export default function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    try {
      await login(password);
    } catch {
      // Error is handled in context
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Todoist Projection</h1>
        <p className={styles.subtitle}>Enter password to view tasks</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? 'Logging in...' : 'View Tasks'}
          </button>
        </form>
      </div>
    </div>
  );
}
