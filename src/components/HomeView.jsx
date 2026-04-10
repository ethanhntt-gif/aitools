import React from "react";
import {
  BoltIcon,
  CodeIcon,
  CompassIcon,
  ImageIcon,
  MegaphoneIcon,
  PenIcon,
  RefreshIcon,
  SearchIcon,
  SparklesIcon,
  VideoIcon
} from "./icons";
import {
  CategoryCard,
  EmptyState,
  FeatureCard,
  SectionIntro,
  StatCard,
  StatusBadge,
  Surface,
  ToolCard
} from "./ui";

const featureCards = [
  {
    title: "Curated Selection",
    description: "Only the most useful AI tools",
    icon: SparklesIcon
  },
  {
    title: "Fast Discovery",
    description: "Find tools quickly with categories",
    icon: CompassIcon
  },
  {
    title: "Always Updated",
    description: "New tools added daily",
    icon: RefreshIcon
  }
];

const showcaseCategories = [
  { title: "Writing & Content", icon: PenIcon },
  { title: "Image Generation", icon: ImageIcon },
  { title: "Video & Animation", icon: VideoIcon },
  { title: "Coding & Dev Tools", icon: CodeIcon },
  { title: "Marketing & SEO", icon: MegaphoneIcon },
  { title: "Productivity", icon: BoltIcon }
];

export default function HomeView({
  status,
  trendingProjects,
  newlyAddedProjects,
  filteredHomeProjects,
  visibleHomeProjects,
  hasMoreHomeProjects,
  projects,
  categoryCounts,
  homeCategoryFilterSlug,
  searchQuery,
  openProject,
  openCategoryPage,
  toggleHomeCategoryFilter,
  setHomeCategoryFilterSlug,
  handleSearchQueryChange,
  showMoreProjects,
  scrollToSection,
  openSubmitFlow,
  getProjectCategories
}) {
  return (
    <div className="space-y-20">
      <section className="space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
          <SparklesIcon className="h-4 w-4" />
          Modern AI tools directory
        </div>
        <div className="space-y-5">
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Discover the Best AI Tools in One Place
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Explore, compare, and find powerful AI tools for productivity, creativity, and business.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition duration-300 hover:bg-sky-600"
            onClick={() => scrollToSection("tools")}
            type="button"
          >
            Browse Tools
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            onClick={openSubmitFlow}
            type="button"
          >
            Submit Tool
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard value="10,000+" label="AI Tools" />
        <StatCard value="500+" label="Categories" />
        <StatCard value="1M+" label="Users" />
      </section>

      <section className="space-y-8" id="tools">
        <SectionIntro
          eyebrow="Directory"
          title="Browse all listed AI tools"
          description="The underlying project listing and filtering remain intact, now presented with a cleaner, more product-oriented layout."
          action={<StatusBadge status={status} />}
        />

        <Surface className="p-4 sm:p-5">
          <label className="relative block">
            <span className="sr-only">Search tools</span>
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              onChange={handleSearchQueryChange}
              placeholder="Search by tool name, slogan, or category"
              type="search"
              value={searchQuery}
            />
          </label>
        </Surface>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <Surface className="h-fit p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">Categories</p>
              {homeCategoryFilterSlug ? (
                <button
                  className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
                  onClick={() => setHomeCategoryFilterSlug("")}
                  type="button"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <div className="mt-5 space-y-3">
              {categoryCounts.map((categoryItem) => (
                <button
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    categoryItem.slug === homeCategoryFilterSlug
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  key={categoryItem.slug}
                  onClick={() => toggleHomeCategoryFilter(categoryItem.name)}
                  type="button"
                >
                  <span>{categoryItem.name}</span>
                  <strong>{categoryItem.count}</strong>
                </button>
              ))}
            </div>
          </Surface>

          <div className="space-y-6">
            {filteredHomeProjects.length ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleHomeProjects.map((project) => (
                    <ToolCard
                      key={project.id}
                      project={project}
                      categories={getProjectCategories(project)}
                      onOpenProject={openProject}
                      onOpenCategoryPage={openCategoryPage}
                    />
                  ))}
                </div>
                {hasMoreHomeProjects ? (
                  <div className="flex justify-center">
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                      onClick={showMoreProjects}
                      type="button"
                    >
                      Show more
                    </button>
                  </div>
                ) : null}
              </>
            ) : status === "ready" ? (
              <EmptyState>
                {searchQuery.trim()
                  ? "No tools match your search."
                  : "No tools match this category filter."}
              </EmptyState>
            ) : null}

            {!projects.length && status === "ready" ? (
              <EmptyState>Add rows into your Supabase `projects` table to populate the listing.</EmptyState>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-8" id="features">
        <SectionIntro
          eyebrow="Why this directory"
          title="Built for fast discovery and clean browsing"
          description="A minimal landing experience inspired by modern SaaS directories, with reusable blocks and plenty of breathing room."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.description} />
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionIntro
          eyebrow="Popular categories"
          title="Browse by workflow"
          description="Explore the core use cases people care about most when evaluating new AI products."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {showcaseCategories.map((category) => (
            <CategoryCard key={category.title} icon={category.icon} title={category.title} />
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionIntro
          eyebrow="Trending tools"
          title="Discover what people are exploring now"
          description="A focused set of highlighted cards at the top of the directory."
        />
        {trendingProjects.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {trendingProjects.map((project, index) => (
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
          <EmptyState>No tools are available yet.</EmptyState>
        )}
      </section>

      <section className="space-y-8">
        <SectionIntro
          eyebrow="Newly added"
          title="Fresh additions to the directory"
          description="The same tool card system reused for the latest entries."
        />
        {newlyAddedProjects.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {newlyAddedProjects.map((project, index) => (
              <ToolCard
                key={`${project.id}-new`}
                project={project}
                categories={getProjectCategories(project)}
                onOpenProject={openProject}
                onOpenCategoryPage={openCategoryPage}
                />
              ))}
          </div>
        ) : (
          <EmptyState>No newly added tools are available yet.</EmptyState>
        )}
      </section>

      <section>
        <Surface className="overflow-hidden">
          <div className="grid gap-8 bg-[linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.95)_45%,_rgba(3,105,161,0.92)_100%)] px-6 py-10 text-white sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-10">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Submit your AI tool</p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Submit Your AI Tool</h2>
              <p className="max-w-2xl text-base leading-7 text-sky-50/90">
                Get visibility and users by listing your product.
              </p>
            </div>
            <div>
              <button
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-50"
                onClick={openSubmitFlow}
                type="button"
              >
                Submit Tool
              </button>
            </div>
          </div>
        </Surface>
      </section>
    </div>
  );
}
