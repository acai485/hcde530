import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { PrepForm } from "@/components/PrepForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportBriefToPdf } from "@/lib/export-pdf";
import { generatePrep, type PrepInputT, type PrepResult } from "@/lib/prep.functions";
import { deleteSession, loadSessions, saveSession, type SavedSession } from "@/lib/sessions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UX Interview Prep Tool" },
      {
        name: "description",
        content:
          "Tailored interview prep for UX researchers and designers. Paste a role, get role- and company-specific questions, talking points, and project mapping.",
      },
      { property: "og:title", content: "UX Interview Prep Tool" },
      {
        property: "og:description",
        content: "Role- and company-tailored interview prep for UX researchers and designers.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const generate = useServerFn(generatePrep);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrepResult | null>(null);
  const [lastInput, setLastInput] = useState<PrepInputT | null>(null);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const active = useMemo(() => sessions.find((s) => s.id === activeId) ?? null, [sessions, activeId]);
  const displayed = active ? active.result : result;
  const displayedInput = active ? active.input : lastInput;

  async function handleSubmit(input: PrepInputT) {
    setLoading(true);
    setError(null);
    setActiveId(null);
    setResult(null);
    setLastInput(input);
    try {
      const r = (await generate({ data: input })) as PrepResult;
      setResult(r);
      const session: SavedSession = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        input,
        result: r,
      };
      saveSession(session);
      setSessions(loadSessions());
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setSessions(loadSessions());
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-serif text-lg font-semibold shadow-sm">U</div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">UX Interview Prep Tool</h1>
              <p className="text-xs text-muted-foreground">Researcher & designer tracks</p>
            </div>
          </div>
          <a
            href="https://docs.lovable.dev"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            built with Lovable
          </a>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT — inputs */}
        <div className="space-y-4 lg:sticky lg:top-24 min-w-0">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl tracking-tight leading-tight">
                Your inputs
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Edit anything and regenerate to refresh the brief on the right.
              </p>
            </div>
            {(activeId || result) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setActiveId(null);
                  setResult(null);
                  setLastInput(null);
                }}
              >
                + New
              </Button>
            )}
          </div>

          <section className="rounded-2xl border border-border/70 bg-card p-5 md:p-6 shadow-sm max-h-[calc(100vh-10rem)] overflow-y-auto">
            <PrepForm
              key={activeId ?? "new"}
              initial={displayedInput ?? undefined}
              loading={loading}
              onSubmit={handleSubmit}
            />
          </section>

          {sessions.length > 0 && (
            <section className="rounded-2xl border border-border/70 bg-card/50 p-4">
              <h3 className="text-[11px] uppercase tracking-[0.14em] font-medium text-muted-foreground mb-2">
                Saved sessions
              </h3>
              <ul className="space-y-1">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <div
                      className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors ${
                        activeId === s.id
                          ? "bg-secondary"
                          : "hover:bg-secondary/60"
                      }`}
                      onClick={() => {
                        setActiveId(s.id);
                        setResult(null);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate leading-tight">
                          {s.input.company}
                          <span className="text-muted-foreground font-normal"> · {s.input.roleTitle}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px] opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(s.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* RIGHT — results */}
        <div className="space-y-4 min-w-0">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl tracking-tight leading-tight">
              Prep brief
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Tailored questions, project mapping, and sourced signal.
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Generating your prep brief…</p>
                <span className="text-xs text-muted-foreground">This usually takes 20–60s</span>
              </div>
              <div className="indeterminate-bar h-1.5" role="progressbar" aria-busy="true" aria-label="Generating prep brief" />
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>· Reading the job posting</li>
                <li>· Scraping company signal</li>
                <li>· Searching interview reports</li>
                <li>· Drafting tailored questions & project mapping</li>
              </ul>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && !displayed && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="font-serif italic text-lg text-muted-foreground">
                Your tailored brief will appear here.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Fill in the form on the left and hit "Generate prep brief."
              </p>
            </div>
          )}

          {displayed && (
            <section className="rounded-2xl border border-border/70 bg-card p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="secondary" className="capitalize">
                  Track: {displayed.trackDetected}
                </Badge>
                {displayed.scrapedTitle && (
                  <Badge variant="outline">Scraped: {displayed.scrapedTitle}</Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(displayed.generatedAt).toLocaleString()}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => exportBriefToPdf(displayed, displayedInput)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </Button>
              </div>

              {displayed.warnings.length > 0 && (
                <ul className="text-xs text-muted-foreground italic mb-4 space-y-0.5">
                  {displayed.warnings.map((w, i) => (
                    <li key={i}>· {w}</li>
                  ))}
                </ul>
              )}

              <article className="prose-paper max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayed.brief}</ReactMarkdown>
              </article>

              {displayed.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="font-serif text-base font-semibold mb-3">Sources</h3>
                  <ol className="space-y-2 text-sm">
                    {displayed.sources.map((s, i) => (
                      <li key={s.url} className="leading-snug">
                        <span className="text-muted-foreground mr-2">[{i + 1}]</span>
                        <a href={s.url} target="_blank" rel="noreferrer"
                          className="text-primary underline underline-offset-4">
                          {s.title}
                        </a>
                        {s.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-7">{s.description}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          )}
        </div>
      </main>


      <footer className="border-t border-border/60 mt-20 py-8 text-center text-xs text-muted-foreground">
        Sessions are stored in your browser only. Clear them anytime.
      </footer>
    </div>
  );
}
