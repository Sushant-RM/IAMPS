import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function FacultyProfile() {
    const router = useRouter();
    const { id } = router.query;
    const [faculty, setFaculty] = useState<any>(null);
    const [papers, setPapers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [userRes, papersRes] = await Promise.all([
                api.get(`/auth/user/${id}`),
                api.get(`/papers/search?submittedBy=${id}`)
            ]);
            setFaculty(userRes.data);
            setPapers(papersRes.data);
        } catch (err) {
            console.error('Failed to fetch faculty data', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );

    if (!faculty) return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
            <div className="text-center group">
                <div className="text-8xl mb-6 grayscale opacity-20 group-hover:grayscale-0 transition-all duration-700">👤</div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Scholar Invisible</h2>
                <Link href="/departments" className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-xs hover:gap-3 transition-all flex items-center justify-center gap-2">
                    <span>←</span> Back to Departments
                </Link>
            </div>
        </div>
    );

    const totalCitations = papers.reduce((acc, p) => acc + (p.citationsCount || 0), 0);
    const totalReads = papers.reduce((acc, p) => acc + (p.readsCount || 0), 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors pb-20">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-44">
                {/* Profile Header Card */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[48px] border border-white/20 dark:border-slate-800/30 shadow-2xl overflow-hidden mb-12">
                    <div className="h-48 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.1),transparent)]"></div>
                    </div>
                    <div className="px-12 pb-12 -mt-24 relative z-10 flex flex-col md:flex-row gap-12 items-end">
                        <div className="w-48 h-48 rounded-[48px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-7xl font-black shadow-2xl border-8 border-white dark:border-slate-900 overflow-hidden shrink-0">
                            {faculty.profilePicture ? (
                                <img src={faculty.profilePicture} alt={faculty.fullName} className="w-full h-full object-cover" />
                            ) : (
                                faculty.fullName[0]
                            )}
                        </div>
                        <div className="flex-1 pb-4">
                            <Link href="/departments" className="text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 mb-4 hover:translate-x-1 transition-all">
                                <span>←</span> Departments
                            </Link>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
                                {faculty.fullName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                                    {faculty.role === 'hod' ? 'Head of Faculty' : 'Senior Researcher'}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {faculty.departmentId?.name || 'Departmental Wing'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-4 pb-6">
                            {faculty.socialLinks?.linkedin && (
                                <a href={faculty.socialLinks.linkedin} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-600 hover:scale-110 transition-all">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 10 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </a>
                            )}
                            <a href={`mailto:${faculty.email}`} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 012 2v1m-16 0h14a2 2 0 002-2V8a2 2 0 01-1.11-1.89L21 8M5 19V8" /></svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Bio & Interests */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="bg-white dark:bg-slate-900 p-12 rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Biography</h3>
                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                                {faculty.bio || "Dedicated researcher focusing on high-impact academic labor and institutional innovation. Contributing to the ecosystem's repository with a focus on cutting-edge developments and structural excellence."}
                            </p>

                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-6">Research Domains</h4>
                            <div className="flex flex-wrap gap-3">
                                {(faculty.researchInterests?.length ? faculty.researchInterests : ['Deep Systems', 'Institutional Impact', 'Innovation Architecture']).map((interest: string, i: number) => (
                                    <span key={i} className="px-6 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl text-sm font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex justify-between items-end mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Published Works</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium font-sm">Peer-reviewed and approved institutional archives.</p>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{papers.length} Contributions</span>
                            </div>

                            <div className="grid gap-6">
                                {papers.map(paper => (
                                    <div key={paper._id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all group">
                                        <Link href={`/paper/${paper._id}`} className="block">
                                            <div className="flex justify-between items-start gap-8 mb-6">
                                                <h4 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition tracking-tight flex-1">
                                                    {paper.title}
                                                </h4>
                                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:rotate-12">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 dark:border-emerald-800/50">
                                                    {paper.type}
                                                </span>
                                                <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                                                    Archive {paper.year}
                                                </span>
                                                <div className="flex ml-auto gap-4 items-center">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        <span className="text-[10px] font-bold">{paper.readsCount || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                        <span className="text-[10px] font-bold">{paper.citationsCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                                {papers.length === 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[48px] border-2 border-dashed dark:border-slate-800 text-center">
                                        <p className="text-slate-400 font-bold">Awaiting first publication record.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[48px] border border-white/20 dark:border-slate-800/30 shadow-xl">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Institutional Reach</h3>
                            <div className="space-y-6">
                                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Researcher Score</p>
                                    <p className="text-4xl font-black text-blue-600">A+</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Citations</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{totalCitations}</p>
                                    </div>
                                    <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reads</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{totalReads}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
                            <h3 className="text-xl font-black mb-6 tracking-tight flex items-center gap-3">
                                Core Wing
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            </h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                                Member of the **{faculty.departmentId?.name || 'Academic Core'}**. Actively collaborating on institutional growth projects and structural research.
                            </p>
                            <Link href={`/department/${faculty.departmentId?._id}`} className="block text-center py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                View Department Wing
                            </Link>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
