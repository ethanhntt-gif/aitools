import { useEffect, useRef, useState } from "react";
import { hasSupabaseCredentials, supabase } from "./lib/supabase";
import HomeView from "./components/HomeView";
import { MoonIcon, SparklesIcon, SunIcon } from "./components/icons";
import { CategoryView, DashboardView, LegalPageView, ProjectView, ProjectsView } from "./components/SecondaryViews";
import SubmitModal from "./components/SubmitModal";
import { Surface, ToastStack } from "./components/ui";
import useAppRouter from "./hooks/useAppRouter";
import useProjectsStore from "./hooks/useProjectsStore";
import {
  initialForm,
  initialProfileForm,
  initialVisibleProjectsCount,
  launchWeekCapacity,
  maxCategories,
  storageBucket,
  themePreferenceKey,
  totalModalSteps
} from "./constants/app";
import {
  createFallbackProfile,
  formatLaunchSlotDate,
  getCategorySlug,
  getLaunchDateValueFromWeek,
  getLaunchSlotRange,
  getLaunchWeekFromDate,
  getProjectCategoryIds,
  getProjectCategoryNames,
  getSelectedCategoryNames,
  getUpcomingLaunchSlots,
  isCategoryMigrationMissing,
  isLaunchScheduleMigrationMissing,
  isPricingMigrationMissing,
  isProfileMigrationMissing,
  mapCategoryNamesToIds,
  normalizePricingModel,
  normalizeProfile,
  slugify
} from "./lib/app-utils";
import {
  getCategoryCounts,
  getCategoryFilteredProjects,
  getCategoryProjects,
  getCurrentLaunchProjects,
  getFilteredProjectsBySearch,
  getLaunchWeekCounts,
  getProjectsWithVotes,
  getPublicProjects
} from "./lib/project-selectors";
import privacyPolicyContent from "../Privacy Policy.md?raw";
import termsOfServiceContent from "../Terms of Service.md?raw";

function App() {
  const [votingProjectId, setVotingProjectId] = useState("");
  const [theme, setTheme] = useState(() => window.localStorage.getItem(themePreferenceKey) || "dark");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [profileSaveStatus, setProfileSaveStatus] = useState("idle");
  const [profileSaveMessage, setProfileSaveMessage] = useState("");
  const [profileLogoFile, setProfileLogoFile] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [invalidFields, setInvalidFields] = useState({});
  const [toasts, setToasts] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState("");
  const [restoringProjectId, setRestoringProjectId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");
  const [visibleProjectsCount, setVisibleProjectsCount] = useState(initialVisibleProjectsCount);
  const [modalStep, setModalStep] = useState(1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isPricingMenuOpen, setIsPricingMenuOpen] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const logoInputRef = useRef(null);
  const screenshotInputRef = useRef(null);
  const profileLogoInputRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const pricingMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const {
    activeView,
    activeSlug,
    activePreviewId,
    activeAuthorId,
    activeCategorySlug,
    homeCategoryFilterSlug,
    setHomeCategoryFilterSlug,
    openDashboard: navigateToDashboard,
    openProjectsPage: navigateToProjectsPage,
    openHome: navigateToHome,
    openTermsPage: navigateToTermsPage,
    openPrivacyPage: navigateToPrivacyPage,
    openProject: navigateToProject,
    openProjectPreview: navigateToProjectPreview,
    openCategoryPage: navigateToCategoryPage,
    openAuthorDashboard,
    toggleHomeCategoryFilter: toggleCategoryFilterRoute
  } = useAppRouter(session?.user?.id || "");
  const {
    projects,
    myProjects,
    voteCounts,
    votedProjectIds,
    isVotingReady,
    categoryOptions,
    status,
    message,
    authorProfiles,
    ownProfile,
    setStatus,
    setMessage,
    setAuthorProfiles,
    setOwnProfile,
    refreshProjectData,
    loadAuthorProfile,
    handleVote: handleProjectVote,
    deleteProject,
    restoreProject
  } = useProjectsStore({
    session,
    activeAuthorId,
    activePreviewId,
    activeSlug,
    pushToast,
    onOwnProfileSync: setProfileForm,
    onOwnProfileLogoReset: () => setProfileLogoFile(null)
  });

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
    setVisibleProjectsCount(initialVisibleProjectsCount);
  }, [homeCategoryFilterSlug, searchQuery]);

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!categoryMenuRef.current?.contains(event.target)) {
        setIsCategoryMenuOpen(false);
      }

      if (!pricingMenuRef.current?.contains(event.target)) {
        setIsPricingMenuOpen(false);
      }

      if (!userMenuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsCategoryMenuOpen(false);
        setIsPricingMenuOpen(false);
        setIsMenuOpen(false);
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
    openHome();
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setInvalidFields((current) => {
      if (!current[name]) {
        return current;
      }

      const nextValue = { ...current };
      delete nextValue[name];
      return nextValue;
    });
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleProfileInputChange(event) {
    const { name, value } = event.target;
    setProfileSaveStatus("idle");
    setProfileSaveMessage("");
    setProfileForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetProfileSaveFeedback() {
    setProfileSaveStatus("idle");
    setProfileSaveMessage("");
  }

  function handleProfileLogoFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setProfileSaveStatus("idle");
    setProfileSaveMessage("");
    setProfileLogoFile(file);
  }

  function toggleCategoryMenu() {
    setIsCategoryMenuOpen((current) => !current);
    setIsPricingMenuOpen(false);
  }

  function togglePricingMenu() {
    setIsPricingMenuOpen((current) => !current);
    setIsCategoryMenuOpen(false);
  }

  function selectCategory(categoryOption) {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setInvalidFields((current) => {
      if (!current.category) {
        return current;
      }

      const nextValue = { ...current };
      delete nextValue.category;
      return nextValue;
    });
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

  function selectPricingModel(pricingModel) {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setInvalidFields((current) => {
      if (!current.pricing_model) {
        return current;
      }

      const nextValue = { ...current };
      delete nextValue.pricing_model;
      return nextValue;
    });
    setFormData((current) => ({
      ...current,
      pricing_model: pricingModel
    }));
    setIsPricingMenuOpen(false);
  }

  function validateModalStep(step) {
    if (step === 1) {
      const nextInvalidFields = {
        title: !formData.title.trim(),
        project_url: !formData.project_url.trim(),
        pricing_model: !normalizePricingModel(formData.pricing_model),
        category: !formData.category.length,
        description: !formData.description.trim()
      };

      if (Object.values(nextInvalidFields).some(Boolean)) {
        setInvalidFields(nextInvalidFields);
        setSubmitStatus("error");
        setSubmitMessage("");
        return false;
      }
    }

    if (step === 2 && (!logoFile && !formData.logo_url || !screenshotFile && !formData.image_url)) {
      setInvalidFields({
        logo_url: !logoFile && !formData.logo_url,
        image_url: !screenshotFile && !formData.image_url
      });
      setSubmitStatus("error");
      setSubmitMessage("");
      return false;
    }

    if (step === 3 && !formData.launch_week) {
      setInvalidFields({
        launch_week: true
      });
      setSubmitStatus("error");
      setSubmitMessage("");
      return false;
    }

    if (step === 3 && (!Number.isInteger(Number(formData.launch_week)) || Number(formData.launch_week) < 1)) {
      setInvalidFields({
        launch_week: true
      });
      setSubmitStatus("error");
      setSubmitMessage("");
      return false;
    }

    setInvalidFields({});
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
    if (event?.preventDefault) {
      event.preventDefault();
    }

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
      setInvalidFields({
        logo_url: !logoFile && !formData.logo_url,
        image_url: !screenshotFile && !formData.image_url
      });
      setSubmitStatus("error");
      setSubmitMessage("");
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
      category: getSelectedCategoryNames(formData.category, categoryOptions).join(", "),
      pricing_model: normalizePricingModel(formData.pricing_model),
      project_url: formData.project_url.trim(),
      image_url: nextImageUrl,
      logo_url: nextLogoUrl,
      launch_week: Number(formData.launch_week),
      owner_id: session.user.id,
      owner_email: session.user.email
    };

    const runProjectSave = async (nextPayload) => (
      editingProject
        ? supabase.from("projects").update(nextPayload).eq("id", editingProject.id).select("id").single()
        : supabase.from("projects").insert(nextPayload).select("id").single()
    );

    let { data: savedProject, error } = await runProjectSave(payload);

    if (error && (isPricingMigrationMissing(error) || isCategoryMigrationMissing(error))) {
      const fallbackPayload = { ...payload };

      if (isPricingMigrationMissing(error)) {
        delete fallbackPayload.pricing_model;
      }

      if (isCategoryMigrationMissing(error)) {
        delete fallbackPayload.category;
      }

      ({ data: savedProject, error } = await runProjectSave(fallbackPayload));
    }

    if (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        isLaunchScheduleMigrationMissing(error)
          ? "Project save failed because the `launch_week` column is missing. Run the latest `supabase/projects.sql` migration."
          : isCategoryMigrationMissing(error)
            ? "Project save failed because the legacy `category` column is missing. Run the latest `supabase/projects.sql` migration."
          : isPricingMigrationMissing(error)
            ? "Project save failed because the `pricing_model` column is missing. Run the latest `supabase/projects.sql` migration."
          : editingProject
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
    setSubmitStatus("success");
    setSubmitMessage(
      editingProject
        ? "Project updated successfully."
        : "Listing submitted for review."
    );
    if (!editingProject) {
      pushToast({
        tone: "info",
        title: "Listing submitted",
        description: "Listing submitted for review."
      });
    }
    await refreshProjectData(session);
  }

  async function handleProfileSave(event) {
    event.preventDefault();

    if (!session?.user?.id) {
      setProfileSaveStatus("error");
      setProfileSaveMessage("Sign in before updating your author profile.");
      return;
    }

    const fallbackProfile = createFallbackProfile({
      ownerId: session.user.id,
      ownerEmail: session.user.email || "",
      sessionUser: session.user
    });

    const payload = {
      owner_id: session.user.id,
      owner_email: session.user.email || "",
      display_name: profileForm.display_name.trim() || fallbackProfile.display_name,
      bio: profileForm.bio.trim(),
      avatar_url: profileForm.avatar_url.trim(),
      updated_at: new Date().toISOString()
    };

    if (profileLogoFile) {
      const logoUpload = await uploadAsset(profileLogoFile, "profiles");
      if (!logoUpload.success) {
        setProfileSaveStatus("error");
        setProfileSaveMessage(logoUpload.message);
        return;
      }

      payload.avatar_url = logoUpload.publicUrl;
    }

    if (!hasSupabaseCredentials || !supabase) {
      const normalizedProfile = normalizeProfile(payload, fallbackProfile);
      setOwnProfile(normalizedProfile);
      setAuthorProfiles((current) => ({
        ...current,
        [payload.owner_id]: normalizedProfile
      }));
      setProfileSaveStatus("success");
      setProfileSaveMessage("Demo mode: author profile updated locally for this session.");
      return;
    }

    setProfileSaveStatus("saving");
    setProfileSaveMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "owner_id" })
      .select("owner_id, owner_email, display_name, headline, bio, avatar_url, created_at, updated_at")
      .single();

    if (error) {
      setProfileSaveStatus("error");
      setProfileSaveMessage(
        isProfileMigrationMissing(error)
          ? "Run the author profile migration first to save profile details."
          : "Could not save your author profile right now."
      );
      console.error(error);
      return;
    }

    const normalizedProfile = normalizeProfile(data, fallbackProfile);
    setOwnProfile(normalizedProfile);
    setAuthorProfiles((current) => ({
      ...current,
      [payload.owner_id]: normalizedProfile
    }));
    setProfileForm({
      display_name: normalizedProfile.display_name,
      bio: normalizedProfile.bio,
      avatar_url: normalizedProfile.avatar_url
    });
    setProfileLogoFile(null);
    setProfileSaveStatus("success");
    setProfileSaveMessage("Author profile updated.");
  }

  function openModal() {
    setSubmitStatus("idle");
    setSubmitMessage("");
    setModalStep(1);
    setIsCategoryMenuOpen(false);
    setIsPricingMenuOpen(false);
    setInvalidFields({});
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
    setIsPricingMenuOpen(false);
    setInvalidFields({});
    setIsMenuOpen(false);
    setEditingProject(project);
    setFormData({
      title: project.title || "",
      slogan: project.slogan || "",
      description: project.description || "",
      category: getProjectCategoryIds(project).length
        ? getProjectCategoryIds(project)
        : [],
      pricing_model: normalizePricingModel(project.pricing_model),
      project_url: project.project_url || "",
      image_url: project.image_url || "",
      logo_url: project.logo_url || "",
      launch_week: project.launch_week ? String(project.launch_week) : ""
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
    setIsPricingMenuOpen(false);
    setInvalidFields({});
    setEditingProject(null);
    setFormData(initialForm);
    setLogoFile(null);
    setScreenshotFile(null);
    setIsModalOpen(false);
  }

  async function handleDeleteProject(projectId) {
    setDeletingProjectId(projectId);
    const result = await deleteProject(projectId);

    if (result.success && editingProject?.id === projectId) {
      closeModal();
    }

    setDeletingProjectId("");
    if (result.success) {
      setDashboardSearchQuery("");
    }
  }

  async function handleRestoreProject(projectId) {
    setRestoringProjectId(projectId);
    await restoreProject(projectId);
    setRestoringProjectId("");
  }

  function toggleMenu() {
    setIsMenuOpen((current) => !current);
  }

  function openDashboard() {
    setIsMenuOpen(false);
    navigateToDashboard();
  }

  function openProjectsPage() {
    setIsMenuOpen(false);
    navigateToProjectsPage();
  }

  function openHome() {
    setIsMenuOpen(false);
    navigateToHome();
  }

  function openTermsPage() {
    setIsMenuOpen(false);
    navigateToTermsPage();
  }

  function openPrivacyPage() {
    setIsMenuOpen(false);
    navigateToPrivacyPage();
  }

  function openProject(project) {
    setIsMenuOpen(false);
    navigateToProject(project);
  }

  function openProjectPreview(project) {
    setIsMenuOpen(false);
    navigateToProjectPreview(project);
  }

  function openCategoryPage(categoryName) {
    setIsMenuOpen(false);
    navigateToCategoryPage(categoryName);
  }

  function toggleHomeCategoryFilter(categoryName) {
    setIsMenuOpen(false);
    toggleCategoryFilterRoute(categoryName);
  }

  function openAuthorProfile(ownerId) {
    if (!ownerId) {
      return;
    }

    const fallbackProject =
      [...projects, ...myProjects].find((project) => project.owner_id === ownerId) || null;
    openAuthorDashboard(ownerId);
    setIsMenuOpen(false);
    loadAuthorProfile(ownerId, fallbackProject);
  }

  function handleSearchQueryChange(event) {
    setSearchQuery(event.target.value);
  }

  async function handleVote(projectId) {
    setVotingProjectId(projectId);
    await handleProjectVote(projectId, handleGoogleSignIn);
    setVotingProjectId("");
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
      setInvalidFields((current) => {
        if (!current.logo_url) {
          return current;
        }

        const nextValue = { ...current };
        delete nextValue.logo_url;
        return nextValue;
      });
      setLogoFile(file);
      return;
    }

    setInvalidFields((current) => {
      if (!current.image_url) {
        return current;
      }

      const nextValue = { ...current };
      delete nextValue.image_url;
      return nextValue;
    });
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
  const headerProfile = ownProfile || (session?.user?.id ? authorProfiles[session.user.id] : null);
  const userAvatar = headerProfile?.avatar_url || session?.user?.user_metadata?.avatar_url;
  const launchYear = new Date().getFullYear();
  const upcomingLaunchSlots = getUpcomingLaunchSlots();
  const uniqueProjectsForLaunchCapacity = Array.from(
    new Map(
      [...projects, ...myProjects]
        .filter((project) => project?.id != null)
        .map((project) => [project.id, project])
    ).values()
  );
  const launchWeekCounts = getLaunchWeekCounts(
    uniqueProjectsForLaunchCapacity
      .filter((project) => !project?.deleted)
      .filter((project) => project?.id !== editingProject?.id)
  );
  const getLaunchSlotMeta = (week) => {
    const bookedCount = launchWeekCounts[week] || 0;

    return {
      bookedCount,
      capacity: launchWeekCapacity,
      remainingCount: Math.max(0, launchWeekCapacity - bookedCount),
      isFull: bookedCount >= launchWeekCapacity
    };
  };
  const selectedLaunchWeek = Number(formData.launch_week);
  const launchSlotOptions =
    selectedLaunchWeek > 0 && !upcomingLaunchSlots.some((slot) => slot.week === selectedLaunchWeek)
      ? [
          {
            week: selectedLaunchWeek,
            dateValue: getLaunchDateValueFromWeek(selectedLaunchWeek, launchYear),
            dateLabel: formatLaunchSlotDate(getLaunchDateValueFromWeek(selectedLaunchWeek, launchYear)),
            ...getLaunchSlotRange(selectedLaunchWeek, launchYear),
            ...getLaunchSlotMeta(selectedLaunchWeek)
          },
          ...upcomingLaunchSlots.map((slot) => ({
            ...slot,
            ...getLaunchSlotMeta(slot.week)
          }))
        ]
      : upcomingLaunchSlots.map((slot) => ({
          ...slot,
          ...getLaunchSlotMeta(slot.week)
        }));
  const projectsWithVotes = getProjectsWithVotes(projects, voteCounts, votedProjectIds);
  const publicProjects = getPublicProjects(projectsWithVotes);
  const previewProject = myProjects.find((project) => project.id === activePreviewId);
  const activeProject = activePreviewId
    ? previewProject || null
    : publicProjects.find((project) => slugify(project.title) === activeSlug);
  const activeProjectAuthorProfile = activeProject?.owner_id
    ? authorProfiles[activeProject.owner_id] ||
      createFallbackProfile({
        ownerId: activeProject.owner_id,
        ownerEmail: activeProject.owner_email || "",
        project: activeProject,
        sessionUser: session?.user?.id === activeProject.owner_id ? session.user : null
      })
    : null;
  const dashboardOwnerId = activeAuthorId || session?.user?.id || "";
  const dashboardProjects = publicProjects.filter((project) => project.owner_id === dashboardOwnerId);
  const dashboardFallbackProject =
    dashboardProjects[0] ||
    myProjects.find((project) => project.owner_id === dashboardOwnerId) ||
    null;
  const dashboardProfile =
    authorProfiles[dashboardOwnerId] ||
    (dashboardFallbackProject
      ? createFallbackProfile({
          ownerId: dashboardOwnerId,
          ownerEmail: dashboardFallbackProject.owner_email || "",
          project: dashboardFallbackProject,
          sessionUser: session?.user?.id === dashboardOwnerId ? session.user : null
        })
      : null);
  const isOwnDashboard = Boolean(session?.user?.id && dashboardOwnerId === session.user.id);
  const isPreviewProject = Boolean(activePreviewId);
  const currentLaunchWeek = getLaunchWeekFromDate(new Date());
  const currentLaunchRange = getLaunchSlotRange(currentLaunchWeek, launchYear);
  const thisWeekProjects = getCurrentLaunchProjects(publicProjects, currentLaunchWeek, currentLaunchRange);
  const launchLeader = thisWeekProjects[0] || null;
  const allCategoryNames = Array.from(new Set(publicProjects.flatMap((project) => getProjectCategoryNames(project))));
  const activeCategoryName =
    allCategoryNames.find((categoryName) => getCategorySlug(categoryName) === activeCategorySlug) || "";
  const categoryProjects = getCategoryProjects(
    publicProjects,
    activeCategorySlug,
    getProjectCategoryNames,
    getCategorySlug
  );
  const categoryFilteredHomeProjects = getCategoryFilteredProjects(
    publicProjects,
    homeCategoryFilterSlug,
    getProjectCategoryNames,
    getCategorySlug
  );
  const filteredHomeProjects = getFilteredProjectsBySearch(
    categoryFilteredHomeProjects,
    searchQuery,
    getProjectCategoryNames
  );
  const visibleHomeProjects = filteredHomeProjects.slice(0, visibleProjectsCount);
  const hasMoreHomeProjects = filteredHomeProjects.length > visibleHomeProjects.length;
  const categoryCounts = getCategoryCounts(publicProjects, allCategoryNames, getProjectCategoryNames);
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
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-400">AI Launches</p>
                    <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">Weekly Board</p>
                  </div>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={openProjectsPage} type="button">
                  All Projects
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
                    <div className="relative" ref={userMenuRef}>
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
                        <Surface className="absolute right-0 top-[calc(100%+12px)] w-64 !bg-white dark:!bg-slate-950 !backdrop-blur-none p-2">
                          <div className="rounded-2xl px-3 py-3">
                            <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                              {headerProfile?.display_name || userName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
                          </div>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={openModal} type="button">
                            Submit Tool
                          </button>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={openDashboard} type="button">
                            Dashboard
                          </button>
                          <button className="w-full rounded-2xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10" onClick={handleSignOut} type="button">
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
              ownProfile={ownProfile}
              dashboardProfile={dashboardProfile}
              dashboardProjects={isOwnDashboard ? myProjects : dashboardProjects}
              isOwnDashboard={isOwnDashboard}
              profileForm={profileForm}
              profileLogoFile={profileLogoFile}
              profileSaveStatus={profileSaveStatus}
              profileSaveMessage={profileSaveMessage}
              resetProfileSaveFeedback={resetProfileSaveFeedback}
              dashboardSearchQuery={dashboardSearchQuery}
              handleDashboardSearchQueryChange={handleDashboardSearchQueryChange}
              handleProfileInputChange={handleProfileInputChange}
              handleProfileLogoFileChange={handleProfileLogoFileChange}
              handleProfileSave={handleProfileSave}
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
              profileLogoInputRef={profileLogoInputRef}
            />
          ) : activeView === "projects" ? (
            <ProjectsView
              status={status}
              filteredProjects={filteredHomeProjects}
              projects={publicProjects}
              categoryCounts={categoryCounts}
              homeCategoryFilterSlug={homeCategoryFilterSlug}
              searchQuery={searchQuery}
              visibleProjects={visibleHomeProjects}
              hasMoreProjects={hasMoreHomeProjects}
              openHome={openHome}
              openProject={openProject}
              openCategoryPage={openCategoryPage}
              toggleHomeCategoryFilter={toggleHomeCategoryFilter}
              setHomeCategoryFilterSlug={setHomeCategoryFilterSlug}
              handleSearchQueryChange={handleSearchQueryChange}
              showMoreProjects={showMoreProjects}
              openSubmitFlow={openSubmitFlow}
              getProjectCategories={getProjectCategories}
            />
          ) : activeView === "project" ? (
            <ProjectView
              activeProject={activeProject}
              activeAuthorProfile={activeProjectAuthorProfile}
              isPreview={isPreviewProject}
              openHome={openHome}
              openCategoryPage={openCategoryPage}
              openAuthorProfile={openAuthorProfile}
              getProjectCategories={getProjectCategories}
              openSubmitFlow={openSubmitFlow}
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
          ) : activeView === "terms" ? (
            <LegalPageView
              title="Terms of Service"
              documentContent={termsOfServiceContent}
              openHome={openHome}
            />
          ) : activeView === "privacy" ? (
            <LegalPageView
              title="Privacy Policy"
              documentContent={privacyPolicyContent}
              openHome={openHome}
            />
          ) : (
            <HomeView
              status={status}
              currentLaunchWeek={currentLaunchWeek}
              currentLaunchRange={currentLaunchRange}
              thisWeekProjects={thisWeekProjects}
              launchLeader={launchLeader}
              isVotingReady={isVotingReady}
              votingProjectId={votingProjectId}
              openProject={openProject}
              openProjectsPage={openProjectsPage}
              openCategoryPage={openCategoryPage}
              openSubmitFlow={openSubmitFlow}
              getProjectCategories={getProjectCategories}
              handleVote={handleVote}
              hasSupabaseCredentials={hasSupabaseCredentials}
              session={session}
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
                <button className="transition hover:text-slate-950 dark:hover:text-slate-100" onClick={openProjectsPage} type="button">All Projects</button>
                <button className="transition hover:text-slate-950 dark:hover:text-slate-100" onClick={openSubmitFlow} type="button">Submit</button>
                <button className="transition hover:text-slate-950 dark:hover:text-slate-100" onClick={openTermsPage} type="button">Terms of Service</button>
                <button className="transition hover:text-slate-950 dark:hover:text-slate-100" onClick={openPrivacyPage} type="button">Privacy Policy</button>
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
        isPricingMenuOpen={isPricingMenuOpen}
        pricingMenuRef={pricingMenuRef}
        togglePricingMenu={togglePricingMenu}
        selectPricingModel={selectPricingModel}
        invalidFields={invalidFields}
        handleInputChange={handleInputChange}
        launchSlotOptions={launchSlotOptions}
        launchYear={launchYear}
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
