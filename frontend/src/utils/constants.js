import { FileText, Database, Code2, CalendarDays } from 'lucide-react';

// ── Feature cards for the Landing page ──────────────────────────────────────
export const FEATURES = [
  {
    title: 'AI Requirements Generator',
    desc: 'Transform vague product ideas into detailed, structured requirements — including user stories, acceptance criteria, and edge cases.',
    Icon: FileText,
    iconBg: 'bg-orange-500',
    pastelBg: 'bg-[#FFF4EC]',
  },
  {
    title: 'Smart Schema Designer',
    desc: 'Automatically generate normalized database schemas with tables, relationships, and field types from your requirements.',
    Icon: Database,
    iconBg: 'bg-emerald-500',
    pastelBg: 'bg-[#ECFDF5]',
  },
  {
    title: 'API Blueprint Builder',
    desc: 'Generate comprehensive REST API specifications with endpoints, request/response schemas, and authentication flows.',
    Icon: Code2,
    iconBg: 'bg-violet-500',
    pastelBg: 'bg-[#F0EDFF]',
  },
  {
    title: 'Sprint Plan Architect',
    desc: 'Break down requirements into actionable sprints with prioritized tasks, story points, and realistic timelines.',
    Icon: CalendarDays,
    iconBg: 'bg-blue-500',
    pastelBg: 'bg-[#EFF6FF]',
  },
];

// ── Dashboard tab definitions ───────────────────────────────────────────────
export const DASHBOARD_TABS = [
  { id: 'requirements', label: 'Requirements', Icon: FileText,     iconBg: 'bg-orange-500' },
  { id: 'schema',       label: 'DB Schema',    Icon: Database,     iconBg: 'bg-emerald-500' },
  { id: 'apis',         label: 'API List',      Icon: Code2,       iconBg: 'bg-violet-500' },
  { id: 'sprint',       label: 'Sprint Plan',   Icon: CalendarDays, iconBg: 'bg-blue-500' },
];

// ── Generation steps (for IdeaInput progress) ───────────────────────────────
export const GENERATION_STEPS = [
  { label: 'Generating Requirements', Icon: FileText },
  { label: 'Designing Schema',        Icon: Database },
  { label: 'Building API Blueprint',  Icon: Code2 },
  { label: 'Planning Sprints',        Icon: CalendarDays },
];

// ── Stats data ──────────────────────────────────────────────────────────────
export const STATS = [
  { number: '3x',    label: 'Faster product planning' },
  { number: '60%',   label: 'Reduction in manual work' },
  { number: '99.9%', label: 'Reliable AI-powered outputs' },
];

// ── Pastel border color rotation for cards ──────────────────────────────────
export const CARD_BORDERS = [
  'border-l-orange-500',
  'border-l-emerald-500',
  'border-l-violet-500',
  'border-l-blue-500',
];

export const CARD_TOP_BORDERS = [
  'border-t-orange-500',
  'border-t-emerald-500',
  'border-t-violet-500',
  'border-t-blue-500',
];

// ── API method color mapping ────────────────────────────────────────────────
export const METHOD_COLORS = {
  GET:    'bg-emerald-50 text-emerald-600',
  POST:   'bg-blue-50 text-blue-600',
  PUT:    'bg-orange-50 text-orange-600',
  PATCH:  'bg-amber-50 text-amber-600',
  DELETE: 'bg-red-50 text-red-600',
};

// ── Sprint priority color mapping ───────────────────────────────────────────
export const PRIORITY_COLORS = {
  high:   'bg-red-50 text-red-600',
  medium: 'bg-orange-50 text-orange-600',
  med:    'bg-orange-50 text-orange-600',
  low:    'bg-emerald-50 text-emerald-600',
};
