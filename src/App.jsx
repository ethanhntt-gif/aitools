import { useEffect, useRef, useState } from "react";
import { hasSupabaseCredentials, supabase } from "./lib/supabase";

const demoProjects = [
  {
    id: "demo-1",
    title: "AI Outreach Assistant",
    slogan: "Prospecting and follow-ups on autopilot.",
    description: "Automates prospect research, drafts outreach, and tracks conversations.",
    category: "Automation",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "demo-2",
    title: "Content Studio",
    slogan: "From brief to launch-ready content in minutes.",
    description: "Turns briefs into social posts, blog outlines, and campaign assets in minutes.",
    category: "Content",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "demo-3",
    title: "Support Copilot",
    slogan: "Faster replies, calmer queues, better support.",
    description: "Suggests support replies, summarizes tickets, and surfaces urgent issues.",
    category: "Customer Care",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
  }
];

const initialForm = {
  title: "",
  slogan: "",
  description: "",
  category: "",
  project_url: "",
  image_url: "",
  logo_url: "",
  launch_week: ""
};

const storageBucket = "project-assets";
const totalModalSteps = 3;

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function App() {
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("home");
  const [activeSlug, setActiveSlug] = useState("");
  const [modalStep, setModalStep] = useState(1);
  const [logoFile, setLogoFile] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const logoInputRef = useRef(null);
  const screenshotInputRef = useRef(null);

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
      .select("id, title, slogan, description, category, project_url, image_url, logo_url, owner_id")
      .order("created_at", { ascending: false });

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

  async function loadMyProjects(activeSession = session) {
    if (!hasSupabaseCredentials || !supabase || !activeSession?.user?.id) {
      setMyProjects([]);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .select("id, title, slogan, description, category, project_url, image_url, logo_url, owner_id")
      .eq("owner_id", activeSession.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMyProjects([]);
      return;
    }

    setMyProjects(data ?? []);
  }

  useEffect(() => {
    let ignore = false;

    async function bootstrapAuth() {
      if (!hasSupabaseCredentials || !supabase) {
        setAuthLoading(false);
        return;
      }

      const {
        data: { session: activeSession }
      } = await supabase.auth.getSession();

      if (!ignore) {
        setSession(activeSession);
        setAuthLoading(false);
      }
    }

    bootstrapAuth();

    if (!hasSupabaseCredentials || !supabase) {
      return () => {
        ignore = true;
      };
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!ignore) {
        setSession(nextSession);
        setAuthLoading(false);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadProjects();
    loadMyProjects(session);
  }, [session]);

  useEffect(() => {
    function syncViewFromLocation() {
      const path = window.location.pathname.replace(/\/+$/, "") || "/";

      if (path === "/dashboard") {
        setActiveView("dashboard");
        setActiveSlug("");
        return;
      }

      if (path.startsWith("/project/")) {
        setActiveView("project");
        setActiveSlug(decodeURIComponent(path.replace("/project/", "")));
        return;
      }

      setActiveView("home");
      setActiveSlug("");
    }

    syncViewFromLocation();
    window.addEventListener("popstate", syncViewFromLocation);

    return () => {
      window.removeEventListener("popstate", syncViewFromLocation);
    };
  }, []);

  async function handleGoogleSignIn() {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      setMessage("Google sign-in could not be started. Check your Supabase Google provider settings.");
      setStatus("error");
      console.error(error);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage("Sign-out failed. Please try again.");
      setStatus("error");
      console.error(error);
      return;
    }

    setIsMenuOpen(false);
    setActiveView("home");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  function validateModalStep(step) {
    if (step === 1) {
      if (!formData.title.trim() || !formData.category.trim() || !formData.description.trim()) {
        setSubmitStatus("error");
        setSubmitMessage("Fill in the project title, category, and description before continuing.");
        return false;
      }

      if (!formData.project_url.trim()) {
        setSubmitStatus("error");
        setSubmitMessage("Add the project URL before continuing.");
        return false;
      }
    }

    if (step === 2 && (!logoFile || !screenshotFile)) {
      setSubmitStatus("error");
      setSubmitMessage("Choose both a logo and a screenshot before continuing.");
      return false;
    }

    if (step === 3 && !formData.launch_week) {
      setSubmitStatus("error");
      setSubmitMessage("Choose the launch week before submitting.");
      return false;
    }

    setSubmitStatus("idle");
    setSubmitMessage("");
    return true;
  }

  function handleNextStep() {
    if (!validateModalStep(modalStep)) {
      return;
    }

    setModalStep((current) => Math.min(current + 1, totalModalSteps));
  }

  function handlePreviousStep() {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setModalStep((current) => Math.max(current - 1, 1));
  }

  async function handleProjectSubmit(event) {
    event.preventDefault();

    if (!supabase || !session) {
      setSubmitStatus("error");
      setSubmitMessage("Please sign in before submitting a project.");
      return;
    }

    if (!validateModalStep(3)) {
      return;
    }

    setSubmitStatus("submitting");
    setSubmitMessage("");

    if (!logoFile || !screenshotFile) {
      setSubmitStatus("error");
      setSubmitMessage("Please choose both a logo and a screenshot from your computer.");
      return;
    }

    const logoUpload = await uploadAsset(logoFile, "logos");

    if (!logoUpload.success) {
      setSubmitStatus("error");
      setSubmitMessage(logoUpload.message);
      return;
    }

    const screenshotUpload = await uploadAsset(screenshotFile, "screenshots");

    if (!screenshotUpload.success) {
      setSubmitStatus("error");
      setSubmitMessage(screenshotUpload.message);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      slogan: formData.slogan.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      project_url: formData.project_url.trim(),
      image_url: screenshotUpload.publicUrl,
      logo_url: logoUpload.publicUrl,
      owner_id: session.user.id,
      owner_email: session.user.email
    };

    const { error } = await supabase.from("projects").insert(payload);

    if (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        "Project submission failed. Check the `projects` table schema and Supabase RLS insert policy."
      );
      console.error(error);
      return;
    }

    setFormData(initialForm);
    setLogoFile(null);
    setScreenshotFile(null);
    setSubmitStatus("success");
    setSubmitMessage("Project submitted successfully and added to the listing.");
    setIsModalOpen(false);
    await loadProjects();
    await loadMyProjects(session);
  }

  function openModal() {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setModalStep(1);
    setIsMenuOpen(false);
    setIsModalOpen(true);
  }

  function closeModal() {
    setModalStep(1);
    setSubmitStatus("idle");
    setSubmitMessage("");
    setIsModalOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((current) => !current);
  }

  function openDashboard() {
    setIsMenuOpen(false);
    window.history.pushState({}, "", "/dashboard");
    setActiveView("dashboard");
  }

  function openHome() {
    window.history.pushState({}, "", "/");
    setActiveView("home");
    setActiveSlug("");
    setIsMenuOpen(false);
  }

  function openProject(project) {
    const projectSlug = slugify(project.title);
    window.history.pushState({}, "", `/project/${projectSlug}`);
    setActiveView("project");
    setActiveSlug(projectSlug);
    setIsMenuOpen(false);
  }

  function handleDropZoneClick(fieldName) {
    if (fieldName === "logo_url") {
      logoInputRef.current?.click();
      return;
    }

    screenshotInputRef.current?.click();
  }

  function handleFileChange(event, type) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (type === "logo") {
      setLogoFile(file);
      return;
    }

    setScreenshotFile(file);
  }

  async function uploadAsset(file, folder) {
    if (!supabase || !session) {
      return {
        success: false,
        message: "You must be signed in to upload files."
      };
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${session.user.id}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error(uploadError);
      return {
        success: false,
        message:
          "File upload failed. Create the Supabase bucket and storage policies for authenticated uploads."
      };
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: data.publicUrl
    };
  }

  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    "Signed in";

  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const activeProject = projects.find((project) => slugify(project.title) === activeSlug);

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand-block">
          <span className="brand-kicker">AI Tools</span>
          <button className="brand-name brand-button" onClick={openHome} type="button">
            Listing Hub
          </button>
        </div>
        <nav className="nav-links" aria-label="Primary">
          <button className="nav-link-button" onClick={openHome} type="button">
            Projects
          </button>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="auth-controls">
          {hasSupabaseCredentials ? (
            session ? (
              <div className="user-menu-wrap">
                <button className="avatar-button" onClick={toggleMenu} type="button">
                  {userAvatar ? (
                    <img className="user-avatar" src={userAvatar} alt={userName} />
                  ) : (
                    <span className="user-avatar user-avatar-fallback">
                      {userName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </button>
                {isMenuOpen ? (
                  <div className="user-menu">
                    <div className="user-menu-meta">
                      <strong>{userName}</strong>
                      <span>{session.user.email}</span>
                    </div>
                    <button className="menu-item" onClick={openModal} type="button">
                      Submit product
                    </button>
                    <button className="menu-item" onClick={openDashboard} type="button">
                      Dashboard
                    </button>
                    <button className="menu-item menu-item-danger" onClick={handleSignOut} type="button">
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button
                className="primary-button"
                onClick={handleGoogleSignIn}
                type="button"
                disabled={authLoading}
              >
                {authLoading ? "Checking session..." : "Submit"}
              </button>
            )
          ) : (
            <span className="setup-note">Add Supabase keys to enable Google sign-in.</span>
          )}
        </div>
      </header>

      <main>
        {activeView === "dashboard" ? (
          <section className="dashboard-page" id="dashboard">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Personal workspace</p>
                <h2>Your dashboard</h2>
              </div>
              <button className="secondary-button" onClick={openHome} type="button">
                Back to home
              </button>
            </div>

            {session ? (
              <>
                <div className="dashboard-summary">
                  <div className="summary-card">
                    <span className="panel-label">Owner</span>
                    <strong>{userName}</strong>
                    <p>{session.user.email}</p>
                  </div>
                  <div className="summary-card">
                    <span className="panel-label">Submitted projects</span>
                    <strong>{myProjects.length}</strong>
                    <p>Only your own projects are shown here.</p>
                  </div>
                </div>

                <div className="section-heading dashboard-actions">
                  <div>
                    <p className="eyebrow">Your content</p>
                    <h2>My projects</h2>
                  </div>
                  <button className="primary-button" onClick={openModal} type="button">
                    Submit product
                  </button>
                </div>

                <div className="projects-grid">
                  {myProjects.map((project) => (
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
                        <div className="card-title-row">
                          {project.logo_url ? (
                            <img className="project-logo" src={project.logo_url} alt={project.title} />
                          ) : null}
                          <div>
                            <h3>{project.title}</h3>
                            {project.slogan ? (
                              <p className="project-slogan">{project.slogan}</p>
                            ) : null}
                          </div>
                        </div>
                        <p>{project.description || "No description provided yet."}</p>
                        <div className="card-actions">
                          <button className="link-button" onClick={() => openProject(project)} type="button">
                            View details
                          </button>
                          <a href={project.project_url || "#"} target="_blank" rel="noreferrer">
                            Visit →
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {!myProjects.length ? (
                  <div className="empty-state">
                    You have not submitted any projects yet. Use `Submit product` to add your first one.
                  </div>
                ) : null}
              </>
            ) : (
              <div className="submit-locked">
                Sign in with Google first to open your personal dashboard.
              </div>
            )}
          </section>
        ) : activeView === "project" ? (
          <section className="project-page">
            {activeProject ? (
              <>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Project page</p>
                    <h2>{activeProject.title}</h2>
                  </div>
                  <button className="secondary-button" onClick={openHome} type="button">
                    Back to projects
                  </button>
                </div>

                <div className="project-page-grid">
                  <div className="project-page-main">
                    <div
                      className="project-page-hero"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(14, 19, 24, 0.05), rgba(14, 19, 24, 0.78)), url(${activeProject.image_url})`
                      }}
                    />
                    <div className="project-page-copy">
                      <div className="card-title-row">
                        {activeProject.logo_url ? (
                          <img
                            className="project-logo project-logo-large"
                            src={activeProject.logo_url}
                            alt={activeProject.title}
                          />
                        ) : null}
                        <div>
                          <span className="panel-label">{activeProject.category || "Project"}</span>
                          <h3>{activeProject.title}</h3>
                          {activeProject.slogan ? (
                            <p className="project-slogan project-slogan-large">{activeProject.slogan}</p>
                          ) : null}
                        </div>
                      </div>
                      <p>{activeProject.description || "No description provided yet."}</p>
                    </div>
                  </div>

                  <aside className="project-page-sidebar">
                    <div className="summary-card">
                      <span className="panel-label">Slug</span>
                      <strong>{activeSlug}</strong>
                      <p>Generated from the project title.</p>
                    </div>
                    <div className="summary-card">
                      <span className="panel-label">Visit project</span>
                      <a
                        className="primary-button project-visit-button"
                        href={activeProject.project_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open live site
                      </a>
                    </div>
                  </aside>
                </div>
              </>
            ) : (
              <div className="submit-locked">
                Project not found. Try going back to the homepage and opening it again.
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">Supabase-powered homepage</p>
                <h1>Publish your AI projects in a clean listing hub.</h1>
                <p className="hero-text">
                  A modern homepage with a strong header, a grounded footer, and
                  project cards rendered directly from your Supabase database and
                  paired with Google sign-in.
                </p>
              </div>
              <div className="hero-panel">
                <p className="panel-label">Session Status</p>
                <strong>
                  {!hasSupabaseCredentials
                    ? "Demo Mode"
                    : session
                      ? "Authenticated"
                      : "Guest Session"}
                </strong>
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
                      <div className="card-title-row">
                        {project.logo_url ? (
                          <img className="project-logo" src={project.logo_url} alt={project.title} />
                        ) : null}
                        <div>
                          <h3>{project.title}</h3>
                          {project.slogan ? (
                            <p className="project-slogan">{project.slogan}</p>
                          ) : null}
                        </div>
                      </div>
                      <p>{project.description || "No description provided yet."}</p>
                      <div className="card-actions">
                        <button className="link-button" onClick={() => openProject(project)} type="button">
                          View details
                        </button>
                        <a href={project.project_url || "#"} target="_blank" rel="noreferrer">
                          Visit →
                        </a>
                      </div>
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
                Use a `projects` table with fields like `id`, `title`, `slogan`,
                `description`, `category`, `project_url`, `image_url`, and `created_at`.
              </p>
              <p>
                For Google sign-in, enable the Google provider in Supabase Auth and
                add your local and production callback URLs in both Supabase and
                Google Cloud Console.
              </p>
              <p>
                To let logged-in users submit projects, add an insert policy for
                authenticated users in Supabase RLS.
              </p>
            </section>
          </>
        )}
      </main>

      <footer className="site-footer" id="contact">
        <p>AI Tools Listing</p>
        <p>Built for fast publishing, simple maintenance, and clean project discovery.</p>
      </footer>

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-project-title"
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Community publishing</p>
                <h2 id="submit-project-title">Submit your project</h2>
              </div>
              <button className="icon-button" onClick={closeModal} type="button">
                Close
              </button>
            </div>

            <form className="project-form" onSubmit={handleProjectSubmit}>
              <div className="modal-steps">
                <div className={`modal-step-pill ${modalStep >= 1 ? "modal-step-pill-active" : ""}`}>
                  <span>1</span>
                  <strong>Information</strong>
                </div>
                <div className={`modal-step-pill ${modalStep >= 2 ? "modal-step-pill-active" : ""}`}>
                  <span>2</span>
                  <strong>Logo & screenshot</strong>
                </div>
                <div className={`modal-step-pill ${modalStep >= 3 ? "modal-step-pill-active" : ""}`}>
                  <span>3</span>
                  <strong>Launch week</strong>
                </div>
              </div>

              <div className="step-meta">
                <span className="panel-label">Step {modalStep} of {totalModalSteps}</span>
              </div>

              {modalStep === 1 ? (
                <>
                  <label className="field">
                    <span>Project title</span>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="AI SEO Bot"
                      type="text"
                    />
                  </label>

                  <label className="field">
                    <span>Category</span>
                    <input
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="Automation"
                      type="text"
                    />
                  </label>

                  <label className="field field-wide">
                    <span>Slogan</span>
                    <input
                      name="slogan"
                      value={formData.slogan}
                      onChange={handleInputChange}
                      placeholder="The fastest way to launch AI workflows"
                      type="text"
                    />
                  </label>

                  <label className="field field-wide">
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe what your project does and why it matters."
                      rows="5"
                    />
                  </label>

                  <label className="field field-wide">
                    <span>Project URL</span>
                    <input
                      name="project_url"
                      value={formData.project_url}
                      onChange={handleInputChange}
                      placeholder="https://your-project.com"
                      type="url"
                    />
                  </label>
                </>
              ) : null}

              {modalStep === 2 ? (
                <div className="field field-wide">
                  <span>Brand assets</span>
                  <input
                    ref={logoInputRef}
                    className="visually-hidden"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, "logo")}
                    type="file"
                  />
                  <input
                    ref={screenshotInputRef}
                    className="visually-hidden"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, "screenshot")}
                    type="file"
                  />
                  <div className="dropzone-grid">
                    <button
                      className="dropzone"
                      onClick={() => handleDropZoneClick("logo_url")}
                      type="button"
                    >
                      <strong>Logo</strong>
                      <span>
                        {logoFile ? logoFile.name : "Click to choose a logo from your computer"}
                      </span>
                    </button>

                    <button
                      className="dropzone"
                      onClick={() => handleDropZoneClick("image_url")}
                      type="button"
                    >
                      <strong>Screenshot</strong>
                      <span>
                        {screenshotFile
                          ? screenshotFile.name
                          : "Click to choose a screenshot from your computer"}
                      </span>
                    </button>
                  </div>
                  <div className="preview-grid">
                    <div className="preview-card">
                      <span className="preview-label">Logo preview</span>
                      {logoFile ? (
                        <img
                          alt="Logo preview"
                          className="preview-image preview-image-logo"
                          src={URL.createObjectURL(logoFile)}
                        />
                      ) : (
                        <div className="preview-placeholder">No logo selected</div>
                      )}
                    </div>
                    <div className="preview-card">
                      <span className="preview-label">Screenshot preview</span>
                      {screenshotFile ? (
                        <img
                          alt="Screenshot preview"
                          className="preview-image"
                          src={URL.createObjectURL(screenshotFile)}
                        />
                      ) : (
                        <div className="preview-placeholder">No screenshot selected</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {modalStep === 3 ? (
                <div className="field field-wide launch-week-card">
                  <span>Launch week</span>
                  <input
                    name="launch_week"
                    value={formData.launch_week}
                    onChange={handleInputChange}
                    type="week"
                  />
                  <p className="launch-week-note">
                    Choose the week when you plan to launch this product.
                  </p>
                </div>
              ) : null}

              <div className="form-actions">
                <div className="form-actions-group">
                  <button className="secondary-button" onClick={closeModal} type="button">
                    Cancel
                  </button>
                  {modalStep > 1 ? (
                    <button className="secondary-button" onClick={handlePreviousStep} type="button">
                      Back
                    </button>
                  ) : null}
                </div>
                {modalStep < totalModalSteps ? (
                  <button className="primary-button" onClick={handleNextStep} type="button">
                    Next
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    disabled={submitStatus === "submitting"}
                    type="submit"
                  >
                    {submitStatus === "submitting" ? "Submitting..." : "Submit project"}
                  </button>
                )}
              </div>

              {submitMessage ? (
                <p
                  className={`form-feedback ${
                    submitStatus === "error" ? "form-feedback-error" : "form-feedback-success"
                  }`}
                >
                  {submitMessage}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
