import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Divider, Stack, TextField, MenuItem, Typography, IconButton, FormControlLabel, Checkbox, Alert } from '@mui/material';
import { useAuth } from '../Auth/userStore';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../UI/api';

interface AdminProblem {
	id: string; title: string; slug: string; difficulty: 'easy'|'medium'|'hard'; frequency?: 'часто'|'умеренно'|'редко'; statement: string; starter_code?: string; tags?: string; published?: number; video_url?: string; solution_md?: string;
}

interface AdminTest {
	id: string; problem_id: string; order_index: number; input_json: string; expected_json: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  if (!user || (user as any).role !== 'admin') {
    return (
      <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Доступ запрещён</Typography>
          <Typography sx={{ opacity: 0.8, mb: 3 }}>У вас нет прав для просмотра админ‑панели.</Typography>
          <Button variant="contained" onClick={() => (window.location.hash = 'problems-home')}>На главную</Button>
        </Box>
      </Box>
    );
  }
	const [problems, setProblems] = useState<AdminProblem[]>([]);
	const [sel, setSel] = useState<AdminProblem | null>(null);
	const [tests, setTests] = useState<AdminTest[]>([]);
	const [form, setForm] = useState({ title: '', slug: '', difficulty: 'easy', frequency: 'умеренно', statement: '', starterCode: '', tags: '', videoUrl: '', solutionMd: '', published: false });
  const [ghOwner, setGhOwner] = useState('a-khramtsov');
  const [ghRepo, setGhRepo] = useState('frontend-livecoding-practice');
  const [ghFiles, setGhFiles] = useState('eventloop.md,promise.md,react.md');
  const [ghDiff, setGhDiff] = useState<'easy'|'medium'|'hard'>('medium');
  const [ghFreq, setGhFreq] = useState<'часто'|'умеренно'|'редко'>('умеренно');
  const [importMsg, setImportMsg] = useState<string>('');

	async function loadProblems() {
		const list = await api<AdminProblem[]>(`/api/admin/problems`);
		setProblems(list);
	}

	async function loadTests(slug: string) {
		const list = await api<AdminTest[]>(`/api/admin/problems/${slug}/tests`);
		setTests(list);
	}

	useEffect(() => { loadProblems(); }, []);

// Autofill video/solution when selecting problem if missing
useEffect(() => {
    if (!sel) return;
    const vEmpty = !((sel as any).video_url && String((sel as any).video_url).trim());
    const sEmpty = !((sel as any).solution_md && String((sel as any).solution_md).trim());
    if (!vEmpty && !sEmpty) return;
    let next = { ...sel } as any;
    if (vEmpty && typeof sel.statement === 'string') {
        const m = sel.statement.match(/https?:\/\/(?:www\.)?(?:youtube\.com\S*?v=[\w-]{6,}|youtu\.be\/[\w-]{6,})/i);
        if (m) next.video_url = m[0];
    }
    // If solution missing, try to derive from starter_code by capturing console.log order
    async function deriveSolutionFromStarter() {
        if (!sEmpty) { setSel(next); return; }
        const code = (sel as any).starter_code as string | undefined;
        if (!code) { setSel(next); return; }
        const original = console.log as any;
        const logs: string[] = [];
        try {
            (console as any).log = (...args: any[]) => {
                try { logs.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')); }
                catch { logs.push(String(args.join(' '))); }
            };
            const wrapped = `(async () => { try { ${code}\n } catch(_){} })();`;
            // eslint-disable-next-line no-new-func
            const fn = new Function(wrapped);
            fn();
            await Promise.resolve();
            await new Promise(res => setTimeout(res, 20));
        } catch {}
        finally { (console as any).log = original; }
        if (logs.length) {
            next.solution_md = '```text\n' + logs.join('\n') + '\n```';
        }
        setSel(next);
    }
    // fire and forget
    deriveSolutionFromStarter();
}, [sel]);

	async function saveProblem() {
		if (!form.title || !form.slug || !form.statement) return;
		await api(`/api/admin/problems`, { method: 'POST', body: { title: form.title, slug: form.slug, difficulty: form.difficulty, frequency: form.frequency, statement: form.statement, starterCode: form.starterCode, tags: form.tags.split(',').map(s=>s.trim()).filter(Boolean), videoUrl: form.videoUrl, solutionMd: form.solutionMd, published: form.published } });
		await loadProblems();
		setForm({ title: '', slug: '', difficulty: 'easy', frequency: 'умеренно', statement: '', starterCode: '', tags: '', videoUrl: '', solutionMd: '', published: false });
	}

	async function updateSelected() {
		if (!sel) return;
		await api(`/api/admin/problems/${sel.slug}`, { method: 'PATCH', body: { title: sel.title, difficulty: sel.difficulty, frequency: sel.frequency, statement: sel.statement, starterCode: (sel as any).starter_code || '', tags: (sel.tags||'').split(',').map((s:any)=>s.trim()).filter(Boolean), videoUrl: sel.video_url || '', solutionMd: sel.solution_md || '', published: !!sel.published } });
		await loadProblems();
		if (sel) await loadTests(sel.slug);
	}

	async function removeProblem(slug: string) {
		await api(`/api/admin/problems/${slug}`, { method: 'DELETE' });
		setSel(null);
		setTests([]);
		await loadProblems();
	}

	async function addTest() {
		if (!sel) return;
		const order = (tests[tests.length-1]?.order_index ?? 0) + 1;
		await api(`/api/admin/problems/${sel.slug}/tests`, { method: 'POST', body: { order, input: [], expected: null } });
		await loadTests(sel.slug);
	}

	async function updateTest(t: AdminTest) {
		await api(`/api/admin/tests/${t.id}`, { method: 'PATCH', body: { order: t.order_index, input: JSON.parse(t.input_json), expected: JSON.parse(t.expected_json) } });
	}

	async function removeTest(id: string) { await api(`/api/admin/tests/${id}`, { method: 'DELETE' }); if (sel) await loadTests(sel.slug); }

  async function importFromGithub() {
    setImportMsg('');
    const files = ghFiles.split(',').map(s=>s.trim()).filter(Boolean);
    if (!files.length) { setImportMsg('Укажите файлы'); return; }
    const base = `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/`;
    let created = 0; let failed = 0;
    async function fetchMarkdown(path: string): Promise<string | null> {
      // Try raw
      const rawUrl = `https://raw.githubusercontent.com/${ghOwner}/${ghRepo}/master/${path}`;
      try {
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) return await rawRes.text();
      } catch {}
      // Try content with Accept raw
      try {
        const res = await fetch(base + path, { headers: { 'Accept': 'application/vnd.github.v3.raw' } });
        if (res.ok) return await res.text();
      } catch {}
      // Fallback to JSON content->base64
      try {
        const metaRes = await fetch(base + path);
        if (!metaRes.ok) return null;
        const meta = await metaRes.json() as any;
        if (meta && meta.type === 'file' && meta.name?.toLowerCase().endsWith('.md') && meta.content && meta.encoding === 'base64') {
          return atob(meta.content);
        }
        return null;
      } catch { return null; }
    }

    function extractFirstCodeBlock(md: string): string | undefined {
      const codeMatch = md.match(/```(?:ts|tsx|js|jsx)?\s([\s\S]*?)```/i);
      return codeMatch ? codeMatch[1].trim() : undefined;
    }

    function extractFirstYoutube(md: string): string | undefined {
      const m = md.match(/https?:\/\/www\.youtube\.com\/watch\?v=([\w-]+)/i) || md.match(/https?:\/\/youtu\.be\/([\w-]+)/i);
      return m ? m[1] : undefined;
    }

    function splitIntoTasks(md: string): Array<{ title: string; statement: string; starterCode?: string; videoEmbedId?: string; solutionCode?: string; }> {
      // Primary split by HTML comment separators lines
      const sep = /<!--\s*-{6,}.*?-{6,}\s*-->/g;
      const chunks = md.split(sep).map(s => s.trim()).filter(Boolean);
      const bySeparator = chunks.length > 1 ? chunks : null;
      const results: Array<{ title: string; statement: string; starterCode?: string; videoEmbedId?: string; solutionCode?: string; }> = [];
      const pieces = bySeparator || (() => {
        // Fallback split by ### headers
        const lines = md.split(/\r?\n/);
        const acc: string[] = [];
        const out: string[] = [];
        for (const line of lines) {
          if (/^###\s+/.test(line)) {
            if (acc.length) out.push(acc.join('\n'));
            acc.length = 0;
          }
          acc.push(line);
        }
        if (acc.length) out.push(acc.join('\n'));
        return out.length ? out : [md];
      })();

      for (const bodyRaw of pieces) {
        let body = bodyRaw;
        // extract first YouTube link anywhere in section and remove that link markup if present
        let videoEmbedId: string | undefined;
        const ytUrlMatch = body.match(/https?:\/\/(?:www\.)?(?:youtube\.com\S*?v=[\w-]{6,}|youtu\.be\/[\w-]{6,})/i);
        if (ytUrlMatch) {
          const url = ytUrlMatch[0];
          const m = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
          if (m) videoEmbedId = m[1];
          body = body.replace(url, '');
        }
        // also remove explicit [Видеообъяснение](...) markup if exists
        body = body.replace(/\[Вид[её]ообъяснение\]\((https?:[^)]+)\)/ig, '');
        // code blocks extraction: first -> starter, last -> solution (common in these MDs)
        let starterCode: string | undefined;
        let solutionCode: string | undefined;
        const codeBlocks = body.match(/```(?:ts|tsx|js|jsx)?[\s\S]*?```/gi) || [];
        if (codeBlocks.length > 0) {
          const first = codeBlocks[0].replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
          starterCode = first;
          const last = codeBlocks[codeBlocks.length - 1].replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
          if (last && last !== first) solutionCode = last;
        }
        // Build clean statement: remove headers, code blocks, details; keep only the first question line
        let cleaned = body
          .replace(/<details>[\s\S]*?<\/details>/gi, '')
          .replace(/```[\s\S]*?```/g, '')
          .replace(/^###.*$/gmi, '')
          .replace(/^##.*$/gmi, '')
          .replace(/^\s*[-*]\s+.*$/gmi, '')
          .replace(/\r/g, '')
          .trim();
        const lines = cleaned.split(/\n+/).map(s => s.trim()).filter(Boolean);
        const questionLine = lines.find(l => /\?$/.test(l)) || lines[0] || 'Задача';
        const statement = questionLine;
        // Title will be normalized later (filename + index). Return placeholder
        results.push({ title: 'Задача', statement, starterCode, videoEmbedId, solutionCode });
      }
      return results;
    }

    async function simulateExpectedOutput(code?: string): Promise<string[] | null> {
      if (!code) return null;
      const logs: string[] = [];
      const originalLog = console.log as any;
      try {
        (console as any).log = (...args: any[]) => {
          try { logs.push(args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')); }
          catch { logs.push(String(args.join(' '))); }
        };
        const wrapped = `(async () => { try { ${code}\n } catch(e){} })();`;
        // eslint-disable-next-line no-new-func
        const fn = new Function(wrapped);
        fn();
        await Promise.resolve();
        await new Promise(res => setTimeout(res, 20));
      } catch {}
      finally { (console as any).log = originalLog; }
      return logs;
    }

    async function expandPaths(inputs: string[]): Promise<string[]> {
      const out: string[] = [];
      for (const p of inputs) {
        const res = await fetch(base + p);
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data)) {
          // directory listing
          for (const item of data) {
            if (item.type === 'file' && /\.md$/i.test(item.name)) out.push(item.path);
          }
        } else if (data && data.type === 'file') {
          out.push(data.path || p);
        } else {
          out.push(p);
        }
      }
      return out;
    }

    const paths = await expandPaths(files);
    for (const fname of paths) {
      try {
        const content = await fetchMarkdown(fname);
        if (!content) { failed++; continue; }
        const baseName = fname.split('/').pop() || fname;
        const fileTag = baseName.replace(/\.md$/i,'').toLowerCase();

        const tasks = splitIntoTasks(content);
        let idx = 0;
        for (const t of tasks) {
          idx++;
          const title = `${fileTag} ${idx}`;
          const slugBase = `${fileTag}-${idx}`;
          const slug = slugBase.replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
          const tags = [fileTag];
          const statement = t.statement.substring(0, 20000);
          let solutionMd = t.solutionCode ? `\`\`\`ts\n${t.solutionCode}\n\`\`\`` : '';
          try {
            const expected = await simulateExpectedOutput(t.starterCode);
            if (expected && expected.length) {
              const pretty = `Ожидаемый вывод:\n\n\`\`\`text\n${expected.join('\n')}\n\`\`\``;
              solutionMd = solutionMd ? `${solutionMd}\n\n${pretty}` : pretty;
            }
          } catch {}
          const videoUrl = t.videoEmbedId ? `https://youtu.be/${t.videoEmbedId}` : undefined;
          await api(`/api/admin/problems`, { method: 'POST', body: { title, slug, difficulty: ghDiff, frequency: ghFreq, statement, starterCode: t.starterCode || '', tags, published: false, videoUrl, solutionMd } });
          created++;
        }
      } catch {
        failed++;
      }
    }
    setImportMsg(`Импорт завершён: создано ${created}, ошибок ${failed}`);
    await loadProblems();
  }

	return (
		<section>
			<Card>
				<CardHeader title="Админ: задачи" />
				<CardContent>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'flex-start' }}>
						<Box sx={{ flex: 1, minWidth: 280 }}>
							<Typography variant="subtitle1" sx={{ mb: 1 }}>Создать новую</Typography>
							<Stack spacing={1}>
								<TextField size="small" label="Заголовок" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
								<TextField size="small" label="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} />
								<TextField size="small" select label="Сложность" value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value as any})}>
									<MenuItem value="easy">Лёгкая</MenuItem>
									<MenuItem value="medium">Средняя</MenuItem>
									<MenuItem value="hard">Сложная</MenuItem>
								</TextField>
								<TextField size="small" select label="Частота" value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value as any})}>
									<MenuItem value="часто">Часто</MenuItem>
									<MenuItem value="умеренно">Умеренно</MenuItem>
									<MenuItem value="редко">Редко</MenuItem>
								</TextField>
								<TextField size="small" label="Теги (через запятую)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
							<TextField size="small" label="Starter code" multiline minRows={3} value={form.starterCode} onChange={e=>setForm({...form,starterCode:e.target.value})} />
							<TextField size="small" label="Видео (URL)" value={form.videoUrl} onChange={e=>setForm({...form,videoUrl:e.target.value})} />
							<TextField size="small" label="Решение (Markdown)" multiline minRows={3} value={form.solutionMd} onChange={e=>setForm({...form,solutionMd:e.target.value})} />
								<TextField size="small" label="Statement" multiline minRows={4} value={form.statement} onChange={e=>setForm({...form,statement:e.target.value})} />
								<FormControlLabel control={<Checkbox size="small" checked={form.published} onChange={e=>setForm({...form, published: e.target.checked})} />} label="Опубликовано" />
								<Button variant="contained" onClick={saveProblem}>Сохранить</Button>
							</Stack>
						</Box>
						<Box sx={{ flex: 1 }}>
							<Typography variant="subtitle1" sx={{ mb: 1 }}>Список</Typography>
							{problems.map(p => (
								<Box key={p.id} sx={{ border: '1px solid var(--card-border)', borderRadius: 1, p: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<div>
										<b>{p.title}</b> <span style={{ opacity: .7 }}>({p.slug})</span> {p.published ? <span style={{ color: '#3fb950', fontSize: 12 }}>опубликовано</span> : <span style={{ color: '#f0ad4e', fontSize: 12 }}>черновик</span>}
									</div>
									<div>
										<Button size="small" onClick={() => { setSel(p); loadTests(p.slug); }}>Редактировать</Button>
										<IconButton size="small" onClick={() => removeProblem(p.slug)} aria-label="Удалить"><DeleteIcon fontSize="small" /></IconButton>
									</div>
								</Box>
							))}
						</Box>
					</Stack>
					<Divider sx={{ my: 2 }} />
					<Typography variant="subtitle1" sx={{ mb: 1 }}>Импорт из GitHub (markdown → задача)</Typography>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 1 }}>
						<TextField size="small" label="owner" value={ghOwner} onChange={e=>setGhOwner(e.target.value)} />
						<TextField size="small" label="repo" value={ghRepo} onChange={e=>setGhRepo(e.target.value)} />
						<TextField size="small" label="files (comma)" fullWidth value={ghFiles} onChange={e=>setGhFiles(e.target.value)} />
						<TextField size="small" select label="Сложность" value={ghDiff} onChange={e=>setGhDiff(e.target.value as any)} sx={{ minWidth: 140 }}>
							<MenuItem value="easy">Лёгкая</MenuItem>
							<MenuItem value="medium">Средняя</MenuItem>
							<MenuItem value="hard">Сложная</MenuItem>
						</TextField>
						<TextField size="small" select label="Частота" value={ghFreq} onChange={e=>setGhFreq(e.target.value as any)} sx={{ minWidth: 160 }}>
							<MenuItem value="часто">Часто</MenuItem>
							<MenuItem value="умеренно">Умеренно</MenuItem>
							<MenuItem value="редко">Редко</MenuItem>
						</TextField>
						<Button variant="outlined" onClick={importFromGithub}>Импортировать</Button>
					</Stack>
					{importMsg && <Alert severity="info">{importMsg}</Alert>}
					{sel && (
						<Box sx={{ mt: 2 }}>
							<Divider sx={{ mb: 1 }} />
							<Typography variant="subtitle1">Редактирование: {sel.title}</Typography>
							<Stack spacing={1} sx={{ mt: 1, mb: 2 }}>
								<TextField size="small" label="Заголовок" value={sel.title} onChange={e=>setSel({...sel!, title:e.target.value})} />
								<TextField size="small" select label="Сложность" value={sel.difficulty} onChange={e=>setSel({...sel!, difficulty:e.target.value as any})}>
									<MenuItem value="easy">Лёгкая</MenuItem>
									<MenuItem value="medium">Средняя</MenuItem>
									<MenuItem value="hard">Сложная</MenuItem>
								</TextField>
								<TextField size="small" select label="Частота" value={sel.frequency || 'умеренно'} onChange={e=>setSel({...sel!, frequency:e.target.value as any})}>
									<MenuItem value="часто">Часто</MenuItem>
									<MenuItem value="умеренно">Умеренно</MenuItem>
									<MenuItem value="редко">Редко</MenuItem>
								</TextField>
								<TextField size="small" label="Теги" value={sel.tags || ''} onChange={e=>setSel({...sel!, tags:e.target.value})} />
								<TextField size="small" label="Starter code" multiline minRows={3} value={(sel as any).starter_code || ''} onChange={e=>setSel({...sel!, starter_code:e.target.value as any})} />
								<TextField size="small" label="Видео (URL)" value={(sel as any).video_url || ''} onChange={e=>setSel({...sel!, video_url:e.target.value as any})} />
								<TextField size="small" label="Решение (Markdown)" multiline minRows={3} value={(sel as any).solution_md || ''} onChange={e=>setSel({...sel!, solution_md:e.target.value as any})} />
								<TextField size="small" label="Statement" multiline minRows={4} value={sel.statement} onChange={e=>setSel({...sel!, statement:e.target.value})} />
								<FormControlLabel control={<Checkbox size="small" checked={!!sel.published} onChange={e=>setSel({...sel!, published: e.target.checked ? 1 : 0})} />} label="Опубликовано" />
								<Button variant="contained" onClick={updateSelected}>Обновить</Button>
							</Stack>
							<Typography variant="subtitle1">Тесты</Typography>
							{tests.map(t => (
								<Stack key={t.id} direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ border: '1px solid var(--card-border)', borderRadius: 1, p: 1, mb: 1 }}>
									<TextField size="small" label="#" type="number" value={t.order_index} onChange={e => { const v = { ...t, order_index: Number(e.target.value) }; setTests(prev => prev.map(x => x.id === t.id ? v : x)); updateTest(v); }} sx={{ width: 80 }} />
									<TextField size="small" label="input JSON" value={t.input_json} onChange={e => { const v = { ...t, input_json: e.target.value }; setTests(prev => prev.map(x => x.id === t.id ? v : x)); }} onBlur={() => updateTest(t)} fullWidth />
									<TextField size="small" label="expected JSON" value={t.expected_json} onChange={e => { const v = { ...t, expected_json: e.target.value }; setTests(prev => prev.map(x => x.id === t.id ? v : x)); }} onBlur={() => updateTest(t)} fullWidth />
									<IconButton size="small" onClick={() => removeTest(t.id)} aria-label="Удалить"><DeleteIcon fontSize="small" /></IconButton>
								</Stack>
							))}
							<Button size="small" variant="outlined" onClick={addTest}>Добавить тест</Button>
						</Box>
					)}
				</CardContent>
			</Card>
		</section>
	);
}


