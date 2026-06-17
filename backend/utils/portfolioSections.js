const CERT_RE = /cert|license|credential|course/i;
const AWARD_RE = /award|honor|honour|prize|medal|scholar|recognition/i;
const LEAD_RE = /lead|president|captain|chair|organiz|committee|head|mentor|volunteer|coordinator/i;
const PROJ_RE = /project|hackathon|build|app|software|development|capstone|internship/i;

function categorizeEvents(events = []) {
  const certifications = [];
  const awards = [];
  const leadership = [];
  const projects = [];
  const achievements = [];

  for (const item of events) {
    const combined = `${item.category || ""} ${item.title || ""}`.toLowerCase();
    if (CERT_RE.test(combined)) certifications.push(item);
    else if (AWARD_RE.test(combined)) awards.push(item);
    else if (LEAD_RE.test(combined)) leadership.push(item);
    else if (PROJ_RE.test(combined)) projects.push(item);
    else achievements.push(item);
  }

  return { certifications, awards, leadership, projects, achievements };
}

function buildPortfolioSections(formatted) {
  const { publications = [], events = [] } = formatted;
  const categorized = categorizeEvents(events);

  return {
    publications,
    events,
    ...categorized,
  };
}

module.exports = { categorizeEvents, buildPortfolioSections };
