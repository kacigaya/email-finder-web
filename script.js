// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Normalise accented characters to their ASCII equivalents.
 * @param {string} str
 * @returns {string}
 */
function normalizeAccentedChars(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Validate a basic domain string (e.g. "company.com").
 * @param {string} domain
 * @returns {boolean}
 */
function isValidDomain(domain) {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(domain);
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

function initTheme() {
  const toggle = document.getElementById('darkModeToggle');
  const root   = document.documentElement;

  let saved = 'dark';
  try { saved = localStorage.getItem('theme') || 'dark'; } catch (_) {}

  root.setAttribute('data-theme', saved);

  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (_) {}
  });
}

// ─── Internationalisation ─────────────────────────────────────────────────────

function getBrowserLanguage() {
  return (navigator.language || 'fr').split('-')[0];
}

function translatePage(lang) {
  const l = translations[lang] ? lang : 'fr';
  document.documentElement.lang = l;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[l][key]) el.textContent = translations[l][key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[l][key]) el.placeholder = translations[l][key];
  });
}

function currentLang() { return document.documentElement.lang || 'fr'; }
function t(key) { return (translations[currentLang()] || translations['fr'])[key] || key; }

// ─── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  translatePage(getBrowserLanguage());
  initTheme();
});

// ─── Email Generation ─────────────────────────────────────────────────────────

/**
 * @param {{ firstName: string, lastName: string, domain: string }} person
 * @returns {string[]}
 */
function generateEmailPatterns(person) {
  const firstName = normalizeAccentedChars(person.firstName.trim()).toLowerCase();
  const lastName  = normalizeAccentedChars(person.lastName.trim()).toLowerCase();
  const domain    = person.domain.trim().toLowerCase();

  const f0 = firstName[0] || '';
  const l0 = lastName[0]  || '';

  return [
    `${firstName}.${lastName}@${domain}`,
    `${firstName}${lastName}@${domain}`,
    `${f0}.${lastName}@${domain}`,
    `${firstName}@${domain}`,
    `${lastName}.${firstName}@${domain}`,
    `${lastName}${firstName}@${domain}`,
    `${f0}${lastName}@${domain}`,
    `${l0}.${firstName}@${domain}`,
    `${f0}${l0}@${domain}`,
  ].filter(e => e.replace(/@.*/, '').length > 0);
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

const ICON_COPY = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px;height:12px">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3"/>
</svg>`;

const ICON_CHECK = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px;height:12px">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
</svg>`;

/**
 * Copy text to clipboard; show visual feedback on button.
 * @param {string} text
 * @param {HTMLButtonElement} btn
 */
async function copyToClipboard(text, btn) {
  let ok = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    } else {
      const ta = Object.assign(document.createElement('textarea'), {
        value: text,
        style: 'position:fixed;opacity:0',
      });
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    }
  } catch (err) {
    console.error('Clipboard write failed:', err);
  }

  const prev = btn.innerHTML;
  btn.innerHTML = ok ? ICON_CHECK : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  btn.style.color = ok ? 'var(--success)' : 'var(--danger)';
  setTimeout(() => { btn.innerHTML = prev; btn.style.color = ''; }, 2000);
  return ok;
}

// ─── People Store ─────────────────────────────────────────────────────────────

/** @type {Array<{id:number, firstName:string, lastName:string, domain:string}>} */
let people = [];

// ─── DOM References ───────────────────────────────────────────────────────────

const form               = document.getElementById('personForm');
const peopleListEl       = document.getElementById('peopleList');
const resultsContainerEl = document.getElementById('resultsContainer');
const generateEmailsBtn  = document.getElementById('generateEmails');

// ─── Inline Validation Error ──────────────────────────────────────────────────

function showFormError(msg) {
  let el = document.getElementById('formError');
  if (!el) {
    el = document.createElement('p');
    el.id = 'formError';
    form.appendChild(el);
  }
  el.textContent = msg;
  el.hidden = false;
}

function clearFormError() {
  const el = document.getElementById('formError');
  if (el) { el.hidden = true; el.textContent = ''; }
}

// ─── People List Rendering ────────────────────────────────────────────────────

function updatePeopleList() {
  peopleListEl.innerHTML = '';

  if (people.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = t('noPersonsAdded');
    peopleListEl.appendChild(empty);
    return;
  }

  people.forEach(person => {
    // Chip container
    const chip = document.createElement('div');
    chip.className = 'person-chip';

    // Avatar initials
    const avatar = document.createElement('div');
    avatar.className = 'result-avatar';
    avatar.textContent = (person.firstName[0] || '?').toUpperCase();

    // Info
    const info = document.createElement('div');
    info.className = 'person-info';
    info.style.marginLeft = '12px';
    info.style.flex = '1';

    const name = document.createElement('span');
    name.className = 'person-name';
    name.textContent = `${person.firstName} ${person.lastName}`;

    const domain = document.createElement('span');
    domain.className = 'person-domain';
    domain.textContent = `@${person.domain}`;

    info.appendChild(name);
    info.appendChild(domain);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', t('removePerson'));
    removeBtn.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>`;
    removeBtn.addEventListener('click', () => removePerson(person.id));

    chip.appendChild(avatar);
    chip.appendChild(info);
    chip.appendChild(removeBtn);
    peopleListEl.appendChild(chip);
  });
}

// ─── Results Rendering ────────────────────────────────────────────────────────

function generateEmailSuggestions() {
  resultsContainerEl.innerHTML = '';

  if (people.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = t('noResults');
    resultsContainerEl.appendChild(empty);
    return;
  }

  const allEmails = [];

  people.forEach((person, idx) => {
    const patterns = generateEmailPatterns(person);
    allEmails.push(...patterns);

    const card = document.createElement('div');
    card.className = 'result-card';
    card.style.animationDelay = `${idx * 60}ms`;

    // ── Card header
    const header = document.createElement('div');
    header.className = 'result-header';

    const personMeta = document.createElement('div');
    personMeta.className = 'result-person';

    const avatar = document.createElement('div');
    avatar.className = 'result-avatar';
    avatar.textContent = (person.firstName[0] || '?').toUpperCase();

    const meta = document.createElement('div');

    const nameEl = document.createElement('div');
    nameEl.className = 'result-name';
    nameEl.textContent = `${person.firstName} ${person.lastName}`;

    const domainEl = document.createElement('div');
    domainEl.className = 'result-domain';
    domainEl.textContent = `@${person.domain}`;

    meta.appendChild(nameEl);
    meta.appendChild(domainEl);
    personMeta.appendChild(avatar);
    personMeta.appendChild(meta);

    // Copy person button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-person-btn';
    copyBtn.innerHTML = `${ICON_COPY}<span>${t('copyEmails')}</span>`;
    copyBtn.addEventListener('click', () => copyToClipboard(patterns.join('\n'), copyBtn));

    header.appendChild(personMeta);
    header.appendChild(copyBtn);

    // ── Email rows
    const ul = document.createElement('ul');
    ul.className = 'result-emails';

    patterns.forEach(email => {
      const li = document.createElement('li');
      li.className = 'email-row';

      const addr = document.createElement('span');
      addr.className = 'email-address';
      addr.textContent = email;

      const rowCopyBtn = document.createElement('button');
      rowCopyBtn.className = 'email-copy-btn';
      rowCopyBtn.setAttribute('aria-label', t('copyEmails'));
      rowCopyBtn.innerHTML = ICON_COPY;
      rowCopyBtn.addEventListener('click', () => copyToClipboard(email, rowCopyBtn));

      li.appendChild(addr);
      li.appendChild(rowCopyBtn);
      ul.appendChild(li);
    });

    card.appendChild(header);
    card.appendChild(ul);
    resultsContainerEl.appendChild(card);
  });

  // ── Copy-all row
  const copyAllRow = document.createElement('div');
  copyAllRow.className = 'copy-all-row';

  const copyAllBtn = document.createElement('button');
  copyAllBtn.className = 'btn btn-primary';
  copyAllBtn.style.fontSize = '13px';
  copyAllBtn.style.padding = '10px 20px';
  copyAllBtn.innerHTML = `${ICON_COPY}<span>${t('copyAllEmails')}</span>`;
  copyAllBtn.addEventListener('click', () => copyToClipboard(allEmails.join('\n'), copyAllBtn));

  copyAllRow.appendChild(copyAllBtn);
  resultsContainerEl.appendChild(copyAllRow);
}

// ─── Person CRUD ──────────────────────────────────────────────────────────────

function addPerson(event) {
  event.preventDefault();
  clearFormError();

  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const domain    = document.getElementById('domain').value.trim().replace(/^@/, '');

  if (!firstName || !lastName || !domain) {
    showFormError(t('fillAllFields'));
    return;
  }
  if (!isValidDomain(domain)) {
    showFormError(t('invalidDomain'));
    return;
  }

  people.push({ id: Date.now(), firstName, lastName, domain });
  updatePeopleList();
  form.reset();
}

function removePerson(id) {
  people = people.filter(p => p.id !== id);
  updatePeopleList();
  if (resultsContainerEl.children.length > 0) generateEmailSuggestions();
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

form.addEventListener('submit', addPerson);
generateEmailsBtn.addEventListener('click', generateEmailSuggestions);

// ─── Initial Render ───────────────────────────────────────────────────────────

updatePeopleList();
