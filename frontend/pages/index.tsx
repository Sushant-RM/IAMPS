import Link from 'next/link';
import Navbar from '../components/Navbar';

import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Home() {

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/papers/public/stats');
        setStats(res.data);
      } catch (e) { }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] transition-colors selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="pt-32">
        {/* Floating Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -ml-24 -mb-24"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Institutional Hub is Live</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-[0.9]">
              Student <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 italic">
                Research Portal
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
              Transforming raw academic labor into institutional impact. A secure repository for the next generation of scholars.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 items-center">
              <Link
                href="/register"
                className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[28px] text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
              >
                Establish Profile
              </Link>
              <Link
                href="/browse-papers"
                className="px-10 py-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[28px] text-sm font-black uppercase tracking-widest hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Explore Archives
              </Link>
            </div>
          </div>
        </section>

        {/* Institutional Pulse (Stats) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/20 dark:border-slate-800/30 rounded-[48px] shadow-2xl">
            {[
              { label: 'Published Works', value: stats?.total || '...', color: 'text-blue-600' },
              { label: 'Active Researchers', value: stats?.totalUsers || '...', color: 'text-emerald-600' },
              { label: 'Research Wings', value: stats?.papersPerDept?.length || '...', color: 'text-indigo-600' },
              { label: 'Impact Score', value: 'A+', color: 'text-pink-600' },
            ].map((stat, idx) => (
              <div key={idx} className="p-10 text-center hover:bg-white dark:hover:bg-slate-800 rounded-[36px] transition-all group">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
                <p className={`text-4xl font-black ${stat.color} group-hover:scale-110 transition-transform`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Department Explorer */}
        <section className="py-32 bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
                  Academic Wings
                </h2>
                <p className="text-slate-400 font-medium">
                  Navigate through specialized domains of knowledge, curated by our distinguished faculty.
                </p>
              </div>
              <Link href="/departments" className="px-8 py-4 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">
                View All Units
              </Link>
            </div>
            <DepartmentCards />
          </div>
        </section>

        {/* Process Section */}
        <section className="py-32 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-20">
              {[
                { step: '01', title: 'The Submission', desc: 'Securely upload your manuscript with automated plagiarism screening and metadata extraction.' },
                { step: '02', title: 'The Verification', desc: 'Dual-layered review by Departmental HODs and Institutional Committees to ensure peak quality.' },
                { step: '03', title: 'The Impact', desc: 'Global dissemination of your work with persistent identifiers and citation tracking.' }
              ].map((step, idx) => (
                <div key={idx} className="relative group">
                  <span className="text-8xl font-black text-slate-100 dark:text-slate-900 absolute -top-10 -left-6 z-0 group-hover:text-blue-500/10 transition-colors pointer-events-none">
                    {step.step}
                  </span>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">{step.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[64px] p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 text-white">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-8">
                Join the Frontier.
              </h2>
              <p className="text-xl text-blue-100/80 mb-12 max-w-xl mx-auto font-medium">
                Secure your place in the institutional archives and start building your research legacy today.
              </p>
              <Link href="/register" className="px-12 py-5 bg-white text-blue-600 rounded-[32px] text-sm font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95">
                Initiate Registration
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Basic Footer */}
      <footer className="py-20 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
          Institutional Research Ecosystem &copy; 2025
        </p>
      </footer>
    </div>
  );
}

function DepartmentCards() {
  const [depts, setDepts] = useState([]);
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/departments');
        setDepts(res.data);
      } catch (e) { }
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {depts.map((d: any) => (
        <Link
          key={d._id}
          href={`/department/${d._id}`}
          className="p-10 bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/5 hover:bg-white/10 hover:scale-105 transition-all group"
        >
          <div className="w-14 h-14 mb-8 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
            {d.code}
          </div>
          <h4 className="text-xl font-black text-white mb-2 leading-tight">{d.name}</h4>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{d.hodName || 'Faculty Led'}</p>
        </Link>
      ))}
    </div>
  );
}

