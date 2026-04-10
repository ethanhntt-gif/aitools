import React from "react";
import { ArrowUpRightIcon } from "./icons";

export function Surface({ className = "", children }) {
  return (
    <div
      className={`rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionIntro({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600">{eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
        {description ? <p className="text-base leading-7 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <Surface className="p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_70px_-40px_rgba(14,165,233,0.35)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Surface>
  );
}

export function CategoryCard({ icon: Icon, title }) {
  return (
    <Surface className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_70px_-40px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition duration-300 group-hover:bg-sky-600">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-base font-semibold text-slate-950">{title}</p>
      </div>
    </Surface>
  );
}

export function StatusBadge({ status }) {
  const toneMap = {
    loading: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    ready: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${toneMap[status] || "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

export function ToolCard({
  project,
  categories,
  onOpenProject,
  onOpenCategoryPage
}) {
  return (
    <Surface className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_80px_-45px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-5">
        <div className="min-h-[128px]">
          <div className="flex min-w-0 items-center gap-4">
            {project.logo_url ? (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
                <img
                  className="max-h-full max-w-full rounded-xl object-contain"
                  src={project.logo_url}
                  alt={project.title}
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-slate-200 bg-white text-lg font-semibold text-slate-500 shadow-sm">
                {project.title.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-semibold tracking-tight text-slate-950">{project.title}</h3>
            </div>
          </div>
          <div className="mt-4 flex h-[64px] flex-wrap content-start gap-2 overflow-hidden">
            {categories.map((categoryItem) => (
              <button
                className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                key={`${project.id}-${categoryItem}`}
                onClick={() => onOpenCategoryPage(categoryItem)}
                type="button"
              >
                #{categoryItem}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p
          className="text-sm leading-6 text-slate-600"
          style={{
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden"
          }}
        >
          {project.slogan || "No slogan provided yet."}
        </p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            className="text-sm font-semibold text-slate-900 transition hover:text-sky-600"
            onClick={() => onOpenProject(project)}
            type="button"
          >
            View details
          </button>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            href={project.project_url || "#"}
            target="_blank"
            rel="noreferrer"
          >
            Visit
            <ArrowUpRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Surface>
  );
}

export function StatCard({ value, label }) {
  return (
    <Surface className="p-6 text-center">
      <div className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{value}</div>
      <p className="mt-2 text-sm font-medium text-slate-500">{label}</p>
    </Surface>
  );
}

export function EmptyState({ children }) {
  return <Surface className="p-8 text-center text-sm leading-7 text-slate-600">{children}</Surface>;
}

export function ModalStep({ step, active, label }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
        active
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-white text-slate-500"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold ring-1 ring-inset ring-current/10">
        {step}
      </span>
      <strong className="font-semibold">{label}</strong>
    </div>
  );
}
