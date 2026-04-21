export function getProjectsWithVotes(projects, voteCounts, votedProjectIds) {
  return projects.map((project) => ({
    ...project,
    vote_count: typeof voteCounts[project.id] === "number" ? voteCounts[project.id] : Number(project.vote_count) || 0,
    user_voted: votedProjectIds.includes(project.id)
  }));
}

export function getPublicProjects(projectsWithVotes) {
  return projectsWithVotes.filter((project) => project.published);
}

export function getCurrentLaunchProjects(publicProjects, currentLaunchWeek, currentLaunchRange) {
  return publicProjects
    .filter((project) => {
      if (project.launch_date) {
        return (
          project.launch_date >= currentLaunchRange.startDateValue &&
          project.launch_date <= currentLaunchRange.endDateValue
        );
      }

      return Number(project.launch_week) === currentLaunchWeek;
    })
    .sort((left, right) => {
      if ((right.vote_count || 0) !== (left.vote_count || 0)) {
        return (right.vote_count || 0) - (left.vote_count || 0);
      }

      return new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime();
    });
}

export function getCategoryProjects(publicProjects, activeCategorySlug, getProjectCategoryNames, getCategorySlug) {
  return publicProjects.filter((project) =>
    getProjectCategoryNames(project).some((categoryName) => getCategorySlug(categoryName) === activeCategorySlug)
  );
}

export function getCategoryFilteredProjects(
  publicProjects,
  homeCategoryFilterSlug,
  getProjectCategoryNames,
  getCategorySlug
) {
  if (!homeCategoryFilterSlug) {
    return publicProjects;
  }

  return publicProjects.filter((project) =>
    getProjectCategoryNames(project).some((categoryName) => getCategorySlug(categoryName) === homeCategoryFilterSlug)
  );
}

export function getFilteredProjectsBySearch(projects, searchQuery, getProjectCategoryNames) {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  if (!normalizedSearchQuery) {
    return projects;
  }

  return projects.filter((project) => {
    const categoryText = getProjectCategoryNames(project).join(" ");
    return [project.title, project.slogan, categoryText]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearchQuery));
  });
}

export function getCategoryCounts(publicProjects, allCategoryNames, getProjectCategoryNames) {
  return allCategoryNames.map((categoryName) => ({
    name: categoryName,
    slug: categoryName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    count: publicProjects.filter((project) => getProjectCategoryNames(project).includes(categoryName)).length
  }));
}

export function getLaunchWeekCounts(projects) {
  return projects
    .map((project) => Number(project.launch_week))
    .filter((launchWeek) => Number.isFinite(launchWeek) && launchWeek > 0)
    .reduce((result, launchWeek) => {
      result[launchWeek] = (result[launchWeek] || 0) + 1;
      return result;
    }, {});
}
