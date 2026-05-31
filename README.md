# PRPilot：AI 代码评审助手

English Version: [README.en.md](README.en.md)

PRPilot 是一个 AI Pull Request Review Assistant，面向“正式人工 Review 前”的代码评审准备阶段。它帮助开发者和 Reviewer 快速理解 PR 变更、识别潜在风险、查看结构化 Review 建议，并生成可复制到 GitHub PR 评论区的 Markdown 报告。

> 参赛项目：七牛云 × XEngineer 72 小时限时实战挑战
>
> 议题方向：题目三，AI PR Review 助手
>
> Demo Video: [https://www.bilibili.com/video/BV1VuVQ6KEVi/](https://www.bilibili.com/video/BV1VuVQ6KEVi/)
>
> Demo PR: [https://github.com/Sunshine-skyy/prpilot/pull/19](https://github.com/Sunshine-skyy/prpilot/pull/19)

## 项目定位

PRPilot 不替代人工 Review。它的目标是在人工 Review 前完成预分析：

- 总结 PR 做了什么；
- 标记可能有风险的文件和变更；
- 根据关注方向生成 Review 建议；
- 帮助 Reviewer 更快定位高风险代码；
- 输出可以直接复制的 Markdown Review 报告。

## 当前已实现功能

### 分析入口

- GitHub PR URL 分析；
- Raw Diff 粘贴分析；
- Try Demo 快速体验入口；
- 可选 GitHub Token，支持私有 PR 或 GitHub API 限流场景。

### 风险分析与 Review 输出

- 规则风险扫描；
- 风险评分和风险等级；
- PR 变更总结；
- 文件级风险标签；
- LLM Review Findings；
- Markdown Review Report；
- Copy Report；
- 无 LLM API Key 时自动降级为规则分析模式。

### SSE 流式分析进度

后端提供 SSE 接口：

- `POST /api/reviews/analyze-pr-stream`
- `POST /api/reviews/analyze-diff-stream`

前端在分析过程中会按阶段展示实时进度，阶段包括：

- 拉取 GitHub PR 信息；
- 解析代码变更 Diff；
- 执行规则风险分析；
- 调用 LLM 生成 Review 建议；
- 生成 Markdown 报告；
- 分析完成。

页面上每个阶段会按顺序推进，已完成阶段会变绿，当前阶段显示 loading 状态，并展示最新分析消息。

### Focus Areas 关注方向过滤

- 支持真正多选；
- 支持“全部”一键全选 / 清空；
- 默认选中全部关注方向；
- 每个关注方向显示对应 Review finding 数量；
- “全部”显示总 finding 数量；
- 当前选择状态会显示为“已选择全部方向”“已选择 N 个方向”或“未选择方向”；
- 筛选结果为空时区分不同原因：
  - 没有生成任何 Review 建议；
  - 没有选择任何关注方向；
  - 当前选择方向没有匹配结果。

### Diff 与 Finding 联动

- Finding 点击后可定位到相关文件 Diff 预览；
- 文件 Diff 预览支持目标行高亮；
- 长 Diff 会截断展示，避免页面性能问题；
- 无 patch、二进制文件、过大 diff 或 GitHub API 未返回 patch 时，会展示可理解的空状态说明。

### 前端体验

- How It Works 独立展示页；
- 前端中文 / English 语言切换；
- 响应式 UI；
- 分析结果区、文件列表、Review Findings、Markdown 报告分区展示。

## 多输入分析方式

PRPilot 支持多种 PR 分析入口，适配不同开发场景：

1. GitHub PR URL：适合直接分析 GitHub Pull Request；
2. Raw Diff：适合无法直接访问仓库、使用其他代码托管平台，或只希望分析某段变更内容的场景；
3. Try Demo：用于无需配置 GitHub Token 或 LLM API Key 时快速体验产品能力。

这种设计让用户既可以接入真实 PR，也可以在私有仓库、受限网络或本地评估场景下完成代码变更分析。

## 技术栈与第三方依赖

本项目不是零依赖项目，使用了后端和前端框架及工具库。核心 PR 分析流程、风险规则、上下文构建、Prompt 构建、Markdown 报告生成、SSE 进度流和前端交互逻辑由本项目实现。

### 后端

- Java 17；
- Spring Boot 3.3.5；
- Spring Web；
- Spring Validation；
- Spring WebFlux WebClient；
- Jackson；
- Maven；
- Spring Boot Starter Test。

### 前端

- Next.js 15；
- React 19；
- React DOM；
- TypeScript；
- Tailwind CSS；
- lucide-react；
- Radix Slot；
- clsx；
- tailwind-merge；
- class-variance-authority；
- tailwindcss-animate；
- PostCSS。

### 模型调用

- OpenAI-compatible API；
- 默认配置为阿里云百炼 DashScope compatible mode；
- 默认模型：`qwen3-coder-plus`。

`qwen3-coder-plus` 更适合当前项目，因为 PRPilot 的核心任务是代码 diff 理解、风险判断和结构化 Review Findings 生成，而不是普通聊天问答。

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
↓
SSE Progress / Frontend Result Display
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
  "focusAreas": ["security", "testing"],
  "language": "zh"
}
```

### GitHub PR 分析

```text
POST /api/reviews/analyze-pr
```

```json
{
  "prUrl": "https://github.com/owner/repo/pull/123",
  "githubToken": "",
  "focusAreas": ["security", "bug-risk", "testing"],
  "language": "zh"
}
```

### Raw Diff SSE 流式分析

```text
POST /api/reviews/analyze-diff-stream
```

### GitHub PR SSE 流式分析

```text
POST /api/reviews/analyze-pr-stream
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
  model: qwen3-coder-plus
  temperature: 0.2
  max-tokens: 4000
```

选择 `qwen3-coder-plus` 的原因：

- 更适合代码 diff 理解；
- 更适合识别 bug risk、安全风险、测试缺失和可维护性问题；
- 比轻量聊天模型更适合生成结构化 Review Findings；
- 有利于提升 PR Review 建议的精确度。

如需切换 DeepSeek、OpenAI、Qwen Max 或其他 OpenAI-compatible 服务，只需要修改配置，不需要改业务代码。

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

## 本地运行与部署

下面命令适用于 Windows、macOS 和 Linux。需要分别启动后端和前端两个进程。

### 前置要求

- JDK 17；
- Maven 3.9.x；
- Node.js 18+；
- npm；
- 可选：DashScope / 阿里云百炼 API Key；
- 可选：GitHub Token，用于私有 PR 或 GitHub API 限流场景。

### 1. 配置模型 API Key

如果不配置 `DASHSCOPE_API_KEY`，系统仍可运行，但会降级为规则分析模式，不生成 LLM Review Findings。

Windows PowerShell：

```powershell
$env:DASHSCOPE_API_KEY="your_api_key_here"
```

Windows CMD：

```bat
set DASHSCOPE_API_KEY=your_api_key_here
```

macOS / Linux：

```bash
export DASHSCOPE_API_KEY=your_api_key_here
```

### 2. 启动后端

Windows PowerShell / CMD：

```bat
cd backend
mvn spring-boot:run
```

macOS / Linux：

```bash
cd backend
mvn spring-boot:run
```

后端默认地址：

```text
http://localhost:8080
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

### 3. 启动前端

Windows PowerShell / CMD：

```bat
cd frontend
npm install
npm run dev
```

macOS / Linux：

```bash
cd frontend
npm install
npm run dev
```

前端默认地址：

```text
http://localhost:3000
```

生产构建：

```bash
cd frontend
npm run build
npm run start
```

### 4. 使用方式

- 打开 `http://localhost:3000`；
- 可点击 Try Demo 直接体验；
- 可输入 GitHub PR URL 分析公开 PR；
- 可填写 GitHub Token 分析私有 PR 或规避 API 限流；
- 可粘贴 Raw Diff 分析任意代码变更；
- 分析过程中页面会通过 SSE 逐步展示阶段进度，完成的阶段会依次变绿。

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

`examples/demo-app` 是一个受控演示样例应用，用于构造 Demo PR。

设计原则：

- main 分支中的 demo app 保持安全基线；
- 演示风险通过单独 Demo PR 引入；
- Demo PR 保持 open，不合并；
- 不包含真实密钥；
- fake secret 必须明显标注为 fake。

## Demo PR

Demo PR: [https://github.com/Sunshine-skyy/prpilot/pull/19](https://github.com/Sunshine-skyy/prpilot/pull/19)

该 PR 仅用于 PRPilot 演示，不应合并到 `main`。

## Docker 说明

当前版本优先支持本地普通运行方式。Docker Compose 是可选增强项，当前不是核心运行方式。

如果后续补充 Docker，可以增加：

- `backend/Dockerfile`；
- `frontend/Dockerfile`；
- `docker-compose.yml`；
- Docker 本地演示说明。

## 原创功能说明

本项目围绕 AI PR Review 场景从零实现，核心原创内容包括：

- GitHub PR URL 分析链路；
- Raw Diff 分析链路；
- SSE 流式分析进度；
- 规则风险引擎；
- 风险评分和文件风险标签；
- LLM 上下文构建；
- Review Prompt 构建；
- OpenAI-compatible LLM Client；
- Markdown Review Report 生成；
- Focus Areas 多选过滤和 finding 数量统计；
- Finding 到 Diff 的定位预览；
- Try Demo 快速体验入口；
- 前端分析工作台；
- How It Works 展示页；
- 中文 / English 前端语言切换。

## 未来扩展方向

以下方向都基于当前产品流程中的实际需求，而不是泛泛而谈的功能列表。

### 1. 登录模块与仓库级历史记录

后续可以加入登录模块，让用户把同一个项目仓库作为一个长期跟踪对象。每个仓库下面可以保存多次 PR 分析记录，包括：

- PR URL；
- 分析时间；
- 使用的模型；
- 风险分数；
- finding 数量；
- 高风险 finding；
- Markdown 报告；
- 本次分析是否已处理。

这样 PRPilot 就不只是“一次性分析工具”，而可以变成按仓库跟踪 Review 风险的工具。团队可以回看某个仓库近期 PR 的风险变化，也可以对比同一个 PR 修改前后的分析结果。

### 2. 仓库文件夹视图

登录后可以按仓库组织数据，把每个仓库作为一个文件夹：

```text
Workspace
└── owner/repo
    ├── PR #12 analysis
    ├── PR #13 analysis
    └── PR #14 analysis
```

实际价值是让用户从“分析一次 PR”升级到“管理一个仓库的 Review 历史”。这对课程项目展示和真实团队协作都更有说服力。

### 3. Severity 和 confidence 过滤

当前已经支持按 Focus Areas 过滤。下一步可以增加：

- Critical / High / Medium / Low 过滤；
- confidence 阈值过滤；
- 只显示高置信度高风险问题。

实际价值是减少 AI 噪音，让 Reviewer 优先处理真正可能阻塞合并的问题。

### 4. 文件列表展示 finding 数量

当前 finding 可以跳转到对应 Diff。后续可以在文件卡片上显示：

- 该文件有几个 findings；
- 最高 severity；
- 是否已查看。

这样 Reviewer 可以按文件维度推进 Review，更接近真实代码审查习惯。

### 5. 大 PR 分块分析

真实项目中 PR 可能很大，直接把完整 diff 交给模型会带来上下文长度、成本和稳定性问题。后续可以按文件或 diff hunk 分块：

1. 先用规则引擎筛出高风险文件；
2. 对高风险文件调用 LLM 深度分析；
3. 对低风险文件只做摘要；
4. 最后合并结果生成总报告。

实际价值是提升大 PR 的分析稳定性，并降低 token 成本。

### 6. Filtered Markdown Report

当前 Copy Report 复制完整报告。后续可以增加：

- Copy Full Report；
- Copy Filtered Report。

当用户只选择 Security + Bug Risk 时，可以只导出当前筛选结果，方便发给对应负责人。

### 7. GitHub PR 评论或 Check 集成

当前结果展示在独立网页中。后续可以支持：

- 生成 PR comment；
- 创建 GitHub Check Run；
- 对高置信度 finding 生成 inline comment。

这能减少用户在 PRPilot 页面和 GitHub 页面之间来回复制的成本，让工具更贴近真实开发流程。

### 8. 模型模式选择

当前默认模型是 `qwen3-coder-plus`。后续可以在页面上提供简单模式，而不是直接暴露模型名：

- Fast：低成本快速分析；
- Deep：更强模型做深度 Review。

实际价值是让用户在速度、成本和质量之间做选择。

### 9. 团队自定义规则

不同项目关注点不同。后续可以支持仓库级配置，例如：

```yaml
prpilot:
  highRiskPaths:
    - src/auth/**
    - src/payment/**
    - config/**
  forbiddenPatterns:
    - console.log
    - TODO
```

这样团队可以把自己的 Review 规范接入 PRPilot，而不需要修改后端代码。

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

### Webpack cache warning

如果出现：

```text
[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: Unexpected end of stream
```

通常是本地 `.next/cache` 缓存文件损坏或上一次进程中断导致，不影响成功构建。可以删除 `.next/cache` 后重新运行。

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
