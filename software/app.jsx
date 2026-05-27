// SportsZone — page that hosts the interactive iPhone prototype.

const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#b8ff3d",
  "showTeamCredit": true,
  "showRequirementIds": true
}/*EDITMODE-END*/;

/* ───────────────────────────  TOP BAR  ─────────────────────────── */

function TopBar() {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 60,
      background: "rgba(10,13,18,0.85)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--line)",
    }}>
      <div style={{
        maxWidth: 1320, margin: "0 auto", padding: "14px 32px",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "var(--accent)", color: "#0a0d12",
            display: "grid", placeItems: "center",
            fontWeight: 900, fontSize: 13, letterSpacing: 0.5,
            fontFamily: "'JetBrains Mono', monospace",
          }}>SZ</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{BRAND.name}</div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 0.5 }}>INF 43 · Group 6</div>
          </div>
        </div>

        <div style={{ flex: 1 }}></div>

        <nav style={{ display: "flex", gap: 4 }}>
          {[["overview","Overview"],["prototype","Prototype"],["features","Features"],["team","Team"]].map(([id, label]) => (
            <a key={id} href={`#${id}`}
               style={{
                 padding: "8px 12px", borderRadius: 8,
                 color: "var(--text-2)", fontSize: 13, textDecoration: "none",
                 transition: "color .12s, background .12s",
               }}
               onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface)"; }}
               onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-2)"; e.currentTarget.style.background = "transparent"; }}>
              {label}
            </a>
          ))}
        </nav>

        <a href="#prototype" style={{
          padding: "8px 14px", borderRadius: 999,
          background: "var(--accent)", color: "#0a0d12",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
        }}>Try the prototype →</a>
      </div>
    </header>
  );
}

/* ───────────────────────────  HERO  ─────────────────────────── */

function Hero() {
  return (
    <section id="overview" className="field-bg" style={{
      padding: "84px 32px 96px",
      borderBottom: "1px solid var(--line)",
    }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <Pill tone="accent" style={{ marginBottom: 22 }}>SPRING 2026 · Discussion Group 6</Pill>

        <h1 style={{
          margin: "0 0 18px",
          fontSize: "clamp(56px, 8vw, 108px)",
          lineHeight: 0.95, letterSpacing: -2.5,
          fontWeight: 700, maxWidth: 1100, textWrap: "balance",
        }}>
          Find your <span style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontStyle: "italic", fontWeight: 400, color: "var(--accent)",
          }}>game</span>, not just your gear.
        </h1>

        <p style={{
          maxWidth: 640, fontSize: 18, lineHeight: 1.55,
          color: "var(--text-2)", margin: "0 0 36px",
        }}>
          {BRAND.pitch}
        </p>

        <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
          <a href="#prototype" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "14px 22px", borderRadius: 12,
            background: "var(--accent)", color: "#0a0d12",
            fontSize: 14.5, fontWeight: 700, textDecoration: "none",
          }}>
            Open the prototype <Glyph.Arrow size={14} color="#0a0d12"/>
          </a>
          <a href="#features" style={{
            color: "var(--text-2)", fontSize: 14, textDecoration: "none",
            borderBottom: "1px solid var(--line-2)", paddingBottom: 2,
          }}>Read the 8 functional requirements</a>
        </div>

        {/* footer of hero: scoreboard-style stats */}
        <div style={{
          marginTop: 80, paddingTop: 32,
          borderTop: "1px solid var(--line)",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32,
        }}>
          {[
            { k: "8", l: "Sport categories" },
            { k: "4", l: "Filter dimensions" },
            { k: "0", l: "Texts required" },
            { k: "iOS · Android", l: "Mobile, native" },
          ].map((s) => (
            <div key={s.l}>
              <div style={{
                fontSize: 36, fontWeight: 600, letterSpacing: -0.8,
                fontFamily: "'Instrument Serif', Georgia, serif",
              }}>{s.k}</div>
              <div className="mono" style={{ fontSize: 11, letterSpacing: 1.3, color: "var(--muted)", marginTop: 4, textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────  PROTOTYPE STAGE  ─────────────────────────── */

function PrototypeStage({ accent, showReqs }) {
  const [screen, setScreen] = useState("discover");
  const [selected, setSelected] = useState(null);

  // ordered screens for stepper
  const STEPS = [
    { id: "onboard",  label: "Age verify",      req: "REQ-F-07" },
    { id: "discover", label: "Discover feed",   req: "REQ-F-01" },
    { id: "filters",  label: "Filters",         req: "REQ-F-02" },
    { id: "match",    label: "Match detail",    req: "REQ-F-01" },
    { id: "chat",     label: "Chat",            req: "REQ-F-03" },
    { id: "plan",     label: "Plan meetup",     req: "REQ-F-04" },
    { id: "profile",  label: "Privacy",         req: "REQ-F-05·06" },
    { id: "history",  label: "History",         req: "REQ-F-08" },
  ];

  const activeFeature = FEATURES.find(f => f.showScreen === screen) || FEATURES[0];

  return (
    <section id="prototype" style={{
      background: "var(--bg-2)",
      padding: "84px 32px 96px",
      borderBottom: "1px solid var(--line)",
    }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <SectionLabel right={
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            tap inside the phone · or pick a screen →
          </span>
        }>Interactive prototype</SectionLabel>

        <div className="proto-grid" style={{ display: "grid", gridTemplateColumns: "minmax(200px, 240px) minmax(0, 1fr) minmax(0, 320px)", gap: 32, alignItems: "start", marginTop: 28 }}>
          {/* LEFT: screen list */}
          <aside>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 1.4, marginBottom: 14, textTransform: "uppercase" }}>Screens</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS.map((s, i) => {
                const on = screen === s.id || (screen === "match" && s.id === "discover" && false);
                const active = screen === s.id;
                return (
                  <button key={s.id} onClick={() => setScreen(s.id)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 10,
                    background: active ? "var(--surface-2)" : "transparent",
                    border: active ? "1px solid var(--line-2)" : "1px solid transparent",
                    color: active ? "var(--text)" : "var(--text-2)",
                    cursor: "pointer", textAlign: "left",
                    fontFamily: "inherit",
                    transition: "all .12s",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <span className="mono" style={{
                      fontSize: 11, color: active ? accent : "var(--muted)",
                      width: 22, letterSpacing: 0.5,
                    }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: active ? 600 : 500 }}>{s.label}</span>
                    {showReqs && <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{s.req}</span>}
                  </button>
                );
              })}
            </div>

            <div style={{
              marginTop: 24, padding: 16,
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 12,
            }}>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 8 }}>Tip</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
                Tap a player on the Discover feed inside the phone to open their match card, then try <b style={{ color: "var(--text)" }}>Plan to meet</b>.
              </div>
            </div>
          </aside>

          {/* CENTER: the phone */}
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            {/* radial glow behind the phone */}
            <div style={{
              position: "absolute", inset: "-40px",
              background: `radial-gradient(50% 50% at 50% 40%, ${accent}1a, transparent 70%)`,
              filter: "blur(20px)", pointerEvents: "none",
            }}></div>
            <div style={{ position: "relative" }}>
              <Phone screen={screen} setScreen={setScreen} selected={selected} setSelected={setSelected} accent={accent}/>
            </div>
          </div>

          {/* RIGHT: contextual explainer */}
          <aside>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 1.4, marginBottom: 14, textTransform: "uppercase" }}>Now showing</div>

            <div style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 14, padding: 22, position: "sticky", top: 88,
            }}>
              {showReqs && (
                <div className="mono" style={{
                  display: "inline-block",
                  fontSize: 11, color: accent, letterSpacing: 1,
                  padding: "3px 10px", borderRadius: 999,
                  background: `${accent}14`, border: `1px solid ${accent}44`,
                  marginBottom: 14,
                }}>{activeFeature.code}</div>
              )}
              <h3 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 600, letterSpacing: -0.4, lineHeight: 1.15 }}>
                {activeFeature.title}
              </h3>
              <p style={{ margin: "0 0 18px", color: "var(--text-2)", fontSize: 14, lineHeight: 1.6 }}>
                {activeFeature.body}
              </p>

              <div style={{ paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 10 }}>Use case flows</div>
                <FlowRow tone="ok"    label="Basic"        text={flowsFor(activeFeature.id).basic} />
                <FlowRow tone="warn"  label="Alternative"  text={flowsFor(activeFeature.id).alt} />
                <FlowRow tone="muted" label="Exceptional"  text={flowsFor(activeFeature.id).ex} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function FlowRow({ tone, label, text }) {
  const colors = { ok: "var(--ok)", warn: "var(--warn)", muted: "var(--muted)" };
  return (
    <div style={{ display: "flex", gap: 12, padding: "8px 0" }}>
      <span style={{
        width: 6, height: 6, borderRadius: 99, background: colors[tone],
        marginTop: 7, flexShrink: 0,
      }}></span>
      <div style={{ flex: 1 }}>
        <div className="mono" style={{ fontSize: 10, color: colors[tone], letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

function flowsFor(id) {
  const f = {
    match:    { basic: "User selects a sport, sees nearby subscribed players, picks one.", alt: "User browses without committing to a single category.", ex: "User skips categories and gets a randomized feed." },
    filters:  { basic: "User subscribes to several sports and tunes distance / skill / time.", alt: "User picks just one sport.", ex: "User leaves all filters off." },
    chat:     { basic: "Matched users plan the meetup over a few messages.", alt: "Chat used to vet whether to play together at all.", ex: "Users don't chat — go straight to a quick-action plan." },
    plan:     { basic: "Built-in chips propose time, court, duration; the other side accepts.", alt: "One side proposes, other tweaks once, both accept.", ex: "Users coordinate fully off-app." },
    privacy:  { basic: "Discoverable on while looking; off the rest of the time.", alt: "User narrows precision from city → neighborhood blob.", ex: "User forgets it's on (we surface a weekly nudge)." },
    age:      { basic: "User enters real DOB and is verified.", alt: "User enters a fake DOB — flagged on later checks.", ex: "Under-13 blocked from creating an account." },
    history:  { basic: "User reopens a past session and re-invites the same group.", alt: "User skims history but doesn't act.", ex: "User ignores history entirely." },
  };
  return f[id] || { basic: "—", alt: "—", ex: "—" };
}

/* ───────────────────────────  FEATURE GRID  ─────────────────────────── */

function FeatureGrid({ showReqs }) {
  return (
    <section id="features" style={{ padding: "96px 32px", borderBottom: "1px solid var(--line)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <SectionLabel right={<span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>HW 1 · §4 Functional requirements</span>}>
          Functional requirements
        </SectionLabel>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, marginTop: 24 }}>
          <h2 style={{
            margin: 0, fontSize: 48, lineHeight: 1.0,
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontWeight: 400, letterSpacing: -1.2, textWrap: "balance",
          }}>
            Eight rules<br/>the app lives by.
          </h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "var(--text-2)", maxWidth: 620 }}>
            {BRAND.longBlurb}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 56 }}>
          {FEATURES.map((f, i) => (
            <Card key={f.id} style={{ padding: 22, display: "flex", flexDirection: "column", minHeight: 220 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 1.3 }}>
                  {showReqs ? f.code : String(i + 1).padStart(2, "0")}
                </span>
                <span style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)",
                  display: "grid", placeItems: "center",
                  color: "var(--muted)", fontSize: 12,
                }}>{i + 1}</span>
              </div>
              <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.25 }}>{f.title}</h4>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, flex: 1 }}>{f.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────  TEAM  ─────────────────────────── */

function TeamSection() {
  return (
    <section id="team" style={{ padding: "96px 32px" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        <SectionLabel right={<span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Discussion 6 · Friday 4 PM</span>}>
          Built by
        </SectionLabel>

        <h2 style={{
          margin: "0 0 56px", fontSize: 56, lineHeight: 1.0,
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontWeight: 400, letterSpacing: -1.6,
        }}>
          Group <em>Six</em>.
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {TEAM.map(m => (
            <Card key={m.id} style={{ padding: 22 }}>
              <Avatar member={m} size={48}/>
              <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 14, letterSpacing: -0.2 }}>{m.name}</div>
              <div className="mono" style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>@{m.handle}</div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────  FOOTER  ─────────────────────────── */

function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--line)", padding: "32px",
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24,
      color: "var(--muted)", fontSize: 12, maxWidth: 1240, margin: "0 auto", flexWrap: "wrap",
    }}>
      <div className="mono">SportsZone · INF 43 Spring 2026 · Group 6</div>
      <a className="mono" href="https://github.com/AndonyVel/INF43-4PM-Discussion-Group-6" target="_blank" rel="noreferrer" style={{ color: "var(--text-2)", textDecoration: "none" }}>
        AndonyVel/INF43-4PM-Discussion-Group-6 ↗
      </a>
    </footer>
  );
}

/* ───────────────────────────  APP  ─────────────────────────── */

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply tweak: accent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [t.accent]);

  return (
    <>
      <TopBar />
      <Hero />
      <PrototypeStage accent={t.accent} showReqs={t.showRequirementIds}/>
      <FeatureGrid showReqs={t.showRequirementIds}/>
      {t.showTeamCredit && <TeamSection />}
      <Footer />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Brand color">
          <TweakColor
            label="Accent"
            value={t.accent}
            onChange={(v) => setTweak("accent", v)}
            options={["#b8ff3d", "#6e8cff", "#ff7849", "#ffd84d", "#6ee7a0"]}
          />
        </TweakSection>
        <TweakSection title="Page">
          <TweakToggle
            label="Show requirement IDs (REQ-F-…)"
            value={t.showRequirementIds}
            onChange={(v) => setTweak("showRequirementIds", v)}
          />
          <TweakToggle
            label="Show team credit section"
            value={t.showTeamCredit}
            onChange={(v) => setTweak("showTeamCredit", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
