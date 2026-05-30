# PRPilot: AI Pull Request Review Assistant

中文版: [README.md](README.md)

PRPilot is an AI-powered Pull Request Review Assistant for the pre-human-review stage. It helps developers and reviewers understand pull request changes, detect risky code, and generate structured review suggestions with a copyable Markdown report.

> Challenge: Qiniu Cloud × XEngineer 72-hour challenge
>
> Topic: AI PR Review Assistant
>
> Demo Video: TBD
>
> Demo PR: TBD

## Product Positioning

PRPilot does not replace human review. It prepares better review context before human reviewers spend time on the pull request.

It helps users:

- summarize what the PR changes;
- identify risky files and risky patterns;
- generate review suggestions based on selected focus areas;
- copy a structured Markdown report into a GitHub PR comment.

## Core Features

- GitHub PR URL analysis;
- Raw Diff analysis;
- Offline Try Demo mode;
- Focus Areas selection;
- Rule-based risk scan;
- Risk score and risk level;
- Pull request change summary;
- LLM review findings;
- Markdown review report;
- Copy Report;
- Dedicated How It Works page;
- Chinese / English frontend language toggle;
- Safe rule-only fallback when no LLM API key is configured.

## Three-level Demo Fallback

PRPilot supports three demo paths for a stable final presentation:

1. Real GitHub PR + real AI analysis;
2. Raw Diff + real AI analysis;
3. Try Demo with fixed offline data.

Even if GitHub API, proxy networking, or the LLM service is unavailable, Try Demo can still show a complete analysis result.

## Tech Stack

### Backend

- Java 17;
- Spring Boot 3.3.5;
- Spring Web;
- Spring Validation;
- Spring WebFlux WebClient;
- Maven;
- Jackson.

### Frontend

- Next.js 15;
- React 19;
- TypeScript;
- Tailwind CSS;
- shadcn/ui-ready configuration;
- lucide-react.

### Model Integration

- OpenAI-compatible API;
- Default provider configuration: Alibaba Cloud DashScope compatible mode;
- Default model: `qwen-turbo`.

## Repository Structure

```text
PRPilot/
├── .github/
│   └── pull_request_template.md
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/prpilot/
│       ├── client/
│       ├── config/
│       ├── controller/
│       ├── dto/
│       ├── rule/
│       ├── service/
│       └── util/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
├── examples/
│   └── demo-app/
├── README.md
└── README.en.md
```

## Architecture Overview

```text
Frontend
  ├─ GitHub PR URL Input
  ├─ Raw Diff Input
  ├─ Focus Areas
  ├─ Try Demo
  └─ Results / Markdown Report

Backend
  ├─ ReviewController
  ├─ GitHubPullRequestService
  ├─ DiffParser
  ├─ RiskRuleEngine
  ├─ ContextBuilder
  ├─ ReviewPromptBuilder
  ├─ LlmClient
  └─ MarkdownReportGenerator

External Services
  ├─ GitHub REST API
  └─ OpenAI-compatible LLM API
```

## Core Analysis Flow

```text
GitHub PR URL / Raw Diff
↓
Diff Fetcher / DiffParser
↓
Rule-based Risk Scan
↓
Context Builder
↓
Review Prompt Builder
↓
LLM Review Agent
↓
Structured Review Response
↓
Markdown Review Report
```

## Backend APIs

### Try Demo

```text
GET /api/reviews/demo
```

Returns a fixed complete analysis response for offline demonstration.

### Fetch GitHub PR

```text
POST /api/reviews/fetch-pr
```

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "githubToken": ""
}
```

### Analyze Raw Diff

```text
POST /api/reviews/analyze-diff
```

```json
{
  "title": "Improve auth middleware",
  "description": "This patch updates token validation.",
  "diff": "diff --git a/src/auth/middleware.ts b/src/auth/middleware.ts ...",
  "focusAreas": ["security", "testing"]
}
```

### Analyze GitHub PR

```text
POST /api/reviews/analyze-pr
```

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "githubToken": "",
  "focusAreas": ["security", "bug-risk", "testing"]
}
```

## Response Structure

The main response type is `ReviewAnalysisResponse`:

```json
{
  "pullRequest": {},
  "changeSummary": {},
  "riskAssessment": {},
  "files": [],
  "findings": [],
  "markdownReport": ""
}
```

Where:

- `pullRequest`: title, author, branches, changed files, additions, deletions;
- `changeSummary`: overview, key changes, impacted areas;
- `riskAssessment`: risk score, risk level, reasons;
- `files`: changed files with file-level risk tags;
- `findings`: AI-generated review findings;
- `markdownReport`: copyable Markdown report.

## Model Strategy

PRPilot does not hard-code a model vendor in business logic.

The backend uses a `LlmClient` interface and an `OpenAiCompatibleLlmClient` implementation.

Default configuration:

```yaml
llm:
  provider: openai-compatible
  base-url: https://dashscope.aliyuncs.com/compatible-mode/v1
  api-key: ${DASHSCOPE_API_KEY:}
  model: qwen-turbo
  temperature: 0.2
  max-tokens: 4000
```

To switch to DeepSeek, OpenAI, or another OpenAI-compatible provider, only configuration needs to be changed.

If `DASHSCOPE_API_KEY` is not configured, the system safely falls back to rule-only analysis:

- rule-based risk scan still works;
- risk score still works;
- Markdown report still works;
- `findings` returns an empty list.

## Context Strategy

Before calling the LLM, PRPilot builds structured context from:

- PR title, author, state, base/head branches;
- changed files, additions, deletions;
- file patches;
- risk tags;
- rule-based risk score, level, and reasons;
- user-selected focus areas.

Long patches are truncated to control context size, and risky files are prioritized.

## Rule-based Risk Analysis

The rule engine scans deterministic risk signals before LLM analysis, including:

- large changes;
- too many changed files;
- missing test changes;
- auth / login / token / permission changes;
- database / migration / schema changes;
- config / env / secret / key / password changes;
- TODO / FIXME markers;
- debug logging such as `console.log`;
- potential empty catch blocks;
- removed validation / guard / permission / authorization logic;
- sensitive file changes.

These signals are used to generate:

- risk score;
- risk level;
- risk reasons;
- file-level risk tags;
- better evidence for LLM review.

## False Positive Control

PRPilot reduces noisy suggestions through prompt constraints and structured context:

- findings must be supported by the provided diff and context;
- the model must not invent missing files, code, or behavior;
- weak evidence should lead to lower confidence;
- style-only preferences should not be marked as high severity;
- output must include structured severity, category, file, line, title, description, suggestion, and confidence.

## Run Backend

Requirements:

- JDK 17;
- Maven 3.9.x.

Start the backend:

```bash
cd backend
mvn spring-boot:run
```

Run tests:

```bash
cd backend
mvn test
```

Package:

```bash
cd backend
mvn -q -DskipTests package
```

Default backend URL:

```text
http://localhost:8080
```

## Run Frontend

Requirements:

- Node.js;
- npm.

Install dependencies:

```bash
cd frontend
npm install
```

Start development server:

```bash
cd frontend
npm run dev
```

Build:

```bash
cd frontend
npm run build
```

Default frontend URL:

```text
http://localhost:3000
```

## Environment Variables

### LLM API Key

```bash
DASHSCOPE_API_KEY=your_api_key_here
```

Do not commit `.env` or any real API key.

### GitHub Token

GitHub Token is optional:

- it can be entered temporarily in the frontend input;
- it is useful for private PRs or GitHub API rate limits;
- it is not stored in the repository.

## examples/demo-app

`examples/demo-app` is a controlled sample app for creating a demo pull request.

Design principles:

- the demo app on `main` remains a safe baseline;
- reviewable risks are introduced only through a separate demo PR;
- the demo PR should remain open and should not be merged;
- no real secrets are included;
- fake secrets must be clearly fake.

## Demo PR

Demo PR: TBD

Planned controlled risks:

- weakened token validation;
- token logging;
- TODO marker;
- permission check bypass;
- config file change;
- clearly fake secret;
- missing test update.

The demo PR is for PRPilot demonstration only and should not be merged into `main`.

## Docker

The current version prioritizes standard local development commands. Docker Compose is an optional enhancement and may be added in a later PR if time allows:

- `backend/Dockerfile`;
- `frontend/Dockerfile`;
- `docker-compose.yml`;
- local Docker demo instructions.

If Docker is not implemented, the core application can still run normally through the local commands above.

## Third-party Dependencies

### Backend

- Spring Boot Starter Web;
- Spring Boot Starter Validation;
- Spring Boot Starter WebFlux;
- Spring Boot Starter Test;
- Jackson;
- Maven.

### Frontend

- Next.js;
- React;
- React DOM;
- TypeScript;
- Tailwind CSS;
- lucide-react;
- clsx;
- tailwind-merge;
- class-variance-authority;
- tailwindcss-animate;
- Radix Slot.

## Original Work

This project is implemented around the AI PR Review scenario. Core original work includes:

- GitHub PR URL analysis pipeline;
- Raw Diff analysis pipeline;
- rule-based risk engine;
- risk score and file-level risk tags;
- LLM context builder;
- review prompt builder;
- OpenAI-compatible LLM client;
- Markdown review report generator;
- offline Try Demo fallback;
- frontend analysis workspace;
- How It Works page;
- Chinese / English frontend language toggle.

## Development Process Summary

The project has been developed with small focused PRs. Major stages include:

1. Repository initialization;
2. Project scaffolding;
3. Monorepo structure;
4. Next.js frontend migration;
5. Backend demo API;
6. Frontend demo UI;
7. GitHub PR fetcher;
8. Rule-based risk engine;
9. `examples/demo-app`;
10. Raw Diff analysis;
11. LLM analysis capability;
12. Full GitHub PR analysis;
13. Frontend analysis flows;
14. How It Works and architecture overview;
15. Frontend UI polish;
16. Frontend Chinese / English language toggle;
17. Final bilingual README.

## Troubleshooting

### Next.js `.next/trace` EPERM on Windows

On Windows, `npm run build` may fail with:

```text
Error: EPERM: operation not permitted, open '...frontend\\.next\\trace'
```

This is usually not a code issue. It means `.next/trace` is locked by Node, the IDE, or a previous Next.js process.

Git Bash:

```bash
taskkill /F //IM node.exe
rm -rf .next
npm run build
```

PowerShell:

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next
npm run build
```

### Watt Toolkit / Java TLS / PKIX path building failed

When using Watt Toolkit to access GitHub, the Java backend may fail with:

```text
PKIX path building failed
```

The reason is that Watt Toolkit's HTTPS proxy certificate is not trusted by Java's default truststore.

Set the following system environment variable:

```text
JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStoreType=Windows-ROOT
```

Or set it temporarily in PowerShell:

```powershell
$env:JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStoreType=Windows-ROOT"
```

Then restart the backend service.

## Future Work

- GitHub App integration;
- PR inline comments;
- team-specific review rules;
- AST / static analysis enhancement;
- multi-model comparison;
- caching and task queue;
- GitLab / Gitee support;
- Docker Compose local demo;
- enterprise audit and report export.

## Final Submission Notes

The repository should remain private during the development period and be made public only when required by the challenge rules.

Do not commit:

- `.env`;
- real API keys;
- real GitHub tokens;
- `node_modules`;
- `.next`;
- `target`;
- any real secrets.
