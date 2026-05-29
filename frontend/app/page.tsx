import { Bot, GitPullRequestArrow, ShieldCheck } from 'lucide-react';

const scaffoldCards = [
  {
    title: 'Pull Request Context',
    description: 'Prepared for GitHub PR URL and Raw Diff analysis flows.',
    icon: GitPullRequestArrow,
  },
  {
    title: 'Rule-based Scan',
    description: 'Ready for risk scoring before LLM-assisted review.',
    icon: ShieldCheck,
  },
  {
    title: 'AI Review Agent',
    description: 'Designed for OpenAI-compatible model integration.',
    icon: Bot,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.22),_transparent_32rem),linear-gradient(135deg,_#f8fbff_0%,_#eef3ff_52%,_#f8fafc_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
        <div className="max-w-3xl rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-2xl shadow-slate-300/40 backdrop-blur md:p-12">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-indigo-600">
            AI Pull Request Review Assistant
          </p>
          <h1 className="text-5xl font-black tracking-[-0.08em] text-slate-950 md:text-7xl">
            PRPilot
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 md:text-xl">
            Paste a GitHub Pull Request URL and get an AI-generated change
            summary, risk assessment, and structured review suggestions before
            human review.
          </p>
          <div className="mt-8 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
            Next.js frontend scaffold is ready for feature development.
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {scaffoldCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-lg shadow-slate-300/30 backdrop-blur"
                key={card.title}
              >
                <Icon className="mb-5 h-8 w-8 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-950">{card.title}</h2>
                <p className="mt-3 leading-7 text-slate-600">{card.description}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
