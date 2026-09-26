const request = require('supertest');
const { createApp } = require('../src/app');

let app;
beforeEach(() => { app = createApp(); });
const add = (title = 'Write the SIG report') => request(app).post('/api/tasks').send({ title });

test('health endpoint returns the exact readiness contract', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
  expect(response.text).toBe('ok');
});
test('reports the service identity', async () => {
  const response = await request(app).get('/api/status').expect(200);
  expect(response.body).toEqual({ service: 'task-api-cicd', status: 'ready' });
});
test('serves the browser interface and its assets', async () => {
  const response = await request(app).get('/').expect(200);
  expect(response.text).toContain('Task Desk');
  await request(app).get('/app.js').expect(200);
  await request(app).get('/style.css').expect(200);
});
test('starts with an empty task collection', async () => {
  expect((await request(app).get('/api/tasks').expect(200)).body).toEqual({ tasks: [] });
});
test('creates a trimmed task with generated identity, timestamp and default status', async () => {
  const response = await add('  Learn CI  ').expect(201);
  expect(response.body.task).toMatchObject({ title: 'Learn CI', status: 'todo' });
  expect(response.body.task.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(Number.isNaN(Date.parse(response.body.task.createdAt))).toBe(false);
  expect(response.headers.location).toBe(`/api/tasks/${response.body.task.id}`);
});
test.each([{}, { title: '' }, { title: '   ' }, { title: 5 }, { title: null },
  { title: 'x'.repeat(121) }, { title: 'Valid', admin: true }, [], null])('rejects invalid task creation: %j', async body => {
  await request(app).post('/api/tasks').set('Content-Type', 'application/json').send(JSON.stringify(body)).expect(400);
  expect((await request(app).get('/api/tasks')).body.tasks).toHaveLength(0);
});
test('accepts a title at the maximum length', async () => { await add('x'.repeat(120)).expect(201); });
test('reads a specific created task', async () => {
  const { body } = await add();
  expect((await request(app).get(`/api/tasks/${body.task.id}`).expect(200)).body.task).toEqual(body.task);
});
test('tasks have distinct identities', async () => {
  const first = await add('Same title');
  const second = await add('Same title');
  expect(first.body.task.id).not.toBe(second.body.task.id);
  expect((await request(app).get('/api/tasks')).body.tasks).toHaveLength(2);
});
test.each(['get', 'patch', 'delete'])('returns 404 for a missing task on %s', async method => {
  await request(app)[method]('/api/tasks/missing').send({ status: 'done' }).expect(404);
});
test('updates title and preserves identity', async () => {
  const { body } = await add();
  const updated = await request(app).patch(`/api/tasks/${body.task.id}`).send({ title: '  Revised  ' }).expect(200);
  expect(updated.body.task).toEqual({ ...body.task, title: 'Revised' });
});
test.each(['in-progress', 'done', 'todo'])('supports task status %s', async status => {
  const { body } = await add();
  const response = await request(app).patch(`/api/tasks/${body.task.id}`).send({ status }).expect(200);
  expect(response.body.task.status).toBe(status);
});
test.each([{}, [], { title: '' }, { title: false }, { title: 'x'.repeat(121) }, { status: 'invalid' },
  { status: null }, { id: 'replacement' }, { createdAt: 'tomorrow' }])('rejects invalid updates: %j', async change => {
  const { body } = await add();
  await request(app).patch(`/api/tasks/${body.task.id}`).send(change).expect(400);
  expect((await request(app).get(`/api/tasks/${body.task.id}`)).body.task).toEqual(body.task);
});
test('does not partly apply an invalid multi-field update', async () => {
  const { body } = await add();
  await request(app).patch(`/api/tasks/${body.task.id}`).send({ title: 'Changed', status: 'invalid' }).expect(400);
  expect((await request(app).get(`/api/tasks/${body.task.id}`)).body.task).toEqual(body.task);
});
test('filters tasks by status', async () => {
  await add('First');
  const { body } = await add('Second');
  await request(app).patch(`/api/tasks/${body.task.id}`).send({ status: 'done' });
  const response = await request(app).get('/api/tasks?status=done').expect(200);
  expect(response.body.tasks).toHaveLength(1);
  expect(response.body.tasks[0].title).toBe('Second');
});
test.each(['invalid', '', 'done&status=todo'])('rejects unsupported status query %s', async status => {
  await request(app).get(`/api/tasks?status=${status}`).expect(400);
});
test('deletes a task and makes it unavailable', async () => {
  const { body } = await add();
  await request(app).delete(`/api/tasks/${body.task.id}`).expect(204);
  await request(app).get(`/api/tasks/${body.task.id}`).expect(404);
  expect((await request(app).get('/api/tasks')).body.tasks).toHaveLength(0);
});
test('returns JSON for an unknown route', async () => {
  expect((await request(app).get('/missing').expect(404)).body.error).toBe('Route not found.');
});
test('rejects malformed JSON without leaking a stack trace', async () => {
  const response = await request(app).post('/api/tasks').set('Content-Type', 'application/json').send('{bad').expect(400);
  expect(response.body).toEqual({ error: 'Invalid JSON body.' });
});
test('rejects oversized request bodies', async () => {
  await request(app).post('/api/tasks').send({ title: 'x'.repeat(17000) }).expect(413);
});
test('does not share task data between app instances', async () => {
  await add();
  expect((await request(createApp()).get('/api/tasks')).body.tasks).toEqual([]);
});
test('sets browser security headers without advertising Express', async () => {
  const response = await request(app).get('/');
  expect(response.headers['x-powered-by']).toBeUndefined();
  expect(response.headers['x-content-type-options']).toBe('nosniff');
  expect(response.headers['content-security-policy']).toContain("script-src 'self'");
});
