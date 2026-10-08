const form = document.querySelector('#filter-form');
const searchInput = document.querySelector('#search');
const modeSelect = document.querySelector('#mode');
const chipBox = document.querySelector('#domains');
const grid = document.querySelector('#results');
const status = document.querySelector('#status');

let all = [];
let activeDomain = '';

// Escape text before putting it in innerHTML
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function init() {
  try {
    const res = await fetch('data/internships.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    all = data.internships;
    buildDomainChips();
    render();
  } catch (err) {
    status.textContent = 'Could not load internships.';
    grid.innerHTML = `
      <div class="state error" role="alert">
        <h3>Internships did not load</h3>
        <p>Check your connection, or open the page through a local server instead of a file.</p>
        <button class="btn" id="retry" type="button">Try again</button>
      </div>`;
    document.querySelector('#retry').addEventListener('click', init);
  }
}

function buildDomainChips() {
  const domains = ['All', ...new Set(all.map((i) => i.domain))];
  chipBox.innerHTML = domains.map((d) => {
    const value = d === 'All' ? '' : d;
    return `<button type="button" class="chip" data-domain="${esc(value)}"
      aria-pressed="${value === activeDomain}">${esc(d)}</button>`;
  }).join('');
}

function getFiltered() {
  const q = searchInput.value.trim().toLowerCase();
  const mode = modeSelect.value;
  return all.filter((i) => {
    const text = [i.title, i.location, i.domain, ...i.skills].join(' ').toLowerCase();
    return (!activeDomain || i.domain === activeDomain)
      && (!mode || i.mode === mode)
      && (!q || text.includes(q));
  });
}

function cardHTML(i) {
  const modeClass = i.mode.toLowerCase();
  return `
    <article class="card" aria-labelledby="${esc(i.id)}-t">
      <div class="card-top">
        <div>
          <h3 id="${esc(i.id)}-t">${esc(i.title)}</h3>
          <p class="domain">${esc(i.domain)}</p>
        </div>
        <p class="openings" aria-label="${i.openings} openings">
          <strong>${i.openings}</strong><span>${i.openings === 1 ? 'opening' : 'openings'}</span>
        </p>
      </div>
      <ul class="meta">
        <li><span class="dot ${esc(modeClass)}" aria-hidden="true"></span>${esc(i.mode)}</li>
        <li>${esc(i.location)}</li>
      </ul>
      <ul class="skills" aria-label="Skills">
        ${i.skills.map((s) => `<li>${esc(s)}</li>`).join('')}
      </ul>
    </article>`;
}

function render() {
  const list = getFiltered();
  status.textContent = `${list.length} ${list.length === 1 ? 'internship' : 'internships'} found`;

  if (!list.length) {
    grid.innerHTML = `
      <div class="state">
        <h3>No internships match</h3>
        <p>Try a different keyword, or clear the filters to see every role.</p>
        <button class="btn" id="reset" type="button">Clear filters</button>
      </div>`;
    document.querySelector('#reset').addEventListener('click', resetFilters);
    return;
  }
  grid.innerHTML = list.map(cardHTML).join('');
}

function resetFilters() {
  searchInput.value = '';
  modeSelect.value = '';
  activeDomain = '';
  buildDomainChips();
  render();
  searchInput.focus();
}

form.addEventListener('submit', (e) => e.preventDefault());
searchInput.addEventListener('input', render);
modeSelect.addEventListener('change', render);

chipBox.addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  activeDomain = btn.dataset.domain;
  chipBox.querySelectorAll('.chip').forEach((c) =>
    c.setAttribute('aria-pressed', String(c === btn)));
  render();
});

init();