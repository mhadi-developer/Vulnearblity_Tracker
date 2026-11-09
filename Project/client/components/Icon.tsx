const ICON_PATHS = {
  shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z M9 12l2 2 4-4",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  gauge: "M3.3 17a10 10 0 1117.4 0M12 14l4-4",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  flow: "M5 12h14M13 6l6 6-6 6",
  lock: "M7 11V7a5 5 0 0110 0v4M5 11h14v10H5z",
  search: "M21 21l-4.3-4.3M11 18a7 7 0 100-14 7 7 0 000 14z",
} as const;

export type IconName = keyof typeof ICON_PATHS;

interface IconProps {
  name: IconName;
  size?: number;
}

export default function Icon({ name, size = 22 }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}