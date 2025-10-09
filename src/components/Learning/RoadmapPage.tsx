import { useEffect, useMemo, useState } from 'react';
import { Box, Stack, Typography, Card, CardContent, Accordion, AccordionSummary, AccordionDetails, Chip, Button, Tooltip, Fab, TextField, IconButton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownToolbar from '../UI/MarkdownToolbar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../Auth/userStore';
import { api } from '../UI/api';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function RoadmapPage() {
  const [expanded, setExpanded] = useState<string | false>('intro');
  const { user } = useAuth();
  const isAdmin = !!user && (user as any).role === 'admin';
  const [chapters, setChapters] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingChildTitle, setEditingChildTitle] = useState<string>('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<'section' | 'chapter' | null>(null);

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
    setChapters(list => [...list, { id, title: 'Новая глава', badge: 'Глава', body: <Placeholder /> }]);
    setExpanded(id);
    startEdit(id, 'Новая глава');
  }

  async function reloadChapters() {
    try {
      const rows = await api<any[]>('/api/learning/chapters');
      if (Array.isArray(rows)) {
        // Deduplicate by slug defensively (in case UI accidentally causes double writes)
        const bySlug = new Map<string, any>();
        for (const r of rows) bySlug.set(r.slug, r);
        const unique = Array.from(bySlug.values());
        setChapters(unique.map(r => ({ id: r.slug, dbId: r.id, title: r.title, badge: r.badge, parentSlug: (r as any).parent_slug || null, introText: (r as any).intro_text || '', order: (r as any).order_num ?? 0, body: <Placeholder /> })));
      } else {
        setChapters([]);
      }
    } catch {}
  }

  // Load chapters from API only (source of truth)
  useEffect(() => { reloadChapters(); }, []);

  async function saveChapterToApi(id: string) {
    const ch = chapters.find(c => c.id === id);
    if (!ch) return;
    setBusy(true);
    try {
      await api('/api/admin/learning/chapters', { method: 'POST', body: { id: (ch as any).dbId, slug: ch.id, title: editingTitle || ch.title, badge: ch.badge || 'Глава', parentSlug: (ch as any).parentSlug || null, introText: (ch as any).introText || '', order: 0 } });
      await reloadChapters();
    } finally { setBusy(false); }
  }
  async function deleteChapterFromApi(id: string) {
    await api(`/api/admin/learning/chapters/${id}`, { method: 'DELETE' });
  }

  async function persistOrder(list: any[]) {
    // Persist order for a homogeneous list (all sections or all chapters under same parent)
    setBusy(true);
    try {
      for (let idx = 0; idx < list.length; idx++) {
        const it = list[idx];
        await api('/api/admin/learning/chapters', { method: 'POST', body: { id: (it as any).dbId, slug: it.id, title: it.title, badge: it.badge, parentSlug: (it as any).parentSlug || null, introText: (it as any).introText || '', order: idx } });
      }
      await reloadChapters();
    } finally { setBusy(false); }
  }

  function optimisticReorderSections(newSectionIds: string[]) {
    const sectionById: Record<string, any> = {};
    const childrenByParent: Record<string, any[]> = {};
    for (const ch of chapters) {
      const parent = (ch as any).parentSlug || null;
      if (parent == null && (ch as any).badge === 'Раздел') sectionById[ch.id] = ch;
      else if (parent) {
        if (!childrenByParent[parent]) childrenByParent[parent] = [];
        childrenByParent[parent].push(ch);
      }
    }
    const ordered: any[] = [];
    for (const sid of newSectionIds) {
      const sec = sectionById[sid];
      if (!sec) continue;
      ordered.push(sec);
      const kids = childrenByParent[sid] || [];
      for (const k of kids) ordered.push(k);
    }
    // Include any other items (orphans) at the end
    const inOrdered = new Set(ordered.map(x => x.id));
    for (const ch of chapters) if (!inOrdered.has(ch.id)) ordered.push(ch);
    setChapters(ordered);
  }

  return (
    <Box sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>RoadMap обучения</Typography>
        <Typography sx={{ opacity: 0.8 }}>Материал структурирован по разделам и главам. Раздел содержит краткое описание, затем идут главы.</Typography>
      </Stack>

      {isAdmin && (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Button size="small" color="warning" onClick={async ()=>{ setBusy(true); try { await api('/api/admin/learning/cleanup-orphans', { method: 'POST' }); const rows = await api<any[]>('/api/learning/chapters'); setChapters(rows.map(r => ({ id: r.slug, dbId: r.id, title: r.title, badge: r.badge, parentSlug: (r as any).parent_slug || null, introText: (r as any).intro_text || '', body: <Placeholder /> }))); } finally { setBusy(false); } }}>Очистить одиночные главы</Button>
        </Stack>
      )}

      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent>
          <Stack spacing={1.5}>
            {chapters.length === 0 && (
              <Typography sx={{ opacity: 0.8 }}>Нет данных. Добавьте раздел с помощью кнопки ниже.</Typography>
            )}
            {(() => {
              // group by parentSlug: null (or absence) means top-level Section
              const groups: Record<string, any[]> = {};
              for (const ch of chapters) {
                const parentSlug = (ch as any).parentSlug || null;
                const key = parentSlug || ch.id;
                if (!groups[key]) groups[key] = [];
                groups[key].push(ch);
              }
              const sectionIdsSorted = chapters
                .filter(c => (c as any).parentSlug == null && (c as any).badge === 'Раздел')
                .sort((a:any,b:any)=> (a.order ?? 0) - (b.order ?? 0))
                .map(c => c.id);
              const allKeys = Object.keys(groups);
              const otherKeys = allKeys.filter(k => !sectionIdsSorted.includes(k));
              const orderedGroupKeys = [...sectionIdsSorted, ...otherKeys];
              return orderedGroupKeys.map(groupKey => {
                const items = groups[groupKey];
                const parent = items.find(i => (i as any).parentSlug == null && i.id === groupKey);
                const isSection = !!parent && ((parent as any).badge === 'Раздел');
                const title = isSection ? parent.title : (items[0]?.title || groupKey);
                return (
                  <Accordion key={groupKey} expanded={expanded === groupKey} onChange={(_, is) => setExpanded(is ? groupKey : false)} disableGutters sx={{ bgcolor: 'transparent' }}
                    draggable={isAdmin}
                    onDragStart={() => { if (isAdmin) { setDragId(groupKey); setDragType('section'); } }}
                    onDragOver={(e) => { if (isAdmin) e.preventDefault(); }}
                    onDrop={() => {
                      if (!isAdmin || dragType !== 'section' || !dragId || dragId === groupKey) return;
                      // reorder top-level sections (groups keys where item is section)
                      const order = Object.keys(groups);
                      const srcIdx = order.indexOf(dragId);
                      const dstIdx = order.indexOf(groupKey);
                      if (srcIdx < 0 || dstIdx < 0) return;
                      const newOrder = [...order];
                      const [moved] = newOrder.splice(srcIdx, 1);
                      newOrder.splice(dstIdx, 0, moved);
                      // rebuild chapters state accordingly
                      const sectionIds = newOrder.filter(k => !!groups[k].find(i => (i as any).parentSlug == null && i.id === k));
                      const newCh = [...chapters].sort((a,b)=>{
                        const ia = sectionIds.indexOf((a as any).parentSlug ? (a as any).parentSlug : a.id);
                        const ib = sectionIds.indexOf((b as any).parentSlug ? (b as any).parentSlug : b.id);
                        return ia - ib;
                      });
                      setChapters(newCh);
                      // persist only sections order
                      const topSections = sectionIds.map(id => chapters.find(c => c.id === id)).filter(Boolean) as any[];
                      persistOrder(topSections);
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                          {isSection && editingId === parent?.id ? (
                            <TextField
                              value={editingTitle}
                              onClick={(e)=>e.stopPropagation()}
                              onChange={(e)=>setEditingTitle(e.target.value)}
                              onBlur={async ()=>{ await saveChapterToApi(parent!.id); }}
                              onKeyDown={async (e)=>{ if (e.key==='Enter') { e.preventDefault(); await saveChapterToApi(parent!.id); } }}
                              size="small" variant="standard" fullWidth />
                          ) : (
                            <Typography fontWeight={800} noWrap>{title}</Typography>
                          )}
                          <Chip size="small" label={isSection ? 'Раздел' : 'Глава'} />
                        </Stack>
                        {isAdmin && isSection && (
                          <Stack direction="row" spacing={1}>
                            {/* Reorder section arrows */}
                            <IconButton size="small" onClick={(e)=>{
                              e.stopPropagation();
                              const sectionIds = chapters
                                .filter(c => (c as any).parentSlug == null && (c as any).badge === 'Раздел')
                                .map(c => c.id);
                              const idx = sectionIds.indexOf(groupKey);
                              if (idx <= 0) return;
                              const newOrderIds = [...sectionIds];
                              [newOrderIds[idx-1], newOrderIds[idx]] = [newOrderIds[idx], newOrderIds[idx-1]];
                              optimisticReorderSections(newOrderIds);
                              const topSections = newOrderIds.map(id => chapters.find(c => c.id === id)).filter(Boolean) as any[];
                              // persist with explicit order matching newOrderIds
                              setBusy(true);
                              (async ()=>{ try { await persistOrder(topSections); } finally { setBusy(false); } })();
                            }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={(e)=>{
                              e.stopPropagation();
                              const sectionIds = chapters
                                .filter(c => (c as any).parentSlug == null && (c as any).badge === 'Раздел')
                                .map(c => c.id);
                              const idx = sectionIds.indexOf(groupKey);
                              if (idx < 0 || idx >= sectionIds.length - 1) return;
                              const newOrderIds = [...sectionIds];
                              [newOrderIds[idx+1], newOrderIds[idx]] = [newOrderIds[idx], newOrderIds[idx+1]];
                              optimisticReorderSections(newOrderIds);
                              const topSections = newOrderIds.map(id => chapters.find(c => c.id === id)).filter(Boolean) as any[];
                              setBusy(true);
                              (async ()=>{ try { await persistOrder(topSections); } finally { setBusy(false); } })();
                            }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                            {editingId === parent.id ? (
                              <></>
                            ) : (
                              <>
                                <Button size="small" onClick={(e) => { e.stopPropagation(); startEdit(parent.id, title); }}>Переименовать</Button>
                                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={async (e) => { e.stopPropagation(); try { await deleteChapterFromApi(groupKey); } catch {} setChapters(list => list.filter(c => c.id !== groupKey && (c as any).parentSlug !== groupKey)); }}>Удалить</Button>
                              </>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={1.2}>
                        {isSection ? (
                          <>
                            {/* Описание раздела */}
                            {editingId === parent?.id ? (
                              <>
                                <MarkdownToolbar get={() => (parent as any).introText || ''} set={(next) => setChapters(list => list.map(c => (c.id === parent!.id ? { ...c, introText: next } : c)))} />
                                <TextField placeholder="Краткое описание раздела (Markdown)" value={(parent as any).introText || ''} onChange={(e) => setChapters(list => list.map(c => (c.id === parent!.id ? { ...c, introText: e.target.value } : c)))} fullWidth multiline minRows={3} />
                              </>
                            ) : (
                              !!(parent as any).introText && (
                                <Box sx={{
                                  '& h1, & h2, & h3': { mt: 1.2, mb: 0.6, fontWeight: 800 },
                                  '& p': { mb: 1.0, opacity: 0.9 },
                                  '& blockquote': { m: 0, mb: 1, px: 1.5, py: 1, borderLeft: '3px solid', borderColor: 'primary.main', bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1 },
                                  '& a': { color: 'primary.light', textDecoration: 'underline' },
                                  '& ul, & ol': { pl: 3, mb: 1 }
                                }}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{(parent as any).introText}</ReactMarkdown>
                                </Box>
                              )
                            )}
                          {items.filter(i => (i as any).parentSlug != null).map((child, childIndex, allChildren) => (
                            <Stack key={child.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between"
                                  draggable={isAdmin}
                                  onDragStart={() => { if (isAdmin) { setDragId(child.id); setDragType('chapter'); } }}
                                  onDragOver={(e) => { if (isAdmin) e.preventDefault(); }}
                                  onDrop={() => {
                                    if (!isAdmin || dragType !== 'chapter' || !dragId || dragId === child.id) return;
                                    const children = items.filter(i => (i as any).parentSlug != null);
                                    const srcIdx = children.findIndex(c => c.id === dragId);
                                    const dstIdx = children.findIndex(c => c.id === child.id);
                                    if (srcIdx < 0 || dstIdx < 0) return;
                                    const newChildren = [...children];
                                    const [moved] = newChildren.splice(srcIdx, 1);
                                    newChildren.splice(dstIdx, 0, moved);
                                    // apply back to chapters state
                                    const others = chapters.filter(c => (c as any).parentSlug !== groupKey);
                                    setChapters([...others, ...newChildren, parent!]);
                                    persistOrder(newChildren);
                                  }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                {isAdmin && editingChildId === child.id ? (
                                  <TextField
                                    value={editingChildTitle}
                                    size="small" variant="standard" fullWidth
                                    onChange={(e)=>setEditingChildTitle(e.target.value)}
                                    onBlur={async ()=>{
                                      setChapters(list => list.map(c => (c.id === child.id ? { ...c, title: editingChildTitle } : c)));
                                      setBusy(true);
                                      try { await api('/api/admin/learning/chapters', { method: 'POST', body: { id: (child as any).dbId, slug: child.id, title: editingChildTitle, badge: child.badge || 'Глава', parentSlug: (child as any).parentSlug, order: 0 } }); }
                                      finally { setBusy(false); setEditingChildId(null); }
                                    }}
                                    onKeyDown={async (e)=>{ if (e.key==='Enter') { e.preventDefault(); (e.currentTarget as any).blur(); } }}
                                  />
                                ) : (
                                  <Typography noWrap>{child.title}</Typography>
                                )}
                                <Chip size="small" label={child.badge || 'Глава'} />
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {isAdmin ? (
                                  editingChildId === child.id ? (
                                    <></>
                                  ) : (
                                    <>
                                      {/* Reorder child arrows */}
                                      <IconButton size="small" onClick={() => {
                                        const siblings = items.filter(i => (i as any).parentSlug != null);
                                        const idx = siblings.findIndex(s => s.id === child.id);
                                        if (idx <= 0) return;
                                        const newSiblings = [...siblings];
                                        [newSiblings[idx-1], newSiblings[idx]] = [newSiblings[idx], newSiblings[idx-1]];
                                        setChapters(list => {
                                          // optimistic within this section only
                                          const others = list.filter(c => (c as any).parentSlug !== groupKey);
                                          return [...others, parent!, ...newSiblings];
                                        });
                                        setBusy(true);
                                        (async ()=>{ try { await persistOrder(newSiblings); } finally { setBusy(false); } })();
                                      }}><ArrowUpwardIcon fontSize="small" /></IconButton>
                                      <IconButton size="small" onClick={() => {
                                        const siblings = items.filter(i => (i as any).parentSlug != null);
                                        const idx = siblings.findIndex(s => s.id === child.id);
                                        if (idx < 0 || idx >= siblings.length - 1) return;
                                        const newSiblings = [...siblings];
                                        [newSiblings[idx+1], newSiblings[idx]] = [newSiblings[idx], newSiblings[idx+1]];
                                        setChapters(list => {
                                          const others = list.filter(c => (c as any).parentSlug !== groupKey);
                                          return [...others, parent!, ...newSiblings];
                                        });
                                        setBusy(true);
                                        (async ()=>{ try { await persistOrder(newSiblings); } finally { setBusy(false); } })();
                                      }}><ArrowDownwardIcon fontSize="small" /></IconButton>
                                      <Button size="small" onClick={() => { setEditingChildId(child.id); setEditingChildTitle(child.title); }}>Переименовать</Button>
                                      <Button size="small" color="error" onClick={async () => { try { await deleteChapterFromApi(child.id); } catch {} setChapters(list => list.filter(c => c.id !== child.id)); }}>Удалить</Button>
                                      <Button size="small" variant="text" color="primary"
                                              onClick={() => { window.location.hash = `learn-${child.id}?parent=${encodeURIComponent(String(groupKey))}`; }}
                                              endIcon={<ArrowForwardIosIcon sx={{ fontSize: 14 }} />}
                                              sx={{ px: 1, minWidth: 0, textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'primary.main', '&:hover': { textDecoration: 'underline', background: 'transparent' } }}>
                                        Открыть
                                      </Button>
                                    </>
                                  )
                                ) : (
                                  <Button size="small" variant="text" color="primary"
                                          onClick={() => { window.location.hash = `learn-${child.id}?parent=${encodeURIComponent(String(groupKey))}`; }}
                                          endIcon={<ArrowForwardIosIcon sx={{ fontSize: 14 }} />}
                                          sx={{ px: 1, minWidth: 0, textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'primary.main', '&:hover': { textDecoration: 'underline', background: 'transparent' } }}>
                                    Открыть
                                  </Button>
                                )}
                              </Stack>
                            </Stack>
                          ))}
                          </>
                        ) : (
                          items.map(single => (
                            <Stack key={single.id} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                {editingChildId === single.id ? (
                                  <TextField
                                    value={editingChildTitle}
                                    size="small" variant="standard" fullWidth
                                    onChange={(e)=>setEditingChildTitle(e.target.value)}
                                    onBlur={async ()=>{
                                      setChapters(list => list.map(c => (c.id === single.id ? { ...c, title: editingChildTitle } : c)));
                                      setBusy(true);
                                      try {
                                        await api('/api/admin/learning/chapters', { method: 'POST', body: { id: (single as any).dbId, slug: single.id, title: editingChildTitle, badge: single.badge || 'Глава', parentSlug: (single as any).parentSlug || null, order: 0 } });
                                        const rows = await api<any[]>('/api/learning/chapters');
                                        const bySlug = new Map<string, any>();
                                        for (const r of rows) bySlug.set(r.slug, r);
                                        const unique = Array.from(bySlug.values());
                                        setChapters(unique.map(r => ({ id: r.slug, dbId: r.id, title: r.title, badge: r.badge, parentSlug: (r as any).parent_slug || null, introText: (r as any).intro_text || '', body: <Placeholder /> })));
                                      } finally { setBusy(false); setEditingChildId(null); }
                                    }}
                                    onKeyDown={(e)=>{ if (e.key==='Enter') { e.preventDefault(); (e.currentTarget as any).blur(); } }}
                                  />
                                ) : (
                                  <Typography noWrap>{single.title}</Typography>
                                )}
                                <Chip size="small" label={single.badge || 'Глава'} />
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {isAdmin && (
                                  editingChildId === single.id ? (
                                    <></>
                                  ) : (
                                    <>
                                      <Button size="small" onClick={() => { setEditingChildId(single.id); setEditingChildTitle(single.title); }}>Переименовать</Button>
                                      <Button size="small" color="error" onClick={async () => { try { await deleteChapterFromApi(single.id); } catch {} setChapters(list => list.filter(c => c.id !== single.id)); }}>Удалить</Button>
                                      <Button size="small" onClick={async () => {
                                        const parentSlug = prompt('Введите slug раздела (например, ch0-intro-section):');
                                        if (!parentSlug) return;
                                        setBusy(true);
                                        try {
                                          await api('/api/admin/learning/assign-parent', { method: 'POST', body: { slug: single.id, parentSlug } });
                                          const rows = await api<any[]>('/api/learning/chapters');
                                          setChapters(rows.map(r => ({ id: r.slug, dbId: r.id, title: r.title, badge: r.badge, parentSlug: (r as any).parent_slug || null, introText: (r as any).intro_text || '', body: <Placeholder /> })));
                                        } finally { setBusy(false); }
                                      }}>Включить в раздел</Button>
                                    </>
                                  )
                                )}
                                <Button size="small" variant="text" color="primary"
                                        onClick={() => { window.location.hash = `learn-${single.id}`; }}
                                        endIcon={<ArrowForwardIosIcon sx={{ fontSize: 14 }} />}
                                        sx={{ px: 1, minWidth: 0, textTransform: 'none', fontWeight: 700, fontSize: 12, color: 'primary.main', '&:hover': { textDecoration: 'underline', background: 'transparent' } }}>
                                  Открыть
                                </Button>
                              </Stack>
                            </Stack>
                          ))
                        )}
                        {isAdmin && isSection && (
                          <Stack direction="row" spacing={1}>
                            <Button size="small" startIcon={<AddIcon />} onClick={async () => {
                              setBusy(true);
                              try {
                                const uid = Math.random().toString(36).slice(2,6);
                                const childId = `ch${uid}`;
                                // persist first to ensure parent_slug saved in DB
                                await api('/api/admin/learning/chapters', { method: 'POST', body: { id: `lc_${Date.now()}`, slug: childId, title: 'Новая глава', badge: 'Глава', parentSlug: groupKey, order: 0 } });
                                const rows = await api<any[]>('/api/learning/chapters');
                                setChapters(rows.map(r => ({ id: r.slug, dbId: r.id, title: r.title, badge: r.badge, parentSlug: (r as any).parent_slug || null, introText: (r as any).intro_text || '', order: (r as any).order_num ?? 0, body: <Placeholder /> })));
                              } finally { setBusy(false); }
                            }}>Добавить главу</Button>
                            <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={async () => {
                              // delete section and its children
                              try {
                                await deleteChapterFromApi(groupKey);
                              } catch {}
                              setChapters(list => list.filter(c => c.id !== groupKey && (c as any).parentSlug !== groupKey));
                            }}>Удалить раздел</Button>
                          </Stack>
                        )}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              });
            })()}
          </Stack>
        </CardContent>
      </Card>
      {isAdmin && (
        <Tooltip title={busy ? 'Сохранение…' : 'Добавить раздел'}>
          <Fab color="primary" size="medium" disabled={busy} onClick={async () => {
            const uid = Math.random().toString(36).slice(2,6);
            const id = `sec_${uid}`;
            const newSec: any = { id, title: 'Новый раздел', badge: 'Раздел', parentSlug: null, introText: '', body: <Placeholder /> };
            setChapters(list => [...list, newSec]);
            setExpanded(id);
            setBusy(true);
            try {
              await api('/api/admin/learning/chapters', { method: 'POST', body: { id: `lc_${Date.now()}`, slug: id, title: newSec.title, badge: 'Раздел', parentSlug: null, introText: '', order: 0 } });
              const rows = await api<any[]>('/api/learning/chapters');
              setChapters(rows.map(r => ({ id: r.slug, dbId: r.id, title: r.title, badge: r.badge, parentSlug: (r as any).parent_slug || null, introText: (r as any).intro_text || '', order: (r as any).order_num ?? 0, body: <Placeholder /> })));
            } finally { setBusy(false); }
          }} sx={{ position: 'fixed', bottom: 24, right: 24 }}>
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


