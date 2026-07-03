const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../db/store');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { status, department } = req.query;
  let projects = store.all('projects');
  if (status) projects = projects.filter((p) => p.status === status);
  if (department) projects = projects.filter((p) => p.department === department);

  // Attach computed progress % based on linked tasks
  const withProgress = projects.map((p) => {
    const tasks = store.filter('tasks', (t) => t.projectId === p.id);
    const done = tasks.filter((t) => t.status === 'done').length;
    const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { ...p, taskCount: tasks.length, progress };
  });
  res.json(withProgress);
});

router.get('/:id', (req, res) => {
  const project = store.find('projects', (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const tasks = store.filter('tasks', (t) => t.projectId === project.id);
  res.json({ ...project, tasks });
});

router.post('/', authorize('owner', 'admin', 'manager'), (req, res) => {
  const { name, department, managerId, startDate, endDate, budget, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const project = {
    id: uuidv4(),
    tenantId: req.user.tenantId,
    name,
    description: description || '',
    department: department || null,
    managerId: managerId || null,
    startDate: startDate || null,
    endDate: endDate || null,
    budget: budget || 0,
    actualCost: 0,
    status: 'planning',
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  store.insert('projects', project);
  res.status(201).json(project);
});

router.patch('/:id', authorize('owner', 'admin', 'manager'), (req, res) => {
  const updated = store.update('projects', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Project not found' });
  res.json(updated);
});

router.delete('/:id', authorize('owner', 'admin'), (req, res) => {
  const ok = store.remove('projects', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Project not found' });
  res.status(204).end();
});

module.exports = router;
