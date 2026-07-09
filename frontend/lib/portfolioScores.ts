export interface PortfolioScoreInput {
  headline?: string;
  bio?: string;
  careerObjective?: string;
  skillsSummary?: string;
  skills?: string[];
  achievements?: unknown[];
  papers?: unknown[];
  cgpa?: string | number;
  careerAnalytics?: {
    placement_readiness?: { overall_score?: number };
  };
}

export interface PortfolioScores {
  completeness: number;
  atsScore: number;
  careerReadiness: number;
  portfolioScore: number;
  skillGaps: number;
}

export function computePortfolioScores(input: PortfolioScoreInput): PortfolioScores {
  const fields = [
    input.headline?.trim(),
    input.bio?.trim(),
    input.careerObjective?.trim(),
    input.skillsSummary?.trim(),
    (input.skills?.length ?? 0) > 0,
    (input.achievements?.length ?? 0) > 0,
    (input.papers?.length ?? 0) > 0,
    input.cgpa && input.cgpa !== 'N/A',
  ];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  let atsScore = 40;
  if (input.headline?.trim()) atsScore += 10;
  if (input.bio && input.bio.length > 80) atsScore += 15;
  if ((input.skills?.length ?? 0) >= 3) atsScore += 15;
  if ((input.papers?.length ?? 0) > 0) atsScore += 10;
  if ((input.achievements?.length ?? 0) > 0) atsScore += 10;
  atsScore = Math.min(100, atsScore);

  const rawCareerReadiness =
    input.careerAnalytics?.placement_readiness?.overall_score ??
    (completeness * 0.6 + atsScore * 0.4);
  const careerReadiness = Math.max(0, Math.min(100, Math.round(rawCareerReadiness)));

  const skillGaps = Math.max(0, 5 - (input.skills?.length ?? 0));
  const portfolioScore = Math.round(completeness * 0.35 + atsScore * 0.35 + careerReadiness * 0.3);

  return { completeness, atsScore, careerReadiness, portfolioScore, skillGaps };
}
