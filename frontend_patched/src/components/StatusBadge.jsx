import React from 'react';

export default function StatusBadge({ status }) {
  const normalized = String(status || '').toLowerCase().replace(/\s+/g, '');
  
  let className = 'badge';
  if (normalized === 'onboarded') className += ' badge-onboarded';
  else if (normalized === 'inprogress') className += ' badge-inprogress';
  else if (normalized === 'offboarded') className += ' badge-offboarded';
  else if (normalized === 'rejected') className += ' badge-rejected';
  
  return <span className={className}>{status}</span>;
}
