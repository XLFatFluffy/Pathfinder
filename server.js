const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const {
  initializeDatabase,
  getSettings,
  saveSetting,
  getCounts,
  searchRecords,
  createBackup,
  listBackups,
  mapStorageDir,
  listMaps,
  getMap,
  createMap,
  updateMap,
  deleteMap
} = require('./src/db');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const artworkTypes = {
  'image/png': { extension: '.png', signature: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/jpeg': { extension: '.jpg', signature: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  'image/webp': { extension: '.webp', signature: (bytes) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' },
  'image/gif': { extension: '.gif', signature: (bytes) => ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)) }
};
const upload = multer({
  storage: multer.diskStorage({
    destination: mapStorageDir,
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}.upload`)
  }),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!artworkTypes[file.mimetype]) {
      const error = new Error('Unsupported map artwork. Use PNG, JPEG, WebP, or GIF.');
      error.statusCode = 400;
      callback(error);
      return;
    }
    callback(null, true);
  }
});

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

app.get('/api/maps', (req, res) => {
  res.json({ maps: listMaps() });
});

app.post('/api/maps', upload.single('artwork'), (req, res) => {
  const uploaded = req.file;
  let finalPath;

  try {
    if (uploaded && !isValidArtwork(uploaded.path, uploaded.mimetype)) {
      fs.unlinkSync(uploaded.path);
      return res.status(400).json({ error: 'The uploaded file content does not match its image type.' });
    }

    const id = crypto.randomUUID();
    if (uploaded) {
      finalPath = path.join(mapStorageDir, `${id}${artworkTypes[uploaded.mimetype].extension}`);
      fs.renameSync(uploaded.path, finalPath);
    }

    const map = createMap({
      id,
      name: req.body.name,
      mapType: req.body.mapType,
      parentId: req.body.parentId,
      status: req.body.status,
      description: req.body.description,
      filePath: finalPath,
      originalFilename: uploaded?.originalname,
      mimeType: uploaded?.mimetype,
      fileSize: uploaded?.size
    });

    return res.status(201).json({ map });
  } catch (error) {
    removeUploadedFiles(uploaded?.path, finalPath);
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to save map.' });
  }
});

app.put('/api/maps/:id', upload.single('artwork'), (req, res) => {
  const uploaded = req.file;
  const current = getMap(req.params.id);
  let finalPath;
  let updated = false;

  if (!current) {
    removeUploadedFiles(uploaded?.path);
    return res.status(404).json({ error: 'Map not found.' });
  }

  try {
    if (uploaded && !isValidArtwork(uploaded.path, uploaded.mimetype)) {
      fs.unlinkSync(uploaded.path);
      return res.status(400).json({ error: 'The uploaded file content does not match its image type.' });
    }

    if (uploaded) {
      finalPath = path.join(mapStorageDir, `${req.params.id}-${crypto.randomUUID()}${artworkTypes[uploaded.mimetype].extension}`);
      fs.renameSync(uploaded.path, finalPath);
    }

    const map = updateMap(req.params.id, {
      name: req.body.name,
      mapType: req.body.mapType,
      parentId: req.body.parentId,
      status: req.body.status,
      description: req.body.description,
      ...(uploaded ? {
        filePath: finalPath,
        originalFilename: uploaded.originalname,
        mimeType: uploaded.mimetype,
        fileSize: uploaded.size
      } : {})
    });
    updated = true;

    if (uploaded && current.file_path) {
      removeStoredArtwork(current.file_path);
    }
    return res.json({ map });
  } catch (error) {
    if (!updated) {
      removeUploadedFiles(uploaded?.path, finalPath);
    } else {
      console.error(error);
      return res.status(500).json({ error: 'Map was saved, but the previous artwork could not be removed.' });
    }
    const status = error.statusCode || 500;
    if (status === 500) console.error(error);
    return res.status(status).json({ error: error.message || 'Unable to update map.' });
  }
});

app.get('/api/maps/:id/artwork', (req, res) => {
  const map = getMap(req.params.id);
  if (!map || !map.file_path || !isStoredArtworkPath(map.file_path)) {
    return res.status(404).json({ error: 'Map artwork not found.' });
  }

  res.type(map.mime_type);
  res.set('Cache-Control', 'private, no-store');
  return res.sendFile(map.file_path, (error) => {
    if (error && !res.headersSent) {
      res.status(error.statusCode || 500).json({ error: 'Unable to read map artwork.' });
    }
  });
});

app.delete('/api/maps/:id', (req, res) => {
  try {
    const map = deleteMap(req.params.id);
    if (!map) {
      return res.status(404).json({ error: 'Map not found.' });
    }
    if (map.file_path) {
      removeStoredArtwork(map.file_path);
    }
    return res.json({ deleted: true });
  } catch (error) {
    if (error.dependents) {
      return res.status(409).json({
        error: error.message,
        dependents: error.dependents
      });
    }
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  const status = error instanceof multer.MulterError ? 400 : (error.statusCode || 500);
  if (status === 500) {
    console.error(error);
  }
  res.status(status).json({ error: error.message || 'An unexpected server error occurred.' });
});

app.listen(port, () => {
  console.log(`The World Atlas is running on http://localhost:${port}`);
});

function isValidArtwork(filePath, mimeType) {
  const artworkType = artworkTypes[mimeType];
  if (!artworkType) return false;
  const descriptor = fs.openSync(filePath, 'r');
  const bytes = Buffer.alloc(12);
  try {
    const bytesRead = fs.readSync(descriptor, bytes, 0, bytes.length, 0);
    return artworkType.signature(bytes.subarray(0, bytesRead));
  } finally {
    fs.closeSync(descriptor);
  }
}

function isStoredArtworkPath(filePath) {
  const resolvedPath = path.resolve(filePath);
  const relativePath = path.relative(mapStorageDir, resolvedPath);
  return relativePath !== '' && relativePath !== '.' && !relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath);
}

function removeStoredArtwork(filePath) {
  if (isStoredArtworkPath(filePath) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function removeUploadedFiles(...paths) {
  paths.filter(Boolean).forEach((filePath) => {
    if (isStoredArtworkPath(filePath) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}
