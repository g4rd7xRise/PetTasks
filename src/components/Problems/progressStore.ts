import type { ProblemProgress } from "./types";
import { api } from "../UI/api";

const STATS_KEY = "problems-stats:index";

function progressKey(slug: string) {
  return `problem-progress:${slug}`;
}

export async function readProgress(slug: string): Promise<ProblemProgress | null> {
  try {
    const server = await api<ProblemProgress | null>(`/api/progress/${slug}`);
    if (server) {
      // keep local cache for offline
      try { localStorage.setItem(progressKey(slug), JSON.stringify(server)); } catch {}
      return server;
    }
  } catch {
    // fall back to local
  }
  try {
    const raw = localStorage.getItem(progressKey(slug));
    return raw ? (JSON.parse(raw) as ProblemProgress) : null;
  } catch {
    return null;
  }
}

export async function writeProgress(slug: string, progress: ProblemProgress) {
  // optimistic local update
  try { localStorage.setItem(progressKey(slug), JSON.stringify(progress)); } catch {}
  try {
    const stats = readStatsIndex();
    stats[slug] = progress.solved ? "solved" : "attempted";
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
  // sync to server (ignore errors to preserve UX)
  try {
    await api(`/api/progress/${slug}`, { method: 'POST', body: { solved: progress.solved, lastCode: progress.lastCode || '' } });
  } catch {}
}

export function readStatsIndex(): Record<string, "solved" | "attempted"> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, "solved" | "attempted">) : {};
  } catch {
    return {};
  }
}

export function aggregateStats(allSlugs: string[]) {
  const idx = readStatsIndex();
  let solved = 0;
  let attempted = 0;
  for (const s of allSlugs) {
    const state = idx[s];
    if (state === "solved") solved++;
    else if (state === "attempted") attempted++;
  }
  return { total: allSlugs.length, solved, attempted };
}


