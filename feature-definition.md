# Todoist Read-Only Projection App

**Motivation:**  
Sharing task visibility with others (team members, family, stakeholders) currently requires giving them Todoist access or manually communicating status. A read-only, password-protected web view allows sharing a live, always-current view of your tasks without granting edit access or exposing your Todoist credentials. This enables transparency and coordination while maintaining control over your task management.

---

**Requirements:**

- The application requires a password to access, entered via a login screen
- The password is configured server-side via environment variable and is never sent to or visible in the client
- The Todoist API token is stored server-side and used only by serverless functions; it is never exposed to the client
- User authentication persists indefinitely via localStorage or long-lived cookie
- Users remain authenticated until they manually clear browser data or click a logout button
- Display all Todoist projects that contain at least one task; hide empty projects
- Display all active (incomplete) tasks within each project
- Display tasks completed within the last 48 hours, visually distinguished from active tasks
- Display subtasks nested under their parent tasks
- Display labels associated with each task
- Filters are out of scope and will not be displayed
- Content is organized as: Projects → Tasks → Subtasks
- Tasks within a project are sorted by priority (P1 highest to P4 lowest), then by due date (most recent first)
- Subtasks follow the same sorting rules within their parent task
- Use a minimalistic, clean interface
- Priority colors match Todoist conventions: P1 = red, P2 = orange, P3 = blue, P4 = no color
- Due date colors match Todoist conventions: overdue = red, today = green, upcoming = contextual
- Provide a dark mode toggle; preference persists in local storage
- Completed tasks are visually distinct (e.g., strikethrough, muted color)
- On initial page load, fetch all projects, tasks, and subtasks from the Todoist API
- Register and receive Todoist webhook events to update the UI in real-time when tasks are added, updated, completed, uncompleted, or deleted
- Cache the most recent data locally; if the Todoist API is unavailable, display the cached data along with an error message indicating the API issue
- Host on Vercel using Vercel serverless functions for all backend logic
- Frontend built with plain React (Vite as build tool)
- Public URL accessible to anyone with the password
- All secrets (API token, password, session secret) stored as Vercel environment variables
- Creating, editing, completing, or deleting tasks is out of scope (read-only view)
- Todoist filters are out of scope
- Multiple users or permission levels are out of scope
- User registration or account management is out of scope

---

**Acceptance Criteria:**

- [ ] Accessing the app URL without authentication displays a password prompt
- [ ] Entering an incorrect password displays an error and does not grant access
- [ ] Entering the correct password grants access that persists indefinitely
- [ ] After entering the correct password, the user remains authenticated across browser sessions
- [ ] Clicking logout clears authentication and returns to the password prompt
- [ ] All projects with at least one task are displayed; projects with zero tasks are hidden
- [ ] Active tasks display within their respective projects
- [ ] Tasks completed in the last 48 hours display with visual distinction (e.g., strikethrough)
- [ ] Subtasks appear nested under their parent tasks
- [ ] Tasks are sorted by priority (P1 first), then by due date (most recent first)
- [ ] Priority indicators use correct Todoist colors (P1=red, P2=orange, P3=blue)
- [ ] Due date indicators use correct Todoist colors (overdue=red, today=green)
- [ ] Dark mode toggle switches theme and preference persists across page reloads
- [ ] Adding a task in Todoist causes it to appear in the app without manual refresh
- [ ] Completing a task in Todoist updates the app view without manual refresh
- [ ] Deleting a task in Todoist removes it from the app without manual refresh
- [ ] When Todoist API is unavailable, the app displays cached data with an error message
- [ ] Browser dev tools and network tab show no exposure of API token or password