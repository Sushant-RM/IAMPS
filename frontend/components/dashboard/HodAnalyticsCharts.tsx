'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HodAnalyticsChartsProps {
  publicationTrend: { month: string; papers: number }[];
  achievementSpread: { name: string; count: number }[];
}

export default function HodAnalyticsCharts({ publicationTrend, achievementSpread }: HodAnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <div className="bg-[#131b2e] border border-slate-800/60 p-4 sm:p-6 rounded-[16px] shadow-md min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 uppercase tracking-tight">Research Output Trends</h3>
        <div className="h-56 sm:h-64 overflow-touch">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={publicationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a354f" strokeOpacity={0.3} />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip contentStyle={{ backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="papers" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#131b2e] border border-slate-800/60 p-4 sm:p-6 rounded-[16px] shadow-md min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-white mb-4 uppercase tracking-tight">Achievement Segments</h3>
        <div className="h-56 sm:h-64 overflow-touch">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={achievementSpread}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a354f" strokeOpacity={0.3} />
              <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 'bold' }} />
              <Tooltip contentStyle={{ backgroundColor: '#131b2e', border: '1px solid #334155', borderRadius: '12px' }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
