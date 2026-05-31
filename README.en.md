# PRPilot: AI Pull Request Review Assistant

中文版: [README.md](README.md)

PRPilot is an AI-powered Pull Request Review Assistant for the pre-human-review stage. It helps developers and reviewers understand PR changes, detect risky code, review structured findings, and generate a copyable Markdown report.

> Challenge: Qiniu Cloud × XEngineer 72-hour challenge
>
> Topic: AI PR Review Assistant
>
> Demo Video: TBD
>
> Demo PR: [https://github.com/Sunshine-skyy/prpilot/pull/19](https://github.com/Sunshine-skyy/prpilot/pull/19)

## Product Positioning

PRPilot does not replace human review. It prepares review context before humans spend time on a pull request:

- summarize what the PR changes;
- identify risky files and patterns;
- generate review suggestions based on selected focus areas;
- help reviewers locate high-risk code faster;
- produce a copyable Markdown review report.

## Implemented Features

### Analysis Inputs

- GitHub PR URL analysis;
- Raw Diff analysis;
- Try Demo experience;
- optional GitHub Token for private PRs or GitHub API rate limits.

### Risk Analysis and Review Output

- rule-based risk scan;
- risk score and risk level;
- PR change summary;
- file-level risk tags;
- LLM review findings;
- Markdown review report;
- Copy Report;
- rule-only fallback when no LLM API key is configured.

### SSE Streaming Progress

The backend provides:

- `POST /api/reviews/analyze-pr-stream`
- `POST /api/reviews/analyze-diff-stream`

During analysis, the frontend displays progress step by step. Completed stages turn green one by one, the active stage shows a loading state, and the latest progress message is shown. Stages include fetching PR data, parsing diffs, running risk rules, calling the LLM, generating the Markdown report, and completion.

### Focus Area Filtering

- true multi-select behavior;
- an `All` option to select or clear all focus areas;
- all focus areas selected by default;
- finding counts for each focus area;
- total finding count on `All`;
- empty states separated by cause: no generated findings, no selected focus areas, or no matching findings.

### Diff and Finding Navigation

- clicking a finding opens the related file diff preview;
- target line highlighting when available;
- long diff truncation for page performance;
- clear empty states for missing patches, binary files, oversized diffs, or GitHub API omissions.

### Frontend Experience

- dedicated How It Works page;
- Chinese / English language toggle;
- responsive UI;
- structured sections for overview, changed files, review findings, and Markdown report.

## Tech Stack and Third-party Dependencies

This project is not dependency-free. It uses backend and frontend frameworks and libraries. The core PR analysis pipeline, risk rules, context building, prompt building, Markdown report generation, SSE progress stream, and frontend interaction logic are implemented in this project.

### Backend

- Java 17;
- Spring Boot 3.3.5;
- Spring Web;
- Spring Validation;
- Spring WebFlux WebClient;
- Jackson;
- Maven;
- Spring Boot Starter Test.

### Frontend

- Next.js 15;
- React 19;
- React DOM;
- TypeScript;
- Tailwind CSS;
- lucide-react;
- Radix Slot;
- clsx;
- tailwind-merge;
- class-variance-authority;
- tailwindcss-animate;
- PostCSS.

### Model Integration

- OpenAI-compatible API;
- default provider: Alibaba Cloud DashScope compatible mode;
- default model: `qwen3-coder-plus`.

`qwen3-coder-plus` is used because PRPilot focuses on code diff understanding, risk detection, and structured review finding generation rather than general chat.

## Repository Structure

```text
PRPilot/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/prpilot/
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
  ├─ SSE Progress Timeline
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

## Backend APIs

```text
GET  /api/reviews/demo
POST /api/reviews/fetch-pr
POST /api/reviews/analyze-diff
POST /api/reviews/analyze-pr
POST /api/reviews/analyze-diff-stream
POST /api/reviews/analyze-pr-stream
```

Example request:

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "githubToken": "",
  "focusAreas": ["security", "bug-risk", "testing"],
  "language": "en"
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

## Model Strategy

PRPilot does not hard-code a model vendor in business logic. The backend uses a `LlmClient` interface and an `OpenAiCompatibleLlmClient` implementation.

Default configuration:

```yaml
llm:
  provider: openai-compatible
  base-url: https://dashscope.aliyuncs.com/compatible-mode/v1
  api-key: ${DASHSCOPE_API_KEY:}
  model: qwen3-coder-plus
  temperature: 0.2
  max-tokens: 4000
```

If `DASHSCOPE_API_KEY` is not configured, rule-based risk scanning, risk scoring, and Markdown report generation still work, while `findings` returns an empty list.

## Context Strategy

Before calling the LLM, PRPilot builds context from PR metadata, changed files, file patches, risk tags, rule-based risk score, risk reasons, and selected focus areas. Long patches are truncated and risky files are prioritized.

## Local Run and Deployment

The following commands work on Windows, macOS, and Linux. Run backend and frontend as two separate processes.

### Requirements

- JDK 17;
- Maven 3.9.x;
- Node.js 18+;
- npm;
- optional DashScope / Alibaba Cloud Bailian API key;
- optional GitHub Token.

### Configure the Model API Key

Windows PowerShell:

```powershell
$env:DASHSCOPE_API_KEY="your_api_key_here"
```

Windows CMD:

```bat
set DASHSCOPE_API_KEY=your_api_key_here
```

macOS / Linux:

```bash
export DASHSCOPE_API_KEY=your_api_key_here
```

### Start the Backend

Windows PowerShell / CMD:

```bat
cd backend
mvn spring-boot:run
```

macOS / Linux:

```bash
cd backend
mvn spring-boot:run
```

Default backend URL: `http://localhost:8080`

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

### Start the Frontend

Windows PowerShell / CMD:

```bat
cd frontend
npm install
npm run dev
```

macOS / Linux:

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL: `http://localhost:3000`

Production build:

```bash
cd frontend
npm run build
npm run start
```

## examples/demo-app

`examples/demo-app` is a controlled sample app for creating a demo pull request. The demo app on `main` remains a safe baseline. Reviewable risks are introduced only through a separate demo PR. The demo PR should remain open and should not be merged.

Demo PR: [https://github.com/Sunshine-skyy/prpilot/pull/19](https://github.com/Sunshine-skyy/prpilot/pull/19)

## Future Work

These items are based on practical product needs in the current workflow.

### 1. Login and Repository-level Analysis History

A future login module can let users treat each repository as a long-term tracked workspace. Each repository can store PR analysis records with PR URL, analysis time, model used, risk score, finding count, high-risk findings, Markdown report, and handled status. This turns PRPilot from a one-time analysis tool into repository-level review risk tracking.

### 2. Repository Folder View

After login, data can be organized by repository:

```text
Workspace
└── owner/repo
    ├── PR #12 analysis
    ├── PR #13 analysis
    └── PR #14 analysis
```

### 3. Severity and Confidence Filtering

Add severity and confidence threshold filtering so reviewers can prioritize high-confidence high-risk findings.

### 4. Finding Counts on File Cards

Show how many findings belong to each file, the highest severity, and whether the file has been viewed.

### 5. Chunked Analysis for Large PRs

Use rule-based scanning to identify high-risk files, run deep LLM analysis only on those files, summarize low-risk files, and merge results into one report.

### 6. Filtered Markdown Report

Provide Copy Full Report and Copy Filtered Report so users can export only the currently selected findings.

### 7. GitHub PR Comment or Check Integration

Support PR comments, GitHub Check Runs, and inline comments for high-confidence findings.

### 8. Model Mode Selection

Expose simple modes such as Fast and Deep instead of raw model names.

### 9. Team-specific Rules

Support repository-level high-risk paths and forbidden patterns without changing backend code.

## Troubleshooting

### Next.js `.next/trace` EPERM on Windows

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

### Webpack cache warning

If this warning appears:

```text
[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: Unexpected end of stream
```

It is usually caused by a corrupted `.next/cache` file or a previously interrupted process. It does not affect a successful build.

### Watt Toolkit / Java TLS / PKIX path building failed

Set:

```text
JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStoreType=Windows-ROOT
```

Or in PowerShell:

```powershell
$env:JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStoreType=Windows-ROOT"
```

Then restart the backend service.

## Final Submission Notes

Do not commit `.env`, real API keys, real GitHub tokens, `node_modules`, `.next`, `target`, or any real secrets.
