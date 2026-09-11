// Rebuilds the tracker as a markdown file, matching the shape of the
// original notes document: a summary table on top, then one section per
// application.

import { resolveFacets, UNSPECIFIED } from '../data/taxonomy';
import { getAllFiles, formatBytes } from './fileStore';

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
      // Named, not linked — the file lives in this browser, not next to the
      // exported markdown.
      app.cv ? `**CV:** ${app.cv.name} (${formatBytes(app.cv.size)})` : null,
      app.coverLetter
        ? `**Cover letter:** ${app.coverLetter.name} (${formatBytes(app.coverLetter.size)})`
        : null,
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
// v1 backups were a bare array of records. v2 is an object that also carries
// the attachment blobs, base64'd, so a backup is still the one file you need
// to move to another machine. readBackup() accepts both.
// ---------------------------------------------------------------------------

export const BACKUP_FORMAT = 'vc-application-tracker';
export const BACKUP_VERSION = 2;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // readAsDataURL gives "data:<type>;base64,<payload>" — keep the payload.
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, type) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: type || 'application/octet-stream' });
}

// Only the files the records still point at — a backup should not carry
// blobs that nothing references.
export async function toJson(applications) {
  const wanted = new Set();
  applications.forEach((app) => {
    if (app.cv?.id) wanted.add(app.cv.id);
    if (app.coverLetter?.id) wanted.add(app.coverLetter.id);
  });

  let attachments = [];
  if (wanted.size > 0) {
    const stored = await getAllFiles();
    attachments = await Promise.all(
      stored
        .filter((entry) => wanted.has(entry.id))
        .map(async (entry) => ({
          id: entry.id,
          name: entry.name,
          type: entry.type,
          size: entry.size,
          addedAt: entry.addedAt,
          data: await blobToBase64(entry.blob),
        }))
    );
  }

  return JSON.stringify(
    {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      applications,
      attachments,
    },
    null,
    2
  );
}

// Returns { applications, attachments } or throws. attachments come back as
// store-shaped records ({ id, name, type, size, addedAt, blob }).
export function readBackup(raw) {
  const parsed = JSON.parse(raw);

  // v1: a bare array, no attachments.
  if (Array.isArray(parsed)) return { applications: parsed, attachments: [] };

  if (!parsed || !Array.isArray(parsed.applications)) {
    throw new Error('not a tracker backup');
  }

  const attachments = (parsed.attachments ?? [])
    .filter((entry) => entry && entry.id && typeof entry.data === 'string')
    .map((entry) => ({
      id: entry.id,
      name: entry.name ?? 'attachment',
      type: entry.type ?? 'application/octet-stream',
      size: entry.size ?? 0,
      addedAt: entry.addedAt ?? new Date().toISOString(),
      blob: base64ToBlob(entry.data, entry.type),
    }));

  return { applications: parsed.applications, attachments };
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
