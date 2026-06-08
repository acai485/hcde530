## What did you build?

I built "UX Interview Prep", a web app for early-career UX researchers and designers preparing for a specific job interview. Instead of generic advice, it produces a prep package built around one role and one company. Users enter their background and portfolio projects (saved locally and reused), paste or upload a job description, and add company notes or a URL. Clicking "Generate Interview Prep" produces a structured brief: practice questions by type (behavioral, portfolio, craft, methods), company themes to reference, interview intel from real reports, and guidance on which projects to lead with. The app detects whether the role leans research, design, or mixed, saves sessions in the browser, and exports PDFs. It is live at [ux-interview-prep.lovable.app](https://ux-interview-prep.lovable.app/).



## What decisions did you make?

For my platform decision, I chose Bolt at first because the project needed file uploads, multi-section form state, and dynamic LLM-driven rendering in a UI-forward product that deploys quickly. I pivoted to Lovable, my declared close second, after Bolt suggested collecting company and interview information through an LLM API that repeatedly hallucinated important information. Lovable also gave easy access to Firecrawl, which helped scrape company URLs and searched for interview reports on Glassdoor, Reddit, and TeamBlind. That extended my original data plan (unstructured text in, structured prep out via LLM, saved as JSON/markdown per session in the browser with PDF download) by grounding generation in cited sources.

I stayed on the design track: the interface is the product—a two-column workspace in `index.tsx` users navigate, save, and revisit. I shipped a scrollable markdown brief plus a saved-sessions list rather than the tabbed views I originally planned, keeping scope focused on reuse across applications rather than a mock-interview chatbot.



## What would you do differently?

First, I would put strict anti-hallucination rules in Lovable’s initial project instructions—not only in the system prompt I iterated on later. The final prompt in `prep.functions.ts` says “Never invent quotes” and requires a "Confidence & Caveats" section, but I spent many cycles fixing exaggerations that upfront rules might have caught.

Second, I would validate AI output before displaying it. Warnings today cover missing scrape or search results, but not inconsistent citations—for example, interview claims with no matching `[n]` reference when sources exist. A post-generation check requiring citations in “Similar Interview Experiences” when sources are available would make the interface more trustworthy without changing the overall design.



## What does this work demonstrate? (Reiterated from mp2.md)

### C8 — Building and Deploying a Complete Tool

My MP2 is a webapp that I created to help early career UX professionals prepare for interviews. I created the app using Lovable, after a lot of trial and error with Bolt (explained in next competency claim). The app takes user input about their past experiences and job application details, combines it with data scraped from the web using the Firecrawl API about similar interview experiences. The main issue I ran into was that Lovable kept making small hallucinations and exaggerations. I had to prompt multiple times in different ways to ensure that outputs only contained real information. If I were to do this project again, I would include strict instructions to not make up any information within the rules file that I gave Lovable in the beginning, which would have hopefully lessened the amount of times I had to prompt it later on.


### C7 — Critical Evaluation and Professional Judgment

When I first started working on this project in Bolt, it kept trying to suggest I use a Claude API or similar LLM access API to supply information for my tool. I tried this out but was immediately suspicious of the responses that were being produced so I started to explore webscraping APIs to gather real data. I decided to pivot to using Lovable at this point because of it's easy access to the Firecrawl API. But even though this decision started producing better results, Lovable wasn't perfect. It cited and used real sources, but still hallucinated in the form of exaggerations and other minor explanations. I continued to iterate until none of the information was stretched or made up. This was very important to me because only accurate information about a company and their interview style will actually be helpful to interviewees.
