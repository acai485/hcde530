import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PrepInputT } from "@/lib/prep.functions";

interface Props {
  initial?: Partial<PrepInputT>;
  loading: boolean;
  onSubmit: (input: PrepInputT) => void;
}

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".rtf", ".json", ".csv"];

function composeCandidate(name: string, background: string, projects: string) {
  return [
    name && `Name: ${name}`,
    background && `Experience & background:\n${background}`,
    projects && `Projects & portfolio highlights:\n${projects}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function FileUploadButton({
  onText,
  label = "Upload text file",
}: {
  onText: (text: string, filename: string) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handle(file: File) {
    setErr(null);
    const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
    if (!TEXT_EXTENSIONS.includes(ext)) {
      setErr(`Unsupported file. Use ${TEXT_EXTENSIONS.join(", ")} or paste the text directly.`);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErr("File too large (max 2 MB).");
      return;
    }
    const text = await file.text();
    onText(text, file.name);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="file"
        accept={TEXT_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => ref.current?.click()}
        title={label}
      >
        <Upload className="h-3 w-3" />
        Upload
      </Button>
      {err && <span className="text-[10px] text-destructive">{err}</span>}
    </div>
  );
}

export function PrepForm({ initial, loading, onSubmit }: Props) {
  const [roleTitle, setRoleTitle] = useState(initial?.roleTitle ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [jobDescription, setJobDescription] = useState(initial?.jobDescription ?? "");
  const [companyNotes, setCompanyNotes] = useState(initial?.companyNotes ?? "");
  const [companyUrl, setCompanyUrl] = useState(initial?.companyUrl ?? "");
  const [candidateName, setCandidateName] = useState(initial?.candidateName ?? "");
  const [background, setBackground] = useState(
    initial?.background ?? (initial?.candidateName ? "" : initial?.candidate ?? ""),
  );
  const [projects, setProjects] = useState(initial?.projects ?? "");
  const [track, setTrack] = useState<PrepInputT["track"]>(initial?.track ?? "auto");

  const canSubmit =
    roleTitle.trim() &&
    company.trim() &&
    jobDescription.trim() &&
    (background.trim() || projects.trim());

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        const candidate = composeCandidate(candidateName, background, projects);
        onSubmit({
          roleTitle,
          company,
          jobDescription,
          companyNotes,
          companyUrl,
          candidate,
          candidateName,
          background,
          projects,
          track,
        });
      }}
    >
      {/* PROFILE SECTION */}
      <section className="space-y-4">
        <header className="flex items-baseline justify-between border-b border-border pb-2">
          <h3 className="font-serif text-lg tracking-tight">Profile</h3>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Reusable</span>
        </header>

        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
            placeholder="Jane Doe" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="bg">Background & experience</Label>
            <FileUploadButton
              onText={(t) => setBackground((prev) => (prev ? prev + "\n\n" : "") + t)}
              label="Upload resume or notes (text)"
            />
          </div>
          <Textarea id="bg" value={background} onChange={(e) => setBackground(e.target.value)}
            rows={7}
            placeholder="Roles, years of experience, methods, industries, education…" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="proj">Projects & portfolio highlights</Label>
            <FileUploadButton
              onText={(t) => setProjects((prev) => (prev ? prev + "\n\n" : "") + t)}
              label="Upload case studies or portfolio notes (text)"
            />
          </div>
          <Textarea id="proj" value={projects} onChange={(e) => setProjects(e.target.value)}
            rows={6}
            placeholder="2–4 case studies: problem, your role, methods, outcome, metrics. Links welcome."
          />
        </div>
      </section>

      {/* ROLE INFORMATION SECTION */}
      <section className="space-y-4">
        <header className="flex items-baseline justify-between border-b border-border pb-2">
          <h3 className="font-serif text-lg tracking-tight">Role information</h3>
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Per interview</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="role">Role title</Label>
            <Input id="role" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Senior UX Researcher, Growth" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)}
              placeholder="Figma" required />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="jd">Job description</Label>
            <FileUploadButton
              onText={(t) => setJobDescription(t)}
              label="Upload job description (text)"
            />
          </div>
          <Textarea id="jd" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
            rows={8} placeholder="Paste the full posting…" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label htmlFor="curl">Company URL (optional — we'll scrape it)</Label>
            <Input id="curl" type="url" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="https://figma.com/about" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track">Track</Label>
            <Select value={track} onValueChange={(v) => setTrack(v as PrepInputT["track"])}>
              <SelectTrigger id="track"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="research">UX Research</SelectItem>
                <SelectItem value="design">UX Design</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="notes">Company notes (optional — Glassdoor/Reddit snippets, values, culture)</Label>
            <FileUploadButton
              onText={(t) => setCompanyNotes((prev) => (prev ? prev + "\n\n" : "") + t)}
              label="Upload company notes (text)"
            />
          </div>
          <Textarea id="notes" value={companyNotes} onChange={(e) => setCompanyNotes(e.target.value)}
            rows={5} placeholder="Paste anything you've gathered…" />
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted-foreground">
          Inputs stay in your browser. Files are read locally — nothing is uploaded.
        </p>
        <Button type="submit" disabled={!canSubmit || loading} size="lg" className="rounded-full px-6">
          {loading ? "Preparing…" : "Generate prep brief"}
        </Button>
      </div>
    </form>
  );
}
