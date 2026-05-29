function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">AI Pull Request Review Assistant</p>
        <h1>PRPilot</h1>
        <p className="hero-copy">
          Summarize pull request changes, detect risky code patterns, and
          generate structured review suggestions before human review.
        </p>
        <div className="status-panel">
          <span className="status-dot" aria-hidden="true" />
          Project scaffold is ready for iterative PR-based development.
        </div>
      </section>
    </main>
  );
}

export default App;
