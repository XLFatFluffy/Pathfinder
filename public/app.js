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
const atlasMapPicker = document.getElementById('atlasMapPicker');
const atlasMapTitle = document.getElementById('atlasMapTitle');
const atlasMapRoot = document.getElementById('atlasMap');
const atlasMapWrap = document.getElementById('atlasMapWrap');
const atlasMapMessage = document.getElementById('atlasMapMessage');
const atlasBreadcrumbs = document.getElementById('atlasBreadcrumbs');
const atlasDetails = document.getElementById('atlasDetails');

const sectionButtons = [...document.querySelectorAll('.nav-item')];
const panels = [...document.querySelectorAll('.panel')];
let maps = [];
let atlasMap;
let atlasImageOverlay;
let atlasImageBounds;
let activeMapId = '';
let atlasLoadToken = 0;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getArtworkUrl(map) {
  const filename = String(map.file_path || '').split(/[\\/]/).pop();
  return `/api/maps/${encodeURIComponent(map.id)}/artwork?v=${encodeURIComponent(filename)}`;
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
  renderAtlasMapPicker();
}

function getMapHierarchy(map) {
  const hierarchy = [];
  const visited = new Set();
  let current = map;

  while (current && !visited.has(current.id)) {
    hierarchy.unshift(current);
    visited.add(current.id);
    current = maps.find((entry) => entry.id === current.parent_id);
  }

  return hierarchy;
}

function renderAtlasMapPicker() {
  const options = maps.map((map) => {
    const hierarchy = getMapHierarchy(map).map((entry) => entry.name).join(' / ');
    const artworkLabel = map.file_path ? '' : ' — artwork missing';
    return `<option value="${escapeHtml(map.id)}">${escapeHtml(`${hierarchy} (${map.map_type})${artworkLabel}`)}</option>`;
  });
  atlasMapPicker.innerHTML = options.join('');
  atlasMapPicker.disabled = maps.length === 0;

  let selectedMap = maps.find((map) => map.id === activeMapId);
  if (!selectedMap) {
    const rememberedMapId = localStorage.getItem('pathfinder-atlas-map');
    selectedMap = maps.find((map) => map.id === rememberedMapId)
      || maps.find((map) => !map.parent_id && ['world', 'continent'].includes(map.map_type) && map.file_path)
      || maps.find((map) => map.file_path)
      || maps[0];
  }

  atlasMapPicker.value = selectedMap?.id || '';
  if (selectedMap) {
    showAtlasMap(selectedMap.id);
  } else {
    showAtlasMap('');
  }
}

function ensureLeafletMap() {
  if (atlasMap) return;

  atlasMap = L.map(atlasMapRoot, {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 5,
    zoomSnap: 0.25,
    zoomDelta: 0.5,
    zoomControl: false,
    attributionControl: false
  });
}

function showAtlasMessage(message) {
  atlasMapMessage.textContent = message;
  atlasMapMessage.hidden = false;
  atlasMapWrap.classList.add('is-empty');
}

function renderAtlasBreadcrumbs(map) {
  const hierarchy = getMapHierarchy(map);
  atlasBreadcrumbs.innerHTML = hierarchy.map((entry, index) => {
    const current = index === hierarchy.length - 1;
    return current
      ? `<span aria-current="page">${escapeHtml(entry.name)}</span>`
      : `<button type="button" data-atlas-map="${escapeHtml(entry.id)}">${escapeHtml(entry.name)}</button>`;
  }).join('<span class="breadcrumb-divider">›</span>');

  atlasBreadcrumbs.querySelectorAll('[data-atlas-map]').forEach((button) => {
    button.addEventListener('click', () => showAtlasMap(button.dataset.atlasMap));
  });
}

function renderAtlasDetails(map, dimensions = null) {
  if (!map) {
    atlasDetails.innerHTML = '';
    return;
  }

  const details = [
    `<span>${escapeHtml(map.map_type || 'Map')}</span>`,
    `<span>${escapeHtml(String(map.status || 'unknown').replaceAll('_', ' '))}</span>`
  ];
  if (dimensions) {
    details.push(`<span>${dimensions.width.toLocaleString()} × ${dimensions.height.toLocaleString()} px</span>`);
  }
  if (map.original_filename) {
    details.push(`<span>${escapeHtml(map.original_filename)}</span>`);
  }

  atlasDetails.innerHTML = `
    <div class="atlas-detail-heading">
      <h4>${escapeHtml(map.name)}</h4>
      <div class="atlas-detail-meta">${details.join('')}</div>
    </div>
    <p>${escapeHtml(map.description || 'No description added to this map.')}</p>
  `;
}

function showAtlasMap(id) {
  const map = maps.find((entry) => entry.id === id);
  activeMapId = map?.id || '';
  atlasMapPicker.value = activeMapId;
  if (activeMapId) {
    localStorage.setItem('pathfinder-atlas-map', activeMapId);
  }

  const loadToken = ++atlasLoadToken;
  if (atlasImageOverlay && atlasMap) {
    atlasMap.removeLayer(atlasImageOverlay);
    atlasImageOverlay = null;
  }
  atlasImageBounds = null;
  document.getElementById('atlasZoomIn').disabled = !map?.file_path;
  document.getElementById('atlasZoomOut').disabled = !map?.file_path;
  document.getElementById('atlasFit').disabled = !map?.file_path;

  if (!map) {
    atlasMapTitle.textContent = 'The campaign world';
    atlasBreadcrumbs.replaceChildren();
    renderAtlasDetails(null);
    showAtlasMessage('Add a map with artwork in Map Library to begin exploring the atlas.');
    return;
  }

  atlasMapTitle.textContent = map.name;
  renderAtlasBreadcrumbs(map);
  renderAtlasDetails(map);

  if (!map.file_path) {
    showAtlasMessage('This map does not have artwork yet. Import an image in Map Library to view it here.');
    return;
  }

  showAtlasMessage('Loading map artwork…');
  ensureLeafletMap();
  const image = new Image();
  image.onload = () => {
    if (loadToken !== atlasLoadToken) return;

    atlasMapMessage.hidden = true;
    atlasMapWrap.classList.remove('is-empty');
    atlasImageBounds = [[0, 0], [image.naturalHeight, image.naturalWidth]];
    atlasImageOverlay = L.imageOverlay(getArtworkUrl(map), atlasImageBounds).addTo(atlasMap);
    atlasMap.invalidateSize();
    atlasMap.fitBounds(atlasImageBounds, { padding: [18, 18] });
    renderAtlasDetails(map, { width: image.naturalWidth, height: image.naturalHeight });
  };
  image.onerror = () => {
    if (loadToken !== atlasLoadToken) return;
    showAtlasMessage('The map artwork could not be loaded. Check the image file in Map Library.');
  };
  image.src = getArtworkUrl(map);
}

function activateSection(sectionId) {
  sectionButtons.forEach((item) => item.classList.toggle('active', item.dataset.section === sectionId));
  panels.forEach((panel) => panel.classList.toggle('active-panel', panel.id === sectionId));
  if (sectionId === 'maps') {
    loadMaps().catch((error) => {
      mapFormMessage.textContent = error.message;
    });
  }
  if (sectionId === 'overview' && atlasMap) {
    requestAnimationFrame(() => {
      atlasMap.invalidateSize();
      if (atlasImageBounds) {
        atlasMap.fitBounds(atlasImageBounds, { padding: [18, 18] });
      }
    });
  }
}

function renderMaps() {
  if (!maps.length) {
    mapLibrary.innerHTML = '<div class="empty-state">No maps yet. Add your first map above to begin building the atlas.</div>';
    return;
  }

  mapLibrary.innerHTML = maps.map((map) => {
    const artwork = map.file_path
      ? `<img src="${getArtworkUrl(map)}" alt="Artwork for ${escapeHtml(map.name)}" loading="lazy" />`
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
    activateSection(button.dataset.section);
  });
});

document.querySelector('[data-section-link="maps"]').addEventListener('click', () => activateSection('maps'));
atlasMapPicker.addEventListener('change', () => showAtlasMap(atlasMapPicker.value));
document.getElementById('atlasZoomIn').addEventListener('click', () => atlasMap?.zoomIn());
document.getElementById('atlasZoomOut').addEventListener('click', () => atlasMap?.zoomOut());
document.getElementById('atlasFit').addEventListener('click', () => {
  if (atlasMap && atlasImageBounds) atlasMap.fitBounds(atlasImageBounds, { padding: [18, 18] });
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
