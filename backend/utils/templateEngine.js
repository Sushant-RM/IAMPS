const computePortfolioScores = require("./portfolioScores");

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPublicationCards(items) {
  if (!items || items.length === 0) {
    return `<p class="empty-note">No publications recorded.</p>`;
  }

  return items
    .map(
      (p) => `
    <article class="pub-card">
      <div class="pub-header">
        <h3 class="pub-title">${escapeHtml(p.title)}</h3>
        <span class="pub-year">${escapeHtml(p.year)}</span>
      </div>
      <p class="pub-meta">${escapeHtml(p.journal || p.category || "Research Publication")}</p>
      ${p.description || p.abstract ? `<p class="pub-desc">${escapeHtml(p.description || p.abstract)}</p>` : ""}
    </article>`
    )
    .join("");
}

function renderTimeline(items, emptyLabel = "No items recorded.") {
  if (!items || items.length === 0) {
    return `<p class="empty-note">${escapeHtml(emptyLabel)}</p>`;
  }

  return items
    .map(
      (item) => `
    <div class="timeline-item">
      <div class="timeline-marker"></div>
      <div class="timeline-body">
        <div class="timeline-header">
          <span class="timeline-title">${escapeHtml(item.title)}</span>
          <span class="timeline-year">${escapeHtml(item.year)}</span>
        </div>
        ${item.category ? `<span class="timeline-badge">${escapeHtml(item.category)}</span>` : ""}
        ${item.description ? `<p class="timeline-desc">${escapeHtml(item.description)}</p>` : ""}
      </div>
    </div>`
    )
    .join("");
}

function renderSkillTags(skills) {
  if (!skills || skills.length === 0) {
    return `<span class="skill-tag">Problem Solving</span><span class="skill-tag">Research</span><span class="skill-tag">Communication</span>`;
  }
  return skills.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("");
}

function renderMetricCards(scores) {
  return `
    <div class="metric-grid">
      <div class="metric-card">
        <span class="metric-label">Portfolio Score</span>
        <span class="metric-value">${scores.portfolioScore}%</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Career Readiness</span>
        <span class="metric-value">${scores.careerReadiness}%</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">ATS Score</span>
        <span class="metric-value">${scores.atsScore}%</span>
      </div>
    </div>`;
}

function stripConditionalSection(html, marker, hasContent) {
  const start = `<!-- ${marker}_SECTION_START -->`;
  const end = `<!-- ${marker}_SECTION_END -->`;
  if (hasContent) {
    return html.replace(new RegExp(start, "g"), "").replace(new RegExp(end, "g"), "");
  }
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`, "g");
  return html.replace(regex, "");
}

function renderTemplate(template, data) {
  let html = template;

  const scores = computePortfolioScores({
    headline: data.headline,
    bio: data.bio,
    careerObjective: data.careerObjective,
    skillsSummary: data.skillsSummary,
    skills: data.skills,
    achievements: data.events || data.achievements,
    papers: data.publications,
    cgpa: data.cgpa,
    careerAnalytics: data.careerAnalytics,
  });

  const contactParts = [
    data.email,
    data.department ? `Dept. ${data.department}` : "",
    data.cgpa && data.cgpa !== "N/A" ? `CGPA ${data.cgpa}` : "",
    data.usn && data.usn !== "N/A" ? `USN ${data.usn}` : "",
  ].filter(Boolean);

  const simpleReplacements = {
    name: data.name || "Student Name",
    email: data.email || "",
    department: data.department || "Computer Science",
    university: data.university || "University",
    cgpa: data.cgpa && data.cgpa !== "N/A" ? data.cgpa : "",
    usn: data.usn && data.usn !== "N/A" ? data.usn : "",
    contactLine: contactParts.join(" · "),
    headline: data.headline?.trim() || "",
    bio: data.bio?.trim() || "",
    careerObjective: data.careerObjective?.trim() || "",
    skillsSummary: data.skillsSummary?.trim() || "",
    researchInterests: data.researchInterests?.trim() || data.headline?.trim() || "",
    portfolioScore: String(scores.portfolioScore),
    careerReadiness: String(scores.careerReadiness),
    atsScore: String(scores.atsScore),
    completeness: String(scores.completeness),
    theme: data.theme || "professional",
  };

  Object.entries(simpleReplacements).forEach(([key, value]) => {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), escapeHtml(value));
  });

  html = html.replace("{{publications}}", renderPublicationCards(data.publications));
  html = html.replace("{{certifications}}", renderTimeline(data.certifications, "No certifications recorded."));
  html = html.replace("{{awards}}", renderTimeline(data.awards, "No awards recorded."));
  html = html.replace("{{leadership}}", renderTimeline(data.leadership, "No leadership roles recorded."));
  html = html.replace("{{projects}}", renderTimeline(data.projects, "No projects recorded."));
  html = html.replace("{{achievements}}", renderTimeline(data.achievements, "No achievements recorded."));
  html = html.replace("{{events}}", renderTimeline(data.events, "No activities recorded."));
  html = html.replace("{{skillsList}}", renderSkillTags(data.skills));
  html = html.replace("{{scoreMetrics}}", renderMetricCards(scores));

  html = stripConditionalSection(html, "HEADLINE", !!data.headline?.trim());
  html = stripConditionalSection(html, "BIO", !!data.bio?.trim());
  html = stripConditionalSection(html, "OBJECTIVE", !!data.careerObjective?.trim());
  html = stripConditionalSection(html, "SKILLS", !!data.skillsSummary?.trim());
  html = stripConditionalSection(html, "RESEARCH_INTERESTS", !!(data.researchInterests?.trim() || data.headline?.trim()));
  html = stripConditionalSection(html, "CONTACT", contactParts.length > 0);
  html = stripConditionalSection(html, "CGPA", !!(data.cgpa && data.cgpa !== "N/A"));
  html = stripConditionalSection(html, "SCORES", true);

  html = html.replace(/<!--[\s\S]*?-->/g, "");

  return html;
}

module.exports = renderTemplate;
