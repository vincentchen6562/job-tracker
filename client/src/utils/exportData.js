// Rebuilds the tracker as a markdown file, matching the shape of the
// original notes document: a summary table on top, then one section per
// application.

import { PRIORITY_MAX } from '@job-tracker/shared';
import { resolveFacets, UNSPECIFIED } from '../data/taxonomy';

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim() || '—';
}

function stars(count) {
  const n = Number(count) || 0;
  return n > 0 ? '★'.repeat(n) + '☆'.repeat(Math.max(0, PRIORITY_MAX - n)) : '—';
}

export function toMarkdown(applications) {
  const lines = [];
  lines.push('# Vincent Chen — Job Application Tracker');
  lines.push('');
  lines.push('## Application tracker');
  lines.push('');
  lines.push('| Company | Role | Status | Priority | Date | Job posting | Summary |');
  lines.push('|---|---|---|---|---|---|---|');

  applications.forEach((app) => {
    const link = app.jobPostingUrl ? `[Link](${app.jobPostingUrl})` : '—';
    const jump = `[Jump to section](#${slug(app.company)})`;
    lines.push(
      `| ${cell(app.company)} | ${cell(app.role)} | ${cell(app.status)} | ${stars(app.priority)} | ${cell(app.date)} | ${link} | ${cell(app.summary)} ${jump} |`
    );
  });

  lines.push('');

  applications.forEach((app) => {
    lines.push('---');
    lines.push('');
    lines.push(`## ${app.company || 'Untitled'}`);
    lines.push('');
    const facets = resolveFacets(app);
    const locations = facets.locations.filter((l) => l !== UNSPECIFIED).join(', ');
    const meta = [
      app.role ? `**Role:** ${app.role}` : null,
      app.status ? `**Status:** ${app.status}` : null,
      app.priority ? `**Priority:** ${stars(app.priority)}` : null,
      app.date ? `**Date:** ${app.date}` : null,
      facets.category !== UNSPECIFIED ? `**Category:** ${facets.category}` : null,
      facets.roleType !== UNSPECIFIED ? `**Role type:** ${facets.roleType}` : null,
      locations ? `**Location:** ${locations}` : null,
      app.jobPostingUrl ? `**Posting:** ${app.jobPostingUrl}` : null,
    ].filter(Boolean);
    if (meta.length) {
      lines.push(meta.join('  \n'));
      lines.push('');
    }
    if (app.summary) {
      lines.push(app.summary);
      lines.push('');
    }
    if (app.details) {
      lines.push(app.details.trim());
      lines.push('');
    }
  });

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Backups
//
// New backups are version 3: the loaded applications, with no attachments
// (ADR-0009). Restoring sends the file to the server as it is, and the server
// reads older versions too.
// ---------------------------------------------------------------------------

const BACKUP_FORMAT = 'vc-application-tracker';
const BACKUP_VERSION = 3;

export function toJson(applications) {
  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      applications,
    },
    null,
    2
  );
}

export function downloadFile(filename, contents, mime) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
