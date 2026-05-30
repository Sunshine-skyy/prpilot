# PRPilot

PRPilot: AI Pull Request Review Assistant.

PRPilot is an AI-powered Pull Request Review Assistant that helps developers summarize changes, detect risky code, and generate structured review suggestions before human review.

This repository is created for the Qiniu Cloud x XEngineer 72-hour challenge.

## Repository Structure

```text
prpilot/
├── backend/
├── frontend/
├── examples/
│   └── demo-app/
├── README.md
└── .gitignore
```

## Applications

- `frontend/`: Next.js, React, TypeScript, Tailwind CSS, and shadcn/ui-ready web application.
- `backend/`: Spring Boot backend service for PR analysis APIs and rule-based review logic.
- `examples/demo-app/`: Controlled demo app used to construct reviewable PR scenarios.

## Core Analysis Flow

PRPilot supports three analysis paths:

1. GitHub PR URL analysis.
2. Raw Diff fallback analysis.
3. Offline Try Demo mode.

The main review pipeline is:

```text
GitHub PR URL / Raw Diff
↓
Diff Fetcher
↓
Rule-based Risk Scan
↓
Context Builder
↓
LLM Review Agent
↓
Structured Review Report
```

## Architecture Overview

The backend separates the review process into small components:

- `GitHubPullRequestService`: parses GitHub PR URLs and fetches pull request metadata and changed files.
- `DiffParser`: parses pasted raw diff input into file-level changes.
- `RiskRuleEngine`: scans changed files and patches for deterministic risk signals.
- `ContextBuilder`: builds structured context from metadata, changed files, risk tags, and focus areas.
- `ReviewPromptBuilder`: creates prompts that constrain the model to evidence-based findings.
- `LlmClient`: abstracts model providers behind an OpenAI-compatible interface.
- `MarkdownReportGenerator`: produces a copyable Markdown review report.

## Model Strategy

PRPilot does not hard-code a specific model provider in business logic.

The backend uses an OpenAI-compatible `LlmClient` abstraction. The default configuration points to DashScope compatible mode and can be changed through configuration:

```yaml
llm:
  provider: openai-compatible
  base-url: https://dashscope.aliyuncs.com/compatible-mode/v1
  api-key: ${DASHSCOPE_API_KEY:}
  model: qwen-turbo
  temperature: 0.2
  max-tokens: 4000
```

If no API key is configured, analysis still works in rule-only mode and returns an empty `findings` list.

## Context Strategy

Before calling the LLM, PRPilot builds structured context that includes:

- Pull request title, author, state, branches, changed file count, additions, and deletions.
- Changed files with filename, status, additions, deletions, patch, and risk tags.
- Rule-based risk score, risk level, and risk reasons.
- User-selected focus areas such as Security, Bug Risk, Performance, Maintainability, and Testing.

Long patches are truncated to control context size, and risky files are prioritized.

## Rule-based Risk Analysis

PRPilot uses deterministic rules before LLM analysis. The rule engine detects signals such as:

- Large changes.
- Too many changed files.
- Missing test changes.
- Authentication, login, token, role, and permission changes.
- Database, migration, schema, SQL, and repository changes.
- Configuration, environment, secret, key, password, and credential keywords.
- TODO and FIXME markers.
- Debug logging such as `console.log`.
- Potential empty catch blocks.
- Removed validation, guard, permission, or authorization logic.
- Sensitive file changes.

These signals are used to generate risk score, risk level, risk reasons, and file-level risk tags.

## False Positive Control

The LLM prompt is designed to reduce noisy review suggestions:

- Findings must be supported by the provided diff and context.
- The model is instructed not to invent missing files, code, or behavior.
- Low-evidence findings should receive lower confidence.
- Style-only preferences should not be marked as high severity.
- Findings must use structured severity, category, file, title, description, suggestion, and confidence fields.

## Frontend Development

Install dependencies:

```bash
cd frontend
npm install
```

Start the local development server:

```bash
cd frontend
npm run dev
```

Create a production build:

```bash
cd frontend
npm run build
```

## Backend Development

The backend scaffold uses Java 17 and Spring Boot.

Start the backend service:

```bash
cd backend
mvn spring-boot:run
```

Run backend tests:

```bash
cd backend
mvn test
```
