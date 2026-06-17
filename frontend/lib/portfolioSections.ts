export interface PortfolioItem {
  title: string;
  year?: number | string;
  category?: string;
  description?: string;
  abstract?: string;
}

export interface CategorizedPortfolio {
  publications: PortfolioItem[];
  certifications: PortfolioItem[];
  awards: PortfolioItem[];
  leadership: PortfolioItem[];
  projects: PortfolioItem[];
  achievements: PortfolioItem[];
}

const CERT_RE = /cert|license|credential|course/i;
const AWARD_RE = /award|honor|honour|prize|medal|scholar|recognition/i;
const LEAD_RE = /lead|president|captain|chair|organiz|committee|head|mentor|volunteer|coordinator/i;
const PROJ_RE = /project|hackathon|build|app|software|development|capstone|internship/i;

export function categorizeAchievements(achievements: PortfolioItem[] = []): CategorizedPortfolio {
  const certifications: PortfolioItem[] = [];
  const awards: PortfolioItem[] = [];
  const leadership: PortfolioItem[] = [];
  const projects: PortfolioItem[] = [];
  const general: PortfolioItem[] = [];

  for (const item of achievements) {
    const combined = `${item.category || ''} ${item.title || ''}`.toLowerCase();
    if (CERT_RE.test(combined)) certifications.push(item);
    else if (AWARD_RE.test(combined)) awards.push(item);
    else if (LEAD_RE.test(combined)) leadership.push(item);
    else if (PROJ_RE.test(combined)) projects.push(item);
    else general.push(item);
  }

  return {
    publications: [],
    certifications,
    awards,
    leadership,
    projects,
    achievements: general,
  };
}

export function buildPreviewSections(papers: PortfolioItem[] = [], achievements: PortfolioItem[] = []) {
  const categorized = categorizeAchievements(achievements);
  return { ...categorized, publications: papers };
}
