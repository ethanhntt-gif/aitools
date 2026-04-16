import { useEffect, useRef, useState } from "react";
import { hasSupabaseCredentials, supabase } from "./lib/supabase";
import HomeView from "./components/HomeView";
import { MoonIcon, SparklesIcon, SunIcon } from "./components/icons";
import { CategoryView, DashboardView, ProjectView } from "./components/SecondaryViews";
import SubmitModal from "./components/SubmitModal";
import { Surface, ToastStack } from "./components/ui";

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
    ,
    published: true,
    created_at: "2026-04-01T10:00:00.000Z"
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
    ,
    published: true,
    created_at: "2026-04-03T10:00:00.000Z"
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
    ,
    published: true,
    created_at: "2026-04-05T10:00:00.000Z"
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
const projectsCacheKey = "aitools.projects-cache.v1";
const approvalToastCacheKey = "aitools.approval-toasts.v1";
const themePreferenceKey = "aitools.theme-preference.v1";

const defaultCategoryNames = [
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
    return categoryValue
      .map((item) => {
        if (!item) {
          return "";
        }

        if (typeof item === "string") {
          return item;
        }

        if (typeof item === "object" && item.name) {
          return item.name;
        }

        return "";
      })
      .filter(Boolean);
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

function createDefaultCategoryOptions() {
  return defaultCategoryNames.map((name) => ({
    id: `default-${slugify(name)}`,
    name,
    slug: slugify(name)
  }));
}

function getSelectedCategoryNames(categoryIds, availableCategories) {
  const categoryMap = new Map(availableCategories.map((category) => [category.id, category.name]));

  return categoryIds
    .map((categoryId) => categoryMap.get(categoryId))
    .filter(Boolean);
}

function getProjectCategoryIds(project) {
  if (Array.isArray(project?.categories) && project.categories.length) {
    return project.categories.map((category) => category.id).filter(Boolean);
  }

  return [];
}

function getProjectCategoryNames(project) {
  if (Array.isArray(project?.categories) && project.categories.length) {
    return project.categories.map((category) => category.name).filter(Boolean);
  }

  return getCategoryList(project?.category);
}

function mapCategoryNamesToIds(categoryNames, availableCategories) {
  const categoryMap = new Map(
    availableCategories.map((category) => [category.name.toLowerCase(), category.id])
  );

  return categoryNames
    .map((categoryName) => categoryMap.get(String(categoryName).toLowerCase()))
    .filter(Boolean);
}

function isCategoryMigrationMissing(error) {
  const message = error?.message?.toLowerCase() || "";

  return (
    message.includes("project_categories") ||
    message.includes("categories") ||
    message.includes("relationship") ||
    message.includes("schema cache")
  );
}

function normalizeProject(project) {
  const relationalCategories = Array.isArray(project?.project_categories)
    ? project.project_categories
        .map((entry) => entry?.category ?? entry?.categories ?? entry)
        .filter((category) => category?.id && category?.name)
        .map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug || slugify(category.name)
        }))
    : [];

  return {
    ...project,
    categories: relationalCategories,
    published: Boolean(project?.published),
    deleted: Boolean(project?.deleted),
    created_at: project?.created_at || null
  };
}

function getCurrentWeekValue() {
  const currentDate = new Date();
  const januaryFirst = new Date(Date.UTC(currentDate.getFullYear(), 0, 1));
  const currentUtcDate = new Date(
    Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  );
  const dayOffset = januaryFirst.getUTCDay() || 7;
  januaryFirst.setUTCDate(januaryFirst.getUTCDate() + 1 - dayOffset);

  if (currentUtcDate < januaryFirst) {
    return `${currentDate.getFullYear()}-01`;
  }

  const weekNumber = Math.floor((currentUtcDate - januaryFirst) / 604800000) + 1;
  return `${currentDate.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function App() {
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState(createDefaultCategoryOptions);
  const [theme, setTheme] = useState(() => window.localStorage.getItem(themePreferenceKey) || "dark");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [toasts, setToasts] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const [restoringProjectId, setRestoringProjectId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("home");
  const [activeSlug, setActiveSlug] = useState("");
  const [activePreviewId, setActivePreviewId] = useState("");
  const [activeCategorySlug, setActiveCategorySlug] = useState("");
  const [homeCategoryFilterSlug, setHomeCategoryFilterSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");
  const [visibleProjectsCount, setVisibleProjectsCount] = useState(initialVisibleProjectsCount);
  const [modalStep, setModalStep] = useState(1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const logoInputRef = useRef(null);
  const screenshotInputRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const hasLoadedCachedProjectsRef = useRef(false);
  const previousMyProjectsRef = useRef([]);

  function pushToast(toast) {
    const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((current) => [
      ...current,
      {
        id: toastId,
        ...toast
      }
    ]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toastId));
    }, 5000);
  }

  function dismissToast(toastId) {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  function readApprovalToastCache() {
    try {
      const rawValue = window.localStorage.getItem(approvalToastCacheKey);
      if (!rawValue) {
        return {};
      }

      const parsedValue = JSON.parse(rawValue);
      return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
    } catch (error) {
      console.error("Could not read approval notification cache.", error);
      return {};
    }
  }

  function writeApprovalToastCache(nextValue) {
    try {
      window.localStorage.setItem(approvalToastCacheKey, JSON.stringify(nextValue));
    } catch (error) {
      console.error("Could not update approval notification cache.", error);
    }
  }

  function readCachedProjects() {
    try {
      const rawValue = window.localStorage.getItem(projectsCacheKey);
      if (!rawValue) {
        return [];
      }

      const parsedValue = JSON.parse(rawValue);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (error) {
      console.error("Could not read cached projects.", error);
      return [];
    }
  }

  function writeCachedProjects(nextProjects) {
    try {
      window.localStorage.setItem(projectsCacheKey, JSON.stringify(nextProjects));
    } catch (error) {
      console.error("Could not cache projects.", error);
    }
  }

  async function loadCategories() {
    if (!hasSupabaseCredentials || !supabase) {
      setCategoryOptions(createDefaultCategoryOptions());
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    if (error) {
      console.error("Could not load categories.", error);
      setCategoryOptions(createDefaultCategoryOptions());
      return;
    }

    if (!data?.length) {
      setCategoryOptions(createDefaultCategoryOptions());
      return;
    }

    setCategoryOptions(
      data.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug || slugify(category.name)
      }))
    );
  }

  async function loadProjects() {
    if (!hasSupabaseCredentials || !supabase) {
      setProjects(demoProjects);
      setStatus("ready");
      setMessage("Demo cards are shown until Supabase credentials are configured.");
      return;
    }

    if (!hasLoadedCachedProjectsRef.current) {
      const cachedProjects = readCachedProjects();

      if (cachedProjects.length) {
        setProjects(cachedProjects);
        setStatus("ready");
        setMessage("Showing cached project cards while fresh data loads.");
      } else {
        setStatus("loading");
        setMessage("");
      }

      hasLoadedCachedProjectsRef.current = true;
    } else if (!projects.length) {
      setStatus("loading");
      setMessage("");
    }

    let { data, error } = await supabase
      .from("projects")
      .select("id, title, slogan, description, project_url, image_url, logo_url, owner_id, owner_email, created_at, published, deleted, project_categories(category:categories(id, name, slug))")
      .eq("published", true)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (
      error &&
      (
        error.message?.toLowerCase().includes("published") ||
        error.message?.toLowerCase().includes("deleted") ||
        isCategoryMigrationMissing(error)
      )
    ) {
      const fallbackResponse = await supabase
        .from("projects")
        .select("id, title, slogan, description, project_url, image_url, logo_url, owner_id, owner_email, created_at")
        .order("created_at", { ascending: false });

      data =
        fallbackResponse.data?.map((project) => ({ ...project, published: true, deleted: false })) ?? [];
      error = fallbackResponse.error;
    }

    if (error) {
      setProjects(demoProjects);
      setStatus("error");
      setMessage("Could not load Supabase data, so demo cards are displayed instead.");
      console.error(error);
      return;
    }

    const normalizedProjects = (data ?? []).map(normalizeProject);
    setProjects(normalizedProjects);
    writeCachedProjects(normalizedProjects);
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

    let { data, error } = await supabase
      .from("projects")
      .select("id, title, slogan, description, project_url, image_url, logo_url, owner_id, owner_email, created_at, published, deleted, project_categories(category:categories(id, name, slug))")
      .eq("owner_id", activeSession.user.id)
      .order("created_at", { ascending: false });

    if (
      error &&
      (
        error.message?.toLowerCase().includes("published") ||
        error.message?.toLowerCase().includes("deleted") ||
        isCategoryMigrationMissing(error)
      )
    ) {
      const fallbackResponse = await supabase
        .from("projects")
        .select("id, title, slogan, description, project_url, image_url, logo_url, owner_id, owner_email, created_at")
        .eq("owner_id", activeSession.user.id)
        .order("created_at", { ascending: false });

      data =
        fallbackResponse.data?.map((project) => ({ ...project, published: false, deleted: false })) ?? [];
      error = fallbackResponse.error;
    }

    if (error) {
      console.error(error);
      setMyProjects([]);
      return;
    }

    setMyProjects((data ?? []).map(normalizeProject));
  }

  useEffect(() => {
    const rootElement = document.documentElement;
    rootElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(themePreferenceKey, theme);
  }, [theme]);

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
    loadCategories();
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
        setActivePreviewId("");
        setActiveCategorySlug("");
        setHomeCategoryFilterSlug("");
        return;
      }

      if (path.startsWith("/preview/")) {
        setActiveView("project");
        setActivePreviewId(decodeURIComponent(path.replace("/preview/", "")));
        setActiveSlug("");
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
      setActivePreviewId("");
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

  useEffect(() => {
    if (!session?.user?.id || !myProjects.length) {
      previousMyProjectsRef.current = myProjects;
      return;
    }

    const previousMap = new Map(
      previousMyProjectsRef.current.map((project) => [project.id, Boolean(project.published)])
    );
    const approvalToastCache = readApprovalToastCache();
    let hasCacheUpdate = false;

    myProjects.forEach((project) => {
      const wasPublished = previousMap.get(project.id);
      const isPublished = Boolean(project.published);
      const cacheKey = `${session.user.id}:${project.id}`;

      if (wasPublished === false && isPublished && !approvalToastCache[cacheKey]) {
        pushToast({
          tone: "success",
          title: "Listing approved",
          description: "Your listing has been approved and published."
        });
        approvalToastCache[cacheKey] = true;
        hasCacheUpdate = true;
      }
    });

    if (hasCacheUpdate) {
      writeApprovalToastCache(approvalToastCache);
    }

    previousMyProjectsRef.current = myProjects;
  }, [myProjects, session]);

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
      if (current.category.includes(categoryOption.id)) {
        return {
          ...current,
          category: current.category.filter((item) => item !== categoryOption.id)
        };
      }

      if (current.category.length >= maxCategories) {
        setSubmitStatus("error");
        setSubmitMessage(`You can choose up to ${maxCategories} categories.`);
        return current;
      }

      return {
        ...current,
        category: [...current.category, categoryOption.id]
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

    if (step === 2 && (!logoFile && !formData.logo_url || !screenshotFile && !formData.image_url)) {
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

    if ((!logoFile && !formData.logo_url) || (!screenshotFile && !formData.image_url)) {
      setSubmitStatus("error");
      setSubmitMessage("Please choose both a logo and a screenshot before continuing.");
      return;
    }

    let nextLogoUrl = formData.logo_url;
    if (logoFile) {
      const logoUpload = await uploadAsset(logoFile, "logos");
      if (!logoUpload.success) {
        setSubmitStatus("error");
        setSubmitMessage(logoUpload.message);
        return;
      }

      nextLogoUrl = logoUpload.publicUrl;
    }

    let nextImageUrl = formData.image_url;
    if (screenshotFile) {
      const screenshotUpload = await uploadAsset(screenshotFile, "screenshots");
      if (!screenshotUpload.success) {
        setSubmitStatus("error");
        setSubmitMessage(screenshotUpload.message);
        return;
      }

      nextImageUrl = screenshotUpload.publicUrl;
    }

    const payload = {
      title: formData.title.trim(),
      slogan: formData.slogan.trim(),
      description: formData.description.trim(),
      project_url: formData.project_url.trim(),
      image_url: nextImageUrl,
      logo_url: nextLogoUrl,
      owner_id: session.user.id,
      owner_email: session.user.email
    };

    const projectQuery = editingProject
      ? supabase.from("projects").update(payload).eq("id", editingProject.id).select("id").single()
      : supabase.from("projects").insert(payload).select("id").single();

    const { data: savedProject, error } = await projectQuery;

    if (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        editingProject
          ? "Project update failed. Add Supabase RLS update policy for the owner."
          : "Project submission failed. Check the `projects` table schema and Supabase RLS insert policy."
      );
      console.error(error);
      return;
    }

    const projectId = editingProject?.id || savedProject?.id;
    if (projectId) {
      const { error: deleteJoinError } = await supabase
        .from("project_categories")
        .delete()
        .eq("project_id", projectId);

      if (deleteJoinError && !isCategoryMigrationMissing(deleteJoinError)) {
        setSubmitStatus("error");
        setSubmitMessage("Project saved, but categories could not be updated. Apply the category migration first.");
        console.error(deleteJoinError);
        return;
      }

      if (formData.category.length) {
        const { error: insertJoinError } = await supabase.from("project_categories").insert(
          formData.category.map((categoryId) => ({
            project_id: projectId,
            category_id: categoryId
          }))
        );

        if (insertJoinError && !isCategoryMigrationMissing(insertJoinError)) {
          setSubmitStatus("error");
          setSubmitMessage("Project saved, but categories could not be updated. Apply the category migration first.");
          console.error(insertJoinError);
          return;
        }
      }
    }

    setFormData(initialForm);
    setLogoFile(null);
    setScreenshotFile(null);
    setEditingProject(null);
    setSubmitStatus("success");
    setSubmitMessage(
      editingProject
        ? "Project updated successfully."
        : "Listing submitted for review."
    );
    setIsModalOpen(false);
    if (!editingProject) {
      pushToast({
        tone: "info",
        title: "Listing submitted",
        description: "Listing submitted for review."
      });
    }
    await loadProjects();
    await loadMyProjects(session);
  }

  function openModal() {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setModalStep(1);
    setIsCategoryMenuOpen(false);
    setIsMenuOpen(false);
    setEditingProject(null);
    setFormData(initialForm);
    setLogoFile(null);
    setScreenshotFile(null);
    setIsModalOpen(true);
  }

  function openEditModal(project) {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setModalStep(1);
    setIsCategoryMenuOpen(false);
    setIsMenuOpen(false);
    setEditingProject(project);
    setFormData({
      title: project.title || "",
      slogan: project.slogan || "",
      description: project.description || "",
      category: getProjectCategoryIds(project).length
        ? getProjectCategoryIds(project)
        : [],
      project_url: project.project_url || "",
      image_url: project.image_url || "",
      logo_url: project.logo_url || "",
      launch_week: getCurrentWeekValue()
    });
    setLogoFile(null);
    setScreenshotFile(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setModalStep(1);
    setSubmitStatus("idle");
    setSubmitMessage("");
    setIsCategoryMenuOpen(false);
    setEditingProject(null);
    setFormData(initialForm);
    setLogoFile(null);
    setScreenshotFile(null);
    setIsModalOpen(false);
  }

  async function handleDeleteProject(projectId) {
    if (!supabase || !session) {
      return;
    }

    const projectToDelete = myProjects.find((project) => project.id === projectId);
    if (!projectToDelete) {
      return;
    }

    const confirmed = window.confirm(`Move "${projectToDelete.title}" to deleted items? You can restore it later.`);
    if (!confirmed) {
      return;
    }

    setDeletingProjectId(projectId);
    setMessage("");

    const { error } = await supabase.from("projects").update({ deleted: true }).eq("id", projectId);

    if (error) {
      setMessage("Project deletion failed. Add Supabase RLS update policy for the owner.");
      setStatus("error");
      console.error(error);
      setDeletingProjectId("");
      return;
    }

    if (editingProject?.id === projectId) {
      closeModal();
    }

    setDeletingProjectId("");
    pushToast({
      tone: "info",
      title: "Listing deleted",
      description: "The listing was moved to deleted items and can be restored."
    });
    setDashboardSearchQuery("");
    setStatus("ready");
    await loadProjects();
    await loadMyProjects(session);
  }

  async function handleRestoreProject(projectId) {
    if (!supabase || !session) {
      return;
    }

    setRestoringProjectId(projectId);
    setMessage("");

    const { error } = await supabase.from("projects").update({ deleted: false }).eq("id", projectId);

    if (error) {
      setMessage("Project restore failed. Add Supabase RLS update policy for the owner.");
      setStatus("error");
      console.error(error);
      setRestoringProjectId("");
      return;
    }

    setRestoringProjectId("");
    pushToast({
      tone: "success",
      title: "Listing restored",
      description: "The listing was restored successfully."
    });
    setStatus("ready");
    await loadProjects();
    await loadMyProjects(session);
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
    setActivePreviewId("");
    setActiveCategorySlug("");
    setHomeCategoryFilterSlug("");
    setIsMenuOpen(false);
  }

  function openProjectPreview(project) {
    window.history.pushState({}, "", `/preview/${project.id}`);
    setActiveView("project");
    setActivePreviewId(project.id);
    setActiveSlug("");
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

  function handleDashboardSearchQueryChange(event) {
    setDashboardSearchQuery(event.target.value);
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
    const categories = getProjectCategoryNames(project);
    return categories.length ? categories : ["Project"];
  }

  const userName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    "Signed in";
  const userAvatar = session?.user?.user_metadata?.avatar_url;
  const publicProjects = projects.filter((project) => project.published);
  const previewProject = myProjects.find((project) => project.id === activePreviewId);
  const activeProject = activePreviewId
    ? previewProject || null
    : publicProjects.find((project) => slugify(project.title) === activeSlug);
  const isPreviewProject = Boolean(activePreviewId);
  const allCategoryNames = Array.from(new Set(publicProjects.flatMap((project) => getProjectCategoryNames(project))));
  const activeCategoryName =
    allCategoryNames.find((categoryName) => getCategorySlug(categoryName) === activeCategorySlug) || "";
  const categoryProjects = publicProjects.filter((project) =>
    getProjectCategoryNames(project).some((categoryName) => getCategorySlug(categoryName) === activeCategorySlug)
  );
  const categoryFilteredHomeProjects = homeCategoryFilterSlug
    ? publicProjects.filter((project) =>
        getProjectCategoryNames(project).some(
          (categoryName) => getCategorySlug(categoryName) === homeCategoryFilterSlug
        )
      )
    : publicProjects;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredHomeProjects = normalizedSearchQuery
    ? categoryFilteredHomeProjects.filter((project) => {
        const categoryText = getProjectCategoryNames(project).join(" ");
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
    count: publicProjects.filter((project) => getProjectCategoryNames(project).includes(categoryName)).length
  }));
  const trendingProjects = filteredHomeProjects.slice(0, 3);
  const newlyAddedProjects = filteredHomeProjects.slice(3, 6).length
    ? filteredHomeProjects.slice(3, 6)
    : filteredHomeProjects.slice(0, 3);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(226,232,240,0.65),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#f8fafc_40%,_#f1f5f9_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(30,41,59,0.65),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_38%,_#111827_100%)] dark:text-slate-100">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">AI Tools</p>
                    <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">Listing Hub</p>
                  </div>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={openHome} type="button">
                  Browse Tools
                </button>
                <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={() => scrollToSection("features")} type="button">
                  Features
                </button>
                <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={() => scrollToSection("footer")} type="button">
                  Contact
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  aria-label="Toggle theme"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  onClick={toggleTheme}
                  type="button"
                >
                  {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>
                {hasSupabaseCredentials ? (
                  session ? (
                    <div className="relative">
                      <button
                        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
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
                          <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-300 sm:inline">{userName}</span>
                      </button>
                      {isMenuOpen ? (
                        <Surface className="absolute right-0 top-[calc(100%+12px)] w-64 p-2">
                          <div className="rounded-2xl px-3 py-3">
                            <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{userName}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
                          </div>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={openModal} type="button">
                            Submit Tool
                          </button>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={openDashboard} type="button">
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
                  <span className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 sm:inline">Add Supabase keys to enable sign-in.</span>
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
              dashboardSearchQuery={dashboardSearchQuery}
              handleDashboardSearchQueryChange={handleDashboardSearchQueryChange}
              openHome={openHome}
              openModal={openModal}
              openProjectPreview={openProjectPreview}
              openEditModal={openEditModal}
              handleDeleteProject={handleDeleteProject}
              handleRestoreProject={handleRestoreProject}
              deletingProjectId={deletingProjectId}
              restoringProjectId={restoringProjectId}
              openProject={openProject}
              openCategoryPage={openCategoryPage}
              getProjectCategories={getProjectCategories}
            />
          ) : activeView === "project" ? (
            <ProjectView
              activeProject={activeProject}
              isPreview={isPreviewProject}
              openHome={openHome}
              openCategoryPage={openCategoryPage}
            />
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
              projects={publicProjects}
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
                <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">AI Tools Listing</p>
                <p className="max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                  Your ultimate destination for discovering AI tools.
                </p>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-500 dark:text-slate-400">
                <button className="transition hover:text-slate-950 dark:hover:text-slate-100" onClick={openHome} type="button">Browse</button>
                <button className="transition hover:text-slate-950 dark:hover:text-slate-100" onClick={() => scrollToSection("features")} type="button">Features</button>
                <button className="transition hover:text-slate-950 dark:hover:text-slate-100" onClick={openSubmitFlow} type="button">Submit</button>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
        editingProject={editingProject}
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
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
