import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import DashboardShell, { DashboardSection } from '../../components/dashboard/DashboardShell';
import DashboardHero from '../../components/dashboard/DashboardHero';
import MetricCard, { MetricCardGrid } from '../../components/dashboard/MetricCard';
import { SkeletonHero, SkeletonChartGrid, SkeletonList } from '../../components/dashboard/SkeletonGrid';
import ActivityFeed, { type ActivityItem } from '../../components/dashboard/ActivityFeed';
import QuickActions from '../../components/dashboard/QuickActions';
import { useToast } from '../../lib/useToast';
import { getRoleNavigation } from '../../lib/navigation';
import dynamic from 'next/dynamic';
import InstitutionalReviewQueue from '../../components/dashboard/InstitutionalReviewQueue';

const AdminAnalyticsCharts = dynamic(() => import('../../components/dashboard/AdminAnalyticsCharts'), {
  ssr: false,
  loading: () => <SkeletonChartGrid count={2} />,
});

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>({});
    const [papers, setPapers] = useState<any[]>([]);
    const [pendingPapers, setPendingPapers] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<ActivityItem[]>([]);
    const [usersCount, setUsersCount] = useState(0);
    const [deptCount, setDeptCount] = useState(0);
    const [systemHealth, setSystemHealth] = useState<'ok' | 'error' | 'loading'>('loading');
    const [loading, setLoading] = useState(true);

    const { toast, showToast } = useToast();

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) return;
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') return;
        setUser(parsedUser);
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        await Promise.all([
            fetchStats(),
            fetchPapers(),
            fetchPendingPapers(),
            fetchMeta(),
            fetchNotifications(),
            checkHealth(),
        ]);
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            const data = res.data;
            setStats({
                total: data.total,
                approved: data.approved,
                pending: data.pending,
                rejected: data.rejected,
                papersPerDept: data.papersPerDept,
                statusData: [
                    { name: 'Approved', value: data.approved },
                    { name: 'Pending', value: data.pending },
                    { name: 'Rejected', value: data.rejected },
                ],
                totalParticipants: data.totalParticipants || 0,
            });
        } catch {
            setStats({ total: 0, approved: 0, pending: 0, rejected: 0, papersPerDept: [], statusData: [] });
        }
    };

    const fetchPapers = async () => {
        try {
            const res = await api.get('/papers');
            setPapers(res.data.slice(0, 5));
        } catch {
            setPapers([]);
        }
    };

    const fetchPendingPapers = async () => {
        try {
            const res = await api.get('/papers/pending');
            setPendingPapers(res.data);
        } catch {
            setPendingPapers([]);
        }
    };

    const fetchMeta = async () => {
        try {
            const [usersRes, deptRes, achRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/departments'),
                api.get('/achievements/stats/dashboard').catch(() => ({ data: { data: {} } })),
            ]);
            setUsersCount(usersRes.data?.length || 0);
            setDeptCount(deptRes.data?.length || 0);
            setStats((prev: any) => ({
                ...prev,
                achievementTotal: achRes.data?.data?.totalAchievements || 0,
            }));
        } catch {
            /* non-critical */
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch {
            setNotifications([]);
        }
    };

    const checkHealth = async () => {
        try {
            const res = await api.get('/health');
            setSystemHealth(res.data.status === 'ok' ? 'ok' : 'error');
        } catch {
            setSystemHealth('error');
        }
    };

    const markNotificationRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
        } catch {
            showToast('Could not update notification.', 'error');
        }
    };

    if (!user) return null;

    const sidebarItems = getRoleNavigation('admin').map((item) =>
        item.label === 'Dashboard' ? { ...item, badge: pendingPapers.length } : item
    );

    return (
        <DashboardShell role="admin" toast={toast} sidebarItems={sidebarItems} activeHref="/dashboard/admin">
            {loading ? (
                <>
                    <SkeletonHero />
                    <SkeletonChartGrid count={2} />
                    <SkeletonList rows={4} />
                </>
            ) : (
                <>
                    <DashboardHero
                        badge="Admin Control"
                        badgeClass="bg-red-500/15 text-red-400 border-red-500/25"
                        title={
                            <>
                                Institutional <span className="text-blue-400">Intelligence</span>
                            </>
                        }
                        subtitle={`Overseeing ${stats.total || 0} publications across ${deptCount} departments and ${usersCount} users.`}
                    />

                    <MetricCardGrid columns={5}>
                        <MetricCard label="Users" value={usersCount} color="text-blue-400" description="Registered accounts" />
                        <MetricCard label="Departments" value={deptCount} color="text-purple-400" description="Active faculties" />
                        <MetricCard label="Research Papers" value={stats.total || 0} color="text-emerald-400" description={`${stats.approved || 0} published`} />
                        <MetricCard label="Achievements" value={stats.achievementTotal || 0} color="text-amber-400" description="Student milestones" />
                        <MetricCard
                            label="System Health"
                            value={systemHealth === 'ok' ? 'Healthy' : 'Degraded'}
                            color={systemHealth === 'ok' ? 'text-emerald-400' : 'text-red-400'}
                            description={`${stats.pending || 0} pending reviews`}
                        />
                    </MetricCardGrid>

                    <AdminAnalyticsCharts stats={stats} />

                    <QuickActions
                        title="Admin Quick Actions"
                        actions={[
                            { label: 'Manage Users', href: '/admin/users', icon: '👥', variant: 'primary' },
                            { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
                            { label: 'Create Event', href: '/admin/events/create', icon: '📅' },
                            { label: 'Annual Report', href: '/admin/report', icon: '📊' },
                            { label: 'Departments', href: '/admin/departments', icon: '🏢' },
                        ]}
                    />

                    <DashboardSection title="Institutional Review Queue" subtitle="Final authorization for published papers">
                        <InstitutionalReviewQueue onToast={showToast} />
                    </DashboardSection>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <ActivityFeed items={notifications} onMarkRead={markNotificationRead} title="Recent Activities" />
                        <section className="bg-[#131b2e] border border-slate-800/60 rounded-[16px] p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Registry Feed</h3>
                                <Link href="/browse-papers" className="text-xs font-bold text-blue-400 uppercase">View all →</Link>
                            </div>
                            <div className="space-y-3">
                                {papers.map((paper) => (
                                    <div key={paper._id} className="flex items-center justify-between gap-3 p-3 rounded-[12px] bg-slate-900/30 border border-slate-800">
                                        <p className="text-sm font-semibold text-white truncate">{paper.title}</p>
                                        <span className="text-[10px] font-bold uppercase text-emerald-400 shrink-0">{paper.status}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </>
            )}
        </DashboardShell>
    );
}
