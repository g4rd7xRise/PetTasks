import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initSchema, usersRepo, progressRepo, todosRepo, problemsRepo, testsRepo } from './db.js';
import { config } from './config.js';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = config.jwkSecret;

// Initialize database schema
initSchema();

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  if (usersRepo.findByEmail(email)) return res.status(409).json({ error: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: `u_${Date.now()}`, name, email, passwordHash, avatarUrl: '' };
  usersRepo.create(user);
  const row = usersRepo.findByEmail(email);
  const apiUser = { id: row.id, name: row.name, email: row.email, avatarUrl: row.avatar_url, role: row.role || 'user' };
  const token = createToken(apiUser);
  res.json({ token, user: apiUser });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const row = usersRepo.findByEmail(email);
  const user = row ? { id: row.id, name: row.name, email: row.email, passwordHash: row.password_hash, avatarUrl: row.avatar_url, role: row.role || 'user' } : null;
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, role: user.role } });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Public problems (published)
app.get('/api/problems', (req, res) => {
  try {
    const rows = problemsRepo.list();
    const published = rows.filter(r => (r.published ?? 0) === 1);
    const result = published.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      difficulty: r.difficulty,
      frequency: r.frequency,
      tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
      statement: r.statement,
      starterCode: r.starter_code || '',
      videoUrl: r.video_url || '',
      solutionMd: r.solution_md || '',
      tests: testsRepo.list(r.id).map(t => ({ id: String(t.id), input: JSON.parse(t.input_json), expected: JSON.parse(t.expected_json) }))
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load problems' });
  }
});

app.get('/api/problems/:slug', (req, res) => {
  try {
    const r = problemsRepo.findBySlug(req.params.slug);
    if (!r || (r.published ?? 0) !== 1) return res.status(404).json({ error: 'Not found' });
    const obj = {
      id: r.id,
      title: r.title,
      slug: r.slug,
      difficulty: r.difficulty,
      frequency: r.frequency,
      tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
      statement: r.statement,
      starterCode: r.starter_code || '',
      videoUrl: r.video_url || '',
      solutionMd: r.solution_md || '',
      tests: testsRepo.list(r.id).map(t => ({ id: String(t.id), input: JSON.parse(t.input_json), expected: JSON.parse(t.expected_json) }))
    };
    res.json(obj);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load problem' });
  }
});

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role || 'user';
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Progress endpoints
app.get('/api/progress/:slug', requireAuth, (req, res) => {
  const { slug } = req.params;
  const row = progressRepo.read(req.userId, slug);
  if (!row) return res.json(null);
  return res.json({
    solved: row.status === 'solved',
    attempts: 0,
    lastCode: row.code_snippet || undefined,
    lastUpdatedAt: row.updated_at,
  });
});

app.post('/api/progress/:slug', requireAuth, (req, res) => {
  const { slug } = req.params;
  const { solved, lastCode } = req.body || {};
  const status = solved ? 'solved' : 'attempted';
  progressRepo.upsert({ userId: req.userId, slug, status, codeSnippet: lastCode || '', updatedAt: Date.now() });
  return res.json({ ok: true });
});

// Daily stats for problem progress
app.get('/api/stats/daily', requireAuth, (req, res) => {
  const days = Math.max(1, Math.min(90, Number(req.query.days) || 14));
  // Build date map for last N days (local dates)
  const today = new Date();
  today.setHours(0,0,0,0);
  const dayKeys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = d.toISOString().slice(0,10);
    dayKeys.push(key);
  }
  // Query all rows in window
  // We'll filter by updated_at >= start
  const startMs = new Date(today.getTime() - (days - 1) * 86400000).getTime();
  const rows = progressRepo.db.prepare('SELECT status, updated_at FROM problem_progress WHERE user_id = ? AND updated_at >= ?').all(req.userId, startMs);
  const map = Object.fromEntries(dayKeys.map(k => [k, { date: k, solved: 0, attempted: 0 }]));
  for (const r of rows) {
    const dateKey = new Date(r.updated_at).toISOString().slice(0,10);
    const bucket = map[dateKey];
    if (!bucket) continue;
    if (r.status === 'solved') bucket.solved += 1;
    else if (r.status === 'attempted') bucket.attempted += 1;
  }
  res.json(dayKeys.map(k => map[k]));
});

// Todo endpoints
app.get('/api/todos', requireAuth, (req, res) => {
  const rows = todosRepo.list(req.userId);
  const items = rows.map(r => ({ id: r.id, text: r.text, completed: !!r.completed, createdAt: r.created_at, updatedAt: r.updated_at }));
  res.json(items);
});

app.post('/api/todos', requireAuth, (req, res) => {
  const text = String((req.body?.text || '').trim());
  if (!text) return res.status(400).json({ error: 'Text required' });
  const id = `t_${Date.now()}`;
  const row = todosRepo.create({ id, userId: req.userId, text, completed: false, createdAt: Date.now() });
  res.json({ id: row.id, text: row.text, completed: !!row.completed, createdAt: row.created_at, updatedAt: row.updated_at });
});

app.patch('/api/todos/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body || {};
  const row = todosRepo.update({ id, userId: req.userId, text, completed, updatedAt: Date.now() });
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ id: row.id, text: row.text, completed: !!row.completed, createdAt: row.created_at, updatedAt: row.updated_at });
});

app.delete('/api/todos/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  todosRepo.delete(id, req.userId);
  res.json({ ok: true });
});

// Admin: problems CRUD (simple bearer; in real app add role checks)
function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.get('/api/admin/problems', requireAuth, requireAdmin, (req, res) => {
  res.json(problemsRepo.list());
});

app.post('/api/admin/problems', requireAuth, requireAdmin, (req, res) => {
  const { title, slug, difficulty, frequency, statement, starterCode, tags, videoUrl, solutionMd, published } = req.body || {};
  if (!title || !slug || !difficulty || !statement) return res.status(400).json({ error: 'Missing fields' });
  const p = problemsRepo.create({ id: `p_${Date.now()}`, title, slug, difficulty, frequency, statement, starterCode, tags, videoUrl: videoUrl || '', solutionMd: solutionMd || '', published });
  res.json(p);
});

app.patch('/api/admin/problems/:slug', requireAuth, requireAdmin, (req, res) => {
  const { slug } = req.params;
  const { title, difficulty, frequency, statement, starterCode, tags, videoUrl, solutionMd, published } = req.body || {};
  const existing = problemsRepo.findBySlug(slug);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const p = problemsRepo.update({ slug, title: title ?? existing.title, difficulty: difficulty ?? existing.difficulty, frequency: frequency ?? existing.frequency, statement: statement ?? existing.statement, starterCode: starterCode ?? existing.starter_code, tags: tags ?? (existing.tags ? existing.tags.split(',') : []), videoUrl: videoUrl ?? existing.video_url, solutionMd: solutionMd ?? existing.solution_md, published: published ?? !!existing.published });
  res.json(p);
});

app.delete('/api/admin/problems/:slug', requireAuth, requireAdmin, (req, res) => {
  problemsRepo.remove(req.params.slug);
  res.json({ ok: true });
});

// Admin: tests
app.get('/api/admin/problems/:slug/tests', requireAuth, requireAdmin, (req, res) => {
  const p = problemsRepo.findBySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(testsRepo.list(p.id));
});

app.post('/api/admin/problems/:slug/tests', requireAuth, requireAdmin, (req, res) => {
  const p = problemsRepo.findBySlug(req.params.slug);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const { order, input, expected } = req.body || {};
  const t = testsRepo.create({ id: `t_${Date.now()}`, problemId: p.id, order: Number(order) || 0, input, expected });
  res.json(t);
});

app.patch('/api/admin/tests/:id', requireAuth, requireAdmin, (req, res) => {
  const { id } = req.params; const { order, input, expected } = req.body || {};
  const t = testsRepo.update({ id, order: Number(order) || 0, input, expected });
  res.json(t);
});

app.delete('/api/admin/tests/:id', requireAuth, requireAdmin, (req, res) => {
  testsRepo.remove(req.params.id);
  res.json({ ok: true });
});

const port = Number(config.port) || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));


