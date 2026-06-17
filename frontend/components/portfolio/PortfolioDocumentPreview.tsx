'use client';

import { computePortfolioScores } from '../../lib/portfolioScores';
import { buildPreviewSections, type PortfolioItem } from '../../lib/portfolioSections';
import { getThemeAccent, type PortfolioTheme } from '../../lib/portfolioThemes';

export interface PortfolioPreviewData {
  email?: string;
  usn?: string;
  department?: string;
  cgpa?: string | number;
  skills?: string[];
  papers?: PortfolioItem[];
  achievements?: PortfolioItem[];
  careerAnalytics?: {
    placement_readiness?: { overall_score?: number };
  };
}

interface PortfolioDocumentPreviewProps {
  theme: PortfolioTheme;
  name: string;
  headline: string;
  bio: string;
  careerObjective: string;
  skillsSummary: string;
  data: PortfolioPreviewData;
}

function Section({ title, children, accentClass = 'text-blue-600 border-blue-100' }: { title: string; children: React.ReactNode; accentClass?: string }) {
  return (
    <section className="mb-4 break-inside-avoid">
      <h2 className={`text-[10px] font-extrabold uppercase tracking-[0.15em] border-b pb-1 mb-2 ${accentClass}`}>{title}</h2>
      {children}
    </section>
  );
}

function BodyText({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{children}</p>;
}

function PublicationCards({ items, variant = 'professional' }: { items: PortfolioItem[]; variant?: 'professional' | 'academic' | 'minimal' }) {
  if (!items.length) return <p className="text-[11px] text-slate-400 italic">No publications recorded.</p>;
  const cardClass =
    variant === 'academic'
      ? 'border-l-2 border-slate-700 bg-white px-3 py-2.5 break-inside-avoid'
      : variant === 'minimal'
        ? 'mb-2 break-inside-avoid'
        : 'border-l-[3px] border-blue-600 bg-slate-50 px-3 py-2.5 break-inside-avoid';
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <article key={idx} className={cardClass}>
          <div className={variant === 'minimal' ? 'block' : 'flex justify-between gap-3 items-start'}>
            <h3 className="text-[11px] font-bold text-slate-900 leading-snug inline">{item.title}</h3>
            <span className={`text-[10px] font-semibold text-slate-500 ${variant === 'minimal' ? 'ml-2 inline' : 'shrink-0'}`}>{item.year}</span>
          </div>
          {variant !== 'minimal' && <p className="text-[10px] text-slate-500 italic mt-0.5">Research Publication</p>}
          {(item.abstract || item.description) && (
            <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{item.abstract || item.description}</p>
          )}
        </article>
      ))}
    </div>
  );
}

function Timeline({ items, emptyLabel }: { items: PortfolioItem[]; emptyLabel: string }) {
  if (!items.length) return <p className="text-[11px] text-slate-400 italic">{emptyLabel}</p>;
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2.5 break-inside-avoid">
          <div className="w-0.5 bg-slate-300 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2 items-baseline">
              <span className="text-[11px] font-bold text-slate-900">{item.title}</span>
              <span className="text-[10px] text-slate-500 shrink-0">{item.year}</span>
            </div>
            {item.category && (
              <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {item.category}
              </span>
            )}
            {item.description && <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillTags({ skills }: { skills: string[] }) {
  if (!skills.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {skills.map((skill) => (
        <span key={skill} className="px-2 py-0.5 text-[9px] font-semibold rounded-full bg-blue-50 text-blue-800 border border-blue-100">
          {skill}
        </span>
      ))}
    </div>
  );
}

function MetricGrid({ portfolioScore, careerReadiness, atsScore }: { portfolioScore: number; careerReadiness: number; atsScore: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'Portfolio Score', value: portfolioScore },
        { label: 'Career Readiness', value: careerReadiness },
        { label: 'ATS Score', value: atsScore },
      ].map((metric) => (
        <div key={metric.label} className="border border-blue-100 rounded-md bg-slate-50 px-2 py-2 text-center break-inside-avoid">
          <span className="block text-[8px] font-bold uppercase tracking-wide text-slate-500">{metric.label}</span>
          <span className="block text-lg font-black text-blue-700">{metric.value}%</span>
        </div>
      ))}
    </div>
  );
}

function AcademicPreview({
  name,
  headline,
  bio,
  careerObjective,
  skillsSummary,
  data,
  sections,
}: {
  name: string;
  headline: string;
  bio: string;
  careerObjective: string;
  skillsSummary: string;
  data: PortfolioPreviewData;
  sections: ReturnType<typeof buildPreviewSections>;
}) {
  return (
    <div className="p-8 sm:p-10 text-slate-800 leading-relaxed">
      <header className="text-center pb-3 mb-5 border-b border-slate-700">
        <h1 className="text-2xl sm:text-3xl font-normal uppercase tracking-[0.2em] text-slate-900">{name}</h1>
        <p className="text-xs italic text-slate-600 mt-2">{data.department || 'Computer Science'} · University</p>
        {headline && <p className="text-xs italic text-blue-900 font-semibold mt-2">{headline}</p>}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 mt-3">
          {data.cgpa && data.cgpa !== 'N/A' && <span>CGPA: {data.cgpa}</span>}
          {data.email && <span>{data.email}</span>}
          {data.usn && data.usn !== 'N/A' && <span>{data.usn}</span>}
        </div>
        <div className="h-0.5 bg-slate-700 mt-3" />
      </header>

      {bio && (
        <Section title="Academic Summary" accentClass="text-slate-900 border-slate-400">
          <BodyText>{bio}</BodyText>
        </Section>
      )}

      <Section title="Research Publications" accentClass="text-slate-900 border-slate-400">
        <PublicationCards items={sections.publications} variant="academic" />
      </Section>

      {headline && (
        <Section title="Research Interests" accentClass="text-slate-900 border-slate-400">
          <BodyText>{headline}</BodyText>
        </Section>
      )}

      <Section title="Academic Achievements" accentClass="text-slate-900 border-slate-400">
        <Timeline items={sections.achievements} emptyLabel="No achievements recorded." />
      </Section>

      <Section title="Certifications" accentClass="text-slate-900 border-slate-400">
        <Timeline items={sections.certifications} emptyLabel="No certifications recorded." />
      </Section>

      <Section title="Technical Skills" accentClass="text-slate-900 border-slate-400">
        {skillsSummary && <BodyText>{skillsSummary}</BodyText>}
        <SkillTags skills={data.skills || []} />
      </Section>

      <Section title="Projects" accentClass="text-slate-900 border-slate-400">
        <Timeline items={sections.projects} emptyLabel="No projects recorded." />
      </Section>

      <Section title="Awards" accentClass="text-slate-900 border-slate-400">
        <Timeline items={sections.awards} emptyLabel="No awards recorded." />
      </Section>

      {careerObjective && (
        <Section title="Future Academic Objectives" accentClass="text-slate-900 border-slate-400">
          <BodyText>{careerObjective}</BodyText>
        </Section>
      )}

      <footer className="border-t border-slate-300 pt-3 mt-6 text-center text-[10px] text-slate-500 uppercase tracking-wider">
        Curriculum Vitae · {name}
      </footer>
    </div>
  );
}

function MinimalPreview({
  name,
  headline,
  bio,
  careerObjective,
  skillsSummary,
  data,
  sections,
}: {
  name: string;
  headline: string;
  bio: string;
  careerObjective: string;
  skillsSummary: string;
  data: PortfolioPreviewData;
  sections: ReturnType<typeof buildPreviewSections>;
}) {
  const contact = [data.email, data.department, data.cgpa && data.cgpa !== 'N/A' ? `CGPA ${data.cgpa}` : '', data.usn && data.usn !== 'N/A' ? data.usn : ''].filter(Boolean).join(' · ');

  return (
    <div className="p-6 sm:p-8 text-black leading-normal tracking-tight">
      <header className="mb-4">
        <h1 className="text-xl font-bold">{name}</h1>
        {headline && <p className="text-sm font-semibold text-neutral-700 mt-0.5">{headline}</p>}
        {contact && <p className="text-xs text-neutral-600 mt-1.5">{contact}</p>}
      </header>

      {bio && (
        <Section title="Summary" accentClass="text-black border-neutral-300">
          <BodyText>{bio}</BodyText>
        </Section>
      )}

      <Section title="Skills" accentClass="text-black border-neutral-300">
        {skillsSummary && <BodyText>{skillsSummary}</BodyText>}
        {data.skills && data.skills.length > 0 && (
          <p className="text-xs text-neutral-800 mt-1">{data.skills.join(' · ')}</p>
        )}
      </Section>

      <Section title="Experience & Achievements" accentClass="text-black border-neutral-300">
        <Timeline items={sections.achievements} emptyLabel="No achievements recorded." />
      </Section>

      <Section title="Publications" accentClass="text-black border-neutral-300">
        <PublicationCards items={sections.publications} variant="minimal" />
      </Section>

      <Section title="Projects" accentClass="text-black border-neutral-300">
        <Timeline items={sections.projects} emptyLabel="No projects recorded." />
      </Section>

      {careerObjective && (
        <Section title="Objective" accentClass="text-black border-neutral-300">
          <BodyText>{careerObjective}</BodyText>
        </Section>
      )}
    </div>
  );
}

function ProfessionalPreview({
  name,
  headline,
  bio,
  careerObjective,
  skillsSummary,
  data,
  sections,
  theme,
  scores,
}: {
  name: string;
  headline: string;
  bio: string;
  careerObjective: string;
  skillsSummary: string;
  data: PortfolioPreviewData;
  sections: ReturnType<typeof buildPreviewSections>;
  theme: PortfolioTheme;
  scores: ReturnType<typeof computePortfolioScores>;
}) {
  const accent = getThemeAccent(theme);
  const accentTitle = theme === 'executive' ? 'text-slate-900 border-slate-300' : theme === 'modern' ? 'text-teal-700 border-teal-100' : 'text-blue-600 border-blue-100';

  return (
    <div className="p-8 sm:p-10 text-slate-800 leading-relaxed">
      <header className="mb-5 pb-4 border-b-2 border-blue-600 break-inside-avoid">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{name}</h1>
        <div className={`w-14 h-1 rounded-full mt-2 mb-2 ${accent.bar}`} />
        {headline && <p className={`text-sm font-semibold ${accent.heading}`}>{headline}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-2">
          {data.email && <span>{data.email}</span>}
          {data.department && <span>{data.department}</span>}
          {data.cgpa && data.cgpa !== 'N/A' && <span>CGPA {data.cgpa}</span>}
        </div>
      </header>

      {bio && (
        <Section title="Professional Summary" accentClass={accentTitle}>
          <BodyText>{bio}</BodyText>
        </Section>
      )}

      <Section title="Skills" accentClass={accentTitle}>
        {skillsSummary && <BodyText>{skillsSummary}</BodyText>}
        <SkillTags skills={data.skills || []} />
      </Section>

      <Section title="Projects" accentClass={accentTitle}>
        <Timeline items={sections.projects} emptyLabel="No projects recorded." />
      </Section>

      <Section title="Achievements" accentClass={accentTitle}>
        <Timeline items={sections.achievements} emptyLabel="No achievements recorded." />
      </Section>

      <Section title="Research & Publications" accentClass={accentTitle}>
        <PublicationCards items={sections.publications} />
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Section title="Certifications" accentClass={accentTitle}>
          <Timeline items={sections.certifications} emptyLabel="No certifications recorded." />
        </Section>
        <Section title="Leadership" accentClass={accentTitle}>
          <Timeline items={sections.leadership} emptyLabel="No leadership roles recorded." />
        </Section>
      </div>

      <Section title="Portfolio Metrics" accentClass={accentTitle}>
        <MetricGrid portfolioScore={scores.portfolioScore} careerReadiness={scores.careerReadiness} atsScore={scores.atsScore} />
      </Section>

      {careerObjective && (
        <Section title="Career Objective" accentClass={accentTitle}>
          <BodyText>{careerObjective}</BodyText>
        </Section>
      )}

      <footer className="border-t border-slate-200 pt-3 mt-4 flex justify-between text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
        <span>{name} · Professional Portfolio</span>
        <span>Ready to Export</span>
      </footer>
    </div>
  );
}

export default function PortfolioDocumentPreview({
  theme,
  name,
  headline,
  bio,
  careerObjective,
  skillsSummary,
  data,
}: PortfolioDocumentPreviewProps) {
  const sections = buildPreviewSections(data.papers || [], data.achievements || []);
  const scores = computePortfolioScores({
    headline,
    bio,
    careerObjective,
    skillsSummary,
    skills: data.skills,
    achievements: data.achievements,
    papers: data.papers,
    cgpa: data.cgpa,
    careerAnalytics: data.careerAnalytics,
  });

  if (theme === 'academic') {
    return (
      <AcademicPreview
        name={name}
        headline={headline}
        bio={bio}
        careerObjective={careerObjective}
        skillsSummary={skillsSummary}
        data={data}
        sections={sections}
      />
    );
  }

  if (theme === 'minimal') {
    return (
      <MinimalPreview
        name={name}
        headline={headline}
        bio={bio}
        careerObjective={careerObjective}
        skillsSummary={skillsSummary}
        data={data}
        sections={sections}
      />
    );
  }

  return (
    <ProfessionalPreview
      name={name}
      headline={headline}
      bio={bio}
      careerObjective={careerObjective}
      skillsSummary={skillsSummary}
      data={data}
      sections={sections}
      theme={theme}
      scores={scores}
    />
  );
}
