// Public-domain openings used to preview font pairings.
export const PASSAGES = [
  {
    id: 'ulysses',
    title: 'Ulysses',
    byline: 'James Joyce · 1922',
    text:
      'Stately, plump Buck Mulligan came from the stairhead, bearing a bowl of lather on which a mirror and a razor lay crossed. A yellow dressinggown, ungirdled, was sustained gently behind him on the mild morning air.',
  },
  {
    id: 'pride',
    title: 'Pride and Prejudice',
    byline: 'Jane Austen · 1813',
    text:
      'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.',
  },
  {
    id: 'moby',
    title: 'Moby-Dick',
    byline: 'Herman Melville · 1851',
    text:
      'Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.',
  },
] as const;

export type PassageId = (typeof PASSAGES)[number]['id'];
