/**
 * Build the search-index.json payload from parsed entries.
 * Each entry is a lean object used by client-side search on the homepage.
 */
export function buildSearchIndex(parsedEntries) {
  return parsedEntries.map(p => ({
    word:     p.word,
    url:      p.urlPath,
    lang:     p.langLabel,
    langKey:  p.langKey,
    cat:      p.category,
    wordType: p.wordType,
    def:      p.firstDef || '',
  }));
}
