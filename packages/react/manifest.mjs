// Lamplight design kit - the mechanical half of the binding layer.
//
// Every entry here is a Lamplight class family that is *purely* a class plus
// data-attributes on one element. generate.mjs turns each into a React binding
// and a typed props interface, and refuses to build if a class or data-attribute
// named here is absent from ../components.css. That check is the whole point:
// the kit cannot silently drift from the stylesheet it claims to bind.
//
// Parts with real internal structure (Tabs, Table, Dial...) are authored once in
// src/compound.js - a template can't honestly express them.

/** @typedef {{name:string, attr?:string, addClass?:string, type:string, doc:string}} PropDef */

export const simple = [
  {
    name: 'Etched', group: 'Foundations', tag: 'p', cls: 'l-etched',
    doc: 'The engraved caps label. Lamplight names a region in small letter-spaced capitals rather than a heading, so the eye finds structure without another voice entering the room.',
    props: [],
  },
  {
    name: 'LeadLine', group: 'Foundations', tag: 'div', cls: 'l-lead-line',
    doc: 'An internal straight rule marking a card or region. Combine it with Etched to name the region; it is distinct from the full-width Ledger lead.',
    props: [],
  },
  {
    name: 'Thread', group: 'Foundations', tag: 'div', cls: 'l-thread',
    doc: 'A quiet line connecting a sequence of proofs, steps or thoughts. Supply the meaning and any state words in the content.',
    props: [
      { name: 'state', attr: 'data-state', type: "'live'", doc: 'Adds the live treatment. Pair meaningful state with a visible word or shape.' },
    ],
  },
  {
    name: 'Knot', group: 'Foundations', tag: 'div', cls: 'l-knot',
    doc: 'A point on a Thread. A lead knot is semibold and does not add another dot.',
    props: [
      { name: 'kind', attr: 'data-kind', type: "'lead'", doc: 'Marks the lead content in a Thread without an extra dot.' },
      { name: 'state', attr: 'data-state', type: "'live'", doc: 'Adds the live treatment to this knot. Pair meaningful state with a visible word or shape.' },
    ],
  },
  {
    name: 'Wire', group: 'Foundations', tag: 'span', cls: 'l-wire',
    doc: 'A lit hairline: one pixel of colour plus its halo. Tron by candlelight. Structure glows warm; live data glows phosphor; something needing you glows ember. A wire is never decoration - it carries a job.',
    props: [
      { name: 'voice', attr: 'data-voice', type: "'live' | 'attention'", doc: "Which light the wire carries. Omit for the warm structural wire (the default); `live` for moving data; `attention` for something waiting on you." },
    ],
  },
  {
    name: 'Panel', group: 'Surfaces', tag: 'article', cls: 'l-panel',
    doc: 'Lamplit glass. Panels float on the dark - never opaque, never blurred by default. Depth is illumination, not shadow: the focal panel is the one lit thing on a surface, and there should only be one.',
    props: [
      { name: 'depth', attr: 'data-depth', type: "'focal'", doc: 'Marks this as the one lit thing on the surface. Use at most once per view.' },
      { name: 'sheen', addClass: 'l-sheen', type: 'boolean', doc: 'Let the moving light catch this surface. The sheen follows the cursor and gathers on dwell; it is revealed by light, never painted on at rest.' },
    ],
  },
  {
    name: 'Reading', group: 'Surfaces', tag: 'div', cls: 'l-reading',
    doc: 'The reading register: sunken ground, serif face, generous line height. For prose meant to be read rather than scanned - a returned answer, a passage, a letter.',
    props: [],
  },
  {
    name: 'Note', group: 'Surfaces', tag: 'p', cls: 'l-note',
    doc: "A margin note in lit ink. Quieter than a toast and more trustworthy than a tooltip, because it persists: the reader can come back to it.",
    props: [],
  },
  {
    name: 'Toast', group: 'Surfaces', tag: 'div', cls: 'l-toast',
    doc: 'A settled outcome, stated once. Lamplight toasts report what happened rather than demanding acknowledgement, and an error keeps the note the person wrote.',
    props: [
      { name: 'state', attr: 'data-state', type: "'error'", doc: 'Switches the rule and wash to danger. Genuine errors only - lateness is not an error.' },
    ],
  },
  {
    name: 'Chip', group: 'Data', tag: 'span', cls: 'l-chip',
    doc: 'A small mono tag carrying one word of state. Chips label; they do not act.',
    props: [
      { name: 'state', attr: 'data-state', type: "'live' | 'attention'", doc: 'Tints the chip phosphor for live data or ember for something waiting on you.' },
    ],
  },
  {
    name: 'Actions', group: 'Actions', tag: 'div', cls: 'l-actions',
    doc: 'The row a decision is made in. Wraps, stays generous under a finger, and keeps the quiet options on the same line as the loud one so declining never looks like failure.',
    props: [],
  },
  {
    name: 'Button', group: 'Actions', tag: 'button', cls: 'l-btn',
    doc: 'A mounted control. Buttons say what happens, in a verb. Danger is outlined and specific; it never borrows urgency from lateness.',
    defaultAttrs: { type: 'button' },
    props: [
      { name: 'kind', attr: 'data-kind', type: "'primary' | 'quiet' | 'ghost' | 'danger' | 'bezel'", doc: 'The action register. `primary` is the tallow fill, `quiet` the equal-weight alternative, `ghost` the way out, `danger` an outlined specific destruction, `bezel` the instrument-desk control.' },
      { name: 'sheen', addClass: 'l-sheen', type: 'boolean', doc: 'Let the passing light catch the control face.' },
    ],
  },
  {
    name: 'Ask', group: 'Instruments', tag: 'div', cls: 'l-ask',
    doc: 'A decidable ask: a question, its own small verb set, and room for a note back. If the decision is larger than its verbs, it points at a larger window rather than being flattened into this one.',
    props: [],
  },
  {
    name: 'Outcome', group: 'Instruments', tag: 'p', cls: 'l-outcome',
    doc: "The answer an Ask settles into, in italic serif green. It replaces the verbs rather than sitting beside them - once a thing is decided, the room stops asking. Belongs inside an Ask.",
    props: [],
  },
  {
    name: 'Presence', group: 'Instruments', tag: 'div', cls: 'l-presence',
    doc: "A field for a companion presence. It is mostly empty on purpose: the emptiness makes the one lit point read as company rather than a control.",
    props: [],
  },
  {
    name: 'Orb', group: 'Instruments', tag: 'span', cls: 'l-orb',
    doc: "A companion's body: a warm-white point with a breathing halo, about one cycle per ten seconds. It is company, not a status light. Never draw the literal lamp.",
    props: [
      { name: 'state', attr: 'data-state', type: "'attention'", doc: "Something is waiting on the person: the body and halo warm to ember. The breath does not change - attention is a change of light, never a change of behaviour." },
    ],
  },
];

/** Tier-3 component tokens that application code reads, not the stylesheet.
 *  Without this list the dangling-token check below would flag them forever;
 *  with it, anything else in tier 3 that nothing consumes is a real loose end. */
export const appFacingTokens = [
  '--lamp-list-cap',            // the calm-list cap, read by whatever builds the list
];
