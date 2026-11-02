const summaryGrid = document.getElementById('summaryGrid');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const settingsForm = document.getElementById('settingsForm');
const backupButton = document.getElementById('backupButton');
const backupList = document.getElementById('backupList');
const campaignTitle = document.getElementById('campaignTitle');

const sectionButtons = [...document.querySelectorAll('.nav-item')];
const panels = [...document.querySelectorAll('.panel')];

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

sectionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    sectionButtons.forEach((item) => item.classList.toggle('active', item === button));
    panels.forEach((panel) => panel.classList.toggle('active-panel', panel.id === button.dataset.section));
  });
});

searchInput.addEventListener('input', performSearch);
settingsForm.addEventListener('submit', saveSettings);
backupButton.addEventListener('click', createBackup);

loadOverview();
loadBackups();
performSearch();
