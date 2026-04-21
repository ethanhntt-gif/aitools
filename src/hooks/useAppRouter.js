import { useEffect, useState } from "react";
import { getCategorySlug, normalizeNumericId, slugify } from "../lib/app-utils";

function parseAppRoute(pathname, sessionUserId = "") {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/dashboard") {
    return {
      activeView: "dashboard",
      activeSlug: "",
      activePreviewId: "",
      activeAuthorId: sessionUserId || "",
      activeCategorySlug: ""
    };
  }

  if (path.startsWith("/dashboard/")) {
    const authorId = decodeURIComponent(path.replace("/dashboard/", ""));
    return {
      activeView: "dashboard",
      activeSlug: "",
      activePreviewId: "",
      activeAuthorId: sessionUserId ? authorId : "",
      activeCategorySlug: ""
    };
  }

  if (path === "/projects") {
    return {
      activeView: "projects",
      activeSlug: "",
      activePreviewId: "",
      activeAuthorId: "",
      activeCategorySlug: ""
    };
  }

  if (path === "/terms") {
    return {
      activeView: "terms",
      activeSlug: "",
      activePreviewId: "",
      activeAuthorId: "",
      activeCategorySlug: ""
    };
  }

  if (path === "/privacy") {
    return {
      activeView: "privacy",
      activeSlug: "",
      activePreviewId: "",
      activeAuthorId: "",
      activeCategorySlug: ""
    };
  }

  if (path.startsWith("/project/")) {
    return {
      activeView: "project",
      activeSlug: decodeURIComponent(path.replace("/project/", "")),
      activePreviewId: "",
      activeAuthorId: "",
      activeCategorySlug: ""
    };
  }

  if (path.startsWith("/preview/")) {
    return {
      activeView: "project",
      activeSlug: "",
      activePreviewId: normalizeNumericId(decodeURIComponent(path.replace("/preview/", ""))),
      activeAuthorId: "",
      activeCategorySlug: ""
    };
  }

  if (path.startsWith("/category/")) {
    return {
      activeView: "category",
      activeSlug: "",
      activePreviewId: "",
      activeAuthorId: "",
      activeCategorySlug: decodeURIComponent(path.replace("/category/", ""))
    };
  }

  return {
    activeView: "home",
    activeSlug: "",
    activePreviewId: "",
    activeAuthorId: "",
    activeCategorySlug: ""
  };
}

export default function useAppRouter(sessionUserId = "") {
  const [route, setRoute] = useState(() => parseAppRoute(window.location.pathname, sessionUserId));
  const [homeCategoryFilterSlug, setHomeCategoryFilterSlug] = useState("");

  useEffect(() => {
    function syncRouteFromLocation() {
      setRoute(parseAppRoute(window.location.pathname, sessionUserId));
      setHomeCategoryFilterSlug("");
    }

    syncRouteFromLocation();
    window.addEventListener("popstate", syncRouteFromLocation);

    return () => {
      window.removeEventListener("popstate", syncRouteFromLocation);
    };
  }, [sessionUserId]);

  function navigate(pathname) {
    window.history.pushState({}, "", pathname);
    setRoute(parseAppRoute(pathname, sessionUserId));
    setHomeCategoryFilterSlug("");
  }

  return {
    ...route,
    homeCategoryFilterSlug,
    setHomeCategoryFilterSlug,
    openDashboard() {
      navigate("/dashboard");
    },
    openProjectsPage() {
      navigate("/projects");
    },
    openHome() {
      navigate("/");
    },
    openTermsPage() {
      navigate("/terms");
    },
    openPrivacyPage() {
      navigate("/privacy");
    },
    openProject(project) {
      navigate(`/project/${slugify(project.title)}`);
    },
    openProjectPreview(project) {
      navigate(`/preview/${project.id}`);
    },
    openCategoryPage(categoryName) {
      navigate(`/category/${getCategorySlug(categoryName)}`);
    },
    openAuthorDashboard(ownerId) {
      if (!ownerId) {
        return;
      }

      navigate(`/dashboard/${encodeURIComponent(ownerId)}`);
    },
    toggleHomeCategoryFilter(categoryName) {
      const categorySlug = getCategorySlug(categoryName);
      const nextView = route.activeView === "projects" ? "projects" : "home";

      window.history.pushState({}, "", nextView === "projects" ? "/projects" : "/");
      setRoute(parseAppRoute(nextView === "projects" ? "/projects" : "/", sessionUserId));
      setHomeCategoryFilterSlug((current) => (current === categorySlug ? "" : categorySlug));
    }
  };
}
