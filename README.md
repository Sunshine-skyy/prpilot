# PRPilot：AI 代码评审助手

English Version: [README.en.md](README.en.md)

PRPilot 是一个 AI Pull Request Review Assistant，面向“正式人工 Review 前”的代码评审准备阶段。它可以帮助开发者和 Reviewer 快速理解 PR 变更、识别潜在风险，并生成结构化 Review 建议和可复制的 Markdown 报告。

> 参赛项目：七牛云 × XEngineer 72 小时限时实战挑战
>
> 议题方向：题目三，AI PR Review 助手
>
> Demo Video: 待补充
>
> Demo PR: [https://github.com/Sunshine-skyy/prpilot/pull/19](https://github.com/Sunshine-skyy/prpilot/pull/19)

## 项目定位

PRPilot 不替代人工 Review。它的目标是在人工 Review 前完成预分析：

- 总结 PR 做了什么；
- 标记可能有风险的文件和变更；
- 根据关注方向生成 Review 建议；
- 输出可以直接复制到 GitHub PR 评论区的 Markdown 报告。

## 核心功能

- GitHub PR URL 分析；
- Raw Diff 粘贴分析；
- Try Demo 快速体验入口；
- Focus Areas 关注方向选择；
- 规则风险扫描；
- 风险评分和风险等级；
- PR 变更总结；
- LLM Review Findings；
- Markdown Review Report；
- Copy Report；
- How It Works 独立展示页；
- 前端中文 / English 语言切换；
- 无 LLM API Key 时自动降级为规则分析模式。

## 多输入分析方式

PRPilot 支持多种 PR 分析入口，适配不同开发场景：

1. GitHub PR URL：适合直接分析 GitHub Pull Request；
2. Raw Diff：适合无法直接访问仓库、使用其他代码托管平台，或只希望分析某段变更内容的场景；
3. Try Demo：用于无需配置 GitHub Token 或 LLM API Key 时快速体验产品能力。

这种设计让用户既可以接入真实 PR，也可以在私有仓库、受限网络或本地评估场景下完成代码变更分析。

## 技术栈

### 后端

- Java 17；
- Spring Boot 3.3.5；
- Spring Web；
- Spring Validation；
- Spring WebFlux WebClient；
- Maven；
- Jackson。

### 前端

- Next.js 15；
- React 19；
- TypeScript；
- Tailwind CSS；
- shadcn/ui-ready 配置；
- lucide-react。

### 模型调用

- OpenAI-compatible API；
- 默认配置为阿里云百炼 DashScope compatible mode；
- 默认模型：`qwen-turbo`。

## 仓库结构

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

## 系统架构

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

## 核心分析流程

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

## 后端接口

### Try Demo

```text
GET /api/reviews/demo
```

返回固定完整分析结果，用于离线演示。

### 获取 GitHub PR

```text
POST /api/reviews/fetch-pr
```

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "githubToken": ""
}
```

### Raw Diff 分析

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

### 完整 GitHub PR 分析

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

## 返回结构

核心返回结构为 `ReviewAnalysisResponse`：

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

其中：

- `pullRequest`：PR 标题、作者、分支、文件数、增删行等；
- `changeSummary`：变更概览、关键变更、影响范围；
- `riskAssessment`：风险分数、等级、原因；
- `files`：变更文件和文件级风险标签；
- `findings`：AI Review 建议；
- `markdownReport`：可复制的 Markdown 报告。

## 模型选择策略

PRPilot 不在业务逻辑中写死任何模型厂商。后端通过 `LlmClient` 接口和 `OpenAiCompatibleLlmClient` 实现来调用模型。

默认配置：

```yaml
llm:
  provider: openai-compatible
  base-url: https://dashscope.aliyuncs.com/compatible-mode/v1
  api-key: ${DASHSCOPE_API_KEY:}
  model: qwen-turbo
  temperature: 0.2
  max-tokens: 4000
```

如需切换 DeepSeek、OpenAI 或其他 OpenAI-compatible 服务，只需要修改配置，不需要改业务代码。

如果未配置 `DASHSCOPE_API_KEY`，系统会安全降级：

- 保留规则风险扫描；
- 保留风险评分；
- 保留 Markdown 报告；
- `findings` 返回空列表。

## 上下文获取方式

PRPilot 在调用 LLM 前会构造结构化上下文，包括：

- PR 标题、作者、状态、base/head 分支；
- changed files、additions、deletions；
- 文件 patch；
- 风险标签；
- 规则风险分数、风险等级、风险原因；
- 用户选择的 Focus Areas。

为了控制上下文长度，长 patch 会被截断，并优先保留风险更高的文件信息。

## 风险分析策略

规则引擎会在调用 LLM 前先扫描确定性风险信号，例如：

- 大规模变更；
- 修改文件过多；
- 缺少测试变更；
- auth / login / token / permission 相关变更；
- database / migration / schema 相关变更；
- config / env / secret / key / password 相关变更；
- TODO / FIXME；
- `console.log` 等调试日志；
- 空 catch；
- 删除 validation / guard / permission / authorization 逻辑；
- 敏感文件修改。

这些信号会用于：

- 生成风险分数；
- 生成风险等级；
- 生成风险原因；
- 给文件添加风险标签；
- 为 LLM 提供更准确的上下文。

## 误报控制策略

PRPilot 通过 Prompt 和结构化上下文降低误报：

- 要求 findings 必须基于 diff 和上下文证据；
- 禁止编造不存在的文件、代码或行为；
- 证据不足时降低 confidence；
- 不把纯风格偏好标为高危问题；
- 输出结构化 severity、category、file、line、title、description、suggestion、confidence。

## 如何运行后端

要求：

- JDK 17；
- Maven 3.9.x。

启动：

```bash
cd backend
mvn spring-boot:run
```

运行测试：

```bash
cd backend
mvn test
```

打包：

```bash
cd backend
mvn -q -DskipTests package
```

默认端口：

```text
http://localhost:8080
```

## 如何运行前端

要求：

- Node.js；
- npm。

安装依赖：

```bash
cd frontend
npm install
```

启动开发服务器：

```bash
cd frontend
npm run dev
```

构建：

```bash
cd frontend
npm run build
```

默认访问地址：

```text
http://localhost:3000
```

## 环境变量配置

### LLM API Key

```bash
DASHSCOPE_API_KEY=your_api_key_here
```

不要提交 `.env` 或任何真实 API Key。

### GitHub Token

GitHub Token 是可选的：

- 可以在前端输入框中临时填写；
- 用于私有 PR 或 GitHub API 限流场景；
- 不会写入仓库。

## examples/demo-app 说明

`examples/demo-app` 是一个受控演示样例应用，用于后续构造 Demo PR。

设计原则：

- main 分支中的 demo app 保持安全基线；
- 演示风险通过单独 Demo PR 引入；
- Demo PR 保持 open，不合并；
- 不包含真实密钥；
- fake secret 必须明显标注为 fake。

## Demo PR

Demo PR: [https://github.com/Sunshine-skyy/prpilot/pull/19](https://github.com/Sunshine-skyy/prpilot/pull/19)

计划使用 `examples/demo-app` 构造一个受控风险 PR，包含：

- token 校验弱化；
- 打印 token；
- TODO；
- 权限校验绕过；
- 配置文件修改；
- 明显 fake secret；
- 缺少测试更新。

该 PR 仅用于 PRPilot 演示，不应合并到 `main`。

## Docker 说明

当前版本优先支持本地普通运行方式。Docker Compose 是可选增强项，如时间允许会在后续 PR 中补充：

- `backend/Dockerfile`；
- `frontend/Dockerfile`；
- `docker-compose.yml`；
- Docker 本地演示说明。

如最终未实现 Docker，不影响核心功能运行。

## 第三方依赖和框架

### 后端依赖

- Spring Boot Starter Web；
- Spring Boot Starter Validation；
- Spring Boot Starter WebFlux；
- Spring Boot Starter Test；
- Jackson；
- Maven。

### 前端依赖

- Next.js；
- React；
- React DOM；
- TypeScript；
- Tailwind CSS；
- lucide-react；
- clsx；
- tailwind-merge；
- class-variance-authority；
- tailwindcss-animate；
- Radix Slot。

## 原创功能说明

本项目围绕 AI PR Review 场景从零实现，核心原创内容包括：

- GitHub PR URL 分析链路；
- Raw Diff 分析链路；
- 规则风险引擎；
- 风险评分和文件风险标签；
- LLM 上下文构建；
- Review Prompt 构建；
- OpenAI-compatible LLM Client；
- Markdown Review Report 生成；
- Try Demo 快速体验入口；
- 前端分析工作台；
- How It Works 展示页；
- 中文 / English 前端语言切换。

## 开发过程摘要

项目按照每个 PR 只做一件事的方式持续开发。已完成的主要阶段包括：

1. 初始化仓库；
2. 项目脚手架；
3. Monorepo 结构；
4. Next.js 前端迁移；
5. 后端 Demo API；
6. 前端 Demo UI；
7. GitHub PR Fetcher；
8. 规则风险引擎；
9. examples/demo-app；
10. Raw Diff 分析；
11. LLM 分析能力；
12. 完整 GitHub PR 分析；
13. 前端完整分析交互；
14. How It Works 与架构说明；
15. 前端 UI polish；
16. 前端中英双语切换；
17. 最终中英双语 README。

## Troubleshooting

### Windows 下 Next.js `.next/trace` EPERM

在 Windows 上执行 `npm run build` 时，可能遇到：

```text
Error: EPERM: operation not permitted, open '...frontend\\.next\\trace'
```

这通常不是代码问题，而是 `.next/trace` 被 Node、IDE 或上一次 Next.js 进程占用。

Git Bash 可执行：

```bash
taskkill /F //IM node.exe
rm -rf .next
npm run build
```

PowerShell 可执行：

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next
npm run build
```

### Watt Toolkit / Java TLS / PKIX path building failed

如果本地通过 Watt Toolkit 访问 GitHub，Java 后端调用 GitHub API 可能出现：

```text
PKIX path building failed
```

原因是 Watt Toolkit 的 HTTPS 代理证书不在 Java 默认 truststore 中。

可在系统环境变量中设置：

```text
JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStoreType=Windows-ROOT
```

或在 PowerShell 临时设置：

```powershell
$env:JAVA_TOOL_OPTIONS="-Djavax.net.ssl.trustStoreType=Windows-ROOT"
```

然后重新启动后端服务。

## 未来扩展方向

- GitHub App 集成；
- PR inline comments；
- 团队自定义 Review 规则；
- AST / 静态分析增强；
- 多模型对比；
- 缓存和任务队列；
- GitLab / Gitee 支持；
- Docker Compose 一键本地演示；
- 企业级审计和报告导出。

## 提交前说明

比赛开发期间仓库保持 private，最终按比赛要求再改为 public / 开放访问。

请不要提交：

- `.env`；
- 真实 API Key；
- 真实 GitHub Token；
- `node_modules`；
- `.next`；
- `target`；
- 任何真实密钥。
