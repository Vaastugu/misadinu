import { readdirSync, statSync } from 'fs';
import path from 'path';
import { TP_ROOT, LANGUAGES, REFERENCE_FILES } from './constants.js';

/** Convert a display name to a URL-safe slug. */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');
}

/**
 * Recursively walk a language directory and collect word-entry metadata.
 * Returns an array of entry objects.
 */
function walkDir(dir, langKey, langObj, category) {
  const entries = [];
  let items;
  try {
    items = readdirSync(dir);
  } catch {
    return entries;
  }

  for (const item of items) {
    const fullPath = path.join(dir, item);
    let stat;
    try { stat = statSync(fullPath); } catch { continue; }

    if (stat.isDirectory()) {
      // For categorised languages (SM), recurse into subdirs using the dir name as category
      if (langObj.categorised) {
        entries.push(...walkDir(fullPath, langKey, langObj, item));
      }
    } else if (item.endsWith('.md')) {
      const word = path.basename(item, '.md');
      if (REFERENCE_FILES.has(word)) continue;

      const cat = category || null;
      const catSlug = cat ? slugify(cat) : null;
      const wordSlug = slugify(word);

      let urlPath;
      if (cat) {
        urlPath = `${langObj.urlPrefix}/${catSlug}/${wordSlug}/`;
      } else {
        urlPath = `${langObj.urlPrefix}/${wordSlug}/`;
      }

      entries.push({
        word,
        wordSlug,
        filePath: fullPath,
        langKey,
        langLabel: langObj.label,
        langShort: langObj.shortLabel,
        category: cat || 'Uncategorised',
        catSlug: catSlug || null,
        urlPath,
      });
    }
  }
  return entries;
}

/** Collect all word entries across all languages. */
export function getAllEntries() {
  const all = [];
  for (const [langKey, langObj] of Object.entries(LANGUAGES)) {
    const langDir = path.join(TP_ROOT, langObj.folder);
    all.push(...walkDir(langDir, langKey, langObj, null));
  }
  return all;
}

/**
 * Build a lookup map from normalised word name → urlPath.
 * Used by the parser/renderer to resolve [[wiki-links]].
 */
export function buildLookup(entries) {
  const map = new Map();
  for (const entry of entries) {
    // Key by exact word name (lowercase) and by slug
    map.set(entry.word.toLowerCase(), entry.urlPath);
    map.set(entry.wordSlug, entry.urlPath);
    // Also key by word without parenthetical disambiguator
    const bare = entry.word.replace(/\s*\([^)]*\)\s*$/, '').trim().toLowerCase();
    if (bare && !map.has(bare)) map.set(bare, entry.urlPath);
  }
  return map;
}
