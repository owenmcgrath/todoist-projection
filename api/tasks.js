const jwt = require('jsonwebtoken');

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

function transformData(projects, items, labels, completedItems) {
  completedItems = completedItems || [];
  var allItems = items.concat(completedItems);
  var taskMap = new Map();
  var rootTasks = new Map();

  allItems.forEach(function(item) {
    if (item.is_deleted) return;
    var taskWithSubtasks = Object.assign({}, item, {
      subtasks: [],
      isRecentlyCompleted: item.checked && isWithinLast48Hours(item.completed_at),
    });
    taskMap.set(item.id, taskWithSubtasks);
  });

  taskMap.forEach(function(task) {
    if (task.parent_id && taskMap.has(task.parent_id)) {
      var parent = taskMap.get(task.parent_id);
      parent.subtasks.push(task);
    } else {
      var projectTasks = rootTasks.get(task.project_id) || [];
      projectTasks.push(task);
      rootTasks.set(task.project_id, projectTasks);
    }
  });

  taskMap.forEach(function(task) {
    task.subtasks = sortTasks(task.subtasks);
  });

  var projectsWithTasks = projects
    .filter(function(p) { return !p.is_deleted && !p.is_archived; })
    .map(function(project) {
      var tasks = rootTasks.get(project.id) || [];
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
        tasks: sortTasks(tasks),
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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  var todoistToken = process.env.TODOIST_API_TOKEN;

  if (!todoistToken) {
    console.error('Missing TODOIST_API_TOKEN environment variable');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    var syncResponse = await fetch('https://api.todoist.com/sync/v9/sync', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + todoistToken,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sync_token: '*',
        resource_types: JSON.stringify(['projects', 'items', 'labels']),
      }),
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
      syncData.items || [],
      syncData.labels || [],
      completedItems
    );

    return res.status(200).json({
      projects: result.projects,
      labels: result.labels,
      syncToken: syncData.sync_token,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
