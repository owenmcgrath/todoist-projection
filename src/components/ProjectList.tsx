import { ProjectWithTasks, SectionWithTasks } from '@/types';
import { getProjectColor } from '@/utils/todoist';
import TaskItem from './TaskItem';
import styles from '@/styles/ProjectList.module.css';

interface ProjectListProps {
  projects: ProjectWithTasks[];
}

export default function ProjectList({ projects }: ProjectListProps) {
  const countActiveTasks = (project: ProjectWithTasks): number => {
    let count = 0;
    const countTasks = (tasks: typeof project.tasks) => {
      tasks.forEach((task) => {
        if (!task.checked || task.isRecentlyCompleted) {
          count++;
        }
        countTasks(task.subtasks);
      });
    };
    countTasks(project.tasks);
    return count;
  };

  const countSectionTasks = (section: SectionWithTasks): number => {
    let count = 0;
    const countTasks = (tasks: typeof section.tasks) => {
      tasks.forEach((task) => {
        if (!task.checked || task.isRecentlyCompleted) {
          count++;
        }
        countTasks(task.subtasks);
      });
    };
    countTasks(section.tasks);
    return count;
  };

  const hasVisibleTasks = (tasks: typeof projects[0]['tasks']): boolean => {
    return tasks.some((task) => {
      if (!task.checked || task.isRecentlyCompleted) return true;
      return hasVisibleTasks(task.subtasks);
    });
  };

  return (
    <div className={styles.projectList}>
      {projects.map((project) => (
        <article key={project.id} className={styles.project}>
          <header className={styles.projectHeader}>
            <span
              className={styles.projectColor}
              style={{ backgroundColor: getProjectColor(project.color) }}
            />
            <h2 className={styles.projectName}>{project.name}</h2>
            <span className={styles.taskCount}>
              {countActiveTasks(project)} tasks
            </span>
          </header>

          {project.sections && project.sections.length > 0 ? (
            <div className={styles.sectionsContainer}>
              {project.sections.map((section) => {
                // Only show named sections (skip "no section" if empty)
                if (!section.name && section.tasks.length === 0) return null;
                
                return (
                  <div key={section.id || 'no-section'} className={styles.section}>
                    {section.name && (
                      <div className={styles.sectionHeader}>
                        <span className={styles.sectionName}>{section.name}</span>
                        <span className={styles.sectionCount}>
                          {countSectionTasks(section)}
                        </span>
                      </div>
                    )}
                    {section.tasks.length > 0 ? (
                      <ul className={styles.taskList}>
                        {section.tasks.map((task) => (
                          <TaskItem key={task.id} task={task} />
                        ))}
                      </ul>
                    ) : (
                      <div className={styles.emptySection}>No tasks</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className={styles.taskList}>
              {project.tasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
