const express = require('express');
const path = require('path');
const {
  initializeDatabase,
  getSettings,
  saveSetting,
  getCounts,
  searchRecords,
  createBackup,
  listBackups
} = require('./src/db');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

initializeDatabase();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(publicDir));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: getSettings().app_name || 'The World Atlas',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.put('/api/settings', (req, res) => {
  const { key, value } = req.body || {};

  if (!key || value === undefined) {
    return res.status(400).json({ error: 'A setting key and value are required.' });
  }

  try {
    const settings = saveSetting(key, value);
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/overview', (req, res) => {
  res.json({
    settings: getSettings(),
    counts: getCounts(),
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  res.json({ query, results: searchRecords(query) });
});

app.get('/api/backups', (req, res) => {
  res.json({ backups: listBackups() });
});

app.post('/api/backups', (req, res) => {
  try {
    const backup = createBackup();
    res.status(201).json({ backup, message: 'Backup created successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`The World Atlas is running on http://localhost:${port}`);
});
