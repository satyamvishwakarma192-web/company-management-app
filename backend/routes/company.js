const express = require('express');
const store = require('../db/store');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const DEFAULT_COMPANY = {
  id: 'default',
  name: 'My Company',
  logoUrl: null,
  locations: [],
  history: [],
};

function getCompany() {
  let company = store.find('departments', () => false); // no-op to keep pattern consistent
  const list = store.all('company');
  return list && list[0] ? list[0] : null;
}

router.get('/', (req, res) => {
  const list = store.all('company');
  res.json(list[0] || DEFAULT_COMPANY);
});

router.put('/', authorize('owner'), (req, res) => {
  const list = store.all('company');
  if (list[0]) {
    const updated = store.update('company', list[0].id, req.body);
    return res.json(updated);
  }
  const record = { id: 'default', ...DEFAULT_COMPANY, ...req.body };
  store.insert('company', record);
  res.status(201).json(record);
});

router.post('/history', authorize('owner', 'admin'), (req, res) => {
  const list = store.all('company');
  const { title, date, description } = req.body;
  const milestone = { title, date, description };
  if (list[0]) {
    const history = [...(list[0].history || []), milestone];
    const updated = store.update('company', list[0].id, { history });
    return res.status(201).json(updated);
  }
  const record = { id: 'default', ...DEFAULT_COMPANY, history: [milestone] };
  store.insert('company', record);
  res.status(201).json(record);
});

module.exports = router;
