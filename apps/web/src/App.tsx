import { boardVisibilityOptions, productName } from "@inklink/shared";

export function App() {
  return (
    <main className="app-shell selection:bg-gold selection:text-ink">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow tracking-wide">Realtime canvas for creative teams</p>
            <h1>{productName}</h1>
          </div>
          <button
            className="primary-action transition-transform active:translate-x-0.5 active:translate-y-0.5"
            type="button"
          >
            New board
          </button>
        </header>

        <section className="canvas-stage" aria-label="InkLink canvas preview">
          <div className="canvas-paper">
            <span className="stroke stroke-one" />
            <span className="stroke stroke-two" />
            <span className="stroke stroke-three" />
          </div>
        </section>

        <aside className="tool-tray" aria-label="Canvas tools">
          <button type="button">Pen</button>
          <button type="button">Erase</button>
          <button type="button">Undo</button>
          <button type="button">Redo</button>
        </aside>
      </section>

      <section className="status-panel">
        <h2>Project scaffold</h2>
        <p>
          The monorepo is wired for a React workspace, Express API, and shared TypeScript domain
          package.
        </p>
        <dl>
          <div>
            <dt>API</dt>
            <dd>Same-origin in production, localhost in development</dd>
          </div>
          <div>
            <dt>Board visibility</dt>
            <dd>{boardVisibilityOptions.join(", ")}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
