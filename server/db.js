import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';

const DB_PATH = config.dbPath;

// Ensure directory exists
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
	// users table
	db.prepare(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			avatar_url TEXT DEFAULT '',
			role TEXT DEFAULT 'user'
		)
	`).run();

	// ensure role column exists (for older DBs)
	try {
		const cols = db.prepare("PRAGMA table_info(users)").all();
		if (!cols.find(c => c.name === 'role')) {
			db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run();
		}
	} catch {}

	// problem progress table (future use)
	db.prepare(`
		CREATE TABLE IF NOT EXISTS problem_progress (
			user_id TEXT NOT NULL,
			slug TEXT NOT NULL,
			status TEXT NOT NULL CHECK (status IN ('attempted','solved')),
			code_snippet TEXT DEFAULT '',
			updated_at INTEGER NOT NULL,
			PRIMARY KEY(user_id, slug),
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`).run();

	// todos table
	db.prepare(`
		CREATE TABLE IF NOT EXISTS todos (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			text TEXT NOT NULL,
			completed INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`).run();

	// problems and tests (admin)
	db.prepare(`
		CREATE TABLE IF NOT EXISTS problems (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
			frequency TEXT DEFAULT 'умеренно',
			statement TEXT NOT NULL,
			starter_code TEXT DEFAULT '',
			tags TEXT DEFAULT '',
			video_url TEXT DEFAULT '',
			solution_md TEXT DEFAULT '',
			published INTEGER NOT NULL DEFAULT 0
		)
	`).run();

	// ensure published column exists
	try {
		const cols = db.prepare("PRAGMA table_info(problems)").all();
		if (!cols.find(c => c.name === 'video_url')) {
			db.prepare("ALTER TABLE problems ADD COLUMN video_url TEXT DEFAULT ''").run();
		}
		if (!cols.find(c => c.name === 'solution_md')) {
			db.prepare("ALTER TABLE problems ADD COLUMN solution_md TEXT DEFAULT ''").run();
		}
		if (!cols.find(c => c.name === 'published')) {
			db.prepare("ALTER TABLE problems ADD COLUMN published INTEGER NOT NULL DEFAULT 0").run();
		}
	} catch {}

	// learning: chapters and sections
	db.prepare(`
		CREATE TABLE IF NOT EXISTS learning_chapters (
			id TEXT PRIMARY KEY,
			slug TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL,
			badge TEXT DEFAULT 'Глава',
			parent_slug TEXT DEFAULT NULL,
		intro_text TEXT DEFAULT '',
			order_num INTEGER NOT NULL DEFAULT 0
		)
	`).run();

	db.prepare(`
		CREATE TABLE IF NOT EXISTS learning_sections (
			id TEXT PRIMARY KEY,
			chapter_id TEXT NOT NULL,
			anchor TEXT NOT NULL,
			title TEXT NOT NULL,
			text_md TEXT DEFAULT '',
			videos_json TEXT DEFAULT '[]',
			order_num INTEGER NOT NULL DEFAULT 0,
			FOREIGN KEY(chapter_id) REFERENCES learning_chapters(id) ON DELETE CASCADE
		)
	`).run();

	// ensure parent_slug and intro_text exist (for hierarchy and descriptions)
	try {
		const cols = db.prepare("PRAGMA table_info(learning_chapters)").all();
		if (!cols.find(c => c.name === 'parent_slug')) {
			db.prepare("ALTER TABLE learning_chapters ADD COLUMN parent_slug TEXT DEFAULT NULL").run();
		}
		if (!cols.find(c => c.name === 'intro_text')) {
			db.prepare("ALTER TABLE learning_chapters ADD COLUMN intro_text TEXT DEFAULT ''").run();
		}
	} catch {}

	db.prepare(`
		CREATE TABLE IF NOT EXISTS problem_tests (
			id TEXT PRIMARY KEY,
			problem_id TEXT NOT NULL,
			order_index INTEGER NOT NULL,
			input_json TEXT NOT NULL,
			expected_json TEXT NOT NULL,
			FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
		)
	`).run();
}

export const usersRepo = {
	findByEmail(email) {
		return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null;
	},
	findById(id) {
		return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
	},
	create({ id, name, email, passwordHash, avatarUrl }) {
		db.prepare(
			'INSERT INTO users (id, name, email, password_hash, avatar_url) VALUES (?, ?, ?, ?, ?)'
		).run(id, name, email, passwordHash, avatarUrl || '');
		return this.findByEmail(email);
	},
	updateRoleByEmail(email, role) {
		db.prepare('UPDATE users SET role = ? WHERE email = ?').run(role, email);
		return this.findByEmail(email);
	}
};

export const progressRepo = {
	upsert({ userId, slug, status, codeSnippet, updatedAt }) {
		db.prepare(`
			INSERT INTO problem_progress (user_id, slug, status, code_snippet, updated_at)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT(user_id, slug) DO UPDATE SET
				status = excluded.status,
				code_snippet = excluded.code_snippet,
				updated_at = excluded.updated_at
		`).run(userId, slug, status, codeSnippet || '', updatedAt);
	},
	read(userId, slug) {
		return db.prepare('SELECT * FROM problem_progress WHERE user_id = ? AND slug = ?').get(userId, slug) || null;
	},
	statsIndex(userId) {
		const rows = db.prepare('SELECT slug, status FROM problem_progress WHERE user_id = ?').all(userId);
		const idx = {};
		for (const r of rows) idx[r.slug] = r.status;
		return idx;
	},
	db
};

export const todosRepo = {
	list(userId) {
		return db.prepare('SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC').all(userId);
	},
	create({ id, userId, text, completed, createdAt }) {
		db.prepare('INSERT INTO todos (id, user_id, text, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
			.run(id, userId, text, completed ? 1 : 0, createdAt, createdAt);
		return db.prepare('SELECT * FROM todos WHERE id = ?').get(id);
	},
	update({ id, userId, text, completed, updatedAt }) {
		db.prepare('UPDATE todos SET text = COALESCE(?, text), completed = COALESCE(?, completed), updated_at = ? WHERE id = ? AND user_id = ?')
			.run(text ?? null, completed === undefined ? null : (completed ? 1 : 0), updatedAt, id, userId);
		return db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, userId);
	},
	delete(id, userId) {
		return db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, userId);
	}
};

export const problemsRepo = {
	list() { return db.prepare('SELECT * FROM problems ORDER BY title').all(); },
	findBySlug(slug) { return db.prepare('SELECT * FROM problems WHERE slug = ?').get(slug) || null; },
	create(p) {
		db.prepare('INSERT INTO problems (id, title, slug, difficulty, frequency, statement, starter_code, tags, video_url, solution_md, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
			.run(p.id, p.title, p.slug, p.difficulty, p.frequency || 'умеренно', p.statement, p.starterCode || '', (p.tags||[]).join(','), p.videoUrl || '', p.solutionMd || '', p.published ? 1 : 0);
		return this.findBySlug(p.slug);
	},
	update(p) {
		db.prepare('UPDATE problems SET title=?, difficulty=?, frequency=?, statement=?, starter_code=?, tags=?, video_url=?, solution_md=?, published=? WHERE slug=?')
			.run(p.title, p.difficulty, p.frequency || 'умеренно', p.statement, p.starterCode || '', (p.tags||[]).join(','), p.videoUrl || '', p.solutionMd || '', p.published ? 1 : 0, p.slug);
		return this.findBySlug(p.slug);
	},
	remove(slug) { return db.prepare('DELETE FROM problems WHERE slug=?').run(slug); }
};

export const testsRepo = {
	list(problemId) { return db.prepare('SELECT * FROM problem_tests WHERE problem_id = ? ORDER BY order_index').all(problemId); },
	create(t) {
		db.prepare('INSERT INTO problem_tests (id, problem_id, order_index, input_json, expected_json) VALUES (?, ?, ?, ?, ?)')
			.run(t.id, t.problemId, t.order, JSON.stringify(t.input), JSON.stringify(t.expected));
		return db.prepare('SELECT * FROM problem_tests WHERE id=?').get(t.id);
	},
	update(t) {
		db.prepare('UPDATE problem_tests SET order_index=?, input_json=?, expected_json=? WHERE id=?')
			.run(t.order, JSON.stringify(t.input), JSON.stringify(t.expected), t.id);
		return db.prepare('SELECT * FROM problem_tests WHERE id=?').get(t.id);
	},
	remove(id) { return db.prepare('DELETE FROM problem_tests WHERE id=?').run(id); }
};

export const learningRepo = {
  listChapters() {
	// Order: Sections first, then children (by order_num within parent), then orphan top-level chapters
	return db.prepare(`
		SELECT * FROM learning_chapters
		ORDER BY CASE
		  WHEN badge = 'Раздел' THEN 0
		  WHEN parent_slug IS NOT NULL THEN 1
		  ELSE 2
		END, order_num, title
	`).all();
  },
  getChapterBySlug(slug) {
    const ch = db.prepare('SELECT * FROM learning_chapters WHERE slug = ?').get(slug);
    if (!ch) return null;
    const sections = db.prepare('SELECT * FROM learning_sections WHERE chapter_id = ? ORDER BY order_num').all(ch.id);
    return {
      id: ch.id,
      slug: ch.slug,
      title: ch.title,
      badge: ch.badge,
      parentSlug: ch.parent_slug,
      introText: ch.intro_text || '',
      sections: sections.map(s => ({ id: s.id, anchor: s.anchor, title: s.title, textMd: s.text_md || '', videos: JSON.parse(s.videos_json || '[]') }))
    };
  },
  upsertChapter({ id, slug, title, badge, order, parentSlug, introText }) {
    // Normalize parentSlug to a clean slug without query fragments
    const normalizeParent = (v) => {
      if (!v) return null;
      const s = String(v);
      const cut = s.split('?')[0];
      return cut || null;
    };
    parentSlug = normalizeParent(parentSlug);
    const existingBySlug = db.prepare('SELECT * FROM learning_chapters WHERE slug = ?').get(slug);
    if (existingBySlug) {
      db.prepare('UPDATE learning_chapters SET title=?, badge=?, order_num=?, parent_slug=?, intro_text=? WHERE slug=?')
        .run(title, badge || 'Глава', order || 0, parentSlug || null, introText || '', slug);
      return this.getChapterBySlug(slug);
    }

    // No title-based merging to avoid unexpected slug swaps; rely on slug identity only

    // Generate a new, collision-free id for a new chapter; never reuse an id of another slug
    function generateId() {
      return `lc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    }
    let candidateId = id || generateId();
    let rowById = db.prepare('SELECT * FROM learning_chapters WHERE id = ?').get(candidateId);
    if (rowById && rowById.slug !== slug) {
      // This id already belongs to another chapter; generate a fresh one
      do {
        candidateId = generateId();
        rowById = db.prepare('SELECT * FROM learning_chapters WHERE id = ?').get(candidateId);
      } while (rowById);
    }
    if (rowById && rowById.slug === slug) {
      // Same chapter by id, just update
      db.prepare('UPDATE learning_chapters SET slug=?, title=?, badge=?, order_num=?, parent_slug=?, intro_text=? WHERE id=?')
        .run(slug, title, badge || 'Глава', order || 0, parentSlug || null, introText || '', candidateId);
      return this.getChapterBySlug(slug);
    }
    // Safe insert with collision-free id
    db.prepare('INSERT INTO learning_chapters (id, slug, title, badge, parent_slug, intro_text, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(candidateId, slug, title, badge || 'Глава', parentSlug || null, introText || '', order || 0);
    return this.getChapterBySlug(slug);
  },
  removeChapter(slug) {
    const ch = db.prepare('SELECT * FROM learning_chapters WHERE slug = ?').get(slug);
    if (!ch) return;
    // delete child chapters referencing this as parent
    db.prepare('DELETE FROM learning_chapters WHERE parent_slug = ?').run(ch.slug);
    db.prepare('DELETE FROM learning_chapters WHERE id=?').run(ch.id);
  },
  upsertSection({ id, chapterId, anchor, title, textMd, videos, order }) {
    const exists = db.prepare('SELECT id FROM learning_sections WHERE id=?').get(id);
    if (exists) {
      // Always ensure chapter_id is set on update to avoid sections "sticking" to an old chapter when ids collide
      db.prepare('UPDATE learning_sections SET chapter_id=?, anchor=?, title=?, text_md=?, videos_json=?, order_num=? WHERE id=?')
        .run(chapterId, anchor, title, textMd || '', JSON.stringify(videos || []), order || 0, id);
    } else {
      db.prepare('INSERT INTO learning_sections (id, chapter_id, anchor, title, text_md, videos_json, order_num) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, chapterId, anchor, title, textMd || '', JSON.stringify(videos || []), order || 0);
    }
    return db.prepare('SELECT * FROM learning_sections WHERE id=?').get(id);
  },
  removeSection(id) {
    db.prepare('DELETE FROM learning_sections WHERE id=?').run(id);
  }
};

// Admin utilities for learning
export const learningAdmin = {
  cleanupOrphans() {
    // delete chapters that are not sections and have no parent
    db.prepare("DELETE FROM learning_chapters WHERE (parent_slug IS NULL OR parent_slug = '') AND (badge IS NULL OR badge != 'Раздел')").run();
  }
};


