require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============ AUTH ============
app.post('/api/auth/login', (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const appPassword = process.env.APP_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET;

    if (!appPassword || !sessionSecret) {
      console.error('Missing APP_PASSWORD or SESSION_SECRET environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (password !== appPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      {
        sub: 'app_user',
        iat: Math.floor(Date.now() / 1000),
      },
      sessionSecret
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ TASKS ============
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    return false;
  }

  try {
    jwt.verify(token, sessionSecret);
    return true;
  } catch (e) {
    return false;
  }
}

function isWithinLast48Hours(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= 0 && hoursDiff <= 48;
}

function sortTasks(tasks) {
  return tasks.slice().sort(function(a, b) {
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    var dateA = a.due && (a.due.datetime || a.due.date);
    var dateB = b.due && (b.due.datetime || b.due.date);
    if (!dateA && !dateB) return a.child_order - b.child_order;
    if (!dateA) return 1;
    if (!dateB) return -1;
    var timeA = new Date(dateA).getTime();
    var timeB = new Date(dateB).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.child_order - b.child_order;
  });
}

function hasVisibleTasks(tasks) {
  return tasks.some(function(task) {
    if (!task.checked || task.isRecentlyCompleted) return true;
    return hasVisibleTasks(task.subtasks);
  });
}

function transformData(projects, sections, items, labels, completedItems) {
  completedItems = completedItems || [];
  var allItems = items.concat(completedItems);
  var taskMap = new Map();
  var rootTasks = new Map(); // projectId -> sectionId -> tasks[]

  // Build task map
  allItems.forEach(function(item) {
    if (item.is_deleted) return;
    var taskWithSubtasks = Object.assign({}, item, {
      subtasks: [],
      isRecentlyCompleted: item.checked && isWithinLast48Hours(item.completed_at),
    });
    taskMap.set(item.id, taskWithSubtasks);
  });

  // Build task hierarchy (subtasks)
  taskMap.forEach(function(task) {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      var parent = taskMap.get(task.parent_id);
      parent.subtasks.push(task);
    } else {
      // Root task - organize by project and section
      var projectId = task.project_id;
      var sectionId = task.section_id || '__no_section__';
      
      if (!rootTasks.has(projectId)) {
        rootTasks.set(projectId, new Map());
      }
      var projectSections = rootTasks.get(projectId);
      
      if (!projectSections.has(sectionId)) {
        projectSections.set(sectionId, []);
      }
      projectSections.get(sectionId).push(task);
    }
  });

  // Sort subtasks
  taskMap.forEach(function(task) {
    task.subtasks = sortTasks(task.subtasks);
  });

  // Build section map for quick lookup
  var sectionMap = new Map();
  sections.forEach(function(section) {
    if (!section.is_deleted && !section.is_archived) {
      sectionMap.set(section.id, section);
    }
  });

  var projectsWithTasks = projects
    .filter(function(p) { return !p.is_deleted && !p.is_archived; })
    .map(function(project) {
      var projectSections = rootTasks.get(project.id) || new Map();
      var allProjectTasks = [];
      
      // Build sections array
      var sectionsArray = [];
      
      // First, add "no section" tasks if any
      var noSectionTasks = projectSections.get('__no_section__') || [];
      if (noSectionTasks.length > 0) {
        var sortedNoSection = sortTasks(noSectionTasks);
        sectionsArray.push({
          id: null,
          name: null,
          order: -1,
          tasks: sortedNoSection,
        });
        allProjectTasks = allProjectTasks.concat(sortedNoSection);
      }
      
      // Then add sections with their tasks
      var projectSectionsList = sections
        .filter(function(s) { 
          return s.project_id === project.id && !s.is_deleted && !s.is_archived; 
        })
        .sort(function(a, b) { return a.order - b.order; });
      
      projectSectionsList.forEach(function(section) {
        var sectionTasks = projectSections.get(section.id) || [];
        var sortedTasks = sortTasks(sectionTasks);
        sectionsArray.push({
          id: section.id,
          name: section.name,
          order: section.order,
          tasks: sortedTasks,
        });
        allProjectTasks = allProjectTasks.concat(sortedTasks);
      });

      return {
        id: project.id,
        name: project.name,
        color: project.color,
        parent_id: project.parent_id,
        order: project.order,
        child_order: project.child_order,
        is_inbox_project: project.is_inbox_project,
        collapsed: project.collapsed,
        shared: project.shared,
        view_style: project.view_style,
        sections: sectionsArray,
        tasks: allProjectTasks, // flat list for backwards compat
      };
    })
    .filter(function(project) { return hasVisibleTasks(project.tasks); })
    .sort(function(a, b) {
      if (a.is_inbox_project) return -1;
      if (b.is_inbox_project) return 1;
      return a.order - b.order;
    });

  return {
    projects: projectsWithTasks,
    labels: labels.filter(function(l) { return l.name; }),
  };
}

app.get('/api/tasks', async (req, res) => {
  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var todoistToken = process.env.TODOIST_API_TOKEN;

  if (!todoistToken) {
    console.error('Missing TODOIST_API_TOKEN environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Create abort controller for timeout
  var controller = new AbortController();
  var timeout = setTimeout(function() { controller.abort(); }, 30000); // 30 second timeout

  try {
    var syncResponse = await fetch('https://api.todoist.com/sync/v9/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + todoistToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sync_token: '*',
        resource_types: JSON.stringify(['projects', 'sections', 'items', 'labels']),
      }),
      signal: controller.signal,
    });

    if (!syncResponse.ok) {
      var errorText = await syncResponse.text();
      console.error('Todoist API error:', syncResponse.status, errorText);
      return res.status(502).json({ error: 'Failed to fetch from Todoist' });
    }

    var syncData = await syncResponse.json();

    var since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    var completedResponse = await fetch(
      'https://api.todoist.com/sync/v9/completed/get_all?since=' + encodeURIComponent(since) + '&annotate_items=true&limit=200',
      {
        headers: {
          'Authorization': 'Bearer ' + todoistToken,
        },
      }
    );

    var completedItems = [];
    if (completedResponse.ok) {
      var completedData = await completedResponse.json();
      completedItems = (completedData.items || [])
        .filter(function(item) { return item.item_object; })
        .map(function(item) {
          return Object.assign({}, item.item_object, {
            checked: true,
            completed_at: item.completed_at,
          });
        });
    }

    var result = transformData(
      syncData.projects || [],
      syncData.sections || [],
      syncData.items || [],
      syncData.labels || [],
      completedItems
    );

    clearTimeout(timeout);
    return res.status(200).json({
      projects: result.projects,
      labels: result.labels,
      syncToken: syncData.sync_token,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    clearTimeout(timeout);
    console.error('Tasks fetch error:', error);
    
    // Better error message for timeout/network issues
    var errorMessage = 'Internal server error';
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout - Todoist API took too long to respond';
    } else if (error.cause && error.cause.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = 'Connection timeout - check your network connection';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(502).json({ error: errorMessage });
  }
});

// ============ WEBHOOK ============
function verifyWebhookSignature(payload, signature, clientSecret) {
  if (!signature) return false;

  var hmac = crypto.createHmac('sha256', clientSecret);
  hmac.update(payload);
  var expectedSignature = hmac.digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (e) {
    return false;
  }
}

app.post('/api/webhook', (req, res) => {
  var clientSecret = process.env.TODOIST_CLIENT_SECRET;

  if (!clientSecret) {
    console.error('Missing TODOIST_CLIENT_SECRET environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  var rawBody = JSON.stringify(req.body);
  var signature = req.headers['x-todoist-hmac-sha256'];

  if (!verifyWebhookSignature(rawBody, signature, clientSecret)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    var payload = req.body;
    
    console.log('Received webhook:', {
      event: payload.event_name,
      user: payload.user_id,
      triggered_at: payload.triggered_at,
    });

    return res.status(200).end();
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ SSE EVENTS ============
function verifyTokenFromQuery(token) {
  if (!token) {
    return { valid: false };
  }

  var sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    return { valid: false };
  }

  try {
    var decoded = jwt.verify(token, sessionSecret);
    return { valid: true, userId: decoded.sub };
  } catch (e) {
    return { valid: false };
  }
}

app.get('/api/events', (req, res) => {
  var token = req.query.token;
  var result = verifyTokenFromQuery(token);

  if (!result.valid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write('event: connected\ndata: ' + JSON.stringify({ timestamp: Date.now() }) + '\n\n');

  var heartbeatCount = 0;
  var maxHeartbeats = 300; // 5 minutes

  var heartbeatInterval = setInterval(function() {
    heartbeatCount++;
    res.write('event: heartbeat\ndata: ' + JSON.stringify({ timestamp: Date.now() }) + '\n\n');

    if (heartbeatCount >= maxHeartbeats) {
      clearInterval(heartbeatInterval);
      res.end();
    }
  }, 1000);

  req.on('close', function() {
    clearInterval(heartbeatInterval);
  });
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
