import { TaskWithSubtasks } from '@/types';
import { getDueDateStatus, formatDueDate, getDueDateColor } from '@/utils/dates';
import styles from '@/styles/TaskItem.module.css';

interface TaskItemProps {
  task: TaskWithSubtasks;
}

export default function TaskItem({ task }: TaskItemProps) {
  const dueStatus = getDueDateStatus(task.due);
  const dueColor = getDueDateColor(dueStatus);
  const formattedDue = formatDueDate(task.due);

  // Don't show completed tasks unless recently completed
  if (task.checked && !task.isRecentlyCompleted) {
    return null;
  }

  const getPriorityClass = () => {
    switch (task.priority) {
      case 4:
        return styles.priority1;
      case 3:
        return styles.priority2;
      case 2:
        return styles.priority3;
      default:
        return '';
    }
  };

  return (
    <li className={`${styles.task} ${task.checked ? styles.completed : ''}`}>
      <div className={styles.taskContent}>
        <span className={`${styles.checkbox} ${getPriorityClass()}`}>
          <span className={styles.checkmark} />
        </span>

        <div className={styles.taskMain}>
          <span className={styles.taskText}>{task.content}</span>

          {task.description && (
            <p className={styles.description}>{task.description}</p>
          )}

          <div className={styles.taskMeta}>
            {formattedDue && (
              <span className={styles.dueDate} style={{ color: dueColor }}>
                <CalendarIcon />
                {formattedDue}
              </span>
            )}

            {task.labels.map((label) => (
              <span key={label} className={styles.label}>
                @{label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {task.subtasks.length > 0 && (
        <ul className={styles.subtasks}>
          {task.subtasks.map((subtask) => (
            <TaskItem key={subtask.id} task={subtask} />
          ))}
        </ul>
      )}
    </li>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
