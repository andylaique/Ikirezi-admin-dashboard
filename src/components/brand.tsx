export function Logo({ size = 36, wordmark = false, light = false }: { size?: number; wordmark?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
        <defs>
          <radialGradient id="pearl" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#F4E9F7" />
            <stop offset="1" stopColor="#D9C3E4" />
          </radialGradient>
        </defs>
        <path d="M50 92 C12 80 2 45 14 22 C30 40 44 62 50 92Z" fill="#4A1D5E" />
        <path d="M50 92 C88 80 98 45 86 22 C70 40 56 62 50 92Z" fill="#F26D5B" />
        <circle cx="50" cy="40" r="21" fill="url(#pearl)" stroke="#F5B83D" strokeWidth="2" />
        <circle cx="42.6" cy="32.6" r="3.8" fill="#FFFFFF" />
      </svg>
      {wordmark && (
        <span className={`font-display text-2xl font-semibold tracking-tight ${light ? "text-white" : "text-plum"}`}>ikirezi</span>
      )}
    </span>
  );
}

const SKIN = ["#5B3A29", "#7A4B32", "#9C6644", "#B9825C", "#3E2619", "#C89A75"];
const BG = ["#FDE4DF", "#EFE6F5", "#DDF1EE", "#FDF0D3"];
const TOP = ["#4A1D5E", "#F26D5B", "#1F8A82", "#7B3F98"];

export function Avatar({ id = "pearl-1", size = 40 }: { id?: string; size?: number }) {
  const n = Number(id.split("-").pop()) || 1;
  const pro = id.startsWith("pro");
  const skin = SKIN[n % SKIN.length];
  const style = n % 4;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 rounded-full" aria-hidden>
      <clipPath id={`c-${id}-${size}`}>
        <circle cx="50" cy="50" r="50" />
      </clipPath>
      <g clipPath={`url(#c-${id}-${size})`}>
        <rect width="100" height="100" fill={pro ? "#DDF1EE" : BG[n % 4]} />
        {style === 0 && <circle cx="50" cy="36" r="30" fill="#1B1210" />}
        {style === 1 && (
          <>
            <circle cx="50" cy="16" r="14" fill="#2E1D17" />
            <ellipse cx="50" cy="40" rx="26" ry="21" fill="#2E1D17" />
          </>
        )}
        {style === 2 && (
          <>
            <ellipse cx="50" cy="28" rx="29" ry="17" fill={TOP[(n + 1) % 4]} />
            <circle cx="66" cy="17" r="9" fill={TOP[(n + 1) % 4]} />
          </>
        )}
        {style === 3 && (
          <>
            <ellipse cx="50" cy="42" rx="28" ry="25" fill="#120B09" />
            {[26, 38, 50, 62, 74].map((x) => (
              <rect key={x} x={x - 3} y="45" width="6" height="36" rx="3" fill="#120B09" />
            ))}
          </>
        )}
        <rect x="42" y="62" width="16" height="16" rx="4" fill={skin} />
        <ellipse cx="50" cy="47" rx="19" ry="22" fill={skin} />
        <ellipse cx="50" cy="102" rx="40" ry="26" fill={pro ? "#FFFFFF" : TOP[n % 4]} />
        {pro && <path d="M35 84 A15 10 0 0 0 65 84" stroke="#1F8A82" strokeWidth="3.5" fill="none" />}
        <circle cx="43" cy="46" r="2.5" fill="#1B1210" />
        <circle cx="57" cy="46" r="2.5" fill="#1B1210" />
        <path d="M45 54 Q50 58 55 54" stroke="#7A2E2E" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
