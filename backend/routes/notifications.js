const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../db/store');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const notifications = store
    .filter('notifications', (n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifications);
});

router.post('/:id/read', (req, res) => {
  const updated = store.update('notifications', req.params.id, { read: true });
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
});

// Broadcast an announcement to all users (owner/admin only)
router.post('/announce', authorize('owner', 'admin'), (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  const users = store.all('users');
  const created = users.map((u) =>
    store.insert('notifications', {
      id: uuidv4(),
      userId: u.id,
      type: 'announcement',
      message,
      read: false,
      createdAt: new Date().toISOString(),
    })
  );
  res.status(201).json({ sentTo: created.length });
});

module.exports = router;
