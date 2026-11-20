"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import "../styles/global-theme.css";
import "../styles/dashboard-page.css";
import { loginUserType } from "@/types/common-types";
import { useAuth } from "@/context/AuthContext";

/* =========================================================
   Types and rules
   ========================================================= */

type Severity = "critical" | "high" | "medium" | "low";
type Status = "open" | "in_progress" | "resolved" | "closed";
type ReviewStatus = "review_pending" | "reviewed_fixed";
type Role = "admin" | "analyst" | "developer" | null;

interface User {
  id: number;
  full_name: string;
  user_name: string;
  email: string;
  role: Role;
}

interface Finding {
  id: number;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  review_status: ReviewStatus;
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

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  review_pending: "Review Pending",
  reviewed_fixed: "Reviewed Finding Fixed",
};

/** The only status moves allowed */
const NEXT_STATUS: Record<Status, Status[]> = {
  open: ["in_progress", "closed"],
  in_progress: ["resolved", "open"],
  resolved: ["closed", "in_progress"],
  closed: ["open"],
};

/* =========================================================
   Helpers
   ========================================================= */

const PAGE_SIZE = 6;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

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

function Tile({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: string;
}) {
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
  finding: Finding | null;
  users: User[];
  saving: boolean;
  onClose: () => void;
  onSave: (
    id: number | null,
    data: Omit<Finding, "id" | "status" | "review_status"> & {
      status?: Status;
      review_status?: ReviewStatus;
    }
  ) => Promise<void>;
}

function FindingDialog({ open, finding, users, saving, onClose, onSave }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [ownerId, setOwnerId] = useState<number>(0);
  const [status, setStatus] = useState<Status>("open");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("review_pending");
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
    setReviewStatus(finding?.review_status ?? "review_pending");
    setErrors({});
  }, [open, finding, users]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const t = title.trim();
    const next = {
      title: t.length < 5 || t.length > 120 ? "Title must be between 5 and 120 characters." : undefined,
      description: description.length > 2000 ? "Description can be at most 2000 characters." : undefined,
    };
    setErrors(next);
    if (next.title || next.description) return;
    await onSave(finding?.id ?? null, {
      title: t,
      description: description.trim(),
      severity,
      owner_id: ownerId,
      status: finding ? status : undefined,
      review_status: finding ? reviewStatus : undefined,
    });
  }

  const statusChoices: Status[] = finding ? [finding.status, ...NEXT_STATUS[finding.status]] : [];

  return (
    <dialog
      ref={ref}
      className="dash__dlg"
      aria-labelledby="dash-dlg-title"
      onClose={() => {
        if (!saving) onClose();
      }}
      onClick={(e) => {
        if (!saving && e.target === e.currentTarget) onClose();
      }}
    >
      <form className="dash__dlg-card glass-modal" onSubmit={handleSubmit} noValidate>
        <h2 id="dash-dlg-title">{finding ? "Edit finding" : "New finding"}</h2>

        <div className={`dash__field ${errors.title ? "has-error" : ""}`}>
          <label htmlFor="dash-f-title">Title</label>
          <input
            id="dash-f-title"
            className="input"
            value={title}
            disabled={saving}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="5 to 120 characters"
            aria-invalid={errors.title ? true : undefined}
          />
          {errors.title && (
            <p className="dash__error" role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div className={`dash__field ${errors.description ? "has-error" : ""}`}>
          <label htmlFor="dash-f-desc">Description</label>
          <textarea
            id="dash-f-desc"
            className="textarea"
            rows={4}
            value={description}
            disabled={saving}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was found and where"
          />
          {errors.description && (
            <p className="dash__error" role="alert">
              {errors.description}
            </p>
          )}
        </div>

        <div className="dash__field-row">
          <div className="dash__field">
            <label htmlFor="dash-f-sev">Severity</label>
            <select
              id="dash-f-sev"
              className="select"
              value={severity}
              disabled={saving}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {cap(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="dash__field">
            <label htmlFor="dash-f-owner">Owner</label>
            <select
              id="dash-f-owner"
              className="select"
              value={ownerId}
              disabled={saving}
              onChange={(e) => setOwnerId(Number(e.target.value))}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u?.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {finding && (
          <>
            <div className="dash__field">
              <label htmlFor="dash-f-status">Status</label>
              <select
                id="dash-f-status"
                className="select"
                value={status}
                disabled={saving}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                {statusChoices.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="dash__field">
              <label htmlFor="dash-f-review">Review Status</label>
              <select
                id="dash-f-review"
                className="select"
                value={reviewStatus}
                disabled={saving}
                onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
              >
                <option value="review_pending">{REVIEW_STATUS_LABEL.review_pending}</option>
                <option value="reviewed_fixed">{REVIEW_STATUS_LABEL.reviewed_fixed}</option>
              </select>
            </div>
          </>
        )}

        <div className="dash__dlg-actions">
          <button type="button" className="btn btn-secondary" disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "saving..." : "Save finding"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

/* =========================================================
   Dashboard page
   ========================================================= */

export default function DashboardPage({ loginUser }: { loginUser?: loginUserType }) {
  const [items, setItems] = useState<Finding[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [sev, setSev] = useState<"" | Severity>("");
  const [status, setStatus] = useState<"" | Status>("");
  const [owner, setOwner] = useState<number | null>(null);
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Finding | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string; kind: "success" | "error" } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const { user } = useAuth();
  const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}`;
  console.log({ items });

  // Automatically derive the role from the AuthContext user, fallback prop, or default to developer
  const role: Role = useMemo(() => {
    const activeRole = user?.role || loginUser?.role;
    return (activeRole?.toLowerCase() as Role) ?? "developer";
  }, [user, loginUser]);

  const isAdmin = role === "admin";
  const isAnalystOrAdmin = role === "admin" || role === "analyst";
  const isDeveloper = role === "developer";

  // Authenticated context user mapped by role
  const me = useMemo(() => {
    return (
      users.find((u) => u.role === role) ||
      users[0] || {
        id: 1,
        name: user?.full_name || "Current User",
        email: user?.email || "user@example.com",
        role,
      }
    );
  }, [users, role, user]);

  // Fetch initial data from APIs
  async function fetchUser() {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/user/get/developers`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok || response.status == 200) {
        const data = await response.json();
        setUsers(data?.developers);
        setLoading(false);
      }
    } catch (e) {
      console.log("error in fetching users", e);
      setUsers([]);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function get_findings() {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/finding/get/all`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok || response.status == 200) {
        const data = await response.json();
        setItems(data);
        console.log({ data });
        setLoading(false);
      }
    } catch (e) {
      console.log("error to fetch items/findings", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
    get_findings();
  }, []);

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

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const counts = useMemo(() => {
    const bySev: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const byStatus: Record<Status, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    items.forEach((f) => {
      bySev[f.severity] += 1;
      byStatus[f.status] += 1;
    });
    return { bySev, byStatus };
  }, [items]);

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
      .map(([id, w]) => ({ id, name: userById.get(id)?.full_name ?? "Unassigned", ...w }))
      .sort((a, b) => b.critical - a.critical || b.active - a.active);
  }, [items, userById]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (f) =>
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

  /* ---------- actions via API ---------- */

  function clearFilters() {
    setQ("");
    setSev("");
    setStatus("");
    setOwner(null);
    setMineOnly(false);
  }

  async function saveFinding(
    id: number | null,
    data: Omit<Finding, "id" | "status" | "review_status"> & {
      status?: Status;
      review_status?: ReviewStatus;
    }
  ) {
    setSaving(true);
    try {
      if (id === null) {
        const res = await fetch(`${BASE_URL}/finding/add/new`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...data, status: "open", review_status: "review_pending" }),
        });
        if (!res.ok) throw new Error("Failed to create finding");
        const created: Finding = await res.json();
        setItems((prev) => [created, ...prev]);
        notify("Finding added");
      } else {
        const res = await fetch(`${BASE_URL}/finding/update/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to update finding");
        const updated: Finding = await res.json();
        setItems((prev) => prev.map((f) => (f.id === id ? updated : f)));
        notify("Finding updated");
      }
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      notify("API operation failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(f: Finding, next: Status) {
    if (isDeveloper && f.owner_id !== me.id) {
      notify("403: Developers can only update status of findings assigned to them", "error");
      return;
    }
    if (!NEXT_STATUS[f.status].includes(next)) {
      notify(`422: cannot move from ${f.status} to ${next}`, "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/finding/${f.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed update status");

      setItems((prev) => prev.map((x) => (x.id === f.id ? { ...x, status: next } : x)));
      notify("Status updated");
    } catch (err) {
      console.error(err);
      notify("Failed to update status via API", "error");
    }
  }

  async function changeReviewStatus(f: Finding, nextReviewStatus: ReviewStatus) {
    if (!isAnalystOrAdmin) {
      notify("403: Only Analysts and Admins can update review status", "error");
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/finding/${f.id}/review-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status: nextReviewStatus }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed update review status");

      setItems((prev) => prev.map((x) => (x.id === f.id ? { ...x, review_status: nextReviewStatus } : x)));
      notify("Review status updated");
    } catch (err) {
      console.error(err);
      notify("Failed to update review status via API", "error");
    }
  }

  async function remove(f: Finding) {
    if (!isAdmin) {
      notify("403: only admins can delete findings", "error");
      return;
    }
    if (confirmId !== f.id) {
      setConfirmId(f.id);
      return;
    }

    try {
      const res = await fetch(`/api/findings/${f.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed deletion");

      setConfirmId(null);
      setItems((prev) => prev.filter((x) => x.id !== f.id));
      notify("Finding deleted");
    } catch (err) {
      console.error(err);
      notify("Failed to delete finding via API", "error");
    }
  }

  if (loading) {
    return (
      <div className="dash">
        <div className="dash__wrap">
          <p>Loading findings from API...</p>
        </div>
      </div>
    );
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
            <div className="dash__role">
              <span>Logged in Role</span>
              <p className="user_role">
                {user ? user?.role?.toLowerCase() : loginUser?.role?.toLowerCase() || "guest"}
              </p>
            </div>
            {isAnalystOrAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                New finding
              </button>
            )}
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
                  <span className="dash__avatar" aria-hidden="true">
                    {initials(w.name)}
                  </span>
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
            <select
              className="select"
              aria-label="Filter by severity"
              value={sev}
              onChange={(e) => setSev(e.target.value as "" | Severity)}
            >
              <option value="">All severities</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {cap(s)}
                </option>
              ))}
            </select>
            <select
              className="select"
              aria-label="Filter by owner"
              value={owner ?? ""}
              onChange={(e) => setOwner(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">All owners</option>
              {users.map((u) => (
                <option key={u?.id} value={u?.id}>
                  {u?.full_name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-secondary dash__mine"
              aria-pressed={mineOnly}
              onClick={() => setMineOnly((m) => !m)}
            >
              Assigned to me
            </button>
          </div>

          <div className="dash__tabs" role="group" aria-label="Filter by status">
            <button type="button" className="dash__tab" aria-pressed={status === ""} onClick={() => setStatus("")}>
              All<b>{items.length}</b>
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className="dash__tab"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
              >
                {STATUS_LABEL[s]}
                <b>{counts.byStatus[s]}</b>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="dash__state glass">
              <p>{filtersActive ? "No findings match these filters." : "No findings yet. Add the first one."}</p>
              {filtersActive ? (
                <button type="button" className="btn btn-secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              ) : (
                isAnalystOrAdmin && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setEditing(null);
                      setDialogOpen(true);
                    }}
                  >
                    New finding
                  </button>
                )
              )}
            </div>
          ) : (
            visible.map((f, i) => {
              const ownerName = userById.get(f.owner_id)?.full_name ?? "Unassigned";
              return (
                <article key={f.id} className="dash__row glass" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="dash__main">
                    <div className="dash__title-line">
                      <span className={`badge badge-${f.severity}`}>{f.severity}</span>
                      <h3>{f.title}</h3>
                    </div>
                    <p className="dash__desc">{f.description || "No description"}</p>
                  </div>

                  {/* Status Dropdown */}
                  <label>
                    <span className="sr-only">Status for {f.title}</span>
                    <select
                      className="select dash__select"
                      value={f.status}
                      onChange={(e) => changeStatus(f, e.target.value as Status)}
                    >
                      {[f.status, ...NEXT_STATUS[f.status]].map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Review Status Dropdown (Restricted to Analyst and Admin) */}
                  <label>
                    <span className="sr-only">Review Status for {f.title}</span>
                    <select
                      className="select dash__select"
                      value={f.review_status}
                      disabled={!isAnalystOrAdmin}
                      title={!isAnalystOrAdmin ? "Only Analysts and Admins can update review status" : ""}
                      onChange={(e) => changeReviewStatus(f, e.target.value as ReviewStatus)}
                    >
                      <option value="review_pending">{REVIEW_STATUS_LABEL.review_pending}</option>
                      <option value="reviewed_fixed">{REVIEW_STATUS_LABEL.reviewed_fixed}</option>
                    </select>
                  </label>

                  <div className="dash__owner">
                    <span className="dash__avatar" aria-hidden="true">
                      {initials(ownerName)}
                    </span>
                    <span>
                      {ownerName}
                      {f.owner_id === me.id && <span className="dash__you">You</span>}
                    </span>
                  </div>

                  <div className="dash__acts">
                    {isAnalystOrAdmin && (
                      <button
                        type="button"
                        className="btn btn-secondary dash__btn-sm"
                        onClick={() => {
                          setEditing(f);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    )}
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
              <button
                type="button"
                className="btn btn-secondary dash__btn-sm"
                disabled={current < 2}
                onClick={() => setPage(current - 1)}
              >
                Previous
              </button>
              <span aria-live="polite">
                Page {current} of {pages}
              </span>
              <button
                type="button"
                className="btn btn-secondary dash__btn-sm"
                disabled={current >= pages}
                onClick={() => setPage(current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>

      <FindingDialog
        open={dialogOpen}
        finding={editing}
        users={users}
        saving={saving}
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