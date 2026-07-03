const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const store = require('../db/store');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();
const TENANT_ID = 'default'; // single-tenant MVP; see README for multi-tenant notes

// Only an existing owner may create more owner/admin accounts once one exists.
// The very first registered user automatically becomes the "owner".
router.post('/register', async (req, res) => {
  const { name, email, password, role, department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const existing = store.find('users', (u) => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const isFirstUser = store.all('users').length === 0;
  const finalRole = isFirstUser ? 'owner' : (role || 'employee');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    tenantId: TENANT_ID,
    name,
    email,
    passwordHash,
    role: finalRole,
    department: department || null,
    createdAt: new Date().toISOString(),
  };
  store.insert('users', user);

  // Auto-create a matching employee profile (skip for owner-only accounts if desired)
  store.insert('employees', {
    id: uuidv4(),
    tenantId: TENANT_ID,
    userId: user.id,
    name,
    email,
    role: finalRole,
    department: department || null,
    skills: [],
    grade: null,
    managerId: null,
    status: 'active',
    joiningDate: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const user = store.find('users', (u) => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', authenticate, (req, res) => {
  const user = store.find('users', (u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department });
});

module.exports = router;
