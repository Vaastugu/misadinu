import { readFileSync } from 'fs';
import path from 'path';
import fse from 'fs-extra';

import { VAULT_ROOT, TP_ROOT, DIST_ROOT, GRAMMAR_REFS, u } from './lib/constants.js';
import { getAllEntries, buildLookup } from './lib/searcher.js';
import { parseEntry, resolveWikiLinks } from './lib/parser.js';
import {
  wordPage, categoryPage, languagePage, homePage, prosePage,
} from './lib/renderer.js';
import { buildSearchIndex } from './lib/search-index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function write(urlPath, html) {
  // urlPath is like "/sm/nouns/darrayanu/" — write to dist/sm/nouns/darrayanu/index.html
  const rel = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
  const dest = path.join(DIST_ROOT, rel, 'index.html');
  fse.outputFileSync(dest, html, 'utf8');
}

function log(msg) {
  process.stdout.write(msg + '\n');
}

// ---------------------------------------------------------------------------
// Main build
// ---------------------------------------------------------------------------

async function build() {
  const t0 = Date.now();
  log('🔨 Cleaning dist/…');
  fse.emptyDirSync(DIST_ROOT);

  // ── 1. Collect all entry metadata ───────────────────────────────────────
  log('📂 Collecting entries…');
  const entryMeta = getAllEntries();
  log(`   Found ${entryMeta.length} entries`);

  // ── 2. Build wiki-link lookup (word → URL) ───────────────────────────────
  const lookup = buildLookup(entryMeta);

  // ── 3. Parse every entry file ────────────────────────────────────────────
  log('📖 Parsing entries…');
  const parsed = entryMeta.map(meta =>
    Object.assign(
      parseEntry(meta.filePath, meta.langKey, meta.langLabel, meta.category, lookup),
      // Carry over slug fields from metadata that parser doesn't compute
      { urlPath: meta.urlPath, catSlug: meta.catSlug, wordSlug: meta.wordSlug }
    )
  );

  // ── 4. Render word pages ─────────────────────────────────────────────────
  log('✍️  Rendering word pages…');
  for (const p of parsed) {
    write(p.urlPath, wordPage(p));
  }
  log(`   Wrote ${parsed.length} word pages`);

  // ── 5. Category index pages (SM only — other langs are flat) ─────────────
  log('📋 Rendering category pages…');
  const byLangCat = {};
  for (const p of parsed) {
    const key = `${p.langKey}::${p.category}`;
    (byLangCat[key] = byLangCat[key] || []).push(p);
  }
  for (const [key, entries] of Object.entries(byLangCat)) {
    const [langKey, category] = key.split('::');
    if (category === 'Uncategorised') continue; // handled on lang page
    const catSlug = entries[0].catSlug;
    const langLabel = entries[0].langLabel;
    write(`/${langKey}/${catSlug}/`, categoryPage(langKey, langLabel, category, entries));
  }

  // ── 6. Language index pages ──────────────────────────────────────────────
  log('🗂️  Rendering language pages…');
  const byLang = {};
  for (const p of parsed) {
    (byLang[p.langKey] = byLang[p.langKey] || []).push(p);
  }
  for (const [langKey, entries] of Object.entries(byLang)) {
    const langLabel = entries[0].langLabel;
    // Group by category
    const byCat = {};
    for (const e of entries) {
      (byCat[e.category] = byCat[e.category] || []).push(e);
    }
    write(`/${langKey}/`, languagePage(langKey, langLabel, byCat, entries.length));
  }

  // ── 7. Grammar reference pages (SM) ─────────────────────────────────────
  log('📐 Rendering grammar reference pages…');
  const smFolder = path.join(TP_ROOT, 'Sōmyamu Mīsāḍinu');
  for (const ref of GRAMMAR_REFS) {
    const filePath = path.join(smFolder, ref.file);
    let raw;
    try {
      raw = readFileSync(filePath, 'utf8');
    } catch {
      log(`   ⚠️  Skipping missing grammar file: ${ref.file}`);
      continue;
    }
    const resolved = resolveWikiLinks(raw, lookup);
    const html = prosePage({
      title: ref.title,
      rawMarkdown: resolved,
      breadcrumbs: [
        { label: 'Home', url: '/' },
        { label: 'Sōmyamu Mīsāḍinu', url: '/sm/' },
        { label: ref.title, url: ref.urlPath },
      ],
    });
    write(ref.urlPath, html);
  }

  // ── 8. About page (README.md) ────────────────────────────────────────────
  log('📄 Rendering About page…');
  const readmePath = path.join(VAULT_ROOT, 'README.md');
  try {
    const readmeRaw = readFileSync(readmePath, 'utf8');
    const readmeResolved = resolveWikiLinks(readmeRaw, lookup);
    write('/about/', prosePage({
      title: 'About',
      rawMarkdown: readmeResolved,
      breadcrumbs: [
        { label: 'Home', url: '/' },
        { label: 'About', url: '/about/' },
      ],
    }));
  } catch {
    log('   ⚠️  README.md not found, skipping About page');
  }

  // ── 9. Homepage ──────────────────────────────────────────────────────────
  log('🏠 Rendering homepage…');
  const langStats = {};
  for (const p of parsed) {
    langStats[p.langKey] = (langStats[p.langKey] || 0) + 1;
  }
  write('/', homePage(langStats));

  // ── 10. Search index JSON ────────────────────────────────────────────────
  log('🔍 Writing search index…');
  const indexData = buildSearchIndex(parsed);
  fse.outputFileSync(
    path.join(DIST_ROOT, 'search-index.json'),
    JSON.stringify(indexData),
    'utf8'
  );

  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
  log(`\n✅ Built ${parsed.length} entries in ${elapsed}s → dist/`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
