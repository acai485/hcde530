import type { PrepInputT, PrepResult } from "@/lib/prep.functions";

// Minimal markdown-to-HTML for export (covers what our briefs use: headings,
// bold/italic, lists, links, code). Keeps us dependency-free.
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mdToHtml(md: string) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  const inline = (s: string) =>
    escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[(.+?)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
      continue;
    }
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ol) {
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    if (ul) {
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join("\n");
}

export function exportBriefToPdf(result: PrepResult, input?: PrepInputT | null) {
  const title = input ? `${input.company} — ${input.roleTitle}` : "UX Interview Prep";
  const generated = new Date(result.generatedAt).toLocaleString();

  const sourcesHtml = result.sources.length
    ? `<h2>Sources</h2><ol class="sources">${result.sources
        .map(
          (s, i) =>
            `<li><a href="${escapeHtml(s.url)}">${escapeHtml(s.title)}</a>${
              s.description ? `<div class="src-desc">${escapeHtml(s.description)}</div>` : ""
            }</li>`,
        )
        .join("")}</ol>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)} — Prep Brief</title>
<style>
  @page { size: Letter; margin: 0.75in; }
  body {
    font-family: "Inter", -apple-system, system-ui, sans-serif;
    color: #1a1a1a; line-height: 1.55; font-size: 11pt;
  }
  header { border-bottom: 1px solid #ddd; padding-bottom: 14pt; margin-bottom: 18pt; }
  header h1 {
    font-family: "Instrument Serif", Georgia, serif;
    font-weight: 400; font-size: 28pt; margin: 0 0 6pt;
    letter-spacing: -0.01em;
  }
  header .meta { font-size: 9pt; color: #666; }
  h1, h2, h3 { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
  h2 { font-size: 18pt; margin: 22pt 0 8pt; color: #111; }
  h3 {
    font-family: "Inter", sans-serif; font-size: 9.5pt; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em; color: #666;
    margin: 16pt 0 4pt;
  }
  p { margin: 6pt 0; }
  ul, ol { margin: 6pt 0 8pt 22pt; }
  li { margin: 3pt 0; }
  strong { color: #111; }
  a { color: #1f3a8a; text-decoration: underline; }
  code {
    font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 9.5pt;
    background: #f4f3ef; padding: 1pt 4pt; border-radius: 3px;
  }
  .sources li { margin: 5pt 0; font-size: 10pt; }
  .src-desc { font-size: 9pt; color: #666; margin-top: 2pt; }
  .badges { font-size: 9pt; color: #666; margin-top: 4pt; }
  @media print { a { color: #1f3a8a; } }
</style>
</head>
<body>
<header>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    Generated ${escapeHtml(generated)} · Track: ${escapeHtml(result.trackDetected)}
    ${result.scrapedTitle ? ` · Scraped: ${escapeHtml(result.scrapedTitle)}` : ""}
  </div>
</header>
<main>
  ${mdToHtml(result.brief)}
  ${sourcesHtml}
</main>
<script>
  window.addEventListener("load", () => {
    setTimeout(() => { window.focus(); window.print(); }, 250);
  });
</script>
</body>
</html>`;

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    alert("Allow pop-ups for this site to export the brief as PDF.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
