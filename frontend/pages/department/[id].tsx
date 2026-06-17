import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DepartmentDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [department, setDepartment] = useState<any>(null);
    const [papers, setPapers] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const COLORS = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#EF4444'];

    const paperTypeData = papers.reduce((acc: any[], paper: any) => {
        const existing = acc.find(item => item.name === paper.type);
        if (existing) {
            existing.value += 1;
        } else {
            acc.push({ name: paper.type, value: 1 });
        }
        return acc;
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, papersRes, facultyRes] = await Promise.all([
                api.get('/departments'),
                api.get(`/papers/search?department=${id}`),
                api.get(`/departments/${id}/faculty`)
            ]);

            const currentDept = deptRes.data.find((d: any) => d._id === id);
            setDepartment(currentDept);
            setPapers(papersRes.data);
            setFaculty(facultyRes.data);
        } catch (err) {
            console.error('Failed to fetch department data', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!department) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-gray-600">Department not found</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors pb-20">
            <Navbar />

            <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 pt-44 pb-16 transition-colors overflow-hidden relative">
                <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <span className="text-[200px] font-black">{department.code}</span>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="max-w-2xl">
                            <Link href="/departments" className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-4 hover:gap-3 transition-all">
                                <span>←</span> All Departments
                            </Link>
                            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                                {department.name}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-4 text-lg font-medium leading-relaxed">
                                {department.description}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-8">
                                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300">
                                    Est. {department.establishedYear}
                                </div>
                                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                    Code: {department.code}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full md:w-auto">
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border dark:border-gray-700 flex items-center gap-6 min-w-[280px]">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Research</p>
                                    <p className="text-4xl font-black text-gray-900 dark:text-white leading-none">{papers.length}</p>
                                </div>
                            </div>
                            {department.hod && (
                                <Link href={`/faculty/${department.hod._id}`} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border dark:border-gray-700 flex items-center gap-4 hover:bg-white dark:hover:bg-gray-800 transition shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-bold overflow-hidden shadow-inner">
                                        {department.hod.fullName?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Dept Head</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{department.hod.fullName}</p>
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Research Repository</h2>
                                <Link href="/browse-papers" className="text-blue-600 hover:underline text-sm font-black uppercase tracking-wider">Explore All →</Link>
                            </div>

                            {papers.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 p-16 rounded-[40px] shadow-sm border dark:border-gray-700 text-center">
                                    <div className="text-6xl mb-6 grayscale opacity-20">📂</div>
                                    <p className="text-gray-400 dark:text-gray-500 font-medium text-lg">Empty repository. Be the first contributor!</p>
                                </div>
                            ) : (
                                <div className="grid gap-6">
                                    {papers.map((paper) => (
                                        <div key={paper._id} className="bg-white dark:bg-gray-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                                            <Link href={`/paper/${paper._id}`} className="block">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition leading-tight">
                                                            {paper.title}
                                                        </h3>
                                                        <div className="flex-shrink-0 p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-base leading-relaxed">
                                                        {paper.abstract}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3 mt-2 items-center">
                                                        <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest rounded-full border border-blue-100/50">
                                                            {paper.type}
                                                        </span>
                                                        <span className="px-4 py-1.5 bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs font-black uppercase tracking-widest rounded-full border dark:border-gray-700">
                                                            Class of {paper.year}
                                                        </span>
                                                        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-100 dark:border-slate-800">
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                                                <span className="text-[10px] font-bold text-slate-500">{paper.readsCount || 0}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                                <span className="text-[10px] font-bold text-slate-500">{paper.citationsCount || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="space-y-12">
                        {/* Paper Distribution Chart */}
                        {paperTypeData.length > 0 && (
                            <section className="bg-white dark:bg-gray-800 p-10 rounded-[40px] shadow-xl border dark:border-gray-700">
                                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Research Breakdown</h3>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={paperTypeData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {paperTypeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    {paperTypeData.map((entry, index) => (
                                        <div key={entry.name} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="bg-white dark:bg-gray-800 p-10 rounded-[40px] shadow-xl border dark:border-gray-700 relative overflow-hidden">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 tracking-tight flex items-center gap-3">
                                Faculty Wing
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-gray-400">{faculty.length}</span>
                            </h3>

                            <div className="space-y-6">
                                {faculty.map((member) => (
                                    <Link href={`/faculty/${member._id}`} key={member._id} className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-500 font-black shadow-inner group-hover:from-blue-500 group-hover:to-blue-600 group-hover:text-white transition-all duration-300">
                                            {member.fullName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition tracking-tight">
                                                {member.fullName}
                                            </h4>
                                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                                {member.role === 'hod' ? 'Head of Dept' : 'Professor'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                                {faculty.length === 0 && (
                                    <p className="text-gray-400 text-sm italic">No faculty profiles listed.</p>
                                )}
                            </div>
                        </section>

                        <section className="p-10 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                            <h3 className="text-xl font-black mb-6 tracking-tight relative z-10">Department Highlights</h3>
                            <div className="space-y-6 relative z-10">
                                <div className="border-l-2 border-blue-400 pl-4 py-1 hover:bg-white/5 transition rounded-r-xl">
                                    <p className="text-xs font-black uppercase text-blue-300 tracking-widest mb-1">Latest Upload</p>
                                    <p className="text-sm font-bold line-clamp-1">{papers[0]?.title || 'Awaiting Research'}</p>
                                    <p className="text-[10px] text-blue-200/60 mt-1">{papers[0] ? new Date(papers[0].createdAt).toLocaleDateString() : ''}</p>
                                </div>
                                <div className="border-l-2 border-indigo-400 pl-4 py-1 hover:bg-white/5 transition rounded-r-xl">
                                    <p className="text-xs font-black uppercase text-indigo-300 tracking-widest mb-1">Active Faculty</p>
                                    <p className="text-sm font-bold">{faculty.length} Pure Researchers</p>
                                </div>
                                <div className="border-l-2 border-emerald-400 pl-4 py-1 hover:bg-white/5 transition rounded-r-xl">
                                    <p className="text-xs font-black uppercase text-emerald-300 tracking-widest mb-1">Impact Score</p>
                                    <p className="text-sm font-bold">A+ (Calculated by AI)</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/10 relative z-10">
                                <Link href="/browse-papers" className="block text-center py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition">
                                    Full Archive
                                </Link>
                            </div>
                        </section>
                    </div>

                </div>
            </main>
        </div>
    );
}
