'use client';

import Link from 'next/link';
import { CheckCircle2, Copy, Github, Loader2, Sparkles, TerminalSquare } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fetchDemoReview, streamPullRequestAnalysis, streamRawDiffAnalysis } from '@/lib/api';
import { focusAreaLabels, isLanguage, labelCategory, labelFindingText, labelRiskLevel, labelRiskReason, labelRiskTag, languageNames, languageStorageKey, type Language } from '@/lib/i18n';
import type { AnalysisStreamStage, FileChange, FocusArea, ReviewAnalysisResponse, ReviewAnalysisStreamEvent, ReviewFinding } from '@/lib/types';

const focusOptions: { value: FocusArea; label: string }[] = [
  { value: 'security', label: 'Security' },
  { value: 'bug-risk', label: 'Bug Risk' },
  { value: 'performance', label: 'Performance' },
  { value: 'maintainability', label: 'Maintainability' },
  { value: 'testing', label: 'Testing' },
];
const allFocusAreas = focusOptions.map((option) => option.value);

const analysisStageOrder: AnalysisStreamStage[] = ['fetching_pr', 'parsing_diff', 'running_rules', 'calling_llm', 'generating_report', 'completed'];
const rawDiffStageOrder: AnalysisStreamStage[] = ['parsing_diff', 'running_rules', 'calling_llm', 'generating_report', 'completed'];

export default function DemoAnalysisPage() {
  const [analysis, setAnalysis] = useState<ReviewAnalysisResponse | null>(null);
  const [mode, setMode] = useState<'github' | 'raw'>('github');
  const [prUrl, setPrUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [rawTitle, setRawTitle] = useState('Improve auth middleware');
  const [rawDescription, setRawDescription] = useState('This patch updates authentication behavior.');
  const [rawDiff, setRawDiff] = useState('');
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>(() => [...allFocusAreas]);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [streamEvents, setStreamEvents] = useState<ReviewAnalysisStreamEvent[]>([]);
  const streamEventDelayRef = useRef(Promise.resolve());
  const [activeStreamStages, setActiveStreamStages] = useState<AnalysisStreamStage[]>([]);
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
    setStreamEvents([]);
    setActiveStreamStages([]);
    try {
      setAnalysis(await action());
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (caught) {
      setError(`${caught instanceof Error ? caught.message : 'Unknown error'}. ${isZh ? '请确认后端服务正在运行。' : 'Please make sure the backend is running.'}`);
    } finally {
      setLoading('');
    }
  }

  async function appendStreamEvent(event: ReviewAnalysisStreamEvent) {
    streamEventDelayRef.current = streamEventDelayRef.current.then(async () => {
      setStreamEvents((current) => [...current, event]);
      if (event.status === 'progress') {
        await delay(400);
      }
    });
    await streamEventDelayRef.current;
  }

  async function runStream(label: string, stages: AnalysisStreamStage[], action: (onEvent: (event: ReviewAnalysisStreamEvent) => void | Promise<void>) => Promise<ReviewAnalysisResponse>) {
    setLoading(label);
    setError('');
    setCopyStatus('');
    setAnalysis(null);
    setActiveStreamStages(stages);
    setStreamEvents([]);
    try {
      streamEventDelayRef.current = Promise.resolve();
      const result = await action(appendStreamEvent);
      setAnalysis(result);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (caught) {
      setError(`${caught instanceof Error ? caught.message : 'Unknown error'}. ${isZh ? '请确认后端服务正在运行。' : 'Please make sure the backend is running.'}`);
    } finally {
      setLoading('');
    }
  }

  function toggleFocus(value: FocusArea) {
    setFocusAreas((current) => current.includes(value)
      ? current.filter((area) => area !== value)
      : allFocusAreas.filter((area) => area === value || current.includes(area)));
  }

  function toggleAllFocusAreas() {
    setFocusAreas((current) => current.length === allFocusAreas.length ? [] : allFocusAreas);
  }

  function analyzePr() {
    if (!prUrl.trim()) {
      setError(isZh ? '请输入 GitHub Pull Request URL。' : 'Please enter a GitHub pull request URL.');
      return;
    }
    void runStream(isZh ? '正在分析 PR...' : 'Analyzing PR...', analysisStageOrder, (onEvent) => streamPullRequestAnalysis({ prUrl, githubToken, focusAreas, language }, onEvent));
  }

  function analyzeDiff() {
    if (!rawDiff.trim()) {
      setError(isZh ? '请粘贴 Raw Diff。' : 'Please paste a raw diff.');
      return;
    }
    void runStream(isZh ? '正在分析 Raw Diff...' : 'Analyzing Raw Diff...', rawDiffStageOrder, (onEvent) => streamRawDiffAnalysis({ title: rawTitle, description: rawDescription, diff: rawDiff, focusAreas, language }, onEvent));
  }

  async function copyReport() {
    if (!analysis?.markdownReport) return;
    try {
      await navigator.clipboard.writeText(buildDisplayMarkdownReport(analysis, language));
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

            <FocusAreaSelector analysis={analysis} focusAreas={focusAreas} language={language} onToggleAll={toggleAllFocusAreas} onToggleFocus={toggleFocus} />

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-slate-950 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60" disabled={Boolean(loading)} onClick={mode === 'github' ? analyzePr : analyzeDiff} type="button">
              {loading && loading !== (isZh ? '正在加载 Demo...' : 'Loading Demo...') ? <Loader2 className="h-4 w-4 animate-spin" /> : <TerminalSquare className="h-4 w-4" />}
              {loading && loading !== (isZh ? '正在加载 Demo...' : 'Loading Demo...') ? loading : mode === 'github' ? (isZh ? '分析 PR' : 'Analyze PR') : (isZh ? '分析 Raw Diff' : 'Analyze Raw Diff')}
            </button>
          </div>

          {loading && activeStreamStages.length ? <AnalysisProgress events={streamEvents} language={language} stages={activeStreamStages} /> : null}
          {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl scroll-mt-32 pb-16 pt-4" id="results" ref={resultsRef}>
        {analysis ? <Results analysis={analysis} copyReport={copyReport} copyStatus={copyStatus} focusAreas={focusAreas} language={language} /> : <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/75 p-10 text-center text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Sparkles className="h-5 w-5" /></div>{isZh ? '运行一次分析，或点击试用 Demo 加载完整结果。' : 'Run an analysis or click Try Demo to load results.'}</div>}
      </section>
    </main>
  );
}

function AnalysisProgress({ events, language, stages }: { events: ReviewAnalysisStreamEvent[]; language: Language; stages: AnalysisStreamStage[] }) {
  const latestEvent = events.at(-1);
  const latestStageIndex = latestEvent ? stages.indexOf(latestEvent.stage as AnalysisStreamStage) : -1;

  return (
    <div className="mt-5 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-4">
      <div className="flex items-center gap-2 text-sm font-black text-indigo-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        {language === 'zh' ? '实时分析进度' : 'Live analysis progress'}
      </div>
      <div className="mt-4 space-y-3">
        {stages.map((stage, index) => {
          const isCompleted = latestStageIndex > index;
          const isActive = latestEvent?.stage === stage && latestEvent.status === 'progress';
          return (
            <div className="flex items-center gap-3 text-sm" key={stage}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${isCompleted ? 'border-emerald-200 bg-emerald-500 text-white' : isActive ? 'border-indigo-200 bg-white text-indigo-600' : 'border-slate-200 bg-white text-slate-300'}`}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-current" />}
              </span>
              <span className={`font-bold ${isCompleted || isActive ? 'text-slate-800' : 'text-slate-400'}`}>{labelAnalysisStage(stage, language)}</span>
            </div>
          );
        })}
      </div>
      {latestEvent?.message ? <p className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-semibold text-slate-600">{localizeStreamMessage(latestEvent, language)}</p> : null}
    </div>
  );
}
function Input({ icon, label, onChange, placeholder, type = 'text', value }: { icon?: ReactNode; label: string; onChange: (value: string) => void; placeholder?: string; type?: string; value: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-slate-700">{label}</span><span className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50">{icon ? <span className="text-slate-400">{icon}</span> : null}<input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></span></label>;
}

function FocusAreaSelector({ analysis, focusAreas, language, onToggleAll, onToggleFocus }: { analysis: ReviewAnalysisResponse | null; focusAreas: FocusArea[]; language: Language; onToggleAll: () => void; onToggleFocus: (value: FocusArea) => void }) {
  const isZh = language === 'zh';
  const allSelected = focusAreas.length === allFocusAreas.length;
  const findingCounts = getFocusAreaFindingCounts(analysis?.findings ?? []);
  const totalFindings = analysis?.findings.length ?? 0;
  const selectedCount = focusAreas.length;
  const helperText = isZh
    ? allSelected ? '已选择全部方向' : selectedCount ? `已选择 ${selectedCount} 个方向` : '未选择方向，结果列表将为空'
    : allSelected ? 'All focus areas selected' : selectedCount ? `${selectedCount} focus area${selectedCount === 1 ? '' : 's'} selected` : 'No focus area selected, so findings will be hidden';

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-700">{isZh ? '关注方向' : 'Focus Areas'}</p>
        <p className="text-xs font-bold text-slate-400">{helperText}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={`rounded-full border px-3 py-2 text-xs font-black transition hover:-translate-y-0.5 ${allSelected ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-200' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'}`} onClick={onToggleAll} type="button">
          {isZh ? '全部' : 'All'} <CountBadge count={totalFindings} selected={allSelected} />
        </button>
        {focusOptions.map((option) => {
          const selected = focusAreas.includes(option.value);
          return (
            <button className={`rounded-full border px-3 py-2 text-xs font-black transition hover:-translate-y-0.5 ${selected ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'}`} key={option.value} onClick={() => onToggleFocus(option.value)} type="button">
              {focusAreaLabels[language][option.value]} <CountBadge count={findingCounts[option.value]} selected={selected} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CountBadge({ count, selected }: { count: number; selected: boolean }) {
  return <span className={`ml-1 rounded-full px-1.5 py-0.5 ${selected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>;
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
  const displayMarkdownReport = buildDisplayMarkdownReport(analysis, language);
  const findingsEmptyMessage = getFindingsEmptyMessage({ analysis, focusAreas, language, selectedFocusLabels });
  const [selectedFile, setSelectedFile] = useState<FileChange | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<ReviewFinding | null>(null);

  function openFileDiff(file: FileChange, finding: ReviewFinding | null = null) {
    setSelectedFile(file);
    setSelectedFinding(finding);
  }

  function openFindingDiff(finding: ReviewFinding) {
    const matchedFile = findFileForFinding(analysis.files, finding);
    if (matchedFile) {
      openFileDiff(matchedFile, finding);
    }
  }

  function closeDiffModal() {
    setSelectedFile(null);
    setSelectedFinding(null);
  }

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
          <div className="max-h-[28rem] space-y-4 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]">
            {analysis.files.map((file) => <button className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100" key={file.filename} onClick={() => openFileDiff(file)} type="button"><p className="break-all font-bold">{file.filename}</p><p className="mt-1 text-sm text-slate-500">{file.status} · +{file.additions} / -{file.deletions}</p><div className="mt-3 flex flex-wrap gap-2">{file.riskTags.map((tag) => <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700" key={tag}>{labelRiskTag(tag, language)}</span>)}</div><p className="mt-3 text-xs font-bold text-indigo-600">{isZh ? '点击查看 Diff 预览' : 'Click to preview diff'}</p></button>)}
          </div>
        </Card>

        <Card title={isZh ? 'Review 建议' : 'Review Findings'}>
          <div className="max-h-[28rem] space-y-4 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]">
            {filteredFindings.length === 0 ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{findingsEmptyMessage}</p> : filteredFindings.map((finding) => {
              const matchedFile = findFileForFinding(analysis.files, finding);
              return <button className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70" disabled={!matchedFile} key={`${finding.file}-${finding.title}`} onClick={() => openFindingDiff(finding)} type="button"><div className="border-b border-slate-100 bg-slate-50 px-4 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(finding.severity)}`}>{labelRiskLevel(finding.severity, language)}</span><span className="ml-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{labelCategory(finding.category, language)}</span></div><div className="p-4"><h3 className="font-black">{localizedFindingText(finding, 'title', language)}</h3><p className="mt-1 break-all font-mono text-xs font-semibold text-slate-500">{finding.line ? `${finding.file}:${finding.line}` : finding.file}</p><p className="mt-3 text-sm leading-6 text-slate-600">{localizedFindingText(finding, 'description', language)}</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>{isZh ? '建议' : 'Suggestion'}:</b> {localizedFindingText(finding, 'suggestion', language)}</p><p className="mt-3 text-xs font-black text-indigo-600">{matchedFile ? (isZh ? '点击查看相关 Diff' : 'Click to open related diff') : (isZh ? '未找到相关 Diff' : 'No matching file diff found')}</p></div></button>;
            })}
          </div>
        </Card>
      </section>

      <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/50 transition hover:-translate-y-1">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">{isZh ? 'Markdown 报告' : 'Markdown Report'}</h2>
          <button className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${copyStatus === (isZh ? '已复制！' : 'Copied!') ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-slate-950'}`} onClick={copyReport} type="button">{copyStatus === (isZh ? '已复制！' : 'Copied!') ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copyStatus || (isZh ? '复制报告' : 'Copy Report')}</button>
        </div>
        <pre className="mt-6 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm leading-7">{displayMarkdownReport}</pre>
      </section>
      {selectedFile ? <FileDiffModal file={selectedFile} finding={selectedFinding} language={language} onClose={closeDiffModal} /> : null}
    </div>
  );
}

function FileDiffModal({ file, finding, language, onClose }: { file: FileChange; finding: ReviewFinding | null; language: Language; onClose: () => void }) {
  const isZh = language === 'zh';
  const lines = file.patch ? file.patch.split('\n') : [];
  const targetLineIndex = findDiffLineIndex(lines, finding?.line ?? null);
  const visibleLines = lines.slice(0, 400);
  const isTruncated = lines.length > visibleLines.length;

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose} role="dialog">
      <section className="flex max-h-[86vh] w-[min(96vw,72rem)] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl shadow-slate-950/30" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 bg-slate-50/90 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">{isZh ? '文件 Diff 预览' : 'File Diff Preview'}</p>
              <h3 className="mt-2 break-all text-xl font-black text-slate-950">{file.filename}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">{file.status} · +{file.additions} / -{file.deletions}</p>
            </div>
            <button className="rounded-full bg-slate-950 px-5 py-2 text-sm font-black text-white transition hover:bg-indigo-700" onClick={onClose} type="button">{isZh ? '关闭' : 'Close'}</button>
          </div>
          {file.riskTags.length ? <div className="mt-4 flex flex-wrap gap-2">{file.riskTags.map((tag) => <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700" key={tag}>{labelRiskTag(tag, language)}</span>)}</div> : null}
          {finding ? <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-4 text-sm text-slate-700"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">{isZh ? '来源 Review 建议' : 'Source review finding'}</p><p className="mt-2 font-black text-slate-950">{localizedFindingText(finding, 'title', language)}</p><p className="mt-1 break-all font-mono text-xs font-semibold text-slate-500">{finding.line ? `${finding.file}:${finding.line}` : finding.file}</p><p className="mt-2 leading-6">{localizedFindingText(finding, 'description', language)}</p></div> : null}
        </div>

        <div className="overflow-y-auto bg-slate-950 p-4 [scrollbar-gutter:stable]">
          {visibleLines.length ? (
            <pre className="min-w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 py-3 text-xs leading-6 text-slate-200">
              {visibleLines.map((line, index) => <DiffLine highlight={index === targetLineIndex} key={`${index}-${line}`} line={line} />)}
            </pre>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm leading-7 text-slate-300">
              <p className="font-bold text-white">{isZh ? '该文件没有可展示的 diff。' : 'No displayable diff is available for this file.'}</p>
              <p className="mt-2">{isZh ? '这可能是因为文件为二进制、diff 过大、仅重命名，或 GitHub API 未返回 patch。' : 'This can happen for binary files, very large diffs, renames, or files omitted by the GitHub API.'}</p>
            </div>
          )}
          {isTruncated ? <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{isZh ? '当前仅显示前 400 行。为保证页面性能，Diff 预览已截断。' : 'Showing the first 400 lines. The diff preview was truncated for performance.'}</p> : null}
        </div>
      </section>
    </div>
  );
}

function DiffLine({ highlight, line }: { highlight?: boolean; line: string }) {
  const lineClass = diffLineClass(line);
  return <code className={`block whitespace-pre px-4 font-mono [font-family:Consolas,'Cascadia_Mono','Microsoft_YaHei_Mono','Microsoft_YaHei','SimSun',monospace] ${highlight ? 'ring-2 ring-amber-300 bg-amber-400/20 text-amber-100' : lineClass}`}>{line || ' '}</code>;
}

function diffLineClass(line: string) {
  if (line.startsWith('+') && !line.startsWith('+++')) return 'bg-emerald-950/60 text-emerald-200';
  if (line.startsWith('-') && !line.startsWith('---')) return 'bg-rose-950/60 text-rose-200';
  if (line.startsWith('@@')) return 'bg-indigo-950/80 text-indigo-200';
  if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('---') || line.startsWith('+++')) return 'bg-slate-800/80 text-slate-400';
  return 'text-slate-300';
}

function buildDisplayMarkdownReport(analysis: ReviewAnalysisResponse, language: Language) {
  const isZh = language === 'zh';
  const report = analysis.markdownReport || '';
  if (isZh && report.startsWith('## PRPilot 评审报告')) return report;
  if (!isZh && report.startsWith('## PRPilot Review Report')) return report;

  return isZh ? buildChineseMarkdownReport(analysis) : buildEnglishMarkdownReport(analysis);
}

function buildEnglishMarkdownReport(analysis: ReviewAnalysisResponse) {
  const { pullRequest, changeSummary, riskAssessment, files, findings } = analysis;
  const lines = [
    '## PRPilot Review Report',
    '',
    '### PR Summary',
    `- Title: ${pullRequest.title}`,
    `- Source: ${pullRequest.url}`,
    `- Changed files: ${pullRequest.changedFiles}`,
    `- Additions/Deletions: +${pullRequest.additions} / -${pullRequest.deletions}`,
    '',
    '### Risk Assessment',
    `- Score: ${riskAssessment.score} / 100`,
    `- Level: ${riskAssessment.level}`,
    ...riskAssessment.reasons.map((reason) => `- ${reason}`),
    '',
    '### Key Changes',
    changeSummary.overview,
    ...changeSummary.keyChanges.map((item) => `- ${item}`),
    '',
    '### Changed Files',
    ...files.map((file) => `- \`${file.filename}\` (+${file.additions} / -${file.deletions})${file.riskTags.length ? ` — risk tags: ${file.riskTags.join(', ')}` : ''}`),
    '',
    '### Review Findings',
    ...(findings.length ? findings.map((finding) => `- [${finding.severity}] ${finding.title} (\`${finding.file}\`)`) : ['- No AI review findings were generated.']),
    '',
    '### Suggested Next Steps',
    ...(riskAssessment.reasons.length ? ['- Review files marked with risk tags before merging.', '- Add or update focused tests for risky behavior.', '- Use the LLM analysis flow for detailed code review findings.'] : ['- Continue with normal human review.']),
  ];
  return `${lines.join('\n')}\n`;
}

function buildChineseMarkdownReport(analysis: ReviewAnalysisResponse) {
  const { pullRequest, changeSummary, riskAssessment, files, findings } = analysis;
  const lines = [
    '## PRPilot 评审报告',
    '',
    '### PR 概览',
    `- 标题：${pullRequest.title}`,
    `- 来源：${pullRequest.url}`,
    `- 变更文件数：${pullRequest.changedFiles}`,
    `- 新增/删除行数：+${pullRequest.additions} / -${pullRequest.deletions}`,
    '',
    '### 风险评估',
    `- 分数：${riskAssessment.score} / 100`,
    `- 等级：${labelRiskLevel(riskAssessment.level, 'zh')}`,
    ...riskAssessment.reasons.map((reason) => `- ${labelRiskReason(reason, 'zh')}`),
    '',
    '### 关键变更',
    labelFindingText(changeSummary.overview, 'zh'),
    ...changeSummary.keyChanges.map((item) => `- ${labelFindingText(item, 'zh')}`),
    '',
    '### 变更文件',
    ...files.map((file) => `- \`${file.filename}\` (+${file.additions} / -${file.deletions})${file.riskTags.length ? ` — 风险标签：${file.riskTags.map((tag) => labelRiskTag(tag, 'zh')).join('、')}` : ''}`),
    '',
    '### Review 建议',
    ...(findings.length ? findings.map((finding) => `- [${labelRiskLevel(finding.severity, 'zh')}] ${localizedFindingText(finding, 'title', 'zh')} (\`${finding.file}\`)`) : ['- 当前没有生成 AI Review 建议。']),
    '',
    '### 建议下一步',
    ...(riskAssessment.reasons.length ? ['- 合并前优先检查带风险标签的文件。', '- 针对高风险行为补充或更新测试。', '- 结合 LLM 生成的 Review 建议做进一步代码审查。'] : ['- 继续进行常规人工 Review。']),
  ];
  return `${lines.join('\n')}\n`;
}

function labelAnalysisStage(stage: string, language: Language) {
  const labels: Record<string, { zh: string; en: string }> = {
    fetching_pr: { zh: '拉取 GitHub PR 信息', en: 'Fetch GitHub PR data' },
    parsing_diff: { zh: '解析代码变更 Diff', en: 'Parse changed files' },
    running_rules: { zh: '执行规则风险分析', en: 'Run risk rules' },
    calling_llm: { zh: '调用 LLM 生成 Review 建议', en: 'Generate AI review findings' },
    generating_report: { zh: '生成 Markdown 报告', en: 'Generate Markdown report' },
    completed: { zh: '分析完成', en: 'Analysis completed' },
  };
  return labels[stage]?.[language] ?? stage;
}

function localizeStreamMessage(event: ReviewAnalysisStreamEvent, language: Language) {
  if (language === 'en') return event.message;
  const messages: Record<string, string> = {
    fetching_pr: '正在从 GitHub 拉取 PR 元信息和变更文件。',
    parsing_diff: '正在解析 Diff，并准备待分析的变更文件。',
    running_rules: '正在运行确定性的风险规则，识别高风险文件和信号。',
    calling_llm: event.message.includes('not configured') ? '当前未配置 LLM，已跳过 AI Review 建议生成。' : '正在调用已配置的 LLM 生成 Review 建议。',
    generating_report: '正在生成可复制的 Markdown Review 报告。',
    completed: '分析完成，正在展示结构化结果。',
    error: event.message || '分析失败。',
  };
  return messages[event.stage] ?? event.message;
}

function findFileForFinding(files: FileChange[], finding: ReviewFinding) {
  return files.find((file) => normalizePath(file.filename) === normalizePath(finding.file))
    ?? files.find((file) => normalizePath(file.filename).endsWith(normalizePath(finding.file)) || normalizePath(finding.file).endsWith(normalizePath(file.filename)))
    ?? null;
}

function normalizePath(value: string) {
  return value.replace(/^\/?[ab]\//, '').replace(/\\/g, '/').toLowerCase();
}

function findDiffLineIndex(lines: string[], targetLine: number | null) {
  if (!targetLine) return -1;
  let newLineNumber = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const hunkMatch = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunkMatch) {
      newLineNumber = Number(hunkMatch[1]);
      continue;
    }
    if (line.startsWith('-') && !line.startsWith('---')) {
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      if (newLineNumber === targetLine) return index;
      newLineNumber += 1;
      continue;
    }
    if (!line.startsWith('diff --git') && !line.startsWith('index ') && !line.startsWith('---') && !line.startsWith('+++')) {
      if (newLineNumber === targetLine) return index;
      newLineNumber += 1;
    }
  }
  return -1;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

function getFocusAreaFindingCounts(findings: ReviewFinding[]) {
  return Object.fromEntries(allFocusAreas.map((area) => [area, findings.filter((finding) => focusAreaMatchesCategory(area, finding.category)).length])) as Record<FocusArea, number>;
}

function getFindingsEmptyMessage({ analysis, focusAreas, language, selectedFocusLabels }: { analysis: ReviewAnalysisResponse; focusAreas: FocusArea[]; language: Language; selectedFocusLabels: string }) {
  const isZh = language === 'zh';
  if (analysis.findings.length === 0) {
    return isZh ? '当前没有生成 Review 建议。可以尝试配置 LLM，或扩大关注方向后重新分析。' : 'No review findings were generated. Configure an LLM or broaden the focus areas and run the analysis again.';
  }
  if (focusAreas.length === 0) {
    return isZh ? '当前没有选择任何关注方向。请选择“全部”或至少一个方向来查看 Review 建议。' : 'No focus area is selected. Choose All or at least one focus area to view review findings.';
  }
  return isZh ? `当前没有匹配“${selectedFocusLabels}”的 Review 建议。可以选择“全部”或切换其他方向查看。` : `No review findings match ${selectedFocusLabels}. Choose All or switch to another focus area.`;
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

