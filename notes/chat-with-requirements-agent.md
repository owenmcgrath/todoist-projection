User: I'd like to build a react app that projects my todoist todo list into a read only web application that i can share.

GitHub Copilot: I'll help you build a React app to display your Todoist tasks in a shareable, read-only format. Let me first check what's already in your workspace, then we'll start with requirements gathering. 

Read [](file:///c%3A/Development/sandbox/agent-orchestration/todoist-projection)

The project folder is empty, so we're starting fresh. Let me kick off the requirements phase to ensure we build exactly what you need.

---

## 🚀 Starting New Project: Todoist Read-Only Projection

**Current Phase:** Requirements Gathering  
**Artifacts Created:** None yet  
**Next Step:** Elicit and document requirements

---

Invoking **#tool:requirements** to understand your needs for this Todoist projection app.

Before I have the requirements agent draft a full specification, I'd like to clarify a few things:

### Core Questions

1. **Data Source & Authentication**
   - Do you want to use the Todoist API with your personal API token?
   - Should the app fetch tasks on page load, or poll for updates periodically?

2. **What to Display**
   - All tasks, or specific projects/labels/filters?
   - Should it show task hierarchy (subtasks)?
   - What task details? (due dates, priority, labels, project name, description)

3. **Presentation Style**
   - Simple list view, kanban board, calendar view, or grouped by project/date?
   - Any branding or theme preferences (dark/light mode)?

4. **Sharing Model**
   - Public URL anyone can access?
   - Password-protected?
   - Should the API token be embedded (less secure) or entered at runtime?

5. **Hosting & Deployment**
   - Where do you plan to host this? (Vercel, Netlify, self-hosted, etc.)
   - Static site with client-side API calls, or do you need a backend proxy?

6. **Tech Preferences**
   - Plain React, or frameworks like Next.js/Vite?
   - Any UI library preferences (Tailwind, Material UI, etc.)?

---

Please share your thoughts on these questions, and I'll have the requirements agent draft a complete specification for your approval before we move to technical design.

User: To answer your questions: 

1. I'd like to use the todoist api with a configured api token. The token should not be visible ti tge ckuebt
2. Show all projects, tasks, labels and filters. 
3. The hierarchy should look like projects -> tasks -> subtasks. tasks and subtasks are ordered by priority then by most recent date 
4. The colors of dates and priorities should match the todoist api but use a minimalistic UX. 
5. Add a toggle for dark mode. 
6. this can be accessed via public URL but should be password protected. The password should also be configured server side and should not be visible to the client
7. host with vercel and use plain react.
8. The application should load all projects/tasks/subtasks on pageload, then should respond in realtime via todoist webhooks when tasks are changed.

GitHub Copilot: Excellent, these are clear and well-thought-out requirements! Let me draft a formal requirements specification for your approval.

---

## 📋 Requirements Specification: Todoist Projection App

**Version:** 1.0 Draft  
**Status:** Pending Approval

---

### 1. Overview

A read-only web application that displays Todoist tasks in a shareable, password-protected interface with real-time updates.

---

### 2. Functional Requirements

#### 2.1 Authentication & Security
| ID | Requirement |
|----|-------------|
| FR-1 | App requires password entry before displaying content |
| FR-2 | Password is configured server-side via environment variable |
| FR-3 | Todoist API token is stored server-side, never exposed to client |
| FR-4 | Session persists after successful authentication (cookie/token) |

#### 2.2 Data Display
| ID | Requirement |
|----|-------------|
| FR-5 | Display all Todoist projects |
| FR-6 | Display all tasks within each project |
| FR-7 | Display subtasks nested under parent tasks |
| FR-8 | Display labels associated with tasks |
| FR-9 | Display filters (saved views) |
| FR-10 | Hierarchy: Projects → Tasks → Subtasks |

#### 2.3 Sorting & Organization
| ID | Requirement |
|----|-------------|
| FR-11 | Tasks sorted by priority (P1 highest → P4 lowest) |
| FR-12 | Secondary sort by due date (most recent first) |
| FR-13 | Same sorting applies to subtasks within tasks |

#### 2.4 Visual Design
| ID | Requirement |
|----|-------------|
| FR-14 | Priority colors match Todoist (P1=red, P2=orange, P3=blue, P4=none) |
| FR-15 | Due date colors match Todoist (overdue=red, today=green, etc.) |
| FR-16 | Minimalistic, clean UI design |
| FR-17 | Dark mode toggle with preference persistence |

#### 2.5 Real-time Updates
| ID | Requirement |
|----|-------------|
| FR-18 | Load all data on initial page load |
| FR-19 | Receive real-time updates via Todoist webhooks |
| FR-20 | UI updates automatically when tasks change (add/edit/complete/delete) |

---

### 3. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Host on Vercel |
| NFR-2 | Plain React (no Next.js) with Vite |
| NFR-3 | Serverless functions for API proxy and webhooks |
| NFR-4 | Public URL accessible |
| NFR-5 | Responsive design (desktop + mobile) |
| NFR-6 | Environment variables for all secrets |

---

### 4. Technical Architecture (Preview)

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
├─────────────────────┬───────────────────────────────────┤
│   React Frontend    │      Serverless Functions         │
│   (Vite + React)    │  ┌─────────────────────────────┐  │
│                     │  │ /api/auth     - Login       │  │
│   - Project List    │  │ /api/tasks    - Fetch data  │  │
│   - Task Hierarchy  │  │ /api/webhook  - Todoist WH  │  │
│   - Dark Mode       │  └─────────────────────────────┘  │
└─────────────────────┴───────────────────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   Todoist API   │
                     └─────────────────┘
```

---

### 5. Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `TODOIST_API_TOKEN` | Todoist API authentication |
| `APP_PASSWORD` | Password for app access |
| `SESSION_SECRET` | JWT/session signing key |

---

### 6. Todoist Webhook Events to Handle

- `item:added` - New task created
- `item:updated` - Task modified
- `item:completed` - Task completed
- `item:uncompleted` - Task uncompleted
- `item:deleted` - Task deleted
- `project:added` / `project:updated` / `project:deleted`

---

### 7. Acceptance Criteria

- [ ] User cannot access content without correct password
- [ ] All projects and tasks display in correct hierarchy
- [ ] Tasks sorted by priority, then due date
- [ ] Colors match Todoist conventions
- [ ] Dark mode toggle works and persists
- [ ] Real-time updates reflect within seconds of Todoist changes
- [ ] No secrets visible in browser dev tools or network tab

---

## ❓ Questions Before Approval

1. **Session Duration** - How long should a user stay logged in? (e.g., 24 hours, 7 days, browser session only?)

2. **Completed Tasks** - Should completed tasks be shown or hidden?

3. **Filters Display** - Todoist filters are saved searches. Should we just list them, or actually show the filtered results when clicked?

4. **Real-time Delivery** - For webhooks to push to the client, we need either:
   - **Polling** (client checks every X seconds) - simpler
   - **WebSockets/SSE** (true real-time) - more complex, may need additional infrastructure
   
   Which do you prefer?

---

**Please review and let me know:**
- Any requirements to add, change, or remove?
- Answers to the questions above?

Once approved, I'll move to **Technical Design** phase.

User: you are breaking scope. Please provide the output according to the provided agent instructions

GitHub Copilot: You're right, I apologize. As the Coordinator, I should be invoking the specialist agents rather than doing their work myself.

---

## 📍 Project Status

**Current Phase:** Requirements  
**Artifacts Created:** None yet  
**Pending:** Requirements specification

---

Invoking **#tool:requirements** with the following context:

**Feature:** Todoist Read-Only Projection App

**User-Provided Requirements:**
- Todoist API with server-side token (not exposed to client)
- Display all projects, tasks, labels, and filters
- Hierarchy: Projects → Tasks → Subtasks
- Sort by priority, then by most recent date
- Colors match Todoist API (priorities and dates)
- Minimalistic UX with dark mode toggle
- Public URL, password-protected (password server-side, not visible to client)
- Host on Vercel with plain React
- Load all data on page load, then real-time updates via Todoist webhooks

**Constraints:**
- Secrets must never be exposed to the client
- Vercel serverless functions for backend

---

The requirements agent will now:
1. Analyze these inputs
2. Ask any clarifying questions
3. Produce a formal requirements document with acceptance criteria

Awaiting requirements agent output...

User: requirements agent please take this conversation, provide your feedback, and structure the output according to your instruction

GitHub Copilot: Thank you for the context. Before I finalize the requirements document, I have some clarifying questions to ensure completeness:

---

## Clarifying Questions

### Authentication & Session
1. **Session duration:** After entering the correct password, how long should access persist? (e.g., until browser closes, 24 hours, 7 days?)

### Data Display
2. **Completed tasks:** Should completed tasks be displayed, or only active/incomplete tasks?

3. **Filters behavior:** Todoist filters are saved searches. Should the app:
   - (a) Just list filter names for reference, or
   - (b) Allow clicking a filter to show its matching tasks?

### Real-time Updates
4. **Update mechanism:** Todoist webhooks push to your server, but getting that to the browser requires either:
   - (a) **Polling** – client checks for updates every N seconds (simpler, slight delay)
   - (b) **Server-Sent Events (SSE)** – server pushes updates instantly (more complex)
   
   Which do you prefer, or is the delay from polling acceptable?

### Edge Cases
5. **Empty states:** What should display if a project has no tasks, or if there are no projects at all?

6. **Error handling:** If the Todoist API is unavailable, should the app show cached data, an error message, or something else?

### Scope Boundaries
7. **Out of scope confirmation:** The following are NOT included—correct?
   - Creating, editing, or completing tasks
   - User authentication beyond the shared password
   - Multiple user accounts or permissions

---

Please answer these questions, and I'll produce the formal requirements document in the specified format with Title, Motivation, Requirements, and Acceptance Criteria.

User: 1. browser session duration
2. show completed tasks from the last 48 hours.
3. do not support filters
4. use todoist API's webhooks. 
5. hide empty projects.
6. the app should display the todoist api error to the user and load a cached view of the latest tasks. 
7. Yes, this should be a readonly view

GitHub Copilot: Thank you for the clarity. Here is the formal requirements specification:

---

## Todoist Read-Only Projection App

**Motivation:**  
Sharing task visibility with others (team members, family, stakeholders) currently requires giving them Todoist access or manually communicating status. A read-only, password-protected web view allows sharing a live, always-current view of your tasks without granting edit access or exposing your Todoist credentials. This enables transparency and coordination while maintaining control over your task management.

---

**Requirements:**

### Security
- The application requires a password to access, entered via a login screen
- The password is configured server-side via environment variable and is never sent to or visible in the client
- The Todoist API token is stored server-side and used only by serverless functions; it is never exposed to the client
- User sessions persist for the browser session duration only (cleared when browser closes)

### Data Display
- Display all Todoist projects that contain at least one task; hide empty projects
- Display all active (incomplete) tasks within each project
- Display tasks completed within the last 48 hours, visually distinguished from active tasks
- Display subtasks nested under their parent tasks
- Display labels associated with each task
- Filters are out of scope and will not be displayed

### Hierarchy & Sorting
- Content is organized as: Projects → Tasks → Subtasks
- Tasks within a project are sorted by priority (P1 highest to P4 lowest), then by due date (most recent first)
- Subtasks follow the same sorting rules within their parent task

### Visual Design
- Use a minimalistic, clean interface
- Priority colors match Todoist conventions: P1 = red, P2 = orange, P3 = blue, P4 = no color
- Due date colors match Todoist conventions: overdue = red, today = green, upcoming = contextual
- Provide a dark mode toggle; preference persists in local storage
- Completed tasks are visually distinct (e.g., strikethrough, muted color)

### Data Loading & Real-time Updates
- On initial page load, fetch all projects, tasks, and subtasks from the Todoist API
- Register and receive Todoist webhook events to update the UI in real-time when tasks are added, updated, completed, uncompleted, or deleted
- Cache the most recent data locally; if the Todoist API is unavailable, display the cached data along with an error message indicating the API issue

### Technical Constraints
- Host on Vercel using Vercel serverless functions for all backend logic
- Frontend built with plain React (Vite as build tool)
- Public URL accessible to anyone with the password
- All secrets (API token, password, session secret) stored as Vercel environment variables

### Out of Scope
- Creating, editing, completing, or deleting tasks (read-only view)
- Todoist filters
- Multiple users or permission levels
- User registration or account management

---

**Acceptance Criteria:**

- [ ] Accessing the app URL without authentication displays a password prompt
- [ ] Entering an incorrect password displays an error and does not grant access
- [ ] Entering the correct password grants access for the duration of the browser session
- [ ] Closing and reopening the browser requires re-entering the password
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

---

**Questions resolved during elicitation:**
- Session duration: browser session only
- Completed tasks: shown if completed within 48 hours
- Filters: out of scope
- Real-time: Todoist webhooks
- Empty projects: hidden
- API errors: show error + cached data
- Editing: out of scope (read-only)

---

Please confirm this requirements specification is approved, or let me know of any adjustments needed.

User: I think the password should be able to stay beyond the scope of the session actually. Can we have the client know in perpetuity whether it has entered the password or not? 



GitHub Copilot: Good catch. Let me clarify:

**Proposed Change:**  
Once a user enters the correct password, that authentication persists indefinitely on that browser/device (stored in localStorage or a long-lived cookie), so they never need to re-enter it unless they manually clear browser data.

**Clarifying Questions:**

1. **Logout option:** Should there be a way for users to manually "log out" or clear their access? (e.g., a logout button)

2. **Revocation:** If you change the password server-side, should existing authenticated clients be forced to re-authenticate, or continue with access until they clear their data?

---

If you confirm, I'll update the requirements to:

**Security (revised):**
- User authentication persists indefinitely via localStorage or long-lived cookie
- Users remain authenticated until they manually clear browser data or (optionally) click a logout button

**Acceptance Criteria (revised):**
- [ ] ~~Closing and reopening the browser requires re-entering the password~~
- [ ] After entering the correct password, the user remains authenticated across browser sessions indefinitely
- [ ] (If logout included) Clicking logout clears authentication and returns to the password prompt

Let me know your answers and I'll finalize the updated specification.

User: please ungroup the requirements then output them to the todoist-projection folder in a markdown file "feature-definition".md

GitHub Copilot: I don't currently have file editing tools enabled to create the file directly. Here's the content formatted for you to create the file:

**File:** `todoist-projection/feature-definition.md`

```markdown
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
```

---

Would you like me to enable file editing tools so I can create this file directly, or would you prefer to copy the content above?