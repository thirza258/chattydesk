import { ReactNode } from 'react';

/**
 * The icon set, as inline SVG.
 *
 * Hand-rolled rather than pulled from a package so the bundle stays small and
 * the desktop build keeps working offline. One geometry throughout: a 24×24
 * box, 1.5 stroke, round caps and `currentColor`, so an icon takes the colour
 * of the text beside it.
 *
 * `className` carries the size and is required — an icon with no dimensions
 * inherits whatever the surrounding CSS happens to say.
 */
interface IconProps {
  className: string;
}

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconCatalogue({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </Svg>
  );
}

export function IconThread({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5a2.25 2.25 0 0 1 2.25 2.25v6.75a2.25 2.25 0 0 1-2.25 2.25H12l-4.5 3.75V15.75H6.75A2.25 2.25 0 0 1 4.5 13.5V6.75Z" />
      <circle cx="9" cy="10.1" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10.1" r="0.85" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.1" r="0.85" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconDevices({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="2.75" y="4.5" width="18.5" height="11.5" rx="2" />
      <path d="M8.5 20.25h7M12 16v4.25" />
    </Svg>
  );
}

export function IconKey({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="8.25" cy="15.75" r="3.75" />
      <path d="M10.9 13.1 19.5 4.5m0 0h-3.75M19.5 4.5v3.75m-4.35.6 2.1 2.1" />
    </Svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 12.75l5.25 5.25 9.75-12" />
    </Svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.5 12h15m0 0-5.25-5.25M19.5 12l-5.25 5.25" />
    </Svg>
  );
}

export function IconExternal({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 18 18 6m0 0h-7.5M18 6v7.5" />
    </Svg>
  );
}

export function IconEye({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.25 12S6 5.25 12 5.25 21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

export function IconEyeOff({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4.2 8.4A16.9 16.9 0 0 0 2.25 12S6 18.75 12 18.75c1.24 0 2.38-.23 3.4-.62M9.6 5.55A9.7 9.7 0 0 1 12 5.25c6 0 9.75 6.75 9.75 6.75a17.3 17.3 0 0 1-2.6 3.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3.75 3.75l16.5 16.5" />
    </Svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="2.75" />
      <path d="M12 2.75v2.5m0 13.5v2.5M4.4 4.4l1.77 1.77m11.66 11.66L19.6 19.6M2.75 12h2.5m13.5 0h2.5M4.4 19.6l1.77-1.77M17.83 6.17 19.6 4.4" />
    </Svg>
  );
}

export function IconSignOut({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14.25 8.25V6A2.25 2.25 0 0 0 12 3.75H6.75A2.25 2.25 0 0 0 4.5 6v12a2.25 2.25 0 0 0 2.25 2.25H12A2.25 2.25 0 0 0 14.25 18v-2.25" />
      <path d="M19.5 12H9.75m9.75 0-3-3m3 3-3 3" />
    </Svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function IconSend({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M21.5 2.5 10 14" />
      <path d="m21.5 2.5-7 19-3.5-8.5-8.5-3.5 19-7Z" />
    </Svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 4.5v15m-7.5-7.5h15" />
    </Svg>
  );
}

export function IconSparkles({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m12 3 1.9 5.6a2.2 2.2 0 0 0 1.5 1.5L21 12l-5.6 1.9a2.2 2.2 0 0 0-1.5 1.5L12 21l-1.9-5.6a2.2 2.2 0 0 0-1.5-1.5L3 12l5.6-1.9a2.2 2.2 0 0 0 1.5-1.5L12 3Z" />
    </Svg>
  );
}

export function IconCopy({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </Svg>
  );
}

export function IconBot({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="11" width="18" height="10" rx="3" />
      <circle cx="9" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <path d="M12 2v4m-4-2h8M2 16h1m18 0h1" />
    </Svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </Svg>
  );
}

export function IconCpu({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
      <path d="M9 9h6v6H9zM9 2v3.5m6-3.5v3.5M9 18.5V22m6-3.5V22M2 9h3.5m-3.5 6h3.5M18.5 9H22m-3.5 6H22" />
    </Svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 2.5s7 2.5 7 8.5c0 6.5-7 10.5-7 10.5S5 17.5 5 11c0-6 7-8.5 7-8.5Z" />
      <path d="m9 11.5 2 2 4-4" />
    </Svg>
  );
}

export function IconLogo({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="24" height="24" rx="6" className="fill-blue-600" />
      <path
        d="M6.5 7.5A1.5 1.5 0 0 1 8 6h8a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 16 15h-4l-3.5 3v-3H8a1.5 1.5 0 0 1-1.5-1.5v-6Z"
        className="fill-white"
      />
      <circle cx="10" cy="10.5" r="1" className="fill-blue-600" />
      <circle cx="12" cy="10.5" r="1" className="fill-blue-600" />
      <circle cx="14" cy="10.5" r="1" className="fill-blue-600" />
    </svg>
  );
}

