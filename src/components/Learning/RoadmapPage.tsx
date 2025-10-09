import { useMemo, useState } from 'react';
import { Box, Stack, Typography, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, Chip, Button, Divider, Link, Tooltip, Fab, TextField } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../Auth/userStore';

export default function RoadmapPage() {
  const [expanded, setExpanded] = useState<string | false>('intro');
  const { user } = useAuth();
  const isAdmin = !!user && (user as any).role === 'admin';

  const initialChapters = useMemo(() => ([
    {
      id: 'intro',
      title: 'Общая информация перед обучением',
      body: (
        <Stack spacing={1.2}>
          <Typography variant="body1">Можно использовать Yandex‑браузер с автопереводом видео и расширения для перевода статей.</Typography>
          <Typography variant="body1">Используйте ChatGPT и Гугл 🔎, чтобы быстрее находить ответы и углубляться в темы.</Typography>
          <Typography variant="body1">‼️ Если есть вопросы — пишите в наш чат или в ЛС. Больше вопросов — быстрее обучение.</Typography>
          <Typography variant="body1">За основу взят <Link href="https://roadmap.sh/frontend" target="_blank" rel="noreferrer">roadmap.sh/frontend</Link>. Добавлены конкретные курсы и материалы.</Typography>
        </Stack>
      )
    },
    {
      id: 'ch0',
      title: 'Глава 0. Введение',
      body: (
        <Stack spacing={1}>
          <Item text="Что такое frontend?" type="video" />
          <Item text="Чем мы вообще тут занимаемся?" type="video" />
          <Item text="Что такое базы данных?" type="video" />
          <Item text="Что такое алгоритмы?" type="video" />
        </Stack>
      )
    },
    {
      id: 'ch1',
      title: 'Глава 1. HTML',
      body: (
        <Stack spacing={1.2}>
          <Item text="Подробный курс по HTML & CSS" type="video" />
          <Item text="Краткий курс от HTMLAcademy" type="video" />
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Нужно понимать:</Typography>
          <Bullet text="Разметка документа и аналоги" />
          <Bullet text="Теги html, body, head" />
          <Bullet text="HTML5. Семантика. Доступность (A11y)" />
          <Bullet text="SEO — видео, практика на youtube.com" />
          <Typography variant="subtitle2">Практика: после Главы 2 (CSS)</Typography>
        </Stack>
      )
    },
    {
      id: 'ch2', title: 'Глава 2. CSS', body: <Placeholder />
    },
    { id: 'ch3', title: 'Глава 3. Git', body: <Placeholder /> },
    { id: 'ch15', title: 'Раздел 1.5. Сети', body: <Typography>Сложный раздел — читать несколько раз, можно параллельно с JS/React/Redux.</Typography> },
    { id: 'ch4', title: 'Глава 4. Теория HTTP', body: <Placeholder /> },
    { id: 'ch5', title: 'Глава 5. Безопасность', body: <Placeholder /> },
    { id: 'ch6', title: 'Глава 6. JS', body: <WithPractice /> },
    { id: 'ch7', title: 'Глава 7. TypeScript', body: <WithPractice /> },
    { id: 'ch8', title: 'Глава 8. React', body: <WithPractice /> },
    { id: 'ch9', title: 'Глава 9. Redux', body: <WithPractice note="После закрытия — можно составлять резюме и откликаться. Параллельно завершайте разделы 3 и 4." /> },
    { id: 'ch95', title: 'Глава 9.5. Продвинутый React', body: <Placeholder /> },
    { id: 'adv', title: 'Раздел 3. Advanced', body: <Placeholder /> },
    { id: 'tst', title: 'Глава 10. Тестирование (Jest, Playwright)', body: <WithPractice /> },
    { id: 'adv2', title: 'Глава 11. Advanced', body: <Placeholder /> },
    { id: 'tools', title: 'Глава 12. Тулзы', body: <Placeholder /> },
    { id: 'theory', title: 'Раздел 4. Важная теория', body: <Placeholder /> },
    { id: 'proc', title: 'Глава 13. Процессы', body: <Placeholder /> },
    { id: 'arch', title: 'Глава 14. Архитектура', body: <Placeholder /> },
    { id: 'patterns', title: 'Глава 15. Паттерны', body: <Placeholder /> },
    { id: 'sd', title: 'Глава 16. System Design', body: <Placeholder /> },
  ]), []);

  const [chapters, setChapters] = useState(initialChapters);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  function startEdit(id: string, current: string) {
    setEditingId(id);
    setEditingTitle(current);
  }
  function saveEdit(id: string) {
    setChapters(list => list.map(c => (c.id === id ? { ...c, title: editingTitle } : c)));
    setEditingId(null);
  }
  function removeChapter(id: string) {
    setChapters(list => list.filter(c => c.id !== id));
    if (expanded === id) setExpanded(false);
  }
  function addChapter() {
    const uid = Math.random().toString(36).slice(2, 6);
    const id = `ch${uid}`;
    setChapters(list => [...list, { id, title: 'Новая глава', body: <Placeholder /> }]);
    setExpanded(id);
    startEdit(id, 'Новая глава');
  }

  return (
    <Box sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>RoadMap обучения</Typography>
        <Typography sx={{ opacity: 0.8 }}>Материал структурирован по главам. Содержимое скрыто по умолчанию, раскрывайте по мере прохождения.</Typography>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Stack spacing={1.5}>
            {chapters.map(ch => (
              <Accordion key={ch.id} expanded={expanded === ch.id} onChange={(_, is) => setExpanded(is ? ch.id : false)} disableGutters sx={{ bgcolor: 'transparent' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                      {editingId === ch.id ? (
                        <TextField value={editingTitle} onChange={(e)=>setEditingTitle(e.target.value)} size="small" variant="standard" fullWidth />
                      ) : (
                        <Typography fontWeight={700} noWrap>{ch.title}</Typography>
                      )}
                      {ch.id.startsWith('ch') && <Chip size="small" label="Глава" />}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {ch.id !== 'intro' && (
                        <Button size="small" variant="contained" onClick={(e) => { e.stopPropagation(); window.location.hash = `learn-${ch.id}`; }}>Открыть</Button>
                      )}
                    </Stack>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1.5}>
                    {/* В развороте — только краткая информация */}
                    {ch.id === 'intro' ? ch.body : <Typography sx={{ opacity: 0.85 }}>Краткое описание главы. Полный материал внутри.</Typography>}
                    {isAdmin && ch.id !== 'intro' && (
                      <Stack direction="row" spacing={1}>
                        {editingId === ch.id ? (
                          <>
                            <Button size="small" variant="contained" onClick={() => saveEdit(ch.id)}>Сохранить</Button>
                            <Button size="small" onClick={() => setEditingId(null)}>Отменить</Button>
                          </>
                        ) : (
                          <>
                            <Button size="small" onClick={() => startEdit(ch.id, ch.title)}>Переименовать</Button>
                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => removeChapter(ch.id)}>Удалить главу</Button>
                          </>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </CardContent>
      </Card>
      {isAdmin && (
        <Tooltip title="Добавить главу">
          <Fab color="primary" size="medium" onClick={addChapter} sx={{ position: 'fixed', bottom: 24, right: 24 }}>
            <AddIcon />
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
}

function Item({ text, type }: { text: string; type?: 'video' | 'article' }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {type === 'video' && <Chip size="small" color="success" label="Видео" />}
      {type === 'article' && <Chip size="small" label="Статья" />}
      <Typography>{text}</Typography>
    </Stack>
  );
}

function Bullet({ text }: { text: string }) {
  return <Typography variant="body2">• {text}</Typography>;
}

function Placeholder({ note }: { note?: string }) {
  return (
    <Stack spacing={1}>
      <Typography>Материалы и ссылки будут добавлены.</Typography>
      {note && <Typography variant="body2" sx={{ opacity: 0.8 }}>{note}</Typography>}
    </Stack>
  );
}

function WithPractice({ note }: { note?: string }) {
  return (
    <Stack spacing={1}>
      <Typography>Теория + ПРАКТИКА</Typography>
      {note && <Typography variant="body2" sx={{ opacity: 0.8 }}>{note}</Typography>}
    </Stack>
  );
}


