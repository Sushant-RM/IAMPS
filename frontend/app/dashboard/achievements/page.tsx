'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function AchievementsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/achievements/stats/dashboard`);
      setStats(response.data.data);
    } catch (err) {
      setError('Error fetching achievement statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statusData = [
    { name: 'Approved', value: stats?.approvedCount || 0 },
    { name: 'Pending', value: stats?.pendingCount || 0 },
    { name: 'Rejected', value: stats?.rejectedCount || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto pt-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <span className="px-3 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Achievement Analytics
            </span>
            <h1 className="text-3xl font-black text-white tracking-tight italic mt-3">
              Student <span className="text-blue-400">Milestone Hub</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Review student achievements and department-wide statistics.</p>
          </div>
          <Link
            href="/achievements"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-[12px] text-xs uppercase tracking-wider transition-all shadow-md"
          >
            View All Achievements →
          </Link>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-300 px-5 py-4 rounded-[12px] mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Achievements', value: stats?.totalAchievements || 0, color: 'text-blue-400', icon: '📊', bg: 'border-blue-900/30' },
            { label: 'Approved', value: stats?.approvedCount || 0, color: 'text-emerald-400', icon: '✅', bg: 'border-emerald-900/30' },
            { label: 'Pending Review', value: stats?.pendingCount || 0, color: 'text-amber-400', icon: '⏳', bg: 'border-amber-900/30' },
            { label: 'Rejected', value: stats?.rejectedCount || 0, color: 'text-red-400', icon: '❌', bg: 'border-red-900/30' },
          ].map((card, i) => (
            <div key={i} className={`bg-[#131b2e] border ${card.bg} p-6 rounded-[16px] shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{card.label}</p>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Chart */}
          {stats?.categoryStats && stats.categoryStats.length > 0 && (
            <div className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-md">
              <h2 className="text-base font-bold text-white mb-5 uppercase tracking-tight">Achievements by Category</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.4} />
                  <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status Distribution Chart */}
          <div className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-md">
            <h2 className="text-base font-bold text-white mb-5 uppercase tracking-tight">Status Distribution</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-3">
              {statusData.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#10b981', '#f59e0b', '#ef4444'][i] }}></div>
                  {entry.name}: <span className="text-white font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Distribution */}
        {stats?.departmentStats && stats.departmentStats.length > 0 && (
          <div className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-md mb-8">
            <h2 className="text-base font-bold text-white mb-5 uppercase tracking-tight">Achievements by Department</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.departmentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ backgroundColor: '#131b2e', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {stats.departmentStats.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/achievements/create"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-[12px] transition-all text-center text-sm tracking-wide shadow-md"
          >
            + Submit Achievement
          </Link>
          <Link
            href="/achievements?status=pending"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-[12px] transition-all text-center text-sm tracking-wide shadow-md"
          >
            Review Pending ({stats?.pendingCount || 0})
          </Link>
          <Link
            href="/achievements"
            className="bg-[#131b2e] hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-[12px] transition-all text-center text-sm tracking-wide border border-slate-700 shadow-md"
          >
            View All Achievements
          </Link>
        </div>

      </div>
    </div>
  );
}
