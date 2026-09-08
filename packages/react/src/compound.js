import React from 'react';
import { h, cx } from './runtime.js';

/* Lamplight parts with real internal structure. Each mirrors the markup in
   ../../index.html, which is the living reference the CSS was written against.
   Structure here is not a choice - components.css selects on it. */

export function Room({ children, className, ...rest }) {
  return h('div', { ...rest, className: cx('l-room', className) }, children);
}

const focalStateText = { rest: 'Resting focus', active: 'Active work', attention: 'Needs you', settled: 'Settled' };

export function FocalCatch({ label = 'Current focus', state = 'rest', stateText, children, className, ...rest }) {
  return h('section', {
    ...rest, className: cx('l-focal-catch', className),
    'data-state': state === 'rest' ? undefined : state,
  },
    h('span', { className: 'l-focal-source', 'aria-hidden': 'true' }),
    h('div', { className: 'l-focal-subject' },
      h('div', { className: 'l-focal-heading' },
        h('p', { className: cx('l-etched', 'l-focal-label') }, label),
        h('span', { className: 'l-focal-state' }, stateText ?? focalStateText[state])),
      h('div', { className: 'l-focal-content' }, children)));
}

export function Toggle({ label, className, ...rest }) {
  return h('label', { className: cx('l-toggle', className) },
    label ? h('span', { className: 'l-etched' }, label) : null,
    h('input', { type: 'checkbox', ...rest }),
    h('span', { className: 'l-toggle-track' }));
}

export function Check({ children, className, ...rest }) {
  return h('label', { className: cx('l-check', className) },
    h('input', { type: 'checkbox', ...rest }),
    children);
}

export function Segmented({ options = [], value, onChange, label, className, ...rest }) {
  return h('div', { className: cx('l-segmented', className), role: 'group', 'aria-label': label, ...rest },
    options.map((o) => h('button', {
      key: o.value, type: 'button',
      'aria-pressed': String(o.value === value),
      onClick: onChange ? () => onChange(o.value) : undefined,
    }, o.label)));
}

function cleanId(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

function menuIndexForKey(key, current, length) {
  if (!length) return null;
  if (key === 'ArrowDown') return current < 0 ? 0 : (current + 1) % length;
  if (key === 'ArrowUp') return current < 0 ? length - 1 : (current - 1 + length) % length;
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  return null;
}

export function Menu({ trigger, items = [], open, defaultOpen = false, onOpenChange, className, ...rest }) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isOpen = open === undefined ? uncontrolled : open;
  const root = React.useRef(null);
  const triggerRef = React.useRef(null);
  const sheetRef = React.useRef(null);
  const pendingFocus = React.useRef(0);
  const instance = cleanId(React.useId());
  const triggerId = `lamp-menu-${instance}-trigger`;
  const sheetId = `lamp-menu-${instance}-sheet`;

  const requestOpen = React.useCallback((next, focus = 0) => {
    pendingFocus.current = focus;
    if (open === undefined) setUncontrolled(next);
    if (onOpenChange) onOpenChange(next);
  }, [onOpenChange, open]);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const menuItems = sheetRef.current?.querySelectorAll('[role="menuitem"]');
      if (!menuItems?.length) return;
      const requested = pendingFocus.current < 0 ? menuItems.length - 1 : pendingFocus.current;
      menuItems[Math.min(requested, menuItems.length - 1)]?.focus();
    });
    const closeAndRestore = () => {
      requestOpen(false);
      queueMicrotask(() => triggerRef.current?.focus());
    };
    const away = (e) => { if (root.current && !root.current.contains(e.target)) requestOpen(false); };
    const key = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeAndRestore();
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      active = false;
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [isOpen, requestOpen]);

  const moveMenuFocus = (event) => {
    const menuItems = [...(sheetRef.current?.querySelectorAll('[role="menuitem"]') ?? [])];
    const next = menuIndexForKey(event.key, menuItems.indexOf(document.activeElement), menuItems.length);
    if (next === null) return;
    event.preventDefault();
    menuItems[next].focus();
  };

  return h('div', { className: cx('l-menu', className), ref: root, ...rest },
    h('button', {
      className: 'l-menu-trigger', id: triggerId, ref: triggerRef, type: 'button',
      'aria-haspopup': 'menu', 'aria-expanded': String(isOpen), 'aria-controls': sheetId,
      onClick: () => requestOpen(!isOpen),
      onKeyDown: (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        requestOpen(true, event.key === 'ArrowUp' ? -1 : 0);
      },
    }, trigger === undefined ? 'PLACE THIS \u25BE' : trigger),
    h('div', {
      className: 'l-menu-sheet', role: 'menu', id: sheetId, ref: sheetRef,
      'aria-labelledby': triggerId, hidden: !isOpen, onKeyDown: moveMenuFocus,
    },
      items.map((it, i) => h('button', {
        key: i, type: 'button', role: 'menuitem', tabIndex: -1,
        onClick: () => {
          if (it.onSelect) it.onSelect();
          requestOpen(false);
          queueMicrotask(() => triggerRef.current?.focus());
        },
      }, it.label === undefined ? it : it.label))));
}

function tabIndexForKey(key, current, length) {
  if (!length) return null;
  if (key === 'ArrowRight') return (current + 1) % length;
  if (key === 'ArrowLeft') return (current - 1 + length) % length;
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  return null;
}

export function Tabs({ tabs = [], value, defaultValue, onChange, label, className, ...rest }) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? uncontrolled;
  const listRef = React.useRef(null);
  const carrierRef = React.useRef(null);
  const instance = cleanId(React.useId());
  const tabId = (index) => `lamp-tabs-${instance}-tab-${index}`;
  const panelId = (index) => `lamp-tabs-${instance}-panel-${index}`;

  // The carrier is the light being carried between windows, so its position has
  // to be measured, not guessed. components.css declares --carrier-x and
  // --carrier-width with fallbacks and expects someone to set them;
  // theme/styleguide.js does it for the styleguide's markup, and the binding
  // owns it here so Tabs works outside that page.
  React.useLayoutEffect(() => {
    const list = listRef.current;
    const carrier = carrierRef.current;
    if (!list || !carrier) return;
    const measure = () => {
      const tab = list.querySelector('[aria-selected="true"]');
      if (!tab) return;
      const listRect = list.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const x = tabRect.left - listRect.left + list.scrollLeft - list.clientLeft;
      const width = tabRect.width;
      carrier.style.setProperty('--carrier-x', x + 'px');
      carrier.style.setProperty('--carrier-width', width + 'px');
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    list.querySelectorAll('[role="tab"]').forEach((tab) => observer.observe(tab));
    return () => observer.disconnect();
  }, [active, tabs]);

  const select = (id) => {
    if (value === undefined) setUncontrolled(id);
    if (onChange) onChange(id);
  };

  return h('div', { className: cx('l-tabs', className), ...rest },
    h('div', { className: 'l-tablist', role: 'tablist', 'aria-label': label, ref: listRef },
      tabs.map((t, index) => h('button', {
        key: t.id, role: 'tab', id: tabId(index), type: 'button',
        'aria-selected': String(t.id === active),
        'aria-controls': panelId(index),
        tabIndex: t.id === active ? 0 : -1,
        onClick: () => select(t.id),
        onKeyDown: (event) => {
          const next = tabIndexForKey(event.key, index, tabs.length);
          if (next === null) return;
          event.preventDefault();
          select(tabs[next].id);
          listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
        },
      }, t.label)),
      h('span', { className: 'l-carrier', 'aria-hidden': 'true', ref: carrierRef })),
    tabs.map((t, index) => h('div', {
      key: t.id, role: 'tabpanel', id: panelId(index),
      'aria-labelledby': tabId(index), hidden: t.id !== active,
    }, t.content)));
}

const FieldContext = React.createContext(null);

function describedBy(explicit, field) {
  return [explicit, field?.descriptionId, field?.errorId].filter(Boolean).join(' ') || undefined;
}

function fieldControlProps(rest, field) {
  return {
    ...rest,
    id: field?.controlId ?? rest.id,
    'aria-describedby': describedBy(rest['aria-describedby'], field),
    'aria-invalid': field?.invalid ? true : rest['aria-invalid'],
  };
}

export function Field({ label, description, error, controlId, htmlFor, children, className, ...rest }) {
  const instance = cleanId(React.useId());
  const ownedControlId = controlId ?? htmlFor ?? `lamp-field-${instance}-control`;
  const context = {
    controlId: ownedControlId,
    descriptionId: description ? `${ownedControlId}-description` : undefined,
    errorId: error ? `${ownedControlId}-error` : undefined,
    invalid: Boolean(error),
  };
  return h(FieldContext.Provider, { value: context },
    h('label', {
      ...rest, className: cx('l-field', className), htmlFor: ownedControlId,
      'data-state': error ? 'error' : undefined,
    },
      label ? h('span', { className: 'l-field-label' }, label) : null,
      children,
      description ? h('span', { className: 'l-field-description', id: context.descriptionId }, description) : null,
      error ? h('span', { className: 'l-field-error', id: context.errorId }, error) : null));
}

export function Input({ className, ...rest }) {
  const field = React.useContext(FieldContext);
  return h('input', { ...fieldControlProps(rest, field), className: cx('l-input', className) });
}

export function Select({ children, className, ...rest }) {
  const field = React.useContext(FieldContext);
  return h('select', { ...fieldControlProps(rest, field), className: cx('l-select', className) }, children);
}

export function Textarea({ className, ...rest }) {
  const field = React.useContext(FieldContext);
  return h('textarea', { ...fieldControlProps(rest, field), className: cx('l-textarea', className) });
}

export function Status({ state, children, className, ...rest }) {
  return h('span', {
    ...rest, className: cx('l-status', className), role: 'status',
    'aria-live': 'polite', 'aria-atomic': 'true',
    'data-state': state,
  }, children);
}

export function Crumbs({ items = [], label = 'Breadcrumb', className, ...rest }) {
  return h('nav', { className: cx('l-crumbs', className), 'aria-label': label, ...rest },
    items.flatMap((it, i) => {
      const last = i === items.length - 1;
      const node = last
        ? h('span', { key: `c${i}`, 'aria-current': 'page' }, it.label ?? it)
        : h('a', { key: `c${i}`, href: it.href ?? '#' }, it.label ?? it);
      return last ? [node] : [node, h('span', { key: `s${i}`, className: 'l-seam', 'aria-hidden': 'true' })];
    }));
}

export function Disclosure({ summary, children, className, ...rest }) {
  return h('details', { className: cx('l-disclosure', className), ...rest },
    h('summary', null, h('span', { className: 'l-mark', 'aria-hidden': 'true' }), summary),
    h('div', { className: 'l-disclosure-body' }, children));
}

export function Table({ columns = [], rows = [], className, ...rest }) {
  return h('div', { className: 'l-table-wrap' },
    h('table', { className: cx('l-table', className), ...rest },
      h('thead', null, h('tr', null, columns.map((c, i) => h('th', { key: i }, c)))),
      h('tbody', null, rows.map((row, r) => h('tr', { key: r },
        row.map((cell, c) => {
          const live = cell && typeof cell === 'object' && cell.live;
          const value = cell && typeof cell === 'object' ? cell.value : cell;
          return h('td', { key: c, className: live ? 'is-live' : undefined }, value);
        }))))));
}

export function KeyValue({ items = [], className, ...rest }) {
  return h('dl', { className: cx('l-kv', className), ...rest },
    items.flatMap((it, i) => [
      h('dt', { key: `t${i}` }, it.term),
      h('dd', { key: `d${i}` }, it.value),
    ]));
}

export function Dial({ turn = 38, label, className, ...rest }) {
  return h('div', {
    className: cx('l-dial', className), role: 'img', 'aria-label': label, ...rest,
  },
    h('span', { className: 'l-hand', style: { '--dial-turn': `${turn}deg` } }),
    h('span', { className: 'l-hub' }));
}

// MODE_DIAL_RECONCILIATION_START
function resolveModeDialSelection(options, current, controlled) {
  const index = options.findIndex((option) => option.value === current);
  if (index >= 0) return { index, value: current, invalid: false };
  if (!controlled && options.length) return { index: 0, value: options[0].value, invalid: false };
  return { index: -1, value: undefined, invalid: controlled && options.length > 0 };
}
// MODE_DIAL_RECONCILIATION_END

export function ModeDial({
  options = [], value, defaultValue, onChange, label, unavailableText = 'Unavailable',
  disabled = false, busy = false, wrapperProps, className, ...rest
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? options[0]?.value);
  const readoutId = `lamp-mode-dial-${cleanId(React.useId())}-reading`;
  const controlled = value !== undefined;
  const current = controlled ? value : uncontrolled;
  const selection = resolveModeDialSelection(options, current, controlled);
  const index = selection.index;
  const unavailable = disabled || busy;

  React.useEffect(() => {
    if (!controlled && selection.value !== undefined && selection.value !== uncontrolled) {
      setUncontrolled(selection.value);
    }
  }, [controlled, selection.value, uncontrolled]);

  // The throw scales with the number of positions: a two-position switch gets a
  // short decisive travel, a five-position selector sweeps most of the face.
  const sweep = Math.min(240, Math.max(1, options.length - 1) * 60);
  const angleAt = (i) => (options.length < 2 ? 0 : -sweep / 2 + (sweep / (options.length - 1)) * i);

  const select = (i) => {
    if (unavailable || selection.invalid || options.length < 2) return;
    const next = options[(i + options.length) % options.length];
    if (!next) return;
    if (index >= 0 && next.value === current) return;
    if (!controlled) setUncontrolled(next.value);
    onChange?.(next.value);
  };

  if (!options.length) return null;

  const binary = options.length === 2;
  const single = options.length === 1;
  const wrap = (...children) => h('div', {
    ...wrapperProps,
    className: cx('l-mode-dial', wrapperProps?.className),
  }, ...children);
  const faceProps = {
    ...rest,
    className: cx('l-dial', className),
    'data-turnable': single || selection.invalid ? undefined : '',
    'data-selection-invalid': selection.invalid ? '' : undefined,
    'aria-label': label,
    'aria-describedby': [rest['aria-describedby'], readoutId].filter(Boolean).join(' '),
  };
  if (single) {
    return wrap(
      h('div', { ...faceProps, role: 'img', 'data-single': '' },
        h('span', { className: 'l-ticks' }, h('span', { className: 'l-tick', 'data-on': '' })),
        h('span', { className: 'l-hand', style: { '--dial-turn': '0deg' } }),
        h('span', { className: 'l-hub' })),
      h('p', { className: 'l-etched', id: readoutId }, options[0].label));
  }

  if (selection.invalid) {
    return wrap(
      h('div', {
        ...faceProps,
        role: 'img',
        'aria-invalid': 'true',
        'aria-busy': busy ? 'true' : undefined,
        'data-unavailable': '',
        onClick: undefined,
        onKeyDown: undefined,
      },
        h('span', { className: 'l-ticks' }, options.map((option, tickIndex) => h('span', {
          key: option.value,
          className: 'l-tick',
          style: { '--tick-turn': angleAt(tickIndex) + 'deg' },
        }))),
        h('span', { className: 'l-hand', style: { '--dial-turn': '0deg' } }),
        h('span', { className: 'l-hub' })),
      h('p', { className: 'l-etched', id: readoutId }, unavailableText));
  }

  const interactiveProps = binary ? {
    type: 'button',
    role: 'switch',
    disabled: unavailable,
    'aria-checked': String(index === 1),
  } : {
    role: 'slider',
    tabIndex: 0,
    'aria-disabled': unavailable ? 'true' : undefined,
    'aria-valuemin': 0,
    'aria-valuemax': options.length - 1,
    'aria-valuenow': index,
    'aria-valuetext': typeof options[index]?.label === 'string' ? options[index].label : undefined,
    'aria-orientation': 'horizontal',
  };

  return wrap(
    h(binary ? 'button' : 'div', {
      ...faceProps,
      ...interactiveProps,
      'aria-busy': busy ? 'true' : undefined,
      onClick: () => select(index + 1),
      onKeyDown: (e) => {
        if (binary) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); select(index + 1); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); select(index - 1); }
        else if (e.key === 'Home') { e.preventDefault(); select(0); }
        else if (e.key === 'End') { e.preventDefault(); select(options.length - 1); }
      },
    },
      h('span', { className: 'l-ticks' }, options.map((o, i) => h('span', {
        key: o.value, className: 'l-tick',
        style: { '--tick-turn': angleAt(i) + 'deg' },
        ...(i === index ? { 'data-on': '' } : {}),
      }))),
      h('span', { className: 'l-hand', style: { '--dial-turn': angleAt(index) + 'deg' } }),
      h('span', { className: 'l-hub' })),
    h('p', { className: 'l-etched', id: readoutId }, options[index]?.label));
}

export function Gauge({
  value = 0, min = 0, max = 1, valueText, reading = 'quiet',
  live = false, label, ticks = 9, className, ...rest
}) {
  const validRange = Number.isFinite(min) && Number.isFinite(max) && max > min;
  const safeMin = validRange ? min : 0;
  const safeMax = validRange ? max : 1;
  const validValue = Number.isFinite(value);
  const safeValue = validValue ? Math.min(safeMax, Math.max(safeMin, value)) : safeMin;
  const level = (safeValue - safeMin) / (safeMax - safeMin);
  const heat = ['quiet', 'warming', 'attention'].includes(reading) ? reading : 'quiet';
  const safeTicks = Number.isFinite(ticks) ? Math.min(101, Math.max(2, Math.floor(ticks))) : 9;
  const sweep = 240;
  const step = sweep / (safeTicks - 1);

  return h('div', {
    ...rest,
    className: cx('l-dial', className),
    'data-reading': heat,
    'data-live': live ? '' : undefined,
    'data-value-invalid': validValue ? undefined : '',
    'data-range-invalid': validRange ? undefined : '',
    role: 'meter',
    'aria-label': label,
    'aria-valuemin': safeMin,
    'aria-valuemax': safeMax,
    'aria-valuenow': safeValue,
    'aria-valuetext': valueText,
  },
    h('span', { className: 'l-ticks' }, Array.from({ length: safeTicks }, (_, i) => h('span', {
      key: i, className: 'l-tick',
      style: { '--tick-turn': (-sweep / 2 + step * i) + 'deg' },
      ...(i / (safeTicks - 1) <= level ? { 'data-on': '' } : {}),
    }))),
    h('span', { className: 'l-hand', style: { '--dial-turn': (-sweep / 2 + sweep * level) + 'deg' } }),
    h('span', { className: 'l-hub' }));
}

export function Runway({ label, reading, nearness = 'ample', className, ...rest }) {
  return h('div', {
    className: cx('l-runway', className),
    'data-nearness': nearness === 'ample' ? undefined : nearness, ...rest,
  },
    h('span', { className: 'l-flame' }),
    h('div', null,
      h('span', null, label),
      h('div', { className: 'l-track' }, h('div', { className: 'l-oil' }))),
    h('b', null, reading));
}

export function Skeleton({ lines = 3, className, ...rest }) {
  return h('div', { className: cx('l-skeleton', className), 'aria-hidden': 'true', ...rest },
    Array.from({ length: lines }, (_, i) => h('span', { key: i })));
}
