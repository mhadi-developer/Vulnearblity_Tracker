"use client";
import { useRef } from "react";
import Icon from "./Icon";
import type { NavLink } from "../types/common-types";
import "../styles/common.css";
import "../styles/header.css";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  brand?: string;
  homeHref?: string;
  signInHref?: string;
}

const links: NavLink[] = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#api", label: "API" },
];

function formatAccountCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const formatted = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(date);

  return `${formatted} PKT`;
}

export default function Header({
  brand = "Vulnerability Tracker",
  homeHref = "/",
  signInHref = "/login",
}: HeaderProps) {
  const { user } = useAuth();
  const profileDialogRef = useRef<HTMLDialogElement>(null);
  const displayName = user?.full_name || user?.user_name || user?.email || "";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
  const accountCreatedAt = user ? formatAccountCreatedAt(user.created_at) : "";
  const openProfile = () => {
    const dialog = profileDialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  };
  const closeProfile = () => profileDialogRef.current?.close();

  return (
    <header className="glass-navbar site-header">
      <div className="container site-header__inner">
        <a className="site-header__brand" href={homeHref} aria-label={`${brand} home`}>
          <span className="site-header__logo gradient-brand">
            <Icon name="shield" />
          </span>
          {brand}
        </a>

        {links.length > 0 && (
          <nav className="site-header__links" aria-label="Page sections">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        )}
        {user ? (
          <div className="site-header__profile">
            <button
              type="button"
              className="site-header__profile-trigger"
              aria-label="View profile details"
              aria-haspopup="dialog"
              aria-controls="profile-dialog"
              onClick={openProfile}
            >
              <span className="site-header__avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="site-header__profile-copy">
                <span className="site-header__profile-name">{displayName}</span>
                <span className="site-header__profile-email">{user.email}</span>
              </span>
              <span className="site-header__profile-chevron" aria-hidden="true" />
            </button>
            <dialog
              ref={profileDialogRef}
              id="profile-dialog"
              className="site-header__profile-dialog"
              aria-labelledby="profile-title"
              onClick={(event) => {
                if (event.target === event.currentTarget) closeProfile();
              }}
            >
              <div className="site-header__profile-banner" aria-hidden="true">
                <span>Vulnerability Tracker</span>
                <span>Account overview</span>
              </div>
              <button
                className="site-header__profile-close"
                type="button"
                aria-label="Close profile details"
                onClick={closeProfile}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
              <header className="site-header__panel-heading">
                <span className="site-header__panel-avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="site-header__panel-identity">
                  <span className="site-header__profile-status">
                    <span aria-hidden="true" />
                    Signed in
                  </span>
                  <h2 id="profile-title">{displayName}</h2>
                  <span className="site-header__panel-subtitle">@{user.user_name}</span>
                </span>
              </header>
              <section
                className="site-header__profile-information"
                aria-label="Personal information"
              >
                <div className="site-header__information-heading">
                  <h3>Personal information</h3>
                  <span>Profile</span>
                </div>
                <dl>
                  <div>
                    <dt>Full name</dt>
                    <dd>{user.full_name}</dd>
                  </div>
                  <div>
                    <dt>Username</dt>
                    <dd>{user?.user_name}</dd>
                  </div>
                  <div>
                    <dt>Email address</dt>
                    <dd>{user.email}</dd>
                  </div>
                   <div>
                    <dt> User Role</dt>
                    <dd>{user?.role}</dd>
                  </div>
                  <div>
                    <dt>Member since</dt>
                    <dd>
                      <time dateTime={user.created_at}>{accountCreatedAt}</time>
                    </dd>
                  </div>
                </dl>
              </section>
            </dialog>
          </div>
        ) : (
          <a className="btn btn-secondary site-header__signin" href={signInHref}>
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}