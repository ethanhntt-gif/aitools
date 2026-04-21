import { getLaunchWeekFromDate } from "../lib/app-utils";

export const demoProjects = [
  {
    id: 1,
    owner_id: "demo-author-1",
    title: "AI Outreach Assistant",
    slogan: "Prospecting and follow-ups on autopilot.",
    description: "Automates prospect research, drafts outreach, and tracks conversations.",
    category: "Automation",
    pricing_model: "freemium",
    owner_email: "alex@aitools.dev",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=900&q=80",
    published: true,
    created_at: "2026-04-01T10:00:00.000Z",
    launch_week: getLaunchWeekFromDate(new Date()),
    vote_count: 24
  },
  {
    id: 2,
    owner_id: "demo-author-2",
    title: "Content Studio",
    slogan: "From brief to launch-ready content in minutes.",
    description: "Turns briefs into social posts, blog outlines, and campaign assets in minutes.",
    category: "Content",
    pricing_model: "paid",
    owner_email: "maya@aitools.dev",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    published: true,
    created_at: "2026-04-03T10:00:00.000Z",
    launch_week: getLaunchWeekFromDate(new Date()),
    vote_count: 19
  },
  {
    id: 3,
    owner_id: "demo-author-3",
    title: "Support Copilot",
    slogan: "Faster replies, calmer queues, better support.",
    description: "Suggests support replies, summarizes tickets, and surfaces urgent issues.",
    category: "Customer Care",
    pricing_model: "free",
    owner_email: "ethan@aitools.dev",
    project_url: "#",
    image_url:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    published: true,
    created_at: "2026-04-05T10:00:00.000Z",
    launch_week: Math.max(1, getLaunchWeekFromDate(new Date()) - 1),
    vote_count: 8
  }
];

export const demoProfiles = {
  "demo-author-1": {
    owner_id: "demo-author-1",
    owner_email: "alex@aitools.dev",
    display_name: "Alex Mercer",
    headline: "Building AI systems for outbound teams.",
    bio: "I work on sales automation and operator tooling for lean growth teams.",
    avatar_url: ""
  },
  "demo-author-2": {
    owner_id: "demo-author-2",
    owner_email: "maya@aitools.dev",
    display_name: "Maya Chen",
    headline: "Helping teams turn briefs into content engines.",
    bio: "I design AI content workflows for founders, marketers, and small creative teams.",
    avatar_url: ""
  },
  "demo-author-3": {
    owner_id: "demo-author-3",
    owner_email: "ethan@aitools.dev",
    display_name: "Ethan Hunt",
    headline: "Support tooling, calm queues, and clear handoffs.",
    bio: "Focused on AI copilots that make customer support faster and more humane.",
    avatar_url: ""
  }
};
