import React from "react";
import { ArrowUpRightIcon, EyeIcon, PenIcon, RefreshIcon, SearchIcon, TrashIcon } from "./icons";
import { EmptyState, SectionIntro, StatCard, Surface, ToolCard } from "./ui";

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
    return {
      label: "Deleted",
      dotClassName: "bg-slate-400",
      actionLabel: "Deleted",
      actionDisabled: true
    };
  }

  if (status === "published") {
    return {
      label: "Published",
      dotClassName: "bg-emerald-500",
      actionLabel: "View listing",
      actionDisabled: false
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      dotClassName: "bg-rose-500",
      actionLabel: "Rejected",
      actionDisabled: true
    };
  }

  return {
    label: "Pending",
    dotClassName: "bg-sky-500",
    actionLabel: "Pending",
    actionDisabled: true
  };
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

  return (
    <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className={`h-3.5 w-3.5 shrink-0 rounded-full ${listingStatusMeta.dotClassName}`}
          title={listingStatusMeta.label}
        />
        {project.logo_url ? (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <img
              className="max-h-full max-w-full rounded-xl object-contain"
              src={project.logo_url}
              alt={project.title}
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-slate-200 bg-white text-lg font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            {project.title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">{project.title}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 lg:justify-end">
        {showPreviewAction && !isDeleted ? (
          <button
            aria-label="View listing preview"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            onClick={() => openProjectPreview(project)}
            type="button"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
        ) : null}
        <button
          aria-label="Edit listing"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          onClick={() => openEditModal(project)}
          type="button"
          disabled={isDeleted}
        >
          <PenIcon className="h-4 w-4" />
        </button>
        {isDeleted ? (
          <button
            aria-label="Restore listing"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
            onClick={() => handleRestoreProject(project.id)}
            type="button"
            disabled={restoringProjectId === project.id}
          >
            <RefreshIcon className="h-5 w-5" />
          </button>
        ) : (
          <button
            aria-label="Delete listing"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
            onClick={() => handleDeleteProject(project.id)}
            type="button"
            disabled={deletingProjectId === project.id}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
        {isDeleted ? (
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            type="button"
            disabled
          >
            Deleted
          </button>
        ) : null}
        {listingStatusMeta.actionDisabled ? (
          listingStatus === "rejected" ? (
            <button
              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 opacity-80 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
              type="button"
              disabled
            >
              {listingStatusMeta.actionLabel}
            </button>
          ) : null
        ) : (
          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
            onClick={() => openProject(project)}
            type="button"
          >
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
  dashboardSearchQuery,
  handleDashboardSearchQueryChange,
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
  getProjectCategories
}) {
  const normalizedDashboardSearchQuery = dashboardSearchQuery.trim().toLowerCase();
  const filteredProjects = normalizedDashboardSearchQuery
    ? myProjects.filter((project) =>
        [project.title, project.slogan]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedDashboardSearchQuery))
      )
    : myProjects;
  const publishedProjects = filteredProjects.filter((project) => getListingStatus(project) === "published");
  const reviewProjects = filteredProjects.filter((project) => {
    const status = getListingStatus(project);
    return status !== "published" && status !== "deleted";
  });
  const deletedProjects = filteredProjects.filter((project) => getListingStatus(project) === "deleted");

  return (
    <section className="space-y-8">
      <SectionIntro
        eyebrow="Personal workspace"
        title="Your dashboard"
        description="Manage the tools you have submitted without changing the underlying project flow."
        action={(
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100"
            onClick={openHome}
            type="button"
          >
            Back to home
          </button>
        )}
      />

      {session ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard value={userName} label={session.user.email} />
            <StatCard value={`${myProjects.length}`} label="Submitted projects" />
          </div>

          <SectionIntro
            eyebrow="Your content"
            title="My projects"
            description="Track moderation status and manage every listing from one place."
            action={(
              <button
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                onClick={openModal}
                type="button"
              >
                Submit Tool
              </button>
            )}
          />

          {myProjects.length ? (
            <div className="space-y-6">
              <Surface className="p-4 sm:p-5">
                <label className="relative block">
                  <span className="sr-only">Search listings</span>
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    onChange={handleDashboardSearchQueryChange}
                    placeholder="Search your listings"
                    type="search"
                    value={dashboardSearchQuery}
                  />
                </label>
              </Surface>

              {publishedProjects.length ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Published</p>
                    <p className="mt-2 text-sm text-slate-500">Approved listings currently visible on the public page.</p>
                  </div>
                  <Surface className="overflow-hidden">
                    {publishedProjects.map((project, index) => (
                      <div
                        className={index === 0 ? "" : "border-t border-slate-200"}
                        key={project.id}
                      >
                        <ListingRow
                          project={project}
                          deletingProjectId={deletingProjectId}
                          restoringProjectId={restoringProjectId}
                          openProjectPreview={openProjectPreview}
                          openEditModal={openEditModal}
                          handleDeleteProject={handleDeleteProject}
                          handleRestoreProject={handleRestoreProject}
                          openProject={openProject}
                          showPreviewAction={false}
                        />
                      </div>
                    ))}
                  </Surface>
                </div>
              ) : null}

              {reviewProjects.length ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Under review</p>
                    <p className="mt-2 text-sm text-slate-500">Pending and rejected listings that are not public yet.</p>
                  </div>
                  <Surface className="overflow-hidden">
                    {reviewProjects.map((project, index) => (
                      <div
                        className={index === 0 ? "" : "border-t border-slate-200"}
                        key={project.id}
                      >
                        <ListingRow
                          project={project}
                          deletingProjectId={deletingProjectId}
                          restoringProjectId={restoringProjectId}
                          openProjectPreview={openProjectPreview}
                          openEditModal={openEditModal}
                          handleDeleteProject={handleDeleteProject}
                          handleRestoreProject={handleRestoreProject}
                          openProject={openProject}
                          showPreviewAction
                        />
                      </div>
                    ))}
                  </Surface>
                </div>
              ) : null}

              {deletedProjects.length ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Deleted</p>
                    <p className="mt-2 text-sm text-slate-500">Soft-deleted listings kept in storage until you restore them.</p>
                  </div>
                  <Surface className="overflow-hidden">
                    {deletedProjects.map((project, index) => (
                      <div
                        className={index === 0 ? "" : "border-t border-slate-200"}
                        key={project.id}
                      >
                        <ListingRow
                          project={project}
                          deletingProjectId={deletingProjectId}
                          restoringProjectId={restoringProjectId}
                          openProjectPreview={openProjectPreview}
                          openEditModal={openEditModal}
                          handleDeleteProject={handleDeleteProject}
                          handleRestoreProject={handleRestoreProject}
                          openProject={openProject}
                          showPreviewAction={false}
                        />
                      </div>
                    ))}
                  </Surface>
                </div>
              ) : null}

              {!filteredProjects.length ? (
                <EmptyState>No listings match your search.</EmptyState>
              ) : null}
            </div>
          ) : (
            <EmptyState>
              You have not submitted any projects yet. Use the submit button to add your first one.
            </EmptyState>
          )}
        </>
      ) : (
        <EmptyState>Sign in with Google first to open your personal dashboard.</EmptyState>
      )}
    </section>
  );
}

export function ProjectView({
  activeProject,
  isPreview,
  openHome,
  openCategoryPage
}) {
  return (
    <section className="space-y-8">
      <SectionIntro
        eyebrow="Project page"
        title={activeProject?.title || "Project"}
        description={
          isPreview
            ? activeProject?.slogan || "Private preview of your listing before publication."
            : activeProject?.slogan || "A closer look at this tool from the directory."
        }
        action={(
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            onClick={openHome}
            type="button"
          >
            Back to tools
          </button>
        )}
      />

      {activeProject ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <Surface className="overflow-hidden">
            <div
              className="h-72 border-b border-slate-200/80 bg-slate-950 sm:h-96"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.78)), url(${activeProject.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />
            <div className="space-y-6 p-6 sm:p-8">
              {isPreview ? (
                <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  Private preview
                </div>
              ) : null}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {activeProject.logo_url ? (
                  <img
                    className="h-20 w-20 rounded-3xl border border-slate-200 object-cover"
                    src={activeProject.logo_url}
                    alt={activeProject.title}
                  />
                ) : null}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(activeProject.category ? String(activeProject.category).split(",").map((item) => item.trim()).filter(Boolean) : ["Project"]).map((categoryItem) => (
                      <button
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                        key={categoryItem}
                        onClick={() => openCategoryPage(categoryItem)}
                        type="button"
                      >
                        {categoryItem}
                      </button>
                    ))}
                  </div>
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-950">{activeProject.title}</h3>
                  {activeProject.slogan ? (
                    <p className="text-lg leading-8 text-slate-600">{activeProject.slogan}</p>
                  ) : null}
                </div>
              </div>
              <p className="text-base leading-8 text-slate-600">
                {activeProject.description || "No description provided yet."}
              </p>
            </div>
          </Surface>

          <div className="space-y-6">
            <Surface className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Author</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,_#0f172a_0%,_#0369a1_100%)] text-xl font-semibold text-white shadow-sm">
                  {getAuthorInitial(activeProject.owner_email)}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-slate-950">{formatAuthorName(activeProject.owner_email)}</p>
                </div>
              </div>
            </Surface>
            <Surface className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Visit project</p>
              <a
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                href={activeProject.project_url || "#"}
                target="_blank"
                rel="noreferrer"
              >
                Open live site
                <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </Surface>
          </div>
        </div>
      ) : (
        <EmptyState>Project not found. Try going back to the homepage and opening it again.</EmptyState>
      )}
    </section>
  );
}

export function CategoryView({
  activeCategoryName,
  categoryProjects,
  categoryCounts,
  activeCategorySlug,
  openHome,
  openProject,
  openCategoryPage,
  getProjectCategories
}) {
  return (
    <section className="space-y-8">
      <SectionIntro
        eyebrow="Category page"
        title={activeCategoryName || "Category"}
        description={
          activeCategoryName
            ? `Browse all projects tagged with ${activeCategoryName}.`
            : "Browse all projects in this category."
        }
        action={(
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            onClick={openHome}
            type="button"
          >
            Back to tools
          </button>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Surface className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Projects found</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{categoryProjects.length}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {activeCategoryName
                ? `Browse all projects tagged with ${activeCategoryName}.`
                : "Browse all projects in this category."}
            </p>
          </Surface>

          {categoryProjects.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {categoryProjects.map((project, index) => (
                <ToolCard
                  key={project.id}
                  project={project}
                  categories={getProjectCategories(project)}
                  onOpenProject={openProject}
                  onOpenCategoryPage={openCategoryPage}
                />
              ))}
            </div>
          ) : (
            <EmptyState>No projects were found for this category yet.</EmptyState>
          )}
        </div>

        <Surface className="h-fit p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Categories</p>
          <div className="mt-5 space-y-3">
            {categoryCounts.map((categoryItem) => (
              <div
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                  categoryItem.slug === activeCategorySlug
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                key={categoryItem.slug}
              >
                <span>{categoryItem.name}</span>
                <strong>{categoryItem.count}</strong>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </section>
  );
}
