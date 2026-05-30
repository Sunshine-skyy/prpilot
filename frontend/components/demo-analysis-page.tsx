'use client';

import Link from 'next/link';
import { CheckCircle2, Copy, Github, Loader2, Sparkles, TerminalSquare } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { analyzePullRequest, analyzeRawDiff, fetchDemoReview } from '@/lib/api';
import type { FocusArea, ReviewAnalysisResponse } from '@/lib/types';

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
  const resultsRef = useRef<HTMLElement | null>(null);

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
      setError(`${caught instanceof Error ? caught.message : 'Unknown error'}. Please make sure the backend is running.`);
    } finally {
      setLoading('');
    }
  }

  function toggleFocus(value: FocusArea) {
    setFocusAreas((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function analyzePr() {
    if (!prUrl.trim()) {
      setError('Please enter a GitHub pull request URL.');
      return;
    }
    void run('Analyzing PR...', () => analyzePullRequest({ prUrl, githubToken, focusAreas }));
  }

  function analyzeDiff() {
    if (!rawDiff.trim()) {
      setError('Please paste a raw diff.');
      return;
    }
    void run('Analyzing Raw Diff...', () => analyzeRawDiff({ title: rawTitle, description: rawDescription, diff: rawDiff, focusAreas }));
  }

  async function copyReport() {
    if (!analysis?.markdownReport) return;
    try {
      await navigator.clipboard.writeText(analysis.markdownReport);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2200);
    } catch {
      setCopyStatus('Copy failed.');
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_35%,#eef2ff_72%,#f8fafc_100%)] px-6 py-8 text-slate-950">
      <header className="sticky top-0 z-40 mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl">
        <Link className="text-xl font-black tracking-[-0.04em]" href="/">PRPilot</Link>
        <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 text-sm font-black text-slate-600 md:flex">
          <a className={navClass(activeSection === 'analyze')} href="#analyze" onClick={() => setActiveSection('analyze')}>Analyze</a>
          <a className={navClass(activeSection === 'results')} href="#results" onClick={() => setActiveSection('results')}>Results</a>
          <Link className={navClass(false)} href="/how-it-works">How It Works</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl scroll-mt-32 gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]" id="analyze">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-sm font-black uppercase tracking-[0.24em] text-indigo-600 shadow-sm"><Sparkles className="h-4 w-4" /> AI Pull Request Review Assistant</p>
          <h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">Analyze pull requests before human review.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">Paste a GitHub PR URL or raw diff to get a change summary, risk score, AI findings, and a Markdown report.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-xl shadow-slate-300/60 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:opacity-60" disabled={Boolean(loading)} onClick={() => void run('Loading Demo...', fetchDemoReview)} type="button">
              {loading === 'Loading Demo...' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading === 'Loading Demo...' ? 'Loading Demo...' : 'Try Demo'}
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
                <Input label="GitHub token (optional)" onChange={setGithubToken} placeholder="Optional token" type="password" value={githubToken} />
              </>
            ) : (
              <>
                <Input label="Title" onChange={setRawTitle} value={rawTitle} />
                <TextArea label="Description" onChange={setRawDescription} value={rawDescription} />
                <TextArea label="Raw Diff" monospace onChange={setRawDiff} placeholder="diff --git a/src/file.ts b/src/file.ts..." rows={9} value={rawDiff} />
              </>
            )}

            <div>
              <p className="mb-3 text-sm font-black text-slate-700">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {focusOptions.map((option) => (
                  <button className={`rounded-full border px-3 py-2 text-xs font-black transition hover:-translate-y-0.5 ${focusAreas.includes(option.value) ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'}`} key={option.value} onClick={() => toggleFocus(option.value)} type="button">
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-slate-950 px-6 py-4 text-sm font-black text-white shadow-xl shadow-indigo-100 transition hover:-translate-y-0.5 disabled:opacity-60" disabled={Boolean(loading)} onClick={mode === 'github' ? analyzePr : analyzeDiff} type="button">
              {loading && loading !== 'Loading Demo...' ? <Loader2 className="h-4 w-4 animate-spin" /> : <TerminalSquare className="h-4 w-4" />}
              {loading && loading !== 'Loading Demo...' ? loading : mode === 'github' ? 'Analyze PR' : 'Analyze Raw Diff'}
            </button>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl scroll-mt-32 pb-16 pt-4" id="results" ref={resultsRef}>
        {analysis ? <Results analysis={analysis} copyReport={copyReport} copyStatus={copyStatus} /> : <div className="rounded-3xl border border-dashed border-indigo-200 bg-white/75 p-10 text-center text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Sparkles className="h-5 w-5" /></div>Run an analysis or click Try Demo to load results.</div>}
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

function Results({ analysis, copyReport, copyStatus }: { analysis: ReviewAnalysisResponse; copyReport: () => void; copyStatus: string }) {
  const risk = riskClass(analysis.riskAssessment.level);
  return <div className="grid gap-6"><div><p className="text-sm font-black uppercase tracking-[0.22em] text-indigo-600">Analysis Results</p><h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">Structured review output</h2></div><section className="grid gap-6 lg:grid-cols-2"><Card title="PR Overview"><h2 className="text-2xl font-black">{analysis.pullRequest.title}</h2><div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><Meta label="Author" value={analysis.pullRequest.author} /><Meta label="State" value={analysis.pullRequest.state} /><Meta label="Base" value={analysis.pullRequest.baseBranch} /><Meta label="Head" value={analysis.pullRequest.headBranch} /><Meta label="Files" value={String(analysis.pullRequest.changedFiles)} /><Meta label="Lines" value={`+${analysis.pullRequest.additions} / -${analysis.pullRequest.deletions}`} /></div></Card><Card title="Risk Assessment"><div className={`rounded-3xl border p-5 ${risk.panel}`}><p className="text-5xl font-black">{analysis.riskAssessment.score}<span className="text-xl">/100</span></p><p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-black ${risk.badge}`}>{analysis.riskAssessment.level}</p></div><ul className="mt-4 space-y-2 text-sm text-slate-600">{analysis.riskAssessment.reasons.map((reason) => <li className="flex gap-2" key={reason}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />{reason}</li>)}</ul></Card></section><Card title="Change Summary"><p className="leading-8 text-slate-600">{analysis.changeSummary.overview}</p><div className="mt-4 grid gap-3 md:grid-cols-2">{analysis.changeSummary.keyChanges.map((item) => <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700" key={item}>{item}</div>)}</div></Card><section className="grid gap-6 lg:grid-cols-2"><Card title="Changed Files"><div className="space-y-4">{analysis.files.map((file) => <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg" key={file.filename}><p className="break-all font-bold">{file.filename}</p><p className="mt-1 text-sm text-slate-500">{file.status} · +{file.additions} / -{file.deletions}</p><div className="mt-3 flex flex-wrap gap-2">{file.riskTags.map((tag) => <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-bold text-indigo-700" key={tag}>{tag}</span>)}</div></div>)}</div></Card><Card title="Review Findings"><div className="space-y-4">{analysis.findings.length === 0 ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">No AI findings returned. Rule-based analysis is still available.</p> : analysis.findings.map((finding) => <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl" key={`${finding.file}-${finding.title}`}><div className="border-b border-slate-100 bg-slate-50 px-4 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${severityClass(finding.severity)}`}>{finding.severity}</span><span className="ml-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{finding.category}</span></div><div className="p-4"><h3 className="font-black">{finding.title}</h3><p className="mt-1 break-all font-mono text-xs font-semibold text-slate-500">{finding.line ? `${finding.file}:${finding.line}` : finding.file}</p><p className="mt-3 text-sm leading-6 text-slate-600">{finding.description}</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>Suggestion:</b> {finding.suggestion}</p></div></article>)}</div></Card></section><section className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/50 transition hover:-translate-y-1"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black">Markdown Report</h2><button className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${copyStatus === 'Copied!' ? 'bg-emerald-400 text-emerald-950' : 'bg-white text-slate-950'}`} onClick={copyReport} type="button">{copyStatus === 'Copied!' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copyStatus || 'Copy Report'}</button></div><pre className="mt-6 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-900 p-5 text-sm leading-7">{analysis.markdownReport}</pre></section></div>;
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
