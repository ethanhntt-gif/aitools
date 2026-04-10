import { useEffect, useRef, useState } from "react";
import { hasSupabaseCredentials, supabase } from "./lib/supabase";
import HomeView from "./components/HomeView";
import { SparklesIcon } from "./components/icons";
import { CategoryView, DashboardView, ProjectView } from "./components/SecondaryViews";
import SubmitModal from "./components/SubmitModal";
import { Surface } from "./components/ui";

const demoProjects = [
  {
    id: "demo-1",
    title: "AI Outreach Assistant",
    slogan: "Prospecting and follow-ups on autopilot.",
    description: "Automates prospect research, drafts outreach, and tracks conversations.",
    category: "Automation",
    owner_email: "alex@aitools.dev",
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
    owner_email: "maya@aitools.dev",
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
    owner_email: "ethan@aitools.dev",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80"
  }
];

const initialForm = {
  title: "",
  slogan: "",
  description: "",
  category: [],
  project_url: "",
  image_url: "",
  logo_url: "",
  launch_week: ""
};

const storageBucket = "project-assets";
const totalModalSteps = 3;
const maxCategories = 5;
const initialVisibleProjectsCount = 21;

const categoryOptions = [
  "Automation",
  "AI Agents",
  "Content",
  "Marketing",
  "Sales",
  "Customer Support",
  "Productivity",
  "Analytics",
  "Research",
  "Coding",
  "Design",
  "Education",
  "Video",
  "Audio",
  "Image Generation",
  "Data",
  "Finance",
  "Healthcare",
  "Recruiting",
  "Other"
];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCategoryList(categoryValue) {
  if (Array.isArray(categoryValue)) {
    return categoryValue.filter(Boolean);
  }

  if (!categoryValue) {
    return [];
  }

  return String(categoryValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getCategorySlug(categoryValue) {
  return slugify(categoryValue);
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
  const [activeCategorySlug, setActiveCategorySlug] = useState("");
  const [homeCategoryFilterSlug, setHomeCategoryFilterSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleProjectsCount, setVisibleProjectsCount] = useState(initialVisibleProjectsCount);
  const [modalStep, setModalStep] = useState(1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const logoInputRef = useRef(null);
  const screenshotInputRef = useRef(null);
  const categoryMenuRef = useRef(null);

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
      .select("id, title, slogan, description, category, project_url, image_url, logo_url, owner_id, owner_email")
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
      .select("id, title, slogan, description, category, project_url, image_url, logo_url, owner_id, owner_email")
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
        setActiveCategorySlug("");
        setHomeCategoryFilterSlug("");
        return;
      }

      if (path.startsWith("/project/")) {
        setActiveView("project");
        setActiveSlug(decodeURIComponent(path.replace("/project/", "")));
        setActiveCategorySlug("");
        setHomeCategoryFilterSlug("");
        return;
      }

      if (path.startsWith("/category/")) {
        setActiveView("category");
        setActiveCategorySlug(decodeURIComponent(path.replace("/category/", "")));
        setActiveSlug("");
        setHomeCategoryFilterSlug("");
        return;
      }

      setActiveView("home");
      setActiveSlug("");
      setActiveCategorySlug("");
    }

    syncViewFromLocation();
    window.addEventListener("popstate", syncViewFromLocation);

    return () => {
      window.removeEventListener("popstate", syncViewFromLocation);
    };
  }, []);

  useEffect(() => {
    setVisibleProjectsCount(initialVisibleProjectsCount);
  }, [homeCategoryFilterSlug, searchQuery]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!categoryMenuRef.current?.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsCategoryMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
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

  function toggleCategoryMenu() {
    setIsCategoryMenuOpen((current) => !current);
  }

  function selectCategory(categoryOption) {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setFormData((current) => {
      if (current.category.includes(categoryOption)) {
        return {
          ...current,
          category: current.category.filter((item) => item !== categoryOption)
        };
      }

      if (current.category.length >= maxCategories) {
        setSubmitStatus("error");
        setSubmitMessage(`You can choose up to ${maxCategories} categories.`);
        return current;
      }

      return {
        ...current,
        category: [...current.category, categoryOption]
      };
    });
  }

  function validateModalStep(step) {
    if (step === 1) {
      if (!formData.title.trim() || !formData.category.length || !formData.description.trim()) {
        setSubmitStatus("error");
        setSubmitMessage("Fill in the project title, choose at least one category, and add a description.");
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
      category: formData.category.join(", "),
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
    setIsCategoryMenuOpen(false);
    setIsMenuOpen(false);
    setIsModalOpen(true);
  }

  function closeModal() {
    setModalStep(1);
    setSubmitStatus("idle");
    setSubmitMessage("");
    setIsCategoryMenuOpen(false);
    setIsModalOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((current) => !current);
  }

  function openDashboard() {
    setIsMenuOpen(false);
    window.history.pushState({}, "", "/dashboard");
    setActiveView("dashboard");
    setHomeCategoryFilterSlug("");
  }

  function openHome() {
    window.history.pushState({}, "", "/");
    setActiveView("home");
    setActiveSlug("");
    setActiveCategorySlug("");
    setHomeCategoryFilterSlug("");
    setIsMenuOpen(false);
  }

  function openProject(project) {
    const projectSlug = slugify(project.title);
    window.history.pushState({}, "", `/project/${projectSlug}`);
    setActiveView("project");
    setActiveSlug(projectSlug);
    setActiveCategorySlug("");
    setHomeCategoryFilterSlug("");
    setIsMenuOpen(false);
  }

  function openCategoryPage(categoryName) {
    const categorySlug = getCategorySlug(categoryName);
    window.history.pushState({}, "", `/category/${categorySlug}`);
    setActiveView("category");
    setActiveCategorySlug(categorySlug);
    setActiveSlug("");
    setHomeCategoryFilterSlug("");
    setIsMenuOpen(false);
  }

  function toggleHomeCategoryFilter(categoryName) {
    const categorySlug = getCategorySlug(categoryName);
    window.history.pushState({}, "", "/");
    setActiveView("home");
    setActiveSlug("");
    setActiveCategorySlug("");
    setHomeCategoryFilterSlug((current) => (current === categorySlug ? "" : categorySlug));
    setIsMenuOpen(false);
  }

  function handleSearchQueryChange(event) {
    setSearchQuery(event.target.value);
  }

  function showMoreProjects() {
    setVisibleProjectsCount((current) => current + initialVisibleProjectsCount);
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
      return { success: false, message: "You must be signed in to upload files." };
    }

    const extension = file.name.includes(".") ? file.name.split(".").pop() : "png";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `${session.user.id}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from(storageBucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

    if (uploadError) {
      console.error(uploadError);
      return {
        success: false,
        message: "File upload failed. Create the Supabase bucket and storage policies for authenticated uploads."
      };
    }

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(filePath);
    return { success: true, publicUrl: data.publicUrl };
  }

  function openSubmitFlow() {
    if (session) {
      openModal();
      return;
    }

    if (hasSupabaseCredentials) {
      handleGoogleSignIn();
    }
  }

  function scrollToSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function getProjectCategories(project) {
    const categories = getCategoryList(project.category);
    return categories.length ? categories : ["Project"];
  }

  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    "Signed in";
  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const activeProject = projects.find((project) => slugify(project.title) === activeSlug);
  const allCategoryNames = Array.from(new Set(projects.flatMap((project) => getCategoryList(project.category))));
  const activeCategoryName =
    allCategoryNames.find((categoryName) => getCategorySlug(categoryName) === activeCategorySlug) || "";
  const categoryProjects = projects.filter((project) =>
    getCategoryList(project.category).some((categoryName) => getCategorySlug(categoryName) === activeCategorySlug)
  );
  const categoryFilteredHomeProjects = homeCategoryFilterSlug
    ? projects.filter((project) =>
        getCategoryList(project.category).some(
          (categoryName) => getCategorySlug(categoryName) === homeCategoryFilterSlug
        )
      )
    : projects;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredHomeProjects = normalizedSearchQuery
    ? categoryFilteredHomeProjects.filter((project) => {
        const categoryText = getCategoryList(project.category).join(" ");
        return [project.title, project.slogan, categoryText]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearchQuery));
      })
    : categoryFilteredHomeProjects;
  const visibleHomeProjects = filteredHomeProjects.slice(0, visibleProjectsCount);
  const hasMoreHomeProjects = filteredHomeProjects.length > visibleHomeProjects.length;
  const categoryCounts = allCategoryNames.map((categoryName) => ({
    name: categoryName,
    slug: getCategorySlug(categoryName),
    count: projects.filter((project) => getCategoryList(project.category).includes(categoryName)).length
  }));
  const trendingProjects = filteredHomeProjects.slice(0, 3);
  const newlyAddedProjects = filteredHomeProjects.slice(3, 6).length
    ? filteredHomeProjects.slice(3, 6)
    : filteredHomeProjects.slice(0, 3);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(226,232,240,0.65),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#f8fafc_40%,_#f1f5f9_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40">
          <Surface className="px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-4">
                <button className="flex items-center gap-3 text-left" onClick={openHome} type="button">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">AI Tools</p>
                    <p className="text-lg font-semibold tracking-tight text-slate-950">Listing Hub</p>
                  </div>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" onClick={openHome} type="button">
                  Browse Tools
                </button>
                <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" onClick={() => scrollToSection("features")} type="button">
                  Features
                </button>
                <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" onClick={() => scrollToSection("footer")} type="button">
                  Contact
                </button>
              </div>

              <div className="flex items-center gap-3">
                {hasSupabaseCredentials ? (
                  session ? (
                    <div className="relative">
                      <button
                        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300"
                        onClick={toggleMenu}
                        type="button"
                      >
                        {userAvatar ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={userAvatar} alt={userName} />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                            {userName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span className="hidden text-sm font-medium text-slate-700 sm:inline">{userName}</span>
                      </button>
                      {isMenuOpen ? (
                        <Surface className="absolute right-0 top-[calc(100%+12px)] w-64 p-2">
                          <div className="rounded-2xl px-3 py-3">
                            <p className="text-sm font-semibold text-slate-950">{userName}</p>
                            <p className="mt-1 text-xs text-slate-500">{session.user.email}</p>
                          </div>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" onClick={openModal} type="button">
                            Submit Tool
                          </button>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" onClick={openDashboard} type="button">
                            Dashboard
                          </button>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50" onClick={handleSignOut} type="button">
                            Sign out
                          </button>
                        </Surface>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={handleGoogleSignIn}
                      type="button"
                      disabled={authLoading}
                    >
                      {authLoading ? "Checking session..." : "Submit Tool"}
                    </button>
                  )
                ) : (
                  <span className="hidden text-sm font-medium text-slate-500 sm:inline">Add Supabase keys to enable sign-in.</span>
                )}
              </div>
            </div>
          </Surface>
        </header>

        <main className="flex-1 pt-8">
          {activeView === "dashboard" ? (
            <DashboardView
              session={session}
              userName={userName}
              myProjects={myProjects}
              openHome={openHome}
              openModal={openModal}
              openProject={openProject}
              openCategoryPage={openCategoryPage}
              getProjectCategories={getProjectCategories}
            />
          ) : activeView === "project" ? (
            <ProjectView activeProject={activeProject} activeSlug={activeSlug} openHome={openHome} openCategoryPage={openCategoryPage} />
          ) : activeView === "category" ? (
            <CategoryView
              activeCategoryName={activeCategoryName}
              categoryProjects={categoryProjects}
              categoryCounts={categoryCounts}
              activeCategorySlug={activeCategorySlug}
              openHome={openHome}
              openProject={openProject}
              openCategoryPage={openCategoryPage}
              getProjectCategories={getProjectCategories}
            />
          ) : (
            <HomeView
              status={status}
              trendingProjects={trendingProjects}
              newlyAddedProjects={newlyAddedProjects}
              filteredHomeProjects={filteredHomeProjects}
              projects={projects}
              categoryCounts={categoryCounts}
              homeCategoryFilterSlug={homeCategoryFilterSlug}
              searchQuery={searchQuery}
              visibleHomeProjects={visibleHomeProjects}
              hasMoreHomeProjects={hasMoreHomeProjects}
              openProject={openProject}
              openCategoryPage={openCategoryPage}
              toggleHomeCategoryFilter={toggleHomeCategoryFilter}
              setHomeCategoryFilterSlug={setHomeCategoryFilterSlug}
              handleSearchQueryChange={handleSearchQueryChange}
              showMoreProjects={showMoreProjects}
              scrollToSection={scrollToSection}
              openSubmitFlow={openSubmitFlow}
              getProjectCategories={getProjectCategories}
            />
          )}
        </main>

        <footer className="mt-20" id="footer">
          <Surface className="px-6 py-8 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-3">
                <p className="text-lg font-semibold tracking-tight text-slate-950">AI Tools Listing</p>
                <p className="max-w-xl text-sm leading-7 text-slate-600">
                  Your ultimate destination for discovering AI tools.
                </p>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-500">
                <button className="transition hover:text-slate-950" onClick={openHome} type="button">Browse</button>
                <button className="transition hover:text-slate-950" onClick={() => scrollToSection("features")} type="button">Features</button>
                <button className="transition hover:text-slate-950" onClick={openSubmitFlow} type="button">Submit</button>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
              Copyright {new Date().getFullYear()} AI Tools Listing. All rights reserved.
            </div>
          </Surface>
        </footer>
      </div>

      <SubmitModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        modalStep={modalStep}
        totalModalSteps={totalModalSteps}
        submitStatus={submitStatus}
        submitMessage={submitMessage}
        formData={formData}
        categoryOptions={categoryOptions}
        maxCategories={maxCategories}
        isCategoryMenuOpen={isCategoryMenuOpen}
        categoryMenuRef={categoryMenuRef}
        toggleCategoryMenu={toggleCategoryMenu}
        selectCategory={selectCategory}
        handleInputChange={handleInputChange}
        logoInputRef={logoInputRef}
        screenshotInputRef={screenshotInputRef}
        handleFileChange={handleFileChange}
        handleDropZoneClick={handleDropZoneClick}
        logoFile={logoFile}
        screenshotFile={screenshotFile}
        handlePreviousStep={handlePreviousStep}
        handleNextStep={handleNextStep}
        handleProjectSubmit={handleProjectSubmit}
      />
    </div>
  );
}

export default App;
