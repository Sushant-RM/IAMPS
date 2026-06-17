import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getStoredUser } from '../../lib/auth';
import { getRoleNavigation } from '../../lib/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';

const COLORS = ['#6366f1','#f43f5e','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AnnualReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('admin');

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role) setUserRole(user.role);
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/report/annual?year=${year}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch report. Make sure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  };

  const toChartArray = (obj: Record<string, number>) =>
    Object.entries(obj || {}).map(([name, value]) => ({ name, value }));

  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const s = data.summary;

    // Title
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text(`Annual Institutional Report — ${year}`, 14, 22);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date(data.generated_at).toLocaleString()}`, 14, 29);

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Summary', 14, 40);
    autoTable(doc, {
      startY: 44,
      head: [['Metric', 'Count']],
      body: [
        ['Approved Papers', s.total_papers],
        ['Events Conducted', s.total_events],
        ['Achievements', s.total_achievements],
        ['Registered Students', s.total_students],
        ['Faculty Members', s.total_faculty],
        ['New Users This Year', s.new_users],
        ['Papers Pending Review', s.pending_papers],
      ],
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    });

    // Dept paper counts
    let y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.text('Papers by Department', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Department', 'Papers']],
      body: Object.entries(data.dept_paper_counts).map(([d, c]): [string, string | number] => [d, c as number]),
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Papers list
    y = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.text('Approved Papers', 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [['Title', 'Department', 'Type', 'Authors']],
      body: data.papers.map((p: any) => [
        p.title,
        p.departmentId?.name || '—',
        p.type || '—',
        (p.authors || []).join(', ') || '—'
      ]),
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });

    // Top contributors
    if (data.top_contributors?.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 12;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text('Top Contributors', 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [['Name', 'Papers']],
        body: data.top_contributors.map((c: any): [string, number] => [c.name, c.count]),
        headStyles: { fillColor: [139, 92, 246] },
      });
    }

    // Achievements
    if (data.achievements?.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 12;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text('Achievements', 14, y);
      autoTable(doc, {
        startY: y + 4,
        head: [['Title', 'Category', 'Department', 'Student']],
        body: data.achievements.map((a: any): [string, string, string, string] => [
          a.achievementTitle, a.category, a.department, a.studentName
        ]),
        headStyles: { fillColor: [244, 63, 94] },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`Annual_Report_${year}.pdf`);
  };

  // ── Stat Card Component ──
  const StatCard = ({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) => (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 p-5 ${color}`}>
      <div className="absolute -right-3 -top-3 text-5xl opacity-15 select-none">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-white">{value}</p>
    </div>
  );

  return (
    <DashboardShell
      role={userRole}
      sidebarItems={getRoleNavigation(userRole)}
      activeHref="/admin/report"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Annual Institutional Report</h1>
        <p className="text-slate-500 text-sm mt-1">Generate comprehensive analytics for any academic year</p>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            min={2000}
            max={2099}
            className="w-28 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40"
          />
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : '📊 Generate Report'}
          </button>
          {data && (
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-500/20"
            >
              📄 Export PDF
            </button>
          )}
        </div>
        {error && (
          <div className="mt-4 bg-rose-950/40 border border-rose-700/50 text-rose-400 px-5 py-3 rounded-xl text-sm">{error}</div>
        )}
      </div>

      {/* Report Content */}
      {data && (
        <div className="max-w-7xl mx-auto px-6 pb-20 space-y-8 animate-[fadeIn_0.4s_ease]">

          {/* Timestamp */}
          <p className="text-xs text-slate-600">Report for <span className="text-indigo-400 font-bold">{data.year}</span> · Generated {new Date(data.generated_at).toLocaleString()}</p>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <StatCard label="Papers" value={data.summary.total_papers} icon="📄" color="bg-gradient-to-br from-indigo-600/30 to-indigo-900/30" />
            <StatCard label="Events" value={data.summary.total_events} icon="📅" color="bg-gradient-to-br from-emerald-600/30 to-emerald-900/30" />
            <StatCard label="Achievements" value={data.summary.total_achievements} icon="🏆" color="bg-gradient-to-br from-amber-600/30 to-amber-900/30" />
            <StatCard label="Students" value={data.summary.total_students} icon="🎓" color="bg-gradient-to-br from-blue-600/30 to-blue-900/30" />
            <StatCard label="Faculty" value={data.summary.total_faculty} icon="👨‍🏫" color="bg-gradient-to-br from-purple-600/30 to-purple-900/30" />
            <StatCard label="New Users" value={data.summary.new_users} icon="👤" color="bg-gradient-to-br from-cyan-600/30 to-cyan-900/30" />
            <StatCard label="Pending" value={data.summary.pending_papers} icon="⏳" color="bg-gradient-to-br from-rose-600/30 to-rose-900/30" />
          </div>

          {/* ── Monthly Trend Chart ── */}
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-4">📈 Monthly Activity Trend — {year}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.monthly_trend}>
                <defs>
                  <linearGradient id="gPapers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="papers" stroke="#6366f1" fill="url(#gPapers)" strokeWidth={2} name="Papers" />
                <Area type="monotone" dataKey="events" stroke="#10b981" fill="url(#gEvents)" strokeWidth={2} name="Events" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Pie + Bar Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Department Papers Pie */}
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">🏛️ Papers by Department</h3>
              {toChartArray(data.dept_paper_counts).length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={toChartArray(data.dept_paper_counts)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: '#475569' }}>
                      {toChartArray(data.dept_paper_counts).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-600 text-sm py-16 text-center">No paper data for {year}</p>}
            </div>

            {/* Paper Type Bar */}
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">📑 Paper Types</h3>
              {toChartArray(data.paper_type_counts).length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={toChartArray(data.paper_type_counts)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={110} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Count">
                      {toChartArray(data.paper_type_counts).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-600 text-sm py-16 text-center">No papers found</p>}
            </div>
          </div>

          {/* ── Achievement Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">🏆 Achievements by Category</h3>
              {toChartArray(data.ach_category_counts).length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={toChartArray(data.ach_category_counts)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Count">
                      {toChartArray(data.ach_category_counts).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-600 text-sm py-16 text-center">No achievements for {year}</p>}
            </div>

            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">🏛️ Achievements by Department</h3>
              {toChartArray(data.dept_ach_counts).length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={toChartArray(data.dept_ach_counts)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={100} label={({ name, value }) => `${name} (${value})`} labelLine={{ stroke: '#475569' }}>
                      {toChartArray(data.dept_ach_counts).map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-600 text-sm py-16 text-center">No achievements for {year}</p>}
            </div>
          </div>

          {/* ── Top Contributors ── */}
          {data.top_contributors?.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">⭐ Top Contributors</h3>
              <div className="space-y-3">
                {data.top_contributors.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-200 font-medium">{c.name}</span>
                        <span className="text-xs text-indigo-400 font-bold">{c.count} papers</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${(c.count / data.top_contributors[0].count) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Papers Table ── */}
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">📄 Approved Papers ({data.papers.length})</h3>
            {data.papers.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Authors</th>
                  </tr>
                </thead>
                <tbody>
                  {data.papers.map((p: any, i: number) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-slate-600">{i + 1}</td>
                      <td className="py-3 px-3 text-slate-200 font-medium max-w-xs truncate">{p.title}</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-400 rounded text-xs font-semibold">{p.departmentId?.name || '—'}</span></td>
                      <td className="py-3 px-3 text-slate-400">{p.type || '—'}</td>
                      <td className="py-3 px-3 text-slate-500 text-xs max-w-[200px] truncate">{(p.authors || []).join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-slate-600 text-sm py-8 text-center">No approved papers for {year}</p>}
          </div>

          {/* ── Events Table ── */}
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 overflow-x-auto">
            <h3 className="text-white font-semibold mb-4">📅 Events ({data.events.length})</h3>
            {data.events.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((e: any, i: number) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-slate-600">{i + 1}</td>
                      <td className="py-3 px-3 text-slate-200 font-medium">{e.title}</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 rounded text-xs font-semibold">{e.type || '—'}</span></td>
                      <td className="py-3 px-3 text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-slate-500">{e.venue || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-slate-600 text-sm py-8 text-center">No events for {year}</p>}
          </div>

          {/* ── Achievements Table ── */}
          {data.achievements.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-6 overflow-x-auto">
              <h3 className="text-white font-semibold mb-4">🏆 Achievements ({data.achievements.length})</h3>
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.achievements.map((a: any, i: number) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 text-slate-600">{i + 1}</td>
                      <td className="py-3 px-3 text-slate-200 font-medium">{a.achievementTitle}</td>
                      <td className="py-3 px-3"><span className="px-2 py-0.5 bg-amber-900/40 text-amber-400 rounded text-xs font-semibold">{a.category}</span></td>
                      <td className="py-3 px-3 text-slate-400">{a.department}</td>
                      <td className="py-3 px-3 text-slate-400">{a.studentName}</td>
                      <td className="py-3 px-3 text-slate-500">{new Date(a.achievementDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Empty State */}
      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-32 text-slate-600">
          <p className="text-6xl mb-4">📊</p>
          <p className="text-lg font-semibold">Select a year and generate the report</p>
          <p className="text-sm text-slate-700 mt-1">All approved papers, events, and achievements will be compiled</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-14 h-14 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Compiling report data...</p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </DashboardShell>
  );
}
