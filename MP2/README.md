# UX Interview Prep

**Live app:** [ux-interview-prep.lovable.app](https://ux-interview-prep.lovable.app/)

---

## What it does

UX Interview Prep is a web app that helps you prepare for a **specific** UX job interview. Not generic advice, but a tailored prep package built around the role, company, and your own background.

You fill in:

- **Your profile** — background, experience, and portfolio projects (saved locally and reused across sessions)
- **The role** — job title and full job description (paste or upload a text file)
- **Company context** — company name, optional company URL (scraped for context), plus notes from their website, values, culture, Glassdoor, Reddit, or other sources (paste or upload)

When you click **Generate Interview Prep**, the app uses AI to produce a structured prep package with four sections:

| Section | What you get |
|--------|----------------|
| **Questions** | Role-tailored practice questions across behavioral, portfolio/case, craft, and research or design methods—with a short tip for each |
| **Company Themes** | Values and themes to reference in your answers, tied to this company |
| **Interview Intel** | Summary of what others have reported about interviewing there, with sources and confidence labels |
| **What to Present** | Which projects to lead with, how to frame them, metrics to mention, talking points, and what to avoid |

The app automatically detects whether the role leans **UX Research**, **UX Design**, or **mixed**, based on the job description (or you can set the track manually).

You can **save sessions** in your browser, revisit them later, and **export** any prep as PDF.

---

## File uploads

Each long text field has an **Upload** button next to it. You can paste text as usual, or load content from a file on your computer.

| Field | What to upload |
|-------|----------------|
| Background & experience | Resume or notes |
| Projects & portfolio highlights | Case studies or portfolio notes |
| Job description | Full posting |
| Company notes | Research snippets, values, culture notes |

**Supported formats:** `.txt`, `.md`, `.markdown`, `.rtf`, `.json`, `.csv` (max 2 MB per file)

**Privacy:** Files are read **only in your browser**—they are not sent to a file server. Only the text you choose to generate with is included in the AI request. Uploaded content is appended to the field (or replaces the job description when you upload there).

---

## Who it's for

This tool is for **early-career UX researchers and UX designers** who are actively applying to jobs and want focused prep for each interview.

If you are:

- Preparing for your first or next UX role
- Applying to many companies and need a different prep plan for each one
- Unsure which portfolio projects fit a given role, or what questions to expect

…this app is meant for you. You do not need any design or coding background to use it—just paste in the job posting (or upload it), add your experience, and generate a prep package.

---

## How to access it

### Use the live app

Open the live link at the top of this README in any modern browser (Chrome, Firefox, Safari, or Edge).

Your profile and saved sessions are stored in your browser’s local storage on that device.

### Run locally (optional)

From the `MP2` folder:

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`). You need [Node.js](https://nodejs.org) installed (`node` and `npm` on your PATH).

---

## Privacy

Your resume, projects, and prep sessions stay in your browser unless you export them. File uploads are processed locally. Nothing is sent to a custom server beyond the AI request used to generate each prep package.

---

## Files in this folder

| Path | Description |
|------|-------------|
| `src/routes/index.tsx` | Main page: prep display, saved sessions, PDF export |
| `src/components/PrepForm.tsx` | Profile and role form, including file upload buttons |
| `src/lib/prep.functions.ts` | Server function: AI prep generation |
| `src/lib/sessions.ts` | Browser local storage for saved sessions |
| `src/lib/export-pdf.ts` | PDF export |
| `src/lib/ai-gateway.server.ts` | AI provider configuration |
| `src/components/ui/` | Shared UI components (buttons, inputs, dialogs, etc.) |
| `package.json` | Dependencies and npm scripts |
| `vite.config.ts` | Vite / TanStack Start build config |
| `tsconfig.json` | TypeScript settings |
| `eslint.config.js` | Lint rules |
| `reflection.md` | Project reflection (course submission) |
| `mp2.md` | Mini project documentation (course submission) |

`node_modules/` is created by `npm install` and is not edited by hand.
