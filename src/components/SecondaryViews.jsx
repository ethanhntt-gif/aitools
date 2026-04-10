import React from "react";
import { ArrowUpRightIcon } from "./icons";
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

export function DashboardView({
  session,
  userName,
  myProjects,
  openHome,
  openModal,
  openProject,
  openCategoryPage,
  getProjectCategories
}) {
  return (
    <section className="space-y-8">
      <SectionIntro
        eyebrow="Personal workspace"
        title="Your dashboard"
        description="Manage the tools you have submitted without changing the underlying project flow."
        action={(
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
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
            description="Only your own projects are shown here."
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
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {myProjects.map((project, index) => (
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
  activeSlug,
  openHome,
  openCategoryPage
}) {
  return (
    <section className="space-y-8">
      <SectionIntro
        eyebrow="Project page"
        title={activeProject?.title || "Project"}
        description={activeProject?.slogan || "A closer look at this tool from the directory."}
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
