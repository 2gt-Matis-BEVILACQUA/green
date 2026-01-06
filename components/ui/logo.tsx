"use client"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  }

  return (
    <svg
      viewBox="0 0 180 32"
      className={`${sizeClasses[size]} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Icon Group - Sync Circle + Terrain Flag */}
      <g transform="translate(0, 4)">
        {/* Sync Circle - Top Arc (clockwise) */}
        <path
          d="M 6 8 A 4 4 0 0 1 6 0"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Sync Circle - Bottom Arc (counter-clockwise) */}
        <path
          d="M 6 0 A 4 4 0 0 1 6 8"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
        {/* Top Arrow Head */}
        <path
          d="M 4.5 0 L 6 -1.5 L 7.5 0"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom Arrow Head */}
        <path
          d="M 4.5 8 L 6 9.5 L 7.5 8"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
        {/* Golf Flag / Terrain Shape - Minimalist */}
        <path
          d="M 10 0 L 10 8 M 10 4 L 13 4 L 13 0"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* TerrainSync Text */}
      {showText && (
        <text
          x="20"
          y="20"
          fontSize="18"
          fontWeight="700"
          letterSpacing="-0.02em"
          fill="currentColor"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Geist', 'Montserrat', sans-serif"
        >
          TerrainSync
        </text>
      )}
    </svg>
  )
}
