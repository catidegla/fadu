/**
 * The sixteen principal du.
 *
 * The figures below are transcribed from the tables in the Wikipedia article
 * on Ifa, which prints both the Yoruba set and the West African "Afa-du" set
 * and agrees with itself across the two. Every figure is given top to bottom,
 * 1 for a single stroke and 2 for a double.
 *
 * The order is the one given by fongbebenin.com for the Fon du and by ileifa.org
 * for the Yoruba odu, which agree position for position. It is worth saying
 * plainly that ordering is not universal: lineages and regions differ, and at
 * least one published Beninese list moves Ka to the eleventh place. Rank here
 * is a stable handle for indexing, not a claim about seniority.
 *
 * Names carry diacritics because that is how they are written. Lookup strips
 * them, so `du('oyeku')` and `du('Oyeku')` both find the same figure.
 */

import {
  COLUMN_HEIGHT,
  COLUMN_STATES,
  bitsToMarks,
  complementMarks,
  marksEqual,
  marksToBits,
  reverseMarks,
} from './marks.mjs';

const TABLE = [
  { fon: 'Gbé',     yoruba: 'Ogbè',        marks: [1, 1, 1, 1], aliases: ['Djogbe', 'Eji Ogbe', 'Ejiogbe'] },
  { fon: 'Yèku',    yoruba: 'Ọ̀yẹ̀kú',       marks: [2, 2, 2, 2], aliases: [] },
  { fon: 'Woli',    yoruba: 'Ìwòrì',       marks: [2, 1, 1, 2], aliases: ['Wori'] },
  { fon: 'Di',      yoruba: 'Òdí',         marks: [1, 2, 2, 1], aliases: [] },
  { fon: 'Loso',    yoruba: 'Ìrosùn',      marks: [1, 1, 2, 2], aliases: ['Losso'] },
  { fon: 'Wlin',    yoruba: 'Ọ̀wọ́nrín',     marks: [2, 2, 1, 1], aliases: ['Wenlen', 'Owanrin'] },
  { fon: 'Abla',    yoruba: 'Ọ̀bàrà',       marks: [1, 2, 2, 2], aliases: [] },
  { fon: 'Aklan',   yoruba: 'Ọ̀kànràn',     marks: [2, 2, 2, 1], aliases: [] },
  { fon: 'Guda',    yoruba: 'Ògúndá',      marks: [1, 1, 1, 2], aliases: [] },
  { fon: 'Sa',      yoruba: 'Ọ̀sá',         marks: [2, 1, 1, 1], aliases: [] },
  { fon: 'Ka',      yoruba: 'Ìká',         marks: [2, 1, 2, 2], aliases: [] },
  { fon: 'Trukpen', yoruba: 'Òtúúrúpọ̀n',   marks: [2, 2, 1, 2], aliases: ['Trukpin', 'Oturupon', 'Otrupon'] },
  { fon: 'Tula',    yoruba: 'Òtúrá',       marks: [1, 2, 1, 1], aliases: [] },
  { fon: 'Lete',    yoruba: 'Ìrẹ̀tẹ̀',       marks: [1, 1, 2, 1], aliases: ['Lètè'] },
  { fon: 'Tché',    yoruba: 'Ọ̀ṣẹ́',         marks: [1, 2, 1, 2], aliases: ['Tche', 'She', 'Cè'] },
  { fon: 'Fu',      yoruba: 'Òfún',        marks: [2, 1, 2, 1], aliases: ['Orangun', 'Ọ̀ràngún'] },
];

/** Strip diacritics and punctuation so a name can be looked up as typed. */
export function normalise(name) {
  return String(name)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export class Du {
  constructor({ rank, fon, yoruba, marks, aliases }) {
    this.rank = rank;
    this.fon = fon;
    this.yoruba = yoruba;
    this.marks = Object.freeze([...marks]);
    this.bits = marksToBits(marks);
    this.aliases = Object.freeze([...aliases]);
    Object.freeze(this);
  }

  /** True when the figure reads the same top to bottom as bottom to top. */
  get isPalindrome() {
    return marksEqual(this.marks, reverseMarks(this.marks));
  }

  /** The figure turned upside down. */
  reverse() {
    return fromMarks(reverseMarks(this.marks));
  }

  /** The figure with every stroke count swapped. */
  complement() {
    return fromMarks(complementMarks(this.marks));
  }

  toString() {
    return this.fon;
  }

  toJSON() {
    return { rank: this.rank, fon: this.fon, yoruba: this.yoruba, marks: [...this.marks], bits: this.bits };
  }
}

/** The sixteen principal du, in the order documented above. */
export const DU = Object.freeze(
  TABLE.map((row, index) => new Du({ ...row, rank: index + 1 })),
);

const byBits = new Map(DU.map((figure) => [figure.bits, figure]));
const byName = new Map();

for (const figure of DU) {
  for (const name of [figure.fon, figure.yoruba, ...figure.aliases]) {
    const key = normalise(name);
    const clash = byName.get(key);

    // A name that resolves to two different figures would silently hand the
    // caller the wrong one, so it is a load time failure rather than a bug
    // someone hits in production.
    if (clash && clash.rank !== figure.rank) {
      throw new Error(`"${name}" resolves to both ${clash.fon} and ${figure.fon}`);
    }

    byName.set(key, figure);
  }
}

/** @param {number[]} marks four marks, top to bottom */
export function fromMarks(marks) {
  const figure = byBits.get(marksToBits(marks));
  if (!figure) throw new RangeError(`no du has the figure ${marks.join('')}`);
  return figure;
}

/** @param {number} bits a value in 0..15 */
export function fromBits(bits) {
  return fromMarks(bitsToMarks(bits));
}

/** @param {number} rank a value in 1..16 */
export function fromRank(rank) {
  const figure = DU[rank - 1];
  if (!figure) throw new RangeError(`rank must be in 1..${COLUMN_STATES}, received ${rank}`);
  return figure;
}

/**
 * Look a du up by any of its names, in either language, with or without
 * diacritics, with or without a doubling suffix.
 *
 * @param {string|number|Du} name
 */
export function du(name) {
  if (name instanceof Du) return name;
  if (typeof name === 'number') return fromRank(name);

  const key = normalise(name).replace(/(meji|medji|mejii)$/, '');
  const figure = byName.get(key) ?? byName.get(normalise(name));

  if (!figure) throw new RangeError(`unknown du "${name}"`);
  return figure;
}

export { COLUMN_HEIGHT, COLUMN_STATES };
