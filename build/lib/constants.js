import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const VAULT_ROOT = path.resolve(__dirname, '../../');
export const TP_ROOT = path.join(VAULT_ROOT, 'Taṣṭinupuku Pinnaganyāḍi');
export const DIST_ROOT = path.join(VAULT_ROOT, 'dist');
export const BASE_URL = process.env.BASE_URL ?? '/misadinu';

/** Prefix every internal URL with the site base. */
export function u(p) {
  return `${BASE_URL}${p}`;
}

export const LANGUAGES = {
  sm: {
    label: 'Sōmyamu Mīsāḍinu',
    shortLabel: 'Classical',
    folder: 'Sōmyamu Mīsāḍinu',
    categorised: true,
    urlPrefix: '/sm',
  },
  old: {
    label: 'Pāta Mīsāḍinu',
    shortLabel: 'Old',
    folder: 'Pāta Mīsāḍinu',
    categorised: false,
    urlPrefix: '/old',
  },
  modern: {
    label: 'Mīsāḍinu (Modern)',
    shortLabel: 'Modern',
    folder: 'Mīsāḍinu (Modern)',
    categorised: false,
    urlPrefix: '/modern',
  },
  ancient: {
    label: 'Prānta Mīsāḍinu',
    shortLabel: 'Ancient',
    folder: 'Prānta Mīsāḍinu (Proto-Anc-2)',
    categorised: false,
    urlPrefix: '/ancient',
  },
};

// Grammar reference files to render as standalone pages (within SM folder)
export const GRAMMAR_REFS = [
  { file: 'Declensions.md',                         title: 'Declensions',           urlPath: '/sm/declensions/' },
  { file: 'Verb Conjugations.md',                   title: 'Verb Conjugations',     urlPath: '/sm/conjugations/' },
  { file: 'S. Mīsāḍinu - Postpositions.md',         title: 'Postpositions',         urlPath: '/sm/postpositions/' },
  { file: 'Adjectives/S. Mīsāḍinu - Rajyaḍu (Colours).md', title: 'Colours (Rājyaḍu)', urlPath: '/sm/colours/' },
  { file: 'Pronouns/S. Mīsāḍinu Pronouns.md',       title: 'Pronouns',              urlPath: '/sm/pronouns-ref/' },
  { file: 'Phrases (Taṣṭiyēvayānupu).md',           title: 'Phrases',               urlPath: '/sm/phrases/' },
];

// Filenames (without .md) to skip during word-entry collection
export const REFERENCE_FILES = new Set([
  'Declensions',
  'Verb Conjugations',
  'S. Mīsāḍinu - Postpositions',
  'S. Mīsāḍinu - Rajyaḍu (Colours)',
  'S. Mīsāḍinu Pronouns',
  'S. Mīsāḍinu - Rajyaḍu (Colours)',
  'Phrases (Taṣṭiyēvayānupu)',
  'Numbers (Campatapu)',
  'Untitled',
  'Untitled 1',
]);

export const WORD_TYPES = [
  'Noun', 'Verb', 'Adjective', 'Pronoun', 'Interrogative',
  'Adverb', 'Particle', 'Prefix', 'Suffix',
];
