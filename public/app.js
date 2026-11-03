const summaryGrid = document.getElementById('summaryGrid');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const settingsForm = document.getElementById('settingsForm');
const backupButton = document.getElementById('backupButton');
const backupList = document.getElementById('backupList');
const campaignTitle = document.getElementById('campaignTitle');
const mapForm = document.getElementById('mapForm');
const mapLibrary = document.getElementById('mapLibrary');
const mapFormMessage = document.getElementById('mapFormMessage');
const mapSubmitButton = document.getElementById('mapSubmitButton');
const mapCancelButton = document.getElementById('mapCancelButton');

const sectionButtons = [...document.querySelectorAll('.nav-item')];
const panels = [...document.querySelectorAll('.panel')];
let maps = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function renderSummary(data) {
  const labels = {
    locations: 'Locations',
    houses: 'Noble Houses',
    npcs: 'NPCs',
    factions: 'Factions',
    maps: 'Maps',
    shops: 'Shops',
    quests: 'Quests',
    sessions: 'Sessions',
    timeline_events: 'Timeline Events',
    simulation_events: 'Simulation Events'
  };

  const cards = Object.entries(data).map(([key, value]) => `
    <article class="summary-card">
      <div class="number">${value}</div>
      <div class="label">${labels[key] || key}</div>
    </article>
  `);

  summaryGrid.innerHTML = cards.join('');
}

async function loadOverview() {
  const response = await fetch('/api/overview');
  const payload = await response.json();

  renderSummary(payload.counts || {});
  campaignTitle.textContent = payload.settings?.campaign_name || 'Untitled Campaign';

  Object.entries(payload.settings || {}).forEach(([key, value]) => {
    const input = settingsForm.elements.namedItem(key);
    if (input) input.value = value;
  });
}

async function performSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    searchResults.innerHTML = '<div class="result-item">Enter a search term to find campaign records.</div>';
    return;
  }

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const payload = await response.json();

  if (!payload.results.length) {
    searchResults.innerHTML = '<div class="result-item">No records match your search yet.</div>';
    return;
  }

  searchResults.innerHTML = payload.results.map((result) => `
    <div class="result-item">
      <small>${result.type}</small>
      <strong>${result.label}</strong>
      <div>${result.summary}</div>
    </div>
  `).join('');
}

async function loadBackups() {
  const response = await fetch('/api/backups');
  const payload = await response.json();

  const backups = payload.backups || [];

  if (!backups.length) {
    backupList.innerHTML = '<div class="backup-item"><span>No backups recorded yet.</span></div>';
    return;
  }

  backupList.innerHTML = backups.map((backup) => `
    <div class="backup-item">
      <span>${new Date(backup.created_at).toLocaleString()}</span>
      <span>${Math.round(Number(backup.size_bytes || 0) / 1024)} KB</span>
    </div>
  `).join('');
}

async function saveSettings(event) {
  event.preventDefault();

  const formData = new FormData(settingsForm);
  const values = [...formData.entries()];

  for (const [key, value] of values) {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
  }

  await loadOverview();
  alert('Settings saved successfully.');
}

async function createBackup() {
  const response = await fetch('/api/backups', { method: 'POST' });
  const payload = await response.json();

  if (!response.ok) {
    alert(payload.error || 'Backup failed.');
    return;
  }

  await loadBackups();
  alert(`Backup created: ${payload.backup.file_path}`);
}

function updateParentMapOptions(selectedParentId = '') {
  const parentSelect = mapForm.elements.namedItem('parentId');
  const currentId = mapForm.elements.namedItem('id').value;
  const options = maps
    .filter((map) => map.id !== currentId)
    .map((map) => `<option value="${escapeHtml(map.id)}">${escapeHtml(map.name)} (${escapeHtml(map.map_type)})</option>`);

  parentSelect.innerHTML = '<option value="">No parent</option>' + options.join('');
  parentSelect.value = selectedParentId;
}

async function loadMaps() {
  const response = await fetch('/api/maps');
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load maps.');
  }
  maps = payload.maps || [];
  updateParentMapOptions(mapForm.elements.namedItem('parentId').value);
  renderMaps();
}

function renderMaps() {
  if (!maps.length) {
    mapLibrary.innerHTML = '<div class="empty-state">No maps yet. Add your first map above to begin building the atlas.</div>';
    return;
  }

  mapLibrary.innerHTML = maps.map((map) => {
    const artwork = map.file_path
      ? `<img src="/api/maps/${encodeURIComponent(map.id)}/artwork" alt="Artwork for ${escapeHtml(map.name)}" loading="lazy" />`
      : '<div class="map-art-placeholder">Artwork not imported</div>';
    const parent = map.parent_name ? `<span>Parent: ${escapeHtml(map.parent_name)}</span>` : '<span>Top-level map</span>';

    return `
      <article class="map-card">
        <div class="map-card-art">${artwork}</div>
        <div class="map-card-content">
          <div class="map-card-heading">
            <div>
              <span class="map-level">${escapeHtml(map.map_type || 'Map')}</span>
              <h4>${escapeHtml(map.name)}</h4>
            </div>
            <span class="map-status">${escapeHtml(String(map.status || 'unknown').replaceAll('_', ' '))}</span>
          </div>
          <p>${escapeHtml(map.description || 'No description added.')}</p>
          <div class="map-card-meta">${parent}${map.original_filename ? `<span>${escapeHtml(map.original_filename)}</span>` : ''}</div>
          <div class="map-card-actions">
            <button type="button" class="secondary-button" data-map-edit="${escapeHtml(map.id)}">Edit</button>
            <button type="button" class="danger-button" data-map-delete="${escapeHtml(map.id)}">Delete</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  mapLibrary.querySelectorAll('[data-map-edit]').forEach((button) => {
    button.addEventListener('click', () => editMap(button.dataset.mapEdit));
  });
  mapLibrary.querySelectorAll('[data-map-delete]').forEach((button) => {
    button.addEventListener('click', () => removeMap(button.dataset.mapDelete));
  });
}

function editMap(id) {
  const map = maps.find((entry) => entry.id === id);
  if (!map) return;

  mapForm.elements.namedItem('id').value = map.id;
  mapForm.elements.namedItem('name').value = map.name;
  mapForm.elements.namedItem('mapType').value = map.map_type || 'world';
  mapForm.elements.namedItem('status').value = map.status || 'unknown';
  mapForm.elements.namedItem('description').value = map.description || '';
  mapForm.elements.namedItem('artwork').value = '';
  updateParentMapOptions(map.parent_id || '');
  mapSubmitButton.textContent = 'Save map';
  mapCancelButton.hidden = false;
  mapFormMessage.textContent = 'Editing map details. Choose artwork only if you want to replace the current image.';
  mapForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetMapForm() {
  mapForm.reset();
  mapForm.elements.namedItem('id').value = '';
  mapSubmitButton.textContent = 'Add map';
  mapCancelButton.hidden = true;
  mapFormMessage.textContent = '';
  updateParentMapOptions();
}

async function saveMap(event) {
  event.preventDefault();
  mapFormMessage.textContent = '';
  const id = mapForm.elements.namedItem('id').value;
  const formData = new FormData(mapForm);
  if (!formData.get('artwork')?.size) {
    formData.delete('artwork');
  }
  formData.delete('id');

  const response = await fetch(id ? `/api/maps/${encodeURIComponent(id)}` : '/api/maps', {
    method: id ? 'PUT' : 'POST',
    body: formData
  });
  const payload = await response.json();
  if (!response.ok) {
    mapFormMessage.textContent = payload.error || 'Unable to save map.';
    return;
  }

  resetMapForm();
  await loadMaps();
  await loadOverview();
}

async function removeMap(id) {
  const map = maps.find((entry) => entry.id === id);
  if (!map || !window.confirm(`Delete "${map.name}"? This cannot be undone.`)) return;

  const response = await fetch(`/api/maps/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const payload = await response.json();
  if (!response.ok) {
    const dependents = payload.dependents;
    const usage = dependents
      ? ` It has ${dependents.childMaps} child map(s) and ${dependents.locations} linked location(s).`
      : '';
    window.alert(`${payload.error || 'Unable to delete map.'}${usage}`);
    return;
  }

  resetMapForm();
  await loadMaps();
  await loadOverview();
}

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    sectionButtons.forEach((item) => item.classList.toggle('active', item === button));
    panels.forEach((panel) => panel.classList.toggle('active-panel', panel.id === button.dataset.section));
    if (button.dataset.section === 'maps') {
      loadMaps().catch((error) => {
        mapFormMessage.textContent = error.message;
      });
    }
  });
});

searchInput.addEventListener('input', performSearch);
settingsForm.addEventListener('submit', saveSettings);
backupButton.addEventListener('click', createBackup);
mapForm.addEventListener('submit', saveMap);
mapCancelButton.addEventListener('click', resetMapForm);

loadOverview();
loadBackups();
loadMaps().catch((error) => {
  mapFormMessage.textContent = error.message;
});
performSearch();
