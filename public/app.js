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
const houseRelationshipForm = document.getElementById('houseRelationshipForm');
const houseRelationshipList = document.getElementById('houseRelationshipList');
const houseRelationshipFormMessage = document.getElementById('houseRelationshipFormMessage');
const houseRelationshipSubmitButton = document.getElementById('houseRelationshipSubmitButton');
const houseRelationshipCancelButton = document.getElementById('houseRelationshipCancelButton');
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
const npcForm = document.getElementById('npcForm');
const npcList = document.getElementById('npcList');
const npcFormMessage = document.getElementById('npcFormMessage');
const npcSubmitButton = document.getElementById('npcSubmitButton');
const npcCancelButton = document.getElementById('npcCancelButton');
const npcRelationshipForm = document.getElementById('npcRelationshipForm');
const npcRelationshipList = document.getElementById('npcRelationshipList');
const npcRelationshipFormMessage = document.getElementById('npcRelationshipFormMessage');
const factionForm = document.getElementById('factionForm');
const factionList = document.getElementById('factionList');
const factionFormMessage = document.getElementById('factionFormMessage');
const factionSubmitButton = document.getElementById('factionSubmitButton');
const factionCancelButton = document.getElementById('factionCancelButton');
const shopForm = document.getElementById('shopForm');
const shopList = document.getElementById('shopList');
const shopInventoryForm = document.getElementById('shopInventoryForm');
const shopInventoryList = document.getElementById('shopInventoryList');
const shopInventoryFormMessage = document.getElementById('shopInventoryFormMessage');
const shopInventorySubmitButton = document.getElementById('shopInventorySubmitButton');
const shopInventoryCancelButton = document.getElementById('shopInventoryCancelButton');
const shopFormMessage = document.getElementById('shopFormMessage');
const shopSubmitButton = document.getElementById('shopSubmitButton');
const shopCancelButton = document.getElementById('shopCancelButton');
const sessionForm = document.getElementById('sessionForm');
const sessionList = document.getElementById('sessionList');
const sessionFormMessage = document.getElementById('sessionFormMessage');
const sessionSubmitButton = document.getElementById('sessionSubmitButton');
const sessionCancelButton = document.getElementById('sessionCancelButton');
const discoveryForm = document.getElementById('discoveryForm');
const discoveryList = document.getElementById('discoveryList');
const discoveryFormMessage = document.getElementById('discoveryFormMessage');
const discoverySubmitButton = document.getElementById('discoverySubmitButton');
const discoveryCancelButton = document.getElementById('discoveryCancelButton');
const questForm = document.getElementById('questForm');
const questList = document.getElementById('questList');
const questFormMessage = document.getElementById('questFormMessage');
const questSubmitButton = document.getElementById('questSubmitButton');
const questCancelButton = document.getElementById('questCancelButton');
const timelineForm = document.getElementById('timelineForm');
const timelineList = document.getElementById('timelineList');
const timelineFormMessage = document.getElementById('timelineFormMessage');
const timelineSubmitButton = document.getElementById('timelineSubmitButton');
const timelineCancelButton = document.getElementById('timelineCancelButton');
const simulationForm = document.getElementById('simulationForm');
const simulationList = document.getElementById('simulationList');
const simulationTableForm = document.getElementById('simulationTableForm');
const simulationTableList = document.getElementById('simulationTableList');
const simulationTableFormMessage = document.getElementById('simulationTableFormMessage');
const simulationTableSubmitButton = document.getElementById('simulationTableSubmitButton');
const simulationTableCancelButton = document.getElementById('simulationTableCancelButton');
const simulationFormMessage = document.getElementById('simulationFormMessage');
const simulationSubmitButton = document.getElementById('simulationSubmitButton');
const simulationCancelButton = document.getElementById('simulationCancelButton');
const calendarForm = document.getElementById('calendarForm');
const calendarFormMessage = document.getElementById('calendarFormMessage');
const timeAdvanceForm = document.getElementById('timeAdvanceForm');
const timeAdvanceMessage = document.getElementById('timeAdvanceMessage');
const simulationCycleList = document.getElementById('simulationCycleList');
const simulationResultDialog = document.getElementById('simulationResultDialog');
const simulationResultForm = document.getElementById('simulationResultForm');
const simulationResultFormMessage = document.getElementById('simulationResultFormMessage');
const campaignExportForm = document.getElementById('campaignExportForm');
const campaignExportMessage = document.getElementById('campaignExportMessage');
const campaignImportForm = document.getElementById('campaignImportForm');
const campaignImportPreviewButton = document.getElementById('campaignImportPreviewButton');
const campaignImportApplyButton = document.getElementById('campaignImportApplyButton');
const campaignImportMessage = document.getElementById('campaignImportMessage');
const campaignImportPreviewElement = document.getElementById('campaignImportPreview');

const sectionButtons = [...document.querySelectorAll('.nav-item')];
const panels = [...document.querySelectorAll('.panel')];
let maps = [];
let locations = [];
let houses = [];
let houseRelationships = [];
let npcs = [];
let npcRelationships = [];
let factions = [];
let shops = [];
let shopInventory = [];
let quests = [];
let sessions = [];
let playerDiscoveries = [];
let timelineEvents = [];
let simulationEvents = [];
let simulationTables = [];
let simulationCycles = [];
let campaignImportPayload = null;
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

function populateSelectOptions(select, items, { valueKey, labelKey, placeholder = '' } = {}) {
  if (!select) return;
  const valueField = valueKey || 'id';
  const labelField = labelKey || 'name';
  const options = items.map((item) => `<option value="${escapeHtml(item[valueField])}">${escapeHtml(item[labelField] || item[valueField])}</option>`).join('');
  const fallback = placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : '';
  select.innerHTML = `${fallback}${options}`;
}

function refreshReferenceSelects() {
  houseRelationshipForm.querySelectorAll('[data-house-relationship-select]').forEach((select) => {
    populateSelectOptions(select, houses, { labelKey: 'name', placeholder: 'Choose a noble house' });
  });
  populateSelectOptions(npcForm.elements.namedItem('locationId'), locations, { placeholder: 'No linked location' });
  populateSelectOptions(npcForm.elements.namedItem('houseId'), houses, { placeholder: 'No linked house' });
  npcRelationshipForm.querySelectorAll('[data-npc-select]').forEach((select) => {
    populateSelectOptions(select, npcs, { labelKey: 'name', placeholder: 'Choose an NPC' });
  });
  populateSelectOptions(shopForm.elements.namedItem('locationId'), locations, { placeholder: 'No linked location' });
  populateSelectOptions(shopForm.elements.namedItem('shopkeeperId'), npcs, { labelKey: 'name', placeholder: 'No shopkeeper linked' });
  populateSelectOptions(shopInventoryForm.elements.namedItem('shopId'), shops, { labelKey: 'name', placeholder: 'Choose a shop' });
  populateSelectOptions(questForm.elements.namedItem('locationId'), locations, { placeholder: 'No linked location' });
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
    player_discoveries: 'Player Discoveries',
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
  refreshReferenceSelects();
  await loadHouseRelationships();
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
    const relationships = result.dependents?.relationships || 0;
    const reasons = [
      dependents ? `${dependents} NPC record(s) still reference it` : '',
      relationships ? `${relationships} political relationship(s) still reference it` : ''
    ].filter(Boolean);
    houseFormMessage.textContent = `${result.error || 'Unable to delete house.'}${reasons.length ? ` ${reasons.join('; ')}.` : ''}`;
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

const houseRelationshipLabels = {
  allied: 'Allied',
  friendly: 'Friendly',
  neutral: 'Neutral',
  hostile: 'Hostile',
  rival: 'Rival',
  enemy: 'Enemy',
  vassal: 'Vassal of',
  overlord: 'Overlord of',
  at_war: 'At war with',
  marriage_alliance: 'Marriage alliance with',
  blood_relation: 'Blood relation to'
};

async function loadHouseRelationships() {
  const response = await fetch('/api/house-relationships');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load political relationships.');
  houseRelationships = payload.relationships || [];
  renderHouseRelationships();
}

function renderHouseRelationships() {
  if (!houseRelationships.length) {
    houseRelationshipList.innerHTML = '<div class="empty-state">No political relationships recorded yet.</div>';
    return;
  }

  houseRelationshipList.innerHTML = houseRelationships.map((relationship) => {
    const history = relationship.history.map((entry) => `
      <div>
        <dt>${escapeHtml(entry.effective_date || entry.created_at)}</dt>
        <dd><strong>${escapeHtml(houseRelationshipLabels[entry.relationship_type] || entry.relationship_type)}</strong>${entry.notes ? ` — ${escapeHtml(entry.notes)}` : ''}</dd>
      </div>
    `).join('');
    return `
      <article class="house-card">
        <div class="house-card-heading">
          <div>
            <span class="map-level">Political relationship</span>
            <h4>${escapeHtml(relationship.house_name)} · ${escapeHtml(houseRelationshipLabels[relationship.relationship_type] || relationship.relationship_type)} · ${escapeHtml(relationship.related_house_name)}</h4>
          </div>
        </div>
        <dl class="house-details">${history}</dl>
        <div class="house-card-actions">
          <button type="button" class="secondary-button" data-house-relationship-edit="${escapeHtml(relationship.id)}">Change relationship</button>
          <button type="button" class="danger-button" data-house-relationship-delete="${escapeHtml(relationship.id)}">Remove relationship</button>
        </div>
      </article>
    `;
  }).join('');

  houseRelationshipList.querySelectorAll('[data-house-relationship-edit]').forEach((button) => {
    button.addEventListener('click', () => editHouseRelationship(button.dataset.houseRelationshipEdit));
  });
  houseRelationshipList.querySelectorAll('[data-house-relationship-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteHouseRelationshipRecord(button.dataset.houseRelationshipDelete));
  });
}

function editHouseRelationship(id) {
  const relationship = houseRelationships.find((entry) => entry.id === id);
  if (!relationship) return;
  houseRelationshipForm.elements.namedItem('id').value = relationship.id;
  houseRelationshipForm.elements.namedItem('houseId').value = relationship.house_id;
  houseRelationshipForm.elements.namedItem('relatedHouseId').value = relationship.related_house_id;
  houseRelationshipForm.elements.namedItem('relationshipType').value = relationship.relationship_type;
  houseRelationshipForm.elements.namedItem('effectiveDate').value = '';
  houseRelationshipForm.elements.namedItem('notes').value = relationship.notes || '';
  houseRelationshipForm.elements.namedItem('houseId').disabled = true;
  houseRelationshipForm.elements.namedItem('relatedHouseId').disabled = true;
  houseRelationshipSubmitButton.textContent = 'Save relationship change';
  houseRelationshipCancelButton.hidden = false;
  houseRelationshipFormMessage.textContent = `Editing the relationship between ${relationship.house_name} and ${relationship.related_house_name}. A saved change will be added to its history.`;
  houseRelationshipForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetHouseRelationshipForm() {
  houseRelationshipForm.reset();
  houseRelationshipForm.elements.namedItem('id').value = '';
  houseRelationshipForm.elements.namedItem('houseId').disabled = false;
  houseRelationshipForm.elements.namedItem('relatedHouseId').disabled = false;
  houseRelationshipSubmitButton.textContent = 'Add relationship';
  houseRelationshipCancelButton.hidden = true;
  houseRelationshipFormMessage.textContent = '';
}

async function saveHouseRelationship(event) {
  event.preventDefault();
  houseRelationshipFormMessage.textContent = '';
  const id = houseRelationshipForm.elements.namedItem('id').value;
  const payload = {
    house_id: houseRelationshipForm.elements.namedItem('houseId').value,
    related_house_id: houseRelationshipForm.elements.namedItem('relatedHouseId').value,
    relationship_type: houseRelationshipForm.elements.namedItem('relationshipType').value,
    effective_date: houseRelationshipForm.elements.namedItem('effectiveDate').value,
    notes: houseRelationshipForm.elements.namedItem('notes').value
  };
  try {
    const response = await fetch(id ? `/api/house-relationships/${encodeURIComponent(id)}` : '/api/house-relationships', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      houseRelationshipFormMessage.textContent = result.error || 'Unable to save political relationship.';
      return;
    }
    resetHouseRelationshipForm();
    await loadHouseRelationships();
  } catch (error) {
    houseRelationshipFormMessage.textContent = `Unable to save political relationship: ${error.message}`;
  }
}

async function deleteHouseRelationshipRecord(id) {
  const relationship = houseRelationships.find((entry) => entry.id === id);
  if (!relationship || !window.confirm(`Remove the relationship between ${relationship.house_name} and ${relationship.related_house_name}, including its history?`)) return;
  try {
    const response = await fetch(`/api/house-relationships/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) {
      houseRelationshipFormMessage.textContent = result.error || 'Unable to remove political relationship.';
      return;
    }
    if (houseRelationshipForm.elements.namedItem('id').value === id) resetHouseRelationshipForm();
    await loadHouseRelationships();
    await loadHouses();
  } catch (error) {
    houseRelationshipFormMessage.textContent = `Unable to remove political relationship: ${error.message}`;
  }
}

async function loadNpcs() {
  const response = await fetch('/api/npcs');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load NPCs.');
  npcs = payload.npcs || [];
  renderNpcs();
  refreshReferenceSelects();
  await loadNpcRelationships();
}

function renderNpcs() {
  if (!npcs.length) {
    npcList.innerHTML = '<div class="empty-state">No NPCs yet. Add a few key people to the campaign roster.</div>';
    return;
  }

  npcList.innerHTML = npcs.map((npc) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">NPC</span>
          <h4>${escapeHtml(npc.name)}</h4>
        </div>
        <span class="house-status">${escapeHtml(npc.status || 'alive')}</span>
      </div>
      <dl class="house-details">
        ${npc.title ? `<div><dt>Title</dt><dd>${escapeHtml(npc.title)}</dd></div>` : ''}
        ${npc.race ? `<div><dt>Race</dt><dd>${escapeHtml(npc.race)}</dd></div>` : ''}
        ${npc.occupation ? `<div><dt>Occupation</dt><dd>${escapeHtml(npc.occupation)}</dd></div>` : ''}
        ${npc.location_name ? `<div><dt>Location</dt><dd>${escapeHtml(npc.location_name)}</dd></div>` : ''}
        ${npc.house_name ? `<div><dt>House</dt><dd>${escapeHtml(npc.house_name)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-npc-edit="${escapeHtml(npc.id)}">Edit</button>
        <button type="button" class="danger-button" data-npc-delete="${escapeHtml(npc.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  npcList.querySelectorAll('[data-npc-edit]').forEach((button) => {
    button.addEventListener('click', () => editNpc(button.dataset.npcEdit));
  });
  npcList.querySelectorAll('[data-npc-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteNpcRecord(button.dataset.npcDelete));
  });
}

function editNpc(id) {
  const npc = npcs.find((entry) => entry.id === id);
  if (!npc) return;
  npcForm.elements.namedItem('id').value = npc.id;
  npcForm.elements.namedItem('name').value = npc.name;
  npcForm.elements.namedItem('title').value = npc.title || '';
  npcForm.elements.namedItem('race').value = npc.race || '';
  npcForm.elements.namedItem('occupation').value = npc.occupation || '';
  npcForm.elements.namedItem('status').value = npc.status || 'alive';
  npcForm.elements.namedItem('locationId').value = npc.location_id || '';
  npcForm.elements.namedItem('houseId').value = npc.house_id || '';
  npcForm.elements.namedItem('gmOnly').checked = Boolean(npc.gm_only);
  npcSubmitButton.textContent = 'Save NPC';
  npcCancelButton.hidden = false;
  npcFormMessage.textContent = `Editing ${npc.name}.`;
  npcForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetNpcForm() {
  npcForm.reset();
  npcForm.elements.namedItem('id').value = '';
  npcSubmitButton.textContent = 'Create NPC';
  npcCancelButton.hidden = true;
  npcFormMessage.textContent = '';
}

async function saveNpc(event) {
  event.preventDefault();
  npcFormMessage.textContent = '';
  const id = npcForm.elements.namedItem('id').value;
  const payload = {
    name: npcForm.elements.namedItem('name').value,
    title: npcForm.elements.namedItem('title').value,
    race: npcForm.elements.namedItem('race').value,
    occupation: npcForm.elements.namedItem('occupation').value,
    status: npcForm.elements.namedItem('status').value,
    location_id: npcForm.elements.namedItem('locationId').value || null,
    house_id: npcForm.elements.namedItem('houseId').value || null,
    gm_only: npcForm.elements.namedItem('gmOnly').checked
  };

  const response = await fetch(id ? `/api/npcs/${encodeURIComponent(id)}` : '/api/npcs', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    npcFormMessage.textContent = result.error || 'Unable to save NPC.';
    return;
  }

  resetNpcForm();
  await loadNpcs();
  await loadOverview();
}

async function deleteNpcRecord(id) {
  const npc = npcs.find((entry) => entry.id === id);
  if (!npc || !window.confirm(`Delete "${npc.name}"?`)) return;

  const response = await fetch(`/api/npcs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    npcFormMessage.textContent = result.error || 'Unable to delete NPC.';
    return;
  }

  if (npcForm.elements.namedItem('id').value === id) resetNpcForm();
  await loadNpcs();
  await loadOverview();
}

async function loadNpcRelationships() {
  const response = await fetch('/api/npc-relationships');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load NPC family relationships.');
  npcRelationships = payload.relationships || [];
  renderNpcRelationships();
}

function renderNpcRelationships() {
  if (!npcRelationships.length) {
    npcRelationshipList.innerHTML = '<div class="empty-state">No family relationships recorded yet.</div>';
    return;
  }

  const relationText = {
    parent: 'is parent of',
    sibling: 'is sibling of',
    spouse: 'is spouse of',
    former_spouse: 'is former spouse of'
  };
  npcRelationshipList.innerHTML = npcRelationships.map((relationship) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">Family relationship</span>
          <h4>${escapeHtml(relationship.subject_name)} ${escapeHtml(relationText[relationship.relationship_type] || relationship.relationship_type)} ${escapeHtml(relationship.related_name)}</h4>
        </div>
      </div>
      ${relationship.notes ? `<p>${escapeHtml(relationship.notes)}</p>` : ''}
      <div class="house-card-actions">
        <button type="button" class="danger-button" data-npc-relationship-delete="${escapeHtml(relationship.id)}">Remove relationship</button>
      </div>
    </article>
  `).join('');

  npcRelationshipList.querySelectorAll('[data-npc-relationship-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteNpcRelationshipRecord(button.dataset.npcRelationshipDelete));
  });
}

async function saveNpcRelationship(event) {
  event.preventDefault();
  npcRelationshipFormMessage.textContent = '';
  const payload = {
    npc_id: npcRelationshipForm.elements.namedItem('npcId').value,
    relationship_type: npcRelationshipForm.elements.namedItem('relationshipType').value,
    related_npc_id: npcRelationshipForm.elements.namedItem('relatedNpcId').value,
    notes: npcRelationshipForm.elements.namedItem('notes').value
  };
  const response = await fetch('/api/npc-relationships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    npcRelationshipFormMessage.textContent = result.error || 'Unable to save family relationship.';
    return;
  }

  npcRelationshipForm.reset();
  refreshReferenceSelects();
  await loadNpcRelationships();
}

async function deleteNpcRelationshipRecord(id) {
  const relationship = npcRelationships.find((entry) => entry.id === id);
  if (!relationship || !window.confirm(`Remove the relationship between ${relationship.subject_name} and ${relationship.related_name}?`)) return;

  const response = await fetch(`/api/npc-relationships/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    npcRelationshipFormMessage.textContent = result.error || 'Unable to remove family relationship.';
    return;
  }
  await loadNpcRelationships();
}

async function loadFactions() {
  const response = await fetch('/api/factions');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load factions.');
  factions = payload.factions || [];
  renderFactions();
}

function renderFactions() {
  if (!factions.length) {
    factionList.innerHTML = '<div class="empty-state">No factions recorded yet.</div>';
    return;
  }

  factionList.innerHTML = factions.map((faction) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">Faction</span>
          <h4>${escapeHtml(faction.name)}</h4>
        </div>
        <span class="house-status">${escapeHtml(faction.status || 'established')}</span>
      </div>
      <dl class="house-details">
        ${faction.headquarters ? `<div><dt>Headquarters</dt><dd>${escapeHtml(faction.headquarters)}</dd></div>` : ''}
        ${faction.description ? `<div><dt>Description</dt><dd>${escapeHtml(faction.description)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-faction-edit="${escapeHtml(faction.id)}">Edit</button>
        <button type="button" class="danger-button" data-faction-delete="${escapeHtml(faction.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  factionList.querySelectorAll('[data-faction-edit]').forEach((button) => {
    button.addEventListener('click', () => editFaction(button.dataset.factionEdit));
  });
  factionList.querySelectorAll('[data-faction-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteFactionRecord(button.dataset.factionDelete));
  });
}

function editFaction(id) {
  const faction = factions.find((entry) => entry.id === id);
  if (!faction) return;
  factionForm.elements.namedItem('id').value = faction.id;
  factionForm.elements.namedItem('name').value = faction.name;
  factionForm.elements.namedItem('status').value = faction.status || 'established';
  factionForm.elements.namedItem('headquarters').value = faction.headquarters || '';
  factionForm.elements.namedItem('description').value = faction.description || '';
  factionSubmitButton.textContent = 'Save faction';
  factionCancelButton.hidden = false;
  factionFormMessage.textContent = `Editing ${faction.name}.`;
  factionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetFactionForm() {
  factionForm.reset();
  factionForm.elements.namedItem('id').value = '';
  factionSubmitButton.textContent = 'Create faction';
  factionCancelButton.hidden = true;
  factionFormMessage.textContent = '';
}

async function saveFaction(event) {
  event.preventDefault();
  factionFormMessage.textContent = '';
  const id = factionForm.elements.namedItem('id').value;
  const payload = {
    name: factionForm.elements.namedItem('name').value,
    status: factionForm.elements.namedItem('status').value,
    headquarters: factionForm.elements.namedItem('headquarters').value,
    description: factionForm.elements.namedItem('description').value
  };

  const response = await fetch(id ? `/api/factions/${encodeURIComponent(id)}` : '/api/factions', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    factionFormMessage.textContent = result.error || 'Unable to save faction.';
    return;
  }

  resetFactionForm();
  await loadFactions();
  await loadOverview();
}

async function deleteFactionRecord(id) {
  const faction = factions.find((entry) => entry.id === id);
  if (!faction || !window.confirm(`Delete "${faction.name}"?`)) return;

  const response = await fetch(`/api/factions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    factionFormMessage.textContent = result.error || 'Unable to delete faction.';
    return;
  }

  if (factionForm.elements.namedItem('id').value === id) resetFactionForm();
  await loadFactions();
  await loadOverview();
}

async function loadShops() {
  const response = await fetch('/api/shops');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load shops.');
  shops = payload.shops || [];
  renderShops();
  refreshReferenceSelects();

  const selectedShopId = shopInventoryForm.elements.namedItem('shopId').value || shops[0]?.id || '';
  shopInventoryForm.elements.namedItem('shopId').value = selectedShopId;
  if (selectedShopId) {
    await loadShopInventory(selectedShopId);
  } else {
    shopInventory = [];
    renderShopInventory();
  }
}

function renderShops() {
  if (!shops.length) {
    shopList.innerHTML = '<div class="empty-state">No shops or merchants logged yet.</div>';
    return;
  }

  shopList.innerHTML = shops.map((shop) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">Shop</span>
          <h4>${escapeHtml(shop.name)}</h4>
        </div>
        <span class="house-status">${escapeHtml(shop.type || 'Merchant')}</span>
      </div>
      <dl class="house-details">
        ${shop.location_name ? `<div><dt>Location</dt><dd>${escapeHtml(shop.location_name)}</dd></div>` : ''}
        ${shop.owner ? `<div><dt>Owner</dt><dd>${escapeHtml(shop.owner)}</dd></div>` : ''}
        ${shop.shopkeeper_name ? `<div><dt>Shopkeeper</dt><dd>${escapeHtml(shop.shopkeeper_name)}</dd></div>` : ''}
        ${shop.description ? `<div><dt>Description</dt><dd>${escapeHtml(shop.description)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-shop-edit="${escapeHtml(shop.id)}">Edit</button>
        <button type="button" class="danger-button" data-shop-delete="${escapeHtml(shop.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  shopList.querySelectorAll('[data-shop-edit]').forEach((button) => {
    button.addEventListener('click', () => editShop(button.dataset.shopEdit));
  });
  shopList.querySelectorAll('[data-shop-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteShopRecord(button.dataset.shopDelete));
  });
}

function editShop(id) {
  const shop = shops.find((entry) => entry.id === id);
  if (!shop) return;
  shopForm.elements.namedItem('id').value = shop.id;
  shopForm.elements.namedItem('name').value = shop.name;
  shopForm.elements.namedItem('type').value = shop.type || '';
  shopForm.elements.namedItem('owner').value = shop.owner || '';
  shopForm.elements.namedItem('locationId').value = shop.location_id || '';
  shopForm.elements.namedItem('shopkeeperId').value = shop.shopkeeper_id || '';
  shopForm.elements.namedItem('description').value = shop.description || '';
  shopForm.elements.namedItem('gmNotes').value = shop.gm_notes || '';
  shopSubmitButton.textContent = 'Save shop';
  shopCancelButton.hidden = false;
  shopFormMessage.textContent = `Editing ${shop.name}.`;
  shopForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetShopForm() {
  shopForm.reset();
  shopForm.elements.namedItem('id').value = '';
  shopSubmitButton.textContent = 'Create shop';
  shopCancelButton.hidden = true;
  shopFormMessage.textContent = '';
}

async function saveShop(event) {
  event.preventDefault();
  shopFormMessage.textContent = '';
  const id = shopForm.elements.namedItem('id').value;
  const payload = {
    name: shopForm.elements.namedItem('name').value,
    type: shopForm.elements.namedItem('type').value,
    owner: shopForm.elements.namedItem('owner').value,
    location_id: shopForm.elements.namedItem('locationId').value || null,
    shopkeeper_id: shopForm.elements.namedItem('shopkeeperId').value || null,
    description: shopForm.elements.namedItem('description').value,
    gm_notes: shopForm.elements.namedItem('gmNotes').value
  };

  const response = await fetch(id ? `/api/shops/${encodeURIComponent(id)}` : '/api/shops', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    shopFormMessage.textContent = result.error || 'Unable to save shop.';
    return;
  }

  resetShopForm();
  await loadShops();
  await loadOverview();
}

async function deleteShopRecord(id) {
  const shop = shops.find((entry) => entry.id === id);
  if (!shop || !window.confirm(`Delete "${shop.name}"?`)) return;

  const response = await fetch(`/api/shops/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    shopFormMessage.textContent = result.error || 'Unable to delete shop.';
    return;
  }

  if (shopForm.elements.namedItem('id').value === id) resetShopForm();
  await loadShops();
  await loadOverview();
}

async function loadSessions() {
  const response = await fetch('/api/sessions');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load campaign journal.');
  sessions = payload.sessions || [];
  renderSessions();
}

function renderSessions() {
  if (!sessions.length) {
    sessionList.innerHTML = '<div class="empty-state">No sessions logged yet.</div>';
    return;
  }

  sessionList.innerHTML = sessions.map((session) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">Session ${escapeHtml(session.session_number || 'n/a')}</span>
          <h4>${escapeHtml(session.campaign_date || 'Campaign date missing')}</h4>
        </div>
      </div>
      <p>${escapeHtml(session.summary || 'No summary yet.')}</p>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-session-edit="${escapeHtml(session.id)}">Edit</button>
        <button type="button" class="danger-button" data-session-delete="${escapeHtml(session.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  sessionList.querySelectorAll('[data-session-edit]').forEach((button) => {
    button.addEventListener('click', () => editSession(button.dataset.sessionEdit));
  });
  sessionList.querySelectorAll('[data-session-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteSessionRecord(button.dataset.sessionDelete));
  });
}

function editSession(id) {
  const session = sessions.find((entry) => entry.id === id);
  if (!session) return;
  sessionForm.elements.namedItem('id').value = session.id;
  sessionForm.elements.namedItem('sessionNumber').value = session.session_number || '';
  sessionForm.elements.namedItem('campaignDate').value = session.campaign_date || '';
  sessionForm.elements.namedItem('summary').value = session.summary || '';
  sessionSubmitButton.textContent = 'Save session';
  sessionCancelButton.hidden = false;
  sessionFormMessage.textContent = `Editing session ${session.session_number || 'record'}.`;
  sessionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetSessionForm() {
  sessionForm.reset();
  sessionForm.elements.namedItem('id').value = '';
  sessionSubmitButton.textContent = 'Create session';
  sessionCancelButton.hidden = true;
  sessionFormMessage.textContent = '';
}

async function saveSession(event) {
  event.preventDefault();
  sessionFormMessage.textContent = '';
  const id = sessionForm.elements.namedItem('id').value;
  const payload = {
    session_number: Number(sessionForm.elements.namedItem('sessionNumber').value || 0) || null,
    campaign_date: sessionForm.elements.namedItem('campaignDate').value,
    summary: sessionForm.elements.namedItem('summary').value
  };

  const response = await fetch(id ? `/api/sessions/${encodeURIComponent(id)}` : '/api/sessions', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    sessionFormMessage.textContent = result.error || 'Unable to save session.';
    return;
  }

  resetSessionForm();
  await loadSessions();
  await loadOverview();
}

async function deleteSessionRecord(id) {
  const session = sessions.find((entry) => entry.id === id);
  if (!session || !window.confirm(`Delete session ${session.session_number || 'record'}?`)) return;

  const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    sessionFormMessage.textContent = result.error || 'Unable to delete session.';
    return;
  }

  if (sessionForm.elements.namedItem('id').value === id) resetSessionForm();
  await loadSessions();
  await loadOverview();
}

async function loadPlayerDiscoveries() {
  const response = await fetch('/api/discoveries');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load player discoveries.');
  playerDiscoveries = payload.discoveries || [];
  renderPlayerDiscoveries();
}

function renderPlayerDiscoveries() {
  if (!playerDiscoveries.length) {
    discoveryList.innerHTML = '<div class="empty-state">No player discoveries recorded yet.</div>';
    return;
  }

  discoveryList.innerHTML = playerDiscoveries.map((discovery) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">${escapeHtml(discovery.category || 'Discovery')}</span>
          <h4>${escapeHtml(discovery.title)}</h4>
        </div>
        <span class="house-status">${Number(discovery.visible_to_players) === 1 ? 'Player-known' : 'Unrevealed'}</span>
      </div>
      <p>${escapeHtml(discovery.details || 'No details recorded.')}</p>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-discovery-edit="${escapeHtml(discovery.id)}">Edit</button>
        <button type="button" class="danger-button" data-discovery-delete="${escapeHtml(discovery.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  discoveryList.querySelectorAll('[data-discovery-edit]').forEach((button) => {
    button.addEventListener('click', () => editPlayerDiscovery(button.dataset.discoveryEdit));
  });
  discoveryList.querySelectorAll('[data-discovery-delete]').forEach((button) => {
    button.addEventListener('click', () => deletePlayerDiscoveryRecord(button.dataset.discoveryDelete));
  });
}

function editPlayerDiscovery(id) {
  const discovery = playerDiscoveries.find((entry) => entry.id === id);
  if (!discovery) return;
  discoveryForm.elements.namedItem('id').value = discovery.id;
  discoveryForm.elements.namedItem('title').value = discovery.title || '';
  discoveryForm.elements.namedItem('category').value = discovery.category || '';
  discoveryForm.elements.namedItem('details').value = discovery.details || '';
  discoveryForm.elements.namedItem('visibleToPlayers').checked = Number(discovery.visible_to_players) === 1;
  discoverySubmitButton.textContent = 'Save discovery';
  discoveryCancelButton.hidden = false;
  discoveryFormMessage.textContent = `Editing ${discovery.title}.`;
  discoveryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetPlayerDiscoveryForm() {
  discoveryForm.reset();
  discoveryForm.elements.namedItem('id').value = '';
  discoverySubmitButton.textContent = 'Add discovery';
  discoveryCancelButton.hidden = true;
  discoveryFormMessage.textContent = '';
}

async function savePlayerDiscovery(event) {
  event.preventDefault();
  discoveryFormMessage.textContent = '';
  const id = discoveryForm.elements.namedItem('id').value;
  const payload = {
    title: discoveryForm.elements.namedItem('title').value,
    category: discoveryForm.elements.namedItem('category').value,
    details: discoveryForm.elements.namedItem('details').value,
    visible_to_players: discoveryForm.elements.namedItem('visibleToPlayers').checked
  };
  const response = await fetch(id ? `/api/discoveries/${encodeURIComponent(id)}` : '/api/discoveries', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    discoveryFormMessage.textContent = result.error || 'Unable to save player discovery.';
    return;
  }

  resetPlayerDiscoveryForm();
  await loadPlayerDiscoveries();
}

async function deletePlayerDiscoveryRecord(id) {
  const discovery = playerDiscoveries.find((entry) => entry.id === id);
  if (!discovery || !window.confirm(`Delete "${discovery.title}"?`)) return;

  const response = await fetch(`/api/discoveries/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    discoveryFormMessage.textContent = result.error || 'Unable to delete player discovery.';
    return;
  }

  if (discoveryForm.elements.namedItem('id').value === id) resetPlayerDiscoveryForm();
  await loadPlayerDiscoveries();
}

async function loadQuests() {
  const response = await fetch('/api/quests');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load quests.');
  quests = payload.quests || [];
  renderQuests();
  refreshReferenceSelects();
}

function renderQuests() {
  if (!quests.length) {
    questList.innerHTML = '<div class="empty-state">No quests are on the board yet.</div>';
    return;
  }

  questList.innerHTML = quests.map((quest) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">Quest</span>
          <h4>${escapeHtml(quest.name)}</h4>
        </div>
        <span class="house-status">${escapeHtml(quest.status || 'undiscovered')}</span>
      </div>
      <dl class="house-details">
        ${quest.giver ? `<div><dt>Giver</dt><dd>${escapeHtml(quest.giver)}</dd></div>` : ''}
        ${quest.location_name ? `<div><dt>Location</dt><dd>${escapeHtml(quest.location_name)}</dd></div>` : ''}
        ${quest.summary ? `<div><dt>Summary</dt><dd>${escapeHtml(quest.summary)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-quest-edit="${escapeHtml(quest.id)}">Edit</button>
        <button type="button" class="danger-button" data-quest-delete="${escapeHtml(quest.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  questList.querySelectorAll('[data-quest-edit]').forEach((button) => {
    button.addEventListener('click', () => editQuest(button.dataset.questEdit));
  });
  questList.querySelectorAll('[data-quest-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteQuestRecord(button.dataset.questDelete));
  });
}

function editQuest(id) {
  const quest = quests.find((entry) => entry.id === id);
  if (!quest) return;
  questForm.elements.namedItem('id').value = quest.id;
  questForm.elements.namedItem('name').value = quest.name;
  questForm.elements.namedItem('status').value = quest.status || 'undiscovered';
  questForm.elements.namedItem('giver').value = quest.giver || '';
  questForm.elements.namedItem('locationId').value = quest.location_id || '';
  questForm.elements.namedItem('summary').value = quest.summary || '';
  questSubmitButton.textContent = 'Save quest';
  questCancelButton.hidden = false;
  questFormMessage.textContent = `Editing ${quest.name}.`;
  questForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetQuestForm() {
  questForm.reset();
  questForm.elements.namedItem('id').value = '';
  questSubmitButton.textContent = 'Create quest';
  questCancelButton.hidden = true;
  questFormMessage.textContent = '';
}

async function saveQuest(event) {
  event.preventDefault();
  questFormMessage.textContent = '';
  const id = questForm.elements.namedItem('id').value;
  const payload = {
    name: questForm.elements.namedItem('name').value,
    status: questForm.elements.namedItem('status').value,
    giver: questForm.elements.namedItem('giver').value,
    location_id: questForm.elements.namedItem('locationId').value || null,
    summary: questForm.elements.namedItem('summary').value
  };

  const response = await fetch(id ? `/api/quests/${encodeURIComponent(id)}` : '/api/quests', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    questFormMessage.textContent = result.error || 'Unable to save quest.';
    return;
  }

  resetQuestForm();
  await loadQuests();
  await loadOverview();
}

async function deleteQuestRecord(id) {
  const quest = quests.find((entry) => entry.id === id);
  if (!quest || !window.confirm(`Delete "${quest.name}"?`)) return;

  const response = await fetch(`/api/quests/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    questFormMessage.textContent = result.error || 'Unable to delete quest.';
    return;
  }

  if (questForm.elements.namedItem('id').value === id) resetQuestForm();
  await loadQuests();
  await loadOverview();
}

async function loadShopInventory(shopId = '') {
  if (!shopId) {
    shopInventory = [];
    renderShopInventory();
    return;
  }

  const response = await fetch(`/api/shops/${encodeURIComponent(shopId)}/inventory`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load shop inventory.');
  }
  shopInventory = payload.inventory || [];
  renderShopInventory();
}

function renderShopInventory() {
  if (!shopInventory.length) {
    shopInventoryList.innerHTML = '<div class="empty-state">No inventory logged for this shop yet.</div>';
    return;
  }

  shopInventoryList.innerHTML = shopInventory.map((item) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">${escapeHtml(item.item_category || 'Inventory')}</span>
          <h4>${escapeHtml(item.item_name)}</h4>
        </div>
        <span class="house-status">${escapeHtml(item.availability || 'available')}</span>
      </div>
      <dl class="house-details">
        ${item.quantity !== undefined ? `<div><dt>Qty</dt><dd>${escapeHtml(String(item.quantity))}</dd></div>` : ''}
        ${item.price !== undefined ? `<div><dt>Price</dt><dd>${escapeHtml(`${item.price} ${item.currency || 'gp'}`)}</dd></div>` : ''}
        ${item.description ? `<div><dt>Description</dt><dd>${escapeHtml(item.description)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-shop-inventory-edit="${escapeHtml(item.id)}">Edit</button>
        <button type="button" class="danger-button" data-shop-inventory-delete="${escapeHtml(item.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  shopInventoryList.querySelectorAll('[data-shop-inventory-edit]').forEach((button) => {
    button.addEventListener('click', () => editShopInventoryItem(button.dataset.shopInventoryEdit));
  });
  shopInventoryList.querySelectorAll('[data-shop-inventory-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteShopInventoryItemRecord(button.dataset.shopInventoryDelete));
  });
}

function editShopInventoryItem(id) {
  const item = shopInventory.find((entry) => entry.id === id);
  if (!item) return;
  shopInventoryForm.elements.namedItem('id').value = item.id;
  shopInventoryForm.elements.namedItem('shopId').value = item.shop_id || '';
  shopInventoryForm.elements.namedItem('itemName').value = item.item_name || '';
  shopInventoryForm.elements.namedItem('itemCategory').value = item.item_category || '';
  shopInventoryForm.elements.namedItem('quantity').value = Number(item.quantity ?? 0);
  shopInventoryForm.elements.namedItem('price').value = Number(item.price ?? 0);
  shopInventoryForm.elements.namedItem('currency').value = item.currency || 'gp';
  shopInventoryForm.elements.namedItem('condition').value = item.condition || 'standard';
  shopInventoryForm.elements.namedItem('availability').value = item.availability || 'available';
  shopInventoryForm.elements.namedItem('description').value = item.description || '';
  shopInventoryForm.elements.namedItem('playerVisible').value = item.player_visible ? '1' : '0';
  shopInventorySubmitButton.textContent = 'Save inventory item';
  shopInventoryCancelButton.hidden = false;
  shopInventoryFormMessage.textContent = `Editing ${item.item_name}.`;
  shopInventoryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetShopInventoryForm() {
  shopInventoryForm.reset();
  shopInventoryForm.elements.namedItem('id').value = '';
  shopInventoryForm.elements.namedItem('quantity').value = 1;
  shopInventoryForm.elements.namedItem('price').value = 0;
  shopInventoryForm.elements.namedItem('currency').value = 'gp';
  shopInventoryForm.elements.namedItem('condition').value = 'standard';
  shopInventoryForm.elements.namedItem('availability').value = 'available';
  shopInventoryForm.elements.namedItem('playerVisible').value = '1';
  shopInventorySubmitButton.textContent = 'Add inventory';
  shopInventoryCancelButton.hidden = true;
  shopInventoryFormMessage.textContent = '';
}

async function saveShopInventoryItem(event) {
  event.preventDefault();
  shopInventoryFormMessage.textContent = '';
  const id = shopInventoryForm.elements.namedItem('id').value;
  const shopId = shopInventoryForm.elements.namedItem('shopId').value;

  if (!shopId) {
    shopInventoryFormMessage.textContent = 'Choose a shop before adding inventory.';
    return;
  }

  const payload = {
    item_name: shopInventoryForm.elements.namedItem('itemName').value,
    item_category: shopInventoryForm.elements.namedItem('itemCategory').value,
    quantity: Number(shopInventoryForm.elements.namedItem('quantity').value || 0),
    price: Number(shopInventoryForm.elements.namedItem('price').value || 0),
    currency: shopInventoryForm.elements.namedItem('currency').value,
    condition: shopInventoryForm.elements.namedItem('condition').value,
    availability: shopInventoryForm.elements.namedItem('availability').value,
    description: shopInventoryForm.elements.namedItem('description').value,
    player_visible: shopInventoryForm.elements.namedItem('playerVisible').value === '1'
  };

  const response = await fetch(id ? `/api/shops/${encodeURIComponent(shopId)}/inventory/${encodeURIComponent(id)}` : `/api/shops/${encodeURIComponent(shopId)}/inventory`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    shopInventoryFormMessage.textContent = result.error || 'Unable to save inventory item.';
    return;
  }

  resetShopInventoryForm();
  await loadShopInventory(shopId);
}

async function deleteShopInventoryItemRecord(id) {
  const item = shopInventory.find((entry) => entry.id === id);
  if (!item || !window.confirm(`Delete "${item.item_name}" from inventory?`)) return;

  const response = await fetch(`/api/shops/${encodeURIComponent(item.shop_id)}/inventory/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    shopInventoryFormMessage.textContent = result.error || 'Unable to delete inventory item.';
    return;
  }

  if (shopInventoryForm.elements.namedItem('id').value === id) resetShopInventoryForm();
  await loadShopInventory(item.shop_id);
}

async function loadCampaignClock() {
  const response = await fetch('/api/simulation/clock');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load the campaign calendar.');
  calendarForm.elements.namedItem('campaignDate').value = payload.calendar.campaignDate;
  calendarForm.elements.namedItem('months').value = payload.calendar.months
    .map((month) => `${month.name}: ${month.days}`)
    .join('\n');
  simulationCycles = payload.cycles || [];
  renderSimulationCycles();
}

function renderSimulationCycles() {
  if (!simulationCycles.length) {
    simulationCycleList.innerHTML = '<div class="empty-state">No time advances recorded yet.</div>';
    return;
  }

  simulationCycleList.innerHTML = simulationCycles.map((cycle) => {
    const rollSummaries = (cycle.rolls || []).map((roll) => `
      <div class="simulation-roll">
        <strong>${escapeHtml(roll.group_name)}:</strong> ${escapeHtml(roll.roll_result)}
        ${roll.result_id ? '' : '<span>No entry matched this roll.</span>'}
      </div>
    `).join('');
    const results = (cycle.results || []).map((result) => {
      const canReview = ['pending', 'postponed'].includes(result.status);
      return `
        <article class="simulation-result-card">
          <div class="house-card-heading">
            <div>
              <span class="map-level">${escapeHtml(result.category || 'Development')}</span>
              <h5>${escapeHtml(result.title)}</h5>
            </div>
            <span class="house-status">${escapeHtml(result.status || 'pending')}</span>
          </div>
          ${result.description ? `<p>${escapeHtml(result.description)}</p>` : ''}
          <dl class="house-details">
            ${result.location_name ? `<div><dt>Location</dt><dd>${escapeHtml(result.location_name)}</dd></div>` : ''}
            ${result.involved_text ? `<div><dt>Involved</dt><dd>${escapeHtml(result.involved_text)}</dd></div>` : ''}
            ${result.roll_result ? `<div><dt>Roll</dt><dd>${escapeHtml(result.roll_result)}</dd></div>` : ''}
            ${result.timeline_event_id ? '<div><dt>Canon</dt><dd>Added to the campaign timeline.</dd></div>' : ''}
          </dl>
          ${canReview ? `
            <div class="house-card-actions">
              <button type="button" class="primary-button" data-result-decision="approve" data-result-id="${escapeHtml(result.id)}">Approve to timeline</button>
              <button type="button" class="secondary-button" data-result-edit="${escapeHtml(result.id)}">Edit</button>
              <button type="button" class="secondary-button" data-result-decision="postpone" data-result-id="${escapeHtml(result.id)}">Postpone</button>
              <button type="button" class="danger-button" data-result-decision="reject" data-result-id="${escapeHtml(result.id)}">Reject</button>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');
    return `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">${escapeHtml(cycle.interval_label || 'Time advanced')}</span>
          <h4>${escapeHtml(cycle.previous_date)} → ${escapeHtml(cycle.new_date)}</h4>
        </div>
        <span class="house-status">${escapeHtml(new Date(`${cycle.created_at}Z`).toLocaleString())}</span>
      </div>
      ${cycle.notes ? `<p>${escapeHtml(cycle.notes)}</p>` : ''}
      ${rollSummaries ? `<div class="simulation-roll-list">${rollSummaries}</div>` : ''}
      ${results ? `<div class="simulation-result-list">${results}</div>` : ''}
      ${!results && !rollSummaries ? '<p class="house-empty-details">No event tables were configured for this cycle.</p>' : ''}
    </article>
  `;
  }).join('');

  simulationCycleList.querySelectorAll('[data-result-edit]').forEach((button) => {
    button.addEventListener('click', () => editSimulationResult(button.dataset.resultEdit));
  });
  simulationCycleList.querySelectorAll('[data-result-decision]').forEach((button) => {
    button.addEventListener('click', () => decideSimulationResultRecord(
      button.dataset.resultId,
      button.dataset.resultDecision
    ));
  });
}

function findSimulationResult(id) {
  for (const cycle of simulationCycles) {
    const result = (cycle.results || []).find((entry) => entry.id === id);
    if (result) return result;
  }
  return null;
}

function editSimulationResult(id) {
  const result = findSimulationResult(id);
  if (!result) return;
  simulationResultForm.elements.namedItem('id').value = result.id;
  simulationResultForm.elements.namedItem('title').value = result.title || '';
  simulationResultForm.elements.namedItem('description').value = result.description || '';
  simulationResultForm.elements.namedItem('category').value = result.category || '';
  simulationResultForm.elements.namedItem('eventDate').value = result.event_date || '';
  simulationResultForm.elements.namedItem('locationName').value = result.location_name || '';
  simulationResultForm.elements.namedItem('involvedText').value = result.involved_text || '';
  simulationResultFormMessage.textContent = '';
  simulationResultDialog.showModal();
}

async function saveSimulationResultEdit(event) {
  event.preventDefault();
  simulationResultFormMessage.textContent = '';
  const id = simulationResultForm.elements.namedItem('id').value;
  const payload = {
    title: simulationResultForm.elements.namedItem('title').value,
    description: simulationResultForm.elements.namedItem('description').value,
    category: simulationResultForm.elements.namedItem('category').value,
    eventDate: simulationResultForm.elements.namedItem('eventDate').value,
    locationName: simulationResultForm.elements.namedItem('locationName').value,
    involvedText: simulationResultForm.elements.namedItem('involvedText').value
  };
  try {
    const response = await fetch(`/api/simulation/results/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      simulationResultFormMessage.textContent = result.error || 'Unable to edit this development.';
      return;
    }
    simulationResultDialog.close();
    await loadCampaignClock();
  } catch (error) {
    simulationResultFormMessage.textContent = `Unable to edit this development: ${error.message}`;
  }
}

async function decideSimulationResultRecord(id, decision) {
  const result = findSimulationResult(id);
  if (!result) return;
  const actions = {
    approve: `Approve "${result.title}" and add it to the campaign timeline?`,
    reject: `Reject "${result.title}"? It will not be added to campaign canon.`,
    postpone: `Postpone "${result.title}" for later review?`
  };
  if (!actions[decision] || !window.confirm(actions[decision])) return;

  try {
    const response = await fetch(`/api/simulation/results/${encodeURIComponent(id)}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });
    const payload = await response.json();
    if (!response.ok) {
      timeAdvanceMessage.textContent = payload.error || 'Unable to record the development decision.';
      return;
    }
    timeAdvanceMessage.textContent = decision === 'approve'
      ? 'Development approved and added to the campaign timeline.'
      : `Development ${decision === 'reject' ? 'rejected' : 'postponed'}.`;
    await loadCampaignClock();
    if (decision === 'approve') {
      await loadTimelineEvents();
      await loadOverview();
    }
  } catch (error) {
    timeAdvanceMessage.textContent = `Unable to record the development decision: ${error.message}`;
  }
}

async function exportCampaignJson(event) {
  event.preventDefault();
  campaignExportMessage.textContent = '';
  const categories = [...campaignExportForm.querySelectorAll('input[name="category"]:checked')]
    .map((input) => input.value);
  if (!categories.length) {
    campaignExportMessage.textContent = 'Select at least one category to export.';
    return;
  }

  let response;
  let result;
  try {
    response = await fetch(`/api/data/export?categories=${encodeURIComponent(categories.join(','))}`);
    if (!response.ok) {
      result = await response.json();
      campaignExportMessage.textContent = result.error || 'Unable to export campaign data.';
      return;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `pathfinder-campaign-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    campaignExportMessage.textContent = 'Campaign JSON downloaded. Review it for private information before sharing.';
  } catch (error) {
    campaignExportMessage.textContent = `Unable to export campaign data: ${error.message}`;
  }
}

function renderCampaignImportPreview(report) {
  const categorySummary = Object.entries(report.categories || {}).map(([category, counts]) => `
    <li><strong>${escapeHtml(category)}:</strong> ${counts.insert} new, ${counts.duplicate} duplicate, ${counts.conflict} conflict</li>
  `).join('');
  const settingSummary = [
    report.settings?.added?.length ? `${report.settings.added.length} new settings` : '',
    report.settings?.unchanged?.length ? `${report.settings.unchanged.length} unchanged settings` : '',
    report.settings?.conflicts?.length ? `${report.settings.conflicts.length} differing settings` : ''
  ].filter(Boolean).join(', ');
  const details = (report.details || []).slice(0, 50).map((item) => `
    <li class="import-issue">${escapeHtml(item.status)}: ${escapeHtml(item.collection)} — ${escapeHtml(item.name || item.id)}. ${escapeHtml(item.reason)}</li>
  `).join('');
  const remaining = Math.max(0, (report.details || []).length - 50) + Number(report.detailsTruncated || 0);

  campaignImportPreviewElement.innerHTML = `
    <strong>${report.canImport ? 'Preview ready. Review before importing.' : 'No new non-conflicting records are available to import.'}</strong>
    ${categorySummary ? `<ul>${categorySummary}</ul>` : ''}
    ${settingSummary ? `<p>Settings: ${escapeHtml(settingSummary)}.</p>` : ''}
    ${details ? `<details><summary>${report.records.duplicate + report.records.conflict} duplicate or conflicting record(s)</summary><ul>${details}${remaining ? `<li>And ${remaining} more.</li>` : ''}</ul></details>` : ''}
  `;
}

async function previewCampaignJsonImport(event) {
  event.preventDefault();
  campaignImportMessage.textContent = '';
  campaignImportApplyButton.disabled = true;
  campaignImportPayload = null;
  campaignImportPreviewElement.replaceChildren();
  const file = campaignImportForm.elements.namedItem('file').files[0];
  if (!file) {
    campaignImportMessage.textContent = 'Choose a campaign JSON file first.';
    return;
  }
  if (file.size > 24 * 1024 * 1024) {
    campaignImportMessage.textContent = 'The selected file is larger than 24 MB.';
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch (error) {
    campaignImportMessage.textContent = `Unable to read valid JSON from this file: ${error.message}`;
    return;
  }

  let response;
  let report;
  try {
    response = await fetch('/api/data/import/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        options: { overwriteSettings: campaignImportForm.elements.namedItem('overwriteSettings').checked }
      })
    });
    report = await response.json();
  } catch (error) {
    campaignImportMessage.textContent = `Unable to validate this import: ${error.message}`;
    return;
  }
  if (!response.ok) {
    campaignImportMessage.textContent = report.error || 'Unable to validate this import.';
    return;
  }

  campaignImportPayload = payload;
  campaignImportApplyButton.disabled = !report.canImport;
  campaignImportMessage.textContent = 'Validation complete. Nothing has been changed yet.';
  renderCampaignImportPreview(report);
}

async function applyCampaignJsonImport() {
  if (!campaignImportPayload) return;
  const options = { overwriteSettings: campaignImportForm.elements.namedItem('overwriteSettings').checked };
  const previewResponse = await fetch('/api/data/import/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: campaignImportPayload, options })
  });
  const previewReport = await previewResponse.json();
  if (!previewResponse.ok || !previewReport.canImport) {
    campaignImportMessage.textContent = previewReport.error || 'The import is no longer applicable. Validate it again.';
    campaignImportApplyButton.disabled = true;
    return;
  }

  try {
    const total = previewReport.records.insert;
    const newSettings = previewReport.settings.added.length;
    const settings = options.overwriteSettings && previewReport.settings.conflicts.length
      ? ' Differing campaign settings will also be replaced.'
      : ' Differing campaign settings will be kept.';
    if (!window.confirm(`Import ${total} new record(s) and ${newSettings} new setting(s)? Existing records will not be overwritten.${settings}`)) return;

    campaignImportApplyButton.disabled = true;
    campaignImportMessage.textContent = 'Importing campaign data…';
    const response = await fetch('/api/data/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: campaignImportPayload, options })
    });
    const result = await response.json();
    if (!response.ok) {
      campaignImportMessage.textContent = result.error || 'Unable to import campaign data.';
      campaignImportApplyButton.disabled = true;
      return;
    }
    campaignImportMessage.textContent = `Imported ${result.report.records.insert} campaign record(s). Reloading the campaign…`;
    window.location.reload();
  } catch (error) {
    campaignImportMessage.textContent = `Unable to import campaign data: ${error.message}`;
    campaignImportApplyButton.disabled = false;
  }
}

async function saveCampaignCalendar(event) {
  event.preventDefault();
  calendarFormMessage.textContent = '';
  let response;
  let result;
  try {
    response = await fetch('/api/simulation/clock/calendar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignDate: calendarForm.elements.namedItem('campaignDate').value,
        months: calendarForm.elements.namedItem('months').value
      })
    });
    result = await response.json();
  } catch (error) {
    calendarFormMessage.textContent = `Unable to save the campaign calendar: ${error.message}`;
    return;
  }
  if (!response.ok) {
    calendarFormMessage.textContent = result.error || 'Unable to save the campaign calendar.';
    return;
  }

  calendarFormMessage.textContent = 'Campaign calendar saved.';
  try {
    await loadCampaignClock();
    await loadOverview();
  } catch (error) {
    calendarFormMessage.textContent = `Calendar saved, but the campaign view could not refresh: ${error.message}`;
  }
}

async function advanceCampaignTime(event) {
  event.preventDefault();
  timeAdvanceMessage.textContent = '';
  let response;
  let result;
  try {
    response = await fetch('/api/simulation/clock/advance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(timeAdvanceForm.elements.namedItem('amount').value),
        unit: timeAdvanceForm.elements.namedItem('unit').value
      })
    });
    result = await response.json();
  } catch (error) {
    timeAdvanceMessage.textContent = `Unable to advance campaign time: ${error.message}`;
    return;
  }
  if (!response.ok) {
    timeAdvanceMessage.textContent = result.error || 'Unable to advance campaign time.';
    return;
  }

  timeAdvanceMessage.textContent = `Campaign date advanced to ${result.calendar.campaignDate}.`;
  const resultCount = (result.cycle.results || []).filter(Boolean).length;
  if (resultCount) {
    timeAdvanceMessage.textContent += ` ${resultCount} possible development(s) are ready for review.`;
  }
  calendarForm.elements.namedItem('campaignDate').value = result.calendar.campaignDate;
  try {
    await loadCampaignClock();
    await loadOverview();
  } catch (error) {
    timeAdvanceMessage.textContent = `Time advanced, but the campaign view could not refresh: ${error.message}`;
  }
}

async function loadSimulationTables() {
  const response = await fetch('/api/simulation/tables');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load simulation tables.');
  simulationTables = payload.tables || [];
  renderSimulationTables();
}

function renderSimulationTables() {
  if (!simulationTables.length) {
    simulationTableList.innerHTML = '<div class="empty-state">No event tables created yet.</div>';
    return;
  }

  simulationTableList.innerHTML = simulationTables.map((table) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">${escapeHtml(table.group_name || 'General')} · ${escapeHtml(table.category || 'Event')}</span>
          <h4>${escapeHtml(table.name)}</h4>
        </div>
        <span class="house-status">${escapeHtml(String(table.weight || 1))}</span>
      </div>
      <dl class="house-details">
        ${table.roll_range ? `<div><dt>Roll</dt><dd>${escapeHtml(table.roll_range)}</dd></div>` : ''}
        ${table.description ? `<div><dt>Description</dt><dd>${escapeHtml(table.description)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-simulation-table-edit="${escapeHtml(table.id)}">Edit</button>
        <button type="button" class="danger-button" data-simulation-table-delete="${escapeHtml(table.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  simulationTableList.querySelectorAll('[data-simulation-table-edit]').forEach((button) => {
    button.addEventListener('click', () => editSimulationTable(button.dataset.simulationTableEdit));
  });
  simulationTableList.querySelectorAll('[data-simulation-table-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteSimulationTableRecord(button.dataset.simulationTableDelete));
  });
}

function editSimulationTable(id) {
  const table = simulationTables.find((entry) => entry.id === id);
  if (!table) return;
  simulationTableForm.elements.namedItem('id').value = table.id;
  simulationTableForm.elements.namedItem('groupName').value = table.group_name || 'General';
  simulationTableForm.elements.namedItem('name').value = table.name || '';
  simulationTableForm.elements.namedItem('category').value = table.category || '';
  simulationTableForm.elements.namedItem('rollRange').value = table.roll_range || '';
  simulationTableForm.elements.namedItem('weight').value = Number(table.weight ?? 1);
  simulationTableForm.elements.namedItem('description').value = table.description || '';
  simulationTableSubmitButton.textContent = 'Save table';
  simulationTableCancelButton.hidden = false;
  simulationTableFormMessage.textContent = `Editing ${table.name}.`;
  simulationTableForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetSimulationTableForm() {
  simulationTableForm.reset();
  simulationTableForm.elements.namedItem('id').value = '';
  simulationTableForm.elements.namedItem('weight').value = 1;
  simulationTableSubmitButton.textContent = 'Add table';
  simulationTableCancelButton.hidden = true;
  simulationTableFormMessage.textContent = '';
}

async function saveSimulationTable(event) {
  event.preventDefault();
  simulationTableFormMessage.textContent = '';
  const id = simulationTableForm.elements.namedItem('id').value;
  const payload = {
    group_name: simulationTableForm.elements.namedItem('groupName').value,
    name: simulationTableForm.elements.namedItem('name').value,
    category: simulationTableForm.elements.namedItem('category').value,
    roll_range: simulationTableForm.elements.namedItem('rollRange').value,
    weight: Number(simulationTableForm.elements.namedItem('weight').value || 1),
    description: simulationTableForm.elements.namedItem('description').value
  };

  const response = await fetch(id ? `/api/simulation/tables/${encodeURIComponent(id)}` : '/api/simulation/tables', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    simulationTableFormMessage.textContent = result.error || 'Unable to save simulation table.';
    return;
  }

  resetSimulationTableForm();
  await loadSimulationTables();
}

async function deleteSimulationTableRecord(id) {
  const table = simulationTables.find((entry) => entry.id === id);
  if (!table || !window.confirm(`Delete "${table.name}"?`)) return;

  const response = await fetch(`/api/simulation/tables/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    simulationTableFormMessage.textContent = result.error || 'Unable to delete simulation table.';
    return;
  }

  if (simulationTableForm.elements.namedItem('id').value === id) resetSimulationTableForm();
  await loadSimulationTables();
}

async function loadTimelineEvents() {
  const response = await fetch('/api/timeline');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load timeline.');
  timelineEvents = payload.timeline || [];
  renderTimelineEvents();
}

function renderTimelineEvents() {
  if (!timelineEvents.length) {
    timelineList.innerHTML = '<div class="empty-state">No timeline entries created yet.</div>';
    return;
  }

  timelineList.innerHTML = timelineEvents.map((event) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">${escapeHtml(event.category || 'History')}</span>
          <h4>${escapeHtml(event.title)}</h4>
        </div>
      </div>
      <dl class="house-details">
        ${event.event_date ? `<div><dt>Date</dt><dd>${escapeHtml(event.event_date)}</dd></div>` : ''}
        ${event.summary ? `<div><dt>Summary</dt><dd>${escapeHtml(event.summary)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-timeline-edit="${escapeHtml(event.id)}">Edit</button>
        <button type="button" class="danger-button" data-timeline-delete="${escapeHtml(event.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  timelineList.querySelectorAll('[data-timeline-edit]').forEach((button) => {
    button.addEventListener('click', () => editTimelineEvent(button.dataset.timelineEdit));
  });
  timelineList.querySelectorAll('[data-timeline-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteTimelineEventRecord(button.dataset.timelineDelete));
  });
}

function editTimelineEvent(id) {
  const event = timelineEvents.find((entry) => entry.id === id);
  if (!event) return;
  timelineForm.elements.namedItem('id').value = event.id;
  timelineForm.elements.namedItem('title').value = event.title;
  timelineForm.elements.namedItem('category').value = event.category || '';
  timelineForm.elements.namedItem('eventDate').value = event.event_date || '';
  timelineForm.elements.namedItem('summary').value = event.summary || '';
  timelineSubmitButton.textContent = 'Save timeline event';
  timelineCancelButton.hidden = false;
  timelineFormMessage.textContent = `Editing ${event.title}.`;
  timelineForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetTimelineForm() {
  timelineForm.reset();
  timelineForm.elements.namedItem('id').value = '';
  timelineSubmitButton.textContent = 'Create timeline event';
  timelineCancelButton.hidden = true;
  timelineFormMessage.textContent = '';
}

async function saveTimelineEvent(event) {
  event.preventDefault();
  timelineFormMessage.textContent = '';
  const id = timelineForm.elements.namedItem('id').value;
  const payload = {
    title: timelineForm.elements.namedItem('title').value,
    category: timelineForm.elements.namedItem('category').value,
    event_date: timelineForm.elements.namedItem('eventDate').value,
    summary: timelineForm.elements.namedItem('summary').value
  };

  const response = await fetch(id ? `/api/timeline/${encodeURIComponent(id)}` : '/api/timeline', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    timelineFormMessage.textContent = result.error || 'Unable to save timeline event.';
    return;
  }

  resetTimelineForm();
  await loadTimelineEvents();
  await loadOverview();
}

async function deleteTimelineEventRecord(id) {
  const event = timelineEvents.find((entry) => entry.id === id);
  if (!event || !window.confirm(`Delete "${event.title}"?`)) return;

  const response = await fetch(`/api/timeline/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    timelineFormMessage.textContent = result.error || 'Unable to delete timeline event.';
    return;
  }

  if (timelineForm.elements.namedItem('id').value === id) resetTimelineForm();
  await loadTimelineEvents();
  await loadOverview();
}

async function loadSimulationEvents() {
  const response = await fetch('/api/simulation');
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to load simulation events.');
  simulationEvents = payload.simulation || [];
  renderSimulationEvents();
}

function renderSimulationEvents() {
  if (!simulationEvents.length) {
    simulationList.innerHTML = '<div class="empty-state">No world simulation outcomes recorded.</div>';
    return;
  }

  simulationList.innerHTML = simulationEvents.map((event) => `
    <article class="house-card">
      <div class="house-card-heading">
        <div>
          <span class="map-level">${escapeHtml(event.category || 'Simulation')}</span>
          <h4>${escapeHtml(event.title)}</h4>
        </div>
        <span class="house-status">${escapeHtml(event.status || 'proposed')}</span>
      </div>
      <dl class="house-details">
        ${event.date ? `<div><dt>Date</dt><dd>${escapeHtml(event.date)}</dd></div>` : ''}
        ${event.details ? `<div><dt>Details</dt><dd>${escapeHtml(event.details)}</dd></div>` : ''}
      </dl>
      <div class="house-card-actions">
        <button type="button" class="secondary-button" data-simulation-edit="${escapeHtml(event.id)}">Edit</button>
        <button type="button" class="danger-button" data-simulation-delete="${escapeHtml(event.id)}">Delete</button>
      </div>
    </article>
  `).join('');

  simulationList.querySelectorAll('[data-simulation-edit]').forEach((button) => {
    button.addEventListener('click', () => editSimulationEvent(button.dataset.simulationEdit));
  });
  simulationList.querySelectorAll('[data-simulation-delete]').forEach((button) => {
    button.addEventListener('click', () => deleteSimulationEventRecord(button.dataset.simulationDelete));
  });
}

function editSimulationEvent(id) {
  const event = simulationEvents.find((entry) => entry.id === id);
  if (!event) return;
  simulationForm.elements.namedItem('id').value = event.id;
  simulationForm.elements.namedItem('title').value = event.title;
  simulationForm.elements.namedItem('category').value = event.category || '';
  simulationForm.elements.namedItem('date').value = event.date || '';
  simulationForm.elements.namedItem('status').value = event.status || 'proposed';
  simulationForm.elements.namedItem('details').value = event.details || '';
  simulationSubmitButton.textContent = 'Save simulation';
  simulationCancelButton.hidden = false;
  simulationFormMessage.textContent = `Editing ${event.title}.`;
  simulationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetSimulationForm() {
  simulationForm.reset();
  simulationForm.elements.namedItem('id').value = '';
  simulationSubmitButton.textContent = 'Create simulation';
  simulationCancelButton.hidden = true;
  simulationFormMessage.textContent = '';
}

async function saveSimulationEvent(event) {
  event.preventDefault();
  simulationFormMessage.textContent = '';
  const id = simulationForm.elements.namedItem('id').value;
  const payload = {
    title: simulationForm.elements.namedItem('title').value,
    category: simulationForm.elements.namedItem('category').value,
    date: simulationForm.elements.namedItem('date').value,
    status: simulationForm.elements.namedItem('status').value,
    details: simulationForm.elements.namedItem('details').value
  };

  const response = await fetch(id ? `/api/simulation/${encodeURIComponent(id)}` : '/api/simulation', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    simulationFormMessage.textContent = result.error || 'Unable to save simulation event.';
    return;
  }

  resetSimulationForm();
  await loadSimulationEvents();
  await loadOverview();
}

async function deleteSimulationEventRecord(id) {
  const event = simulationEvents.find((entry) => entry.id === id);
  if (!event || !window.confirm(`Delete "${event.title}"?`)) return;

  const response = await fetch(`/api/simulation/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const result = await response.json();
  if (!response.ok) {
    simulationFormMessage.textContent = result.error || 'Unable to delete simulation event.';
    return;
  }

  if (simulationForm.elements.namedItem('id').value === id) resetSimulationForm();
  await loadSimulationEvents();
  await loadOverview();
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
  if (sectionId === 'npcs') {
    loadNpcs().catch((error) => {
      npcList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
    loadHouses().catch(() => {});
    loadLocations().catch(() => {});
  }
  if (sectionId === 'factions') {
    loadFactions().catch((error) => {
      factionList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
  }
  if (sectionId === 'shops') {
    loadShops().catch((error) => {
      shopList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
    loadLocations().catch(() => {});
    loadNpcs().catch(() => {});
  }
  if (sectionId === 'journal') {
    loadSessions().catch((error) => {
      sessionList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
    loadPlayerDiscoveries().catch((error) => {
      discoveryList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
  }
  if (sectionId === 'quests') {
    loadQuests().catch((error) => {
      questList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
    loadLocations().catch(() => {});
  }
  if (sectionId === 'timeline') {
    loadTimelineEvents().catch((error) => {
      timelineList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
  }
  if (sectionId === 'simulation') {
    loadCampaignClock().catch((error) => {
      calendarFormMessage.textContent = error.message;
    });
    loadSimulationEvents().catch((error) => {
      simulationList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
    loadSimulationTables().catch((error) => {
      simulationTableList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    });
    loadCampaignClock().catch((error) => {
      calendarFormMessage.textContent = error.message;
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
  refreshReferenceSelects();
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
houseRelationshipForm.addEventListener('submit', saveHouseRelationship);
houseRelationshipCancelButton.addEventListener('click', resetHouseRelationshipForm);
npcForm.addEventListener('submit', saveNpc);
npcCancelButton.addEventListener('click', resetNpcForm);
npcRelationshipForm.addEventListener('submit', saveNpcRelationship);
factionForm.addEventListener('submit', saveFaction);
factionCancelButton.addEventListener('click', resetFactionForm);
shopForm.addEventListener('submit', saveShop);
shopCancelButton.addEventListener('click', resetShopForm);
shopInventoryForm.addEventListener('submit', saveShopInventoryItem);
shopInventoryForm.elements.namedItem('shopId').addEventListener('change', (event) => {
  loadShopInventory(event.target.value).catch((error) => {
    shopInventoryList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  });
});
shopInventoryCancelButton.addEventListener('click', resetShopInventoryForm);
sessionForm.addEventListener('submit', saveSession);
sessionCancelButton.addEventListener('click', resetSessionForm);
discoveryForm.addEventListener('submit', savePlayerDiscovery);
discoveryCancelButton.addEventListener('click', resetPlayerDiscoveryForm);
questForm.addEventListener('submit', saveQuest);
questCancelButton.addEventListener('click', resetQuestForm);
timelineForm.addEventListener('submit', saveTimelineEvent);
timelineCancelButton.addEventListener('click', resetTimelineForm);
simulationForm.addEventListener('submit', saveSimulationEvent);
simulationCancelButton.addEventListener('click', resetSimulationForm);
simulationTableForm.addEventListener('submit', saveSimulationTable);
simulationTableCancelButton.addEventListener('click', resetSimulationTableForm);
simulationResultForm.addEventListener('submit', saveSimulationResultEdit);
document.getElementById('simulationResultClose').addEventListener('click', () => simulationResultDialog.close());
document.getElementById('simulationResultCancel').addEventListener('click', () => simulationResultDialog.close());
calendarForm.addEventListener('submit', saveCampaignCalendar);
timeAdvanceForm.addEventListener('submit', advanceCampaignTime);
searchInput.addEventListener('input', performSearch);
settingsForm.addEventListener('submit', saveSettings);
campaignExportForm.addEventListener('submit', exportCampaignJson);
campaignImportForm.addEventListener('submit', previewCampaignJsonImport);
campaignImportApplyButton.addEventListener('click', applyCampaignJsonImport);
campaignImportForm.elements.namedItem('file').addEventListener('change', () => {
  campaignImportPayload = null;
  campaignImportApplyButton.disabled = true;
  campaignImportPreviewElement.replaceChildren();
  campaignImportMessage.textContent = '';
});
campaignImportForm.elements.namedItem('overwriteSettings').addEventListener('change', () => {
  campaignImportPayload = null;
  campaignImportApplyButton.disabled = true;
  campaignImportPreviewElement.replaceChildren();
  campaignImportMessage.textContent = 'Settings changed. Validate and preview the import again.';
});
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
loadHouses().catch((error) => {
  houseList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadNpcs().catch((error) => {
  npcList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadFactions().catch((error) => {
  factionList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadShops().catch((error) => {
  shopList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadSimulationTables().catch((error) => {
  simulationTableList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadSessions().catch((error) => {
  sessionList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadQuests().catch((error) => {
  questList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadTimelineEvents().catch((error) => {
  timelineList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
loadSimulationEvents().catch((error) => {
  simulationList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
});
performSearch();
