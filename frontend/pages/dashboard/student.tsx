import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import DashboardShell, { DashboardSection } from '../../components/dashboard/DashboardShell';
import DashboardHero from '../../components/dashboard/DashboardHero';
import MetricCard, { MetricCardGrid } from '../../components/dashboard/MetricCard';
import { SkeletonHero, SkeletonList, SkeletonMetricGrid } from '../../components/dashboard/SkeletonGrid';
import ActivityFeed, { type ActivityItem } from '../../components/dashboard/ActivityFeed';
import QuickActions from '../../components/dashboard/QuickActions';
import { useToast } from '../../lib/useToast';
import { getRoleNavigation } from '../../lib/navigation';

export default function StudentDashboard() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const [myPapers, setMyPapers] = useState<any[]>([]);
    const [myEvents, setMyEvents] = useState<any[]>([]);
    const [myAchievements, setMyAchievements] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const { toast, showToast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'student') {
            router.push('/login');
            return;
        }
        setUser(parsedUser);
        fetchDashboardData(parsedUser);
    }, []);

    const fetchDashboardData = async (currentUser: any) => {
        try {
            setLoading(true);
            const [papersRes, eventsRes, notifRes] = await Promise.all([
                api.get('/papers/my'),
                api.get('/events/my'),
                api.get('/notifications').catch(() => ({ data: [] })),
            ]);

            setMyPapers(papersRes.data);
            setMyEvents(eventsRes.data);
            setNotifications(notifRes.data);

            if (currentUser.usn) {
                try {
                    const achRes = await api.get(`/achievements/usn/${currentUser.usn}`);
                    setMyAchievements(achRes.data.data || []);
                } catch {
                    setMyAchievements([]);
                }
            }
        } catch {
            showToast('Failed to load dashboard records.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const markNotificationRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, read: true } : n))
            );
        } catch {
            showToast('Could not update notification.', 'error');
        }
    };

    const filteredPapers = useMemo(
        () => myPapers.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [myPapers, searchQuery]
    );

    const sortedPapers = useMemo(() => {
        return [...filteredPapers].sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
    }, [filteredPapers, sortBy]);

    const totalPages = Math.ceil(sortedPapers.length / itemsPerPage);
    const paginatedPapers = sortedPapers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const stats = useMemo(() => {
        const approvedAchievements = myAchievements.filter((a) => a.status === 'approved').length;
        const approvedPapers = myPapers.filter(
            (p) => p.status === 'approved' || p.status === 'published'
        ).length;
        const completionFields = [
            user?.fullName,
            user?.usn,
            approvedPapers > 0,
            approvedAchievements > 0,
            myEvents.length > 0,
        ];
        const completionPct = Math.round(
            (completionFields.filter(Boolean).length / completionFields.length) * 100
        );

        return {
            totalPapers: myPapers.length,
            approvedPapers,
            totalAchievements: myAchievements.length,
            approvedAchievements,
            eventsCount: myEvents.length,
            completionPct,
            portfolioScore: Math.min(100, approvedPapers * 15 + approvedAchievements * 10 + completionPct * 0.5),
        };
    }, [myPapers, myAchievements, myEvents, user]);

    if (!user) return null;

    const sidebarItems = getRoleNavigation('student');

    return (
        <DashboardShell role="student" toast={toast} sidebarItems={sidebarItems} activeHref="/dashboard/student">
            {loading ? (
                <>
                    <SkeletonHero />
                    <SkeletonMetricGrid count={4} />
                    <SkeletonList rows={4} />
                </>
            ) : (
                <>
                    <DashboardHero
                        badge="Student Hub"
                        title={
                            <>
                                Research <span className="text-blue-400">Workspace</span>
                            </>
                        }
                        subtitle={`Welcome back, ${user.fullName.split(' ')[0]}. Track submissions, achievements, and portfolio progress in one place.`}
                        actions={
                            <>
                                <Link
                                    href="/dashboard/portfolio"
                                    className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold uppercase tracking-wider text-xs transition-all"
                                >
                                    My Portfolio
                                </Link>
                                <Link
                                    href="/upload/paper"
                                    className="px-5 py-3 bg-white text-blue-950 rounded-[12px] font-bold uppercase tracking-wider text-xs hover:bg-slate-100 transition-all"
                                >
                                    New Submission
                                </Link>
                            </>
                        }
                    />

                    <MetricCardGrid columns={4}>
                        <MetricCard label="Total Achievements" value={stats.totalAchievements} color="text-purple-400" description="All submitted milestones" />
                        <MetricCard label="Approved Achievements" value={stats.approvedAchievements} color="text-emerald-400" description="Verified by faculty" />
                        <MetricCard label="Research Papers" value={stats.totalPapers} color="text-blue-400" description={`${stats.approvedPapers} published`} />
                        <MetricCard label="Portfolio Score" value={Math.round(stats.portfolioScore)} color="text-amber-400" description={`${stats.completionPct}% profile complete`} />
                    </MetricCardGrid>

                    <DashboardSection
                        title="Active Repository Feed"
                        subtitle="Your research paper submissions"
                        action={
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Search papers..."
                                    aria-label="Search papers"
                                    className="bg-slate-900 border border-slate-800 text-xs px-3 py-2 rounded-[12px] text-white outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-48"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                                <select
                                    aria-label="Sort papers"
                                    className="bg-slate-950 border border-slate-800 text-xs px-3 py-2 rounded-[12px] text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        }
                    >
                        {paginatedPapers.length === 0 ? (
                            <div className="bg-[#131b2e] p-12 rounded-[16px] border border-slate-800 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">
                                    No papers found
                                </p>
                                <Link
                                    href="/upload/paper"
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold uppercase tracking-wider text-xs transition-all"
                                >
                                    Submit Your First Paper
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedPapers.map((paper) => (
                                    <div
                                        key={paper._id}
                                        className="bg-[#131b2e] p-5 rounded-[16px] border border-slate-800/60 flex justify-between items-center gap-4 hover:border-slate-700 transition-all group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-400 transition-colors truncate">
                                                {paper.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <span
                                                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                                        paper.status === 'approved'
                                                            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                                                            : paper.status === 'rejected'
                                                              ? 'bg-red-950/40 text-red-400 border-red-900/40'
                                                              : 'bg-amber-950/40 text-amber-400 border-amber-900/40'
                                                    }`}
                                                >
                                                    {paper.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-slate-500 font-semibold text-[11px] self-center">
                                                    {new Date(paper.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/paper/${paper._id}`}
                                            className="p-3 bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white border border-slate-800 rounded-[12px] transition-all shrink-0"
                                            aria-label={`View ${paper.title}`}
                                        >
                                            →
                                        </Link>
                                    </div>
                                ))}

                                {totalPages > 1 && (
                                    <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                                        <span className="text-xs text-slate-500 font-semibold">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-[12px] text-xs hover:bg-slate-800 disabled:opacity-35 font-bold"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-[12px] text-xs hover:bg-slate-800 disabled:opacity-35 font-bold"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </DashboardSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ActivityFeed
                            items={notifications}
                            onMarkRead={markNotificationRead}
                            title="Notifications"
                            emptyMessage="No notifications yet"
                        />

                        <div className="space-y-6">
                            <QuickActions
                                actions={[
                                    { label: 'Add Achievement', href: '/achievements/create', icon: '🏆', variant: 'primary' },
                                    { label: 'Submit Paper', href: '/upload/paper', icon: '📝' },
                                    { label: 'Generate Portfolio', href: '/dashboard/portfolio', icon: '✦', variant: 'primary' },
                                    { label: 'Career Insights', href: '/insights', icon: '💡' },
                                ]}
                            />

                            <section className="bg-[#131b2e] border border-slate-800/60 rounded-[16px] p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                                        Registered Events
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                                        {myEvents.length} total
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {myEvents.slice(0, 5).map((event) => (
                                        <div
                                            key={event._id}
                                            className="bg-slate-900/40 p-3 rounded-[12px] border border-slate-800 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-slate-200">{event.title}</p>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {new Date(event.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="text-emerald-400 text-xs">✓</span>
                                        </div>
                                    ))}
                                    {myEvents.length === 0 && (
                                        <p className="text-xs text-slate-500 text-center py-4 uppercase tracking-wider">
                                            No events yet
                                        </p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}
        </DashboardShell>
    );
}
