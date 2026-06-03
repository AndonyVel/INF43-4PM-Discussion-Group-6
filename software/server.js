const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Data ──────────────────────────────────────────────────────────────────────
// Single source of truth. The same objects are served via the REST API *and*
// injected into the page so the frontend never needs an async round-trip to
// read the initial state.

const BRAND = {
  name:      "SportsZone",
  tagline:   "Find your game.",
  pitch:     "A mobile platform that matches recreational players by sport, distance, skill, and the hour they're actually free — so the only thing left to plan is showing up.",
  longBlurb: "A lot of modern-day sports require at least one other person. Basketball, soccer, baseball, tennis — they all bend toward company. SportsZone removes the texting, the schedule juggling, the \"are you free Tuesday?\" loop, and replaces it with one filter and one match.",
};

const TEAM = [
  { id: "av", name: "Andony Velasquez Carrillo", handle: "AndonyVel", initials: "AV", color: "#b8ff3d" },
  { id: "ky", name: "Kevin Yao",                 handle: "kyao11",   initials: "KY", color: "#6e8cff" },
  { id: "ur", name: "Ulises Reyes",              handle: "ureyes2",  initials: "UR", color: "#ff8a5b" },
  { id: "da", name: "Daniel Arutti",             handle: "darutti",  initials: "DA", color: "#c98cff" },
];

const SPORTS = [
  { id: "basketball", label: "Basketball", short: "🏀", icon: "BB" },
  { id: "soccer",     label: "Soccer",     short: "⚽", icon: "SO" },
  { id: "tennis",     label: "Tennis",     short: "🎾", icon: "TN" },
  { id: "pickleball", label: "Pickleball", short: "🥒", icon: "PB" },
  { id: "volleyball", label: "Volleyball", short: "🏐", icon: "VB" },
  { id: "baseball",   label: "Baseball",   short: "⚾", icon: "BS" },
  { id: "running",    label: "Running",    short: "🏃", icon: "RN" },
  { id: "climbing",   label: "Climbing",   short: "🧗", icon: "CL" },
];

const SKILLS = ["Beginner", "Casual", "Intermediate", "Competitive"];

// In-memory player list — editable at runtime via POST /api/players
const PEOPLE = [
  // ── Basketball ───────────────────────────────────────────────────────────────
  { id: "maya",    name: "Maya R.",    age: 24, skill: "Casual",       sport: "basketball", distance: 0.4,  when: "Tonight · 7 PM",  court: "Aldrich Park courts",         initials: "MR", color: "#b8ff3d", note: "Pickup 3-on-3. Bring water." },
  { id: "jordan",  name: "Jordan T.",  age: 28, skill: "Intermediate", sport: "basketball", distance: 1.1,  when: "Tonight · 8 PM",  court: "Anteater Recreation Center",  initials: "JT", color: "#6e8cff", note: "Half-court, casual." },
  { id: "chris",   name: "Chris A.",   age: 21, skill: "Beginner",     sport: "basketball", distance: 0.3,  when: "Tonight · 7 PM",  court: "Aldrich Park courts",         initials: "CA", color: "#ffd84d", note: "Just learning, very chill." },
  { id: "priya",   name: "Priya S.",   age: 26, skill: "Competitive",  sport: "basketball", distance: 2.4,  when: "Tonight · 9 PM",  court: "ARC Main Court",              initials: "PS", color: "#ff6b9d", note: "Serious 5v5, need one more." },
  { id: "leo",     name: "Leo M.",     age: 23, skill: "Casual",       sport: "basketball", distance: 3.1,  when: "Tomorrow · 6 PM", court: "Mike Ward Community Park",    initials: "LM", color: "#4dd9ff", note: "Easy hoops after class." },
  { id: "tamara",  name: "Tamara J.",  age: 29, skill: "Intermediate", sport: "basketball", distance: 5.8,  when: "Sat · 11 AM",     court: "Heritage Park",               initials: "TJ", color: "#ff9f43", note: "Saturday morning run. All welcome." },
  { id: "derek",   name: "Derek F.",   age: 31, skill: "Competitive",  sport: "basketball", distance: 12.3, when: "Tonight · 8 PM",  court: "Woodbridge Athletic Club",    initials: "DF", color: "#a8e6cf", note: "Organized league-level run." },
  { id: "ana",     name: "Ana B.",     age: 20, skill: "Beginner",     sport: "basketball", distance: 18.5, when: "Tomorrow · 5 PM", court: "Columbus Tustin Park",        initials: "AB", color: "#c98cff", note: "Learning the basics, patient partners only." },
  // ── Soccer ───────────────────────────────────────────────────────────────────
  { id: "noor",    name: "Noor K.",    age: 31, skill: "Competitive",  sport: "soccer",     distance: 1.8,  when: "Sat · 10 AM",     court: "Mason Park (north field)",    initials: "NK", color: "#c98cff", note: "5v5, looking for one." },
  { id: "carlos",  name: "Carlos M.",  age: 25, skill: "Casual",       sport: "soccer",     distance: 0.8,  when: "Tonight · 6 PM",  court: "Aldrich Park (south field)",  initials: "CM", color: "#ff8a5b", note: "Kick around, no pressure." },
  { id: "sofia",   name: "Sofia R.",   age: 22, skill: "Intermediate", sport: "soccer",     distance: 1.5,  when: "Tonight · 7 PM",  court: "ARC Soccer Field",            initials: "SR", color: "#b8ff3d", note: "7-a-side, one spot left." },
  { id: "ben",     name: "Ben H.",     age: 27, skill: "Competitive",  sport: "soccer",     distance: 4.4,  when: "Sat · 9 AM",      court: "William Mason Regional Park", initials: "BH", color: "#6e8cff", note: "Competitive 11v11. Serious players." },
  { id: "yuki",    name: "Yuki T.",    age: 20, skill: "Beginner",     sport: "soccer",     distance: 2.2,  when: "Tomorrow · 4 PM", court: "Crawford Canyon field",       initials: "YT", color: "#ffd84d", note: "First time out, any pointers welcome." },
  { id: "marcos",  name: "Marcos V.",  age: 33, skill: "Intermediate", sport: "soccer",     distance: 14.0, when: "Tonight · 8 PM",  court: "Irvine Regional Park field",  initials: "MV", color: "#4dd9ff", note: "Pickup 5v5 every Tuesday." },
  { id: "elena",   name: "Elena K.",   age: 28, skill: "Competitive",  sport: "soccer",     distance: 28.5, when: "Sat · 10 AM",     court: "Yorba Regional Park",         initials: "EK", color: "#a8e6cf", note: "Women's league, looking for subs." },
  // ── Tennis ───────────────────────────────────────────────────────────────────
  { id: "sage",    name: "Sage L.",    age: 22, skill: "Beginner",     sport: "tennis",     distance: 0.6,  when: "Tomorrow · 5 PM", court: "ARC Tennis Court 2",          initials: "SL", color: "#ff8a5b", note: "Just want to rally for an hour." },
  { id: "alexw",   name: "Alex W.",    age: 24, skill: "Intermediate", sport: "tennis",     distance: 1.4,  when: "Tonight · 6 PM",  court: "ARC Tennis Court 1",          initials: "AW", color: "#ff6b9d", note: "Looking for a solid hitting partner." },
  { id: "nina",    name: "Nina F.",    age: 30, skill: "Competitive",  sport: "tennis",     distance: 3.6,  when: "Tomorrow · 8 AM", court: "Heritage Park Tennis",        initials: "NF", color: "#7bcf94", note: "Match play, 4.0+ level preferred." },
  { id: "omar",    name: "Omar T.",    age: 26, skill: "Casual",       sport: "tennis",     distance: 0.9,  when: "Tonight · 7 PM",  court: "ARC Tennis Court 3",          initials: "OT", color: "#ff9f43", note: "Casual sets, just having fun." },
  { id: "rosap",   name: "Rosa P.",    age: 34, skill: "Beginner",     sport: "tennis",     distance: 6.1,  when: "Sat · 9 AM",      court: "Woodbridge Tennis",           initials: "RO", color: "#ff6b9d", note: "Learning as an adult. Be nice!" },
  { id: "kain",    name: "Kai N.",     age: 21, skill: "Intermediate", sport: "tennis",     distance: 11.2, when: "Sun · 10 AM",     court: "University Park courts",      initials: "KN", color: "#6e8cff", note: "Weekend doubles, need a pair." },
  // ── Pickleball ───────────────────────────────────────────────────────────────
  { id: "ravi",    name: "Ravi P.",    age: 26, skill: "Intermediate", sport: "pickleball", distance: 0.9,  when: "Tonight · 6 PM",  court: "Heritage Park Courts",        initials: "RP", color: "#7bcf94", note: "Doubles, rotating partners." },
  { id: "grace",   name: "Grace K.",   age: 45, skill: "Casual",       sport: "pickleball", distance: 1.0,  when: "Tonight · 5 PM",  court: "Mike Ward Community Park",    initials: "GK", color: "#ffd84d", note: "Friendly dinking session." },
  { id: "tomb",    name: "Tom B.",     age: 38, skill: "Intermediate", sport: "pickleball", distance: 2.5,  when: "Tonight · 7 PM",  court: "Woodbridge Park courts",      initials: "TB", color: "#4dd9ff", note: "Bangers and dinkers both welcome." },
  { id: "weic",    name: "Wei C.",     age: 29, skill: "Competitive",  sport: "pickleball", distance: 4.7,  when: "Tomorrow · 7 AM", court: "Creekside Park",              initials: "WC", color: "#ff8a5b", note: "Tournament-level drill partner needed." },
  { id: "patl",    name: "Pat L.",     age: 52, skill: "Beginner",     sport: "pickleball", distance: 1.3,  when: "Tomorrow · 9 AM", court: "Heritage Park Courts",        initials: "PL", color: "#c98cff", note: "Just picked up a paddle last week!" },
  // ── Volleyball ───────────────────────────────────────────────────────────────
  { id: "sam",     name: "Sam D.",     age: 22, skill: "Casual",       sport: "volleyball", distance: 0.7,  when: "Tonight · 6 PM",  court: "Aldrich Park (sand courts)",  initials: "SD", color: "#b8ff3d", note: "Beach 2v2. Bring sunscreen." },
  { id: "lia",     name: "Lia M.",     age: 25, skill: "Intermediate", sport: "volleyball", distance: 2.2,  when: "Sat · 11 AM",     court: "Mason Park sand courts",      initials: "LI", color: "#a8e6cf", note: "6v6 indoor, sub needed." },
  { id: "jakep",   name: "Jake P.",    age: 27, skill: "Competitive",  sport: "volleyball", distance: 4.3,  when: "Tonight · 8 PM",  court: "Irvine Recreation Center",    initials: "JP", color: "#c98cff", note: "Club-level scrimmage tonight." },
  { id: "mia",     name: "Mia C.",     age: 20, skill: "Beginner",     sport: "volleyball", distance: 0.4,  when: "Tomorrow · 3 PM", court: "Aldrich Park (sand courts)",  initials: "MC", color: "#ff9f43", note: "Learning to serve. Patient group!" },
  { id: "trey",    name: "Trey A.",    age: 30, skill: "Intermediate", sport: "volleyball", distance: 8.4,  when: "Sun · 2 PM",      court: "Doheny State Beach",          initials: "TA", color: "#6e8cff", note: "Sunday beach sets. All welcome." },
  // ── Baseball ─────────────────────────────────────────────────────────────────
  { id: "mike",    name: "Mike R.",    age: 32, skill: "Casual",       sport: "baseball",   distance: 1.8,  when: "Sat · 9 AM",      court: "Aldrich Park diamond",        initials: "MK", color: "#ff8a5b", note: "Catch and batting practice." },
  { id: "danal",   name: "Dana L.",    age: 27, skill: "Intermediate", sport: "baseball",   distance: 3.5,  when: "Tomorrow · 4 PM", court: "Mason Park diamond",          initials: "DL", color: "#ffd84d", note: "9-a-side scrimmage, need two more." },
  { id: "victorg", name: "Victor G.",  age: 35, skill: "Competitive",  sport: "baseball",   distance: 7.2,  when: "Sat · 8 AM",      court: "Mike Ward Park diamond",      initials: "VG", color: "#4dd9ff", note: "Hardball, real innings." },
  { id: "jess",    name: "Jess T.",    age: 23, skill: "Beginner",     sport: "baseball",   distance: 1.2,  when: "Tonight · 6 PM",  court: "Aldrich Park diamond",        initials: "JS", color: "#a8e6cf", note: "Softball rules, beginner-friendly." },
  // ── Running ──────────────────────────────────────────────────────────────────
  { id: "zoe",     name: "Zoe A.",     age: 23, skill: "Casual",       sport: "running",    distance: 0.5,  when: "Tonight · 6 PM",  court: "Aldrich Park loop",           initials: "ZA", color: "#b8ff3d", note: "3-mile easy pace, no rush." },
  { id: "finn",    name: "Finn M.",    age: 25, skill: "Intermediate", sport: "running",    distance: 1.6,  when: "Tomorrow · 6 AM", court: "Peters Canyon trail",         initials: "FM", color: "#7bcf94", note: "8-mile trail run, moderate pace." },
  { id: "camille", name: "Camille R.", age: 28, skill: "Competitive",  sport: "running",    distance: 3.4,  when: "Tonight · 5 PM",  court: "UCI track",                   initials: "CR", color: "#a8e6cf", note: "Tempo run, 7:30/mi target." },
  { id: "hiro",    name: "Hiro S.",    age: 31, skill: "Beginner",     sport: "running",    distance: 0.4,  when: "Tomorrow · 7 AM", court: "Aldrich Park loop",           initials: "HS", color: "#ff9f43", note: "Couch to 5K. Just started!" },
  // ── Climbing ─────────────────────────────────────────────────────────────────
  { id: "iris",    name: "Iris W.",    age: 24, skill: "Beginner",     sport: "climbing",   distance: 1.6,  when: "Tonight · 7 PM",  court: "Vital Climbing Gym",          initials: "IW", color: "#ff6b9d", note: "Top-rope only, still on 5.9s." },
  { id: "drew",    name: "Drew S.",    age: 27, skill: "Intermediate", sport: "climbing",   distance: 2.3,  when: "Sat · 10 AM",     court: "Sender One Climbing",         initials: "DS", color: "#c98cff", note: "Bouldering V4–V6 range." },
  { id: "mako",    name: "Mako T.",    age: 29, skill: "Competitive",  sport: "climbing",   distance: 5.1,  when: "Tomorrow · 5 PM", court: "Hangar 18 Fullerton",         initials: "MT", color: "#6e8cff", note: "Lead climbing, 5.12+ routes." },
  { id: "luna",    name: "Luna V.",    age: 22, skill: "Casual",       sport: "climbing",   distance: 1.1,  when: "Tonight · 6 PM",  court: "Vital Climbing Gym",          initials: "LV", color: "#ffd84d", note: "Chill bouldering sesh. V1–V3 vibes." },
];

// In-memory chat threads keyed by person id
const CHATS = {
  jordan: [
    { from: "them", time: "5:14 PM", text: "Hey! Saw you matched for the 8 PM run at the ARC." },
    { from: "me",   time: "5:15 PM", text: "Yeah, down for it. Half-court?" },
    { from: "them", time: "5:16 PM", text: "Yep, just the two of us first, more might show." },
    { from: "me",   time: "5:18 PM", text: "Cool. I'll be in a grey shirt, court 3." },
    { from: "them", time: "5:19 PM", text: "Sounds good — see you there." },
  ],
};

// Default chat for any person without their own thread
const DEFAULT_CHAT = [
  { from: "them", time: "5:14 PM", text: "Hey! Saw you matched for the 8 PM run at the ARC." },
  { from: "me",   time: "5:15 PM", text: "Yeah, down for it. Half-court?" },
  { from: "them", time: "5:16 PM", text: "Yep, just the two of us first, more might show." },
  { from: "me",   time: "5:18 PM", text: "Cool. I'll be in a grey shirt, court 3." },
  { from: "them", time: "5:19 PM", text: "Sounds good — see you there." },
];

// In-memory session history
const HISTORY = [
  { sport: "basketball", court: "ARC Court 3",        date: "Last Thu", with: ["maya", "jordan"], duration: "1h 20m" },
  { sport: "tennis",     court: "ARC Tennis Court 2", date: "Last Sun", with: ["sage"],           duration: "55m"    },
  { sport: "pickleball", court: "Heritage Park",      date: "Oct 28",   with: ["ravi", "noor"],   duration: "1h"     },
  { sport: "basketball", court: "Aldrich Park",       date: "Oct 24",   with: ["jordan"],         duration: "45m"    },
];

const FEATURES = [
  { id: "match",   code: "REQ-F-01",    title: "Closed sport categories",          showScreen: "discover", body: "Users browse a developer-defined catalogue (basketball, soccer, tennis, …). Categories anchor every match so the system can index by sport without free-text drift." },
  { id: "filters", code: "REQ-F-02",    title: "Multi-interest subscriptions + filters", showScreen: "filters",  body: "Subscribe to one or many sports, set a distance radius, skill range, and an availability window. The feed only shows matches that satisfy every active filter." },
  { id: "chat",    code: "REQ-F-03",    title: "Chat for matched users",           showScreen: "chat",     body: "Once two users mutually match, a private thread opens. Used to confirm details before meeting — kept lightweight so most matches never need more than a few messages." },
  { id: "plan",    code: "REQ-F-04",    title: "Pre-planning meeting support",     showScreen: "plan",     body: "Quick-action chips replace negotiation: propose a court, propose a time, the other side accepts, tweaks, or declines in a single tap." },
  { id: "privacy", code: "REQ-F-05·06", title: "Location sharing + noise",         showScreen: "profile",  body: "Users toggle discoverability on or off at any time. When on, location is fuzzed to a neighborhood-sized blob so matching works without exposing a precise pin." },
  { id: "age",     code: "REQ-F-07",    title: "Account + age verification",      showScreen: "onboard",  body: "Required on sign-up. Keeps the platform appropriate for the recreational, all-ages audience and lets us split categories that need adult-only courts later." },
  { id: "history", code: "REQ-F-08",    title: "Past activity history",           showScreen: "history",  body: "Every completed session is logged with the sport, location, duration, and who you played with — so re-inviting last week's group is one tap." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function snapshot() {
  // Flatten CHATS into a single default-thread array for the frontend
  return { BRAND, TEAM, SPORTS, SKILLS, PEOPLE, CHAT: DEFAULT_CHAT, HISTORY, FEATURES };
}

// ── REST API ──────────────────────────────────────────────────────────────────

// GET /api/data — full snapshot (used by the injected <script> and by tests)
app.get('/api/data', (req, res) => res.json(snapshot()));

// GET /api/players?sport=&skill=&maxDistance=
app.get('/api/players', (req, res) => {
  const { sport, skill, maxDistance } = req.query;
  let result = [...PEOPLE];
  if (sport)       result = result.filter(p => p.sport === sport);
  if (skill)       result = result.filter(p => p.skill === skill);
  if (maxDistance) result = result.filter(p => p.distance <= parseFloat(maxDistance));
  res.json(result);
});

// GET /api/players/:id
app.get('/api/players/:id', (req, res) => {
  const player = PEOPLE.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

// POST /api/players — add a new player
app.post('/api/players', (req, res) => {
  const { id, name, age, skill, sport, distance, when, court, initials, color, note } = req.body;
  if (!id || !name || !sport) return res.status(400).json({ error: 'id, name, and sport are required' });
  if (PEOPLE.find(p => p.id === id)) return res.status(409).json({ error: 'Player id already exists' });
  const player = { id, name, age, skill, sport, distance, when, court, initials, color, note };
  PEOPLE.push(player);
  res.status(201).json(player);
});

app.get('/api/sports',   (req, res) => res.json(SPORTS));
app.get('/api/skills',   (req, res) => res.json(SKILLS));
app.get('/api/team',     (req, res) => res.json(TEAM));
app.get('/api/features', (req, res) => res.json(FEATURES));

// GET /api/chat/:personId — fetch a thread
app.get('/api/chat/:personId', (req, res) => {
  const person = PEOPLE.find(p => p.id === req.params.personId);
  if (!person) return res.status(404).json({ error: 'Player not found' });
  const messages = CHATS[req.params.personId] || [...DEFAULT_CHAT];
  res.json({ person, messages });
});

// POST /api/chat/:personId — send a message
app.post('/api/chat/:personId', (req, res) => {
  const { text, from } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  const person = PEOPLE.find(p => p.id === req.params.personId);
  if (!person) return res.status(404).json({ error: 'Player not found' });
  if (!CHATS[req.params.personId]) CHATS[req.params.personId] = [...DEFAULT_CHAT];
  const msg = { from: from === 'them' ? 'them' : 'me', time: now(), text };
  CHATS[req.params.personId].push(msg);
  res.status(201).json(msg);
});

// GET /api/history
app.get('/api/history', (req, res) => res.json(HISTORY));

// POST /api/history — log a completed session
app.post('/api/history', (req, res) => {
  const { sport, court, with: withIds, duration } = req.body;
  if (!sport || !court) return res.status(400).json({ error: 'sport and court are required' });
  const entry = {
    sport,
    court,
    date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    with: withIds || [],
    duration: duration || '—',
  };
  HISTORY.unshift(entry);
  res.status(201).json(entry);
});

// POST /api/plan — submit a meetup proposal (returns an echo with a fake match id)
app.post('/api/plan', (req, res) => {
  const { personId, time, court, duration } = req.body;
  if (!personId || !time || !court) return res.status(400).json({ error: 'personId, time, and court are required' });
  const person = PEOPLE.find(p => p.id === personId);
  if (!person) return res.status(404).json({ error: 'Player not found' });
  res.status(201).json({
    matchId: `plan_${Date.now()}`,
    status:  'pending',
    with:    person,
    time,
    court,
    duration: duration || '1h',
    sentAt:   now(),
  });
});

// ── Page (HTML + injected data) ───────────────────────────────────────────────
// Serve SportsZone.html with window.__SZ_DATA__ injected so data.jsx reads from
// the server instead of its own hardcoded fallbacks.

app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'SportsZone.html');
  let html;
  try {
    html = fs.readFileSync(htmlPath, 'utf8');
  } catch {
    return res.status(500).send('Could not read SportsZone.html');
  }
  const injection = `\n  <script>window.__SZ_DATA__ = ${JSON.stringify(snapshot())};</script>`;
  // Inject right before the first <script> tag so all globals are available
  html = html.replace('<script src=', `${injection}\n  <script src=`);
  res.send(html);
});

// ── Static files (.jsx, fonts cache, etc.) ────────────────────────────────────

app.use(express.static(path.join(__dirname)));

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   SportsZone · INF 43 · Discussion 6    ║
  ╚══════════════════════════════════════════╝

  Local:   http://localhost:${PORT}
  API:     http://localhost:${PORT}/api/data

  Endpoints
  ─────────────────────────────────────────
  GET  /api/data              full snapshot
  GET  /api/players           list (filterable)
  GET  /api/players/:id       single player
  POST /api/players           add a player
  GET  /api/sports            sport catalogue
  GET  /api/skills            skill levels
  GET  /api/team              team members
  GET  /api/features          requirement list
  GET  /api/chat/:personId    message thread
  POST /api/chat/:personId    send a message
  GET  /api/history           session log
  POST /api/history           log a session
  POST /api/plan              propose a meetup
  `);

  module.exports - app;
});
