'use client';

import Link from 'next/link';
import { CheckCircle2, Copy, Github, Loader2, Sparkles, TerminalSquare } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { analyzePullRequest, analyzeRawDiff, fetchDemoReview } from '@/lib/api';
import { focusAreaLabels, isLanguage, labelCategory, labelFindingText, labelRiskLevel, labelRiskReason, labelRiskTag, languageNames, languageStorageKey, type Language } from '@/lib/i18n';
import type { FocusArea, ReviewAnalysisResponse, ReviewFinding } from '@/lib/types';

const focusOptions: { value: FocusArea; label: string }[] = [
  { value: 'security', label: 'Security' },
  { value: 'bug-risk', label: 'Bug Risk' },
  { value: 'performance', label: 'Performance' },
  { value: 'maintainability', label: 'Maintainability' },
  { value: 'testing', label: 'Testing' },
];

export default function DemoAnalysisPage() {
  const [analysis, setAnalysis] = useState<ReviewAnalysisResponse | null>(null);
  const [mode, setMode] = useState<'github' | 'raw'>('github');
  const [prUrl, setPrUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [rawTitle, setRawTitle] = useState('Improve auth middleware');
  const [rawDescription, setRawDescription] = useState('This patch updates authentication behavior.');
  const [rawDiff, setRawDiff] = useState('');
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(['security', 'bug-risk', 'testing']);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [activeSection, setActiveSection] = useState<'analyze' | 'results'>('analyze');
  const [language, setLanguage] = useState<Language>('zh');
  const resultsRef = useRef<HTMLElement | null>(null);
  const isZh = language === 'zh';

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(languageStorageKey);
    if (isLanguage(storedLanguage)) {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
  }, [language]);

  useEffect(() => {
    function updateActiveSection() {
      const results = document.getElementById('results');
      if (!results) return;

      const headerOffset = 140;
      const resultsTop = results.getBoundingClientRect().top;
      setActiveSection(resultsTop <= headerOffset ? 'results' : 'analyze');
    }

    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, []);

  async function run(label: string, action: () => Promise<ReviewAnalysisResponse>) {
    setLoading(label);
    setError('');
    setCopyStatus('');
    try {
      setAnalysis(await action());
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (caught) {
      setError(`${caught instanceof Error ? caught.message : 'Unknown error'}. ${isZh ? '请确认后端服务正在运行。' : 'Please make sure the backend is running.'}`);
    } finally {
      setLoading('');
    }
  }

  function toggleFocus(value: FocusArea) {
    setFocusAreas((current) => {
      if (current.length === 1 && current[0] === value) return [];
      return [value];
    });
  }

  function analyzePr() {
    if (!prUrl.trim()) {
      setError(isZh ? '请输入 GitHub Pull Request URL。' : 'Please enter a GitHub pull request URL.');
      return;
    }
    void run(isZh ? '正在分析 PR...' : 'Analyzing PR...', () => analyzePullRequest({ prUrl, githubToken, focusAreas }));
  }

  function analyzeDiff() {
    if (!rawDiff.trim()) {
      setError(isZh ? '请粘贴 Raw Diff。' : 'Please paste a raw diff.');
      return;
    }
    void run(isZh ? '正在分析 Raw Diff...' : 'Analyzing Raw Diff...', () => analyzeRawDiff({ title: rawTitle, description: rawDescription, diff: rawDiff, focusAreas }));
  }

  async function copyReport() {
    if (!analysis?.markdownReport) return;
    try {
      await navigator.clipboard.writeText(analysis.markdownReport);
      setCopyStatus(isZh ? '已复制！' : 'Copied!');
      setTimeout(() => setCopyStatus(''), 2200);
    } catch {
      setCopyStatus(isZh ? '复制失败。' : 'Copy failed.');
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_35%,#eef2ff_72%,#f8fafc_100%)] px-6 py-8 text-slate-950">
      <header className="sticky top-0 z-40 mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl">
        <Link className="text-xl font-black tracking-[-0.04em]" href="/">PRPilot</Link>
        <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 text-sm font-black text-slate-600 md:flex">
          <a className={navClass(activeSection === 'analyze')} href="#analyze" onClick={() => setActiveSection('analyze')}>{isZh ? '分析' : 'Analyze'}</a>
          <a className={navClass(activeSection === 'results')} href="#results" onClick={() => setActiveSection('results')}>{isZh ? '结果' : 'Results'}</a>
          <Link className={navClass(false)} href="/how-it-works">How It Works</Link>
        </nav>
        <LanguageToggle language={language} setLanguage={setLanguage} />
      </header>

      <section className="mx-auto grid max-w-6xl scroll-mt-32 gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]" id="analyze">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-sm font-black uppercase tracking-[0.24em] text-indigo-600 shadow-sm"><Sparkles className="h-4 w-4" /> AI Pull Request Review Assistant</p>
          <h1 className={`max-w-3xl font-black text-slate-950 ${isZh ? 'text-4xl leading-[1.22] tracking-[-0.015em] md:text-5xl md:leading-[1.18]' : 'text-5xl leading-[1.04] tracking-[-0.04em] md:text-6xl md:leading-[1.02]'}`}>{isZh ? '在人工评审前，先完成 PR 预分析。' : 'Analyze pull requests before human review.'}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{isZh ? '输入 GitHub PR URL 或粘贴 Raw Diff，快速获得变更总结、风险评分、AI Review 建议和可复制的 Markdown 报告。' : 'Paste a GitHub PR URL or raw diff to get a change summary, risk score, AI findings, and a Markdown report.'}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-xl shadow-slate-300/60 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60" disabled={Boolean(loading)} onClick={() => void run(isZh ? '正在加载 Demo...' : 'Loading Demo...', fetchDemoReview)} type="button">
              {loading === (isZh ? '正在加载 Demo...' : 'Loading Demo...') ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading === (isZh ? '正在加载 Demo...' : 'Loading Demo...') ? (isZh ? '正在加载 Demo...' : 'Loading Demo...') : (isZh ? '试用 Demo' : 'Try Demo')}
            </button>
            <Link className="rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-indigo-700" href="/how-it-works">How It Works</Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-2xl shadow-indigo-100/80 backdrop-blur-xl">
          <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-bold">
            <button className={`rounded-full px-4 py-2 ${mode === 'github' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`} onClick={() => setMode('github')} type="button">GitHub PR</button>
            <button className={`rounded-full px-4 py-2 ${mode === 'raw' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`} onClick={() => setMode('raw')} type="button">Raw Diff</button>
          </div>

          <div className="mt-6 space-y-4">
            {mode === 'github' ? (
              <>
                <Input icon={<Github className="h-4 w-4" />} label="GitHub PR URL" onChange={setPrUrl} placeholder="https://github.com/owner/repo/pull/123" value={prUrl} />
                <Input label={isZh ? 'GitHub token（可选）' : 'GitHub token (optional)'} onChange={setGithubToken} placeholder={isZh ? '私有 PR 或限流时可填写 token' : 'Optional token'} type="password" value={githubToken} />
              </>
            ) : (
              <>
                <Input label={isZh ? '标题' : 'Title'} onChange={setRawTitle} value={rawTitle} />
                <TextArea label={isZh ? '描述' : 'Description'} onChange={setRawDescription} value={rawDescription} />
                <TextArea label="Raw Diff" monospace onChange={setRawDiff} placeholder="diff --git a/src/file.ts b/src/file.ts..." rows={9} value={rawDiff} />
              </>
            )}

            <div>
              <p className="mb-3 text-sm font-black text-slate-700">{isZh ? '关注方向' : 'Focus Areas'}</p>
              <div className="flex flex-wrap gap-2">
                {focusOptions.map((option) => (
                  <button className={`rounded-full border px-3 py-2 text-xs font-black transition hover:-translate-y-0.5 ${focusAreas.includes(option.value) ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'}`} key={option.value} onClick={() => toggleFocus(option.value)} type="button">
                    {focusAreaLabels[language][option.value]}
                  </button>
                ))}
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-slate-950 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60" disabled={Boolean(loading)} onClick={mode === 'github' ? analyzePr : analyzeDiff} type="button">
              {loading && loading !== (isZh ? '正在加载 Demo...' : 'Loading Demo...') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TerminalSquare className="h-4 w-4" />}
              {loading && loading !== (isZh ? '正在加载 Demo...' : 'Loading Demo...') ? loading : mode === 'github' ? (isZh ? '分析 PR' : 'Analyze PR') : (isZh ? '分析 Raw Diff' : 'Analyze Raw Diff')}
            </button>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl scroll-mt-32 pb-16 pt-4" id="results" ref={resultsRef}>
        {analysis ? <Results analysis={analysis} copyReport={copyReport} copyStatus={copyStatus} focusAreas={focusAreas} language={language} /> : <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/75 p-10 text-center text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Sparkles className="h-5 w-5" /></div>{isZh ? '运行一次分析，或点击试用 Demo 加载完整结果。' : 'Run an analysis or click Try Demo to load results.'}</div>}
      </section>
    </main>
  );
}

function Input({ icon, label, onChange, placeholder, type = 'text', value }: { icon?: ReactNode; label: string; onChange: (value: string) => void; placeholder?: string; type?: string; value: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">{label}</span><span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">{icon ? <span className="text-slate-400">{icon}</span> : null}<input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></span></label>;
}

function TextArea({ label, monospace = false, onChange, placeholder, rows = 4, value }: { label: string; monospace?: boolean; onChange: (value: string) => void; placeholder?: string; rows?: number; value: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">{label}</span><textarea className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 ${monospace ? 'font-mono' : ''}`} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} value={value} /></label>;
}

function Results({ analysis, copyReport, copyStatus, focusAreas, language }: { analysis: ReviewAnalysisResponse; copyReport: () => void; copyStatus: string; focusAreas: FocusArea[]; language: Language }) {
  const risk = riskClass(analysis.riskAssessment.level);
  const isZh = language === 'zh';
  const changedFiles = analysis.pullRequest.changedFiles || analysis.files.length;
  const additions = analysis.pullRequest.additions;
  const deletions = analysis.pullRequest.deletions;
  const summaryReasons = analysis.riskAssessment.reasons
    .slice(0, 3)
    .map((reason) => stripEndingPunctuation(labelRiskReason(reason, language)).trim())
    .filter(Boolean);
  const localizedOverview = isZh
    ? `PRPilot 已分析 ${changedFiles} 个变更文件，共新增 ${additions} 行、删除 ${deletions} 行。本次评审识别到${labelRiskLevel(analysis.riskAssessment.level, language)}，建议优先关注${summaryReasons.length ? summaryReasons.join('、') : '核心业务逻辑和测试覆盖'}。`
    : analysis.changeSummary.overview;
  const filteredFindings = filterFindingsByFocusAreas(analysis.findings, focusAreas);
  const selectedFocusLabels = focusAreas.map((area) => focusAreaLabels[language][area]).join(isZh ? '、' : ', ');

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-indigo-600">{isZh ? '分析结果' : 'Analysis Results'}</p>
        <h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">{isZh ? '结构化 Review 输出' : 'Structured review output'}</h2>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title={isZh ? 'PR 概览' : 'PR Overview'}>
          <h2 className="text-2xl font-black">{analysis.pullRequest.title}</h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <Meta label={isZh ? '作者' : 'Author'} value={analysis.pullRequest.author} />
            <Meta label={isZh ? '状态' : 'State'} value={analysis.pullRequest.state} />
            <Meta label={isZh ? '目标分支' : 'Base'} value={analysis.pullRequest.baseBranch} />
            <Meta label={isZh ? '来源分支' : 'Head'} value={analysis.pullRequest.headBranch} />
            <Meta label={isZh ? '文件数' : 'Files'} value={String(changedFiles)} />
            <Meta label={isZh ? '行数' : 'Lines'} value={`+${additions} / -${deletions}`} />
          </div>
        </Card>

        <Card title={isZh ? '风险评估' : 'Risk Assessment'}>
          <div className={`rounded-3xl border p-5 ${risk.panel}`}>
            <p className="text-5xl font-black">{analysis.riskAssessment.score}<span className="text-xl">/100</span></p>
            <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-black ${risk.badge}`}>{labelRiskLevel(analysis.riskAssessment.level, language)}</p>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {analysis.riskAssessment.reasons.map((reason) => <li className="flex gap-2" key={reason}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{labelRiskReason(reason, language)}</li>)}
          </ul>
        </Card>
      </section>

      <Card title={isZh ? '变更总结' : 'Change Summary'}>
        <p className="leading-8 text-slate-600">{localizedOverview}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {analysis.changeSummary.keyChanges.map((item) => <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700" key={item}>{labelFindingText(item, language)}</div>)}
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card title={isZh ? '变更文件' : 'Changed Files'}>
          <div className="space-y-4">
            {analysis.files.map((file) => <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg" key={file.filename}><p className="break-all font-bold">{file.filename}</p><p className="mt-1 text-sm text-slate-500">{file.status} · +{file.additions} / -{file.deletions}</p><div className="mt-3 flex flex-wrap gap-2">{file.riskTags.map((tag) => <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700" key={tag}>{labelRiskTag(tag, language)}</span>)}</div></div>)}
          </div>
        </Card>

        <Card title={isZh ? 'Review 建议' : 'Review Findings'}>
          <div className="space-y-4">
            {filteredFindings.length === 0 ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{selectedFocusLabels ? (isZh ? `当前关注方向（${selectedFocusLabels}）下没有发现对应的 Review 建议。` : `No review findings matched the selected focus areas (${selectedFocusLabels}).`) : (isZh ? '未选择关注方向。请选择至少一个方向后查看对应建议。' : 'No focus area selected. Select at least one focus area to view matching findings.')}</p> : filteredFindings.map((finding) => <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl" key={`${finding.file}-${finding.title}`}><div className="border-b border-slate-100 bg-slate-50 px-4 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(finding.severity)}`}>{labelRiskLevel(finding.severity, language)}</span><span className="ml-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{labelCategory(finding.category, language)}</span></div><div className="p-4"><h3 className="font-black">{localizedFindingText(finding, 'title', language)}</h3><p className="mt-1 break-all font-mono text-xs font-semibold text-slate-500">{finding.line ? `${finding.file}:${finding.line}` : finding.file}</p><p className="mt-3 text-sm leading-6 text-slate-600">{localizedFindingText(finding, 'description', language)}</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>{isZh ? '建议' : 'Suggestion'}:</b> {localizedFindingText(finding, 'suggestion', language)}</p></div></article>)}
          </div>
        </Card>
      </section>

      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/50 transition hover:-translate-y-1">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">{isZh ? 'Markdown 报告' : 'Markdown Report'}</h2>
          <button className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${copyStatus === (isZh ? '已复制！' : 'Copied!') ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-slate-950'}`} onClick={copyReport} type="button">{copyStatus === (isZh ? '已复制！' : 'Copied!') ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copyStatus || (isZh ? '复制报告' : 'Copy Report')}</button>
        </div>
        <pre className="mt-6 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm leading-7">{analysis.markdownReport}</pre>
      </section>
    </div>
  );
}

function localizedFindingText(finding: ReviewFinding, field: 'title' | 'description' | 'suggestion', language: Language) {
  if (language === 'en') return finding[field];
  const zhField = `${field}Zh` as 'titleZh' | 'descriptionZh' | 'suggestionZh';
  return finding[zhField] || labelFindingText(finding[field], language);
}

function stripEndingPunctuation(value: string) {
  return value.replace(/[。.!！？?]+$/u, '');
}

function focusAreaMatchesCategory(area: FocusArea, category: string) {
  const normalized = category.toLowerCase();
  return area === 'bug-risk' ? normalized === 'bug risk' : normalized === area;
}

function filterFindingsByFocusAreas(findings: ReviewFinding[], focusAreas: FocusArea[]) {
  if (focusAreas.length === 0) return [];
  return findings.filter((finding) => focusAreas.some((area) => focusAreaMatchesCategory(area, finding.category)));
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

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 break-all font-bold text-slate-700">{value || '-'}</p></div>;
}

function navClass(active: boolean) {
  return `rounded-full px-4 py-2 transition ${active ? 'bg-slate-950 text-white shadow' : 'hover:bg-white hover:text-indigo-700'}`;
}

function severityClass(level: string) {
  const normalized = level.toLowerCase();
  if (normalized.includes('critical')) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (normalized.includes('high')) return 'border-orange-200 bg-orange-50 text-orange-700';
  if (normalized.includes('low')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function riskClass(level: string) {
  const normalized = level.toLowerCase();
  if (normalized.includes('critical')) return { panel: 'border-rose-200 bg-rose-50 text-rose-700', badge: 'border-rose-200 bg-white text-rose-700' };
  if (normalized.includes('high')) return { panel: 'border-orange-200 bg-orange-50 text-orange-700', badge: 'border-orange-200 bg-white text-orange-700' };
  if (normalized.includes('low')) return { panel: 'border-emerald-200 bg-emerald-50 text-emerald-700', badge: 'border-emerald-200 bg-white text-emerald-700' };
  return { panel: 'border-amber-200 bg-amber-50 text-amber-700', badge: 'border-amber-200 bg-white text-amber-700' };
}

function Card({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl"><p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>{children}</section>;
}
