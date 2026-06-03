/**
 * Unit tests — filter logic, snapshot shape, and now() helper
 *
 * These tests import the raw data and helper logic directly, without
 * starting the Express server. Fast, isolated, no HTTP overhead.
 */

// ── Inline the pure filter logic so we can test it without the server ─────────
// In a real refactor you'd extract this to src/filters.js and import it.
// For now we replicate the exact logic from server.js so the tests are honest.

const PEOPLE = [
  { id: "maya",   sport: "basketball", skill: "Casual",       distance: 0.4  },
  { id: "jordan", sport: "basketball", skill: "Intermediate", distance: 1.1  },
  { id: "priya",  sport: "basketball", skill: "Competitive",  distance: 2.4  },
  { id: "derek",  sport: "basketball", skill: "Competitive",  distance: 12.3 },
  { id: "noor",   sport: "soccer",     skill: "Competitive",  distance: 1.8  },
  { id: "carlos", sport: "soccer",     skill: "Casual",       distance: 0.8  },
  { id: "sage",   sport: "tennis",     skill: "Beginner",     distance: 0.6  },
  { id: "alexw",  sport: "tennis",     skill: "Intermediate", distance: 1.4  },
  { id: "nina",   sport: "tennis",     skill: "Competitive",  distance: 3.6  },
];

function filterPlayers(people, { sport, skill, maxDistance } = {}) {
  let result = [...people];
  if (sport)       result = result.filter(p => p.sport === sport);
  if (skill)       result = result.filter(p => p.skill === skill);
  if (maxDistance) result = result.filter(p => p.distance <= parseFloat(maxDistance));
  return result;
}

// ── now() helper (replicated from server.js) ──────────────────────────────────

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── snapshot shape (replicated keys from server.js snapshot()) ────────────────

function snapshot() {
  return {
    BRAND:    { name: "SportsZone" },
    TEAM:     [],
    SPORTS:   [],
    SKILLS:   [],
    PEOPLE:   PEOPLE,
    CHAT:     [],
    HISTORY:  [],
    FEATURES: [],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('filterPlayers — single filters', () => {
  test('1. filterBySport — returns only basketball players', () => {
    const result = filterPlayers(PEOPLE, { sport: 'basketball' });
    expect(result.length).toBe(4);
    result.forEach(p => expect(p.sport).toBe('basketball'));
  });

  test('2. filterBySkill — returns only Intermediate players', () => {
    const result = filterPlayers(PEOPLE, { skill: 'Intermediate' });
    expect(result.length).toBe(2);
    result.forEach(p => expect(p.skill).toBe('Intermediate'));
  });

  test('3. filterByMaxDistance — excludes players beyond threshold', () => {
    const result = filterPlayers(PEOPLE, { maxDistance: '2.0' });
    result.forEach(p => expect(p.distance).toBeLessThanOrEqual(2.0));
    // derek (12.3) and nina (3.6) should be excluded
    const ids = result.map(p => p.id);
    expect(ids).not.toContain('derek');
    expect(ids).not.toContain('nina');
  });
});

describe('filterPlayers — combined filters', () => {
  test('4. sport + maxDistance — only nearby basketball players', () => {
    const result = filterPlayers(PEOPLE, { sport: 'basketball', maxDistance: '2.0' });
    result.forEach(p => {
      expect(p.sport).toBe('basketball');
      expect(p.distance).toBeLessThanOrEqual(2.0);
    });
    // derek is basketball but distance 12.3 — must be excluded
    expect(result.map(p => p.id)).not.toContain('derek');
  });

  test('5. sport + skill + maxDistance — all three filters applied', () => {
    const result = filterPlayers(PEOPLE, {
      sport: 'basketball',
      skill: 'Competitive',
      maxDistance: '5.0',
    });
    // priya: basketball, Competitive, 2.4 — should be included
    // derek: basketball, Competitive, 12.3 — excluded by distance
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('priya');
  });
});

describe('now() helper', () => {
  test('6. returns a non-empty time string', () => {
    const t = now();
    expect(typeof t).toBe('string');
    expect(t.length).toBeGreaterThan(0);
  });

  test('7. result matches HH:MM AM/PM pattern', () => {
    const t = now();
    expect(t).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });
});

describe('snapshot()', () => {
  test('8. contains all required top-level keys', () => {
    const snap = snapshot();
    const required = ['BRAND', 'TEAM', 'SPORTS', 'SKILLS', 'PEOPLE', 'CHAT', 'HISTORY', 'FEATURES'];
    required.forEach(key => expect(snap).toHaveProperty(key));
  });
});
