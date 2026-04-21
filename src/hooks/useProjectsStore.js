import { useEffect, useRef, useState } from "react";
import { demoVotesCacheKey, approvalToastCacheKey, initialProfileForm, projectsCacheKey } from "../constants/app";
import { demoProfiles, demoProjects } from "../data/demo-content";
import {
  createDefaultCategoryOptions,
  createFallbackProfile,
  isCategoryMigrationMissing,
  isLaunchScheduleMigrationMissing,
  isPricingMigrationMissing,
  isProfileMigrationMissing,
  isVotingMigrationMissing,
  normalizeNumericId,
  normalizeProfile,
  normalizeProject,
  slugify
} from "../lib/app-utils";
import { hasSupabaseCredentials, supabase } from "../lib/supabase";

function readJsonObject(key, fallbackValue) {
  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) {
      return fallbackValue;
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === "object" ? parsedValue : fallbackValue;
  } catch (error) {
    console.error(`Could not read ${key}.`, error);
    return fallbackValue;
  }
}

function writeJsonObject(key, value, message) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(message, error);
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

export default function useProjectsStore({
  session,
  activeAuthorId,
  activePreviewId,
  activeSlug,
  pushToast,
  onOwnProfileSync,
  onOwnProfileLogoReset
}) {
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [votedProjectIds, setVotedProjectIds] = useState([]);
  const [isVotingReady, setIsVotingReady] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState(createDefaultCategoryOptions);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [authorProfiles, setAuthorProfiles] = useState({});
  const [ownProfile, setOwnProfile] = useState(null);

  const hasLoadedCachedProjectsRef = useRef(false);
  const previousMyProjectsRef = useRef([]);
  const authorProfilesRef = useRef({});
  const projectsRef = useRef([]);
  const myProjectsRef = useRef([]);

  useEffect(() => {
    authorProfilesRef.current = authorProfiles;
  }, [authorProfiles]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    myProjectsRef.current = myProjects;
  }, [myProjects]);

  function readApprovalToastCache() {
    return readJsonObject(approvalToastCacheKey, {});
  }

  function writeApprovalToastCache(nextValue) {
    writeJsonObject(approvalToastCacheKey, nextValue, "Could not update approval notification cache.");
  }

  function readDemoVotes() {
    return readJsonObject(demoVotesCacheKey, {});
  }

  function writeDemoVotes(nextValue) {
    writeJsonObject(demoVotesCacheKey, nextValue, "Could not update demo votes.");
  }

  async function loadVotes(projectList, activeSession = session) {
    const projectIds = projectList.map((project) => project.id).filter(Boolean);

    if (!projectIds.length) {
      setVoteCounts({});
      setVotedProjectIds([]);
      setIsVotingReady(true);
      return;
    }

    if (!hasSupabaseCredentials || !supabase) {
      const demoVotes = readDemoVotes();
      const nextVoteCounts = projectList.reduce((result, project) => {
        result[project.id] = Number(project.vote_count) || 0;
        return result;
      }, {});

      const votedIds = Object.entries(demoVotes)
        .filter(([, value]) => Boolean(value))
        .map(([projectId]) => projectId);

      votedIds.forEach((projectId) => {
        if (typeof nextVoteCounts[projectId] === "number") {
          nextVoteCounts[projectId] += 1;
        }
      });

      setVoteCounts(nextVoteCounts);
      setVotedProjectIds(votedIds);
      setIsVotingReady(true);
      return;
    }

    const { data: votes, error: votesError } = await supabase
      .from("project_votes")
      .select("project_id")
      .in("project_id", projectIds);

    if (votesError) {
      if (isVotingMigrationMissing(votesError)) {
        setVoteCounts(projectList.reduce((result, project) => {
          result[project.id] = 0;
          return result;
        }, {}));
        setVotedProjectIds([]);
        setIsVotingReady(false);
        return;
      }

      console.error(votesError);
      return;
    }

    const nextVoteCounts = votes.reduce((result, vote) => {
      const normalizedProjectId = normalizeNumericId(vote.project_id);
      result[normalizedProjectId] = (result[normalizedProjectId] || 0) + 1;
      return result;
    }, {});

    projectIds.forEach((projectId) => {
      if (typeof nextVoteCounts[projectId] !== "number") {
        nextVoteCounts[projectId] = 0;
      }
    });

    let nextVotedProjectIds = [];

    if (activeSession?.user?.id) {
      const { data: userVotes, error: userVotesError } = await supabase
        .from("project_votes")
        .select("project_id")
        .eq("user_id", activeSession.user.id)
        .in("project_id", projectIds);

      if (userVotesError) {
        if (isVotingMigrationMissing(userVotesError)) {
          setVoteCounts(nextVoteCounts);
          setVotedProjectIds([]);
          setIsVotingReady(false);
          return;
        }

        console.error(userVotesError);
      } else {
        nextVotedProjectIds = userVotes.map((vote) => normalizeNumericId(vote.project_id));
      }
    }

    setVoteCounts(nextVoteCounts);
    setVotedProjectIds(nextVotedProjectIds);
    setIsVotingReady(true);
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

  async function loadOwnProfile(activeSession = session) {
    if (!activeSession?.user?.id) {
      setOwnProfile(null);
      onOwnProfileSync?.(initialProfileForm);
      onOwnProfileLogoReset?.();
      return;
    }

    const fallbackProfile = createFallbackProfile({
      ownerId: activeSession.user.id,
      ownerEmail: activeSession.user.email || "",
      sessionUser: activeSession.user
    });

    if (!hasSupabaseCredentials || !supabase) {
      setOwnProfile(fallbackProfile);
      onOwnProfileSync?.({
        display_name: fallbackProfile.display_name,
        bio: fallbackProfile.bio,
        avatar_url: fallbackProfile.avatar_url
      });
      setAuthorProfiles((current) => ({
        ...current,
        [fallbackProfile.owner_id]: fallbackProfile
      }));
      onOwnProfileLogoReset?.();
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("owner_id, owner_email, display_name, headline, bio, avatar_url, created_at, updated_at")
      .eq("owner_id", activeSession.user.id)
      .maybeSingle();

    if (error && !isProfileMigrationMissing(error)) {
      console.error("Could not load own profile.", error);
    }

    const normalizedProfile = normalizeProfile(data, fallbackProfile);
    setOwnProfile(normalizedProfile);
    onOwnProfileSync?.({
      display_name: normalizedProfile.display_name,
      bio: normalizedProfile.bio,
      avatar_url: normalizedProfile.avatar_url
    });
    setAuthorProfiles((current) => ({
      ...current,
      [normalizedProfile.owner_id]: normalizedProfile
    }));
    onOwnProfileLogoReset?.();
  }

  async function loadAuthorProfile(ownerId, fallbackProject = null) {
    if (!ownerId) {
      return null;
    }

    if (authorProfilesRef.current[ownerId]) {
      return authorProfilesRef.current[ownerId];
    }

    const fallbackProfile =
      !hasSupabaseCredentials || !supabase
        ? normalizeProfile(demoProfiles[ownerId], createFallbackProfile({
            ownerId,
            ownerEmail: fallbackProject?.owner_email || "",
            project: fallbackProject
          }))
        : createFallbackProfile({
            ownerId,
            ownerEmail: fallbackProject?.owner_email || "",
            project: fallbackProject
          });

    if (!hasSupabaseCredentials || !supabase) {
      setAuthorProfiles((current) => ({
        ...current,
        [ownerId]: fallbackProfile
      }));
      return fallbackProfile;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("owner_id, owner_email, display_name, headline, bio, avatar_url, created_at, updated_at")
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error && !isProfileMigrationMissing(error)) {
      console.error("Could not load author profile.", error);
    }

    const normalizedProfile = normalizeProfile(data, fallbackProfile);
    setAuthorProfiles((current) => ({
      ...current,
      [ownerId]: normalizedProfile
    }));
    return normalizedProfile;
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
    } else if (!projectsRef.current.length) {
      setStatus("loading");
      setMessage("");
    }

    let { data, error } = await supabase
      .from("projects")
      .select("id, title, slogan, description, pricing_model, project_url, image_url, logo_url, owner_id, owner_email, created_at, published, deleted, launch_week, launch_date, project_categories(category:categories(id, name, slug))")
      .eq("published", true)
      .eq("deleted", false)
      .order("created_at", { ascending: false });

    if (
      error &&
      (
        error.message?.toLowerCase().includes("published") ||
        error.message?.toLowerCase().includes("deleted") ||
        isCategoryMigrationMissing(error) ||
        isLaunchScheduleMigrationMissing(error) ||
        isPricingMigrationMissing(error)
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
      .select("id, title, slogan, description, pricing_model, project_url, image_url, logo_url, owner_id, owner_email, created_at, published, deleted, launch_week, launch_date, project_categories(category:categories(id, name, slug))")
      .eq("owner_id", activeSession.user.id)
      .order("created_at", { ascending: false });

    if (
      error &&
      (
        error.message?.toLowerCase().includes("published") ||
        error.message?.toLowerCase().includes("deleted") ||
        isCategoryMigrationMissing(error) ||
        isLaunchScheduleMigrationMissing(error) ||
        isPricingMigrationMissing(error)
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

  async function refreshProjectData(activeSession = session) {
    await loadProjects();
    await loadMyProjects(activeSession);
  }

  async function deleteProject(projectId) {
    if (!supabase || !session) {
      return { success: false, reason: "missing-session" };
    }

    const projectToDelete = myProjectsRef.current.find((project) => project.id === projectId);
    if (!projectToDelete) {
      return { success: false, reason: "missing-project" };
    }

    const confirmed = window.confirm(`Move "${projectToDelete.title}" to deleted items? You can restore it later.`);
    if (!confirmed) {
      return { success: false, reason: "cancelled" };
    }

    setMessage("");

    const { error } = await supabase.from("projects").update({ deleted: true }).eq("id", projectId);

    if (error) {
      setMessage("Project deletion failed. Add Supabase RLS update policy for the owner.");
      setStatus("error");
      console.error(error);
      return { success: false, reason: "error" };
    }

    pushToast?.({
      tone: "info",
      title: "Listing deleted",
      description: "The listing was moved to deleted items and can be restored."
    });
    setStatus("ready");
    await refreshProjectData(session);
    return { success: true };
  }

  async function restoreProject(projectId) {
    if (!supabase || !session) {
      return { success: false, reason: "missing-session" };
    }

    setMessage("");

    const { error } = await supabase.from("projects").update({ deleted: false }).eq("id", projectId);

    if (error) {
      setMessage("Project restore failed. Add Supabase RLS update policy for the owner.");
      setStatus("error");
      console.error(error);
      return { success: false, reason: "error" };
    }

    pushToast?.({
      tone: "success",
      title: "Listing restored",
      description: "The listing was restored successfully."
    });
    setStatus("ready");
    await refreshProjectData(session);
    return { success: true };
  }

  async function handleVote(projectId, requestSignIn) {
    if (!projectId) {
      return { success: false, reason: "missing-project-id" };
    }

    if (!hasSupabaseCredentials || !supabase) {
      const demoVotes = readDemoVotes();
      const hasVoted = Boolean(demoVotes[projectId]);
      const nextDemoVotes = {
        ...demoVotes,
        [projectId]: !hasVoted
      };

      if (!nextDemoVotes[projectId]) {
        delete nextDemoVotes[projectId];
      }

      writeDemoVotes(nextDemoVotes);
      setVoteCounts((current) => ({
        ...current,
        [projectId]: Math.max(0, (current[projectId] || 0) + (hasVoted ? -1 : 1))
      }));
      setVotedProjectIds((current) =>
        hasVoted ? current.filter((id) => id !== projectId) : [...new Set([...current, projectId])]
      );
      return { success: true };
    }

    if (!session) {
      await requestSignIn?.();
      return { success: false, reason: "missing-session" };
    }

    if (!isVotingReady) {
      pushToast?.({
        tone: "info",
        title: "Voting unavailable",
        description: "Run the latest Supabase SQL migration to enable project voting."
      });
      return { success: false, reason: "voting-unavailable" };
    }

    const hasVoted = votedProjectIds.includes(projectId);
    const voteQuery = hasVoted
      ? supabase.from("project_votes").delete().eq("project_id", projectId).eq("user_id", session.user.id)
      : supabase.from("project_votes").insert({ project_id: projectId, user_id: session.user.id });

    const { error } = await voteQuery;

    if (error) {
      console.error(error);
      pushToast?.({
        tone: "info",
        title: "Vote failed",
        description: isVotingMigrationMissing(error)
          ? "Apply the latest Supabase SQL migration to enable voting."
          : "Could not update your vote right now."
      });
      return { success: false, reason: "error" };
    }

    setVoteCounts((current) => ({
      ...current,
      [projectId]: Math.max(0, (current[projectId] || 0) + (hasVoted ? -1 : 1))
    }));
    setVotedProjectIds((current) =>
      hasVoted ? current.filter((id) => id !== projectId) : [...new Set([...current, projectId])]
    );
    return { success: true };
  }

  useEffect(() => {
    loadCategories();
    loadProjects();
    loadMyProjects(session);
    loadOwnProfile(session);
  }, [session]);

  useEffect(() => {
    if (!projects.length) {
      setVoteCounts({});
      setVotedProjectIds([]);
      return;
    }

    loadVotes(projects, session);
  }, [projects, session]);

  useEffect(() => {
    if (!activeAuthorId) {
      return;
    }

    const fallbackProject =
      [...projectsRef.current, ...myProjectsRef.current].find((project) => project.owner_id === activeAuthorId) || null;

    loadAuthorProfile(activeAuthorId, fallbackProject);
  }, [activeAuthorId, projects, myProjects]);

  useEffect(() => {
    const previewProject = myProjectsRef.current.find((project) => project.id === activePreviewId);
    const currentActiveProject = activePreviewId
      ? previewProject || null
      : projectsRef.current.find((project) => slugify(project.title) === activeSlug) || null;

    if (!currentActiveProject?.owner_id) {
      return;
    }

    loadAuthorProfile(currentActiveProject.owner_id, currentActiveProject);
  }, [activePreviewId, activeSlug, myProjects, projects]);

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
        pushToast?.({
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
  }, [myProjects, pushToast, session]);

  return {
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
    handleVote,
    deleteProject,
    restoreProject
  };
}
