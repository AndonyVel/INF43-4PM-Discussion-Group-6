// Small atomic UI pieces shared across views.

const Pill = ({ children, tone = "default", style }) => {
  const tones = {
    default:  { bg: "rgba(170,180,192,0.08)", color: "var(--text-2)", border: "1px solid var(--line)" },
    submitted:{ bg: "rgba(123,207,148,0.12)", color: "var(--ok)",     border: "1px solid rgba(123,207,148,0.3)" },
    "in-progress": { bg: "rgba(228,179,99,0.13)", color: "var(--accent)", border: "1px solid rgba(228,179,99,0.35)" },
    planned:  { bg: "rgba(111,122,135,0.10)", color: "var(--muted)",  border: "1px solid var(--line)" },
    accent:   { bg: "rgba(228,179,99,0.14)",  color: "var(--accent)", border: "1px solid rgba(228,179,99,0.3)" },
  };
  return (
    <span className="mono" style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 9px", borderRadius: 999, fontSize: 11,
      letterSpacing: 0.4, textTransform: "uppercase",
      ...tones[tone] || tones.default, ...style,
    }}>{children}</span>
  );
};

const Avatar = ({ member, size = 32, ring = false }) => (
  <div title={member.name} style={{
    width: size, height: size, borderRadius: 999,
    background: `linear-gradient(135deg, ${member.color}, ${member.color}aa)`,
    color: "#0c0f13",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: size * 0.36, letterSpacing: 0.5,
    fontFamily: "'JetBrains Mono', monospace",
    boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 3px ${member.color}55` : "none",
    flexShrink: 0,
  }}>{member.initials}</div>
);

const AvatarStack = ({ ids, size = 24 }) => (
  <div style={{ display: "inline-flex" }}>
    {ids.map((id, i) => {
      const m = MEMBERS.find(x => x.id === id);
      if (!m) return null;
      return <div key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
        <Avatar member={m} size={size} ring />
      </div>;
    })}
  </div>
);

const Card = ({ children, style, padded = true, interactive = false, onClick }) => (
  <div onClick={onClick} style={{
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: padded ? 20 : 0,
    cursor: interactive ? "pointer" : "default",
    transition: "border-color .15s, transform .15s",
    ...(interactive ? { ":hover": { borderColor: "var(--line-2)" } } : {}),
    ...style,
  }}
  onMouseEnter={(e) => { if (interactive) e.currentTarget.style.borderColor = "var(--line-2)"; }}
  onMouseLeave={(e) => { if (interactive) e.currentTarget.style.borderColor = "var(--line)"; }}
  >{children}</div>
);

const SectionLabel = ({ children, right }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 14,
  }}>
    <div className="mono" style={{
      fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
      color: "var(--muted)",
      display: "inline-flex", alignItems: "center", gap: 10,
    }}>
      <span style={{ width: 18, height: 1, background: "var(--line-2)" }}></span>
      {children}
    </div>
    {right}
  </div>
);

// Tiny logical glyphs — not illustrations, just marks.
const Glyph = {
  Dot: ({ color = "var(--text-2)", size = 6 }) => (
    <span style={{ width: size, height: size, borderRadius: 999, background: color, display: "inline-block" }}></span>
  ),
  Check: ({ size = 12, color = "var(--ok)" }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.2L5 8.5L9.5 3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Empty: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="var(--line-2)" strokeWidth="1.2"/>
    </svg>
  ),
  Arrow: ({ size = 12, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <path d="M3 6h6m0 0L6.5 3.5M9 6L6.5 8.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Branch: ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="3.5" cy="3" r="1.6" stroke={color} strokeWidth="1.2"/>
      <circle cx="3.5" cy="11" r="1.6" stroke={color} strokeWidth="1.2"/>
      <circle cx="10.5" cy="3" r="1.6" stroke={color} strokeWidth="1.2"/>
      <path d="M3.5 4.6v4.8M3.5 7c0-2 3.5-2.5 3.5-4" stroke={color} strokeWidth="1.2"/>
    </svg>
  ),
};

Object.assign(window, { Pill, Avatar, AvatarStack, Card, SectionLabel, Glyph });
