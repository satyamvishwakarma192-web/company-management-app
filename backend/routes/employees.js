const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../db/store');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// List all employees (any authenticated user can view the directory)
router.get('/', (req, res) => {
  const { department, status, skill } = req.query;
  let employees = store.all('employees');
  if (department) employees = employees.filter((e) => e.department === department);
  if (status) employees = employees.filter((e) => e.status === status);
  if (skill) employees = employees.filter((e) => (e.skills || []).includes(skill));
  res.json(employees);
});

router.get('/:id', (req, res) => {
  const emp = store.find('employees', (e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

// Only owner/admin can create employee records directly (vs. via self-registration)
router.post('/', authorize('owner', 'admin'), (req, res) => {
  const { name, email, department, skills, grade, managerId, joiningDate, salaryBand } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

  const employee = {
    id: uuidv4(),
    tenantId: req.user.tenantId,
    userId: null,
    name,
    email,
    role: 'employee',
    department: department || null,
    skills: skills || [],
    grade: grade || null,
    managerId: managerId || null,
    salaryBand: salaryBand || null,
    status: 'active',
    joiningDate: joiningDate || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  store.insert('employees', employee);
  res.status(201).json(employee);
});

router.patch('/:id', authorize('owner', 'admin'), (req, res) => {
  const updated = store.update('employees', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Employee not found' });
  res.json(updated);
});

router.delete('/:id', authorize('owner', 'admin'), (req, res) => {
  const ok = store.remove('employees', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Employee not found' });
  res.status(204).end();
});

// Simple job-assignment matcher: score employees against required skills
router.post('/match', authorize('owner', 'admin', 'manager'), (req, res) => {
  const { requiredSkills = [], department } = req.body;
  let pool = store.filter('employees', (e) => e.status === 'active');
  if (department) pool = pool.filter((e) => e.department === department);

  const scored = pool.map((e) => {
    const skills = e.skills || [];
    const matchCount = requiredSkills.filter((s) => skills.includes(s)).length;
    const skillScore = requiredSkills.length ? matchCount / requiredSkills.length : 0;
    // Placeholder weighting: skill match 70%, seniority (grade present) 30%
    const seniorityScore = e.grade ? 1 : 0.5;
    const totalScore = skillScore * 0.7 + seniorityScore * 0.3;
    return { employee: e, matchCount, skillScore, totalScore };
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);
  res.json(scored.slice(0, 10));
});

module.exports = router;
