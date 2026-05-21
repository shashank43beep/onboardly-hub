interface LogoProps {
  size?: number;
  variant?: "icon" | "full" | "pill";
  dark?: boolean;
}

export function Logo({ size = 32, variant = "full", dark = false }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#6366f1"/>
        <circle cx="12" cy="11" r="3.5" fill="white" opacity="0.95"/>
        <path d="M6 22 Q6 17 12 17 Q18 17 18 22" fill="white" opacity="0.95"/>
        <line x1="19" y1="17" x2="25" y2="17" stroke="white" strokeWidth="2"
          strokeLinecap="round" opacity="0.6"/>
        <path d="M22 13 L26 17 L22 21" stroke="white" strokeWidth="2"
          fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <circle cx="25" cy="26" r="4" fill="white" opacity="0.97"/>
        <path d="M22 26 L24.5 28.5 L29 23" stroke="#6366f1" strokeWidth="1.8"
          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }

  if (variant === "pill") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#6366f1", borderRadius: 10,
        padding: "6px 14px 6px 8px",
      }}>
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)"/>
          <circle cx="12" cy="11" r="3.5" fill="white" opacity="0.95"/>
          <path d="M6 22 Q6 17 12 17 Q18 17 18 22" fill="white" opacity="0.95"/>
          <line x1="19" y1="17" x2="25" y2="17" stroke="white" strokeWidth="2"
            strokeLinecap="round" opacity="0.6"/>
          <path d="M22 13 L26 17 L22 21" stroke="white" strokeWidth="2"
            fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
          <circle cx="25" cy="26" r="4" fill="white" opacity="0.97"/>
          <path d="M22 26 L24.5 28.5 L29 23" stroke="#6366f1" strokeWidth="1.8"
            fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{
          fontSize: 15, fontWeight: 700, color: "white", letterSpacing: "-0.3px",
        }}>
          Onboardly
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#6366f1"/>
        <circle cx="12" cy="11" r="3.5" fill="white" opacity="0.95"/>
        <path d="M6 22 Q6 17 12 17 Q18 17 18 22" fill="white" opacity="0.95"/>
        <line x1="19" y1="17" x2="25" y2="17" stroke="white" strokeWidth="2"
          strokeLinecap="round" opacity="0.6"/>
        <path d="M22 13 L26 17 L22 21" stroke="white" strokeWidth="2"
          fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
        <circle cx="25" cy="26" r="4" fill="white" opacity="0.97"/>
        <path d="M22 26 L24.5 28.5 L29 23" stroke="#6366f1" strokeWidth="1.8"
          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{
        fontSize: size * 0.65,
        fontWeight: 700,
        color: dark ? "#ffffff" : "#111827",
        letterSpacing: "-0.5px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        Onboardly
      </span>
    </div>
  );
}