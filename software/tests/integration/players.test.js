/**
 * Integration tests — /api/players (GET list, GET single, POST add)
 *
 * Uses Supertest to fire real HTTP requests against the Express app.
 * No live server process needed — Supertest handles binding internally.
 *
 * Install: npm install --save-dev jest supertest
 */

const request = require('supertest');
const app     = require('../../server'); // Express app — must export `app` (see note below)

// NOTE: server.js currently calls app.listen() at the bottom.
// For Supertest to work cleanly, export `app` BEFORE the listen call:
//
//   module.exports = app;   // add this line near the bottom of server.js
//
// The listen() call is fine to keep — Supertest ignores it and binds its own port.

afterAll(() => {
  // Close any open handles so Jest can exit without --forceExit
  if (app.close) app.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/players
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/players', () => {
  test('1. no filters — returns all players as an array', async () => {
    const res = await request(app).get('/api/players');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('2. ?sport=tennis — only tennis players returned', async () => {
    const res = await request(app).get('/api/players?sport=tennis');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach(p => expect(p.sport).toBe('tennis'));
  });

  test('3. ?sport=basketball&maxDistance=2 — nearby basketball players only', async () => {
    const res = await request(app).get('/api/players?sport=basketball&maxDistance=2');
    expect(res.status).toBe(200);
    res.body.forEach(p => {
      expect(p.sport).toBe('basketball');
      expect(p.distance).toBeLessThanOrEqual(2);
    });
  });

  test('4. ?sport=nonexistent — returns empty array, not an error', async () => {
    const res = await request(app).get('/api/players?sport=quidditch');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/players/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/players/:id', () => {
  test('5. known id — returns correct player object', async () => {
    const res = await request(app).get('/api/players/maya');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('maya');
    expect(res.body.sport).toBe('basketball');
  });

  test('6. unknown id — returns 404 with error field', async () => {
    const res = await request(app).get('/api/players/doesnotexist');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/players
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/players', () => {
  const newPlayer = {
    id:       'test_player_integration',
    name:     'Test User',
    age:      25,
    skill:    'Casual',
    sport:    'running',
    distance: 1.0,
    when:     'Tonight · 7 PM',
    court:    'Test Park',
    initials: 'TU',
    color:    '#ffffff',
    note:     'Integration test player.',
  };

  test('7. valid payload — creates player and returns 201 with the new record', async () => {
    const res = await request(app).post('/api/players').send(newPlayer);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(newPlayer.id);
    expect(res.body.sport).toBe('running');
  });

  test('8. duplicate id — returns 409', async () => {
    // newPlayer was added in test 7; posting again should conflict
    const res = await request(app).post('/api/players').send(newPlayer);
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('9. missing required fields (no sport) — returns 400', async () => {
    const res = await request(app).post('/api/players').send({ id: 'bad', name: 'No Sport' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
