import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRightIcon, EyeIcon, PenIcon, RefreshIcon, SearchIcon, TrashIcon } from "./icons";
import { EmptyState, SectionIntro, StatCard, SuccessOverlay, Surface, ToolCard } from "./ui";

function formatAuthorName(ownerEmail) {
  if (!ownerEmail) {
    return "Unknown author";
  }

  const localPart = ownerEmail.split("@")[0] || ownerEmail;

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getAuthorInitial(ownerEmail) {
  const authorName = formatAuthorName(ownerEmail);
  return authorName.charAt(0).toUpperCase();
}

function getListingStatus(project) {
  if (project.deleted) {
    return "deleted";
  }

  if (project.published) {
    return "published";
  }

  if (!project.created_at) {
    return "pending";
  }

  const createdAt = new Date(project.created_at);
  const ageInDays = (Date.now() - createdAt.getTime()) / 86400000;

  return ageInDays >= 30 ? "rejected" : "pending";
}

function getListingStatusMeta(status) {
  if (status === "deleted") {
    return { label: "Deleted", dotClassName: "bg-slate-400", actionLabel: "Deleted", actionDisabled: true };
  }

  if (status === "published") {
    return { label: "Published", dotClassName: "bg-emerald-500", actionLabel: "View listing", actionDisabled: false };
  }

  if (status === "rejected") {
    return { label: "Rejected", dotClassName: "bg-rose-500", actionLabel: "Rejected", actionDisabled: true };
  }

  return { label: "Pending", dotClassName: "bg-sky-500", actionLabel: "Pending", actionDisabled: true };
}

function formatCompactDate(value) {
  if (!value) {
    return "No date";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "No date";
  }

  return parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLaunchSchedule(project) {
  const launchWeek = Number(project?.launch_week);

  if (!launchWeek) {
    return "";
  }

  if (project?.launch_date) {
    const parsedDate = new Date(`${project.launch_date}T00:00:00`);

    if (!Number.isNaN(parsedDate.getTime())) {
      return `Week ${launchWeek} • ${parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
  }

  return `Week ${launchWeek}`;
}

function DashboardSection({ eyebrow, title, count, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">{eyebrow}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{title}</h3>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {count} items
        </div>
      </div>
      {children}
    </div>
  );
}

function ListingRow({
  project,
  deletingProjectId,
  restoringProjectId,
  openProjectPreview,
  openEditModal,
  handleDeleteProject,
  handleRestoreProject,
  openProject,
  showPreviewAction = true
}) {
  const listingStatus = getListingStatus(project);
  const listingStatusMeta = getListingStatusMeta(listingStatus);
  const isDeleted = listingStatus === "deleted";
  const categories = Array.isArray(project.categories) && project.categories.length
    ? project.categories.map((category) => category.name).filter(Boolean)
    : String(project.category || "").split(",").map((item) => item.trim()).filter(Boolean);
  const launchSchedule = formatLaunchSchedule(project);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-900/60 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(15,23,42,0.04)] dark:shadow-[0_0_0_4px_rgba(148,163,184,0.08)] ${listingStatusMeta.dotClassName}`} title={listingStatusMeta.label} />
          {project.logo_url ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-950">
              <img className="max-h-full max-w-full rounded-xl object-contain" src={project.logo_url} alt={project.title} />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
              {project.title.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <p className="truncate text-sm font-semibold tracking-tight text-slate-950 dark:text-slate-100">{project.title}</p>
              <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {listingStatusMeta.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{formatCompactDate(project.created_at)}</span>
              {launchSchedule ? <span>{launchSchedule}</span> : null}
              {categories.length ? <span>{categories.slice(0, 2).join(" • ")}</span> : null}
              {project.slogan ? <span className="max-w-[32rem] truncate">{project.slogan}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        {showPreviewAction && !isDeleted ? (
          <button aria-label="View listing preview" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={() => openProjectPreview(project)} type="button">
            <EyeIcon className="h-4 w-4" />
          </button>
        ) : null}
        <button aria-label="Edit listing" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={() => openEditModal(project)} type="button" disabled={isDeleted}>
          <PenIcon className="h-4 w-4" />
        </button>
        {isDeleted ? (
          <button aria-label="Restore listing" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20" onClick={() => handleRestoreProject(project.id)} type="button" disabled={restoringProjectId === project.id}>
            <RefreshIcon className="h-4 w-4" />
          </button>
        ) : (
          <button aria-label="Delete listing" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20" onClick={() => handleDeleteProject(project.id)} type="button" disabled={deletingProjectId === project.id}>
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
        {isDeleted ? <button className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" type="button" disabled>Deleted</button> : null}
        {listingStatusMeta.actionDisabled ? (
          listingStatus === "rejected" ? <button className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700 opacity-80 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" type="button" disabled>{listingStatusMeta.actionLabel}</button> : null
        ) : (
          <button className="inline-flex items-center justify-center rounded-full bg-slate-950 px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400" onClick={() => openProject(project)} type="button">
            {listingStatusMeta.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function DashboardView({
  session,
  userName,
  myProjects,
  ownProfile,
  dashboardProfile,
  dashboardProjects,
  isOwnDashboard,
  profileForm,
  profileLogoFile,
  profileSaveStatus,
  profileSaveMessage,
  resetProfileSaveFeedback,
  dashboardSearchQuery,
  handleDashboardSearchQueryChange,
  handleProfileInputChange,
  handleProfileLogoFileChange,
  handleProfileSave,
  openHome,
  openModal,
  openProjectPreview,
  openEditModal,
  handleDeleteProject,
  handleRestoreProject,
  deletingProjectId,
  restoringProjectId,
  openProject,
  openCategoryPage,
  getProjectCategories,
  profileLogoInputRef
}) {
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const normalizedDashboardSearchQuery = dashboardSearchQuery.trim().toLowerCase();
  const filteredProjects = normalizedDashboardSearchQuery
    ? dashboardProjects.filter((project) => [project.title, project.slogan].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedDashboardSearchQuery)))
    : dashboardProjects;
  const publishedProjects = filteredProjects.filter((project) => getListingStatus(project) === "published");
  const reviewProjects = filteredProjects.filter((project) => {
    const status = getListingStatus(project);
    return status !== "published" && status !== "deleted";
  });
  const deletedProjects = filteredProjects.filter((project) => getListingStatus(project) === "deleted");
  const profileName = dashboardProfile?.display_name || userName;
  const profileBio = dashboardProfile?.bio || "This author has not added a bio yet.";
  const profileLogoPreview = profileLogoFile ? URL.createObjectURL(profileLogoFile) : dashboardProfile?.avatar_url || ownProfile?.avatar_url || "";

  useEffect(() => {
    if (!isOwnDashboard) {
      setIsProfileEditorOpen(false);
    }
  }, [isOwnDashboard]);

  useEffect(() => {
    if (!isProfileEditorOpen) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : previousBodyPaddingRight;

    return () => {
      document.body.style.overflow = previousBodyOverflow || "";
      document.body.style.paddingRight = previousBodyPaddingRight || "";
    };
  }, [isProfileEditorOpen]);

  useEffect(() => {
    if (!isProfileEditorOpen || profileSaveStatus !== "success") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsProfileEditorOpen(false);
    }, 1350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isProfileEditorOpen, profileSaveStatus]);

  const profileEditorModal = isOwnDashboard && isProfileEditorOpen && typeof document !== "undefined"
    ? createPortal(
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-4 py-10 backdrop-blur-sm" onClick={() => setIsProfileEditorOpen(false)} role="presentation">
        <div className="mx-auto w-full max-w-3xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <Surface className="relative overflow-hidden p-6 sm:p-8">
            <SuccessOverlay
              isVisible={profileSaveStatus === "success"}
              title="Saved"
              description={profileSaveMessage}
            />
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">Public author profile</p>
                <h3 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100" id="edit-profile-title">Edit profile</h3>
              </div>
              <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={() => setIsProfileEditorOpen(false)} type="button">
                Close
              </button>
            </div>
            <form className="mt-6 grid gap-5 lg:grid-cols-2" onSubmit={handleProfileSave}>
              <input ref={profileLogoInputRef} accept="image/*" className="hidden" onChange={handleProfileLogoFileChange} type="file" />
              <div className="lg:col-span-2 grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
                <button className="flex min-h-[180px] items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-slate-300 bg-slate-50 text-slate-500 transition hover:border-sky-400 hover:bg-sky-50" onClick={() => profileLogoInputRef.current?.click()} type="button">
                  {profileLogoPreview ? <img alt="Profile logo preview" className="h-full w-full object-cover" src={profileLogoPreview} /> : <span className="px-6 text-center text-sm font-medium">Upload logo</span>}
                </button>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Profile logo</p>
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Upload a square logo or avatar. It will appear next to your name in the public profile.
                  </p>
                  {profileLogoFile ? <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{profileLogoFile.name}</p> : null}
                  <button className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100" onClick={() => profileLogoInputRef.current?.click()} type="button">
                    Choose image
                  </button>
                </div>
              </div>
              <label className="space-y-2 lg:col-span-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Display name</span>
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-500/20" name="display_name" onChange={handleProfileInputChange} placeholder="Ethan Hunt" type="text" value={profileForm.display_name} />
              </label>
              <label className="space-y-2 lg:col-span-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bio</span>
                <textarea className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-500/20" name="bio" onChange={handleProfileInputChange} placeholder="Tell people what you build and who it is for." rows="5" value={profileForm.bio} />
              </label>
              <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {profileSaveMessage ? (
                  <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    profileSaveStatus === "error"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  }`}>
                    {profileSaveMessage}
                  </div>
                ) : <div />}
                <button className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400" disabled={profileSaveStatus === "saving"} type="submit">
                  {profileSaveStatus === "saving" ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </Surface>
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <section className="space-y-6">
      <SectionIntro eyebrow="Creator space" title={isOwnDashboard ? "Your dashboard" : profileName} description={isOwnDashboard ? "Manage listings in the same launch-board visual language as the homepage." : "Published work shown in the same dark board style as the weekly launch list."} action={<button className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100" onClick={openHome} type="button">Back to weekly launch</button>} />
      {dashboardProfile ? (
        <>
          <Surface className="group relative overflow-hidden">
            <div className="bg-[linear-gradient(135deg,_rgba(248,250,252,0.98)_0%,_rgba(226,232,240,0.92)_48%,_rgba(186,230,253,0.9)_100%)] px-6 py-8 text-slate-950 dark:bg-[linear-gradient(135deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(3,105,161,0.88)_100%)] dark:text-white sm:px-8 sm:py-10">
              <div className="flex items-start gap-5">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border border-white/30 bg-white text-3xl font-semibold text-slate-950 shadow-lg dark:border-white/15">
                  {profileLogoPreview ? <img alt={profileName} className="h-full w-full object-cover" src={profileLogoPreview} /> : (profileName || "A").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 pt-1">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{profileName}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 dark:text-sky-50/90 sm:text-base">{profileBio}</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 bg-slate-950/10 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-slate-950/40" />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex translate-x-3 items-center px-6 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 sm:px-8">
              <div className="pointer-events-auto flex flex-col items-end gap-3">
                {isOwnDashboard ? (
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 dark:bg-white dark:text-slate-950 dark:hover:bg-sky-50"
                    onClick={() => {
                      resetProfileSaveFeedback();
                      setIsProfileEditorOpen(true);
                    }}
                    type="button"
                  >
                    Edit profile
                  </button>
                ) : null}
              </div>
            </div>
          </Surface>
          <SectionIntro eyebrow={isOwnDashboard ? "Your content" : "Published work"} title={isOwnDashboard ? "My projects" : `${profileName}'s projects`} description={isOwnDashboard ? "A darker launch-board style list for publishing, review, and cleanup." : "Projects currently visible in the public directory."} action={isOwnDashboard ? <button className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400" onClick={openModal} type="button">Submit Tool</button> : null} />
          {dashboardProjects.length ? (
            <div className="space-y-5">
              <Surface className="overflow-hidden p-3.5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.18)] sm:p-4">
                <label className="relative block">
                  <span className="sr-only">Search listings</span>
                  <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-500/20" onChange={handleDashboardSearchQueryChange} placeholder={isOwnDashboard ? "Search your listings" : "Search this author's projects"} type="search" value={dashboardSearchQuery} />
                </label>
              </Surface>
              {publishedProjects.length ? <DashboardSection eyebrow="Launch board" title="Published" count={publishedProjects.length}>{isOwnDashboard ? <Surface className="overflow-hidden px-0 py-0 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.18)]">{publishedProjects.map((project, index) => <div className={index === 0 ? "" : "border-t border-slate-200 dark:border-slate-800"} key={project.id}><ListingRow project={project} deletingProjectId={deletingProjectId} restoringProjectId={restoringProjectId} openProjectPreview={openProjectPreview} openEditModal={openEditModal} handleDeleteProject={handleDeleteProject} handleRestoreProject={handleRestoreProject} openProject={openProject} showPreviewAction={false} /></div>)}</Surface> : <div className="grid gap-6 md:grid-cols-2">{publishedProjects.map((project) => <ToolCard key={project.id} project={project} categories={getProjectCategories(project)} onOpenProject={openProject} onOpenCategoryPage={openCategoryPage} />)}</div>}</DashboardSection> : null}
              {isOwnDashboard && reviewProjects.length ? <DashboardSection eyebrow="Moderation" title="Under review" count={reviewProjects.length}><Surface className="overflow-hidden px-0 py-0 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.18)]">{reviewProjects.map((project, index) => <div className={index === 0 ? "" : "border-t border-slate-200 dark:border-slate-800"} key={project.id}><ListingRow project={project} deletingProjectId={deletingProjectId} restoringProjectId={restoringProjectId} openProjectPreview={openProjectPreview} openEditModal={openEditModal} handleDeleteProject={handleDeleteProject} handleRestoreProject={handleRestoreProject} openProject={openProject} showPreviewAction /></div>)}</Surface></DashboardSection> : null}
              {isOwnDashboard && deletedProjects.length ? <DashboardSection eyebrow="Archive" title="Deleted" count={deletedProjects.length}><Surface className="overflow-hidden px-0 py-0 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.18)]">{deletedProjects.map((project, index) => <div className={index === 0 ? "" : "border-t border-slate-200 dark:border-slate-800"} key={project.id}><ListingRow project={project} deletingProjectId={deletingProjectId} restoringProjectId={restoringProjectId} openProjectPreview={openProjectPreview} openEditModal={openEditModal} handleDeleteProject={handleDeleteProject} handleRestoreProject={handleRestoreProject} openProject={openProject} showPreviewAction={false} /></div>)}</Surface></DashboardSection> : null}
              {!filteredProjects.length ? <EmptyState>No listings match your search.</EmptyState> : null}
            </div>
          ) : <EmptyState>{isOwnDashboard ? "You have not submitted any projects yet. Use the submit button to add your first one." : "This author has no public projects yet."}</EmptyState>}
        </>
      ) : <EmptyState>{session ? "This profile is not ready yet." : "Sign in with Google first to open your dashboard."}</EmptyState>}
      {profileEditorModal}
    </section>
  );
}

export function ProjectsView({
  status,
  filteredProjects,
  projects,
  categoryCounts,
  homeCategoryFilterSlug,
  searchQuery,
  visibleProjects,
  hasMoreProjects,
  openHome,
  openProject,
  openCategoryPage,
  toggleHomeCategoryFilter,
  setHomeCategoryFilterSlug,
  handleSearchQueryChange,
  showMoreProjects,
  openSubmitFlow,
  getProjectCategories
}) {
  return (
    <section className="space-y-8">
      <SectionIntro eyebrow="Full directory" title="All projects" description="Browse the full published catalog while the homepage stays focused on this week's launch board." action={<button className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100" onClick={openHome} type="button">Back to weekly launch</button>} />
      <Surface className="p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search tools</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-sky-500/20" onChange={handleSearchQueryChange} placeholder="Search by tool name, slogan, or category" type="search" value={searchQuery} />
        </label>
      </Surface>
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Surface className="h-fit p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">Categories</p>
            {homeCategoryFilterSlug ? <button className="text-sm font-semibold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100" onClick={() => setHomeCategoryFilterSlug("")} type="button">Clear</button> : null}
          </div>
          <div className="mt-5 space-y-3">
            {categoryCounts.map((categoryItem) => (
              <button className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${categoryItem.slug === homeCategoryFilterSlug ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"}`} key={categoryItem.slug} onClick={() => toggleHomeCategoryFilter(categoryItem.name)} type="button">
                <span>{categoryItem.name}</span>
                <strong>{categoryItem.count}</strong>
              </button>
            ))}
          </div>
        </Surface>
        <div className="space-y-6">
          {status === "loading" && !projects.length ? <EmptyState>Loading projects...</EmptyState> : filteredProjects.length ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visibleProjects.map((project) => <ToolCard key={project.id} project={project} categories={getProjectCategories(project)} onOpenProject={openProject} onOpenCategoryPage={openCategoryPage} />)}
              </div>
              {hasMoreProjects ? <div className="flex justify-center"><button className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100" onClick={showMoreProjects} type="button">Show more</button></div> : null}
            </>
          ) : status === "ready" ? <EmptyState>{searchQuery.trim() ? "No tools match your search." : "No tools match this category filter."}</EmptyState> : null}
          {!projects.length && status === "ready" ? <Surface className="overflow-hidden"><div className="grid gap-6 bg-[linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.95)_45%,_rgba(3,105,161,0.92)_100%)] px-6 py-8 text-white sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">First launch</p><h2 className="text-2xl font-semibold tracking-tight">No projects yet</h2><p className="max-w-2xl text-sm leading-7 text-sky-50/90">Submit the first project to start the weekly launch board and populate the full directory.</p></div><div><button className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-50" onClick={openSubmitFlow} type="button">Submit project</button></div></div></Surface> : null}
        </div>
      </div>
    </section>
  );
}

export function ProjectView({
  activeProject,
  activeAuthorProfile,
  isPreview,
  openHome,
  openCategoryPage,
  openAuthorProfile,
  getProjectCategories
}) {
  return (
    <section className="space-y-8">
      {activeProject ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <Surface className="overflow-hidden">
            <div className="h-72 border-b border-slate-200/80 bg-slate-950 sm:h-96" style={{ backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.78)), url(${activeProject.image_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div className="space-y-6 p-6 sm:p-8">
              {isPreview ? <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">Private preview</div> : null}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {activeProject.logo_url ? <img className="h-20 w-20 rounded-3xl border border-slate-200 object-cover" src={activeProject.logo_url} alt={activeProject.title} /> : null}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {getProjectCategories(activeProject).map((categoryItem) => <button className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200" key={categoryItem} onClick={() => openCategoryPage(categoryItem)} type="button">{categoryItem}</button>)}
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-950">{activeProject.title}</h3>
                  {activeProject.slogan ? <p className="text-lg leading-8 text-slate-600">{activeProject.slogan}</p> : null}
                </div>
              </div>
              <p className="text-base leading-8 text-slate-600">{activeProject.description || "No description provided yet."}</p>
            </div>
          </Surface>
          <div className="space-y-6">
            <Surface className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Author</p><button className="mt-4 flex w-full items-center gap-4 rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-slate-600 dark:hover:bg-slate-900" onClick={() => openAuthorProfile(activeProject.owner_id)} type="button"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#0369a1_100%)] text-xl font-semibold text-white shadow-sm dark:border-slate-700">{activeAuthorProfile?.avatar_url ? <img alt={activeAuthorProfile.display_name} className="h-full w-full object-cover" src={activeAuthorProfile.avatar_url} /> : getAuthorInitial(activeProject.owner_email)}</div><div className="min-w-0"><p className="text-lg font-semibold text-slate-950 dark:text-slate-100">{activeAuthorProfile?.display_name || formatAuthorName(activeProject.owner_email)}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activeAuthorProfile?.headline || "Open author profile"}</p></div></button></Surface>
            <Surface className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Visit project</p><a className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600" href={activeProject.project_url || "#"} target="_blank" rel="noreferrer">Open live site<ArrowUpRightIcon className="h-4 w-4" /></a></Surface>
          </div>
        </div>
      ) : <EmptyState>Project not found. Try going back to the homepage and opening it again.</EmptyState>}
    </section>
  );
}

export function CategoryView({ activeCategoryName, categoryProjects, categoryCounts, activeCategorySlug, openHome, openProject, openCategoryPage, getProjectCategories }) {
  return (
    <section className="space-y-8">
      <SectionIntro eyebrow="Category page" title={activeCategoryName || "Category"} description={activeCategoryName ? `Browse all projects tagged with ${activeCategoryName}.` : "Browse all projects in this category."} action={<button className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white" onClick={openHome} type="button">Back to weekly launch</button>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Surface className="p-6"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Projects found</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{categoryProjects.length}</p><p className="mt-2 text-sm leading-6 text-slate-500">{activeCategoryName ? `Browse all projects tagged with ${activeCategoryName}.` : "Browse all projects in this category."}</p></Surface>
          {categoryProjects.length ? <div className="grid gap-6 md:grid-cols-2">{categoryProjects.map((project) => <ToolCard key={project.id} project={project} categories={getProjectCategories(project)} onOpenProject={openProject} onOpenCategoryPage={openCategoryPage} />)}</div> : <EmptyState>No projects were found for this category yet.</EmptyState>}
        </div>
        <Surface className="h-fit p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Categories</p>
          <div className="mt-5 space-y-3">
            {categoryCounts.map((categoryItem) => <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${categoryItem.slug === activeCategorySlug ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-600"}`} key={categoryItem.slug}><span>{categoryItem.name}</span><strong>{categoryItem.count}</strong></div>)}
          </div>
        </Surface>
      </div>
    </section>
  );
}
