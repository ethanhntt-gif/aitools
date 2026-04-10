import { useEffect, useState } from "react";
import { hasSupabaseCredentials, supabase } from "./lib/supabase";

const demoProjects = [
  {
    id: "demo-1",
    title: "AI Outreach Assistant",
    description: "Automates prospect research, drafts outreach, and tracks conversations.",
    category: "Automation",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "demo-2",
    title: "Content Studio",
    description: "Turns briefs into social posts, blog outlines, and campaign assets in minutes.",
    category: "Content",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "demo-3",
    title: "Support Copilot",
    description: "Suggests support replies, summarizes tickets, and surfaces urgent issues.",
    category: "Customer Care",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
  }
];

function App() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProjects() {
      if (!hasSupabaseCredentials || !supabase) {
        setProjects(demoProjects);
        setStatus("ready");
        setMessage("Demo cards are shown until Supabase credentials are configured.");
        return;
      }

      setStatus("loading");
      setMessage("");

      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, category, project_url, image_url")
        .order("created_at", { ascending: false });

      if (ignore) {
        return;
      }

      if (error) {
        setProjects(demoProjects);
        setStatus("error");
        setMessage("Could not load Supabase data, so demo cards are displayed instead.");
        console.error(error);
        return;
      }

      setProjects(data ?? []);
      setStatus("ready");
      setMessage(
        data?.length
          ? "Live project cards are loaded from Supabase."
          : "The projects table is empty right now."
      );
    }

    loadProjects();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand-block">
          <span className="brand-kicker">AI Tools</span>
          <a className="brand-name" href="/">
            Listing Hub
          </a>
        </div>
        <nav className="nav-links" aria-label="Primary">
          <a href="#projects">Projects</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Supabase-powered homepage</p>
            <h1>Publish your AI projects in a clean listing hub.</h1>
            <p className="hero-text">
              A modern homepage with a strong header, a grounded footer, and
              project cards rendered directly from your Supabase database.
            </p>
          </div>
          <div className="hero-panel">
            <p className="panel-label">Data Source</p>
            <strong>{hasSupabaseCredentials ? "Supabase Connected" : "Demo Mode"}</strong>
            <p>{message || "Preparing project data..."}</p>
          </div>
        </section>

        <section className="projects-section" id="projects">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Featured work</p>
              <h2>Project cards</h2>
            </div>
            <span className={`status-pill status-${status}`}>{status}</span>
          </div>

          <div className="projects-grid">
            {projects.map((project) => (
              <article className="project-card" key={project.id}>
                <div
                  className="project-visual"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(14, 19, 24, 0.05), rgba(14, 19, 24, 0.78)), url(${project.image_url})`
                  }}
                >
                  <span>{project.category || "Project"}</span>
                </div>
                <div className="card-content">
                  <h3>{project.title}</h3>
                  <p>{project.description || "No description provided yet."}</p>
                  <a href={project.project_url || "#"} target="_blank" rel="noreferrer">
                    Open project
                  </a>
                </div>
              </article>
            ))}
          </div>

          {!projects.length && status === "ready" ? (
            <div className="empty-state">
              Add rows into your Supabase `projects` table to populate the listing.
            </div>
          ) : null}
        </section>

        <section className="about-section" id="about">
          <p className="eyebrow">Suggested schema</p>
          <p>
            Use a `projects` table with fields like `id`, `title`, `description`,
            `category`, `project_url`, `image_url`, and `created_at`.
          </p>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <p>AI Tools Listing</p>
        <p>Built for fast publishing, simple maintenance, and clean project discovery.</p>
      </footer>
    </div>
  );
}

export default App;
