// Usage examples and grouping for every Lamplight binding.
//
// These feed the per-component docs generate.mjs writes, which become the
// .prompt.md the Claude Design agent reads before it composes anything. They are
// ported from theme/index.html - the living styleguide - so the examples show
// Lamplight being used the way Lamplight is actually used, in its own voice.
// Placeholder content ("Item 1", "Lorem") would teach the agent the wrong register.

/** Groups for the structured parts in src/compound.js. */
export const compoundGroups = {
  Room: 'Foundations', FocalCatch: 'Foundations', Toggle: 'Forms', Check: 'Forms', Segmented: 'Forms',
  Field: 'Forms', Input: 'Forms', Select: 'Forms', Textarea: 'Forms',
  Menu: 'Navigation', Tabs: 'Navigation', Crumbs: 'Navigation', Disclosure: 'Navigation',
  Table: 'Data', KeyValue: 'Data', Status: 'Data',
  Dial: 'Instruments', ModeDial: 'Instruments', Gauge: 'Instruments', Runway: 'Instruments', Skeleton: 'Surfaces',
};

export const examples = {
  Etched: `<Etched>Reading room · one decision</Etched>`,

  LeadLine: `<LeadLine className="l-etched">Reading room · evidence</LeadLine>`,

  Thread: `<Thread state="live">
  <Knot kind="lead">Live · the current reading</Knot>
  <Knot state="live">Live · first source witnessed</Knot>
  <Knot>Second source witnessed</Knot>
</Thread>`,

  Knot: `<Thread>
  <Knot kind="lead">Evidence collected</Knot>
  <Knot>One source checked</Knot>
</Thread>`,

  Wire: `<Wire />
<Wire voice="live" />
<Wire voice="attention" />`,

  Room: `<Room style={{ padding: '2rem' }}>
  <Etched>Lamplight · reading room</Etched>
  <Panel depth="focal" sheen>
    <h4>One answer is waiting.</h4>
  </Panel>
</Room>`,

  FocalCatch: `<FocalCatch label="Current focus" state="active" stateText="Draft in progress">
  <h3>Shape the sustained working surface.</h3>
  <p>The project stays warm while this move owns the foreground.</p>
</FocalCatch>`,

  Panel: `<Panel depth="focal" sheen>
  <Etched>When you're ready</Etched>
  <h4>One answer is waiting.</h4>
  <p>Or it can wait. Nothing here is overdue.</p>
</Panel>`,

  Reading: `<Reading>
  The reading returned with one clear answer. Nothing else needs to become a
  task tonight.
</Reading>`,

  Note: `<Note>A persistent margin note is quieter than a toast and more trustworthy than a tooltip.</Note>`,

  Toast: `<Toast><Status>landed</Status><span>Filed to the notebook. It is safe.</span></Toast>
<Toast state="error">
  The house did not answer. Your note is still here; try again when you like.
</Toast>`,

  Chip: `<Chip>living reference</Chip>
<Chip state="live">source live</Chip>
<Chip state="attention">needs you</Chip>`,

  Status: `<Status state="loading">Looking for it</Status>
<Status state="settled">Landed in the notebook</Status>`,

  Actions: `<Actions>
  <Button kind="primary" sheen>Open it</Button>
  <Button kind="quiet">Tonight instead</Button>
  <Button kind="ghost">Not now</Button>
</Actions>`,

  Button: `<Button kind="primary" sheen>Open it</Button>
<Button kind="quiet">Tonight instead</Button>
<Button kind="ghost">Not now</Button>
<Button kind="danger">Delete draft</Button>
<Button kind="bezel">PLACE THIS</Button>`,

  Field: `<Field
  label="Capture"
  description="One line is enough."
  error="The note could not be kept. Your words are still here."
>
  <Input name="capture" placeholder="A passing thought" />
</Field>`,

  Input: `<Input id="ask-note" placeholder="One line is enough" />`,

  Select: `<Select id="shelf" defaultValue="Notebook">
  <option>Notebook</option>
  <option>Reading chair</option>
  <option>Let it rest</option>
</Select>`,

  Textarea: `<Textarea id="passage" placeholder="What is worth carrying forward?" />`,

  Ask: `<Ask>
  <Etched>Reading room · decidable ask</Etched>
  <h3>Does this belong in the room?</h3>
  <p>The question carries its own small verb set.</p>
  <Actions>
    <Button kind="primary" sheen>Approve</Button>
    <Button kind="quiet">Dismiss</Button>
  </Actions>
</Ask>`,

  Outcome: `<Outcome>Kept. It is in the notebook.</Outcome>`,

  Presence: `<Presence><Orb /></Presence>`,

  Orb: `<Presence><Orb /></Presence>

<Presence><Orb state="attention" /></Presence>`,

  Toggle: `<Toggle label="Quiet mode" defaultChecked />`,

  Check: `<Check defaultChecked>Keep quiet until morning</Check>`,

  Segmented: `<Segmented
  label="Room light"
  value="night"
  options={[
    { value: 'dawn', label: 'Dawn' },
    { value: 'day', label: 'Day' },
    { value: 'dusk', label: 'Dusk' },
    { value: 'night', label: 'Night' },
  ]}
/>`,

  Menu: `<Menu
  trigger="PLACE THIS ▾"
  open
  items={[
    { label: 'Keep in the notebook' },
    { label: 'Bring to the reading chair' },
    { label: 'Let it rest' },
  ]}
/>`,

  Tabs: `<Tabs
  label="Reading windows"
  tabs={[
    { id: 'reading', label: 'Reading', content: 'One lit passage with empty space intact.' },
    { id: 'notes', label: 'Notes', content: 'A few thoughts worth carrying forward.' },
    { id: 'sources', label: 'Sources', content: 'References stay close without crowding the page.' },
  ]}
/>`,

  Crumbs: `<Crumbs items={[
  { label: 'Library', href: '/' },
  { label: 'Notebook', href: '/notebook' },
  { label: 'Evening reading' },
]} />`,

  Disclosure: `<Disclosure summary="What is lit" open>
  One decision is ready. Everything else can wait without penalty.
</Disclosure>
<Disclosure summary="What is resting">
  Two explorations are dormant. Rest is state, not failure.
</Disclosure>`,

  Table: `<Table
  columns={['Source', 'Last witnessed', 'State', 'Reading']}
  rows={[
    ['Journal', '12:42', { value: 'live', live: true }, 'entry landed'],
    ['Notebook', '11:29', 'quiet', 'one note filed'],
    ['Library', 'now', { value: 'live', live: true }, 'room lit'],
  ]}
/>`,

  KeyValue: `<KeyValue items={[
  { term: 'Filed', value: 'Notebook · Evening reading' },
  { term: 'Witnessed', value: 'Friday evening' },
  { term: 'State', value: 'resting' },
]} />`,

  Dial: `<Dial turn={38} label="The day, one face" />`,

  ModeDial: `<ModeDial
  label="Reading lamp"
  options={[{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }]}
/>

<ModeDial
  label="Room light"
  defaultValue="night"
  options={[
    { value: 'dawn', label: 'Dawn' },
    { value: 'day', label: 'Day' },
    { value: 'dusk', label: 'Dusk' },
    { value: 'night', label: 'Night' },
  ]}
/>`,

  Gauge: `<Gauge value={18} min={10} max={30} valueText="18 degrees" live label="Room temperature" />
<Gauge value={24} min={10} max={30} valueText="24 degrees" reading="warming" live label="Room temperature" />
<Gauge value={29} min={10} max={30} valueText="29 degrees" reading="attention" live label="Room temperature" />`,

  Runway: `<Runway label="Winter" reading="turning" />
<Runway label="Reading chair" reading="thinning" nearness="near" />
<Runway label="Attention" reading="spent" nearness="now" />`,

  Skeleton: `<Skeleton lines={3} />`,
};
