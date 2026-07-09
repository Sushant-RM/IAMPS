import { useState, useEffect } from 'react';
import api from '../../lib/api';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getRoleNavigation } from '../../lib/navigation';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

export default function AnalyticsDashboard() {
    const [trends, setTrends] = useState([]);
    const [collaboration, setCollaboration] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedPaper, setSelectedPaper] = useState({ abstract: '', title: '', venue: '', type: 'Journal' });
    const [prediction, setPrediction] = useState<any>(null);
    const [predicting, setPredicting] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [trendsRes, collabRes] = await Promise.all([
                api.get('/ai/analytics/trends'),
                api.get('/ai/analytics/collaboration')
            ]);
            setTrends(trendsRes.data);
            setCollaboration(collabRes.data);
        } catch {
            // Analytics unavailable
        } finally {
            setLoading(false);
        }
    };

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setPredicting(true);
            const res = await api.post('/ai/predict-impact', selectedPaper);
            setPrediction(res.data);
        } catch {
            // Prediction unavailable
        } finally {
            setPredicting(false);
        }
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    if (loading) {
        return (
            <DashboardShell role="admin" sidebarItems={getRoleNavigation('admin')} activeHref="/admin/analytics">
                <div className="flex items-center justify-center py-32">
                    <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell role="admin" sidebarItems={getRoleNavigation('admin')} activeHref="/admin/analytics">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">System <span className="text-blue-400">Analytics</span></h1>
                    <p className="text-slate-400 mt-1 text-sm">Intelligent insights and publication trends</p>
                </div>
                <button onClick={fetchAnalytics} className="px-5 py-2.5 bg-[#131b2e] border border-slate-800 rounded-[12px] text-xs font-bold uppercase tracking-wider text-slate-300 hover:border-blue-500 transition-all">
                    Refresh Data
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Publication Trends */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8">Publication Volume Over Time</h3>
                        <div className="h-80 w-full">
                          {trends.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center text-center px-8">
                                <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                                    No approved papers yet — this chart will populate once papers are approved.
                                </p>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="Journal" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                    <Area type="monotone" dataKey="Conference" stroke="#10B981" strokeWidth={3} fillOpacity={0} />
                                </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                    </div>

                    {/* Collaboration Map List */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Collaboration Strength</h3>
                        <div className="space-y-4">
                            {collaboration.links.slice(0, 6).map((link, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                                            {link.source[0]}
                                        </div>
                                        <span className="text-gray-400">↔</span>
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-xs font-bold text-green-600">
                                            {link.target[0]}
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                        Strength {link.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Impact Predictor Form */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Research Impact Predictor</h3>
                        <form onSubmit={handlePredict} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Paper Title</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 focus:ring-2 focus:ring-blue-500 bg-transparent"
                                        value={selectedPaper.title}
                                        onChange={e => setSelectedPaper({ ...selectedPaper, title: e.target.value })}
                                        placeholder="Enter target title..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Venue (Journal/Conference)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 focus:ring-2 focus:ring-blue-500 bg-transparent"
                                        value={selectedPaper.venue}
                                        onChange={e => setSelectedPaper({ ...selectedPaper, venue: e.target.value })}
                                        placeholder="e.g., Nature, IEEE"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Abstract</label>
                                <textarea
                                    className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 focus:ring-2 focus:ring-blue-500 bg-transparent h-32"
                                    value={selectedPaper.abstract}
                                    onChange={e => setSelectedPaper({ ...selectedPaper, abstract: e.target.value })}
                                    placeholder="Paste your abstract here for AI impact analysis..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={predicting}
                                className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {predicting ? 'Analyzing...' : 'Predict Citation Potential'}
                            </button>
                        </form>

                        {prediction && (
                            <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest">Prediction Result</p>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">Heuristic Estimate</span>
                                        </div>
                                        <h4 className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">Impact Score: {prediction.score}/100</h4>
                                        <p className="text-blue-700 dark:text-blue-300 mt-2 max-w-xl">{prediction.reasoning}</p>
                                        {prediction.disclaimer && (
                                            <p className="text-blue-500/80 dark:text-blue-400/70 mt-2 max-w-xl text-xs italic">{prediction.disclaimer}</p>
                                        )}
                                    </div>
                                    <div className={`px-6 py-3 rounded-full font-black text-sm uppercase ${prediction.level === 'High' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {prediction.level} Potential
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Research Gaps / Insights */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">💡</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Research Gaps</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">Under-explored territories identified by AI</p>
                            <div className="space-y-3">
                                {['Deep Learning in Civil Engineering', 'Sustainable Logistics', 'Quantum Cryptography in E-commerce'].map((gap, i) => (
                                    <div key={i} className="px-4 py-2 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm rounded-xl font-bold">
                                        {gap}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
        </DashboardShell>
    );
}

