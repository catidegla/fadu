/**
 * fadu
 *
 * The structural layer of Fa, the divination system of the Fon of Benin, and
 * of the Yoruba Ifa it shares its figures with. Figures, names, casting
 * mechanics and the relations between signs.
 *
 * There are no verses here and no readings. What a sign means belongs to a
 * diviner and to the tradition a caller is working in, not to a package.
 */

export {
  COLUMN_HEIGHT,
  COLUMN_STATES,
  DOUBLE,
  FIGURE_STATES,
  SINGLE,
  bitsToMarks,
  complementMarks,
  marksEqual,
  marksToBits,
  reverseMarks,
} from './marks.mjs';

export { DU, Du, du, normalise } from './du.mjs';
export {
  fromBits as duFromBits,
  fromMarks as duFromMarks,
  fromRank as duFromRank,
} from './du.mjs';

export {
  MEJI,
  SIGNS,
  Sign,
  fromBits as signFromBits,
  fromIndex as signFromIndex,
  fromMarks as signFromMarks,
  parse,
  sign,
} from './sign.mjs';

export {
  FIGURE_MARKS,
  OPELE_CONVENTIONS,
  castIkin,
  castOpele,
  readIkin,
  readOpele,
  secureRandom,
} from './cast.mjs';

export { displayWidth, drawCompact, drawFigure, padTo } from './render.mjs';
