// Preview lines, all in the public domain. One is picked per visit; viewers
// can choose another from the menu or shuffle.
export type QuoteGroup = 'Funny' | 'Significant' | 'Pangrams';
export type Quote = { text: string; source: string; group: QuoteGroup };

export const QUOTE_GROUPS: QuoteGroup[] = ['Funny', 'Significant', 'Pangrams'];

export const QUOTES: Quote[] = [
  // Funny
  { group: 'Funny', text: 'I can resist everything except temptation.', source: 'Oscar Wilde, Lady Windermere’s Fan (1892)' },
  {
    group: 'Funny',
    text: 'To lose one parent may be regarded as a misfortune; to lose both looks like carelessness.',
    source: 'Oscar Wilde, The Importance of Being Earnest (1895)',
  },
  {
    group: 'Funny',
    text: 'There is only one thing in the world worse than being talked about, and that is not being talked about.',
    source: 'Oscar Wilde, The Picture of Dorian Gray (1890)',
  },
  {
    group: 'Funny',
    text: 'I am so clever that sometimes I don’t understand a single word of what I am saying.',
    source: 'Oscar Wilde, The Remarkable Rocket (1888)',
  },
  {
    group: 'Funny',
    text: 'I like work: it fascinates me. I can sit and look at it for hours.',
    source: 'Jerome K. Jerome, Three Men in a Boat (1889)',
  },
  { group: 'Funny', text: 'The report of my death was an exaggeration.', source: 'Mark Twain (1897)' },
  {
    group: 'Funny',
    text: 'Sometimes I’ve believed as many as six impossible things before breakfast.',
    source: 'Lewis Carroll, Through the Looking-Glass (1871)',
  },
  { group: 'Funny', text: 'Curiouser and curiouser!', source: 'Lewis Carroll, Alice’s Adventures in Wonderland (1865)' },
  {
    group: 'Funny',
    text: 'I declare after all there is no enjoyment like reading!',
    source: 'Jane Austen, Pride and Prejudice (1813)',
  },

  // Significant
  {
    group: 'Significant',
    text: 'All human beings are born free and equal in dignity and rights.',
    source: 'Universal Declaration of Human Rights, Article 1 (1948)',
  },
  { group: 'Significant', text: 'Stately, plump Buck Mulligan came from the stairhead.', source: 'James Joyce, Ulysses (1922)' },
  {
    group: 'Significant',
    text: 'I will arise and go now, and go to Innisfree.',
    source: 'W. B. Yeats, The Lake Isle of Innisfree (1890)',
  },
  {
    group: 'Significant',
    text: 'We are all in the gutter, but some of us are looking at the stars.',
    source: 'Oscar Wilde, Lady Windermere’s Fan (1892)',
  },
  {
    group: 'Significant',
    text: 'It was the best of times, it was the worst of times.',
    source: 'Charles Dickens, A Tale of Two Cities (1859)',
  },

  // Pangrams: every letter of the alphabet
  { group: 'Pangrams', text: 'Sphinx of black quartz, judge my vow.', source: 'Pangram' },
  { group: 'Pangrams', text: 'Pack my box with five dozen liquor jugs.', source: 'Pangram' },
  { group: 'Pangrams', text: 'How vexingly quick daft zebras jump!', source: 'Pangram' },
  { group: 'Pangrams', text: 'The five boxing wizards jump quickly.', source: 'Pangram' },
  { group: 'Pangrams', text: 'Jackdaws love my big sphinx of quartz.', source: 'Pangram' },
  { group: 'Pangrams', text: 'The quick brown fox jumps over the lazy dog.', source: 'Pangram, the classic' },
];

export function randomQuote(except?: Quote) {
  const pool = except ? QUOTES.filter((q) => q !== except) : QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}
