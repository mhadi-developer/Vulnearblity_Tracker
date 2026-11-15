import "../styles/loader.css";

type LoaderProps = {
  label?: string;
  size?: "small" | "medium" | "large";
  className?: string;
};

export default function Loader({
  label = "Loading...",
  size = "medium",
  className = "",
}: LoaderProps) {
  const classes = ["loader", `loader--${size}`, className].filter(Boolean).join(" ");

  return (
    <div className={classes} role="status" aria-live="polite">
      <span className="loader__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
