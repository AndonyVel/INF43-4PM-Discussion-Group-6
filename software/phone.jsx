// SportsZone — the interactive iPhone prototype.

const { useState: usePhoneState, useEffect: usePhoneEffect, useRef: usePhoneRef } = React;

const sportOf  = (id) => SPORTS.find(s => s.id === id);
const personOf = (id) => PEOPLE.find(p => p.id === id);

const DEFAULT_FILTERS = {
  sports: [],
  distance: 10,
  skill: [],
  availability: "Any",
};

/* ── map helpers ── */
const USER_COORDS = [33.6405, -117.8443]; // UCI area

const COURT_COORDS = {
  "ARC Court 3":   [33.6486, -117.8425],
  "Aldrich Park":  [33.6459, -117.8428],
  "Heritage Park": [33.6608, -117.8284],
};

function coordsFor(playerId, distanceMi) {
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) hash = (hash * 31 + playerId.charCodeAt(i)) & 0xffff;
  const angle = (hash / 0xffff) * Math.PI * 2;
  const latOff = Math.sin(angle) * (distanceMi / 69);
  const lngOff = Math.cos(angle) * (distanceMi / (69 * Math.cos(USER_COORDS[0] * Math.PI / 180)));
  return [USER_COORDS[0] + latOff, USER_COORDS[1] + lngOff];
}

/* ───────────────────────────  PHONE  ─────────────────────────── */

function Phone({ screen, setScreen, selected, setSelected, accent }) {
  const [filters, setFilters]       = usePhoneState(DEFAULT_FILTERS);
  const [planDetails, setPlanDetails] = usePhoneState(null);

  const applyFilters  = (f) => { if (f) setFilters(f); setScreen("discover"); };
  const handleAgain   = (id) => { const p = personOf(id); if (p) { setSelected(p); setScreen("match"); } };
  const handleViewMap = (d) => { setPlanDetails(d); setScreen("map"); };

  const person = selected || PEOPLE[1];

  let body;
  switch (screen) {
    case "onboard":       body = <ScreenOnboard       accent={accent} onContinue={() => setScreen("discover")} />; break;
    case "filters":       body = <ScreenFilters        accent={accent} filters={filters} onDone={applyFilters} />; break;
    case "match":         body = <ScreenMatch          accent={accent} person={person} onChat={() => setScreen("chat")} onPlan={() => setScreen("plan")} onBack={() => setScreen("discover")} />; break;
    case "chat":          body = <ScreenChat           accent={accent} person={person} onBack={() => setScreen("match")} onPlan={() => setScreen("plan")} />; break;
    case "plan":          body = <ScreenPlan           accent={accent} person={person} onBack={() => setScreen("chat")} onConfirm={() => setScreen("chat")} onViewMap={handleViewMap} />; break;
    case "map":           body = <ScreenMap            accent={accent} person={person} planDetails={planDetails || { court: "ARC Court 3", time: "8 PM" }} onBack={() => setScreen("plan")} onShareLocation={() => setScreen("sharelocation")} />; break;
    case "sharelocation": body = <ScreenShareLocation  accent={accent} person={person} onBack={() => setScreen("map")} />; break;
    case "profile":       body = <ScreenProfile        accent={accent} />; break;
    case "history":       body = <ScreenHistory        accent={accent} onAgain={handleAgain} />; break;
    default:              body = <ScreenDiscover       accent={accent} filters={filters} onOpenFilters={() => setScreen("filters")} onPick={(p) => { setSelected(p); setScreen("match"); }} />;
  }

  const showTabs    = ["discover", "profile", "history"].includes(screen);
  const showChatTab = ["chat"].includes(screen);

  return (
    <IOSDevice dark>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        background: "#0a0d12", color: "#fff",
        fontFamily: '-apple-system, "SF Pro", "Inter", system-ui, sans-serif',
        overflow: "hidden", paddingTop: 58,
      }}>
        <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
          {body}
        </div>
        {(showTabs || showChatTab) && <PhoneTabBar screen={screen} setScreen={setScreen} accent={accent} />}
      </div>
    </IOSDevice>
  );
}

/* ── tab bar ── */
function PhoneTabBar({ screen, setScreen, accent }) {
  const tabs = [
    { id: "discover", label: "Discover", icon: PhoneIcons.compass },
    { id: "chat",     label: "Chats",    icon: PhoneIcons.chat, badge: 1 },
    { id: "history",  label: "History",  icon: PhoneIcons.clock },
    { id: "profile",  label: "You",      icon: PhoneIcons.user },
  ];
  const active = screen === "match" ? "discover" : screen === "plan" ? "chat" : screen;
  return (
    <div style={{ padding: "8px 16px 24px", background: "linear-gradient(to top, rgba(10,13,18,1) 60%, rgba(10,13,18,0))" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        background: "rgba(28,34,46,0.85)", border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)", borderRadius: 28, padding: 6,
      }}>
        {tabs.map(t => {
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => setScreen(t.id)} style={{
              background: on ? accent : "transparent",
              color: on ? "#0a0d12" : "rgba(255,255,255,0.7)",
              border: "none", borderRadius: 22, padding: "10px 0",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              fontSize: 10.5, fontWeight: 600, cursor: "pointer", transition: "all .15s", position: "relative",
            }}>
              <t.icon size={20} color={on ? "#0a0d12" : "rgba(255,255,255,0.85)"} />
              <span>{t.label}</span>
              {t.badge && !on && (
                <span style={{ position: "absolute", top: 8, right: "30%", width: 7, height: 7, borderRadius: 999, background: accent }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────  SCREEN: DISCOVER  ─────────────────────────── */

function ScreenDiscover({ accent, filters, onOpenFilters, onPick }) {
  const { sports, distance, skill, availability } = filters;

  const visible = PEOPLE.filter(p => {
    if (sports.length > 0 && !sports.includes(p.sport)) return false;
    if (p.distance > distance) return false;
    if (skill.length > 0 && !skill.includes(p.skill)) return false;
    if (availability === "Today"    && !p.when.includes("Tonight") && !p.when.includes("Today"))    return false;
    if (availability === "Tomorrow" && !p.when.includes("Tomorrow")) return false;
    if (availability === "Weekend"  && !p.when.includes("Sat") && !p.when.includes("Sun")) return false;
    return true;
  });

  const sportChips = sports.length > 0 ? sports.map(id => sportOf(id)).filter(Boolean) : [];
  const skillLabel = skill.length === 0 ? null
    : skill.length === 1 ? skill[0]
    : `${skill[0].slice(0, 3)}–${skill[skill.length - 1].slice(0, 3)}.`;

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "4px 0 100px" }}>
      <div style={{ padding: "8px 20px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Tonight near you</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Discover</div>
          </div>
          <button onClick={onOpenFilters} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", padding: "9px 14px", borderRadius: 999,
            display: "inline-flex", alignItems: "center", gap: 7,
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <PhoneIcons.sliders size={14} color="#fff" /> Filters
          </button>
        </div>
      </div>

      {/* live filter chips */}
      <div className="no-bar" style={{ padding: "14px 20px 12px", display: "flex", gap: 8, overflow: "auto" }}>
        {sportChips.length > 0
          ? sportChips.map(s => <Chip key={s.id} active accent={accent}>{s.short} {s.label}</Chip>)
          : <Chip accent={accent}>All sports</Chip>
        }
        <Chip accent={accent}>≤ {distance < 1 ? distance.toFixed(1) : Math.round(distance)} mi</Chip>
        {skillLabel && <Chip accent={accent}>{skillLabel}</Chip>}
        {availability !== "Any" && <Chip accent={accent}>{availability}</Chip>}
      </div>

      {/* live count */}
      <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          width: 6, height: 6, borderRadius: 999, background: accent,
          boxShadow: `0 0 0 3px ${accent}33`, animation: "pulse 1.6s infinite",
        }} />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          {visible.length > 0
            ? <><b style={{ color: "#fff" }}>{visible.length} player{visible.length !== 1 ? "s" : ""}</b> looking right now</>
            : <span style={{ color: "rgba(255,255,255,0.45)" }}>No players match your filters</span>
          }
        </span>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.length > 0
          ? visible.map(p => <PlayerCard key={p.id} p={p} accent={accent} onClick={() => onPick(p)} />)
          : (
            <div style={{ textAlign: "center", padding: "44px 20px", color: "rgba(255,255,255,0.3)", fontSize: 13, lineHeight: 1.7 }}>
              <div style={{ fontSize: 34, marginBottom: 10 }}>🔍</div>
              No players match your filters.<br />Try adjusting distance or skill.
            </div>
          )
        }
      </div>
    </div>
  );
}

function Chip({ children, active, accent }) {
  return (
    <span style={{
      flexShrink: 0, padding: "8px 13px", borderRadius: 999,
      background: active ? accent : "rgba(255,255,255,0.05)",
      color: active ? "#0a0d12" : "rgba(255,255,255,0.85)",
      border: active ? `1px solid ${accent}` : "1px solid rgba(255,255,255,0.08)",
      fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function PlayerCard({ p, accent, onClick }) {
  const s = sportOf(p.sport);
  return (
    <button onClick={onClick} style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18, padding: 14, display: "flex", gap: 12, alignItems: "center",
      cursor: "pointer", textAlign: "left", width: "100%", color: "#fff", fontFamily: "inherit",
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: 14,
        background: `linear-gradient(135deg, ${p.color}, ${p.color}99)`,
        color: "#0a0d12", fontWeight: 800, fontSize: 18,
        display: "grid", placeItems: "center", flexShrink: 0,
        fontFamily: "'JetBrains Mono', monospace",
      }}>{p.initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</span>
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>· {p.age}</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{s.short} {s.label} · {p.skill}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: accent, fontWeight: 700 }}>{p.distance} mi</span>
          <span style={{ width: 3, height: 3, borderRadius: 99, background: "rgba(255,255,255,0.25)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{p.when}</span>
        </div>
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 999,
        border: `1px solid ${accent}`, color: accent,
        display: "grid", placeItems: "center", flexShrink: 0,
      }}>
        <PhoneIcons.arrow size={14} color={accent} />
      </div>
    </button>
  );
}

/* ───────────────────────────  SCREEN: FILTERS  ─────────────────────────── */

function ScreenFilters({ accent, filters, onDone }) {
  const [selectedSports, setSports]       = usePhoneState(filters.sports);
  const [distance, setDistance]           = usePhoneState(filters.distance);
  const [skill, setSkill]                 = usePhoneState(filters.skill);
  const [availability, setAvailability]   = usePhoneState(filters.availability);

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "8px 20px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0 18px" }}>
        <button onClick={() => onDone(null)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: 0 }}>Cancel</button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>Filters</span>
        <button onClick={() => onDone({ sports: selectedSports, distance, skill, availability })} style={{ background: "transparent", border: "none", color: accent, fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0 }}>Apply</button>
      </div>

      <FilterSection title="Sport" sub="Pick one or many">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {SPORTS.map(s => {
            const on = selectedSports.includes(s.id);
            return (
              <button key={s.id} onClick={() => setSports(on ? selectedSports.filter(x => x !== s.id) : [...selectedSports, s.id])} style={{
                aspectRatio: "1 / 1", borderRadius: 14,
                background: on ? accent : "rgba(255,255,255,0.04)",
                border: `1px solid ${on ? accent : "rgba(255,255,255,0.08)"}`,
                color: on ? "#0a0d12" : "#fff",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                fontSize: 10.5, fontWeight: 600, cursor: "pointer",
              }}>
                <span style={{ fontSize: 20 }}>{s.short}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Distance" sub={`Within ${distance < 1 ? distance.toFixed(1) : Math.round(distance)} mi`}>
        <input type="range" min="0.5" max="50" step="0.5" value={distance}
          onChange={(e) => setDistance(parseFloat(e.target.value))}
          style={{ width: "100%", accentColor: accent }} />
        <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.4)", fontSize: 10.5, marginTop: 4 }}>
          <span>0.5 mi</span><span>50 mi</span>
        </div>
      </FilterSection>

      <FilterSection title="Skill level" sub="Multi-select">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SKILLS.map(k => {
            const on = skill.includes(k);
            return (
              <button key={k} onClick={() => setSkill(on ? skill.filter(x => x !== k) : [...skill, k])} style={{
                padding: "9px 14px", borderRadius: 999,
                background: on ? accent : "rgba(255,255,255,0.05)",
                color: on ? "#0a0d12" : "rgba(255,255,255,0.85)",
                border: `1px solid ${on ? accent : "rgba(255,255,255,0.08)"}`,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}>{k}</button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Availability" sub="When you're free">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {["Today", "Tomorrow", "This week", "Weekend", "Next week", "Any"].map((w) => {
            const on = availability === w;
            return (
              <button key={w} onClick={() => setAvailability(w)} style={{
                padding: "11px 0", borderRadius: 12,
                background: on ? `${accent}22` : "rgba(255,255,255,0.04)",
                color: on ? accent : "rgba(255,255,255,0.8)",
                border: `1px solid ${on ? accent : "rgba(255,255,255,0.08)"}`,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
              }}>{w}</button>
            );
          })}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({ title, sub, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{sub}</span>
      </div>
      {children}
    </div>
  );
}

/* ───────────────────────────  SCREEN: MATCH DETAIL  ─────────────────────────── */

function ScreenMatch({ accent, person, onChat, onPlan, onBack }) {
  const s = sportOf(person.sport);
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "4px 0 28px" }}>
      <div style={{ padding: "4px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <PhoneIcons.back size={14} color="rgba(255,255,255,0.7)" /> Discover
        </button>
        <button style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer", padding: 0 }}>⋯</button>
      </div>

      <div style={{ textAlign: "center", padding: "20px 24px 0" }}>
        <div style={{
          width: 96, height: 96, borderRadius: 26, margin: "0 auto",
          background: `linear-gradient(135deg, ${person.color}, ${person.color}aa)`,
          color: "#0a0d12", fontWeight: 800, fontSize: 32,
          display: "grid", placeItems: "center",
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: `0 12px 32px ${person.color}33`,
        }}>{person.initials}</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 14 }}>{person.name}</div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{person.age} · {person.skill} · {person.distance} mi away</div>
      </div>

      <div style={{ padding: "22px 20px 0" }}>
        <div style={{ border: `1px solid ${accent}`, background: `linear-gradient(180deg, ${accent}1a, transparent)`, borderRadius: 18, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: accent, fontFamily: "'JetBrains Mono', monospace" }}>SUGGESTED MATCH</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>96% fit</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>{s.short}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{person.when}</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>📍 {person.court}</div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>"{person.note}"</div>
        </div>
      </div>

      <div style={{ padding: "22px 20px 0" }}>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", letterSpacing: 1, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Also plays</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["tennis", "pickleball"].map(id => {
            const x = sportOf(id);
            return <span key={id} style={{ padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{x.short} {x.label}</span>;
          })}
        </div>
      </div>

      <div style={{ padding: "26px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button onClick={onChat} style={{
          padding: "14px 0", borderRadius: 14,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <PhoneIcons.chat size={16} color="#fff" /> Message
        </button>
        <button onClick={onPlan} style={{
          padding: "14px 0", borderRadius: 14,
          background: accent, border: "none",
          color: "#0a0d12", fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          Plan to meet <PhoneIcons.arrow size={14} color="#0a0d12" />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────  SCREEN: CHAT  ─────────────────────────── */

function ScreenChat({ accent, person, onBack, onPlan }) {
  const [messages, setMessages] = usePhoneState([...CHAT]);
  const [draft, setDraft]       = usePhoneState("");
  const scrollRef               = usePhoneRef(null);

  usePhoneEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { from: "me", time, text }]);
    setDraft("");
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 18, cursor: "pointer", padding: 4 }}>‹</button>
        <div style={{
          width: 34, height: 34, borderRadius: 99,
          background: person.color, color: "#0a0d12",
          fontWeight: 800, fontSize: 12, display: "grid", placeItems: "center",
          fontFamily: "'JetBrains Mono', monospace",
        }}>{person.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{person.name}</div>
          <div style={{ fontSize: 11, color: accent }}>● active now</div>
        </div>
        <button onClick={onPlan} style={{
          background: `${accent}1e`, border: `1px solid ${accent}55`, color: accent,
          padding: "6px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
        }}>Plan meet</button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "10px 14px", textAlign: "center",
          fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginBottom: 16,
        }}>
          Matched for <span style={{ color: "#fff", fontWeight: 600 }}>Basketball</span> · Tonight 8 PM
        </div>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", marginBottom: 8 }}>
            <div style={{
              maxWidth: "75%", padding: "9px 13px", borderRadius: 18,
              background: m.from === "me" ? accent : "rgba(255,255,255,0.07)",
              color: m.from === "me" ? "#0a0d12" : "#fff",
              fontSize: 13.5, lineHeight: 1.35,
              borderBottomRightRadius: m.from === "me" ? 6 : 18,
              borderBottomLeftRadius:  m.from === "me" ? 18 : 6,
            }}>{m.text}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={onPlan} style={{
          width: 38, height: 38, borderRadius: 99, flexShrink: 0,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", fontSize: 18, cursor: "pointer", padding: 0,
        }}>+</button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Message…"
          style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 999, padding: "9px 14px",
            color: "#fff", fontSize: 13.5, outline: "none", fontFamily: "inherit",
          }}
        />
        {draft.trim() && (
          <button onClick={send} style={{
            width: 38, height: 38, borderRadius: 99, flexShrink: 0,
            background: accent, border: "none", color: "#0a0d12",
            cursor: "pointer", padding: 0, display: "grid", placeItems: "center",
          }}>
            <PhoneIcons.arrow size={16} color="#0a0d12" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────  SCREEN: PLAN MEETUP  ─────────────────────────── */

function ScreenPlan({ accent, person, onBack, onConfirm, onViewMap }) {
  const [time, setTime]       = usePhoneState("8 PM");
  const [court, setCourt]     = usePhoneState("ARC Court 3");
  const [duration, setDuration] = usePhoneState("1h");
  const [sent, setSent]       = usePhoneState(false);

  const times    = ["7 PM", "7:30", "8 PM", "8:30", "9 PM"];
  const courts   = ["ARC Court 3", "Aldrich Park", "Heritage Park"];
  const durations = ["30m", "1h", "1h 30m", "2h"];
  const courtDist = { "ARC Court 3": "0.8 mi", "Aldrich Park": "0.4 mi", "Heritage Park": "0.9 mi" };

  if (sent) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 99,
          background: `${accent}22`, border: `2px solid ${accent}`,
          display: "grid", placeItems: "center", marginBottom: 20,
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M6 14.5L11.5 20L22 9" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Proposal sent!</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginBottom: 28 }}>
          {person.name.split(" ")[0]} will see your request for<br />
          <span style={{ color: "#fff", fontWeight: 600 }}>{time}</span> at <span style={{ color: "#fff", fontWeight: 600 }}>{court}</span>
        </div>
        <button onClick={() => onViewMap && onViewMap({ time, court, duration })} style={{
          width: "100%", padding: "15px 0", borderRadius: 14,
          background: accent, color: "#0a0d12", border: "none",
          fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>📍 View on Map</button>
        <button onClick={onConfirm} style={{
          width: "100%", padding: "13px 0", borderRadius: 14,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 600, cursor: "pointer",
        }}>Back to chat</button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "6px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer", padding: 0 }}>Cancel</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Propose meetup</span>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 20px" }}>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 16, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 99,
            background: person.color, color: "#0a0d12",
            fontWeight: 800, fontSize: 14, display: "grid", placeItems: "center",
            fontFamily: "'JetBrains Mono', monospace",
          }}>{person.initials}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>With {person.name}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>
              {sportOf(person.sport)?.short} {sportOf(person.sport)?.label}
            </div>
          </div>
        </div>

        <PlanSection title="When">
          <div className="no-bar" style={{ display: "flex", gap: 8, overflow: "auto", margin: "0 -4px", padding: "0 4px" }}>
            {times.map(t => (
              <button key={t} onClick={() => setTime(t)} style={{
                padding: "10px 16px", borderRadius: 12, flexShrink: 0,
                background: time === t ? accent : "rgba(255,255,255,0.05)",
                color: time === t ? "#0a0d12" : "#fff",
                border: `1px solid ${time === t ? accent : "rgba(255,255,255,0.08)"}`,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>{t}</button>
            ))}
          </div>
        </PlanSection>

        <PlanSection title="Where">
          {courts.map(c => (
            <button key={c} onClick={() => setCourt(c)} style={{
              width: "100%", textAlign: "left",
              padding: "12px 14px", borderRadius: 12, marginBottom: 8,
              background: court === c ? `${accent}14` : "rgba(255,255,255,0.04)",
              border: `1px solid ${court === c ? accent : "rgba(255,255,255,0.07)"}`,
              color: "#fff", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "inherit",
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{courtDist[c]} · open courts</div>
              </div>
              {court === c && <span style={{ color: accent, fontSize: 16 }}>●</span>}
            </button>
          ))}
        </PlanSection>

        <PlanSection title="Duration">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {durations.map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                padding: "11px 0", borderRadius: 12,
                background: duration === d ? accent : "rgba(255,255,255,0.05)",
                color: duration === d ? "#0a0d12" : "#fff",
                border: `1px solid ${duration === d ? accent : "rgba(255,255,255,0.08)"}`,
                fontSize: 12.5, fontWeight: 700, cursor: "pointer",
              }}>{d}</button>
            ))}
          </div>
        </PlanSection>
      </div>

      <div style={{ padding: "12px 20px 16px" }}>
        <button onClick={() => setSent(true)} style={{
          width: "100%", padding: "15px 0", borderRadius: 14,
          background: accent, color: "#0a0d12", border: "none",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}>Send proposal to {person.name.split(" ")[0]} →</button>
      </div>
    </div>
  );
}

function PlanSection({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1.2, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

/* ───────────────────────────  SCREEN: MAP  ─────────────────────────── */

function ScreenMap({ accent, person, planDetails, onBack, onShareLocation }) {
  const mapDivRef   = usePhoneRef(null);
  const leafletRef  = usePhoneRef(null);

  usePhoneEffect(() => {
    if (!mapDivRef.current || leafletRef.current || typeof L === "undefined") return;

    const courtCoords  = COURT_COORDS[planDetails.court] || COURT_COORDS["ARC Court 3"];
    const playerCoords = coordsFor(person.id, person.distance);

    const map = L.map(mapDivRef.current, { zoomControl: false, attributionControl: false })
      .setView(courtCoords, 14);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 })
      .addTo(map);

    /* "You" dot */
    L.marker(USER_COORDS, {
      icon: L.divIcon({
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${accent};border:2px solid #0a0d12;box-shadow:0 0 0 4px ${accent}44;"></div>`,
        className: "", iconSize: [12, 12], iconAnchor: [6, 6],
      }),
    }).addTo(map).bindTooltip("You", { permanent: true, offset: [10, 0], className: "" });

    /* meeting point */
    L.marker(courtCoords, {
      icon: L.divIcon({
        html: `<div style="width:38px;height:38px;border-radius:50%;background:${accent};border:2px solid #0a0d12;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#0a0d12;font-family:'JetBrains Mono',monospace;">${person.initials}</div>`,
        className: "", iconSize: [38, 38], iconAnchor: [19, 19],
      }),
    }).addTo(map);

    /* player fuzzy dot */
    L.marker(playerCoords, {
      icon: L.divIcon({
        html: `<div style="width:9px;height:9px;border-radius:50%;background:${person.color};border:1.5px solid #0a0d12;opacity:0.75;"></div>`,
        className: "", iconSize: [9, 9], iconAnchor: [4, 4],
      }),
    }).addTo(map);

    /* dashed route line */
    L.polyline([USER_COORDS, courtCoords], {
      color: accent, weight: 1.5, dashArray: "5,8", opacity: 0.55,
    }).addTo(map);

    setTimeout(() => map.invalidateSize(), 120);
    leafletRef.current = map;

    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "8px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <PhoneIcons.back size={14} color="rgba(255,255,255,0.7)" /> Back
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Meeting Spot</span>
        <button onClick={onShareLocation} style={{
          background: `${accent}1e`, border: `1px solid ${accent}55`,
          color: accent, padding: "6px 11px", borderRadius: 999,
          fontSize: 11.5, fontWeight: 700, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>📍 Share</button>
      </div>

      <div ref={mapDivRef} style={{ flex: 1, position: "relative" }} />

      <div style={{ padding: "14px 16px 16px", background: "rgba(10,13,18,0.96)", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: person.color, color: "#0a0d12",
            fontWeight: 800, fontSize: 13, display: "grid", placeItems: "center",
            fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
          }}>{person.initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{planDetails.court}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
              {planDetails.time} · with {person.name.split(" ")[0]} · {person.distance} mi
            </div>
          </div>
          <button onClick={onShareLocation} style={{
            background: accent, border: "none", color: "#0a0d12",
            padding: "9px 13px", borderRadius: 999,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>Share location</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────  SCREEN: SHARE LOCATION  ─────────────────────────── */

function ScreenShareLocation({ accent, person, onBack }) {
  const [duration, setDuration] = usePhoneState("1 hour");
  const [selected, setSelected] = usePhoneState([person.id]);
  const [shared,   setShared]   = usePhoneState(false);

  const durations = ["30 min", "1 hour", "2 hours", "Until I stop"];

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  if (shared) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📍</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Location shared!</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, marginBottom: 32 }}>
          Sharing for <span style={{ color: "#fff", fontWeight: 600 }}>{duration}</span><br />
          with <span style={{ color: "#fff", fontWeight: 600 }}>{selected.length} {selected.length === 1 ? "person" : "people"}</span>
        </div>
        <button onClick={onBack} style={{
          width: "100%", padding: "15px 0", borderRadius: 14,
          background: accent, color: "#0a0d12", border: "none",
          fontSize: 15, fontWeight: 700, cursor: "pointer",
        }}>Done</button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "8px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 14, cursor: "pointer", padding: 0 }}>Cancel</button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Share Location</span>
        <span style={{ width: 50 }} />
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1.2, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Share for</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {durations.map(d => {
              const on = duration === d;
              return (
                <button key={d} onClick={() => setDuration(d)} style={{
                  padding: "12px 0", borderRadius: 12,
                  background: on ? `${accent}22` : "rgba(255,255,255,0.04)",
                  color: on ? accent : "rgba(255,255,255,0.8)",
                  border: `1px solid ${on ? accent : "rgba(255,255,255,0.08)"}`,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>{d}</button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1.2, fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>Share with</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PEOPLE.slice(0, 8).map(p => {
              const on = selected.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggle(p.id)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 12,
                  background: on ? `${accent}14` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${on ? accent : "rgba(255,255,255,0.07)"}`,
                  cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 99,
                    background: p.color, color: "#0a0d12",
                    fontWeight: 800, fontSize: 11, display: "grid", placeItems: "center",
                    fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                  }}>{p.initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{sportOf(p.sport)?.label} · {p.distance} mi</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `1.5px solid ${on ? accent : "rgba(255,255,255,0.2)"}`,
                    background: on ? accent : "transparent",
                    display: "grid", placeItems: "center",
                  }}>
                    {on && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="#0a0d12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 20px 16px", flexShrink: 0 }}>
        <button
          onClick={() => { if (selected.length > 0) setShared(true); }}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 14,
            background: selected.length > 0 ? accent : "rgba(255,255,255,0.1)",
            color: selected.length > 0 ? "#0a0d12" : "rgba(255,255,255,0.3)",
            border: "none", fontSize: 15, fontWeight: 700,
            cursor: selected.length > 0 ? "pointer" : "default",
          }}>
          {selected.length === 0 ? "Select people first" : `Share with ${selected.length} ${selected.length === 1 ? "person" : "people"}`}
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────  SCREEN: PROFILE / PRIVACY  ─────────────────────────── */

function ScreenProfile({ accent }) {
  const [discoverable, setDiscoverable] = usePhoneState(true);
  const [precision, setPrecision]       = usePhoneState("neighborhood");
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "8px 0 110px" }}>
      <div style={{ padding: "8px 20px 0" }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>You</div>
      </div>

      <div style={{ padding: "18px 20px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: `linear-gradient(135deg, ${accent}, ${accent}aa)`,
          color: "#0a0d12", fontWeight: 800, fontSize: 22,
          display: "grid", placeItems: "center", fontFamily: "'JetBrains Mono', monospace",
        }}>AV</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Andony</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>Age 22 · verified ✓</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>🏀 🎾 🥒</div>
        </div>
      </div>

      <div style={{ padding: "26px 20px 0" }}>
        <SectionHead>Privacy</SectionHead>
        <SettingsCard>
          <SettingsRow
            title="Discoverable to others"
            sub="When off, you won't appear in anyone's feed."
            control={<Toggle on={discoverable} onChange={setDiscoverable} accent={accent} />}
          />
          <Divider />
          <SettingsRow
            title="Location precision"
            sub={precision === "neighborhood" ? "Shown as a fuzzy blob (~½ mi radius)" : "Shown to nearest city"}
            control={
              <div style={{ display: "flex", gap: 4, padding: 3, background: "rgba(255,255,255,0.06)", borderRadius: 8 }}>
                {[["city", "City"], ["neighborhood", "~½ mi"]].map(([k, l]) => (
                  <button key={k} onClick={() => setPrecision(k)} style={{
                    padding: "5px 10px", borderRadius: 6, border: "none",
                    background: precision === k ? accent : "transparent",
                    color: precision === k ? "#0a0d12" : "rgba(255,255,255,0.8)",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}>{l}</button>
                ))}
              </div>
            }
          />
        </SettingsCard>

        <div style={{
          marginTop: 14, height: 130, borderRadius: 14,
          background: "linear-gradient(180deg, #1a2230, #131820)",
          border: "1px solid rgba(255,255,255,0.07)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",
            backgroundSize: "16px 16px",
          }} />
          <div style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)",
            width: precision === "neighborhood" ? 100 : 200,
            height: precision === "neighborhood" ? 100 : 200,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}55 0%, ${accent}22 50%, transparent 75%)`,
            border: `1px dashed ${accent}88`, transition: "all .3s",
          }} />
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 8, height: 8, borderRadius: 99, background: accent }} />
          <div style={{ position: "absolute", left: 12, top: 10, fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>What others see</div>
        </div>
      </div>

      <div style={{ padding: "22px 20px 0" }}>
        <SectionHead>Account</SectionHead>
        <SettingsCard>
          <SettingsRow title="Age verified"      sub="Confirmed via ID · Aug 12 2025"          control={<span style={{ color: accent, fontSize: 14 }}>✓</span>} />
          <Divider />
          <SettingsRow title="Sports & skill"    sub="3 subscribed · update anytime"           control={<span style={{ color: "rgba(255,255,255,0.4)" }}>›</span>} />
          <Divider />
          <SettingsRow title="Notifications"     sub="Match alerts · meetup reminders"         control={<span style={{ color: "rgba(255,255,255,0.4)" }}>›</span>} />
        </SettingsCard>
      </div>
    </div>
  );
}

const SectionHead   = ({ children }) => <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: 1.4, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>{children}</div>;
const SettingsCard  = ({ children }) => <div style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>{children}</div>;
const SettingsRow   = ({ title, sub, control }) => (
  <div style={{ display: "flex", alignItems: "center", padding: "13px 14px", gap: 12 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{sub}</div>}
    </div>
    {control}
  </div>
);
const Divider = () => <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginLeft: 14 }} />;
const Toggle  = ({ on, onChange, accent }) => (
  <button onClick={() => onChange(!on)} style={{
    width: 44, height: 26, borderRadius: 99,
    background: on ? accent : "rgba(255,255,255,0.15)",
    border: "none", padding: 0, cursor: "pointer", position: "relative", transition: "background .15s",
  }}>
    <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 22, height: 22, borderRadius: 99, background: "#fff", transition: "left .15s" }} />
  </button>
);

/* ───────────────────────────  SCREEN: HISTORY  ─────────────────────────── */

function ScreenHistory({ accent, onAgain }) {
  return (
    <div style={{ flex: 1, overflow: "auto", padding: "8px 0 110px" }}>
      <div style={{ padding: "8px 20px 18px" }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6 }}>History</div>
        <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>Sessions you've finished · tap Again to re-invite</div>
      </div>

      <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[["12", "sessions"], ["4", "new people"], ["8h 30m", "this month"]].map(([k, l]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: accent }}>{k}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", letterSpacing: 0.5 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {HISTORY.map((h, i) => {
          const s = sportOf(h.sport);
          const players = h.with.map(personOf).filter(Boolean);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0,
              }}>{s.short}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>{s.label} · {h.court}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                  {h.date} · {h.duration} · with {players.map(p => p.name.split(" ")[0]).join(", ")}
                </div>
              </div>
              <button onClick={() => onAgain(h.with[0])} style={{
                background: `${accent}18`, border: `1px solid ${accent}55`,
                color: accent, padding: "7px 11px", borderRadius: 999,
                fontSize: 11.5, fontWeight: 700, cursor: "pointer",
              }}>Again</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────────  SCREEN: ONBOARDING / AGE  ─────────────────────────── */

function ScreenOnboard({ accent, onContinue }) {
  const [month, setMonth] = usePhoneState("11");
  const [day,   setDay]   = usePhoneState("04");
  const [year,  setYear]  = usePhoneState("2003");

  const fieldStyle = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "13px 16px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
  };
  const inputStyle = {
    background: "transparent", border: "none", color: "#fff", outline: "none",
    fontSize: 15, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
    width: 70, textAlign: "right",
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 24px 24px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center" }}>
        <div style={{
          width: 76, height: 76, borderRadius: 22, margin: "0 auto 22px",
          background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
          color: "#0a0d12", display: "grid", placeItems: "center",
          fontSize: 30, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace",
        }}>SZ</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginBottom: 10 }}>Verify your age</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, maxWidth: 280, margin: "0 auto 28px" }}>
          SportsZone is for players 13+. We use this to keep matches age-appropriate and to unlock 18+ leagues later.
        </div>
        <div style={{ maxWidth: 240, margin: "0 auto", textAlign: "left", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={fieldStyle}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Month</span>
            <input type="number" min="1" max="12" value={month} onChange={e => setMonth(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Day</span>
            <input type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Year</span>
            <input type="number" min="1900" max="2025" value={year} onChange={e => setYear(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>
      <button onClick={onContinue} style={{
        width: "100%", padding: "15px 0", borderRadius: 14,
        background: accent, color: "#0a0d12", border: "none",
        fontSize: 15, fontWeight: 700, cursor: "pointer",
      }}>Continue</button>
      <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 12 }}>
        Your birthdate is stored encrypted and never shown publicly.
      </div>
    </div>
  );
}

/* ───────────────────────────  ICONS  ─────────────────────────── */

const PhoneIcons = {
  compass: ({ size = 16, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7"/>
      <path d="M16 8L13.5 13.5L8 16L10.5 10.5L16 8Z" fill={color}/>
    </svg>
  ),
  chat: ({ size = 16, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6.5C4 5.4 4.9 4.5 6 4.5H18C19.1 4.5 20 5.4 20 6.5V15C20 16.1 19.1 17 18 17H10L6 20.5V17C4.9 17 4 16.1 4 15V6.5Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  ),
  clock: ({ size = 16, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.7"/>
      <path d="M12 7V12L15.5 14.5" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  user: ({ size = 16, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="3.5" stroke={color} strokeWidth="1.7"/>
      <path d="M5 19.5C5.5 16 8.5 14 12 14C15.5 14 18.5 16 19 19.5" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  ),
  sliders: ({ size = 16, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 7H20M4 12H14M4 17H18" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
      <circle cx="17" cy="7"  r="2" fill="#0a0d12" stroke={color} strokeWidth="1.7"/>
      <circle cx="10" cy="12" r="2" fill="#0a0d12" stroke={color} strokeWidth="1.7"/>
      <circle cx="14" cy="17" r="2" fill="#0a0d12" stroke={color} strokeWidth="1.7"/>
    </svg>
  ),
  arrow: ({ size = 14, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  back: ({ size = 14, color = "#fff" }) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M11 7H3M3 7L6.5 3.5M3 7L6.5 10.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

Object.assign(window, { Phone, PhoneIcons });
