import type { NavLink } from "../types/common-types";
import "../styles/common.css";
import "../styles/footer.css";

interface FooterProps {
  name?: string;
  note?: string;
  links?: NavLink[];
}
interface FooterProps {
  name?: string;
  note?: string;
  links?: NavLink[];
  year?: number;
}

export default function Footer({
  name = "Vulnerability Tracker",
  note = "Built with Nextjs, FastAPI, SQLAlchemy and Postgres",
  links = [],
  year = 2026,
}: FooterProps) {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <span>
          {name} &middot; {year}
        </span>

        {links.length > 0 && (
          <nav className="site-footer__links" aria-label="Footer">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <span>{note}</span>
      </div>
    </footer>
  );
}