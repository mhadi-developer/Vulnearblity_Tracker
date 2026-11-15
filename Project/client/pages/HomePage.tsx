"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import Reveal from "../components/Reveal";
import { useInView } from "../hooks/useInView";
import { useCountUp } from "../hooks/useCountUp";
import {useAuth} from "@/context/AuthContext"
import {
  CODE_SAMPLE,
  ENDPOINTS,
  FEATURES,
  FOOTER_LINKS,
  SAMPLE_FINDINGS,
  SEVERITIES,
  STATS,
  WORKFLOW,
} from "../hooks/data/homeContent";
import type { StatItem } from "../types/common-types";
import "../styles/global-theme.css"; // your global glass theme (move to main.tsx if you prefer)
import "../styles/common.css";
import "../styles/home-page.css";

/* ---------- Page sections ---------- */

function Hero() {
  const total = SEVERITIES?.reduce((sum, s) => sum + s.count, 0);
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const shownTotal = useCountUp(total, seen);
  const {user} = useAuth()
  let userActions = (
    <>
      <a className="btn btn-primary btn-lg" href="/register?tab=register">Create your account</a>
      <a className="btn btn-secondary btn-lg" href="#features">See how it works</a>
    </>
  );

  if (user) {
    if (user.role === "Admin" && user.role_id === 1) {
      userActions = (
        <>
          <a className="btn btn-primary btn-lg" href="/dashboard">See All Findings</a>
          <a className="btn btn-secondary btn-lg" href="/admin/role-managment">Assign User Roles</a>
        </>
      );
    } else {
      userActions = (
        <>
          <a className="btn btn-primary btn-lg" href="/dashboard">See All Findings</a>
          <a className="btn btn-secondary btn-lg" href="/set-by-user">Finding Fix By You</a>
        </>
      );
    }
  }

  return (
    <section className="container hp-hero" aria-labelledby="hero-title">
      <div>
        <span className="badge badge-info hp-eyebrow">Security findings, one place</span>
        <h1 id="hero-title">
          Track every vulnerability from{" "}
          <span className="text-gradient hp-gradient-live">discovery to fix</span>
        </h1>
        <p className="hp-lede">
          Log findings with a severity and an owner, follow each one through a clear status
          workflow, and see your risk at a glance. Built on a secure, tested REST API.
        </p>
        <div className="hp-cta">
          {userActions}
        </div>
        <ul className="hp-trust">
          <li>Role-based access</li>
          <li>Token login</li>
          <li>Tested API</li>
        </ul>
      </div>

      <Reveal className="glass glass-strong hp-preview lift" aria-label="Dashboard preview with sample data">
        <div ref={ref}>
          <div className="hp-preview-top">
            <h3>Findings overview</h3>
            <span className="hp-dots" aria-hidden="true"><i /><i /><i /></span>
          </div>
          <div className="hp-total">
            <strong className="text-gradient">{shownTotal}</strong>
            <p>open vulnerabilities (sample data)</p>
          </div>
          <div
            className="hp-sevbar"
            role="img"
            aria-label={SEVERITIES.map((s) => `${s.label} ${s.count}`).join(", ")}
          >
            {SEVERITIES.map((s) => (
              <span key={s.key} className={`hp-seg hp-seg-${s.key}`} style={{ flexGrow: seen ? s.count : 0 }} />
            ))}
          </div>
          <ul className="hp-legend">
            {SEVERITIES.map((s) => (
              <li key={s.key}>
                <i style={{ background: s.color }} />
                {s.label}
                <b>{s.count}</b>
              </li>
            ))}
          </ul>
          <div className="hp-table-wrap">
            <table className="table-glass">
              <thead>
                <tr><th>ID</th><th>Finding</th><th>Severity</th><th>Status</th><th>Owner</th></tr>
              </thead>
              <tbody>
                {SAMPLE_FINDINGS.map((f) => (
                  <tr key={f.id}>
                    <td className="mono">{f.id}</td>
                    <td>{f.title}</td>
                    <td><span className={`badge badge-${f.sev}`}>{f.sev}</span></td>
                    <td>{f.status}</td>
                    <td>{f.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Stat({ value, suffix, label, delay }: StatItem & { delay: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const shown = useCountUp(value, seen);
  return (
    <Reveal delay={delay} className="glass glass-panel hp-stat">
      <div ref={ref}>
        <strong className="text-gradient">{shown}{suffix}</strong>
        <span>{label}</span>
      </div>
    </Reveal>
  );
}

function Stats() {
  return (
    <section className="container hp-section" aria-label="Key numbers">
      <div className="hp-stats">
        {STATS.map((s, i) => (
          <Stat key={s.label} {...s} delay={i * 90} />
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="container hp-section" aria-labelledby="features-title">
      <div className="hp-section-head">
        <h2 id="features-title">Everything a security team needs to stay on top of findings</h2>
        <p>Simple on purpose. Each feature maps to a real step in how findings are handled.</p>
      </div>
      <div className="hp-grid">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 70} as="article" className="glass glass-card hp-feature lift">
            <span className={`hp-icon ${f.grad}`}><Icon name={f.icon} /></span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="workflow" className="container hp-section" aria-labelledby="workflow-title">
      <div className="hp-section-head">
        <h2 id="workflow-title">A clear path from found to fixed</h2>
        <p>Every finding follows the same lifecycle, so status always means the same thing.</p>
      </div>
      <ol className="hp-flow">
        {WORKFLOW.map((s, i) => (
          <Reveal key={s.title} delay={i * 90} as="li" className="glass glass-card hp-step lift">
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </Reveal>
        ))}
      </ol>
      <p className="hp-note">
        In progress can return to Open, and Resolved can return to In progress, if a fix does not hold.
      </p>
    </section>
  );
}

function ApiSection() {
  return (
    <section id="api" className="container hp-section" aria-labelledby="api-title">
      <div className="hp-section-head">
        <h2 id="api-title">A documented REST API underneath</h2>
        <p>
          The app is a client for the same API your scripts and tools can use. Interactive docs are
          served at <code>/docs</code>.
        </p>
      </div>
      <div className="hp-api">
        <Reveal className="glass glass-card">
          <ul className="hp-endpoints">
            {ENDPOINTS.map((e) => (
              <li key={e.m + e.path}>
                <span className={`hp-method hp-${e.m}`}>{e.m.toUpperCase()}</span>
                <code>{e.path}</code>
                <span>{e.note}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={90} className="glass glass-card">
          <pre className="hp-code"><code>{CODE_SAMPLE}</code></pre>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container hp-section" aria-labelledby="cta-title">
      <Reveal className="glass glass-strong hp-final">
        <h2 id="cta-title">Ready to bring your findings into one place?</h2>
        <p>Create an account, log your first finding and see the summary update right away.</p>
        <div className="hp-cta">
          <a className="btn btn-primary btn-lg" href="/login?tab=register">Get started</a>
          <a className="btn btn-secondary btn-lg" href="/login">Sign in</a>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Page ---------- */

export default function HomePage() {
  return (
    <>
      <div className="aurora" aria-hidden="true" />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Workflow />
        <ApiSection />
        <FinalCta />
      </main>
    
    </>
  );
}