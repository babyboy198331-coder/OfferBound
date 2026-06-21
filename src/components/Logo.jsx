export default function Logo({ size = 26, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="48" r="4.5" fill="currentColor" />
      <path d="M16 48 L36 28" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M28 18 H48 V38"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
