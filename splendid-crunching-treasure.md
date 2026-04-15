# Plan: Vaasthugu Dictionary Discord Bot

## Context
The user has an Obsidian vault at `/home/saatvik/obs/vaasthugu` containing a constructed-world encyclopedia. The `Taṣṭinupuku Pinnaganyāḍi/` subtree is a dictionary for a fictional language family (Sōmyamu Mīsāḍinu, Pāta Mīsāḍinu, Modern Mīsāḍinu, Prānta Mīsāḍinu). Each word is a markdown `.md` file. The bot reads these files directly — no database needed.

## Bot Location
New directory: `/home/saatvik/obs/vaasthugu/bot/` (sibling to the vault content, but inside the repo so it's version-controlled together).

---

## Architecture

```
bot/
  package.json          — discord.js v14, dotenv
  .env.example          — DISCORD_TOKEN, CLIENT_ID, GUILD_ID
  src/
    index.js            — client setup, load commands, register slash commands on ready
    deploy-commands.js  — one-shot script to register slash commands with Discord API
    commands/
      query.js          — /query command: handler + autocomplete
    lib/
      constants.js      — vault root path, language folder map
      searcher.js       — file search logic (exact + partial, per-language)
      parser.js         — markdown → structured data
      formatter.js      — structured data → Discord MessageEmbed
```

---

## The `/query` Slash Command

**Options:**
| Option | Type | Required | Notes |
|--------|------|----------|-------|
| `word` | String | Yes | Supports autocomplete |
| `language` | Choice | No | Default: all |
| `exact` | Boolean | No | Default: false |

**Language choices:**
- `classical` → `Sōmyamu Mīsāḍinu/`
- `old` → `Pāta Mīsāḍinu/`
- `modern` → `Mīsāḍinu (Modern)/`
- `ancient` → `Prānta Mīsāḍinu (Proto-Anc-2)/`
- (omitted/all) → search all four

**Behaviour:**
- `exact: true` or autocomplete selection → parse file fully, return rich embed
- `exact: false` (default) + partial query → return embed listing all filename matches (up to 15), grouped by language
- Autocomplete: as user types, stream back up to 10 filename matches across selected language

---

## `constants.js`

```js
export const VAULT_ROOT = '/home/saatvik/obs/vaasthugu';
export const TP_ROOT = path.join(VAULT_ROOT, 'Taṣṭinupuku Pinnaganyāḍi');

export const LANGUAGES = {
  classical: { label: 'Sōmyamu Mīsāḍinu', folder: 'Sōmyamu Mīsāḍinu', categorised: true },
  old:       { label: 'Pāta Mīsāḍinu',    folder: 'Pāta Mīsāḍinu',    categorised: false },
  modern:    { label: 'Mīsāḍinu (Modern)', folder: 'Mīsāḍinu (Modern)', categorised: false },
  ancient:   { label: 'Prānta Mīsāḍinu',  folder: 'Prānta Mīsāḍinu (Proto-Anc-2)', categorised: false },
};

// Grammar reference files to exclude from word search
export const REFERENCE_FILES = new Set([
  'Declensions', 'Verb Conjugations', 'S. Mīsāḍinu - Postpositions',
  'S. Mīsāḍinu - Rajyaḍu (Colours)', 'S. Mīsāḍinu Pronouns',
  'Phrases (Taṣṭiyēvayānupu)', 'Numbers (Campatapu)', 'Untitled', 'Untitled 1',
]);
```

---

## `searcher.js`

**`getAllEntries(languageKey?)`** — walk the language folder(s), return array of `{ word, file, language, category }` objects. For categorised languages, record the subfolder as `category` (Nouns, Verbs, etc.). Cache result in memory (built once on first call, since the vault is static during a bot session).

**`searchEntries(query, languageKey?, exact?)`**
- `exact: true` → find entry where `word.toLowerCase() === query.toLowerCase()`
- `exact: false` → filter entries where `word.toLowerCase().includes(query.toLowerCase())`
- Returns array of matching entry objects

**Word extraction from filename:** `path.basename(file, '.md')` — this gives the display name including any parenthetical disambiguators (e.g. `āgeccu (āg)`).

---

## `parser.js`

**`parseEntry(filePath)`** → returns:
```js
{
  word: string,           // filename without .md
  language: string,       // language label
  category: string,       // Nouns / Verbs / Adjectives / etc. (or 'Unknown')
  etymology: string,      // content of ## Etymology section
  wordType: string,       // e.g. "Noun", "Verb", "Adjective"
  definitions: string[],  // numbered definition lines
  declension: string|null,// raw markdown table if present
  descendants: string|null,
  adverb: string|null,    // -nā form if present
  notes: string|null,
  shortForm: string|null, // extracted from parenthetical in filename e.g. "(āg)" → "āg"
  wikiLinks: string[],    // all [[...]] targets found in file
}
```

**Parsing approach:**
1. Read file, split into lines
2. Walk lines tracking current `##` / `###` / `####` section
3. Accumulate lines into section buckets
4. Strip/convert wiki-links with regex: `\[\[(?:[^\|\]]+\|)?([^\]]+)\]\]` → capture group 1 for display text
5. Declension table: if `####` section heading contains "Declension", keep raw lines (will be rendered as code block)
6. Short form: regex `/\(([^)]+)\)$/` on filename

---

## `formatter.js`

**`formatFullEntry(parsed)`** → `EmbedBuilder`:
- **Title:** word (with short form if present: `word (short)`)
- **Colour:** by word type — Noun: blue, Verb: green, Adjective: orange, other: grey
- **Footer:** `[Language] · [Category]`
- **Fields (in order):**
  1. Etymology (inline: false, truncated to 1024 chars)
  2. Word Type + Definitions (numbered list)
  3. Declension (if present — as code block, truncated at 1024)
  4. Descendants (if present)
  5. Adverb form (if present, inline)
  6. Notes (if present)
- Total embed kept under 6000 chars; truncate with "… (truncated)" if needed

**`formatSearchResults(entries, query)`** → `EmbedBuilder`:
- **Title:** `Search results for "${query}"`
- **Description:** grouped by language, numbered list of word names with category in parens
- If 0 results: "No matches found."
- If 1 result: call `formatFullEntry` directly

---

## `index.js`

```js
// On ready: register commands if GUILD_ID set (dev), else global
// On interactionCreate:
//   - isAutocomplete() → call searcher, return up to 10 matches
//   - isChatInputCommand('query') → run query handler
```

---

## `deploy-commands.js`

One-shot Node script (run manually with `node src/deploy-commands.js`) that registers the slash command definition with the Discord REST API. Separate from the main bot to avoid re-registering on every restart.

---

## Files to Create

| File | Purpose |
|------|---------|
| `bot/package.json` | deps: `discord.js@^14`, `dotenv` |
| `bot/.env.example` | `DISCORD_TOKEN=`, `CLIENT_ID=`, `GUILD_ID=` |
| `bot/src/index.js` | Entry point |
| `bot/src/deploy-commands.js` | One-shot command registration |
| `bot/src/commands/query.js` | /query handler + autocomplete |
| `bot/src/lib/constants.js` | Paths + language map |
| `bot/src/lib/searcher.js` | File search + caching |
| `bot/src/lib/parser.js` | Markdown → structured object |
| `bot/src/lib/formatter.js` | Structured object → Discord embed |

---

## Verification
1. `cd bot && npm install`
2. Copy `.env.example` → `.env`, fill in token/IDs
3. `node src/deploy-commands.js` — registers `/query` command
4. `node src/index.js` — starts bot
5. In Discord: `/query word:darr` → partial results list
6. `/query word:Darrayānu language:classical exact:true` → full embed with etymology, definitions, descendants
7. `/query word:div` with autocomplete → suggestions appear while typing
