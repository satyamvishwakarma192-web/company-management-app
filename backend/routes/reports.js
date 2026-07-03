const express = require('express');
const store = require('../db/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/dashboard', (req, res) => {
  const employees = store.all('employees');
  const projects = store.all('projects');
  const tasks = store.all('tasks');
  const attendance = store.all('attendance');

  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const tasksByStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const projectsByStatus = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter((a) => a.date === today && a.status === 'present').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  ).length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);

  res.json({
    headcount: employees.length,
    activeEmployees,
    presentToday,
    projectCount: projects.length,
    projectsByStatus,
    taskCount: tasks.length,
    tasksByStatus,
    overdueTasks,
    totalBudget,
    totalActualCost,
    budgetUtilizationPct: totalBudget ? Math.round((totalActualCost / totalBudget) * 100) : 0,
  });
});

module.exports = router;
