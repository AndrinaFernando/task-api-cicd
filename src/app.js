const express = require('express');
const { randomUUID } = require('node:crypto');
const path = require('node:path');

/** @typedef {{ id: string, title: string, status: string, createdAt: string }} Task */
const statuses = ['todo', 'in-progress', 'done'];

/** Create an isolated in-memory store for each app/test instance. */
function createApp() {
  const app = express();
  /** @type {Map<string, Task>} */
  const tasks = new Map();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'");
    next();
  });

  app.get('/health', (_req, res) => res.status(200).send('ok'));
  app.get('/api/status', (_req, res) => res.json({ service: 'task-api-cicd', status: 'ready' }));

  app.get('/api/tasks', (req, res) => {
    const status = req.query.status;
    if (status !== undefined && (typeof status !== 'string' || !statuses.includes(status))) {
      return res.status(400).json({ error: 'Invalid status filter.' });
    }
    return res.json({ tasks: [...tasks.values()].filter(task => !status || task.status === status) });
  });

  app.post('/api/tasks', (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some(key => key !== 'title') ||
        typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120) {
      return res.status(400).json({ error: 'Provide only a title containing 1–120 characters.' });
    }
    const task = { id: randomUUID(), title: body.title.trim(), status: 'todo', createdAt: new Date().toISOString() };
    tasks.set(task.id, task);
    return res.status(201).location(`/api/tasks/${task.id}`).json({ task });
  });

  app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.get(req.params.id);
    return task ? res.json({ task }) : res.status(404).json({ error: 'Task not found.' });
  });

  app.patch('/api/tasks/:id', (req, res) => {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0 ||
        Object.keys(body).some(key => !['title', 'status'].includes(key))) {
      return res.status(400).json({ error: 'Provide title and/or status only.' });
    }
    if ('title' in body && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 120)) {
      return res.status(400).json({ error: 'Title must contain 1–120 characters.' });
    }
    if ('status' in body && !statuses.includes(body.status)) {
      return res.status(400).json({ error: 'Status must be todo, in-progress, or done.' });
    }
    // Validate the whole request before changing either field.
    if ('title' in body) task.title = body.title.trim();
    if ('status' in body) task.status = body.status;
    return res.json({ task });
  });

  app.delete('/api/tasks/:id', (req, res) => {
    if (!tasks.delete(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
    return res.status(204).end();
  });

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
  /** @type {import('express').ErrorRequestHandler} */
  const handleError = (err, _req, res, _next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body too large.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    return res.status(500).json({ error: 'Internal server error.' });
  };
  app.use(handleError);
  return app;
}

module.exports = { createApp };
