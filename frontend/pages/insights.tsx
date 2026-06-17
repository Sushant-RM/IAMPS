import { useState, useEffect } from 'react';
import api from '../lib/api';
import DashboardShell from '../components/dashboard/DashboardShell';
import { getRoleNavigation } from '../lib/navigation';
import {
    AreaChart, Area,
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Insights() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await api.get('/papers/public/stats');
            setStats(res.data);
        } catch {
            // Stats unavailable — page shows empty metrics
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardShell role="student" sidebarItems={getRoleNavigation('student')} activeHref="/insights">
                <div className="flex items-center justify-center py-32">
                    <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role="student" sidebarItems={getRoleNavigation('student')} activeHref="/insights">
            <div className="bg-gradient-to-br from-indigo-900/60 to-blue-950/80 border border-slate-800 rounded-[24px] p-8 sm:p-10 shadow-2xl relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 uppercase italic">
                        Career <span className="text-blue-400">Insights</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                        Research activity, departmental contributions, and publishing reach across the academic ecosystem.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-10">
                        <div className="p-5 bg-[#131b2e]/80 border border-slate-800 rounded-[16px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Approved Papers</p>
                            <p className="text-3xl font-black text-white">{stats?.total ?? 0}</p>
                        </div>
                        <div className="p-5 bg-[#131b2e]/80 border border-slate-800 rounded-[16px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">Research Wings</p>
                            <p className="text-3xl font-black text-white">{stats?.papersPerDept?.length || 0}</p>
                        </div>
                        <div className="p-5 bg-[#131b2e]/80 border border-slate-800 rounded-[16px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Contributors</p>
                            <p className="text-3xl font-black text-white">{stats?.totalUsers ?? 0}</p>
                        </div>
                        <div className="p-5 bg-[#131b2e]/80 border border-slate-800 rounded-[16px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-pink-300 mb-2">Impact Index</p>
                            <p className="text-3xl font-black text-white">A+</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

                    {/* Research Timeline */}
                    <div className="bg-[#131b2e] border border-slate-800/60 p-8 sm:p-10 rounded-[16px] shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Research Velocity</h3>
                                <p className="text-sm text-slate-400 font-medium">Annual publication volume across all wings</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.papersPerYear || []}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Departmental Comparison */}
                    <div className="bg-[#131b2e] border border-slate-800/60 p-8 sm:p-10 rounded-[16px] shadow-sm">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Departmental Scale</h3>
                                <p className="text-sm text-slate-400 font-medium">Contribution by academic wings</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.papersPerDept || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="count" fill="#6366F1" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Reach / Type Distribution */}
                    <div className="bg-[#131b2e] border border-slate-800/60 p-8 sm:p-10 rounded-[16px] shadow-sm lg:col-span-2">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                            <div className="max-w-sm">
                                <h3 className="text-xl font-black text-white tracking-tight mb-4">Publication Types</h3>
                                <p className="text-sm text-slate-400 font-medium mb-8">
                                    Distribution of journals, conferences, patents, and other publication formats.
                                </p>
                                <div className="space-y-4">
                                    {stats?.papersByType?.map((type: any, idx: number) => (
                                        <div key={type.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{type.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-500">{type.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[400px] w-full flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats?.papersByType || []}
                                            innerRadius={100}
                                            outerRadius={140}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {stats?.papersByType?.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

            </div>
        </DashboardShell>
    );
}
