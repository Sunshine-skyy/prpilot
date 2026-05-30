import Link from 'next/link';
import { ArrowLeft, BrainCircuit, FileSearch, GitPullRequestArrow, ShieldCheck, Sparkles, Workflow } from 'lucide-react';

const steps = [
  ['01', 'GitHub PR URL / Raw Diff', 'Users can analyze a real GitHub pull request, paste a raw diff, or use Try Demo as an offline fallback.'],
  ['02', 'Diff Fetcher', 'PRPilot collects PR metadata, changed files, additions, deletions, and patches through GitHub API or raw input.'],
  ['03', 'Rule-based Risk Scan', 'A deterministic rule engine identifies security, testing, config, auth, logging, and validation risk signals.'],
  ['04', 'Context Builder', 'The backend builds compact structured context for the model with focus areas and evidence-backed risk hints.'],
  ['05', 'LLM Review Agent', 'An OpenAI-compatible client calls the configured model and asks for structured, evidence-based review findings.'],
  ['06', 'Markdown Report', 'The final response contains PR summary, risk assessment, findings, changed files, and a copyable Markdown report.'],
];

const cards = [
  ['Model Strategy', 'OpenAI-compatible integration keeps DashScope qwen-turbo as the default while allowing future provider changes through configuration only.', BrainCircuit],
  ['Risk Analysis', 'Rule-based signals catch large diffs, missing tests, auth changes, config keywords, TODO/FIXME, debug logs, empty catch blocks, and removed validation.', ShieldCheck],
  ['Context Strategy', 'PRPilot reduces noisy diffs into structured context: PR metadata, changed files, patches, focus areas, and rule evidence.', FileSearch],
  ['False Positive Control', 'Prompts ask the model to report only evidence-backed findings, lower confidence when evidence is weak, and avoid unrelated high-severity comments.', Sparkles],
  ['Fallback Modes', 'Raw Diff analysis and Try Demo make the product usable even when GitHub API or LLM access is unavailable.', Workflow],
  ['Future Extensions', 'Potential extensions include GitHub App integration, inline comments, team rules, AST analysis, caching, and GitLab or Gitee support.', GitPullRequestArrow],
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_35%,#eef2ff_72%,#f8fafc_100%)] px-6 py-8 text-slate-950">
      <header className="sticky top-0 z-40 mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-xl">
        <Link className="text-xl font-black tracking-[-0.04em]" href="/">PRPilot</Link>
        <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 text-sm font-black text-slate-600 md:flex">
          <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-indigo-700" href="/#analyze">Analyze</Link>
          <Link className="rounded-full px-4 py-2 transition hover:bg-white hover:text-indigo-700" href="/#results">Results</Link>
          <span className="rounded-full bg-slate-950 px-4 py-2 text-white shadow">How It Works</span>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl py-14">
        <Link className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-indigo-700" href="/">
          <ArrowLeft className="h-4 w-4" /> Back to Analyze
        </Link>
        <p className="mt-10 text-sm font-black uppercase tracking-[0.24em] text-indigo-600">How It Works</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.06em] md:text-6xl">From pull request input to structured review report.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">PRPilot combines deterministic risk scanning with LLM-based review suggestions. The goal is not to replace human reviewers, but to prepare a clearer and safer review context before human review starts.</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 pb-10 md:grid-cols-2 lg:grid-cols-3">
        {steps.map(([number, title, text]) => (
          <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-slate-200/70 backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl" key={title}>
            <span className="text-sm font-black text-indigo-600">Step {number}</span>
            <h2 className="mt-3 text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 pb-20 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(([title, text, Icon]) => (
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
