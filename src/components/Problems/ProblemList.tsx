import { useEffect, useMemo, useState } from "react";
import { loadProblems } from "./loader";
import type { Problem } from "./types";
import { Chip, Stack, Select, MenuItem, InputBase, Tooltip } from '@mui/material';

interface Props {
  githubRawUrl?: string;
  onOpenProblem: (slug: string) => void;
}

export default function ProblemList({ githubRawUrl, onOpenProblem }: Props) {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [frequency, setFrequency] = useState<string>('all');
  const [sort, setSort] = useState<string>('relevance');

  useEffect(() => {
    loadProblems({ githubRawUrl }).then(setProblems);
  }, [githubRawUrl]);

  const filtered = useMemo(() => {
    if (!problems) return [] as Problem[];
    const q = query.trim().toLowerCase();
    const freqRank: Record<string, number> = { 'редко': 1, 'умеренно': 2, 'часто': 3 };
    const diffRank: Record<string, number> = { 'easy': 1, 'medium': 2, 'hard': 3 } as any;
    const list = problems.filter((p) => {
      const matchesQuery =
        q.length === 0 ||
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesDiff = difficulty === "all" || p.difficulty === difficulty;
      const matchesFreq = frequency === 'all' || (p.frequency || 'умеренно') === frequency;
      return matchesQuery && matchesDiff && matchesFreq;
    });
    if (sort === 'frequency') {
      return list.sort((a, b) => (freqRank[(b.frequency || 'умеренно')] - freqRank[(a.frequency || 'умеренно')]));
    } else if (sort === 'difficulty-asc') {
      return list.sort((a, b) => (diffRank[a.difficulty] - diffRank[b.difficulty]));
    } else if (sort === 'difficulty-desc') {
      return list.sort((a, b) => (diffRank[b.difficulty] - diffRank[a.difficulty]));
    }
    return list;
  }, [problems, query, difficulty, frequency, sort]);

  if (!problems) return <p>Загрузка задач...</p>;

  return (
    <section>
      <h3>Задачи</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: 'center', flexWrap: 'wrap' }}>
        <InputBase placeholder="Поиск по названию/тегу" value={query} onChange={(e) => setQuery(e.target.value)}
                   sx={{ border: '1px solid var(--control-border)', borderRadius: 1, px: 1.5, py: .5, minWidth: 260 }} />
        <Select size="small" value={difficulty} onChange={(e) => setDifficulty(String(e.target.value))}
                sx={{ minWidth: 160 }}>
          <MenuItem value="all">Все сложности</MenuItem>
          <MenuItem value="easy">Лёгкая</MenuItem>
          <MenuItem value="medium">Средняя</MenuItem>
          <MenuItem value="hard">Сложная</MenuItem>
        </Select>
        <Select size="small" value={frequency} onChange={(e) => setFrequency(String(e.target.value))}
                sx={{ minWidth: 160 }}>
          <MenuItem value="all">Все частоты</MenuItem>
          <MenuItem value="часто">Часто</MenuItem>
          <MenuItem value="умеренно">Умеренно</MenuItem>
          <MenuItem value="редко">Редко</MenuItem>
        </Select>
        <Select size="small" value={sort} onChange={(e) => setSort(String(e.target.value))}
                sx={{ minWidth: 180 }}>
          <MenuItem value="relevance">Без сортировки</MenuItem>
          <MenuItem value="frequency">Сначала часто спрашиваемые</MenuItem>
          <MenuItem value="difficulty-asc">Сложность: от лёгких</MenuItem>
          <MenuItem value="difficulty-desc">Сложность: от сложных</MenuItem>
        </Select>
      </div>
      <ul>
        {filtered.map((p) => (
          <li key={p.id} style={{ padding: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{p.title}</strong>
                  <span style={{ fontSize: 12, padding: "2px 6px", borderRadius: 6, background: p.difficulty === 'easy' ? '#e6ffed' : p.difficulty === 'medium' ? '#fff7e6' : '#ffe6e6', color: '#333' }}>{p.difficulty}</span>
                  <Tooltip title="Частота упоминаний на собеседованиях">
                    <span style={{ fontSize: 12, padding: "2px 6px", borderRadius: 6, background: '#e6ecff', color: '#333' }}>{p.frequency || 'умеренно'}</span>
                  </Tooltip>
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                  {p.tags.join(", ")}
                </div>
              </div>
              <button className="control" onClick={() => onOpenProblem(p.slug)} style={{ width: 140 }}>
                Открыть
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}



