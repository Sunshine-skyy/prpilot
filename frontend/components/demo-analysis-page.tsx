'use client';

import { AlertTriangle, Clipboard, Loader2, Play, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { fetchDemoReview } from '@/lib/api';
import type { ReviewAnalysisResponse } from '@/lib/types';

function riskTone(level: string) {
  if (level.toLowerCase() === 'high') return 'border-orange-200 bg-orange-50 text-orange-700';
  if (level.toLowerCase() === 'critical') return 'border-red-200 bg-red-50 text-red-700';
  if (level.toLowerCase() === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function severityTone(severity: string) {
  const value = severity.toLowerCase();
  if (value === 'critical' || value === 'high') return 'bg-red-100 text-red-700';
  if (value === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

export default function DemoAnalysisPage() {
  const [analysis, setAnalysis] = useState<ReviewAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function handleTryDemo() {
    setIsLoading(true);
    setErrorMessage(null);
    setCopyState('idle');

    try {
      setAnalysis(await fetchDemoReview());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`${message}. Please make sure the backend is running at http://localhost:8080.`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyReport() {
    if (!analysis?.markdownReport) return;

    try {
      await navigator.clipboard.writeText(analysis.markdownReport);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.20),_transparent_30rem),linear-gradient(135deg,_#f8fbff_0%,_#eef3ff_52%,_#f8fafc_100%)] px-6 py-8 text-slate-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="text-xl font-black tracking-tight">PRPilot</div>
        <nav className="hidden gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a href="#analyze">Analyze</a>
          <a href="#demo">Demo</a>
          <a href="#results">Results</a>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-center" id="analyze">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">
            AI Pull Request Review Assistant
          </p>
          <h1 className="max-w-4xl text-5xl font-black tracking-[-0.08em] md:text-7xl">
            Review risky pull requests before humans spend hours on them.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            PRPilot summarizes changes, scores risk, highlights risky files, and generates a Markdown review report that can be copied into GitHub PR comments.
          </p>
          <div className="mt-8 flex flex-wrap gap-3" id="demo">
            <button
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-70"
              disabled={isLoading}
              onClick={handleTryDemo}
              type="button"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Try Demo
            </button>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
              Stable backend demo data
            </span>
          </div>
          {errorMessage ? (
            <div className="mt-6 flex max-w-2xl gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          ) : null}
        </div>

        <aside className="rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-2xl shadow-slate-300/40 backdrop-blur">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Demo Scenario</p>
          <h2 className="mt-2 text-2xl font-black">Risky auth change</h2>
          <div className="mt-6 grid gap-3">
            {['Authentication middleware', 'Configuration updates', 'Payment permission flow'].map((item) => (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700" key={item}>{item}</div>
            ))}
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl pb-16" id="results">
        {!analysis ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-600">
            Click <span className="font-bold text-indigo-600">Try Demo</span> to load a complete review result.
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-300/30">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">PR Overview</p>
                <h2 className="mt-3 text-2xl font-black">{analysis.pullRequest.title}</h2>
                <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Author: {analysis.pullRequest.author}</p>
                  <p>State: {analysis.pullRequest.state}</p>
                  <p>Base: {analysis.pullRequest.baseBranch}</p>
                  <p>Head: {analysis.pullRequest.headBranch}</p>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <Metric label="Files" value={analysis.pullRequest.changedFiles.toString()} />
                  <Metric label="Additions" value={`+${analysis.pullRequest.additions}`} tone="text-emerald-700 bg-emerald-50" />
                  <Metric label="Deletions" value={`-${analysis.pullRequest.deletions}`} tone="text-red-700 bg-red-50" />
                </div>
              </section>

              <section className={`rounded-[2rem] border p-6 shadow-lg shadow-slate-300/30 ${riskTone(analysis.riskAssessment.level)}`}>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-8 w-8" />
                  <p className="text-sm font-bold uppercase tracking-[0.16em]">Risk Assessment</p>
                </div>
                <p className="mt-5 text-6xl font-black tracking-[-0.08em]">{analysis.riskAssessment.score}<span className="text-2xl tracking-normal">/100</span></p>
                <p className="mt-2 text-xl font-black">{analysis.riskAssessment.level}</p>
                <ul className="mt-5 space-y-2 text-sm font-semibold leading-6">
                  {analysis.riskAssessment.reasons.map((reason) => <li key={reason}>- {reason}</li>)}
                </ul>
              </section>
            </div>

            <section className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-300/30">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Change Summary</p>
              <p className="mt-4 leading-8 text-slate-600">{analysis.changeSummary.overview}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {analysis.changeSummary.impactedAreas.map((area) => (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700" key={area}>{area}</span>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-lg shadow-slate-300/30">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Risky Files</p>
                <div className="mt-5 space-y-4">
                  {analysis.files.map((file) => (
                    <article className="rounded-2xl bg-slate-50 p-4" key={file.filename}>
                      <h3 className="break-all font-bold">{file.filename}</h3>
                      <p className="mt-1 text-sm text-slate-500">{file.status} · +{file.additions} / -{file.deletions}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {file.riskTags.map((tag) => <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600" key={tag}>{tag}</span>)}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Review Findings</p>
                {analysis.findings.map((finding) => (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={`${finding.file}-${finding.title}`}>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${severityTone(finding.severity)}`}>{finding.severity}</span>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{finding.category}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold">{finding.title}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{finding.line ? `${finding.file}:${finding.line}` : finding.file}</p>
                    <p className="mt-3 leading-7 text-slate-600">{finding.description}</p>
                    <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><span className="font-bold">Suggestion: </span>{finding.suggestion}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-lg shadow-slate-300/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-black">Markdown Report</h2>
                <button className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950" onClick={handleCopyReport} type="button">
                  <Clipboard className="h-4 w-4" /> Copy Report
                </button>
              </div>
              <pre className="mt-6 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-900 p-5 text-sm leading-7 text-slate-100">{analysis.markdownReport}</pre>
              {copyState === 'copied' ? <p className="mt-4 text-sm font-semibold text-emerald-300">Report copied to clipboard.</p> : null}
              {copyState === 'failed' ? <p className="mt-4 text-sm font-semibold text-red-300">Clipboard copy failed. Please copy manually.</p> : null}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, tone = 'bg-slate-50 text-slate-950' }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
