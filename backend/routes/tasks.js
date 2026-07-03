const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../db/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function notify(userId, type, message) {
  store.insert('notifications', {
    id: uuidv4(),
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

router.get('/', (req, res) => {
  const { projectId, assigneeId, status, priority } = req.query;
  let tasks = store.all('tasks');
  if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
  if (assigneeId) tasks = tasks.filter((t) => (t.assignees || []).includes(assigneeId));
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = store.find('tasks', (t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { title, description, projectId, assignees, priority, dueDate, estimateHours } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const task = {
    id: uuidv4(),
    tenantId: req.user.tenantId,
    projectId: projectId || null,
    title,
    description: description || '',
    assignees: assignees || [],
    priority: priority || 'medium',
    status: 'todo',
    dueDate: dueDate || null,
    estimateHours: estimateHours || null,
    actualHours: 0,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  store.insert('tasks', task);

  (task.assignees || []).forEach((empId) => {
    const emp = store.find('employees', (e) => e.id === empId);
    if (emp && emp.userId) notify(emp.userId, 'task_assigned', `You were assigned to task: ${title}`);
  });

  res.status(201).json(task);
});

router.patch('/:id', (req, res) => {
  const before = store.find('tasks', (t) => t.id === req.params.id);
  if (!before) return res.status(404).json({ error: 'Task not found' });

  const updated = store.update('tasks', req.params.id, req.body);

  if (req.body.status && req.body.status !== before.status) {
    store.insert('auditLogs', {
      id: uuidv4(),
      actorId: req.user.id,
      action: 'task_status_change',
      entityType: 'task',
      entityId: updated.id,
      diff: { from: before.status, to: updated.status },
      timestamp: new Date().toISOString(),
    });
  }
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const ok = store.remove('tasks', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

router.post('/:id/assign', (req, res) => {
  const { employeeId } = req.body;
  const task = store.find('tasks', (t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const assignees = Array.from(new Set([...(task.assignees || []), employeeId]));
  const updated = store.update('tasks', task.id, { assignees });

  const emp = store.find('employees', (e) => e.id === employeeId);
  if (emp && emp.userId) notify(emp.userId, 'task_assigned', `You were assigned to task: ${task.title}`);

  res.json(updated);
});

module.exports = router;
