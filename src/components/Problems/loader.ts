import type { ProblemsDataSourceConfig, Problem } from "./types";
import { localProblems } from "./localSample";

async function fetchFromGithubRaw(url: string): Promise<Problem[] | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Problem[];
    if (!Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function loadProblems(config?: ProblemsDataSourceConfig): Promise<Problem[]> {
  try {
    const res = await fetch('/api/problems', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json() as Problem[];
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {}
  if (config?.githubRawUrl) {
    const remote = await fetchFromGithubRaw(config.githubRawUrl);
    if (remote && remote.length > 0) return remote;
  }
  return localProblems;
}



