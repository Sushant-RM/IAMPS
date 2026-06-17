import { useState, useEffect } from 'react';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to fetch departments');
        } finally {
            setLoading(false);
        }
    };

    const sortedDepts = [...departments].sort((a, b) => (b.paperCount || 0) - (a.paperCount || 0));

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-44 pb-20">

                {/* Ranking Summary */}
                <div className="mb-20 bg-indigo-950 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
                    <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
                        <div>
                            <h2 className="text-4xl font-black mb-4 tracking-tight">Research Leaderboard</h2>
                            <p className="text-gray-300 text-lg">Ranking our specialized wings based on publication impact and research volume.</p>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4">
                            {sortedDepts.slice(0, 3).map((dept, i) => (
                                <div key={dept._id} className="flex-shrink-0 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 min-w-[200px]">
                                    <div className="text-yellow-400 font-black text-xl mb-2"># {i + 1}</div>
                                    <h3 className="font-bold text-lg">{dept.code}</h3>
                                    <p className="text-xs text-white/60 uppercase font-black tracking-widest mt-1">{dept.paperCount || 0} Papers</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                        Research Departments
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Explore research contributions, faculty directories, and academic achievements across our diverse departments.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {departments.map((dept) => (
                        <div key={dept._id} className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {/* Decorative Background Icon */}
                            <div className="absolute -right-4 -top-4 text-gray-50 dark:text-gray-700/50 text-9xl font-black group-hover:scale-110 transition-transform duration-500">
                                {dept.code}
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200 dark:shadow-none">
                                        {dept.code}
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase">
                                        Est. {dept.establishedYear || 2000}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 transition">
                                    {dept.name}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 line-clamp-3">
                                    {dept.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border dark:border-gray-700">
                                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Papers</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">{dept.paperCount || 0}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border dark:border-gray-700">
                                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Faculty</p>
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">{dept.facultyCount || 0}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-800">
                                            <span className="text-[10px] font-bold text-gray-500">{dept.hod?.fullName?.[0] || '?'}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">Head: {dept.hod?.fullName || 'TBD'}</span>
                                    </div>
                                    <Link href={`/department/${dept._id}`} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all transform hover:translate-x-1">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
