'use client';

import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
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
  const resultsRef = useRef<HTMLElement | null>(null);

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
    } catch {
      setCopyStatus('Copy failed.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="text-xl font-black">PRPilot</div>
        <nav className="hidden gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a href="#analyze">Analyze</a>
          <a href="#results">Results</a>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]" id="analyze">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">AI Pull Request Review Assistant</p>
          <h1 className="text-5xl font-black tracking-[-0.06em] md:text-6xl">Analyze pull requests before human review.</h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">Paste a GitHub PR URL or raw diff to get a change summary, risk score, AI findings, and a Markdown report.</p>
          <button className="mt-8 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60" disabled={Boolean(loading)} onClick={() => void run('Loading Demo...', fetchDemoReview)} type="button">
            {loading === 'Loading Demo...' ? 'Loading Demo...' : 'Try Demo'}
          </button>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-bold">
            <button className={`rounded-full px-4 py-2 ${mode === 'github' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`} onClick={() => setMode('github')} type="button">GitHub PR</button>
            <button className={`rounded-full px-4 py-2 ${mode === 'raw' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`} onClick={() => setMode('raw')} type="button">Raw Diff</button>
          </div>

          <div className="mt-6 space-y-4">
            {mode === 'github' ? (
              <>
                <Input label="GitHub PR URL" onChange={setPrUrl} placeholder="https://github.com/owner/repo/pull/123" value={prUrl} />
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
              <p className="mb-3 text-sm font-bold text-slate-700">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {focusOptions.map((option) => (
                  <button className={`rounded-full px-3 py-2 text-xs font-bold ${focusAreas.includes(option.value) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`} key={option.value} onClick={() => toggleFocus(option.value)} type="button">
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white disabled:opacity-60" disabled={Boolean(loading)} onClick={mode === 'github' ? analyzePr : analyzeDiff} type="button">
              {loading && loading !== 'Loading Demo...' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading && loading !== 'Loading Demo...' ? loading : mode === 'github' ? 'Analyze PR' : 'Analyze Raw Diff'}
            </button>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl pb-16" id="results" ref={resultsRef}>
        {analysis ? <Results analysis={analysis} copyReport={copyReport} copyStatus={copyStatus} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">Run an analysis or click Try Demo to load results.</div>}
      </section>
    </main>
  );
}

function Input({ label, onChange, placeholder, type = 'text', value }: { label: string; onChange: (value: string) => void; placeholder?: string; type?: string; value: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span><input className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></label>;
}

function TextArea({ label, monospace = false, onChange, placeholder, rows = 4, value }: { label: string; monospace?: boolean; onChange: (value: string) => void; placeholder?: string; rows?: number; value: string }) {
  return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span><textarea className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 ${monospace ? 'font-mono' : ''}`} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} value={value} /></label>;
}

function Results({ analysis, copyReport, copyStatus }: { analysis: ReviewAnalysisResponse; copyReport: () => void; copyStatus: string }) {
  return <div className="grid gap-6"><section className="grid gap-6 lg:grid-cols-2"><Card title="PR Overview"><h2 className="text-2xl font-black">{analysis.pullRequest.title}</h2><div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p>Author: {analysis.pullRequest.author}</p><p>State: {analysis.pullRequest.state}</p><p>Base: {analysis.pullRequest.baseBranch}</p><p>Head: {analysis.pullRequest.headBranch}</p><p>Files: {analysis.pullRequest.changedFiles}</p><p>Lines: +{analysis.pullRequest.additions} / -{analysis.pullRequest.deletions}</p></div></Card><Card title="Risk Assessment"><p className="text-5xl font-black">{analysis.riskAssessment.score}<span className="text-xl">/100</span></p><p className="mt-2 text-xl font-black">{analysis.riskAssessment.level}</p><ul className="mt-4 space-y-2 text-sm text-slate-600">{analysis.riskAssessment.reasons.map((reason) => <li key={reason}>- {reason}</li>)}</ul></Card></section><Card title="Change Summary"><p className="leading-8 text-slate-600">{analysis.changeSummary.overview}</p><ul className="mt-4 space-y-2 text-sm text-slate-600">{analysis.changeSummary.keyChanges.map((item) => <li key={item}>- {item}</li>)}</ul></Card><section className="grid gap-6 lg:grid-cols-2"><Card title="Changed Files"><div className="space-y-4">{analysis.files.map((file) => <div className="rounded-2xl bg-slate-50 p-4" key={file.filename}><p className="break-all font-bold">{file.filename}</p><p className="mt-1 text-sm text-slate-500">{file.status} · +{file.additions} / -{file.deletions}</p><div className="mt-3 flex flex-wrap gap-2">{file.riskTags.map((tag) => <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600" key={tag}>{tag}</span>)}</div></div>)}</div></Card><Card title="Review Findings"><div className="space-y-4">{analysis.findings.length === 0 ? <p className="text-slate-600">No AI findings returned. Rule-based analysis is still available.</p> : analysis.findings.map((finding) => <article className="rounded-2xl border border-slate-200 p-4" key={`${finding.file}-${finding.title}`}><div className="flex gap-2"><span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">{finding.severity}</span><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{finding.category}</span></div><h3 className="mt-3 font-black">{finding.title}</h3><p className="mt-1 break-all text-sm font-semibold text-slate-500">{finding.line ? `${finding.file}:${finding.line}` : finding.file}</p><p className="mt-3 text-sm leading-6 text-slate-600">{finding.description}</p><p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><b>Suggestion:</b> {finding.suggestion}</p></article>)}</div></Card></section><section className="rounded-3xl bg-slate-950 p-6 text-white"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black">Markdown Report</h2><button className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950" onClick={copyReport} type="button">{copyStatus || 'Copy Report'}</button></div><pre className="mt-6 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-900 p-5 text-sm leading-7">{analysis.markdownReport}</pre></section></div>;
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="rounded-3xl bg-white p-6 shadow-lg"><p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>{children}</section>;
}
