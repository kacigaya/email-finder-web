# Email Finder

**Email Finder** is a lightweight, zero-dependency web application that generates professional email address formats from a person's name and their company domain. It supports three locales (French, English, Spanish) and auto-detects the browser language.

**Live demo**: [https://email-finder-web.netlify.app](https://email-finder-web.netlify.app)

---

## Features

- **9 email format patterns** generated per person:
  - `firstname.lastname@domain.com`
  - `firstnamelastname@domain.com`
  - `f.lastname@domain.com`
  - `firstname@domain.com`
  - `lastname.firstname@domain.com`
  - `lastnamefirstname@domain.com`
  - `flastname@domain.com`
  - `l.firstname@domain.com`
  - `fl@domain.com` (initials)
- **Multi-person support** — add as many people as you need before generating
- **Accent normalisation** — automatically strips diacritics (é → e, ñ → n, etc.)
- **Domain validation** — rejects malformed domain entries before generation
- **One-click copy** — copy an individual person's emails or all emails at once
- **Multilingual UI** — French, English, and Spanish; falls back to French
- **Dark mode** — persisted to `localStorage`
- **Responsive** — works on desktop, tablet, and mobile
- **XSS-safe** — all user input is escaped before any DOM insertion

---

## Usage

1. Enter a **first name**, **last name**, and **company domain** (e.g. `company.com`)
2. Click **"Add person"** — repeat for every person you want to look up
3. Click **"Generate emails"** — 9 address formats appear for each person
4. Use the copy icon next to a name to copy that person's emails, or **"Copy all emails"** to copy everything at once

---

## Running locally

```bash
git clone https://github.com/gayakaci20/email-finder-web.git
cd email-finder-web

# Option A — open directly in a browser (file:// protocol)
open index.html

# Option B — serve over HTTP (recommended; enables Clipboard API)
npm install
npm start          # serves on http://localhost:3000
```

> **Note:** The Clipboard API requires a secure context (HTTPS or `localhost`). The app includes an `execCommand` fallback for `file://` usage, but serving via `npm start` is recommended.

---

## Project structure

```
email-finder-web/
├── index.html        — HTML shell & Tailwind CDN configuration
├── script.js         — All application logic (email generation, DOM, i18n, dark mode)
├── translations.js   — i18n strings (fr / en / es)
├── package.json      — Project metadata & dev scripts
├── .editorconfig     — Editor consistency settings
└── .prettierrc       — Prettier formatting config
```

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Markup | HTML5 | Semantic, accessible |
| Styling | Tailwind CSS (Play CDN) | Runtime JIT via CDN; suitable for this no-build project |
| Logic | Vanilla JavaScript (ES2020+) | No framework, no bundler |
| Fonts | Google Fonts — Poppins | Loaded from CDN |
| Deployment | Netlify | Auto-deploy from `main` branch |

---

## Known limitations / future improvements

- No build pipeline — Tailwind Play CDN is not version-pinned and not recommended for large production sites
- No automated tests — core logic functions (`generateEmailPatterns`, `normalizeAccentedChars`) are good candidates for unit tests with Vitest or Jest
- No TypeScript — JSDoc annotations would improve IDE support without adding a compile step

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Author

[Gaya KACI](https://github.com/gayakaci20)
