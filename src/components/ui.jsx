import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRightIcon } from "./icons";

export function Surface({ className = "", children }) {
  return (
    <div
      className={`rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800/90 dark:bg-slate-900/85 dark:shadow-[0_20px_60px_-40px_rgba(0,0,0,0.8)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionIntro({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">{eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">{title}</h2>
        {description ? <p className="text-base leading-7 text-slate-600 dark:text-slate-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <Surface className="p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_24px_70px_-40px_rgba(14,165,233,0.35)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
    </Surface>
  );
}

export function CategoryCard({ icon: Icon, title }) {
  return (
    <Surface className="group p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_70px_-40px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white transition duration-300 group-hover:bg-sky-600 dark:bg-slate-800">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-base font-semibold text-slate-950 dark:text-slate-100">{title}</p>
      </div>
    </Surface>
  );
}

export function StatusBadge({ status }) {
  const toneMap = {
    loading: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    ready: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    error: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    published: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
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
  const pricingModelLabelMap = {
    free: "Free",
    freemium: "Freemium",
    paid: "Paid"
  };
  const pricingModelToneMap = {
    free: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    freemium: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
    paid: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
  };
  const pricingModel = String(project?.pricing_model || "").toLowerCase();
  const pricingLabel = pricingModelLabelMap[pricingModel] || "";

  return (
    <Surface className="group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_80px_-45px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-5 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.95)_0%,_rgba(30,41,59,0.95)_100%)]">
        <div className="min-h-[128px]">
          <div className="flex min-w-0 items-center gap-4">
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
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{project.title}</h3>
            </div>
          </div>
          <div className="mt-4 flex h-[64px] flex-wrap content-start gap-2 overflow-hidden">
            {pricingLabel ? (
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${pricingModelToneMap[pricingModel]}`}
              >
                {pricingLabel}
              </span>
            ) : null}
            {categories.map((categoryItem) => (
              <button
                className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-900"
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
          className="text-sm leading-6 text-slate-600 dark:text-slate-400"
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
            className="text-sm font-semibold text-slate-900 transition hover:text-sky-600 dark:text-slate-100 dark:hover:text-sky-400"
            onClick={() => onOpenProject(project)}
            type="button"
          >
            View details
          </button>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
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

export function SkeletonToolCard() {
  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef6ff_100%)] p-5 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.95)_0%,_rgba(30,41,59,0.95)_100%)]">
        <div className="min-h-[128px] animate-pulse">
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-[22px] border border-slate-200 bg-slate-200/80 dark:border-slate-700 dark:bg-slate-800" />
            <div className="flex-1">
              <div className="h-6 w-40 rounded-full bg-slate-200/80 dark:bg-slate-800" />
            </div>
          </div>
          <div className="mt-4 flex h-[64px] flex-wrap content-start gap-2 overflow-hidden">
            <div className="h-7 w-24 rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700" />
            <div className="h-7 w-28 rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700" />
            <div className="h-7 w-20 rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700" />
            <div className="h-7 w-24 rounded-full bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-700" />
          </div>
        </div>
      </div>
      <div className="animate-pulse p-6">
        <div className="h-4 w-full rounded-full bg-slate-200/80 dark:bg-slate-800" />
        <div className="mt-3 h-4 w-2/3 rounded-full bg-slate-200/80 dark:bg-slate-800" />
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-5 w-24 rounded-full bg-slate-200/80 dark:bg-slate-800" />
          <div className="h-10 w-24 rounded-full bg-slate-200/80 dark:bg-slate-800" />
        </div>
      </div>
    </Surface>
  );
}

export function StatCard({ value, label }) {
  return (
    <Surface className="p-6 text-center">
      <div className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">{value}</div>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </Surface>
  );
}

export function EmptyState({ children }) {
  return <Surface className="p-8 text-center text-sm leading-7 text-slate-600 dark:text-slate-400">{children}</Surface>;
}

export function ModalStep({ step, active, label }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
        active
          ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
          : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold ring-1 ring-inset ring-current/10 dark:bg-slate-900">
        {step}
      </span>
      <strong className="font-semibold">{label}</strong>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          className={`pointer-events-auto rounded-[22px] border px-4 py-4 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.55)] ${
            toast.tone === "success"
              ? "border-emerald-200 bg-white text-slate-900 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-100"
              : "border-amber-200 bg-white text-slate-900 dark:border-amber-500/30 dark:bg-slate-900 dark:text-slate-100"
          }`}
          key={toast.id}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                toast.tone === "success" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">{toast.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{toast.description}</p>
            </div>
            <button
              className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              onClick={() => onDismiss(toast.id)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SuccessOverlay({ isVisible, title, description = "" }) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 p-6 backdrop-blur-md dark:bg-slate-950/75"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex max-w-sm flex-col items-center text-center"
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
          >
            <motion.div
              animate={{ scale: 1, rotate: 0 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_24px_60px_-30px_rgba(16,185,129,0.75)]"
              initial={{ scale: 0.75, rotate: -12 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.08 }}
            >
              <svg aria-hidden="true" className="h-10 w-10" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6.5 12.5 10.2 16 17.5 8.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                />
              </svg>
            </motion.div>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100"
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 0.14, duration: 0.22 }}
            >
              {title}
            </motion.p>
            {description ? (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300"
                initial={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.2, duration: 0.22 }}
              >
                {description}
              </motion.p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
