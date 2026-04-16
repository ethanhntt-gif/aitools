import React from "react";
import { ModalStep, Surface } from "./ui";

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
  if (!isOpen) {
    return null;
  }

  const selectedCategoryNames = formData.category
    .map((categoryId) => categoryOptions.find((option) => option.id === categoryId)?.name)
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-4 py-10 backdrop-blur-sm" onClick={closeModal} role="presentation">
      <div
        className="mx-auto w-full max-w-4xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-project-title"
      >
        <Surface className="overflow-hidden p-6 sm:p-8">
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

            <form className="space-y-6" onSubmit={handleProjectSubmit}>
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
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">Launch week</span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      name="launch_week"
                      value={formData.launch_week}
                      onChange={handleInputChange}
                      type="week"
                    />
                  </label>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Choose the week when you plan to launch this product.
                  </p>
                </Surface>
              ) : null}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <button
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    onClick={closeModal}
                    type="button"
                  >
                    Cancel
                  </button>
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
                    type="submit"
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
            </form>
          </div>
        </Surface>
      </div>
    </div>
  );
}
