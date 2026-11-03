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
const houseForm = document.getElementById('houseForm');
const houseList = document.getElementById('houseList');
const houseFormMessage = document.getElementById('houseFormMessage');
const houseSubmitButton = document.getElementById('houseSubmitButton');
const houseCancelButton = document.getElementById('houseCancelButton');
const atlasMapPicker = document.getElementById('atlasMapPicker');
const atlasMapTitle = document.getElementById('atlasMapTitle');
const atlasMapRoot = document.getElementById('atlasMap');
const atlasMapWrap = document.getElementById('atlasMapWrap');
const atlasMapMessage = document.getElementById('atlasMapMessage');
const atlasBreadcrumbs = document.getElementById('atlasBreadcrumbs');
const atlasDetails = document.getElementById('atlasDetails');
const atlasNotice = document.getElementById('atlasNotice');
const atlasAddMarker = document.getElementById('atlasAddMarker');
const locationDialog = document.getElementById('locationDialog');
const locationForm = document.getElementById('locationForm');
const locationsList = document.getElementById('locationsList');
const locationFields = document.getElementById('locationFields');
const existingLocationField = document.getElementById('existingLocationField');
const markerCategoryField = document.getElementById('markerCategoryField');
const locationFormMessage = document.getElementById('locationFormMessage');
const locationDialogTitle = document.getElementById('locationDialogTitle');

const sectionButtons = [...document.querySelectorAll('.nav-item')];
const panels = [...document.querySelectorAll('.panel')];
let maps = [];
let locations = [];
let houses = [];
let atlasMap;
let atlasImageOverlay;
let atlasMarkerLayer;
let atlasImageBounds;
let atlasImageWidth = 0;
let atlasImageHeight = 0;
let activeMapId = '';
let atlasLoadToken = 0;
let isPlacingMarker = false;
let currentLocationData = null;

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

const houseProfileFields = [
  ['Motto', 'motto', 'motto'],
  ['Heraldry / colors', 'heraldry', 'heraldry'],
  ['Founding history', 'foundingHistory', 'founding_history'],
  ['Ancestral seat', 'seat', 'seat'],
  ['Current ruler', 'ruler', 'ruler'],
  ['Territorial holdings', 'territorialHoldings', 'territorial_holdings'],
  ['Military strength', 'militaryStrength', 'military_strength'],
  ['Wealth', 'wealth', 'wealth'],
  ['Resources', 'resources', 'resources'],
  ['Political influence', 'politicalInfluence', 'political_influence'],
  ['Religious affiliations', 'religiousAffiliations', 'religious_affiliations'],
  ['Current objectives', 'objectives', 'objectives'],
  ['GM-only secrets', 'gmSecrets', 'gm_secrets']
];

async function loadHouses() {
  const response = await fetch('/api/houses');
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load noble houses.');
  }
  houses = payload.houses || [];
  renderHouses();
}

function renderHouses() {
  if (!houses.length) {
    houseList.innerHTML = '<div class="empty-state">No noble houses yet. Create a house profile to begin recording the campaign’s political history.</div>';
    return;
  }

  houseList.innerHTML = houses.map((house) => {
    const details = houseProfileFields
      .filter(([, , field]) => house[field])
      .map(([label, , field]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(house[field])}</dd>
        </div>
      `).join('');
    const detailList = details
      ? `<dl class="house-details">${details}</dl>`
      : '<p class="house-empty-details">No profile details added.</p>';
    return `
      <article class="house-card">
        <div class="house-card-heading">
          <div>
            <span class="map-level">Noble House</span>
            <h4>${escapeHtml(house.name)}</h4>
          </div>
          <span class="house-status">${escapeHtml(house.status)}</span>
        </div>
        ${detailList}
        <div class="house-card-actions">
          <button type="button" class="secondary-button" data-house-edit="${escapeHtml(house.id)}">Edit</button>
          <button type="button" class="danger-button" data-house-delete="${escapeHtml(house.id)}">Delete</button>
        </div>
      </article>
    `;
  }).join('');

  houseList.querySelectorAll('[data-house-edit]').forEach((button) => {
    button.addEventListener('click', () => editHouse(button.dataset.houseEdit));
  });
  houseList.querySelectorAll('[data-house-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteHouse(button.dataset.houseDelete));
  });
}

function editHouse(id) {
  const house = houses.find((entry) => entry.id === id);
  if (!house) return;

  houseForm.elements.namedItem('id').value = house.id;
  houseForm.elements.namedItem('name').value = house.name;
  houseForm.elements.namedItem('status').value = house.status || 'established';
  houseProfileFields.forEach(([, formName, field]) => {
    houseForm.elements.namedItem(formName).value = house[field] || '';
  });
  houseSubmitButton.textContent = 'Save house';
  houseCancelButton.hidden = false;
  houseFormMessage.textContent = `Editing ${house.name}.`;
  houseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetHouseForm() {
  houseForm.reset();
  houseForm.elements.namedItem('id').value = '';
  houseSubmitButton.textContent = 'Create house';
  houseCancelButton.hidden = true;
  houseFormMessage.textContent = '';
}

async function saveHouse(event) {
  event.preventDefault();
  houseFormMessage.textContent = '';
  const id = houseForm.elements.namedItem('id').value;
  const payload = Object.fromEntries(new FormData(houseForm).entries());
  delete payload.id;

  let response;
  let result;
  try {
    response = await fetch(id ? `/api/houses/${encodeURIComponent(id)}` : '/api/houses', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    result = await response.json();
  } catch (error) {
    houseFormMessage.textContent = `Unable to save house: ${error.message}`;
    return;
  }
  if (!response.ok) {
    houseFormMessage.textContent = result.error || 'Unable to save house.';
    return;
  }

  resetHouseForm();
  try {
    await loadHouses();
    await loadOverview();
  } catch (error) {
    window.alert(`House saved, but the campaign view could not refresh: ${error.message}`);
  }
}

async function deleteHouse(id) {
  const house = houses.find((entry) => entry.id === id);
  if (!house || !window.confirm(`Delete "${house.name}"? This cannot be undone.`)) return;

  let response;
  let result;
  try {
    response = await fetch(`/api/houses/${encodeURIComponent(id)}`, { method: 'DELETE' });
    result = await response.json();
  } catch (error) {
    houseFormMessage.textContent = `Unable to delete house: ${error.message}`;
    return;
  }
  if (!response.ok) {
    const dependents = result.dependents?.npcs || 0;
    houseFormMessage.textContent = `${result.error || 'Unable to delete house.'}${dependents ? ` ${dependents} NPC record(s) still reference it.` : ''}`;
    return;
  }

  if (houseForm.elements.namedItem('id').value === id) resetHouseForm();
  try {
    await loadHouses();
    await loadOverview();
  } catch (error) {
    window.alert(`House deleted, but the campaign view could not refresh: ${error.message}`);
  }
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
      <small>${escapeHtml(result.type)}</small>
      <strong>${escapeHtml(result.label)}</strong>
      <div>${escapeHtml(result.summary)}</div>
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
  atlasMap.on('click', handleAtlasMapClick);
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

function setPlacementMode(enabled) {
  isPlacingMarker = enabled;
  atlasMapWrap.classList.toggle('placing-marker', enabled);
  atlasMapRoot.classList.toggle('placing-marker', enabled);
  atlasAddMarker.textContent = enabled ? 'Cancel placement' : 'Place marker';
  atlasNotice.textContent = enabled ? 'Click inside the map artwork to place a location marker.' : '';
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
  atlasMarkerLayer?.clearLayers();
  atlasImageBounds = null;
  atlasImageWidth = 0;
  atlasImageHeight = 0;
  setPlacementMode(false);
  document.getElementById('atlasZoomIn').disabled = !map?.file_path;
  document.getElementById('atlasZoomOut').disabled = !map?.file_path;
  document.getElementById('atlasFit').disabled = !map?.file_path;
  atlasAddMarker.disabled = !map?.file_path;
  atlasNotice.textContent = '';

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
    atlasImageBounds = L.latLngBounds([[0, 0], [image.naturalHeight, image.naturalWidth]]);
    atlasImageWidth = image.naturalWidth;
    atlasImageHeight = image.naturalHeight;
    atlasImageOverlay = L.imageOverlay(getArtworkUrl(map), atlasImageBounds).addTo(atlasMap);
    atlasMap.invalidateSize();
    atlasMap.fitBounds(atlasImageBounds, { padding: [18, 18] });
    renderAtlasDetails(map, { width: image.naturalWidth, height: image.naturalHeight });
    loadMapMarkers(map.id, loadToken).catch((error) => {
      atlasNotice.textContent = `Unable to load map markers: ${error.message}`;
    });
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
  if (sectionId === 'locations') {
    loadLocations().catch((error) => {
      locationsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
  }
  if (sectionId === 'houses') {
    loadHouses().catch((error) => {
      houseList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
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

async function loadLocations() {
  const response = await fetch('/api/locations');
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load locations.');
  }
  locations = payload.locations || [];
  renderLocations();
  const existingSelect = locationForm.elements.namedItem('attachExistingLocation');
  existingSelect.innerHTML = '<option value="">Create a new location record</option>' + locations.map((location) => (
    `<option value="${escapeHtml(location.id)}">${escapeHtml(location.name)} (${escapeHtml(location.type || 'location')})</option>`
  )).join('');
}

function renderLocations() {
  if (!locations.length) {
    locationsList.innerHTML = '<div class="empty-state">No locations yet. Import a map, then choose “Place marker” to create a location.</div>';
    return;
  }

  locationsList.innerHTML = locations.map((location) => `
    <article class="location-card">
      <span class="map-level">${escapeHtml(location.type || 'Location')}</span>
      <h4>${escapeHtml(location.name)}</h4>
      <p>${escapeHtml(location.description || 'No player-known description.')}</p>
      <small>${location.marker_count} map marker(s)${location.map_names ? ` · ${escapeHtml(location.map_names)}` : ' · Not placed on a map'}${location.player_visible ? ' · Known to players' : ' · GM-only'}</small>
      <div class="location-card-actions">
        <button type="button" class="secondary-button" data-location-open="${escapeHtml(location.id)}">Open record</button>
      </div>
    </article>
  `).join('');

  locationsList.querySelectorAll('[data-location-open]').forEach((button) => {
    button.addEventListener('click', () => openLocationFromList(button.dataset.locationOpen));
  });
}

const markerSymbols = {
  city: '✦',
  town: '●',
  village: '•',
  castle: '♜',
  fortress: '♖',
  ruins: '◇',
  natural_landmark: '⌁',
  road: '━',
  port: '⚓',
  point_of_interest: '◆',
  hidden_location: '!'
};

async function loadMapMarkers(mapId, loadToken) {
  const response = await fetch(`/api/maps/${encodeURIComponent(mapId)}/markers`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load markers.');
  }
  if (loadToken !== atlasLoadToken || mapId !== activeMapId || !atlasMap) return;

  if (!atlasMarkerLayer) {
    atlasMarkerLayer = L.layerGroup().addTo(atlasMap);
  } else {
    atlasMarkerLayer.clearLayers();
  }

  payload.markers.forEach((markerData) => {
    const symbol = markerSymbols[markerData.category] || '◆';
    const icon = L.divIcon({
      className: 'atlas-marker-icon-wrap',
      html: `<span class="atlas-marker-icon marker-${escapeHtml(markerData.category)}">${symbol}</span>`,
      iconSize: [27, 27],
      iconAnchor: [13, 13]
    });
    const marker = L.marker(
      [markerData.y * atlasImageHeight, markerData.x * atlasImageWidth],
      { icon, title: markerData.name, alt: markerData.name, draggable: true }
    );
    marker.markerData = markerData;
    marker.bindTooltip(escapeHtml(markerData.name), { className: 'atlas-marker-tooltip' });
    marker.on('click', () => openLocationDialog('view', markerData));
    marker.on('dragend', (event) => saveMarkerPosition(event.target));
    marker.addTo(atlasMarkerLayer);
  });
}

function handleAtlasMapClick(event) {
  if (!isPlacingMarker || !atlasImageBounds) return;
  if (!atlasImageBounds.contains(event.latlng)) {
    atlasNotice.textContent = 'Place the marker inside the map artwork.';
    return;
  }

  const x = event.latlng.lng / atlasImageWidth;
  const y = event.latlng.lat / atlasImageHeight;
  setPlacementMode(false);
  openLocationDialog('create', { x, y });
}

async function saveMarkerPosition(marker) {
  const previous = marker.markerData;
  const point = marker.getLatLng();
  const x = point.lng / atlasImageWidth;
  const y = point.lat / atlasImageHeight;
  let response;
  let payload;
  try {
    response = await fetch(`/api/maps/${encodeURIComponent(activeMapId)}/markers/${encodeURIComponent(previous.marker_id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y })
    });
    payload = await response.json();
  } catch (error) {
    marker.setLatLng([previous.y * atlasImageHeight, previous.x * atlasImageWidth]);
    window.alert(`Unable to save the marker position: ${error.message}`);
    return;
  }
  if (!response.ok) {
    marker.setLatLng([previous.y * atlasImageHeight, previous.x * atlasImageWidth]);
    window.alert(payload.error || 'Unable to save the marker position.');
    return;
  }
  marker.markerData = payload.marker;
}

function openLocationFromList(id) {
  const location = locations.find((entry) => entry.id === id);
  if (!location) return;

  if (location.first_map_id) {
    activateSection('overview');
    showAtlasMap(location.first_map_id);
  }

  openLocationDialog('view', {
    ...location,
    map_id: location.first_map_id,
    marker_id: location.markers?.[0]?.marker_id,
    category: location.markers?.[0]?.category
  });
}

function openLocationDialog(mode, data = {}) {
  currentLocationData = data;
  locationForm.reset();
  locationForm.elements.namedItem('locationId').value = data.id || data.location_id || '';
  locationForm.elements.namedItem('x').value = data.x ?? '';
  locationForm.elements.namedItem('y').value = data.y ?? '';
  locationForm.elements.namedItem('name').value = data.name || '';
  locationForm.elements.namedItem('type').value = data.type || 'city';
  locationForm.elements.namedItem('description').value = data.description || '';
  locationForm.elements.namedItem('gmNotes').value = data.gm_notes || '';
  locationForm.elements.namedItem('playerVisible').checked = data.player_visible !== 0;
  locationForm.elements.namedItem('category').value = markerSymbols[data.category] ? data.category : (markerSymbols[data.type] ? data.type : 'point_of_interest');
  locationForm.elements.namedItem('attachExistingLocation').value = '';
  locationForm.dataset.mapId = data.map_id || activeMapId;
  locationForm.dataset.markerId = data.marker_id || '';
  locationFields.disabled = mode === 'view';
  existingLocationField.hidden = mode !== 'create';
  markerCategoryField.hidden = mode === 'view' || mode === 'edit';
  locationDialogTitle.textContent = mode === 'create' ? 'Place a location' : (mode === 'edit' ? 'Edit location' : data.name || 'Location record');
  locationFormMessage.textContent = data.marker_count ? `Placed on ${data.marker_count} map(s).` : '';
  document.getElementById('locationSave').hidden = mode === 'view';
  document.getElementById('locationEdit').hidden = mode !== 'view';
  document.getElementById('locationDelete').hidden = mode !== 'view';
  document.getElementById('locationClose').textContent = mode === 'edit' ? 'Cancel' : 'Close';

  if (!locationDialog.open) {
    locationDialog.showModal();
  }
}

function selectExistingLocation() {
  const id = locationForm.elements.namedItem('attachExistingLocation').value;
  const location = locations.find((entry) => entry.id === id);
  locationFields.disabled = Boolean(location);
  if (location) {
    locationForm.elements.namedItem('name').value = location.name;
    locationForm.elements.namedItem('type').value = location.type || 'city';
    locationForm.elements.namedItem('description').value = location.description || '';
    locationForm.elements.namedItem('gmNotes').value = location.gm_notes || '';
    locationForm.elements.namedItem('playerVisible').checked = location.player_visible !== 0;
    locationForm.elements.namedItem('category').value = markerSymbols[location.type] ? location.type : 'point_of_interest';
  } else {
    locationForm.elements.namedItem('name').value = '';
    locationForm.elements.namedItem('type').value = 'city';
    locationForm.elements.namedItem('description').value = '';
    locationForm.elements.namedItem('gmNotes').value = '';
    locationForm.elements.namedItem('playerVisible').checked = true;
    locationForm.elements.namedItem('category').value = 'city';
  }
}

async function saveLocation(event) {
  event.preventDefault();
  locationFormMessage.textContent = '';
  const locationId = locationForm.elements.namedItem('locationId').value;
  const existingId = locationForm.elements.namedItem('attachExistingLocation').value;
  const payload = {
    name: locationForm.elements.namedItem('name').value,
    type: locationForm.elements.namedItem('type').value,
    description: locationForm.elements.namedItem('description').value,
    gmNotes: locationForm.elements.namedItem('gmNotes').value,
    playerVisible: locationForm.elements.namedItem('playerVisible').checked
  };

  let url;
  let method;
  if (locationId) {
    url = `/api/locations/${encodeURIComponent(locationId)}`;
    method = 'PUT';
  } else {
    url = `/api/maps/${encodeURIComponent(locationForm.dataset.mapId)}/markers`;
    method = 'POST';
    payload.category = locationForm.elements.namedItem('category').value;
    payload.x = Number(locationForm.elements.namedItem('x').value);
    payload.y = Number(locationForm.elements.namedItem('y').value);
    if (existingId) payload.locationId = existingId;
  }

  let response;
  let result;
  try {
    response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    result = await response.json();
  } catch (error) {
    locationFormMessage.textContent = `Unable to save location: ${error.message}`;
    return;
  }
  if (!response.ok) {
    locationFormMessage.textContent = result.error || 'Unable to save location.';
    return;
  }

  locationDialog.close();
  try {
    await loadLocations();
    await loadOverview();
    if (activeMapId) await loadMapMarkers(activeMapId, atlasLoadToken);
  } catch (error) {
    window.alert(`Location saved, but the campaign view could not refresh: ${error.message}`);
  }
}

async function deleteCurrentLocation() {
  const locationId = locationForm.elements.namedItem('locationId').value;
  const location = locations.find((entry) => entry.id === locationId);
  const markerCount = location?.marker_count || 0;
  const consequence = markerCount ? ` Its ${markerCount} map marker(s) will also be removed.` : '';
  if (!window.confirm(`Delete "${locationForm.elements.namedItem('name').value}"?${consequence}`)) return;

  let response;
  let result;
  try {
    response = await fetch(`/api/locations/${encodeURIComponent(locationId)}`, { method: 'DELETE' });
    result = await response.json();
  } catch (error) {
    locationFormMessage.textContent = `Unable to delete location: ${error.message}`;
    return;
  }
  if (!response.ok) {
    const dependentNames = result.dependents ? Object.entries(result.dependents).filter(([, count]) => count).map(([name, count]) => `${count} ${name}`).join(', ') : '';
    locationFormMessage.textContent = `${result.error || 'Unable to delete location.'}${dependentNames ? ` Dependencies: ${dependentNames}.` : ''}`;
    return;
  }

  locationDialog.close();
  try {
    await loadLocations();
    await loadOverview();
    if (activeMapId) await loadMapMarkers(activeMapId, atlasLoadToken);
  } catch (error) {
    window.alert(`Location deleted, but the campaign view could not refresh: ${error.message}`);
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
      ? ` It has ${dependents.childMaps} child map(s), ${dependents.locations} linked location(s), and ${dependents.markers} marker(s).`
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
atlasAddMarker.addEventListener('click', () => {
  if (!atlasImageBounds) return;
  setPlacementMode(!isPlacingMarker);
});
document.getElementById('atlasZoomIn').addEventListener('click', () => atlasMap?.zoomIn());
document.getElementById('atlasZoomOut').addEventListener('click', () => atlasMap?.zoomOut());
document.getElementById('atlasFit').addEventListener('click', () => {
  if (atlasMap && atlasImageBounds) atlasMap.fitBounds(atlasImageBounds, { padding: [18, 18] });
});
locationForm.addEventListener('submit', saveLocation);
locationForm.elements.namedItem('attachExistingLocation').addEventListener('change', selectExistingLocation);
document.getElementById('locationClose').addEventListener('click', () => locationDialog.close());
document.getElementById('locationEdit').addEventListener('click', () => {
  if (currentLocationData) openLocationDialog('edit', currentLocationData);
});
document.getElementById('locationDelete').addEventListener('click', deleteCurrentLocation);
houseForm.addEventListener('submit', saveHouse);
houseCancelButton.addEventListener('click', resetHouseForm);
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
loadLocations().catch((error) => {
  locationsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
performSearch();
