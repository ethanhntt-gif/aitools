import { defaultCategoryNames, pricingModelOptions } from "../constants/app";

const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeNumericId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value);
  }

  return value;
}

export function normalizePricingModel(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return pricingModelOptions.includes(normalizedValue) ? normalizedValue : "";
}

export function getCategoryList(categoryValue) {
  if (Array.isArray(categoryValue)) {
    return categoryValue
      .map((item) => {
        if (!item) {
          return "";
        }

        if (typeof item === "string") {
          return item;
        }

        if (typeof item === "object" && item.name) {
          return item.name;
        }

        return "";
      })
      .filter(Boolean);
  }

  if (!categoryValue) {
    return [];
  }

  return String(categoryValue)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getCategorySlug(categoryValue) {
  return slugify(categoryValue);
}

export function createDefaultCategoryOptions() {
  return defaultCategoryNames.map((name) => ({
    id: `default-${slugify(name)}`,
    name,
    slug: slugify(name)
  }));
}

export function getSelectedCategoryNames(categoryIds, availableCategories) {
  const categoryMap = new Map(availableCategories.map((category) => [category.id, category.name]));

  return categoryIds
    .map((categoryId) => categoryMap.get(categoryId))
    .filter(Boolean);
}

export function getProjectCategoryIds(project) {
  if (Array.isArray(project?.categories) && project.categories.length) {
    return project.categories.map((category) => category.id).filter(Boolean);
  }

  return [];
}

export function getProjectCategoryNames(project) {
  if (Array.isArray(project?.categories) && project.categories.length) {
    return project.categories.map((category) => category.name).filter(Boolean);
  }

  return getCategoryList(project?.category);
}

export function mapCategoryNamesToIds(categoryNames, availableCategories) {
  const categoryMap = new Map(
    availableCategories.map((category) => [category.name.toLowerCase(), category.id])
  );

  return categoryNames
    .map((categoryName) => categoryMap.get(String(categoryName).toLowerCase()))
    .filter(Boolean);
}

export function isCategoryMigrationMissing(error) {
  const message = error?.message?.toLowerCase() || "";

  return (
    message.includes("'category' column") ||
    message.includes("project_categories") ||
    message.includes("categories") ||
    message.includes("relationship") ||
    message.includes("schema cache")
  );
}

export function isLaunchScheduleMigrationMissing(error) {
  const message = error?.message?.toLowerCase() || "";

  return message.includes("launch_week");
}

export function isPricingMigrationMissing(error) {
  const message = error?.message?.toLowerCase() || "";

  return message.includes("pricing_model");
}

export function isVotingMigrationMissing(error) {
  const message = error?.message?.toLowerCase() || "";

  return message.includes("project_votes") || message.includes("vote");
}

export function isProfileMigrationMissing(error) {
  const message = error?.message?.toLowerCase() || "";

  return message.includes("profiles");
}

export function formatAuthorNameValue(ownerEmail) {
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

export function getAuthorDisplayName({
  ownerId = "",
  ownerEmail = "",
  profile = null,
  project = null,
  sessionUser = null
} = {}) {
  const metadata = sessionUser?.user_metadata || {};

  return (
    profile?.display_name ||
    metadata.full_name ||
    metadata.name ||
    formatAuthorNameValue(ownerEmail) ||
    project?.title ||
    ownerId ||
    "Unknown author"
  );
}

export function createFallbackProfile({ ownerId = "", ownerEmail = "", project = null, sessionUser = null } = {}) {
  const metadata = sessionUser?.user_metadata || {};
  const fallbackName = getAuthorDisplayName({
    ownerId,
    ownerEmail,
    project,
    sessionUser
  });

  return {
    owner_id: ownerId,
    owner_email: ownerEmail,
    display_name: fallbackName,
    bio: "",
    avatar_url: metadata.avatar_url || "",
    created_at: null,
    updated_at: null
  };
}

export function normalizeProfile(profile, fallback = {}) {
  return {
    owner_id: profile?.owner_id || fallback.owner_id || "",
    owner_email: profile?.owner_email || fallback.owner_email || "",
    display_name: profile?.display_name || fallback.display_name || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || fallback.avatar_url || "",
    created_at: profile?.created_at || null,
    updated_at: profile?.updated_at || null
  };
}

export function getFirstWednesdayOfYear(year) {
  const januaryFirst = new Date(Date.UTC(year, 0, 1));
  const dayOffset = (3 - januaryFirst.getUTCDay() + 7) % 7;
  januaryFirst.setUTCDate(januaryFirst.getUTCDate() + dayOffset);
  return januaryFirst;
}

export function getLaunchWeekFromDate(baseDate = new Date()) {
  const normalizedDate = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
  const firstWednesday = getFirstWednesdayOfYear(normalizedDate.getUTCFullYear());

  if (normalizedDate < firstWednesday) {
    return 1;
  }

  return Math.floor((normalizedDate - firstWednesday) / millisecondsInWeek) + 1;
}

export function formatDateValue(date) {
  return date.toISOString().slice(0, 10);
}

export function getLaunchDateValueFromWeek(launchWeek, year = new Date().getFullYear()) {
  const normalizedWeek = Number(launchWeek);

  if (!normalizedWeek || normalizedWeek < 1) {
    return "";
  }

  const normalizedYear = Number(year);
  const firstWednesday = getFirstWednesdayOfYear(normalizedYear);
  firstWednesday.setUTCDate(firstWednesday.getUTCDate() + (normalizedWeek - 1) * 7);
  return formatDateValue(firstWednesday);
}

export function formatLaunchSlotDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const parsedDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

export function getLaunchSlotRange(launchWeek, year = new Date().getFullYear()) {
  const startDateValue = getLaunchDateValueFromWeek(launchWeek, year);

  if (!startDateValue) {
    return {
      startDateValue: "",
      endDateValue: "",
      startDateLabel: "",
      endDateLabel: ""
    };
  }

  const startDate = new Date(`${startDateValue}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    return {
      startDateValue: "",
      endDateValue: "",
      startDateLabel: "",
      endDateLabel: ""
    };
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  const endDateValue = formatDateValue(endDate);

  return {
    startDateValue,
    endDateValue,
    startDateLabel: formatLaunchSlotDate(startDateValue),
    endDateLabel: formatLaunchSlotDate(endDateValue)
  };
}

export function getUpcomingLaunchSlots(baseDate = new Date()) {
  const launchYear = baseDate.getFullYear();
  const firstWednesday = getFirstWednesdayOfYear(launchYear);
  const todayUtc = new Date(Date.UTC(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()));
  const firstUpcomingSlot = new Date(firstWednesday);

  while (firstUpcomingSlot < todayUtc) {
    firstUpcomingSlot.setUTCDate(firstUpcomingSlot.getUTCDate() + 7);
  }

  if (firstUpcomingSlot.getUTCFullYear() !== launchYear) {
    return [];
  }

  const slots = [];
  const currentSlot = new Date(firstUpcomingSlot);

  while (currentSlot.getUTCFullYear() === launchYear) {
    const weekNumber = Math.floor((currentSlot - firstWednesday) / millisecondsInWeek) + 1;
    const { startDateValue, endDateValue, startDateLabel, endDateLabel } = getLaunchSlotRange(
      weekNumber,
      launchYear
    );

    slots.push({
      week: weekNumber,
      dateValue: formatDateValue(currentSlot),
      dateLabel: formatLaunchSlotDate(formatDateValue(currentSlot)),
      startDateValue,
      endDateValue,
      startDateLabel,
      endDateLabel
    });

    currentSlot.setUTCDate(currentSlot.getUTCDate() + 7);
  }

  return slots;
}

export function normalizeProject(project) {
  const relationalCategories = Array.isArray(project?.project_categories)
    ? project.project_categories
        .map((entry) => entry?.category ?? entry?.categories ?? entry)
        .filter((category) => category?.id && category?.name)
        .map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug || slugify(category.name)
        }))
    : [];

  return {
    ...project,
    id: normalizeNumericId(project?.id),
    categories: relationalCategories,
    published: Boolean(project?.published),
    deleted: Boolean(project?.deleted),
    created_at: project?.created_at || null,
    launch_week: project?.launch_week ? Number(project.launch_week) : null,
    launch_date: project?.launch_date || getLaunchDateValueFromWeek(project?.launch_week) || "",
    pricing_model: normalizePricingModel(project?.pricing_model),
    vote_count: Number(project?.vote_count) || 0
  };
}
