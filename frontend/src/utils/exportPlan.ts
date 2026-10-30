// ──────────────────────────────────────────────────────────────────────────────
// src/utils/exportPlan.ts
//
// Client-side export utilities for downloading a Plan as JSON or Markdown.
// No network round-trip — everything runs in the browser.
// ──────────────────────────────────────────────────────────────────────────────

import type { Plan } from '../types';

// ── Low-level download helper ─────────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── Sanitise filename ─────────────────────────────────────────────────────────

function toSlug(text: string, maxLen = 40): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, maxLen);
}

// ── Task 5a: Export as JSON ───────────────────────────────────────────────────

export function exportAsJSON(plan: Plan): void {
  const payload = {
    idea:         plan.idea,
    createdAt:    plan.createdAt,
    requirements: plan.requirements ?? null,
    schema:       plan.schema       ?? null,
    apis:         plan.apis         ?? null,
    sprintPlan:   plan.sprintPlan   ?? null,
  };
  const json     = JSON.stringify(payload, null, 2);
  const filename = `planify-${toSlug(plan.idea)}.json`;
  triggerDownload(json, filename, 'application/json');
}

// ── Task 5b: Export as Markdown ───────────────────────────────────────────────

export function exportAsMarkdown(plan: Plan): void {
  const lines: string[] = [];
  const created = plan.createdAt
    ? new Date(plan.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  lines.push(`# Product Plan: ${plan.idea}`);
  if (created) lines.push(`\n> Generated on ${created}`);
  lines.push('');

  // Requirements
  if (plan.requirements) {
    lines.push('## Requirements');
    lines.push('');
    lines.push('### Features');
    (plan.requirements.features ?? []).forEach((f) => lines.push(`- ${f}`));
    lines.push('');
    lines.push('### User Stories');
    (plan.requirements.userStories ?? []).forEach((s) => lines.push(`- ${s}`));
    lines.push('');
  }

  // Database Schema
  if (plan.schema?.tables?.length) {
    lines.push('## Database Schema');
    lines.push('');
    plan.schema.tables.forEach((table) => {
      lines.push(`### ${table.tableName}`);
      lines.push('');
      lines.push('| Field | Type | Description |');
      lines.push('|-------|------|-------------|');
      (table.fields ?? []).forEach((f) =>
        lines.push(`| \`${f.name}\` | \`${f.type}\` | ${f.description} |`),
      );
      lines.push('');
    });
  }

  // API Endpoints
  if (plan.apis?.endpoints?.length) {
    lines.push('## API Endpoints');
    lines.push('');
    lines.push('| Method | Endpoint | Description |');
    lines.push('|--------|----------|-------------|');
    plan.apis.endpoints.forEach((e) =>
      lines.push(`| \`${e.method}\` | \`${e.endpoint}\` | ${e.description} |`),
    );
    lines.push('');
  }

  // Sprint Plan
  if (plan.sprintPlan?.sprints?.length) {
    lines.push('## Sprint Plan');
    lines.push('');
    plan.sprintPlan.sprints.forEach((sprint) => {
      lines.push(`### ${sprint.sprintName} (${sprint.duration})`);
      lines.push('');
      (sprint.tasks ?? []).forEach((t) => lines.push(`- [ ] ${t}`));
      lines.push('');
    });
  }

  const md       = lines.join('\n');
  const filename = `planify-${toSlug(plan.idea)}.md`;
  triggerDownload(md, filename, 'text/markdown');
}
