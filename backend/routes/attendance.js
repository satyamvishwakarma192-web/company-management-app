const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../db/store');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function employeeForUser(userId) {
  return store.find('employees', (e) => e.userId === userId);
}

router.post('/checkin', (req, res) => {
  const emp = employeeForUser(req.user.id);
  if (!emp) return res.status(400).json({ error: 'No employee profile linked to this account' });

  const date = todayStr();
  const existing = store.find('attendance', (a) => a.employeeId === emp.id && a.date === date);
  if (existing && existing.checkIn) {
    return res.status(409).json({ error: 'Already checked in today' });
  }

  const record = existing
    ? store.update('attendance', existing.id, { checkIn: new Date().toISOString(), status: 'present' })
    : store.insert('attendance', {
        id: uuidv4(),
        employeeId: emp.id,
        date,
        checkIn: new Date().toISOString(),
        checkOut: null,
        status: 'present',
        leaveType: null,
      });

  res.status(201).json(record);
});

router.post('/checkout', (req, res) => {
  const emp = employeeForUser(req.user.id);
  if (!emp) return res.status(400).json({ error: 'No employee profile linked to this account' });

  const date = todayStr();
  const existing = store.find('attendance', (a) => a.employeeId === emp.id && a.date === date);
  if (!existing || !existing.checkIn) {
    return res.status(400).json({ error: 'You have not checked in today' });
  }
  const updated = store.update('attendance', existing.id, { checkOut: new Date().toISOString() });
  res.json(updated);
});

router.post('/leave', (req, res) => {
  const emp = employeeForUser(req.user.id);
  if (!emp) return res.status(400).json({ error: 'No employee profile linked to this account' });
  const { date, leaveType } = req.body;
  const record = store.insert('attendance', {
    id: uuidv4(),
    employeeId: emp.id,
    date: date || todayStr(),
    checkIn: null,
    checkOut: null,
    status: 'leave',
    leaveType: leaveType || 'unspecified',
  });
  res.status(201).json(record);
});

router.get('/', (req, res) => {
  const { employeeId, from, to } = req.query;
  let records = store.all('attendance');
  if (employeeId) records = records.filter((r) => r.employeeId === employeeId);
  if (from) records = records.filter((r) => r.date >= from);
  if (to) records = records.filter((r) => r.date <= to);
  res.json(records);
});

router.get('/summary', (req, res) => {
  const records = store.all('attendance');
  const employees = store.all('employees');
  const summary = employees.map((e) => {
    const empRecords = records.filter((r) => r.employeeId === e.id);
    const present = empRecords.filter((r) => r.status === 'present').length;
    const leave = empRecords.filter((r) => r.status === 'leave').length;
    return { employeeId: e.id, name: e.name, presentDays: present, leaveDays: leave, totalRecords: empRecords.length };
  });
  res.json(summary);
});

module.exports = router;
