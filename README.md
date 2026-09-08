<div align="center">

# fadu

**The sixteen dù, the 256 signs, and how a figure is cast.**

The structural layer of Fa and Ifá. No interpretation, no dependencies.

[![CI](https://github.com/catidegla/fadu/actions/workflows/ci.yml/badge.svg)](https://github.com/catidegla/fadu/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fadu?color=cb3837)](https://www.npmjs.com/package/fadu)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](package.json)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-339933)](package.json)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

```bash
npx fadu cast
```

```
  Loso Fu
  Ìrosùn Òfún

  │ │    │
   │     │
  │ │   │ │
   │    │ │

  1122|2121   mixed, index 79 of 255
  pods, in order: o o c c c o c o
```

## What this is

Fa is the divination system of the Fon of Benin. The Yoruba practise it as Ifá, and the two share their figures exactly. A figure is two columns of four positions, and each position carries either one stroke or two. Four positions give sixteen columns, and two columns give **256** signs.

This package is that structure and nothing else: the sixteen principal dù with their figures and their names in both languages, the 256 signs they compose, the two casting instruments, and the relations that hold between signs.

## What this is not

**There are no verses here, and no readings.** A sign comes back with its figure, its names and its structure. What it means is not in this package and will not be added to it.

That is a deliberate line. The interpretive corpus is enormous, it is held and taught differently by different lineages, and a good deal of it is knowledge that belongs to initiates. Compressing it into a JSON file would produce something both wrong and presumptuous. An application that has the standing to carry interpretation can carry it, keyed on the index or the name this package gives it.

## Install

```bash
npm install fadu
```

## Casting

The sixteen palm nuts, **ikin**, are worked in eight passes. The chain, **opele** in Yoruba and **agumaga** in Fon, carries eight pods on two arms and gives the whole figure in one throw. Either way the right column is produced first, so it comes first in every list of eight in this API.

```js
import { castOpele, castIkin } from 'fadu';

const { sign, faces } = castOpele();

sign.fon;      // 'Loso Fu'
sign.yoruba;   // 'Ìrosùn Òfún'
sign.index;    // 79
faces;         // ['open', 'open', 'closed', ...]
```

Casting draws from the platform CSPRNG rather than `Math.random`. Pass your own source to make a cast reproducible:

```js
castIkin({ random: seeded });
```

### Reading a cast that already happened

The more useful direction, when the throw is physical and the application is only recording it.

```js
import { readIkin, readOpele } from 'fadu';

// One nut left in the hand is a double stroke. Two nuts left is a single.
readIkin([2, 2, 2, 2, 1, 1, 1, 1]).fon;            // 'Gbé Yèku'
readOpele(['o','o','o','o','c','c','c','c']).fon;  // 'Gbé Yèku'
```

That ikin rule is inverted from what most people guess, and it is the most frequently miscopied detail in descriptions of the procedure. It is asserted in both directions in the test suite so it cannot drift.

A pass that leaves no nuts, or three, is not a result, and the pass is taken again. This library refuses it rather than inventing a figure nobody cast:

```js
readIkin([2, 2, 2, 2, 3, 1, 1, 1]);
// RangeError: pass 5 left 3 nuts, which is not a result. A pass leaves 1 or 2.
```

## Signs

```js
import { sign, parse, SIGNS, MEJI } from 'fadu';

sign('Gbé', 'Yèku').yoruba;   // 'Ogbè Ọ̀yẹ̀kú'   right column first
sign('Tula').fon;             // 'Tula Mèdji'    named once, so a doubling
parse('Oturupon Meji').index; // 187

SIGNS.length;                 // 256
MEJI.length;                  // 16
```

Names resolve in either language, with or without diacritics, with or without a doubling suffix, and across the spelling variants the sources actually use. `du('Wenlen')`, `du('Wlin')` and `du('Ọ̀wọ́nrín')` are the same figure.

### Structure

```js
const s = sign('Ka');

s.isMeji;        // true
s.right.marks;   // [2, 1, 2, 2]     top to bottom, 1 is one stroke
s.bits;          // 68               right column in the high nibble
s.rows();        // [[2,2],[1,1],[2,2],[2,2]]   as drawn, left column first

s.swap();        // the columns exchanged
s.reverse();     // both columns turned upside down
s.complement();  // every stroke count swapped
```

Each of those three relations is its own inverse. Applied to the sixteen dù they produce facts the test suite checks rather than describes: four dù read the same upside down and the other twelve pair off into six, and complementing pairs all sixteen into eight with nothing left fixed.

## The sixteen

Figures are written top to bottom, `1` for one stroke and `2` for two.

| # | Fon | Yoruba | Figure | | # | Fon | Yoruba | Figure |
| ---: | :--- | :--- | :--- | --- | ---: | :--- | :--- | :--- |
| 1 | Gbé | Ogbè | `1111` | | 9 | Guda | Ògúndá | `1112` |
| 2 | Yèku | Ọ̀yẹ̀kú | `2222` | | 10 | Sa | Ọ̀sá | `2111` |
| 3 | Woli | Ìwòrì | `2112` | | 11 | Ka | Ìká | `2122` |
| 4 | Di | Òdí | `1221` | | 12 | Trukpen | Òtúúrúpọ̀n | `2212` |
| 5 | Loso | Ìrosùn | `1122` | | 13 | Tula | Òtúrá | `1211` |
| 6 | Wlin | Ọ̀wọ́nrín | `2211` | | 14 | Lete | Ìrẹ̀tẹ̀ | `1121` |
| 7 | Abla | Ọ̀bàrà | `1222` | | 15 | Tché | Ọ̀ṣẹ́ | `1212` |
| 8 | Aklan | Ọ̀kànràn | `2221` | | 16 | Fu | Òfún | `2121` |

The sixteen figures are exactly the sixteen states of four binary positions, each appearing once. The test suite asserts that rather than trusting the table.

## The data on its own

`data/du.json` and `data/signs.json` are generated from the same source as the library, and CI fails if they drift from it. Use them from any language.

## Command line

```
fadu cast [--ikin|--opele]     cast a figure
fadu show <name...>            draw a sign by name, in either language
fadu list                      the sixteen principal dù
fadu read --ikin 2,1,1,2,...   read eight recorded ikin passes
fadu read --opele o,c,o,...    read one throw of the chain

--json        machine readable output
--ascii       draw with | instead of box characters
--convention  opele face mapping
```

## What is fixed, and what varies

Worth being plain about, because a library that flattened this would be misleading.

**Fixed.** Four positions to a column, sixteen columns, two columns to a figure, 256 figures. The right column is cast and read first. One nut left is a double stroke and two nuts left is a single.

**Varies by region and by lineage.** The order in which the sixteen are listed. The order used here is given by [fongbebenin.com](https://fongbebenin.com/vodoun/fa_village.html) for the Fon dù and by [ileifa.org](https://ileifa.org/16-principal-odu-of-ifa-sacred-corpus/) for the Yoruba odù, and those two agree position for position, but at least one published Beninese list moves Ka to eleventh. The Wikipedia table carries an editorial note saying the same thing. **`rank` here is a stable handle for indexing, not a claim about seniority**, and the seniority order of the 256 is not encoded at all.

Spellings vary too, which is why lookup is generous. Tché is also written She and Cè, Trukpen is also Trukpin, Wlin is also Wenlen.

**Varies, and left to the caller.** Which face of a pod means which stroke. Sources that describe the chain carefully often decline to fix it in print, so it is an option rather than a constant:

```js
readOpele(faces, { convention: 'open-double' });
```

Nothing structural rides on the choice. Switching it complements every sign and leaves the 256, and the distribution over them, exactly as they were. The test suite checks that across all 256.

## Sources

The figures are transcribed from the two tables in the Wikipedia article on [Ifá](https://en.wikipedia.org/wiki/If%C3%A1), which prints a Yoruba set and a West African Afa-du set and agrees with itself across both. The ikin procedure follows [Bascom's account](https://ileifa.org/opele-vs-ikin-ifa-divination-tools/) of eight passes and the remainder rule. That the right column is read first is stated by [oshaeifa.com](https://en.oshaeifa.com/odu-ifa/). Fon names and their order come from [fongbebenin.com](https://fongbebenin.com/vodoun/fa_village.html).

Two widely copied listings give Sa and Trukpen the other way round. They are wrong on their own terms: Guda reversed is Sa, and Ka reversed is Trukpen, and the swap breaks both relations. There is a test named after it.

## Testing

```bash
npm test    # 69 tests, nothing to install
```

The tests assert the combinatorics directly. That the sixteen dù cover every four-position state exactly once, that all 256 signs are distinct under name, index and figure, that every name parses back to the sign it came from in both languages, and that casting reaches all 256.

## License

[MIT](LICENSE)
