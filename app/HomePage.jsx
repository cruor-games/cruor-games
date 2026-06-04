import "./home-page.css";

export default function HomePage({ onOpenCrucibleTool, onOpenInspirations }) {
  return (
    <section className="cruor-home" aria-labelledby="cruorHomeTitle">
      <section className="cruor-home__hero" aria-label="Cruor Games homepage hero">
        <div className="cruor-home__hero-copy">
          <h1 id="cruorHomeTitle">
            Build <span>Horror</span>
            <br />
            for Your 5E Sessions
          </h1>

          <p>
            Cruor turns real sources of dread into playable horror content — haunted places,
            disturbing monsters, and dark fantasy flavour you can actually use at the table.
          </p>

          <div className="cruor-home__hero-actions" aria-label="Primary home actions">
            <button
              className="cruor-home__button cruor-home__button--primary"
              type="button"
              onClick={() => onOpenCrucibleTool?.("darken", "composer")}
            >
              Open the Workbench
            </button>

            <button
              className="cruor-home__text-link"
              type="button"
              onClick={onOpenInspirations}
            >
              Browse Inspirations
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>

        <aside className="cruor-home__hero-visual" aria-label="Hero image placeholder">
          <div className="cruor-home__visual-board">
            <div className="cruor-home__placeholder cruor-home__placeholder--main">
              <div>
                <span>Hero Image Placeholder</span>
                <strong>Workbench Composite</strong>
                <p>
                  Use one visual combining a dungeon map crop, a monster composer crop,
                  and overlapping inspiration cards.
                </p>
              </div>
            </div>

            <div className="cruor-home__placeholder cruor-home__placeholder--map">
              <div>
                <span>Image Detail</span>
                <strong>Map Crop</strong>
                <p>Readable dungeon region preview in dark cartographic style.</p>
              </div>
            </div>

            <div className="cruor-home__placeholder cruor-home__placeholder--monster">
              <div>
                <span>Image Detail</span>
                <strong>Monster UI</strong>
                <p>Silhouette, anatomy, or Crucible slots. Tool-like, not illustrative.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="cruor-home__statement" aria-label="Project statement">
        <div>
          <h2>Built for the Session You Already Have.</h2>
          <p>
            Cruor does not ask you to start over. It helps you turn an existing location,
            threat, or inspiration into horror material you can actually use at the table.
          </p>
        </div>
      </section>

      <section className="cruor-home__section cruor-home__section--tools" aria-labelledby="featuredToolsTitle">
        <div className="cruor-home__section-head">
          <h2 id="featuredToolsTitle">Featured Creation Tools</h2>
          <p>The current tools are only the first surfaces of the workbench — not the whole idea.</p>
        </div>

        <div className="cruor-home__tool-grid">
          <article className="cruor-home__tool-card">
            <div className="cruor-home__tool-image cruor-home__placeholder">
              <div>
                <span>Image Placeholder</span>
                <strong>Dungeon Generator Visual</strong>
                <p>Use a strong map preview or UI crop from Darken a Location.</p>
              </div>
            </div>

            <div className="cruor-home__tool-copy">
              <h3>Darken a Dungeon</h3>
              <p>Build a haunted location around the session you already have.</p>
            </div>

            <button
              className="cruor-home__text-link"
              type="button"
              onClick={() => onOpenCrucibleTool?.("darken", "composer")}
            >
              Explore the Dungeon Generator
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
          </article>

          <article className="cruor-home__tool-card">
            <div className="cruor-home__tool-image cruor-home__placeholder">
              <div>
                <span>Image Placeholder</span>
                <strong>Monster Generator Visual</strong>
                <p>Use a monster silhouette, Crucible slot view, or composer crop.</p>
              </div>
            </div>

            <div className="cruor-home__tool-copy">
              <h3>Forge a Monster</h3>
              <p>Create a disturbing creature with pressure, weakness, and table-ready flavour.</p>
            </div>

            <button
              className="cruor-home__text-link"
              type="button"
              onClick={() => onOpenCrucibleTool?.("monster")}
            >
              Explore the Monster Generator
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
          </article>
        </div>
      </section>

      <section className="cruor-home__section cruor-home__section--sources" aria-labelledby="sourcesTitle">
        <div className="cruor-home__sources-copy">
          <div className="cruor-home__section-head">
            <h2 id="sourcesTitle">Real Sources, Playable Horror.</h2>
            <p>
              Cruor draws from things that really exist — folklore, history, ritual practice,
              architecture, biology, and material culture — then transforms them into playable
              content and dark fantasy flavour for your sessions.
            </p>
          </div>

          <button
            className="cruor-home__button cruor-home__button--primary"
            type="button"
            onClick={onOpenInspirations}
          >
            Browse Our Inspirations
          </button>
        </div>

        <div className="cruor-home__inspiration-stack" aria-label="Inspiration cards placeholder">
          <article className="cruor-home__stack-card cruor-home__stack-card--low">
            <div className="cruor-home__stack-meta">
              <span>Inspiration</span>
              <span>Historical Object</span>
            </div>
            <h3>Wax Death Masks</h3>
            <p>Preserved faces, false presence, devotional grief.</p>
          </article>

          <article className="cruor-home__stack-card cruor-home__stack-card--mid">
            <div className="cruor-home__stack-meta">
              <span>Inspiration</span>
              <span>Biological Process</span>
            </div>
            <h3>Decomposition</h3>
            <p>Gas, sweetness, pressure, impossible decay.</p>
          </article>

          <article className="cruor-home__stack-card cruor-home__stack-card--top">
            <div className="cruor-home__stack-meta">
              <span>Image Placeholder</span>
              <span>Hover Stack</span>
            </div>
            <h3>Sedlec Ossuary</h3>
            <p>
              Replace this stack with 3–4 overlapping inspiration cards. On hover,
              the top card can shift or swap to reveal another source.
            </p>
          </article>
        </div>
      </section>

      <section className="cruor-home__section cruor-home__section--support" aria-labelledby="supportTitle">
        <div className="cruor-home__support-band">
          <div>
            <h2 id="supportTitle">Support the Workbench</h2>
            <p>
              Patreon helps Cruor grow through new content, sharper tools, and a deeper library
              of dark fantasy material for 5E.
            </p>

            <a className="cruor-home__button cruor-home__button--primary" href="#support">
              Join the Patreon
            </a>
          </div>

          <div className="cruor-home__support-visual cruor-home__placeholder">
            <div>
              <span>Image Placeholder</span>
              <strong>Support Visual</strong>
              <p>Use a soft collage of map crop, monster crop, and inspiration cards.</p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
