export type ProblemDifficulty = "easy" | "medium" | "hard";

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  statement: string; // markdown allowed
  starterCode?: string;
  frequency?: 'часто' | 'умеренно' | 'редко';
  videoUrl?: string;
  videoEmbedId?: string;
  solutionMd?: string;
}

export interface ProblemProgress {
  solved: boolean;
  attempts: number;
  lastCode?: string;
  lastUpdatedAt: number;
}

export interface ProblemsDataSourceConfig {
  githubRawUrl?: string; // e.g. https://raw.githubusercontent.com/<org>/<repo>/<branch>/problems.json
}



