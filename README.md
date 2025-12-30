# Todoist Projection

A read-only web application that displays your Todoist tasks in a shareable, password-protected interface with real-time updates.

*** WARNING!!! THIS IS VIBECODED

## Features

- 🔒 **Password Protected** - Secure access without exposing your Todoist credentials
- 📋 **Full Task Hierarchy** - Projects → Tasks → Subtasks, sorted by priority and due date
- 🎨 **Todoist Colors** - Priority and due date colors match the official Todoist app
- 🌙 **Dark Mode** - Toggle between light and dark themes
- ⚡ **Real-time Updates** - Changes sync via Todoist webhooks
- 📱 **Responsive** - Works on desktop and mobile
- 🔐 **Secure** - API tokens and passwords never exposed to the client

## Setup

### Prerequisites

- Node.js 18+
- A Todoist account
- A Vercel account (for deployment)

### 1. Get Your Todoist API Token

1. Go to [Todoist Settings → Integrations](https://todoist.com/app/settings/integrations)
2. Scroll to "API token" and copy it

### 2. Create a Todoist App (for Webhooks)

1. Go to [Todoist App Console](https://developer.todoist.com/appconsole.html)
2. Create a new app
3. Set the webhook URL to: `https://your-domain.vercel.app/api/webhook`
4. Select events: `item:added`, `item:updated`, `item:completed`, `item:uncompleted`, `item:deleted`
5. Copy the Client Secret

### 3. Local Development

```bash
# Clone and install
cd todoist-projection
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your values:
# - TODOIST_API_TOKEN: Your Todoist API token
# - APP_PASSWORD: Choose a password for app access
# - SESSION_SECRET: Generate a random 32+ character string
# - TODOIST_CLIENT_SECRET: From your Todoist app (for webhooks)

# Start development server
npm run dev
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# - TODOIST_API_TOKEN
# - APP_PASSWORD
# - SESSION_SECRET
# - TODOIST_CLIENT_SECRET
```

### 5. Configure Vercel KV (Optional, for Real-time)

For real-time updates to work across serverless function instances:

1. Go to your Vercel project dashboard
2. Storage → Create → KV
3. The connection variables will be automatically added

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TODOIST_API_TOKEN` | Your Todoist API token |
| `APP_PASSWORD` | Password to access the app |
| `SESSION_SECRET` | Secret for JWT signing (32+ chars) |
| `TODOIST_CLIENT_SECRET` | Todoist app client secret (webhooks) |
| `KV_REST_API_URL` | Vercel KV URL (auto-set) |
| `KV_REST_API_TOKEN` | Vercel KV token (auto-set) |

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Vercel Serverless Functions
- **Styling**: CSS Modules with CSS Variables
- **Auth**: JWT (stateless)
- **Real-time**: Server-Sent Events (SSE)

## Project Structure

```
todoist-projection/
├── api/                    # Vercel Serverless Functions
│   ├── auth/login.ts       # Password authentication
│   ├── tasks.ts            # Fetch tasks from Todoist
│   ├── webhook.ts          # Receive Todoist webhooks
│   └── events.ts           # SSE for real-time updates
├── src/
│   ├── components/         # React components
│   ├── context/            # Auth & Tasks context
│   ├── styles/             # CSS modules
│   ├── types/              # TypeScript types
│   └── utils/              # Helper functions
└── ...config files
```

## License

MIT
