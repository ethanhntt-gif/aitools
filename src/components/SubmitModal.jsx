import React, { useEffect, useState } from "react";
import { ModalStep, SuccessOverlay, Surface } from "./ui";

export default function SubmitModal({
  isOpen,
  closeModal,
  modalStep,
  totalModalSteps,
  submitStatus,
  submitMessage,
  editingProject,
  formData,
  categoryOptions,
  maxCategories,
  isCategoryMenuOpen,
  categoryMenuRef,
  toggleCategoryMenu,
  selectCategory,
  handleInputChange,
  launchSlotOptions,
  launchYear,
  logoInputRef,
  screenshotInputRef,
  handleFileChange,
  handleDropZoneClick,
  logoFile,
  screenshotFile,
  handlePreviousStep,
  handleNextStep,
  handleProjectSubmit
}) {
  const [showAllLaunchSlots, setShowAllLaunchSlots] = useState(false);
  const selectedCategoryNames = formData.category
    .map((categoryId) => categoryOptions.find((option) => option.id === categoryId)?.name)
    .filter(Boolean);
  const launchWeekNumber = Number(formData.launch_week);
  const visibleLaunchSlots = showAllLaunchSlots
    ? launchSlotOptions
    : launchSlotOptions.filter((slot, index) => index < 9 || String(slot.week) === String(formData.launch_week));
  const hasHiddenLaunchSlots = launchSlotOptions.length > visibleLaunchSlots.length;
  const launchWeekSummary = Number.isInteger(launchWeekNumber) && launchWeekNumber > 0
    ? (() => {
        const selectedSlot = launchSlotOptions.find((slot) => slot.week === launchWeekNumber);
        const selectedDateLabel = selectedSlot?.dateLabel || "";

        return `${launchYear} / Week ${launchWeekNumber}${selectedDateLabel ? ` / ${selectedDateLabel}` : ""}`;
      })()
    : "";

  useEffect(() => {
    if (!isOpen || modalStep !== 3) {
      setShowAllLaunchSlots(false);
    }
  }, [isOpen, modalStep]);

  useEffect(() => {
    if (!isOpen || submitStatus !== "success") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      closeModal();
    }, 1350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [closeModal, isOpen, submitStatus]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow || "";
      document.documentElement.style.overflow = previousHtmlOverflow || "";
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-4 py-10 backdrop-blur-sm" role="presentation">
      <div
        className="mx-auto w-full max-w-4xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-project-title"
      >
        <Surface className="relative overflow-hidden p-6 sm:p-8">
          <SuccessOverlay
            isVisible={submitStatus === "success"}
            title={editingProject ? "Saved" : "Submitted"}
            description={submitMessage}
          />
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-400">Community publishing</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100" id="submit-project-title">
                  {editingProject ? "Edit your project" : "Submit your project"}
                </h2>
              </div>
              <button
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                onClick={closeModal}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <ModalStep step={1} active={modalStep >= 1} label="Information" />
              <ModalStep step={2} active={modalStep >= 2} label="Logo & screenshot" />
              <ModalStep step={3} active={modalStep >= 3} label="Launch week" />
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Step {modalStep} of {totalModalSteps}</p>

            <div className="space-y-6">
              {modalStep === 1 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-1">
                    <span className="text-sm font-semibold text-slate-700">Project title</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="AI SEO Bot"
                      type="text"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-1">
                    <span className="text-sm font-semibold text-slate-700">Category</span>
                    <div className="relative" ref={categoryMenuRef}>
                      <button
                        aria-expanded={isCategoryMenuOpen}
                        aria-haspopup="listbox"
                        className={`flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left text-sm transition ${
                          isCategoryMenuOpen
                            ? "border-sky-400 ring-4 ring-sky-100"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={toggleCategoryMenu}
                        type="button"
                      >
                        <span className={formData.category.length ? "text-slate-900" : "text-slate-400"}>
                          {selectedCategoryNames.length ? selectedCategoryNames.join(", ") : "Choose categories"}
                        </span>
                        <span className="text-slate-400">{isCategoryMenuOpen ? "-" : "+"}</span>
                      </button>
                      <p className="mt-2 text-xs text-slate-500">
                        Choose up to {maxCategories} categories. Selected: {formData.category.length}/{maxCategories}
                      </p>

                      {isCategoryMenuOpen ? (
                        <Surface className="absolute left-0 right-0 top-[calc(100%+12px)] z-10 max-h-72 overflow-y-auto p-2">
                          <div className="space-y-1" role="listbox" aria-label="Category options">
                            {categoryOptions.map((categoryOption) => (
                              (() => {
                                const isSelected = formData.category.includes(categoryOption.id);
                                const isDisabled = !isSelected && formData.category.length >= maxCategories;

                                return (
                              <button
                                key={categoryOption.id}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition ${
                                  isSelected
                                    ? "bg-sky-50 text-sky-700"
                                    : isDisabled
                                      ? "cursor-not-allowed text-slate-300"
                                      : "text-slate-600 hover:bg-slate-50"
                                }`}
                                disabled={isDisabled}
                                onClick={() => selectCategory(categoryOption)}
                                aria-selected={isSelected}
                                role="option"
                                type="button"
                                >
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current/20 text-xs">
                                    {isSelected ? "x" : ""}
                                  </span>
                                {categoryOption.name}
                              </button>
                                );
                              })()
                            ))}
                          </div>
                        </Surface>
                      ) : null}
                    </div>
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Slogan</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      name="slogan"
                      value={formData.slogan}
                      onChange={handleInputChange}
                      placeholder="The fastest way to launch AI workflows"
                      type="text"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Description</span>
                    <textarea
                      className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe what your project does and why it matters."
                      rows="5"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Project URL</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      name="project_url"
                      value={formData.project_url}
                      onChange={handleInputChange}
                      placeholder="https://your-project.com"
                      type="url"
                    />
                  </label>
                </div>
              ) : null}

              {modalStep === 2 ? (
                <div className="space-y-5">
                  <input
                    ref={logoInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, "logo")}
                    type="file"
                  />
                  <input
                    ref={screenshotInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event, "screenshot")}
                    type="file"
                  />

                  <div className="grid gap-5 md:grid-cols-2">
                    <button
                      className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-left transition hover:border-sky-400 hover:bg-sky-50"
                      onClick={() => handleDropZoneClick("logo_url")}
                      type="button"
                    >
                      <strong className="block text-base font-semibold text-slate-950">Logo</strong>
                      <span className="mt-2 block text-sm leading-6 text-slate-500">
                        {logoFile
                          ? logoFile.name
                          : formData.logo_url
                            ? "Current logo kept. Click to replace it."
                            : "Click to choose a logo from your computer"}
                      </span>
                    </button>

                    <button
                      className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-left transition hover:border-sky-400 hover:bg-sky-50"
                      onClick={() => handleDropZoneClick("image_url")}
                      type="button"
                    >
                      <strong className="block text-base font-semibold text-slate-950">Screenshot</strong>
                      <span className="mt-2 block text-sm leading-6 text-slate-500">
                        {screenshotFile
                          ? screenshotFile.name
                          : formData.image_url
                            ? "Current screenshot kept. Click to replace it."
                            : "Click to choose a screenshot from your computer"}
                      </span>
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Surface className="p-5">
                      <span className="text-sm font-semibold text-slate-500">Logo preview</span>
                      <div className="mt-4 flex min-h-52 items-center justify-center rounded-[20px] bg-slate-50 p-5">
                        {logoFile ? (
                          <img
                            alt="Logo preview"
                            className="max-h-36 w-auto rounded-2xl object-contain"
                            src={URL.createObjectURL(logoFile)}
                          />
                        ) : formData.logo_url ? (
                          <img
                            alt="Current logo preview"
                            className="max-h-36 w-auto rounded-2xl object-contain"
                            src={formData.logo_url}
                          />
                        ) : (
                          <div className="text-sm text-slate-400">No logo selected</div>
                        )}
                      </div>
                    </Surface>
                    <Surface className="p-5">
                      <span className="text-sm font-semibold text-slate-500">Screenshot preview</span>
                      <div className="mt-4 flex min-h-52 items-center justify-center rounded-[20px] bg-slate-50 p-3">
                        {screenshotFile ? (
                          <img
                            alt="Screenshot preview"
                            className="max-h-52 w-full rounded-2xl object-cover"
                            src={URL.createObjectURL(screenshotFile)}
                          />
                        ) : formData.image_url ? (
                          <img
                            alt="Current screenshot preview"
                            className="max-h-52 w-full rounded-2xl object-cover"
                            src={formData.image_url}
                          />
                        ) : (
                          <div className="text-sm text-slate-400">No screenshot selected</div>
                        )}
                      </div>
                    </Surface>
                  </div>
                </div>
              ) : null}

              {modalStep === 3 ? (
                <Surface className="p-6">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Upcoming launch slots</span>
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleLaunchSlots.map((slot) => {
                        const isSelected = String(slot.week) === String(formData.launch_week);
                        const isFull = Boolean(slot.isFull);
                        const isDisabled = isFull && !isSelected;
                        const isOverbooked = Number(slot.bookedCount) > Number(slot.capacity);

                        return (
                          <button
                            key={`${slot.week}-${slot.dateValue}`}
                            className={`rounded-[18px] border px-3.5 py-3 text-left transition ${
                              isSelected
                                ? "border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-100"
                                : isFull
                                  ? "border-slate-200 bg-slate-100 text-slate-400 opacity-80"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
                            }`}
                            disabled={isDisabled}
                            onClick={() => handleInputChange({ target: { name: "launch_week", value: String(slot.week) } })}
                            type="button"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                                isSelected
                                  ? "text-sky-500"
                                  : isFull
                                    ? "text-slate-400"
                                    : "text-emerald-600"
                              }`}>
                                Week {slot.week}
                              </div>
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  isSelected
                                    ? "bg-sky-100 text-sky-700"
                                    : isFull
                                      ? "bg-slate-200 text-slate-500"
                                      : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {slot.bookedCount}/{slot.capacity}
                              </span>
                            </div>
                            <div className={`mt-2 text-sm font-semibold ${
                              isSelected
                                ? "text-sky-700"
                                : isFull
                                  ? "text-slate-500"
                                  : "text-emerald-900"
                            }`}>
                              {slot.startDateLabel} - {slot.endDateLabel}
                            </div>
                            <div className={`mt-2 text-xs ${
                              isSelected
                                ? "text-sky-600"
                                : isFull
                                  ? "text-slate-500"
                                  : "text-emerald-700"
                            }`}>
                              {isOverbooked
                                ? `${slot.bookedCount - slot.capacity} above capacity`
                                : isFull
                                  ? "No regular slots left"
                                  : `${slot.remainingCount} spots left`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {hasHiddenLaunchSlots ? (
                      <div className="pt-2">
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                          onClick={() => setShowAllLaunchSlots(true)}
                          type="button"
                        >
                          View all dates
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {launchWeekSummary ? (
                    <div className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                      {launchWeekSummary}
                    </div>
                  ) : null}
                  {!launchSlotOptions.length ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No launch slots are available for the rest of this year yet.
                    </p>
                  ) : null}
                  {formData.launch_week && (!Number.isInteger(launchWeekNumber) || launchWeekNumber < 1) ? (
                    <p className="mt-3 text-sm text-rose-600">
                      Please enter a positive week number.
                    </p>
                  ) : null}
                </Surface>
              ) : null}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  {modalStep > 1 ? (
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      onClick={handlePreviousStep}
                      type="button"
                    >
                      Back
                    </button>
                  ) : null}
                </div>

                {modalStep < totalModalSteps ? (
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                    onClick={handleNextStep}
                    type="button"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={submitStatus === "submitting"}
                    onClick={handleProjectSubmit}
                    type="button"
                  >
                    {submitStatus === "submitting"
                      ? editingProject
                        ? "Saving..."
                        : "Submitting..."
                      : editingProject
                        ? "Save changes"
                        : "Submit project"}
                  </button>
                )}
              </div>

              {submitMessage ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    submitStatus === "error"
                      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  }`}
                >
                  {submitMessage}
                </div>
              ) : null}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
