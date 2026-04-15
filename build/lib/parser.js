import { readFileSync } from 'fs';
import path from 'path';
import { WORD_TYPES } from './constants.js';

// ---------------------------------------------------------------------------
// Section splitting
// ---------------------------------------------------------------------------

function splitSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const m4 = line.match(/^####\s+(.*)/);
    const m3 = line.match(/^###\s+(.*)/);
    const m2 = line.match(/^##\s+(.*)/);
    const match = m4 || m3 || m2;

    if (match) {
      if (current) sections.push(current);
      current = {
        level: m4 ? 4 : m3 ? 3 : 2,
        heading: match[1].trim(),
        lines: [],
      };
    } else if (current) {
      current.lines.push(line);
    } else {
      // Content before any heading — create a root section
      if (!current) {
        current = { level: 0, heading: '', lines: [] };
      }
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function bodyOf(section) {
  return section.lines.join('\n').trim();
}

// ---------------------------------------------------------------------------
// Wiki-link resolution
// ---------------------------------------------------------------------------

/**
 * Replace [[target]] and [[path|display]] with markdown links or plain text.
 * lookup: Map<string, urlPath>
 */
export function resolveWikiLinks(text, lookup) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, inner) => {
    const pipeIdx = inner.indexOf('|');
    let target, display;
    if (pipeIdx !== -1) {
      target = inner.slice(0, pipeIdx).trim();
      display = inner.slice(pipeIdx + 1).trim();
    } else {
      target = inner.trim();
      display = target;
    }

    // Strip path prefix — use only the final segment as the lookup key
    const leafTarget = target.split('/').pop().trim();
    display = display.split('/').pop().trim();

    const url =
      lookup.get(leafTarget.toLowerCase()) ||
      lookup.get(leafTarget.toLowerCase().replace(/\s+/g, '-'));

    if (url) {
      return `[${display}](${url})`;
    }
    // Unresolved: render as styled span (will be kept as literal HTML in marked)
    return `<span class="unresolved">${display}</span>`;
  });
}

// ---------------------------------------------------------------------------
// First definition extraction (for search index)
// ---------------------------------------------------------------------------

export function firstDefinition(body) {
  const m = body.match(/^\d+\.\s*(.+)/m);
  return m ? m[1].trim() : body.split('\n').find(l => l.trim()) || '';
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a word-entry .md file into a structured object.
 *
 * @param {string} filePath
 * @param {string} langKey
 * @param {string} langLabel
 * @param {string} category
 * @param {Map}    lookup   – wiki-link resolution map (may be empty during first pass)
 */
export function parseEntry(filePath, langKey, langLabel, category, lookup = new Map()) {
  const raw = readFileSync(filePath, 'utf8');
  const filename = path.basename(filePath, '.md');

  // Short form from parenthetical, e.g. "āgeccu (āg)" → "āg"
  const shortFormMatch = filename.match(/\(([^)]+)\)$/);
  const shortForm = shortFormMatch ? shortFormMatch[1] : null;

  const sections = splitSections(raw);

  const result = {
    word: filename,
    shortForm,
    langKey,
    langLabel,
    category: category || 'Uncategorised',
    // Content sections (resolved after lookup is built)
    etymologies: [],   // [{ heading, body }]  — supports "Etymology 1", "Etymology 2"
    wordSections: [],  // [{ wordType, body }]
    declension: null,  // { type, body }
    descendants: null,
    adverbNote: null,
    agentiveSuffix: null,
    notes: null,
    extraSections: [],
  };

  for (const section of sections) {
    const h = section.heading;
    const body = resolveWikiLinks(bodyOf(section), lookup);

    // ── Level-2 and level-3 headings ────────────────────────────────────────

    if (section.level === 2 || section.level === 3) {
      // Etymology (including "Etymology 1", "Etymology 2", etc.)
      if (/^etymology/i.test(h)) {
        result.etymologies.push({ heading: h, body });
        continue;
      }

      // Word-type section
      const wt = WORD_TYPES.find(t => h.toLowerCase().startsWith(t.toLowerCase()));
      if (wt) {
        result.wordSections.push({ wordType: wt, body });
        continue;
      }

      // Descendants
      if (/^descendants/i.test(h)) {
        result.descendants = body;
        continue;
      }

      // Adverb note
      if (/^adverb/i.test(h)) {
        result.adverbNote = body;
        continue;
      }

      // Agentive suffix / "With ..." sections
      if (/^with\s/i.test(h)) {
        result.agentiveSuffix = { heading: h, body };
        continue;
      }

      // Notes
      if (/^notes?$/i.test(h)) {
        result.notes = body;
        continue;
      }

      // Anything else
      result.extraSections.push({ heading: h, body });
    }

    // ── Level-4 headings (typically declension tables) ───────────────────────

    if (section.level === 4) {
      const declMatch = h.match(/declension(?:\s*\(([^)]+)\))?/i);
      if (declMatch) {
        result.declension = { type: declMatch[1] || 'Standard', body };
      } else {
        result.extraSections.push({ heading: h, body });
      }
    }
  }

  // Primary word type (first detected)
  result.wordType = result.wordSections[0]?.wordType ?? 'Unknown';

  // First definition for search index
  result.firstDef = firstDefinition(result.wordSections[0]?.body ?? '');

  return result;
}
