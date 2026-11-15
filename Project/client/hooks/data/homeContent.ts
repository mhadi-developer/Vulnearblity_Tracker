"use client";

import type {
  Endpoint,
  Feature,
  Finding,
  NavLink,
  SeverityInfo,
  StatItem,
  WorkflowStep,
} from "../../types/common-types";

/* Sample content. Replace with real data from the API later. */

export const FOOTER_LINKS: NavLink[] = [
  { href: "/login", label: "Sign in" },
  { href: "/docs", label: "API docs" },
];

export const SEVERITIES: SeverityInfo[] = [
  { key: "critical", label: "Critical", count: 9, color: "var(--critical)" },
  { key: "high", label: "High", count: 31, color: "var(--high)" },
  { key: "medium", label: "Medium", count: 54, color: "var(--medium)" },
  { key: "low", label: "Low", count: 34, color: "var(--low)" },
];

export const SAMPLE_FINDINGS: Finding[] = [
  { id: "VT-1042", title: "Admin page reachable without login", sev: "critical", status: "In progress", owner: "Bilal" },
  { id: "VT-1038", title: "SQL injection in search endpoint", sev: "high", status: "Open", owner: "Hadi" },
  { id: "VT-1031", title: "Missing rate limit on login", sev: "medium", status: "Open", owner: "Ayesha" },
  { id: "VT-1027", title: "Verbose server version header", sev: "low", status: "Closed", owner: "Sana" },
];

export const STATS: StatItem[] = [
  { value: 128, suffix: "", label: "Findings tracked" },
  { value: 42, suffix: "", label: "Assets covered" },
  { value: 4, suffix: "", label: "Severity levels" },
  { value: 100, suffix: "%", label: "Findings with an owner" },
];

export const FEATURES: Feature[] = [
  { icon: "list", title: "Log every finding", text: "Record a title, description, severity and owner in seconds, so nothing lives in a chat thread.", grad: "gradient-brand" },
  { icon: "gauge", title: "Clear severity levels", text: "Critical, high, medium and low, shown with colour and a live summary of the risk picture.", grad: "gradient-critical" },
  { icon: "user", title: "One owner each", text: "Every finding is assigned to a person, so it is always clear who is responsible.", grad: "gradient-primary" },
  { icon: "flow", title: "Guided status workflow", text: "Open, in progress, resolved, closed. Only valid moves are offered, and the API enforces them.", grad: "gradient-brand" },
  { icon: "lock", title: "Secure by role", text: "Token login with admin and analyst roles. Only admins can delete findings.", grad: "gradient-primary" },
  { icon: "search", title: "Search and filter", text: "Find findings by text, severity, status or owner, and page through long lists.", grad: "gradient-brand" },
];

export const WORKFLOW: WorkflowStep[] = [
  { title: "Open", text: "A finding is logged with its severity and owner." },
  { title: "In progress", text: "The owner starts working on the fix." },
  { title: "Resolved", text: "The fix is applied and ready to be checked." },
  { title: "Closed", text: "The fix is confirmed. A closed finding can be reopened." },
];

export const ENDPOINTS: Endpoint[] = [
  { m: "post", path: "/auth/login", note: "Get an access token" },
  { m: "get", path: "/findings", note: "List with filters" },
  { m: "post", path: "/findings", note: "Create a finding" },
  { m: "patch", path: "/findings/{id}", note: "Update status or owner" },
  { m: "delete", path: "/findings/{id}", note: "Admin only" },
];

export const CODE_SAMPLE = `POST /findings
Authorization: Bearer <token>

{
  "title": "SQL injection in search",
  "severity": "high",
  "owner_id": 3
}

201 Created  ->  status: "open"`;

