"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import "../styles/global-theme.css"; // your global glass theme (adjust the path if needed)
import "../styles/register-page.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^\p{L}[\p{L}\s.'-]*$/u; // letters, spaces, dots, apostrophes, hyphens
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/; // 3 to 20 letters, numbers or underscores
const MIN_PASSWORD = 6; // matches the requirements document; raise to 8 for production
const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"];

/** 0 (too short) to 4 (strong). Only drives the meter; it never blocks sign up. */
function strengthOf(pw: string): number {
  if (pw.length < MIN_PASSWORD) return 0;
  let score = 1;
  if (pw.length >= 10) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(score, 4);
}

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", username: "", email: "", password: "", confirm: "" });
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const score = strengthOf(password);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const name = fullName.trim();
    const next = {
      fullName: !name
        ? "Enter your full name."
        : name.length < 2 || name.length > 60 || !NAME_RE.test(name)
          ? "Use 2 to 60 letters (spaces, dots, apostrophes and hyphens are fine)."
          : "",
      username: !username.trim()
        ? "Choose a username."
        : !USERNAME_RE.test(username.trim())
          ? "Use 3 to 20 letters, numbers or underscores."
          : "",
      email: !email.trim()
        ? "Enter your email address."
        : !EMAIL_RE.test(email.trim())
          ? "Enter a valid email address."
          : "",
      password: !password
        ? "Enter a password."
        : password.length < MIN_PASSWORD
          ? `Use at least ${MIN_PASSWORD} characters.`
          : "",
      confirm: confirm !== password ? "Passwords do not match." : "",
    };
    setErrors(next);
    if (next.fullName || next.username || next.email || next.password || next.confirm) return;

    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = typeof data?.detail === "string" ? data.detail : "Something went wrong. Please try again.";
        if (res.status === 400) {
          // duplicate email or username: show the message under the matching field
          const field = detail.toLowerCase().includes("username") ? "username" : "email";
          setErrors((p) => ({ ...p, [field]: detail }));
        }
        else setFormError(detail);
        return;
      }
      setDone(true);
    } catch {
      setFormError("Cannot reach the server. Check that the API is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <main className="register">
        <section className="glass glass-strong register__card" aria-labelledby="register-title">
          <Link className="register__brand" href="/">
            <span className="register__logo gradient-brand" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            Vulnerability Tracker
          </Link>

          {done ? (
            <div className="register__success">
              <span className="register__tick" aria-hidden="true">&#10003;</span>
              <h1 id="register-title">Account created</h1>
              <p>You can now sign in with your email and password.</p>
              <Link className="btn btn-primary register__submit" href="/login">
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 id="register-title">Create your account</h1>
              <p className="register__sub">Start logging and tracking security findings.</p>

              <form onSubmit={handleSubmit} noValidate>
                {formError && (
                  <div className="register__alert" role="alert">
                    {formError}
                  </div>
                )}

                <div className={`register__field ${errors.fullName ? "has-error" : ""}`}>
                  <label htmlFor="reg-fullname">Full name</label>
                  <input
                    id="reg-fullname"
                    className="input"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    aria-invalid={errors.fullName ? true : undefined}
                    aria-describedby={errors.fullName ? "reg-fullname-error" : undefined}
                  />
                  {errors.fullName && <p id="reg-fullname-error" className="register__error" role="alert">{errors.fullName}</p>}
                </div>

                <div className={`register__field ${errors.username ? "has-error" : ""}`}>
                  <label htmlFor="reg-username">Username</label>
                  <input
                    id="reg-username"
                    className="input"
                    type="text"
                    autoComplete="username"
                    placeholder="3 to 20 letters, numbers or _"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-invalid={errors.username ? true : undefined}
                    aria-describedby={errors.username ? "reg-username-error" : undefined}
                  />
                  {errors.username && <p id="reg-username-error" className="register__error" role="alert">{errors.username}</p>}
                </div>

                <div className={`register__field ${errors.email ? "has-error" : ""}`}>
                  <label htmlFor="reg-email">Email</label>
                  <input
                    id="reg-email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "reg-email-error" : undefined}
                  />
                  {errors.email && <p id="reg-email-error" className="register__error" role="alert">{errors.email}</p>}
                </div>

                <div className={`register__field ${errors.password ? "has-error" : ""}`}>
                  <label htmlFor="reg-password">Password</label>
                  <div className="register__control">
                    <input
                      id="reg-password"
                      className="input register__input--toggle"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder={`At least ${MIN_PASSWORD} characters`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={errors.password ? true : undefined}
                      aria-describedby={errors.password ? "reg-password-error" : undefined}
                    />
                    <button
                      type="button"
                      className="register__toggle"
                      onClick={() => setShowPw((s) => !s)}
                      aria-pressed={showPw}
                      aria-label={showPw ? "Hide passwords" : "Show passwords"}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && <p id="reg-password-error" className="register__error" role="alert">{errors.password}</p>}
                </div>

                {password && (
                  <>
                    <div className="register__meter" data-score={score} aria-hidden="true">
                      <i /><i /><i /><i />
                    </div>
                    <p className="register__meter-label" aria-live="polite">
                      Password strength: {STRENGTH[score]}
                    </p>
                  </>
                )}

                <div className={`register__field ${errors.confirm ? "has-error" : ""}`}>
                  <label htmlFor="reg-confirm">Confirm password</label>
                  <input
                    id="reg-confirm"
                    className="input"
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={errors.confirm ? true : undefined}
                    aria-describedby={errors.confirm ? "reg-confirm-error" : undefined}
                  />
                  {errors.confirm && <p id="reg-confirm-error" className="register__error" role="alert">{errors.confirm}</p>}
                </div>

                <button className="btn btn-primary register__submit" type="submit" disabled={busy}>
                  {busy && <span className="register__spinner" aria-hidden="true" />}
                  {busy ? "Creating account" : "Create account"}
                </button>
              </form>

              <p className="register__footer">
                Already registered? <Link href="/login">Sign in</Link>
              </p>
            </>
          )}
        </section>
      </main>
    </>
  );
}