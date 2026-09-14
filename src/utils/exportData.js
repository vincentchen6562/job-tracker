// Rebuilds the tracker as a markdown file, matching the shape of the
// original notes document: a summary table on top, then one section per
// application.

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
  return n > 0 ? '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)) : '—';
}

export function toMarkdown(applications) {
  const lines = [];
  lines.push('# Vincent Chen — Job Application Tracker');
  lines.push('');
  lines.push('## Application tracker');
  lines.push('');
  lines.push('| Company | Role | Status | Priority | Date | Job posting | Notes |');
  lines.push('|---|---|---|---|---|---|---|');

  applications.forEach((app) => {
    const link = app.jobPostingUrl ? `[Link](${app.jobPostingUrl})` : '—';
    const jump = `[Jump to section](#${slug(app.company)})`;
    lines.push(
      `| ${cell(app.company)} | ${cell(app.role)} | ${cell(app.status)} | ${stars(app.priority)} | ${cell(app.date)} | ${link} | ${cell(app.notes)} ${jump} |`
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
    if (app.notes) {
      lines.push(app.notes);
      lines.push('');
    }
    if (app.detail) {
      lines.push(app.detail.trim());
      lines.push('');
    }
  });

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Backups
//
// v1 backups were a bare array of applications. v2 is an object holding the
// applications and, from when the tracker had attachments, the files too.
// Attachments are gone (ADR-0009), so new backups carry applications only
// and readBackup() ignores any files an older backup holds.
// ---------------------------------------------------------------------------

export const BACKUP_FORMAT = 'vc-application-tracker';
export const BACKUP_VERSION = 2;

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

// Returns the backup's applications as stored in the file, or throws.
export function readBackup(raw) {
  const parsed = JSON.parse(raw);
  const applications = Array.isArray(parsed) ? parsed : parsed?.applications;

  if (!Array.isArray(applications)) {
    throw new Error('not a tracker backup');
  }

  return applications.filter((item) => item && typeof item === 'object');
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
