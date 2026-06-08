import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { scrapeUrl, searchWeb, type SearchHit } from "./firecrawl.server";

const PrepInput = z.object({
  roleTitle: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  jobDescription: z.string().min(1).max(20000),
  companyNotes: z.string().max(20000).optional().default(""),
  companyUrl: z.string().url().optional().or(z.literal("")).default(""),
  candidate: z.string().min(1).max(40000),
  candidateName: z.string().max(200).optional().default(""),
  background: z.string().max(20000).optional().default(""),
  projects: z.string().max(20000).optional().default(""),
  track: z.enum(["auto", "research", "design"]).default("auto"),
});

export type PrepInputT = z.infer<typeof PrepInput>;

export interface PrepResult {
  brief: string; // markdown
  sources: SearchHit[];
  scrapedTitle?: string;
  trackDetected: "research" | "design" | "mixed";
  generatedAt: string;
  warnings: string[];
}

function detectTrack(jd: string, role: string, requested: "auto" | "research" | "design") {
  if (requested !== "auto") return requested;
  const blob = `${role}\n${jd}`.toLowerCase();
  const researchHits = (blob.match(/\b(research|researcher|usability|insight|qualitative|quantitative|ethnograph|mixed.method)\b/g) ?? []).length;
  const designHits = (blob.match(/\b(designer|design|prototype|figma|interaction|visual|ui\b|ux design)\b/g) ?? []).length;
  if (researchHits > designHits + 1) return "research";
  if (designHits > researchHits + 1) return "design";
  return "mixed" as const;
}

export const generatePrep = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PrepInput.parse(input))
  .handler(async ({ data }): Promise<PrepResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const warnings: string[] = [];
    const track = detectTrack(data.jobDescription, data.roleTitle, data.track);

    // 1. Scrape company URL if provided
    let scraped: { markdown: string; title?: string } | null = null;
    if (data.companyUrl) {
      scraped = await scrapeUrl(data.companyUrl);
      if (!scraped) warnings.push(`Could not scrape ${data.companyUrl} — proceeding without it.`);
    }

    // 2. Search the web for interview experiences
    const searchQuery = `${data.company} ${data.roleTitle} interview experience site:glassdoor.com OR site:reddit.com OR site:teamblind.com`;
    const sources = await searchWeb(searchQuery, 6);
    if (sources.length === 0) warnings.push("No interview-experience sources surfaced from web search.");

    // 3. Build prompt
    const sourcesBlock = sources.length
      ? sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.description ?? ""}`).join("\n\n")
      : "(none found)";

    const companyIntel = [
      data.companyNotes && `## User notes\n${data.companyNotes}`,
      scraped && `## Scraped from ${data.companyUrl} (${scraped.title ?? ""})\n${scraped.markdown}`,
    ]
      .filter(Boolean)
      .join("\n\n") || "(no company intel provided)";

    const trackLabel =
      track === "research" ? "UX Researcher" : track === "design" ? "UX Designer" : "UX (mixed research + design)";

    const system = `You are an interview prep coach for early-career UX researchers and designers.
Produce a TAILORED prep brief for a specific role + company. Be concrete, never generic.
Rules:
- Map advice to the candidate's actual projects and experience.
- When citing interview experiences, reference sources by [number] from the provided list. Never invent quotes.
- Label uncertainty plainly ("Signal is thin" / "Inferred from JD").
- Optimize for actionable practice over essays.
Output strict markdown with these H2 sections in order:
## Role & Track Read
## Company Values & Themes
## Likely Interview Questions
(group by Behavioral, Portfolio/Case, Craft, ${track === "research" ? "Research Methods" : track === "design" ? "Design Craft & Process" : "Methods & Craft"})
## What to Present (project mapping)
- For each recommended project, give: project, angle to lead with, metrics/outcome to emphasize, STAR-style story arc
## Talking Points & Values to Reference
## Similar Interview Experiences
- Bullet each cited source as: short paraphrase — [n] (source label)
- If sources are thin, say so explicitly.
## Open Questions to Ask Them
## Confidence & Caveats`;

    const user = `# Role
Title: ${data.roleTitle}
Company: ${data.company}
Detected track: ${trackLabel}

# Job Description
${data.jobDescription}

# Company intel
${companyIntel}

# Candidate background
${data.candidate}

# Web sources (use [n] citations)
${sourcesBlock}`;

    const gateway = createLovableAiGatewayProvider(apiKey);

    let brief: string;
    try {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system,
        prompt: user,
      });
      brief = text;
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes("429")) throw new Error("AI rate limit hit. Wait a moment and try again.");
      if (msg.includes("402")) throw new Error("AI credits exhausted for this workspace. Add credits to continue.");
      throw new Error(`AI generation failed: ${msg}`);
    }

    return {
      brief,
      sources,
      scrapedTitle: scraped?.title,
      trackDetected: track,
      generatedAt: new Date().toISOString(),
      warnings,
    };
  });
