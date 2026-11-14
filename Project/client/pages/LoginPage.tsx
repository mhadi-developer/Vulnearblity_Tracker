"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../styles/global-theme.css"; // your global glass theme (adjust the path if needed)
import "../styles/login-page.css";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL ;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const eErr = !email.trim()
      ? "Enter your email address."
      : !EMAIL_RE.test(email.trim())
        ? "Enter a valid email address."
        : "";
    const pErr = password ? "" : "Enter your password.";
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setBusy(true);
    try {
      // FastAPI OAuth2 form: the email goes in the "username" field
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include'
      });

      if (res.status === 401) {
        setFormError("Incorrect email or password.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(typeof data?.detail === "string" ? data.detail : "Something went wrong. Please try again.");
        return;
      }

      const data = await res.json();
      try {
        sessionStorage.setItem(
          "vt.session",
          JSON.stringify({ token: data.access_token, role: data.role ?? "analyst", email: email.trim() })
        );
      } catch {
        /* storage unavailable */
      }
      router.push("/dashboard");
    } catch {
      setFormError("Cannot reach the server. Check that the API is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <main className="login">
        <section className="glass glass-strong login__card" aria-labelledby="login-title">
          <Link className="login__brand" href="/">
            <span className="login__logo gradient-brand" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            Vulnerability Tracker
          </Link>

          <h1 id="login-title">Welcome back</h1>
          <p className="login__sub">Sign in to log and manage security findings.</p>

          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className="login__alert" role="alert">
                {formError}
              </div>
            )}

            <div className={`login__field ${emailError ? "has-error" : ""}`}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? "login-email-error" : undefined}
              />
              {emailError && <p id="login-email-error" className="login__error" role="alert">{emailError}</p>}
            </div>

            <div className={`login__field ${passwordError ? "has-error" : ""}`}>
              <label htmlFor="login-password">Password</label>
              <div className="login__control">
                <input
                  id="login-password"
                  className="input login__input--toggle"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? "login-password-error" : undefined}
                />
                <button
                  type="button"
                  className="login__toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-pressed={showPw}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {passwordError && <p id="login-password-error" className="login__error" role="alert">{passwordError}</p>}
            </div>

            <button className="btn btn-primary login__submit" type="submit" disabled={busy}>
              {busy && <span className="login__spinner" aria-hidden="true" />}
              {busy ? "Signing in" : "Sign in"}
            </button>
          </form>

          <p className="login__footer">
            New here? <Link href="/register">Create an account</Link>
          </p>
        </section>
      </main>
    </>
  );
}