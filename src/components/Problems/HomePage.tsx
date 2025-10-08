import { useEffect, useMemo, useState } from "react";
import { loadProblems } from "./loader";
import type { Problem } from "./types";
import { aggregateStats } from "./progressStore";
import { Card, CardContent, CardHeader, Stack, Typography, Checkbox, TextField, Button, Box, IconButton, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from "../UI/api";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';

interface Props {
  githubRawUrl?: string;
}

export default function HomePage({ githubRawUrl }: Props) {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [todos, setTodos] = useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [todoText, setTodoText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [todoError, setTodoError] = useState<string | null>(null);
  const hasToken = (() => { try { return !!localStorage.getItem('app-token'); } catch { return false; } })();

  useEffect(() => {
    loadProblems({ githubRawUrl }).then(setProblems);
  }, [githubRawUrl]);

  const stats = useMemo(() => {
    const slugs = problems?.map((p) => p.slug) ?? [];
    return aggregateStats(slugs);
  }, [problems]);

  const [daily, setDaily] = useState<{ date: string; solved: number; attempted: number }[] | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ date: string; solved: number; attempted: number }[]>(`/api/stats/daily?days=14`);
        setDaily(data);
      } catch { setDaily(null); }
    })();
  }, []);

  async function addTodo() {
    const text = todoText.trim();
    if (!text) return;
    setTodoError(null);
    const tempId = `tmp_${Date.now()}`;
    setTodos(prev => [{ id: tempId, text, completed: false }, ...prev]);
    try {
      const created = await api<{ id: string; text: string; completed: boolean }>(`/api/todos`, { method: 'POST', body: { text } });
      setTodos(prev => prev.map(t => t.id === tempId ? created : t));
    } catch (e: any) {
      setTodos(prev => prev.filter(t => t.id !== tempId));
      setTodoError(e?.status === 401 ? 'Сессия истекла, войдите снова.' : 'Не удалось добавить задачу.');
    }
    setTodoText('');
  }

  async function toggleTodo(id: string, completed: boolean) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    try { await api(`/api/todos/${id}`, { method: 'PATCH', body: { completed } }); } catch {}
  }

  async function removeTodo(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id));
    try { await api(`/api/todos/${id}`, { method: 'DELETE' }); } catch {}
  }

  async function updateTodoText(id: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) { await removeTodo(id); return; }
    setTodos(prev => prev.map(t => t.id === id ? { ...t, text: trimmed } : t));
    try { await api(`/api/todos/${id}`, { method: 'PATCH', body: { text: trimmed } }); } catch {}
  }

  async function toggleAll(nextCompleted: boolean) {
    const ids = todos.map(t => t.id);
    setTodos(prev => prev.map(t => ({ ...t, completed: nextCompleted })));
    try { await Promise.all(ids.map(id => api(`/api/todos/${id}`, { method: 'PATCH', body: { completed: nextCompleted } }))); } catch {}
  }

  async function clearCompleted() {
    const doneIds = todos.filter(t => t.completed).map(t => t.id);
    setTodos(prev => prev.filter(t => !t.completed));
    try { await Promise.all(doneIds.map(id => api(`/api/todos/${id}`, { method: 'DELETE' }))); } catch {}
  }

  useEffect(() => {
    (async () => {
      try {
        const items = await api<{ id: string; text: string; completed: boolean }[]>(`/api/todos`);
        setTodos(items);
        setTodoError(null);
      } catch (e: any) {
        setTodoError(e?.status === 401 ? 'Сессия истекла, войдите снова.' : 'Список задач недоступен.');
      }
    })();
  }, []);

  return (
    <section>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 4, mb: 3, alignItems: 'stretch' }}>
        <Box>
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
          <CardHeader title="Тренировочный хаб" subheader="Работайте над задачами и отслеживайте прогресс" />
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="body2">Ctrl+Enter — запустить тесты</Typography>
              <Typography variant="body2">Задача отмечается решенной при прохождении всех тестов</Typography>
              <Typography variant="body2">Можно импортировать задачи с GitHub (см. источник в настройке)</Typography>
            </Stack>
          </CardContent>
        </Card>
        </Box>
        <Box>
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
          <CardHeader title="Прогресс" />
          <CardContent>
            <Box sx={{ maxWidth: 320, mx: 'auto' }}>
              <PieChart
                series={[{ data: [
                  { id: 0, value: stats.solved, label: 'Решено' },
                  { id: 1, value: stats.attempted, label: 'Попытки' },
                  { id: 2, value: Math.max(stats.total - stats.solved - stats.attempted, 0), label: 'Осталось' },
                ]}]}
                width={320}
                height={200}
                slotProps={{ legend: { hidden: true } } as any}
              />
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>Всего: {stats.total}</Typography>
          </CardContent>
        </Card>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr' }, gap: 4, mt: 0, alignItems: 'stretch' }}>
        <Card sx={{ borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
          <CardHeader title="Активность по дням (14)" />
          <CardContent>
            {daily && daily.length > 0 ? (
              <LineChart
                xAxis={[{ scaleType: 'point', data: daily.map(d => d.date.slice(5)) }]}
                series={[
                  { id: 'attempted', data: daily.map(d => d.attempted), label: 'Попытки' },
                  { id: 'solved', data: daily.map(d => d.solved), label: 'Решено' },
                ]}
                height={260}
              />
            ) : (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>Недостаточно данных для графика</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4, mt: 3, alignItems: 'stretch' }}>
        <Box>
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
          <CardHeader title="Личный To‑Do" />
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField fullWidth size="small" placeholder="Добавить задачу" value={todoText} onChange={e => setTodoText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addTodo(); }} />
              <Button variant="contained" size="small" onClick={addTodo}>Добавить</Button>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Checkbox size="small" checked={todos.length > 0 && todos.every(t => t.completed)} indeterminate={todos.some(t => t.completed) && !todos.every(t => t.completed)} onChange={(e) => toggleAll(e.target.checked)} />
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Всего: {todos.length}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, ml: 1 }}>{hasToken ? 'Авторизован' : 'Нет токена'}</Typography>
              </Stack>
              <ToggleButtonGroup value={filter} exclusive size="small" onChange={(_, v) => v && setFilter(v)}>
                <ToggleButton value="all">Все</ToggleButton>
                <ToggleButton value="active">Активные</ToggleButton>
                <ToggleButton value="completed">Выполненные</ToggleButton>
              </ToggleButtonGroup>
              <Button variant="text" size="small" onClick={clearCompleted} disabled={!todos.some(t => t.completed)}>Удалить выполненные</Button>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1}>
              {todoError && (
                <Typography variant="caption" color="error">{todoError}</Typography>
              )}
              {todos.length === 0 && (
                <Typography variant="body2" sx={{ opacity: 0.7 }}>Пока пусто</Typography>
              )}
              {todos.filter(t => filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed).map(t => (
                <Stack key={t.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                    <Checkbox checked={t.completed} onChange={(e) => toggleTodo(t.id, e.target.checked)} />
                    {editingId === t.id ? (
                      <TextField size="small" fullWidth autoFocus value={editingText}
                                 onChange={(e) => setEditingText(e.target.value)}
                                 onBlur={() => { updateTodoText(t.id, editingText); setEditingId(null); }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') { updateTodoText(t.id, editingText); setEditingId(null); }
                                   if (e.key === 'Escape') { setEditingId(null); }
                                 }} />
                    ) : (
                      <Typography onDoubleClick={() => { setEditingId(t.id); setEditingText(t.text); }}
                                  sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1, textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.7 : 1 }}>
                        {t.text}
                      </Typography>
                    )}
                  </Stack>
                  <IconButton size="small" onClick={() => removeTodo(t.id)} aria-label="Удалить"><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
        </Box>
        <Box>
        <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 1, overflow: 'hidden' }}>
          <CardHeader title="Подсказки" />
          <CardContent>
            <Typography variant="body2">— Старайтесь решать задачи маленькими шагами</Typography>
            <Typography variant="body2">— Запускайте тесты как можно чаще</Typography>
            <Typography variant="body2">— Отмечайте прогресс для мотивации</Typography>
          </CardContent>
        </Card>
        </Box>
      </Box>
    </section>
  );
}


