
import Icon from "./Icon";
import type { NavLink } from "../types/common-types";
import "../styles/common.css";
import "../styles/header.css";

interface HeaderProps {
  brand?: string;
  homeHref?: string;
  /** In-page or route links shown in the middle of the bar */
  links?: NavLink[];
  signInHref?: string;
  registerHref?: string;
}

export default function Header({
  brand = "Vulnerability Tracker",
  homeHref = "/",
  links = [],
  signInHref = "/login",
  registerHref = "/login?tab=register",
}: HeaderProps) {
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

        <a className="btn btn-secondary site-header__signin" href={signInHref}>
          Sign in
        </a>
        <a className="btn btn-primary" href={registerHref}>
          Get started
        </a>
      </div>
    </header>
  );
}