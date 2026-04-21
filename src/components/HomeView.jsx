import React from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ExternalSiteIcon, ThumbUpIcon } from "./icons";
import LaunchCountdown from "./LaunchCountdown";
import { EmptyState, SectionIntro, Surface } from "./ui";

function formatWeekHeadline(dateValue) {
  if (!dateValue) {
    return "This launch week";
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "This launch week";
  }

  return `Week of ${parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })}`;
}

function VoteButton({ project, handleVote, votingProjectId }) {
  const isVoting = votingProjectId === project.id;

  return (
    <motion.button
      className={`inline-flex min-w-[58px] flex-col items-center justify-center rounded-xl border px-3 py-3.5 text-sm font-semibold transition ${
        project.user_voted
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
      }`}
      animate={{
        scale: project.user_voted ? 1.03 : 1,
        y: project.user_voted ? -1 : 0
      }}
      disabled={isVoting}
      onClick={() => handleVote(project.id)}
      type="button"
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      whileHover={{ scale: project.user_voted ? 1.05 : 1.03, y: -2 }}
      whileTap={{ scale: 0.94 }}
    >
      <motion.span
        animate={{ rotate: project.user_voted ? [-8, 8, -4, 0] : 0, scale: project.user_voted ? [1, 1.18, 1] : 1 }}
        className="block"
        transition={{ duration: 0.35 }}
      >
        <ThumbUpIcon className="h-5 w-5" />
      </motion.span>
      <span className="mt-1 min-h-[14px] text-[14px] leading-none">
        <AnimatePresence mode="wait">
          <motion.span
            key={isVoting ? "loading" : project.vote_count}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.18 }}
          >
            {isVoting ? "..." : project.vote_count}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

function WeeklyProjectRow({
  index,
  project,
  categories,
  openProject,
  openCategoryPage,
  handleVote,
  votingProjectId
}) {
  return (
    <motion.div
      layout
      transition={{ layout: { type: "spring", stiffness: 320, damping: 28 } }}
      className="group flex items-center gap-4 border-t border-slate-200 py-4 first:border-t-0 dark:border-slate-800"
    >
      <div className="w-6 shrink-0 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
        {index + 1}
      </div>

      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
        {project.logo_url ? (
          <img
            className="h-14 w-14 rounded-lg object-contain"
            src={project.logo_url}
            alt={project.title}
          />
        ) : (
          <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">
            {project.title.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <button
            className="truncate text-left text-[20px] font-semibold tracking-tight text-slate-950 transition hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-300"
            onClick={() => openProject(project)}
            type="button"
          >
            {project.title}
          </button>
          <div className="flex items-center gap-2 opacity-0 pointer-events-none transition duration-200 group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
            <a
              aria-label="Visit client site"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
              href={project.project_url || "#"}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalSiteIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {project.slogan ? (
          <p className="mt-0.5 truncate text-[11px] leading-4 text-slate-400 dark:text-slate-500">{project.slogan}</p>
        ) : null}

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {categories.slice(0, 2).map((categoryItem) => (
            <button
              className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-slate-100"
              key={`${project.id}-${categoryItem}`}
              onClick={() => openCategoryPage(categoryItem)}
              type="button"
            >
              {categoryItem}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto shrink-0">
        <VoteButton
          project={project}
          handleVote={handleVote}
          votingProjectId={votingProjectId}
        />
      </div>
    </motion.div>
  );
}

export default function HomeView({
  status,
  currentLaunchRange,
  thisWeekProjects,
  isVotingReady,
  votingProjectId,
  openProject,
  openProjectsPage,
  openCategoryPage,
  openSubmitFlow,
  getProjectCategories,
  handleVote,
  session
}) {
  return (
    <div className="space-y-14">
      <section className="space-y-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              Products launching this week
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
              {formatWeekHeadline(currentLaunchRange.startDateValue)}
            </h1>
          </div>

          <LaunchCountdown startDateValue={currentLaunchRange.startDateValue} />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            onClick={openProjectsPage}
            type="button"
          >
            All projects
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400"
            onClick={openSubmitFlow}
            type="button"
          >
            Submit project
          </button>
        </div>
      </section>

      <section className="space-y-6">
        {status === "loading" && !thisWeekProjects.length ? (
          <EmptyState>Loading launch week projects...</EmptyState>
        ) : thisWeekProjects.length ? (
          <Surface className="overflow-hidden px-5 py-2 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.18)] sm:px-8">
            <LayoutGroup>
              <AnimatePresence initial={false}>
                {thisWeekProjects.map((project, index) => (
                  <WeeklyProjectRow
                    key={project.id}
                    index={index}
                    project={project}
                    categories={getProjectCategories(project)}
                    openProject={openProject}
                    openCategoryPage={openCategoryPage}
                    handleVote={handleVote}
                    votingProjectId={votingProjectId}
                  />
                ))}
              </AnimatePresence>
            </LayoutGroup>
          </Surface>
        ) : (
          <EmptyState>
            No published launches are scheduled for this week yet. Add a new project and pick the current launch week.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
