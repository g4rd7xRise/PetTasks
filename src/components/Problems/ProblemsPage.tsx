import { useEffect, useMemo, useState } from "react";
import ProblemList from "./ProblemList";
import ProblemDetail from "./ProblemDetail";

interface Props {
  githubRawUrl?: string;
}

function getHashPath(): string {
  return window.location.hash.replace(/^#/, "");
}

function setHashPath(path: string) {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

export default function ProblemsPage({ githubRawUrl }: Props) {
  const [hash, setHash] = useState<string>(() => getHashPath());

  useEffect(() => {
    const handler = () => setHash(getHashPath());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const { slug } = useMemo(() => {
    // routes: "problems" | "problems/<slug>"
    const path = hash || "problems";
    const parts = path.split("/").filter(Boolean);
    if (parts[0] !== "problems") return { slug: null } as { slug: string | null };
    return { slug: parts[1] ?? null } as { slug: string | null };
  }, [hash]);

  function openProblem(nextSlug: string) {
    setHashPath(`problems/${nextSlug}`);
  }

  function goBack() {
    setHashPath("problems");
  }

  if (slug) {
    return (
      <ProblemDetail slug={slug} githubRawUrl={githubRawUrl} onBack={goBack} />
    );
  }

  return (
    <ProblemList githubRawUrl={githubRawUrl} onOpenProblem={openProblem} />
  );
}



