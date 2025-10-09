import { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography, Card, CardContent, Divider, List, ListItemButton, ListSubheader, IconButton, Tooltip, TextField, Button, Fab, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../Auth/userStore';
import { api } from '../UI/api';
import ReactMarkdown from 'react-markdown';

interface Props { id: string; }

export default function ChapterPage({ id }: Props) {
  const data = useMemo(() => getChapterData(id), [id]);
  const { user } = useAuth();
  const isAdmin = !!user && (user as any).role === 'admin';
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [subtitle, setSubtitle] = useState(data.subtitle);
  const [sections, setSections] = useState<SectionData[]>(data.sections);
  const [chapterId, setChapterId] = useState<string>('');
  const [parentSlug, setParentSlug] = useState<string | null>(null);

  // fetch chapter from API if exists
  useEffect(() => {
    (async () => {
      try {
        const slug = id;
        // take parent from URL if provided
        const url = new URL(window.location.href);
        const parentFromUrl = url.hash.includes('?') ? new URLSearchParams(url.hash.split('?')[1]).get('parent') : null;
        const ch = await api<any>(`/api/learning/chapters/${slug}`);
        if (ch && ch.sections) {
          setTitle(ch.title || title);
          setSubtitle(ch.badge ? `${ch.badge}` : subtitle);
          setChapterId(ch.id);
          setParentSlug(parentFromUrl || ch.parentSlug || null);
          setSections((ch.sections || []).map((s: any) => ({ id: s.id, anchor: s.anchor, title: s.title, text: s.textMd || '', embed: s.videos?.[0], embed2: s.videos?.[1] })));
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function toEmbed(url?: string) {
    if (!url) return '';
    if (/^https?:\/\/www\.youtube\.com\/embed\//.test(url)) return url;
    const id = url.match(/youtu\.be\/([\w-]{6,})/)?.[1] || url.match(/[?&]v=([\w-]{6,})/)?.[1] || '';
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  function updateSection(index: number, patch: Partial<SectionData>) {
    setSections(list => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function removeSection(index: number) {
    setSections(list => list.filter((_, i) => i !== index));
  }
  function addSection() {
    const uid = Math.random().toString(36).slice(2, 8);
    setSections(list => [...list, { id: `ls_${Date.now()}_${uid}`, anchor: `sec-${uid}`, title: 'Новый раздел', text: '' }]);
  }

  async function persistAll() {
    try {
      // upsert chapter meta with parent
      await api('/api/admin/learning/chapters', { method: 'POST', body: { id: chapterId || `lc_${Date.now()}`, slug: id, title, badge: 'Глава', parentSlug: parentSlug || undefined, order: 0 } });
      // fetch chapter to get id if missing
      const ch = await api<any>(`/api/learning/chapters/${id}`);
      const chId = ch?.id;
      if (!chId) throw new Error('chapter not found after save');
      // Upsert sections sequentially
      for (let idx = 0; idx < sections.length; idx++) {
        const s = sections[idx];
        const videos = [s.embed, s.embed2].filter(Boolean);
        await api('/api/admin/learning/sections', { method: 'POST', body: { id: s.id || `ls_${Date.now()}_${idx}`, chapterId: chId, anchor: s.anchor, title: s.title || 'Без названия', textMd: s.text || '', videos, order: idx } });
      }
      // reload from DB to ensure consistency
      const fresh = await api<any>(`/api/learning/chapters/${id}`);
      if (fresh && fresh.sections) {
        setSections((fresh.sections || []).map((s: any) => ({ id: s.id, anchor: s.anchor, title: s.title, text: s.textMd || '', embed: s.videos?.[0], embed2: s.videos?.[1] })));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to save chapter', e);
      alert('Не удалось сохранить изменения. Проверьте, что у вас права администратора и сервер запущен.');
    }
  }

  return (
    <Box sx={{ py: 4 }}>
      {isAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Подсказки Markdown: заголовки #, **жирный**, _курсив_, списки -, нумерация 1., код `inline` и блоки ```.
          Поддерживается GitHub Flavored Markdown (таблицы, чекбоксы).
        </Alert>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        <Card variant="outlined" sx={{ width: { xs: '100%', md: 280 }, position: 'sticky', top: 88 }}>
          <List subheader={<ListSubheader component="div">Содержание</ListSubheader>}>
            {sections.map((s, i) => (
              <ListItemButton key={i} onClick={() => document.getElementById(s.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{s.title || 'Без названия'}</ListItemButton>
            ))}
          </List>
        </Card>

        <Card variant="outlined" sx={{ flex: 1 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              {editing ? (
                <TextField value={title} onChange={(e) => setTitle(e.target.value)} variant="standard" fullWidth />
              ) : (
                <Typography variant="h4" fontWeight={800}>{title}</Typography>
              )}
            </Stack>
            {editing ? (
              <TextField value={subtitle} onChange={(e) => setSubtitle(e.target.value)} variant="standard" fullWidth sx={{ mb: 2 }} />
            ) : (
              <Typography sx={{ opacity: 0.8, mb: 2 }}>{subtitle}</Typography>
            )}
            <Divider sx={{ mb: 2 }} />

            {sections.map((s, i) => (
              <Box key={s.anchor} id={s.anchor} sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  {editing ? (
                    <TextField value={s.title} onChange={(e) => updateSection(i, { title: e.target.value })} variant="standard" fullWidth />
                  ) : (
                    <Typography variant="h6" fontWeight={700}>{s.title || 'Без названия'}</Typography>
                  )}
                  {isAdmin && editing && (
                    <Tooltip title="Удалить блок">
                      <IconButton size="small" onClick={() => removeSection(i)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                </Stack>
                {editing ? (
                  <Stack spacing={1} sx={{ mb: 1 }}>
                    <TextField label="Видео 1 (YouTube или embed)" value={s.embedInput || s.embed || ''} onChange={(e) => updateSection(i, { embedInput: e.target.value, embed: toEmbed(e.target.value) })} fullWidth size="small" />
                    <TextField label="Видео 2 (необязательно)" value={s.embed2Input || s.embed2 || ''} onChange={(e) => updateSection(i, { embed2Input: e.target.value, embed2: toEmbed(e.target.value) })} fullWidth size="small" />
                  </Stack>
                ) : null}
                {s.embed && (
                  <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                    <iframe src={s.embed} title={s.title || `section-${i}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                  </Box>
                )}
                {s.embed2 && (
                  <Box sx={{ position: 'relative', pt: '56.25%', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
                    <iframe src={s.embed2} title={(s.title || `section-${i}`) + '-2'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                  </Box>
                )}
                {editing ? (
                  <TextField multiline minRows={3} placeholder="Текст раздела (поддерживается Markdown)" value={s.text || ''} onChange={(e) => updateSection(i, { text: e.target.value })} fullWidth />
                ) : (
                  <MarkdownRenderer text={s.text || ''} />
                )}
              </Box>
            ))}
            {isAdmin && editing && (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={addSection}>Добавить блок</Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
      {isAdmin && (
        <Tooltip title={editing ? 'Сохранить изменения' : 'Редактировать контент главы'}>
          <Fab color="primary" size="medium" onClick={async () => {
            if (editing) {
              await persistAll();
              setEditing(false);
            } else {
              if (sections.length === 0) addSection();
              setEditing(true);
            }
          }} sx={{ position: 'fixed', bottom: 24, right: 24 }}>
            {editing ? <SaveIcon /> : <EditIcon />}
          </Fab>
        </Tooltip>
      )}
      <Fab size="small" color="default" onClick={() => (window.location.hash = 'roadmap')} sx={{ position: 'fixed', bottom: 24, left: 24 }}>←</Fab>
    </Box>
  );
}

type SectionData = {
  id?: string;
  anchor: string;
  title: string;
  text?: string;
  embed?: string;
  embedInput?: string;
  embed2?: string;
  embed2Input?: string;
};
function MarkdownRenderer({ text }: { text: string }) {
  return (
    <Box sx={{ '& p': { mb: 1.2 }, '& pre': { p: 1, bgcolor: '#0b1220', borderRadius: 1, overflow: 'auto' } }}>
      <ReactMarkdown>{text}</ReactMarkdown>
    </Box>
  );
}

function getChapterData(id: string) {
  const map: Record<string, any> = {
    'ch1': {
      title: 'Глава 1. HTML',
      subtitle: 'Семантика, доступность, основы разметки',
      sections: [
        { anchor: 'intro', title: 'Введение', text: 'Зачем HTML и как мыслить разметкой.' },
        { anchor: 'course1', title: 'Курс: HTML & CSS подробно', embed: 'https://www.youtube.com/embed/dQw4w9WgXcQ', text: 'Полный курс с практикой.' },
        { anchor: 'seo', title: 'SEO и доступность', text: 'Основы SEO, A11y и проверка страниц.' },
        { anchor: 'practice', title: 'Практика', text: 'Сделайте семантическую разметку небольшого лендинга.' },
      ]
    },
    'ch2': { title: 'Глава 2. CSS', subtitle: 'Селекторы, каскад, адаптивность', sections: [{ anchor: 'intro', title: 'Введение', text: 'Обзор CSS и каскада.' }] },
  };
  return map[id] || {
    title: `Глава ${id}`,
    subtitle: 'Материал скоро будет добавлен',
    sections: [{ anchor: 'intro', title: 'Введение', text: 'Эта глава ещё пустая. Добавьте блоки через режим редактирования.' }] as SectionData[]
  };
}


