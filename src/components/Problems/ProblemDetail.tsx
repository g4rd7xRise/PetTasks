import { useEffect, useMemo, useRef, useState } from "react";
import { loadProblems } from "./loader";
import type { Problem, ProblemProgress } from "./types";
import { readProgress, writeProgress } from "./progressStore";
import CodeEditor from "./CodeEditor";
import TestResults from "./TestResults";
import VideoPlayer from "./VideoPlayer";
import { Box, Button, Chip, Snackbar, Stack, Tooltip, Typography, Menu, MenuItem, IconButton, FormControlLabel, Checkbox, TextField, Tabs, Tab, Paper } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { api } from "../UI/api";

interface Props {
  slug: string;
  githubRawUrl?: string;
  onBack: () => void;
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function ProblemDetail({ slug, githubRawUrl, onBack }: Props) {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [code, setCode] = useState<string>("");
  const [attempts, setAttempts] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testError, setTestError] = useState<string>("");
  const [allTestsPassed, setAllTestsPassed] = useState<boolean>(false);
  const [leftWidth, setLeftWidth] = useState<number>(33);
  const [midWidth, setMidWidth] = useState<number>(34);
  const [rightWidth, setRightWidth] = useState<number>(33);
  const [leftTab, setLeftTab] = useState<"desc" | "materials" | "solution" | "video" | "answer">("desc");
  const [answerText, setAnswerText] = useState<string>("");
  const [rightTab, setRightTab] = useState<"tests" | "answer">("tests");
  const draggingIndexRef = useRef<0 | 1 | 2 | null>(null);
  const startPosRef = useRef<{ startX: number; startLeft: number; startMid: number } | null>(null);
  const [snack, setSnack] = useState<string>("");
  const [running, setRunning] = useState<boolean>(false);
  const [runMenuAnchor, setRunMenuAnchor] = useState<null | HTMLElement>(null);
  const [runScope, setRunScope] = useState<'all' | 'failed'>('all');
  const [shuffleTests, setShuffleTests] = useState<boolean>(false);
  const [timeoutMs, setTimeoutMs] = useState<number>(2000);

  useEffect(() => {
    loadProblems({ githubRawUrl }).then(setProblems);
  }, [githubRawUrl]);

  // Global mouse handlers for resizers: MUST be before any conditional returns
  useEffect(() => {
    function onMove(ev: MouseEvent) {
      if (!draggingIndexRef.current || !startPosRef.current) return;
      const { startX, startLeft, startMid } = startPosRef.current;
      const dx = ((ev.clientX - startX) / window.innerWidth) * 100;
      if (draggingIndexRef.current === 1) {
        const newLeft = Math.min(60, Math.max(15, startLeft + dx));
        const newMid = Math.min(70, Math.max(15, 100 - newLeft - rightWidth));
        setLeftWidth(newLeft);
        setMidWidth(newMid);
        setRightWidth(Math.max(15, 100 - newLeft - newMid));
      } else if (draggingIndexRef.current === 2) {
        const newMid = Math.min(70, Math.max(15, startMid + dx));
        const newRight = Math.max(15, 100 - leftWidth - newMid);
        setMidWidth(newMid);
        setRightWidth(newRight);
      }
    }
    function onUp() {
      draggingIndexRef.current = null;
      startPosRef.current = null;
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [leftWidth, midWidth, rightWidth]);

  const problem = useMemo(() => {
    if (!problems) return null;
    return problems.find((p) => p.slug === slug) ?? null;
  }, [problems, slug]);

  const derived = useMemo(() => {
    if (!problem) return { videoUrl: undefined as string|undefined, solutionMd: undefined as string|undefined };
    let videoUrl = problem.videoUrl;
    if (!videoUrl && typeof problem.statement === 'string') {
      const m = problem.statement.match(/https?:\/\/(?:www\.)?(?:youtu\.be|youtube\.com)\S*/i);
      if (m) videoUrl = m[0];
    }
    let solutionMd = problem.solutionMd;
    if (!solutionMd && typeof problem.statement === 'string') {
      const m = problem.statement.match(/##\s*Решение[\s\S]*?```[\s\S]*?```/i);
      if (m) {
        const code = m[0].match(/```[a-z]*\n([\s\S]*?)```/i);
        if (code) solutionMd = code[1].trim();
      }
    }
    return { videoUrl, solutionMd };
  }, [problem]);

  const expectedLines = useMemo(() => {
    if (!derived.solutionMd) return [] as string[];
    const text = derived.solutionMd;
    const header = text.match(/Ожидаемый вывод:[\s\S]*?```[a-z]*\n([\s\S]*?)```/i);
    let block = header ? header[1] : text;
    const direct = block.match(/```[a-z]*\n([\s\S]*?)```/i);
    if (direct) block = direct[1];
    return block.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }, [derived.solutionMd]);

  function normalizeLine(s: string): string {
    return s.replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function checkAnswer() {
    const user = answerText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!user.length || !expectedLines.length) { setSnack('Нет данных для проверки'); return; }
    const ok = user.length === expectedLines.length && user.every((l,i)=> normalizeLine(l)===normalizeLine(expectedLines[i]));
    setAttempts(a=>a+1);
    if (ok) {
      setSolved(true);
      writeProgress(problem!.slug, { solved: true, attempts: attempts+1, lastCode: code, lastUpdatedAt: Date.now() });
      setSnack('Верно!');
    } else {
      setSnack('Есть несовпадения. Проверь порядок и строки');
    }
  }

  useEffect(() => {
    if (!problem) return;
    (async () => {
      const existing = await readProgress(problem.slug);
      setCode(existing?.lastCode ?? problem.starterCode ?? "");
      setAttempts(existing?.attempts ?? 0);
      setSolved(existing?.solved ?? false);
    })();
  }, [problem]);

  if (!problems) return <p>Загрузка...</p>;
  if (!problem)
    return (
      <section>
        <p>Задача не найдена.</p>
        <button className="control" onClick={onBack} style={{ width: 160 }}>Назад</button>
      </section>
    );

  function buildTests() {
    const all = problem?.tests ?? [] as any[];
    let list = all;
    if (runScope === 'failed' && testResults.length > 0) {
      const failed = new Set(testResults.filter(r => !r.passed).map(r => r.testId));
      list = all.filter(tc => failed.has(tc.id));
    }
    if (shuffleTests) {
      list = [...list];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    return list;
  }

  function runWithFilter(filterId?: string) {
    if (!problem) return;
    setRunning(true);
    setTestError("");
    setTestResults([]);
    
    try {
      // eslint-disable-next-line no-new-func
      const factory = new Function(`${code}; return ${problem.functionName};`);
      const fn = factory();
      if (typeof fn !== "function") throw new Error(`Функция "${problem.functionName}" не найдена`);

      const results: any[] = [];
      let passedAll = true;
      let testsToRun = buildTests();
      if (filterId) testsToRun = testsToRun.filter(tc => tc.id === filterId);
      const startTs = Date.now();
      for (const tc of testsToRun) {
        if (Date.now() - startTs > timeoutMs) {
          passedAll = false;
          results.push({ testId: tc.id, passed: false, input: tc.input, expected: tc.expected, actual: null, error: `Превышен лимит ${timeoutMs}ms` });
          continue;
        }
        try {
          const actual = fn.apply(null, tc.input as any[]);
          const passed = deepEqual(actual, tc.expected);
          if (!passed) passedAll = false;
          
          results.push({
            testId: tc.id,
            passed,
            input: tc.input,
            expected: tc.expected,
            actual,
          });
        } catch (testErr: any) {
          passedAll = false;
          results.push({
            testId: tc.id,
            passed: false,
            input: tc.input,
            expected: tc.expected,
            actual: null,
            error: String(testErr?.message ?? testErr),
          });
        }
      }

      setTestResults(results);
      setAllTestsPassed(passedAll);

      const nextAttempts = (attempts + 1);
      setAttempts(nextAttempts);
      const nextSolved = passedAll ? true : solved;
      setSolved(nextSolved);
      
      writeProgress(problem.slug, {
        solved: nextSolved,
        attempts: nextAttempts,
        lastCode: code,
        lastUpdatedAt: Date.now(),
      });
    } catch (err: any) {
      setTestError(String(err?.message ?? err));
      const nextAttempts = (attempts + 1);
      setAttempts(nextAttempts);
      writeProgress(problem.slug, {
        solved,
        attempts: nextAttempts,
        lastCode: code,
        lastUpdatedAt: Date.now(),
      });
    } finally {
      setRunning(false);
    }
  }

  function handleRun() { runWithFilter(); }

  function handleMarkSolved() {
    setSolved(true);
    writeProgress(problem.slug, {
      solved: true,
      attempts,
      lastCode: code,
      lastUpdatedAt: Date.now(),
    });
  }

  function handleCodeChange(value: string) {
    setCode(value);
  }

  async function addToTodo() {
    if (!problem) return;
    try {
      await api(`/api/todos`, { method: 'POST', body: { text: `Решить: ${problem.title}` } });
      setSnack("Добавлено в To‑Do");
    } catch {
      setSnack("Не удалось добавить в To‑Do");
    }
  }

  function startDragResizer(index: 1 | 2, e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    draggingIndexRef.current = index;
    startPosRef.current = { startX: e.clientX, startLeft: leftWidth, startMid: midWidth };
  }

  

  return (
    <section>
      {problem && (
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mr: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{problem.title}</Typography>
            <Chip size="small" label={problem.difficulty} color={problem.difficulty === 'easy' ? 'success' : problem.difficulty === 'medium' ? 'warning' : 'error'} variant="outlined" />
            <Chip size="small" label={problem.frequency || 'умеренно'} variant="outlined" />
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Попыток: {attempts}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Последнее: {new Date(Math.max(0, (readProgress(problem.slug)?.lastUpdatedAt ?? 0))).toLocaleDateString()}</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={addToTodo}>Добавить в To‑Do</Button>
          </Stack>
        </Box>
      )}
      <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
        <button className="control" onClick={onBack} style={{ width: 160 }}>
          ← К списку задач
        </button>
        <div style={{ alignSelf: "center", fontSize: 12, color: "#555" }}>Попыток: {attempts} • Статус: {solved ? "Решена" : "Не решена"}</div>
      </div>

      <div className="split-grid full-height" style={{ gridTemplateColumns: `${leftWidth}% 8px ${midWidth}% 8px ${rightWidth}%` }}>
         {/* Panel 1 with tabs */}
         <div className="split-panel" style={{ border: "1px solid var(--card-border)", borderRadius: 8, background: "var(--panel-bg)" }}>
           <div className="panel-header">
             <h3 style={{ marginBottom: 6 }}>{problem.title}</h3>
             <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
               {problem.difficulty.toUpperCase()} • {problem.tags.join(", ")}
             </div>
             <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
               <button 
                 className="control" 
                 style={{ width: 100, marginBottom: 4, backgroundColor: leftTab === "desc" ? "var(--resizer)" : "transparent" }} 
                 onClick={() => setLeftTab("desc")}
               >
                 Описание
               </button>
               <button 
                 className="control" 
                 style={{ width: 100, marginBottom: 4, backgroundColor: leftTab === "materials" ? "var(--resizer)" : "transparent" }} 
                 onClick={() => setLeftTab("materials")}
               >
                 Материалы
               </button>
               <button 
                 className="control" 
                 style={{ width: 80, marginBottom: 4, backgroundColor: leftTab === "solution" ? "var(--resizer)" : "transparent" }} 
                 onClick={() => setLeftTab("solution")}
               >
                 Решение
               </button>
              {/*{problem.tags.includes('eventloop') && (*/}
              {/*  <button */}
              {/*    className="control" */}
              {/*    style={{ width: 90, marginBottom: 4, backgroundColor: leftTab === "answer" ? "var(--resizer)" : "transparent" }} */}
              {/*    onClick={() => setLeftTab("answer")}*/}
              {/*  >*/}
              {/*    Ответ*/}
              {/*  </button>*/}
              {/*)}*/}
               <button 
                 className="control" 
                 style={{ width: 70, marginBottom: 4, backgroundColor: leftTab === "video" ? "var(--resizer)" : "transparent" }} 
                 onClick={() => setLeftTab("video")}
               >
                 Видео
               </button>
             </div>
           </div>
           <div className="panel-content" style={{ padding: 12 }}>
             {leftTab === "desc" && (
               <p style={{ margin: 0, lineHeight: 1.5 }}>{problem.statement}</p>
             )}
             {leftTab === "materials" && (
               <div>
                 <h4 style={{ marginBottom: 8 }}>Материалы</h4>
                 {problem.hints?.length ? (
                   <ul style={{ marginBottom: 12 }}>
                     {problem.hints.map((h, i) => (
                       <li key={i} style={{ marginBottom: 4 }}>{h}</li>
                     ))}
                   </ul>
                 ) : <div style={{ opacity: 0.6, fontSize: 14 }}>Нет подсказок</div>}
                 {problem.resources?.length ? (
                   <ul>
                     {problem.resources.map((r, i) => (
                       <li key={i} style={{ marginBottom: 4 }}>
                         <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "#3fb950" }}>{r.title}</a>
                       </li>
                     ))}
                   </ul>
                 ) : <div style={{ opacity: 0.6, fontSize: 14 }}>Нет ссылок</div>}
               </div>
             )}
            {leftTab === "solution" && (
              <div>
                {derived.solutionMd ? (
                  (() => {
                    const raw = derived.solutionMd as string;
                    const cleaned = raw
                      .replace(/^```[a-z]*\n?/i, '')
                      .replace(/```$/i, '')
                      .trim();
                    return (
                      <pre style={{ background: '#0f172a', color: '#e2e8f0', padding: 12, borderRadius: 8, overflow: 'auto' }}>
                        {cleaned}
                      </pre>
                    );
                  })()
                ) : <div style={{ opacity: 0.6, fontSize: 14 }}>Решение отсутствует</div>}
              </div>
            )}
             {leftTab === "video" && (
               <div>
                 <VideoPlayer 
                  videoUrl={derived.videoUrl}
                  videoEmbedId={problem.videoEmbedId}
                   title={`${problem.title} - Видео разбор`}
                 />
               </div>
             )}
            {leftTab === "answer" && problem.tags.includes('eventloop') && (
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Введите ожидаемый порядок строк (по одной на строку):</div>
                <textarea value={answerText} onChange={e=>setAnswerText(e.target.value)} style={{ width:'100%', minHeight:160, borderRadius:8, padding:8, background:'#0b1220', color:'#e2e8f0', border:'1px solid var(--card-border)' }} />
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <Button variant="contained" size="small" onClick={checkAnswer}>Проверить</Button>
                  <Button variant="outlined" size="small" onClick={()=>setAnswerText(expectedLines.join('\n'))}>Заполнить образцом</Button>
                </div>
              </div>
            )}
           </div>
         </div>

        <div className="v-resizer" onMouseDown={(e) => startDragResizer(1, e)} />

        {/* Panel 2: Editor */}
        <div className="split-panel" style={{ border: "1px solid var(--card-border)", borderRadius: 8, padding: 0, background: "var(--panel-bg)" }}>
          <div className="editor-header">
            <div className="editor-header-left">
              <span className="dot green"></span>
              <span className="title">Code</span>
            </div>
            <div className="editor-header-right">
              {/* language/runtime selectors removed; currently single runtime */}
              <Button variant="outlined" size="small" style={{ width: 110, marginBottom: 0 }} onClick={() => setCode(problem.starterCode ?? "")}>Сбросить</Button>
              <Button variant="contained" size="small" disabled={running || problem.tags.includes('eventloop')} style={{ width: 120, marginBottom: 0 }} onClick={handleRun}>{running ? 'Запуск...' : 'Запустить'}</Button>
              <IconButton size="small" onClick={(e) => setRunMenuAnchor(e.currentTarget)} aria-label="Настройки запуска">
                <MoreVertIcon fontSize="small" />
              </IconButton>
              <Menu anchorEl={runMenuAnchor} open={Boolean(runMenuAnchor)} onClose={() => setRunMenuAnchor(null)}>
                <MenuItem onClick={() => { setRunScope('all'); setRunMenuAnchor(null); }}>Запуск: все тесты</MenuItem>
                <MenuItem onClick={() => { setRunScope('failed'); setRunMenuAnchor(null); }}>Запуск: только упавшие</MenuItem>
                <MenuItem disableRipple>
                  <FormControlLabel control={<Checkbox size="small" checked={shuffleTests} onChange={(e) => setShuffleTests(e.target.checked)} />} label="Случайный порядок" />
                </MenuItem>
                <MenuItem disableRipple>
                  <TextField size="small" type="number" label="Таймаут (мс)" value={timeoutMs} onChange={(e) => setTimeoutMs(Math.max(500, Number(e.target.value)||2000))} sx={{ width: 180 }} />
                </MenuItem>
              </Menu>
            </div>
          </div>
           <CodeEditor
             value={code}
             onChange={handleCodeChange}
             onRun={handleRun}
             onReset={() => setCode(problem.starterCode ?? "")}
           />
          <div className="editor-footer">
            <div className="tab active">Testcase</div>
            <div className="tab">Test Result</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <Button size="small" variant="text" onClick={() => {
                const failed = testResults.filter(r => !r.passed);
                const payload = failed.map(r => r.input).map(i => JSON.stringify(i)).join('\n');
                if (payload) navigator.clipboard.writeText(payload);
              }} startIcon={<ContentCopyIcon fontSize="small" />}>Копировать входы упавших</Button>
              <Button size="small" variant="text" onClick={() => { setTestResults([]); setTestError(""); }}>Очистить</Button>
            </div>
          </div>
        </div>

        <div className="v-resizer" onMouseDown={(e) => startDragResizer(2, e)} />

         {/* Panel 3: Results */}
         <div className="split-panel" style={{ border: "1px solid var(--card-border)", borderRadius: 8, background: "var(--panel-bg)" }}>
            <div className="panel-header" style={{ paddingRight: 8 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Результаты</Typography>
                {problem.tags.includes('eventloop') && (
                  <Tabs value={rightTab} onChange={(_,v)=>setRightTab(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none' } }}>
                    <Tab value="tests" label="Тесты" />
                    <Tab value="answer" label="Ответ" />
                  </Tabs>
                )}
              </Stack>
            </div>
           <div className="panel-content">
              {(!problem.tags.includes('eventloop') || rightTab==='tests') && (
                <TestResults 
                  results={testResults}
                  allPassed={allTestsPassed}
                  error={testError}
                  onRunSingle={(id) => runWithFilter(id)}
                />
              )}
              {problem.tags.includes('eventloop') && rightTab==='answer' && (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'transparent' }}>
                  <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>Введите ожидаемый порядок строк (по одной на строку):</Typography>
                  <textarea value={answerText} onChange={e=>setAnswerText(e.target.value)} style={{ width:'100%', minHeight:160, borderRadius:8, padding:8, background:'#0b1220', color:'#e2e8f0', border:'1px solid var(--card-border)' }} />
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button variant="contained" size="small" onClick={checkAnswer}>Проверить</Button>
                    <Button variant="outlined" size="small" onClick={()=>setAnswerText(expectedLines.join('\n'))}>Заполнить образцом</Button>
                  </Stack>
                </Paper>
              )}
           </div>
         </div>
      </div>
      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack("")}
                message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </section>
  );
}



