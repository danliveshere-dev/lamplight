import type * as React from 'react';

export interface RoomProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Night is the default. Use "day" for ink on parchment. */
  'data-mode'?: 'night' | 'day';
  /** Leave unset for Study. */
  'data-surface'?: 'ledger' | 'folio';
  children?: React.ReactNode;
}
/** The scoped Lamplight ground, ink and voice. Wrap the outermost Lamplight region in one; it does not restyle the host document or start optional motion. Import initLivingLight from lamplight-ui/living-light when the surface has earned pointer, dwell and press light. */
export declare function Room(props: RoomProps): React.ReactElement;

export interface FocalCatchProps extends React.HTMLAttributes<HTMLElement> {
  /** Visible language identifying the one foreground subject. Never rely on the caught edge alone. */
  label?: React.ReactNode;
  /** Truth caught by the material edge. The presence core remains candle-warm in every state. */
  state?: 'rest' | 'active' | 'attention' | 'settled';
  /** Visible state language. Defaults to Resting focus, Active work, Needs you or Settled. */
  stateText?: React.ReactNode;
  children?: React.ReactNode;
}
/** One warm presence source lending its pool and edge light to one foreground subject. Use at most once per Room or view. It is not a selected-card glow, a status badge or a replacement for keyboard focus. */
export declare function FocalCatch(props: FocalCatchProps): React.ReactElement;

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** The engraved caps label sitting beside the track. */
  label?: React.ReactNode;
  className?: string;
}
/** A settings switch on a sunken bezel track. The whole label is the hit target, so the 44px floor is met without extra padding. Checked lights the knob candle-white with its node glow. */
export declare function Toggle(props: ToggleProps): React.ReactElement;

export interface CheckProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** The line of text the box belongs to. */
  children?: React.ReactNode;
  className?: string;
}
/** A checkbox and its sentence, bound in one 44px row. Uses the native control with a tallow accent - a rebuilt box loses the keyboard and the phone. */
export declare function Check(props: CheckProps): React.ReactElement;

export interface SegmentedOption {
  value: string;
  label: React.ReactNode;
}
export interface SegmentedProps {
  options?: SegmentedOption[];
  /** The currently pressed option's value. */
  value?: string;
  onChange?: (value: string) => void;
  /** Accessible name for the group - segmented controls have no visible heading. */
  label?: string;
  className?: string;
}
/** A row of mounted alternatives where exactly one is pressed. The selected segment lifts onto the machined bezel face; the others stay muted. For choosing a register, not for actions. */
export declare function Segmented(props: SegmentedProps): React.ReactElement;

export interface MenuItem {
  label: React.ReactNode;
  onSelect?: () => void;
}
export interface MenuProps {
  /** The trigger's label. Mono caps by convention, with a ▾ to say it opens. */
  trigger?: React.ReactNode;
  items?: (MenuItem | string)[];
  /** Controlled open state. Leave unset and the trigger opens and closes the sheet itself, closing on Escape or a click away. */
  open?: boolean;
  /** Start opened when uncontrolled - use this to show the open state in a design. */
  defaultOpen?: boolean;
  /** Receives every requested open-state change, including Escape, click-away and item selection. Required to make a controlled Menu interactive. */
  onOpenChange?: (open: boolean) => void;
  className?: string;
}
/** A bezel trigger and the glass sheet it opens. Items are verbs about placement - where a thing goes - not a dumping ground for every action on the screen. */
export declare function Menu(props: MenuProps): React.ReactElement;

export interface TabDef {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
}
export interface TabsProps {
  tabs?: TabDef[];
  /** Controlled active tab id. Leave unset to let Tabs manage its own selection. */
  value?: string;
  /** Initial tab when uncontrolled. Defaults to the first tab. */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Accessible name for the tablist. */
  label?: string;
  className?: string;
}
/** Windows onto one companion, with the light carried between them. The lit carrier slides under the selected tab rather than the tab changing colour alone - movement is what says "you are here". */
export declare function Tabs(props: TabsProps): React.ReactElement;

export interface FieldProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'htmlFor'> {
  /** The visible label bound to the owned control. */
  label?: React.ReactNode;
  /** Persistent help copy included in the control's `aria-describedby` relationship. */
  description?: React.ReactNode;
  /** A genuine readable error. Adds `aria-invalid` and a stable description relationship. */
  error?: React.ReactNode;
  /** Stable id for the owned control. Generated when omitted. */
  controlId?: string;
  /** Legacy alias for `controlId`. */
  htmlFor?: string;
  children?: React.ReactNode;
}
/** A label, control and persistent description/error relationship. The Field owns accessible wiring so error meaning never depends on colour. */
export declare function Field(props: FieldProps): React.ReactElement;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
/** A single-line well. Inside a Field it inherits the owned id, description and invalid state unless explicitly overridden. */
export declare function Input(props: InputProps): React.ReactElement;

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
/** A native select in the Lamplight well, with Field relationships inherited when present. */
export declare function Select(props: SelectProps): React.ReactElement;

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
/** A multi-line well, vertically resizable, with Field relationships inherited when present. */
export declare function Textarea(props: TextareaProps): React.ReactElement;

export interface StatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Truthful lifecycle state. Loading is polite and busy; settled and error announce without inventing progress. */
  state?: 'loading' | 'settled' | 'error';
  children?: React.ReactNode;
}
/** A polite live region for truthful liveness and outcomes. Copy carries meaning; the lit node only supports it. */
export declare function Status(props: StatusProps): React.ReactElement;

export interface Crumb {
  label: React.ReactNode;
  href?: string;
}
export interface CrumbsProps {
  /** The trail, outermost first. The last entry is rendered as the current page. */
  items?: (Crumb | string)[];
  label?: string;
  className?: string;
}
/** The lit wayfinding trail. Seams between crumbs are warm wires, and the current page reads phosphor. The way in always leaves a way back. */
export declare function Crumbs(props: CrumbsProps): React.ReactElement;

export interface DisclosureProps extends React.DetailsHTMLAttributes<HTMLDetailsElement> {
  /** The always-visible line. */
  summary?: React.ReactNode;
  children?: React.ReactNode;
}
/** A native `<details>` with a lit cross that rotates to a dash when open. Native, so find-in-page and the keyboard keep working. */
export declare function Disclosure(props: DisclosureProps): React.ReactElement;

export type TableCell = React.ReactNode | { value: React.ReactNode; live?: boolean };
export interface TableProps {
  columns?: React.ReactNode[];
  /** Rows of cells. A cell given as `{value, live: true}` reads phosphor - use it only for data that is genuinely moving. */
  rows?: TableCell[][];
  className?: string;
}
/** The instrument register: dense evidence in mono with tabular numerals, an etched header rule, and hairline row seams. Scrolls inside its own wrapper rather than pushing the page wide. */
export declare function Table(props: TableProps): React.ReactElement;

export interface KeyValueItem {
  term: React.ReactNode;
  value: React.ReactNode;
}
export interface KeyValueProps {
  items?: KeyValueItem[];
  className?: string;
}
/** A definition list for facts about one thing. Terms are etched mono caps; values carry the reading. */
export declare function KeyValue(props: KeyValueProps): React.ReactElement;

export interface DialProps {
  /** Hand angle in degrees, clockwise from twelve. */
  turn?: number;
  /** Accessible label - a dial is an image, so it needs one. */
  label?: string;
  className?: string;
}
/** A machined face with a brass hand and a lit hub. Time is a place: distance around the face carries where the day sits, without counting anything down. */
export declare function Dial(props: DialProps): React.ReactElement;

export interface ModeDialOption {
  value: string;
  label: React.ReactNode;
}
export interface ModeDialProps extends Omit<React.HTMLAttributes<HTMLElement>,
  'children' | 'onChange' | 'onClick' | 'onKeyDown' | 'role' | 'aria-label' |
  'aria-checked' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow' |
  'aria-valuetext' | 'aria-orientation' | 'aria-busy' | 'aria-disabled' |
  'aria-invalid'> {
  /** The positions, in the order they sit around the face. */
  options?: ModeDialOption[];
  /** Controlled position. Leave unset and the dial keeps its own. */
  value?: string;
  /** Starting position when uncontrolled. Defaults to the first option. */
  defaultValue?: string;
  /** Reports a requested position synchronously. The consumer owns any asynchronous workflow. */
  onChange?: (value: string) => void;
  /** Accessible name for the control. The selected mode is named beneath the face. */
  label: string;
  /** Visible copy for a controlled value that is not present in `options`. */
  unavailableText?: React.ReactNode;
  disabled?: boolean;
  /** Consumer-owned busy state. It prevents another selection but does not manage a promise. */
  busy?: boolean;
  /** Props for the layout wrapper. All other DOM props, including `className`, `style` and `id`, belong to the dial face. */
  wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Applied to the dial face, not its layout wrapper. */
  className?: string;
}
/** An ordered mode selector with a physical dial treatment. Use it when the choice genuinely benefits from a small instrument face. Two positions use switch semantics; three or more use the ARIA slider pattern with arrow, Home and End keys. One position is shown as a reading, no positions render nothing, and an unknown controlled value renders an unavailable reading rather than inventing a selection. */
export declare function ModeDial(props: ModeDialProps): React.ReactElement | null;

export interface GaugeProps extends Omit<React.HTMLAttributes<HTMLDivElement>,
  'children' | 'role' | 'aria-label' | 'aria-valuemin' | 'aria-valuemax' |
  'aria-valuenow' | 'aria-valuetext'> {
  /** The current metric value. It is clamped to the finite `min` and `max` range. */
  value?: number;
  /** The finite lower bound. */
  min?: number;
  /** The finite upper bound. Must be greater than `min`. */
  max?: number;
  /** Caller-owned words for the reading, such as "Six of ten". Omit when the numeric value is sufficient. */
  valueText?: string;
  /** Visual temperature only. It does not infer importance from a high value. */
  reading?: 'quiet' | 'warming' | 'attention';
  /** Whether the needle is reading live data. A live needle is lit phosphor; a held or stale one stays brass. */
  live?: boolean;
  /** Accessible name - say what is being measured. */
  label: string;
  /** How many marks the scale carries. Normalised to a whole number from 2 to 101. */
  ticks?: number;
  className?: string;
}
/** A bounded reading instrument. The caller owns what the metric means, its accessible name and any value text; Gauge owns range normalisation and consistent meter ARIA. Visual temperature is explicit, so a high value is never treated as pressure by default. */
export declare function Gauge(props: GaugeProps): React.ReactElement;

export interface RunwayProps {
  /** What is running out - a season, a budget, a store. */
  label?: React.ReactNode;
  /** The reading in words, never a percentage. */
  reading?: React.ReactNode;
  /** How close the end is. Red is structurally absent from Lamplight: `now` is ember, not alarm. */
  nearness?: 'ample' | 'near' | 'now';
  className?: string;
}
/** A lamp's oil level: flame, track and reading. States nearness in words and colour temperature - ample phosphor, near dusk, now ember - so lateness never gets dressed as danger. */
export declare function Runway(props: RunwayProps): React.ReactElement;

export interface SkeletonProps {
  /** How many bars to show. */
  lines?: number;
  className?: string;
}
/** Dim bars warming up. No shimmer, no pulse: a loading state that fidgets is asking for attention it has not earned. */
export declare function Skeleton(props: SkeletonProps): React.ReactElement;
