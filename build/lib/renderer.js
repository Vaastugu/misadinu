import { marked } from 'marked';
import { u, LANGUAGES, GRAMMAR_REFS } from './constants.js';

// ---------------------------------------------------------------------------
// marked config — allow raw HTML (for <span class="unresolved">)
// ---------------------------------------------------------------------------
marked.use({ breaks: false, gfm: true });

function md(text) {
  if (!text) return '';
  return marked.parse(text);
}

// ---------------------------------------------------------------------------
// CSS (inlined in every page)
// ---------------------------------------------------------------------------
const CSS = `
:root {
  --bg: #faf8f4;
  --bg-card: #ffffff;
  --text: #1a1410;
  --text-muted: #6b5e54;
  --accent: #7a3b1e;
  --accent-hover: #5e2d15;
  --accent-light: #c8714c;
  --border: #e0d8cf;
  --noun-bg: #dce9f7; --noun-fg: #1a4a8a;
  --verb-bg: #d8f0e4; --verb-fg: #1a6b3c;
  --adj-bg:  #fef0d8; --adj-fg:  #7a5200;
  --other-bg:#ebebeb;  --other-fg:#505050;
  --font-serif: 'Noto Serif', 'Times New Roman', Georgia, serif;
  --font-sans: 'Noto Sans', system-ui, -apple-system, sans-serif;
}
*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-serif);
  font-size: 1rem;
  line-height: 1.75;
  color: var(--text);
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; color: var(--accent-hover); }
.container { max-width: 860px; margin: 0 auto; padding: 0 1.5rem; width: 100%; }

/* ── Header ─────────────────────────────────────────────────────────────── */
header { background: var(--accent); color: white; padding: 0.9rem 0; }
header .container { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
.site-title { font-family: var(--font-serif); font-size: 1.15rem; font-weight: 700; color: white; white-space: nowrap; }
.site-title:hover { text-decoration: none; opacity: 0.9; }
nav { display: flex; gap: 0.2rem; flex-wrap: wrap; }
nav a { color: rgba(255,255,255,0.8); font-family: var(--font-sans); font-size: 0.85rem; padding: 0.2rem 0.6rem; border-radius: 3px; }
nav a:hover { color: white; background: rgba(255,255,255,0.15); text-decoration: none; }

/* ── Breadcrumb ──────────────────────────────────────────────────────────── */
.breadcrumb { font-family: var(--font-sans); font-size: 0.82rem; color: var(--text-muted); padding: 1rem 0 0.25rem; }
.breadcrumb a { color: var(--text-muted); }
.breadcrumb a:hover { color: var(--accent); }
.breadcrumb .sep { margin: 0 0.35rem; }

/* ── Main layout ─────────────────────────────────────────────────────────── */
main { flex: 1; padding: 0 0 4rem; }

/* ── Word page ───────────────────────────────────────────────────────────── */
.word-header { padding: 1.25rem 0 1rem; border-bottom: 2px solid var(--border); margin-bottom: 1.5rem; }
.word-title { font-size: 2.1rem; font-weight: 700; line-height: 1.2; }
.word-short { font-size: 1.1rem; color: var(--text-muted); margin-left: 0.4rem; font-weight: 400; }
.word-meta { font-family: var(--font-sans); font-size: 0.83rem; color: var(--text-muted); margin-top: 0.35rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

.badge {
  display: inline-block; font-family: var(--font-sans); font-size: 0.73rem;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  padding: 0.15em 0.55em; border-radius: 3px;
}
.badge-noun      { background: var(--noun-bg); color: var(--noun-fg); }
.badge-verb      { background: var(--verb-bg); color: var(--verb-fg); }
.badge-adjective { background: var(--adj-bg);  color: var(--adj-fg); }
.badge-other     { background: var(--other-bg); color: var(--other-fg); }

.entry-section { margin-bottom: 1.75rem; }
.entry-section:last-child { margin-bottom: 0; }

.section-label {
  font-family: var(--font-sans); font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted);
  margin-bottom: 0.45rem;
}

.etymology { color: var(--text-muted); }
.etymology p { margin-bottom: 0.3rem; }
.etymology p:last-child { margin-bottom: 0; }

.definitions ol { padding-left: 1.4rem; }
.definitions li { margin-bottom: 0.25rem; }
.definitions p { margin-bottom: 0.3rem; }

.word-type-heading {
  font-family: var(--font-sans); font-size: 0.9rem; font-weight: 600;
  color: var(--text-muted); margin-bottom: 0.5rem;
}

.unresolved { color: var(--text-muted); font-style: italic; }

/* ── Tables (declension, conjugation) ───────────────────────────────────── */
.table-wrap { overflow-x: auto; margin: 0.5rem 0; }
table { border-collapse: collapse; font-family: var(--font-sans); font-size: 0.88rem; min-width: 100%; }
thead th { background: var(--accent); color: white; padding: 0.4rem 0.75rem; text-align: left; font-weight: 600; }
tbody td { padding: 0.32rem 0.75rem; border-bottom: 1px solid var(--border); }
tbody tr:nth-child(even) td { background: #f3ede6; }
.declension-notes { font-family: var(--font-sans); font-size: 0.83rem; color: var(--text-muted); margin-bottom: 0.5rem; font-style: italic; }

/* ── Descendants & lists ─────────────────────────────────────────────────── */
.descendants p, .descendants li { margin-bottom: 0.2rem; }

/* ── Footer ─────────────────────────────────────────────────────────────── */
footer { font-family: var(--font-sans); font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1.5rem 0; border-top: 1px solid var(--border); margin-top: auto; }

/* ── Index pages ─────────────────────────────────────────────────────────── */
.page-title { font-size: 1.8rem; font-weight: 700; padding: 1.25rem 0 0.5rem; }
.page-subtitle { color: var(--text-muted); font-size: 1rem; margin-bottom: 1.5rem; font-family: var(--font-sans); }
.category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin: 1.5rem 0; }
.cat-card { background: white; border: 1px solid var(--border); border-radius: 6px; padding: 1rem 1.1rem; transition: border-color 0.15s; }
.cat-card:hover { border-color: var(--accent-light); text-decoration: none; }
.cat-card h3 { font-size: 1rem; color: var(--text); margin-bottom: 0.2rem; }
.cat-card .count { font-family: var(--font-sans); font-size: 0.8rem; color: var(--text-muted); }
.grammar-list { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0 1.5rem; }
.grammar-list li a { display: inline-block; background: white; border: 1px solid var(--border); border-radius: 4px; padding: 0.3rem 0.8rem; font-family: var(--font-sans); font-size: 0.85rem; }
.grammar-list li a:hover { border-color: var(--accent-light); text-decoration: none; }

.word-list { columns: 2; column-gap: 2rem; list-style: none; padding: 0; margin-top: 0.5rem; }
.word-list li { padding: 0.18rem 0; break-inside: avoid; }
.word-list .cat-tag { font-family: var(--font-sans); font-size: 0.75rem; color: var(--text-muted); margin-left: 0.35rem; }
@media (max-width: 540px) { .word-list { columns: 1; } }

/* ── Language grid (homepage) ───────────────────────────────────────────── */
.lang-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0 2rem; }
.lang-card { background: white; border: 1px solid var(--border); border-radius: 6px; padding: 1.2rem; display: block; transition: border-color 0.15s, box-shadow 0.15s; }
.lang-card:hover { border-color: var(--accent-light); box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; }
.lang-card h3 { font-size: 1.05rem; color: var(--text); margin-bottom: 0.2rem; }
.lang-card .sub { font-family: var(--font-sans); font-size: 0.8rem; color: var(--text-muted); }

/* ── Search ──────────────────────────────────────────────────────────────── */
.search-wrap { margin: 1.5rem 0 0.5rem; }
#search-input {
  width: 100%; font-family: var(--font-serif); font-size: 1.05rem;
  padding: 0.65rem 1rem; border: 2px solid var(--border); border-radius: 5px;
  background: white; color: var(--text); outline: none;
}
#search-input:focus { border-color: var(--accent-light); }
.diacritic-btns { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.5rem; }
.diacritic-btns button {
  font-family: var(--font-serif); font-size: 1rem;
  padding: 0.2rem 0.55rem; border: 1px solid var(--border);
  border-radius: 4px; background: white; color: var(--text);
  cursor: pointer; line-height: 1.4;
}
.diacritic-btns button:hover { background: var(--accent); color: white; border-color: var(--accent); }
#search-results { margin-top: 0.75rem; }
.result-item { padding: 0.65rem 0; border-bottom: 1px solid var(--border); }
.result-item:last-child { border-bottom: none; }
.result-item a { font-size: 1.05rem; }
.result-meta { font-family: var(--font-sans); font-size: 0.78rem; color: var(--text-muted); margin-top: 0.1rem; }
.result-def { font-size: 0.92rem; color: var(--text-muted); margin-top: 0.1rem; }
.no-results { font-family: var(--font-sans); font-size: 0.9rem; color: var(--text-muted); padding: 1rem 0; }

/* ── About/reference pages ───────────────────────────────────────────────── */
.prose { max-width: 720px; }
.prose h1,.prose h2,.prose h3 { margin: 1.5rem 0 0.5rem; }
.prose h1 { font-size: 1.6rem; }
.prose h2 { font-size: 1.25rem; }
.prose h3 { font-size: 1.05rem; }
.prose p { margin-bottom: 0.9rem; }
.prose ul,.prose ol { padding-left: 1.4rem; margin-bottom: 0.9rem; }
.prose li { margin-bottom: 0.2rem; }
.prose pre { background: #f3ede6; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.88rem; margin-bottom: 0.9rem; }
.prose code { background: #f3ede6; padding: 0.1em 0.35em; border-radius: 3px; font-size: 0.88em; }
.prose pre code { background: none; padding: 0; }
`;

// ---------------------------------------------------------------------------
// Client-side search JS (inlined on homepage only)
// ---------------------------------------------------------------------------
const SEARCH_JS = (baseUrl) => `
(async function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const BASE = '${baseUrl}';
  let index = null;

  async function loadIndex() {
    if (index) return true;
    try {
      const res = await fetch(BASE + '/search-index.json');
      if (!res.ok) throw new Error(res.status);
      index = await res.json();
      return true;
    } catch (e) {
      results.innerHTML = '<p class="no-results">Search index unavailable.</p>';
      return false;
    }
  }

  async function doSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    if (!await loadIndex()) return;

    const matches = index.filter(e =>
      e.word.toLowerCase().includes(q) ||
      (e.def && e.def.toLowerCase().includes(q))
    ).slice(0, 25);

    if (matches.length === 0) {
      results.innerHTML = '<p class="no-results">No results found.</p>';
      return;
    }

    results.innerHTML = matches.map(e => \`
      <div class="result-item">
        <a href="\${BASE}\${e.url}">\${e.word}</a>
        <div class="result-meta">\${e.lang} · \${e.cat} · \${e.wordType}</div>
        \${e.def ? \`<div class="result-def">\${e.def}</div>\` : ''}
      </div>
    \`).join('');
  }

  input.addEventListener('input', doSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Pre-load the index as soon as the page is idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadIndex);
  } else {
    setTimeout(loadIndex, 500);
  }
}());
`;

// ---------------------------------------------------------------------------
// Google Fonts link
// ---------------------------------------------------------------------------
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">`;

// ---------------------------------------------------------------------------
// Nav links
// ---------------------------------------------------------------------------
function navLinks() {
  const langs = Object.entries(LANGUAGES).map(([key, l]) =>
    `<a href="${u(`/${key}/`)}">${l.shortLabel}</a>`
  ).join('');
  return `
    <a href="${u('/')}">Home</a>
    ${langs}
    <a href="${u('/about/')}">About</a>
  `;
}

// ---------------------------------------------------------------------------
// Layout shell
// ---------------------------------------------------------------------------
export function layout({ title, content, breadcrumbs = [], extraHead = '' }) {
  const crumbHtml = breadcrumbs.length
    ? `<div class="breadcrumb container">${breadcrumbs.map((b, i) =>
        i < breadcrumbs.length - 1
          ? `<a href="${u(b.url)}">${b.label}</a><span class="sep">›</span>`
          : `<span>${b.label}</span>`
      ).join('')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Taṣṭinupuku Pinnaganyāḍi</title>
  ${FONTS}
  <style>${CSS}</style>
  ${extraHead}
</head>
<body>
<header>
  <div class="container">
    <a class="site-title" href="${u('/')}">Taṣṭinupuku Pinnaganyāḍi</a>
    <nav>${navLinks()}</nav>
  </div>
</header>
${crumbHtml}
<main>
  <div class="container">
    ${content}
  </div>
</main>
<footer>
  <div class="container">Taṣṭinupuku Pinnaganyāḍi · Vāstuguku Pinnaganyāḍi</div>
</footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Badge helper
// ---------------------------------------------------------------------------
function badge(wordType) {
  const cls = wordType
    ? wordType.toLowerCase() === 'noun' ? 'badge-noun'
    : wordType.toLowerCase() === 'verb' ? 'badge-verb'
    : wordType.toLowerCase() === 'adjective' ? 'badge-adjective'
    : 'badge-other'
    : 'badge-other';
  return `<span class="badge ${cls}">${wordType || 'Unknown'}</span>`;
}

// ---------------------------------------------------------------------------
// Word page
// ---------------------------------------------------------------------------
export function wordPage(parsed) {
  const { word, shortForm, langLabel, category, wordType,
          etymologies, wordSections, declension,
          descendants, adverbNote, agentiveSuffix, notes, extraSections } = parsed;

  const title = shortForm ? `${word} <span class="word-short">(${shortForm})</span>` : word;

  let html = `<div class="word-header">
  <h1 class="word-title">${title}</h1>
  <div class="word-meta">
    ${badge(wordType)}
    <span>${langLabel}</span>
    ${category !== 'Uncategorised' ? `<span>· ${category}</span>` : ''}
  </div>
</div>`;

  // Etymology / etymologies
  for (const etym of etymologies) {
    html += `<div class="entry-section">
  <div class="section-label">${etymologies.length > 1 ? etym.heading : 'Etymology'}</div>
  <div class="etymology">${md(etym.body)}</div>
</div>`;
  }

  // Word-type sections (definitions)
  for (const ws of wordSections) {
    html += `<div class="entry-section">
  <div class="section-label definitions">
    ${wordSections.length > 1 ? `<span class="word-type-heading">${ws.wordType}</span>` : ''}
    ${badge(ws.wordType)}
  </div>
  <div class="definitions">${md(ws.body)}</div>
</div>`;
  }

  // Declension table
  if (declension) {
    // Split notes from the table: lines before the first | are notes
    const lines = declension.body.split('\n');
    const tableStart = lines.findIndex(l => l.trim().startsWith('|'));
    const notes_d = tableStart > 0 ? lines.slice(0, tableStart).join('\n').trim() : '';
    const tableRaw = tableStart >= 0 ? lines.slice(tableStart).join('\n') : declension.body;
    html += `<div class="entry-section">
  <div class="section-label">Declension${declension.type !== 'Standard' ? ` (${declension.type})` : ''}</div>
  ${notes_d ? `<div class="declension-notes">${notes_d}</div>` : ''}
  <div class="table-wrap">${md(tableRaw)}</div>
</div>`;
  }

  // Descendants
  if (descendants) {
    html += `<div class="entry-section">
  <div class="section-label">Descendants</div>
  <div class="descendants">${md(descendants)}</div>
</div>`;
  }

  // Adverb note
  if (adverbNote) {
    html += `<div class="entry-section">
  <div class="section-label">Adverb form (−nā)</div>
  <div>${md(adverbNote)}</div>
</div>`;
  }

  // Agentive suffix
  if (agentiveSuffix) {
    html += `<div class="entry-section">
  <div class="section-label">${agentiveSuffix.heading}</div>
  <div>${md(agentiveSuffix.body)}</div>
</div>`;
  }

  // Notes
  if (notes) {
    html += `<div class="entry-section">
  <div class="section-label">Notes</div>
  <div>${md(notes)}</div>
</div>`;
  }

  // Extra sections
  for (const sec of extraSections) {
    if (!sec.body) continue;
    html += `<div class="entry-section">
  <div class="section-label">${sec.heading}</div>
  <div>${md(sec.body)}</div>
</div>`;
  }

  return layout({
    title: word,
    content: html,
    breadcrumbs: [
      { label: 'Home', url: '/' },
      { label: langLabel, url: `/${parsed.langKey}/` },
      ...(category !== 'Uncategorised'
        ? [{ label: category, url: `/${parsed.langKey}/${parsed.catSlug || category.toLowerCase()}/` }]
        : []),
      { label: word, url: parsed.urlPath },
    ],
  });
}

// ---------------------------------------------------------------------------
// Category index page
// ---------------------------------------------------------------------------
export function categoryPage(langKey, langLabel, category, entries) {
  const sorted = [...entries].sort((a, b) => a.word.localeCompare(b.word));
  const items = sorted.map(e =>
    `<li><a href="${u(e.urlPath)}">${e.word}</a></li>`
  ).join('\n');

  const content = `
<h1 class="page-title">${category}</h1>
<p class="page-subtitle">${langLabel} · ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</p>
<ul class="word-list">${items}</ul>`;

  const catSlug = entries[0]?.catSlug || category.toLowerCase();
  return layout({
    title: `${category} — ${langLabel}`,
    content,
    breadcrumbs: [
      { label: 'Home', url: '/' },
      { label: langLabel, url: `/${langKey}/` },
      { label: category, url: `/${langKey}/${catSlug}/` },
    ],
  });
}

// ---------------------------------------------------------------------------
// Language index page
// ---------------------------------------------------------------------------
export function languagePage(langKey, langLabel, entriesByCategory, totalCount) {
  const cats = Object.entries(entriesByCategory)
    .sort(([a], [b]) => a.localeCompare(b));

  const catCards = cats.map(([cat, entries]) => {
    const catSlug = entries[0]?.catSlug || cat.toLowerCase().replace(/\s+/g, '-');
    return `<a class="cat-card" href="${u(`/${langKey}/${catSlug}/`)}">
  <h3>${cat}</h3>
  <div class="count">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</div>
</a>`;
  }).join('\n');

  // Grammar reference links (SM only)
  const grammarHtml = langKey === 'sm' ? `
<h2 style="font-size:1rem;font-family:var(--font-sans);text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:.5rem">Grammar Reference</h2>
<ul class="grammar-list">
  ${GRAMMAR_REFS.map(r => `<li><a href="${u(r.urlPath)}">${r.title}</a></li>`).join('\n')}
</ul>` : '';

  // For flat (uncategorised) languages, show a word list directly
  const allEntries = Object.values(entriesByCategory).flat();
  const flatList = cats.length === 1 && cats[0][0] === 'Uncategorised'
    ? `<ul class="word-list">${
        [...allEntries].sort((a,b) => a.word.localeCompare(b.word))
          .map(e => `<li><a href="${u(e.urlPath)}">${e.word}</a></li>`).join('\n')
      }</ul>`
    : `<div class="category-grid">${catCards}</div>`;

  const content = `
<h1 class="page-title">${langLabel}</h1>
<p class="page-subtitle">${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}</p>
${grammarHtml}
${flatList}`;

  return layout({
    title: langLabel,
    content,
    breadcrumbs: [
      { label: 'Home', url: '/' },
      { label: langLabel, url: `/${langKey}/` },
    ],
  });
}

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------
export function homePage(langStats) {
  const cards = Object.entries(LANGUAGES).map(([key, l]) => {
    const count = langStats[key] || 0;
    return `<a class="lang-card" href="${u(`/${key}/`)}">
  <h3>${l.label}</h3>
  <div class="sub">${l.shortLabel} · ${count} entries</div>
</a>`;
  }).join('\n');

  const content = `
<h1 class="page-title" style="padding-top:1.5rem">Taṣṭinupuku Pinnaganyāḍi</h1>
<p class="page-subtitle">The Encyclopaedia of Languages · Vāstuguku Pinnaganyāḍi</p>

<div class="search-wrap">
  <input type="search" id="search-input" placeholder="Search words…" autocomplete="off" spellcheck="false">
  <div class="diacritic-btns" aria-label="Insert diacritic">
    ${['ē','ā','ō','ī','ū','ṣ','ṭ','ḷ','ḍ','ṇ'].map(c =>
      `<button type="button" onclick="(function(){var i=document.getElementById('search-input');i.value+=('${c}');i.dispatchEvent(new Event('input'));i.focus();})()">${c}</button>`
    ).join('')}
  </div>
</div>
<div id="search-results"></div>

<h2 style="font-size:1rem;font-family:var(--font-sans);text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin:2rem 0 0.5rem">Languages</h2>
<div class="lang-grid">${cards}</div>`;

  return layout({
    title: 'Taṣṭinupuku Pinnaganyāḍi',
    content,
    extraHead: `<script defer>${SEARCH_JS(u(''))}</script>`,
  });
}

// ---------------------------------------------------------------------------
// Generic reference / prose page (grammar refs, About)
// ---------------------------------------------------------------------------
export function prosePage({ title, rawMarkdown, breadcrumbs }) {
  const rendered = md(rawMarkdown);
  const content = `
<h1 class="page-title">${title}</h1>
<div class="prose table-wrap">${rendered}</div>`;

  return layout({ title, content, breadcrumbs });
}
