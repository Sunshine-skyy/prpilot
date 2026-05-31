'use client';

import Link from 'next/link';
import { ArrowLeft, BrainCircuit, FileSearch, GitPullRequestArrow, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isLanguage, languageNames, languageStorageKey, type Language } from '@/lib/i18n';

const steps = {
  zh: [
    ['01', 'GitHub PR URL / Raw Diff', '用户可以直接分析 GitHub PR，也可以粘贴 Raw Diff 来评审来自不同代码托管平台或本地环境的变更。'],
    ['02', 'Diff 获取', 'PRPilot 通过 GitHub API 或 Raw Diff 输入收集 PR 元数据、变更文件、增删行和 patch。'],
    ['03', '规则风险扫描', '确定性规则引擎识别安全、测试、配置、认证、日志和校验相关风险信号。'],
    ['04', '上下文构建', '后端根据关注方向和规则证据，为模型构造紧凑的结构化上下文。'],
    ['05', 'LLM Review Agent', 'OpenAI-compatible 客户端调用已配置模型，生成基于证据的结构化 Review 建议。'],
    ['06', 'Markdown 报告', '最终结果包含 PR 总结、风险评估、Review 建议、变更文件和可复制的 Markdown 报告。'],
  ],
  en: [
    ['01', 'GitHub PR URL / Raw Diff', 'Users can analyze a GitHub pull request directly or paste a raw diff from another code hosting platform or local environment.'],
    ['02', 'Diff Fetcher', 'PRPilot collects PR metadata, changed files, additions, deletions, and patches through GitHub API or raw input.'],
    ['03', 'Rule-based Risk Scan', 'A deterministic rule engine identifies security, testing, config, auth, logging, and validation risk signals.'],
    ['04', 'Context Builder', 'The backend builds compact structured context for the model with focus areas and evidence-backed risk hints.'],
    ['05', 'LLM Review Agent', 'An OpenAI-compatible client calls the configured model and asks for structured, evidence-based review findings.'],
    ['06', 'Markdown Report', 'The final response contains PR summary, risk assessment, findings, changed files, and a copyable Markdown report.'],
  ],
};

const cards = {
  zh: [
    ['模型策略', '通过 OpenAI-compatible 集成保持默认使用 DashScope qwen-turbo，同时未来切换模型供应商只需要改配置。', BrainCircuit],
    ['风险分析', '规则信号覆盖大规模 diff、缺少测试、认证变更、配置关键字、TODO/FIXME、调试日志、空 catch 和删除校验逻辑。', ShieldCheck],
    ['上下文策略', 'PRPilot 将噪声较大的 diff 压缩为结构化上下文，包括 PR 元数据、变更文件、patch、关注方向和规则证据。', FileSearch],
    ['误报控制', 'Prompt 要求模型只报告有证据支撑的问题，在证据不足时降低置信度，并避免无关的高危结论。', Sparkles],
    ['多输入分析', 'GitHub PR URL 适合直接分析 Pull Request，Raw Diff 适合跨平台、私有仓库或本地 diff 场景，Try Demo 则用于无需配置即可快速体验产品能力。', Workflow],
    ['未来扩展', '后续可以扩展 GitHub App、inline comments、团队规则、AST 分析、缓存，以及 GitLab / Gitee 支持。', GitPullRequestArrow],
  ],
  en: [
    ['Model Strategy', 'OpenAI-compatible integration keeps DashScope qwen-turbo as the default while allowing future provider changes through configuration only.', BrainCircuit],
    ['Risk Analysis', 'Rule-based signals catch large diffs, missing tests, auth changes, config keywords, TODO/FIXME, debug logs, empty catch blocks, and removed validation.', ShieldCheck],
    ['Context Strategy', 'PRPilot reduces noisy diffs into structured context: PR metadata, changed files, patches, focus areas, and rule evidence.', FileSearch],
    ['False Positive Control', 'Prompts ask the model to report only evidence-backed findings, lower confidence when evidence is weak, and avoid unrelated high-severity comments.', Sparkles],
    ['Flexible Inputs', 'GitHub PR URL works for direct pull request analysis, Raw Diff supports cross-platform or local diff review, and Try Demo helps users quickly explore the product without setup.', Workflow],
    ['Future Extensions', 'Potential extensions include GitHub App integration, inline comments, team rules, AST analysis, caching, and GitLab or Gitee support.', GitPullRequestArrow],
  ],
};

export default function HowItWorksPage() {
  const [language, setLanguage] = useState<Language>('zh');
  const isZh = language === 'zh';

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    if (isLanguage(storedLanguage)) setLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
  }, [language]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_35%,#eef2ff_72%,#f8fafc_100%)] px-6 py-8 text-slate-950">
      <header className="sticky top-0 z-40 mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl">
        <Link className="text-xl font-black tracking-[-0.04em]" href="/">PRPilot</Link>
        <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 text-sm font-black text-slate-600 md:flex">
          <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-indigo-700" href="/#analyze">{isZh ? '分析' : 'Analyze'}</Link>
          <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-indigo-700" href="/#results">{isZh ? '结果' : 'Results'}</Link>
          <span className="rounded-full bg-slate-950 px-4 py-2 text-white shadow">How It Works</span>
        </nav>
        <LanguageToggle language={language} setLanguage={setLanguage} />
      </header>

      <section className="mx-auto max-w-6xl py-14">
        <Link className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-indigo-700" href="/">
          <ArrowLeft className="h-4 w-4" /> {isZh ? '返回分析页' : 'Back to Analyze'}
        </Link>
        <p className="mt-10 text-sm font-black uppercase tracking-[0.24em] text-indigo-600">How It Works</p>
        <h1 className={`mt-4 max-w-4xl font-black text-slate-950 ${isZh ? 'text-4xl leading-[1.22] tracking-[-0.015em] md:text-5xl md:leading-[1.18]' : 'text-5xl leading-[1.04] tracking-[-0.04em] md:text-6xl md:leading-[1.02]'}`}>{isZh ? '从 PR 输入，到结构化评审报告。' : 'From pull request input to structured review report.'}</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">{isZh ? 'PRPilot 将确定性的风险规则扫描与 LLM Review 建议结合起来。它不是替代人工评审，而是在人工 Review 前准备更清晰、更安全的上下文。' : 'PRPilot combines deterministic risk scanning with LLM-based review suggestions. The goal is not to replace human reviewers, but to prepare a clearer and safer review context before human review starts.'}</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 pb-10 md:grid-cols-2 lg:grid-cols-3">
        {steps[language].map(([number, title, text]) => (
          <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl" key={title}>
            <span className="text-sm font-black text-indigo-600">{isZh ? `步骤 ${number}` : `Step ${number}`}</span>
            <h2 className="mt-3 text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 pb-20 md:grid-cols-2 lg:grid-cols-3">
        {cards[language].map(([title, text, Icon]) => (
          <article className="rounded-3xl border border-slate-100 bg-white/80 p-6 shadow-lg shadow-slate-200/60 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl" key={title as string}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
            <h2 className="mt-5 text-xl font-black">{title as string}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text as string}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function LanguageToggle({ language, setLanguage }: { language: Language; setLanguage: (language: Language) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-xs font-black text-slate-600">
      {(['zh', 'en'] as Language[]).map((item) => (
        <button className={`rounded-full px-3 py-2 transition ${language === item ? 'bg-slate-950 text-white shadow' : 'hover:bg-white hover:text-indigo-700'}`} key={item} onClick={() => setLanguage(item)} type="button">
          {languageNames[item]}
        </button>
      ))}
    </div>
  );
}
