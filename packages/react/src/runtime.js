import React from 'react';
export const h = React.createElement;
export function cx(...parts) {
  const out = parts.filter(Boolean).join(' ');
  return out || undefined;
}
