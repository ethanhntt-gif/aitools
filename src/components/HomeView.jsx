import React, { useEffect, useState } from "react";
import { ArrowUpRightIcon, ThumbUpIcon } from "./icons";
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

function formatCountdownPart(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function getTimeLeft(targetDateValue) {
  if (!targetDateValue) {
    return { days: "00", hours: "00", minutes: "00", seconds: "00" };
  }

  const targetDate = new Date(`${targetDateValue}T00:00:00`);
  targetDate.setDate(targetDate.getDate() + 7);
  const difference = Math.max(0, targetDate.getTime() - Date.now());
  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: formatCountdownPart(days),
    hours: formatCountdownPart(hours),
    minutes: formatCountdownPart(minutes),
    seconds: formatCountdownPart(seconds)
  };
}

function ProjectPageIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8" />
      <path d="M8 12h8" />
      <path d="M8 15h5" />
    </svg>
  );
}

function VoteButton({ project, handleVote, votingProjectId }) {
  const isVoting = votingProjectId === project.id;

  return (
    <button
      className={`inline-flex min-w-[58px] flex-col items-center justify-center rounded-xl border px-3 py-3.5 text-sm font-semibold transition ${
        project.user_voted
          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
      }`}
      disabled={isVoting}
      onClick={() => handleVote(project.id)}
      type="button"
    >
      <ThumbUpIcon className="h-5 w-5" />
      <span className="mt-1 text-[14px] leading-none">{isVoting ? "..." : project.vote_count}</span>
    </button>
  );
}

function CountdownCard({ value, label }) {
  return (
    <div className="min-w-[64px] rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{value}</div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{label}</div>
    </div>
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
    <div className="flex items-center gap-4 border-t border-slate-200 py-4 first:border-t-0 dark:border-slate-800">
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
          <div className="flex items-center gap-2">
            <button
              aria-label="Open project page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
              onClick={() => openProject(project)}
              type="button"
            >
              <ProjectPageIcon className="h-4 w-4" />
            </button>
            <a
              aria-label="Visit client site"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-100"
              href={project.project_url || "#"}
              rel="noreferrer"
              target="_blank"
            >
              <ArrowUpRightIcon className="h-4 w-4" />
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
    </div>
  );
}

export default function HomeView({
  status,
  currentLaunchRange,
  thisWeekProjects,
  featuredProjects,
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
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(currentLaunchRange.startDateValue));

  useEffect(() => {
    setTimeLeft(getTimeLeft(currentLaunchRange.startDateValue));

    const intervalId = window.setInterval(() => {
      setTimeLeft(getTimeLeft(currentLaunchRange.startDateValue));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentLaunchRange.startDateValue]);

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

          <div className="space-y-3 text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Time until next launch</p>
            <div className="flex flex-wrap justify-end gap-3">
              <CountdownCard value={timeLeft.days} label="Days" />
              <CountdownCard value={timeLeft.hours} label="Hours" />
              <CountdownCard value={timeLeft.minutes} label="Mins" />
              <CountdownCard value={timeLeft.seconds} label="Secs" />
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">Updated live</p>
          </div>
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
          </Surface>
        ) : (
          <EmptyState>
            No published launches are scheduled for this week yet. Add a new project and pick the current launch week.
          </EmptyState>
        )}
      </section>

      <section className="space-y-6">
        <SectionIntro
          eyebrow="Also trending"
          title="Popular across the full directory"
          description={
            isVotingReady
              ? session
                ? "Weekly voting is live, and these are the strongest projects across the broader directory too."
                : "Sign in to vote, or browse the strongest projects across the broader directory."
              : "Voting UI is ready, but the Supabase voting migration still needs to be applied."
          }
        />

        {featuredProjects.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <Surface className="p-5" key={`${project.id}-featured`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{project.vote_count} votes</p>
                  </div>
                  <button
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    onClick={() => openProject(project)}
                    type="button"
                  >
                    Open
                  </button>
                </div>
                {project.slogan ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">{project.slogan}</p>
                ) : null}
              </Surface>
            ))}
          </div>
        ) : (
          <EmptyState>No featured projects are available yet.</EmptyState>
        )}
      </section>
    </div>
  );
}
