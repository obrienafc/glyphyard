// Preview lines, all in the public domain. One is picked per visit.
export type Quote = { text: string; source: string };

export const QUOTES: Quote[] = [
  // Funny
  { text: 'I can resist everything except temptation.', source: 'Oscar Wilde, Lady Windermere’s Fan (1892)' },
  {
    text: 'To lose one parent may be regarded as a misfortune; to lose both looks like carelessness.',
    source: 'Oscar Wilde, The Importance of Being Earnest (1895)',
  },
  {
    text: 'I like work: it fascinates me. I can sit and look at it for hours.',
    source: 'Jerome K. Jerome, Three Men in a Boat (1889)',
  },
  { text: 'The report of my death was an exaggeration.', source: 'Mark Twain (1897)' },
  {
    text: 'Sometimes I’ve believed as many as six impossible things before breakfast.',
    source: 'Lewis Carroll, Through the Looking-Glass (1871)',
  },
  { text: 'I declare after all there is no enjoyment like reading!', source: 'Jane Austen, Pride and Prejudice (1813)' },
  // Significant
  {
    text: 'All human beings are born free and equal in dignity and rights.',
    source: 'Universal Declaration of Human Rights, Article 1 (1948)',
  },
  {
    text: 'Stately, plump Buck Mulligan came from the stairhead.',
    source: 'James Joyce, Ulysses (1922)',
  },
  { text: 'I will arise and go now, and go to Innisfree.', source: 'W. B. Yeats, The Lake Isle of Innisfree (1890)' },
  {
    text: 'We are all in the gutter, but some of us are looking at the stars.',
    source: 'Oscar Wilde, Lady Windermere’s Fan (1892)',
  },
  { text: 'It was the best of times, it was the worst of times.', source: 'Charles Dickens, A Tale of Two Cities (1859)' },
  // A pangram, for checking every letter
  { text: 'Sphinx of black quartz, judge my vow.', source: 'A pangram: every letter of the alphabet' },
];

export function randomQuote(except?: Quote) {
  const pool = except ? QUOTES.filter((q) => q !== except) : QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
}
