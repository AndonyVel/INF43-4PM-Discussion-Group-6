/**
 * Integration tests — /api/chat/:personId and /api/plan
 */

const request = require('supertest');
const app     = require('../../server');

afterAll(() => {
  if (app.close) app.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// GET + POST /api/chat/:personId
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/chat/:personId', () => {
  test('1. known person — returns person object and messages array', async () => {
    const res = await request(app).get('/api/chat/jordan');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('person');
    expect(res.body).toHaveProperty('messages');
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.person.id).toBe('jordan');
  });

  test('2. unknown person — returns 404', async () => {
    const res = await request(app).get('/api/chat/ghostplayer');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/chat/:personId', () => {
  test('3. valid message — returns 201 and the new message object', async () => {
    const res = await request(app)
      .post('/api/chat/maya')
      .send({ text: 'Hey, still on for tonight?', from: 'me' });
    expect(res.status).toBe(201);
    expect(res.body.text).toBe('Hey, still on for tonight?');
    expect(res.body.from).toBe('me');
    expect(res.body).toHaveProperty('time');
  });

  test('4. message appears in subsequent GET', async () => {
    const unique = `Integration test message ${Date.now()}`;
    await request(app).post('/api/chat/maya').send({ text: unique, from: 'me' });
    const res = await request(app).get('/api/chat/maya');
    const texts = res.body.messages.map(m => m.text);
    expect(texts).toContain(unique);
  });

  test('5. missing text field — returns 400', async () => {
    const res = await request(app).post('/api/chat/maya').send({ from: 'me' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('6. unknown person — returns 404', async () => {
    const res = await request(app)
      .post('/api/chat/ghostplayer')
      .send({ text: 'hello', from: 'me' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/plan
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/plan', () => {
  const validPlan = {
    personId: 'jordan',
    time:     'Tonight · 8 PM',
    court:    'ARC Court 3',
    duration: '1h',
  };

  test('7. valid plan — returns 201 with matchId and status pending', async () => {
    const res = await request(app).post('/api/plan').send(validPlan);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('matchId');
    expect(res.body.status).toBe('pending');
    expect(res.body.time).toBe('Tonight · 8 PM');
    expect(res.body.court).toBe('ARC Court 3');
    expect(res.body.with.id).toBe('jordan');
  });

  test('8. unknown personId — returns 404', async () => {
    const res = await request(app).post('/api/plan').send({
      personId: 'nobody',
      time:     'Tonight · 8 PM',
      court:    'ARC Court 3',
    });
    expect(res.status).toBe(404);
  });

  test('9. missing required field (no court) — returns 400', async () => {
    const res = await request(app).post('/api/plan').send({
      personId: 'jordan',
      time:     'Tonight · 8 PM',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
