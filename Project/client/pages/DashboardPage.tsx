"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import "../styles/global-theme.css"; // your global glass theme (adjust the path if needed)
import "../styles/dashboard-page.css";

/* =========================================================
   Types and rules
   ========================================================= */

type Severity = "critical" | "high" | "medium" | "low";
type Status = "open" | "in_progress" | "resolved" | "closed";
type Role = "admin" | "analyst";

interface User { id: number; name: string; email: string; role: Role }
interface Finding {
  id: number;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  owner_id: number;
}

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const STATUSES: Status[] = ["open", "in_progress", "resolved", "closed"];
const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
/** The only status moves allowed */
const NEXT_STATUS: Record<Status, Status[]> = {
  open: ["in_progress", "closed"],
  in_progress: ["resolved", "open"],
  resolved: ["closed", "in_progress"],
  closed: ["open"],
};

/* =========================================================
   MOCK DATA (replace with API calls later)
   ========================================================= */

const MOCK_USERS: User[] = [
  { id: 1, name: "Ayesha Khan", email: "ayesha@example.com", role: "admin" },
  { id: 2, name: "Bilal Ahmed", email: "bilal@example.com", role: "analyst" },
  { id: 3, name: "Hadi", email: "hadi@example.com", role: "analyst" },
  { id: 4, name: "Sana Malik", email: "sana@example.com", role: "analyst" },
];

const MOCK_FINDINGS: Finding[] = [
  { id: 1, title: "Admin page reachable without login", description: "The /admin route responds 200 with no token.", severity: "critical", status: "in_progress", owner_id: 2 },
  { id: 2, title: "Remote code execution in logging library", description: "Log4Shell style payload accepted by the app server.", severity: "critical", status: "open", owner_id: 3 },
  { id: 3, title: "SQL injection in search endpoint", description: "The q parameter is concatenated into a query.", severity: "high", status: "open", owner_id: 3 },
  { id: 4, title: "Secret committed in an old branch", description: "An API key was found in the git history.", severity: "high", status: "in_progress", owner_id: 2 },
  { id: 5, title: "Heap overflow in image library", description: "Outdated image decoder on the build runner.", severity: "high", status: "open", owner_id: 1 },
  { id: 6, title: "Missing rate limit on login", description: "No lockout after repeated failed attempts.", severity: "medium", status: "open", owner_id: 1 },
  { id: 7, title: "Outdated TLS configuration", description: "TLS 1.0 is still enabled on the mail gateway.", severity: "medium", status: "resolved", owner_id: 4 },
  { id: 8, title: "Weak password policy", description: "Passwords of 4 characters are accepted.", severity: "medium", status: "open", owner_id: 4 },
  { id: 9, title: "Cross-site scripting in comments", description: "Comment text is rendered without escaping.", severity: "medium", status: "in_progress", owner_id: 2 },
  { id: 10, title: "Missing security headers", description: "No CSP or X-Frame-Options on the portal.", severity: "medium", status: "closed", owner_id: 1 },
  { id: 11, title: "Verbose server version header", description: "The Server header exposes the exact version.", severity: "low", status: "closed", owner_id: 3 },
  { id: 12, title: "Directory listing enabled", description: "The /static folder lists its files.", severity: "low", status: "open", owner_id: 4 },
  { id: 13, title: "Cookie missing SameSite flag", description: "The session cookie has no SameSite attribute.", severity: "low", status: "resolved", owner_id: 2 },
  { id: 14, title: "Debug endpoint left enabled", description: "The /debug/info route returns environment details.", severity: "high", status: "resolved", owner_id: 1 },
];

/* =========================================================
   Helpers
   ========================================================= */

const PAGE_SIZE = 6;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

/* Damped spring so the counters settle with a small bounce */
const Z = 0.6;
const W = 13;
const WD = W * Math.sqrt(1 - Z * Z);
const spring = (t: number): number =>
  t >= 1 ? 1 : 1 - Math.exp(-Z * W * t) * (Math.cos(WD * t) + ((Z * W) / WD) * Math.sin(WD * t));

function useCountUp(target: number): number {
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setValue(target);
      return undefined;
    }
    const start = current.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - t0) / 700, 1);
      const v = Math.round(start + (target - start) * spring(t));
      current.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
}

/* =========================================================
   Summary tile
   ========================================================= */

function Tile({ label, count, total, tone }: { label: string; count: number; total: number; tone: string }) {
  const shown = useCountUp(count);
  const share = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`dash__tile glass glass-panel dash__tile--${tone}`}>
      <span className="dash__tile-label">{label}</span>
      <strong className="dash__tile-count">{shown}</strong>
      <div className="dash__meter" aria-hidden="true">
        <i style={{ width: `${share}%` }} />
      </div>
      <span className="dash__tile-share">{share}% of all findings</span>
    </div>
  );
}

/* =========================================================
   New / Edit finding dialog
   ========================================================= */

interface DialogProps {
  open: boolean;
  finding: Finding | null; // null means a new finding
  users: User[];
  onClose: () => void;
  onSave: (id: number | null, data: Omit<Finding, "id" | "status"> & { status?: Status }) => void;
}

function FindingDialog({ open, finding, users, onClose, onSave }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [ownerId, setOwnerId] = useState(users[0]?.id ?? 0);
  const [status, setStatus] = useState<Status>("open");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTitle(finding?.title ?? "");
    setDescription(finding?.description ?? "");
    setSeverity(finding?.severity ?? "medium");
    setOwnerId(finding?.owner_id ?? users[0]?.id ?? 0);
    setStatus(finding?.status ?? "open");
    setErrors({});
  }, [open, finding, users]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const t = title.trim();
    const next = {
      title: t.length < 5 || t.length > 120 ? "Title must be between 5 and 120 characters." : undefined,
      description: description.length > 2000 ? "Description can be at most 2000 characters." : undefined,
    };
    setErrors(next);
    if (next.title || next.description) return;
    onSave(finding?.id ?? null, {
      title: t,
      description: description.trim(),
      severity,
      owner_id: ownerId,
      status: finding ? status : undefined,
    });
  }

  const statusChoices: Status[] = finding ? [finding.status, ...NEXT_STATUS[finding.status]] : [];

  return (
    <dialog
      ref={ref}
      className="dash__dlg"
      aria-labelledby="dash-dlg-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form className="dash__dlg-card glass-modal" onSubmit={handleSubmit} noValidate>
        <h2 id="dash-dlg-title">{finding ? "Edit finding" : "New finding"}</h2>

        <div className={`dash__field ${errors.title ? "has-error" : ""}`}>
          <label htmlFor="dash-f-title">Title</label>
          <input
            id="dash-f-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="5 to 120 characters"
            aria-invalid={errors.title ? true : undefined}
          />
          {errors.title && <p className="dash__error" role="alert">{errors.title}</p>}
        </div>

        <div className={`dash__field ${errors.description ? "has-error" : ""}`}>
          <label htmlFor="dash-f-desc">Description</label>
          <textarea
            id="dash-f-desc"
            className="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was found and where"
          />
          {errors.description && <p className="dash__error" role="alert">{errors.description}</p>}
        </div>

        <div className="dash__field-row">
          <div className="dash__field">
            <label htmlFor="dash-f-sev">Severity</label>
            <select id="dash-f-sev" className="select" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
            </select>
          </div>
          <div className="dash__field">
            <label htmlFor="dash-f-owner">Owner</label>
            <select id="dash-f-owner" className="select" value={ownerId} onChange={(e) => setOwnerId(Number(e.target.value))}>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        {finding && (
          <div className="dash__field">
            <label htmlFor="dash-f-status">Status</label>
            <select id="dash-f-status" className="select" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {statusChoices.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <p className="dash__hint">Only the moves allowed by the workflow are listed.</p>
          </div>
        )}

        <div className="dash__dlg-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">Save finding</button>
        </div>
      </form>
    </dialog>
  );
}

/* =========================================================
   Dashboard page
   ========================================================= */

export default function DashboardPage() {
  const [items, setItems] = useState<Finding[]>(MOCK_FINDINGS);
  const [role, setRole] = useState<Role>("admin"); // lets you try admin and analyst views
  const nextId = useRef(100);

  const [q, setQ] = useState("");
  const [sev, setSev] = useState<"" | Severity>("");
  const [status, setStatus] = useState<"" | Status>("");
  const [owner, setOwner] = useState<number | null>(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Finding | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string; kind: "success" | "error" } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // The signed-in mock user: the admin is Ayesha, the analyst is Bilal
  const me = MOCK_USERS.find((u) => u.id === (role === "admin" ? 1 : 2)) as User;
  const isAdmin = role === "admin";

  useEffect(() => setPage(1), [q, sev, status, owner, mineOnly]);

  useEffect(() => {
    if (confirmId === null) return undefined;
    const id = window.setTimeout(() => setConfirmId(null), 3000);
    return () => window.clearTimeout(id);
  }, [confirmId]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function notify(text: string, kind: "success" | "error" = "success") {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }

  /* ---------- derived data ---------- */

  const userById = useMemo(() => new Map(MOCK_USERS.map((u) => [u.id, u])), []);

  const counts = useMemo(() => {
    const bySev: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const byStatus: Record<Status, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    items.forEach((f) => { bySev[f.severity] += 1; byStatus[f.status] += 1; });
    return { bySev, byStatus };
  }, [items]);

  // Open work per owner: active means open or in progress
  const workload = useMemo(() => {
    const map = new Map<number, { active: number; critical: number }>();
    items.forEach((f) => {
      if (f.status !== "open" && f.status !== "in_progress") return;
      const w = map.get(f.owner_id) ?? { active: 0, critical: 0 };
      w.active += 1;
      if (f.severity === "critical") w.critical += 1;
      map.set(f.owner_id, w);
    });
    return [...map.entries()]
      .map(([id, w]) => ({ id, name: userById.get(id)?.name ?? "Unassigned", ...w }))
      .sort((a, b) => b.critical - a.critical || b.active - a.active);
  }, [items, userById]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((f) =>
      (!sev || f.severity === sev) &&
      (!status || f.status === status) &&
      (owner === null || f.owner_id === owner) &&
      (!mineOnly || f.owner_id === me.id) &&
      (!needle || `${f.title} ${f.description}`.toLowerCase().includes(needle))
    );
  }, [items, q, sev, status, owner, mineOnly, me.id]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const filtersActive = Boolean(q || sev || status || owner !== null || mineOnly);

  /* ---------- actions ---------- */

  function clearFilters() {
    setQ(""); setSev(""); setStatus(""); setOwner(null); setMineOnly(false);
  }

  function saveFinding(id: number | null, data: Omit<Finding, "id" | "status"> & { status?: Status }) {
    if (id === null) {
      const created: Finding = { id: nextId.current++, ...data, status: "open" };
      setItems((prev) => [created, ...prev]);
      notify("Finding added");
    } else {
      setItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...data, status: data.status ?? f.status } : f)));
      notify("Finding updated");
    }
    setDialogOpen(false);
  }

  function changeStatus(f: Finding, next: Status) {
    if (!NEXT_STATUS[f.status].includes(next)) {
      notify(`422: cannot move from ${f.status} to ${next}`, "error");
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === f.id ? { ...x, status: next } : x)));
    notify("Status updated");
  }

  function remove(f: Finding) {
    if (!isAdmin) { notify("403: only admins can delete findings", "error"); return; }
    if (confirmId !== f.id) { setConfirmId(f.id); return; }
    setConfirmId(null);
    setItems((prev) => prev.filter((x) => x.id !== f.id));
    notify("Finding deleted");
  }

  /* ---------- render ---------- */

  return (
    <div className="dash">
      <div className="aurora" aria-hidden="true" />

      <div className="dash__wrap">
        <div className="dash__hero">
          <div>
            <h1>Findings</h1>
            <p>Every vulnerability, who owns it and where it stands.</p>
          </div>
          <div className="dash__hero-actions">
            <span className="dash__chip dash__chip--mode">Mock data</span>
            <label className="dash__role">
              View as
              <select className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="admin">Admin</option>
                <option value="analyst">Analyst</option>
              </select>
            </label>
            <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              New finding
            </button>
          </div>
        </div>

        <section className="dash__tiles" aria-label="Summary by severity">
          <Tile label="All findings" count={items.length} total={items.length} tone="all" />
          {SEVERITIES.map((s) => (
            <Tile key={s} label={cap(s)} count={counts.bySev[s]} total={items.length} tone={s} />
          ))}
        </section>

        {workload.length > 0 && (
          <section aria-label="Open work by owner">
            <h2 className="dash__section-title">Open work by owner</h2>
            <div className="dash__owners">
              {workload.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className="dash__owner-chip"
                  aria-pressed={owner === w.id}
                  onClick={() => setOwner(owner === w.id ? null : w.id)}
                >
                  <span className="dash__avatar" aria-hidden="true">{initials(w.name)}</span>
                  <span>{w.name}</span>
                  <span className="dash__owner-count">{w.active} open</span>
                  {w.critical > 0 && <span className="dash__owner-crit">{w.critical} critical</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        <section aria-label="Findings">
          <div className="dash__filters">
            <input
              className="input"
              type="search"
              placeholder="Search title or description"
              aria-label="Search findings"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select className="select" aria-label="Filter by severity" value={sev} onChange={(e) => setSev(e.target.value as "" | Severity)}>
              <option value="">All severities</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
            </select>
            <select
              className="select"
              aria-label="Filter by owner"
              value={owner ?? ""}
              onChange={(e) => setOwner(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">All owners</option>
              {MOCK_USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button type="button" className="btn btn-secondary dash__mine" aria-pressed={mineOnly} onClick={() => setMineOnly((m) => !m)}>
              Assigned to me
            </button>
          </div>

          <div className="dash__tabs" role="group" aria-label="Filter by status">
            <button type="button" className="dash__tab" aria-pressed={status === ""} onClick={() => setStatus("")}>
              All<b>{items.length}</b>
            </button>
            {STATUSES.map((s) => (
              <button key={s} type="button" className="dash__tab" aria-pressed={status === s} onClick={() => setStatus(s)}>
                {STATUS_LABEL[s]}<b>{counts.byStatus[s]}</b>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="dash__state glass">
              <p>{filtersActive ? "No findings match these filters." : "No findings yet. Add the first one."}</p>
              {filtersActive
                ? <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
                : <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setDialogOpen(true); }}>New finding</button>}
            </div>
          ) : (
            visible.map((f, i) => {
              const ownerName = userById.get(f.owner_id)?.name ?? "Unassigned";
              return (
                <article key={f.id} className="dash__row glass" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="dash__main">
                    <div className="dash__title-line">
                      <span className={`badge badge-${f.severity}`}>{f.severity}</span>
                      <h3>{f.title}</h3>
                    </div>
                    <p className="dash__desc">{f.description || "No description"}</p>
                  </div>

                  <label>
                    <span className="sr-only">Status for {f.title}</span>
                    <select className="select dash__select" value={f.status} onChange={(e) => changeStatus(f, e.target.value as Status)}>
                      {[f.status, ...NEXT_STATUS[f.status]].map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </label>

                  <div className="dash__owner">
                    <span className="dash__avatar" aria-hidden="true">{initials(ownerName)}</span>
                    <span>
                      {ownerName}
                      {f.owner_id === me.id && <span className="dash__you">You</span>}
                    </span>
                  </div>

                  <div className="dash__acts">
                    <button type="button" className="btn btn-secondary dash__btn-sm" onClick={() => { setEditing(f); setDialogOpen(true); }}>
                      Edit
                    </button>
                    {isAdmin && (
                      <button type="button" className="btn btn-danger dash__btn-sm" onClick={() => remove(f)}>
                        {confirmId === f.id ? "Confirm delete" : "Delete"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="dash__pager">
              <button type="button" className="btn btn-secondary dash__btn-sm" disabled={current < 2} onClick={() => setPage(current - 1)}>
                Previous
              </button>
              <span aria-live="polite">Page {current} of {pages}</span>
              <button type="button" className="btn btn-secondary dash__btn-sm" disabled={current >= pages} onClick={() => setPage(current + 1)}>
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      <FindingDialog
        open={dialogOpen}
        finding={editing}
        users={MOCK_USERS}
        onClose={() => setDialogOpen(false)}
        onSave={saveFinding}
      />

      {toast && (
        <div
          key={toast.id}
          className={`dash__toast glass ${toast.kind === "error" ? "dash__toast--error" : ""}`}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}