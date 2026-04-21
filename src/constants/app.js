export const initialForm = {
  title: "",
  slogan: "",
  description: "",
  category: [],
  pricing_model: "",
  project_url: "",
  image_url: "",
  logo_url: "",
  launch_week: ""
};

export const initialProfileForm = {
  display_name: "",
  bio: "",
  avatar_url: ""
};

export const storageBucket = "project-assets";
export const totalModalSteps = 3;
export const maxCategories = 5;
export const launchWeekCapacity = 12;
export const initialVisibleProjectsCount = 21;
export const projectsCacheKey = "aitools.projects-cache.v1";
export const approvalToastCacheKey = "aitools.approval-toasts.v1";
export const themePreferenceKey = "aitools.theme-preference.v1";
export const demoVotesCacheKey = "aitools.demo-votes.v1";

export const defaultCategoryNames = [
  "Automation",
  "AI Agents",
  "Content",
  "Marketing",
  "Sales",
  "Customer Support",
  "Productivity",
  "Analytics",
  "Research",
  "Coding",
  "Design",
  "Education",
  "Video",
  "Audio",
  "Image Generation",
  "Data",
  "Finance",
  "Healthcare",
  "Recruiting",
  "Other"
];

export const pricingModelOptions = ["free", "freemium", "paid"];
