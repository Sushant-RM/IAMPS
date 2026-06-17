import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getRoleNavigation } from '../../lib/navigation';

export default function AlumniDashboard() {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.replace('/login');
            return;
        }
        const parsed = JSON.parse(userData);
        if (parsed.role !== 'alumni') {
            router.replace('/login');
            return;
        }
        setReady(true);
    }, [router]);

    if (!ready) {
        return (
            <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <DashboardShell
            role="alumni"
            sidebarItems={getRoleNavigation('alumni')}
            activeHref="/dashboard/alumni"
        >
            <div className="bg-[#131b2e] border border-slate-800/60 rounded-[16px] p-8 shadow-sm">
                <span className="px-3 py-1 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Alumni
                </span>
                <h1 className="text-3xl font-black text-white tracking-tight mt-4 mb-2 uppercase italic">
                    Alumni Dashboard
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                    Your alumni profile and institutional contributions are being compiled. Check back soon for updates.
                </p>
            </div>
        </DashboardShell>
    );
}
