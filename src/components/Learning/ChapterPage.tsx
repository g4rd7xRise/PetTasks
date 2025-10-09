import { useMemo, useState } from 'react';
import { Box, Stack, Typography, Card, CardContent, Divider, List, ListItemButton, ListSubheader, IconButton, Tooltip, TextField, Button, Fab } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../Auth/userStore';
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
    setSections(list => [...list, { anchor: `sec-${uid}`, title: 'Новый раздел', text: '' }]);
  }

  return (
    <Box sx={{ py: 4 }}>
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
              {isAdmin && (
                <Stack direction="row" spacing={0.5}>
                  {editing ? (
                    <>
                      <Tooltip title="Сохранить">
                        <IconButton size="small" onClick={() => setEditing(false)}><SaveIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Отменить">
                        <IconButton size="small" onClick={() => { setTitle(data.title); setSubtitle(data.subtitle); setEditing(false); }}><CloseIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip title="Редактировать главу">
                      <IconButton size="small" onClick={() => setEditing(true)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                </Stack>
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
          <Fab color="primary" size="medium" onClick={() => setEditing(v => !v)} sx={{ position: 'fixed', bottom: 24, right: 24 }}>
            {editing ? <SaveIcon /> : <EditIcon />}
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
}

type SectionData = { anchor: string; title: string; text?: string; embed?: string; embedInput?: string };
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


