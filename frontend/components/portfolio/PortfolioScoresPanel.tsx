import { computePortfolioScores, type PortfolioScoreInput } from '../../lib/portfolioScores';

interface PortfolioScoresPanelProps {
  data: PortfolioScoreInput;
}

function ScoreRing({ label, value, barColor }: { label: string; value: number; barColor: string }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-[12px] p-4 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className={`text-2xl font-black ${barColor.replace('bg-', 'text-')}`}>{value}%</p>
      <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function PortfolioScoresPanel({ data }: PortfolioScoresPanelProps) {
  const scores = computePortfolioScores(data);

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white dark:bg-[#131b2e] rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm">
      <ScoreRing label="Completeness" value={scores.completeness} barColor="bg-blue-400" />
      <ScoreRing label="ATS Score" value={scores.atsScore} barColor="bg-emerald-400" />
      <ScoreRing label="Career Ready" value={scores.careerReadiness} barColor="bg-purple-400" />
      <ScoreRing label="Portfolio Score" value={scores.portfolioScore} barColor="bg-amber-400" />
      {scores.skillGaps > 0 && (
        <p className="col-span-full text-xs text-slate-500 font-medium">
          Skill gap: add {scores.skillGaps} more core skill{scores.skillGaps > 1 ? 's' : ''} to improve ATS match.
        </p>
      )}
    </section>
  );
}
