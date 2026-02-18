// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Safely escape a string for injection into HTML to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

// ─── Dark Mode ────────────────────────────────────────────────────────────────

function initDarkMode() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const html = document.documentElement;

  // Read saved preference; fall back to light mode.
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('theme') || 'light';
  } catch (_) {
    // localStorage may be unavailable in private/restricted contexts.
  }

  if (savedTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }

  darkModeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    try {
      localStorage.setItem('theme', currentTheme);
    } catch (_) {
      // Ignore write failures in restricted contexts.
    }
  });
}

// ─── Internationalisation ─────────────────────────────────────────────────────

function getBrowserLanguage() {
  // navigator.language is the modern standard; navigator.userLanguage was IE-only.
  const lang = navigator.language || 'fr';
  return lang.split('-')[0];
}

function translatePage(lang) {
  const currentLang = translations[lang] ? lang : 'fr';
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[currentLang][key]) {
      element.textContent = translations[currentLang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[currentLang][key]) {
      element.placeholder = translations[currentLang][key];
    }
  });
}

/** Return the active locale string. */
function currentLang() {
  return document.documentElement.lang || 'fr';
}

/** Translate a single key in the active locale. */
function t(key) {
  return (translations[currentLang()] || translations['fr'])[key] || key;
}

// ─── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  translatePage(getBrowserLanguage());
  initDarkMode();
});

// ─── Email Generation ─────────────────────────────────────────────────────────

/**
 * Generate all supported email patterns for a person object.
 * Guards against empty first/last name when accessing character indices.
 *
 * @param {{ firstName: string, lastName: string, domain: string }} person
 * @returns {string[]}
 */
function generateEmailPatterns(person) {
  const firstName = normalizeAccentedChars(person.firstName.trim()).toLowerCase();
  const lastName  = normalizeAccentedChars(person.lastName.trim()).toLowerCase();
  const domain    = person.domain.trim().toLowerCase();

  const f0 = firstName.length > 0 ? firstName[0] : '';
  const l0 = lastName.length  > 0 ? lastName[0]  : '';

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
  ].filter(email => email.length > 1); // drop degenerate entries
}

// ─── Clipboard ────────────────────────────────────────────────────────────────

/**
 * Copy text to clipboard and provide visual feedback on the trigger button.
 * Falls back to document.execCommand for non-HTTPS / older environments.
 *
 * @param {string} text
 * @param {HTMLButtonElement} button
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text, button) {
  let success = false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      success = true;
    } else {
      // Fallback for non-HTTPS or older browsers.
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity  = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      success = document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
  }

  const originalContent = button.innerHTML;
  if (success) {
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    `;
    button.classList.add('text-green-600');
  } else {
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    `;
    button.classList.add('text-red-600');
  }

  setTimeout(() => {
    button.innerHTML = originalContent;
    button.classList.remove('text-green-600', 'text-red-600');
  }, 2000);

  return success;
}

// ─── People Store ─────────────────────────────────────────────────────────────

/** @type {Array<{ id: number, firstName: string, lastName: string, domain: string }>} */
let people = [];

// ─── DOM References ───────────────────────────────────────────────────────────

const form                = document.getElementById('personForm');
const peopleListEl        = document.getElementById('peopleList');
const resultsContainerEl  = document.getElementById('resultsContainer');
const generateEmailsBtn   = document.getElementById('generateEmails');

// ─── Inline Validation Error ──────────────────────────────────────────────────

/**
 * Show an inline error message below the form.
 * @param {string} message
 */
function showFormError(message) {
  let errorEl = document.getElementById('formError');
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.id = 'formError';
    errorEl.className = 'mt-2 text-sm text-red-600 dark:text-red-400';
    form.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearFormError() {
  const errorEl = document.getElementById('formError');
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }
}

// ─── People List Rendering ────────────────────────────────────────────────────

function updatePeopleList() {
  peopleListEl.innerHTML = '';

  if (people.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700';
    const emptyP = document.createElement('p');
    emptyP.className = 'text-sm sm:text-base text-gray-600 dark:text-gray-400';
    emptyP.setAttribute('data-i18n', 'noPersonsAdded');
    emptyP.textContent = t('noPersonsAdded');
    emptyDiv.appendChild(emptyP);
    peopleListEl.appendChild(emptyDiv);
    return;
  }

  people.forEach(person => {
    const personElement = document.createElement('div');
    personElement.className = 'flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg mb-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200';

    // Build content via DOM API to avoid XSS.
    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex-grow';

    const nameP = document.createElement('p');
    nameP.className = 'text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100';
    nameP.textContent = `${person.firstName} ${person.lastName}`;

    const domainP = document.createElement('p');
    domainP.className = 'text-xs sm:text-sm text-gray-500 dark:text-gray-400';
    domainP.textContent = `@${person.domain}`;

    infoDiv.appendChild(nameP);
    infoDiv.appendChild(domainP);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'ml-4 text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 transition duration-200';
    removeBtn.setAttribute('aria-label', t('removePerson'));
    removeBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    `;
    removeBtn.addEventListener('click', () => removePerson(person.id));

    personElement.appendChild(infoDiv);
    personElement.appendChild(removeBtn);
    peopleListEl.appendChild(personElement);
  });
}

// ─── Email Suggestions Rendering ──────────────────────────────────────────────

function generateEmailSuggestions() {
  resultsContainerEl.innerHTML = '';

  if (people.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700';
    const emptyP = document.createElement('p');
    emptyP.className = 'text-sm sm:text-base text-gray-600 dark:text-gray-400';
    emptyP.textContent = t('noResults');
    emptyDiv.appendChild(emptyP);
    resultsContainerEl.appendChild(emptyDiv);
    return;
  }

  const allEmails = [];
  const wrapper = document.createElement('div');
  wrapper.className = 'space-y-4';

  people.forEach((person, index) => {
    const patterns = generateEmailPatterns(person);
    allEmails.push(...patterns);

    const card = document.createElement('div');
    card.className = 'p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200';

    // Header row
    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center mb-3';

    const heading = document.createElement('h3');
    heading.className = 'text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100';
    // textContent is XSS-safe.
    heading.textContent = `${person.firstName} ${person.lastName} (@${person.domain})`;

    const copyPersonBtn = document.createElement('button');
    copyPersonBtn.id = `copy-person-${index}`;
    copyPersonBtn.className = 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition duration-200';
    copyPersonBtn.setAttribute('title', t('copyEmails'));
    copyPersonBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
    `;
    copyPersonBtn.addEventListener('click', () => copyToClipboard(patterns.join('\n'), copyPersonBtn));

    headerDiv.appendChild(heading);
    headerDiv.appendChild(copyPersonBtn);

    // Email list
    const ul = document.createElement('ul');
    ul.className = 'space-y-1.5';
    patterns.forEach(pattern => {
      const li = document.createElement('li');
      li.className = 'text-sm sm:text-base text-gray-600 dark:text-gray-300 font-mono';
      li.textContent = pattern; // textContent is XSS-safe
      ul.appendChild(li);
    });

    card.appendChild(headerDiv);
    card.appendChild(ul);
    wrapper.appendChild(card);
  });

  // Copy-all button
  const footerDiv = document.createElement('div');
  footerDiv.className = 'flex justify-end mt-4';

  const copyAllBtn = document.createElement('button');
  copyAllBtn.id = 'copy-all';
  copyAllBtn.className = 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2';
  copyAllBtn.innerHTML = `
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
    </svg>
    <span>${t('copyAllEmails')}</span>
  `;
  copyAllBtn.addEventListener('click', () => copyToClipboard(allEmails.join('\n'), copyAllBtn));

  footerDiv.appendChild(copyAllBtn);
  wrapper.appendChild(footerDiv);
  resultsContainerEl.appendChild(wrapper);
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
  people = people.filter(person => person.id !== id);
  updatePeopleList();
  // Regenerate if results are already visible.
  if (resultsContainerEl.children.length > 0) {
    generateEmailSuggestions();
  }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

form.addEventListener('submit', addPerson);
generateEmailsBtn.addEventListener('click', generateEmailSuggestions);

// ─── Initial Render ───────────────────────────────────────────────────────────

updatePeopleList();
