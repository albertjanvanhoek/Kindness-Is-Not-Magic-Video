# Style Bible

The look is taken from the record-sleeve style reference,
[`docs/reference/style-reference.jpg`](reference/style-reference.jpg): a 1960s children's
record cover. Picture it as a gentle studio photograph printed on cream card stock.

The quality bar is [mexicat/pdoom-video](https://github.com/mexicat/pdoom-video):
we borrow its craft (crisp type, controlled colour, texture, beat-synced motion), not its content
or its dark palette.

## Tone

Warm, tactile, sincere, a little nostalgic. It is precise without feeling cold.

It should feel like a children's picture book or record sleeve made for adults:
honest materials (paint, paper, cloth, yarn), soft studio light, nothing glossy or digital.

## Balance

- **70 % lyrics.** The words are the hero of every frame: big, readable, synced per word.
- **30 % background.** A living, painted world behind the words: texture, light and the
  thread motif. It supports the words and never competes with them.

## Palette

Sampled from the reference. Source of truth: `PALETTE` in `app/src/look.ts`.

| name | hex | role |
|---|---|---|
| greenDeep | `#303d24` | darkest backdrop shadows, letterbox |
| greenDark | `#42653e` | backdrop base |
| green | `#597247` | backdrop mid |
| greenLight | `#708254` | backdrop highlights |
| sage | `#808760` | brush-stroke accents |
| cream | `#f6e6c0` | sung words, main type |
| paper | `#f2ddb2` | sleeve border, unsung words, labels |
| gold | `#e2b24f` | the word being sung; the signal colour |
| honey | `#cba565` | warm secondary (bears, yarn) |
| burlap | `#b0946b` | the ground |
| brown | `#634522` | warm shadows |
| ink | `#3a2614` | type outline and drop shadow |

Rules:

- No hues outside this table. There is no blue, no purple and no pure black or white.
- Gold is the signal: it marks the word being sung and moments of connection. Keep it rare.
- Shadows are warm brown or deep green, never grey.

## Typography

- **Display: Fraunces** (variable; `SOFT 100`, `WONK 1`, optical size 144, weight 850–900).
  A soft, slightly wonky vintage serif, close to the sleeve title.
  - It is used for all lyrics and the title.
  - Every display word has a dark **ink outline** (≈ 0.05 em) and a **printed drop shadow**
    offset down and to the right, like the sleeve lettering.
- **Labels: Jost** 500/700, uppercase and tracked, like "PRODUCED BY EMERGENCE". It is used
  for small annotations only.
- Fonts ship with the app (`@fontsource`), so renders look the same everywhere. Never rely on
  system fonts.
- Karaoke colours:
  - unsung: paper, dimmed;
  - being sung: gold;
  - sung: cream.
- Keep lyrics inside the title-safe area. Emphasise one key word per line, not several.

## Texture and light

- **Backdrop:** hand-painted mottled green, with large soft patches, smaller dabs and
  directional brush strokes. It drifts very slowly.
- **Light:** one soft studio light behind the subject, brighter at the centre and falling off
  to the corners.
- **Ground:** a burlap strip at the bottom of the frame, with a soft contact shadow at the seam.
- **Print finish:** gentle vignette and visible film/print grain over everything, type included.
- **Sleeve:** the cream paper border appears only at the bookends: the title card at the start
  and at the end. The first and last frames match.

## Motion

- Big changes land on the beat. Small motions breathe with the music.
- Movement is soft and physical, like felt and yarn: ease in and out, slight overshoot,
  nothing robotic or glitchy.
- The backdrop moves slowly enough that you notice it only over several seconds.

## The thread (the 30 %)

One continuous thread is the central motif, drawn as soft **yarn**: warm cream or honey, with
visible twist and thickness. It is never a hairline vector line.

It can become:

- path;
- bridge;
- waveform;
- line of communication;
- stitched repair (a visible scar);
- network edge;
- family relation;
- structural support.

People are points: felt buttons, knots or small soft discs. Avoid illustrated characters.

## Avoid

- hearts, halos and glowing hands;
- stock footage of smiling people, sentimental family montage;
- generic AI imagery, neon, cyberpunk and particle nebulae;
- cold digital effects: lens flares, chromatic glitches, hard bloom;
- visual effects without semantic purpose.

Beauty should come from material, warmth, timing and discovery.
