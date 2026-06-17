import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import { formatPdfUrl } from '../../lib/formatPdfUrl';
import DashboardShell, { DashboardSection } from '../../components/dashboard/DashboardShell';
import DashboardHero from '../../components/dashboard/DashboardHero';
import MetricCard, { MetricCardGrid } from '../../components/dashboard/MetricCard';
import { SkeletonHero, SkeletonMetricGrid, SkeletonList } from '../../components/dashboard/SkeletonGrid';
import ActivityFeed, { type ActivityItem } from '../../components/dashboard/ActivityFeed';
import QuickActions from '../../components/dashboard/QuickActions';
import { useToast } from '../../lib/useToast';
import { getRoleNavigation } from '../../lib/navigation';

export default function FacultyDashboard() {
    const [user, setUser] = useState<any>(null);
    const [pendingPapers, setPendingPapers] = useState<any[]>([]);
    const [pendingAchievements, setPendingAchievements] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<ActivityItem[]>([]);
    const [reviewStats, setReviewStats] = useState({ approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    const [selectedPaper, setSelectedPaper] = useState<any>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
    const [pdfViewed, setPdfViewed] = useState(false);
    const [comments, setComments] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const { toast, showToast } = useToast();
    const router = useRouter();
    const activeTab = (router.query.tab as string) || 'papers';

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
            return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role === 'hod') {
            router.replace('/dashboard/hod');
            return;
        }
        if (!['faculty', 'committee_member'].includes(parsedUser.role)) {
            return;
        }
        setUser(parsedUser);
        fetchDashboardData(parsedUser);
    }, []);

    const fetchDashboardData = async (currentUser: any) => {
        try {
            setLoading(true);
            const [papersRes, achievementsRes, notifRes, allAchRes] = await Promise.all([
                api.get('/papers/pending'),
                api.get('/achievements?status=pending').catch(() => ({ data: { data: [] } })),
                api.get('/notifications').catch(() => ({ data: [] })),
                api.get('/achievements').catch(() => ({ data: { data: [] } })),
            ]);

            setPendingPapers(papersRes.data);
            setNotifications(notifRes.data);

            let achievements = achievementsRes.data.data || achievementsRes.data || [];
            if (currentUser.departmentId) {
                const deptRes = await api.get('/departments');
                const matchedDept = deptRes.data.find((d: any) => d._id === currentUser.departmentId);
                if (matchedDept) {
                    achievements = achievements.filter((a: any) => a.department === matchedDept.code);
                }
            }
            setPendingAchievements(achievements);

            const allAch = allAchRes.data.data || allAchRes.data || [];
            setReviewStats({
                approved: allAch.filter((a: any) => a.status === 'approved').length,
                rejected: allAch.filter((a: any) => a.status === 'rejected').length,
            });
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to load dashboard', 'error');
        } finally {
            setLoading(false);
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

    const openReview = (paper: any) => {
        setSelectedPaper(paper);
        setSelectedAchievement(null);
        setPdfViewed(false);
        setComments('');
    };

    const openAchievementReview = (achievement: any) => {
        setSelectedAchievement(achievement);
        setSelectedPaper(null);
        setRejectionReason('');
    };

    const handlePaperAction = async (action: 'approve' | 'reject' | 'request_revision') => {
        if (!selectedPaper) return;
        if (action === 'approve' && !pdfViewed) {
            showToast('You must view the PDF before approving.', 'error');
            return;
        }

        setActionLoading(true);
        try {
            await api.put(`/papers/${selectedPaper._id}/status`, { action, comments });
            showToast(
                `Paper ${action === 'approve' ? 'approved and forwarded to admin' : action === 'reject' ? 'rejected' : 'sent back for revision'} successfully!`,
                'success'
            );
            setSelectedPaper(null);
            setComments('');
            fetchDashboardData(user);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAchievementAction = async (status: 'approve' | 'reject') => {
        if (!selectedAchievement) return;
        if (status === 'reject' && !rejectionReason.trim()) {
            showToast('Please provide a rejection reason.', 'error');
            return;
        }

        setActionLoading(true);
        try {
            if (status === 'approve') {
                await api.put(`/achievements/${selectedAchievement._id}/approve`);
                showToast('Achievement approved. Student has been notified.', 'success');
            } else {
                await api.put(`/achievements/${selectedAchievement._id}/reject`, { rejectionReason });
                showToast('Achievement rejected. Student has been notified.', 'success');
            }
            setSelectedAchievement(null);
            setRejectionReason('');
            fetchDashboardData(user);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    if (!user) return null;

    const sidebarItems = getRoleNavigation(user.role).map((item) => {
        if (item.label === 'Research Reviews') return { ...item, badge: pendingPapers.length };
        if (item.label === 'Achievement Reviews') return { ...item, badge: pendingAchievements.length };
        return item;
    });

    const canReviewAchievements = user.role === 'hod';
    const showPaperReviews = activeTab !== 'reviews' || !canReviewAchievements;
    const queue = showPaperReviews ? pendingPapers : pendingAchievements;

    return (
        <DashboardShell
            role={user.role}
            toast={toast}
            sidebarItems={sidebarItems}
            activeHref={`/dashboard/faculty${activeTab === 'reviews' ? '?tab=reviews' : '?tab=papers'}`}
        >
            {loading ? (
                <>
                    <SkeletonHero />
                    <SkeletonMetricGrid count={4} />
                    <SkeletonList rows={3} />
                </>
            ) : (
                <>
                    <DashboardHero
                        badge="Faculty Portal"
                        badgeClass="bg-purple-500/15 text-purple-400 border-purple-500/25"
                        title={
                            <>
                                Review <span className="text-blue-400">Command</span>
                            </>
                        }
                        subtitle="Review research papers and student achievements for your department in one workspace."
                    />

                    <MetricCardGrid columns={4}>
                        <MetricCard label="Pending Reviews" value={pendingPapers.length + pendingAchievements.length} color="text-amber-400" description="Requires your action" />
                        <MetricCard label="Paper Queue" value={pendingPapers.length} color="text-blue-400" description="Research submissions" />
                        <MetricCard label="Achievement Queue" value={pendingAchievements.length} color="text-purple-400" description="Student milestones" />
                        <MetricCard label="Approved Total" value={reviewStats.approved} color="text-emerald-400" description={`${reviewStats.rejected} rejected`} />
                    </MetricCardGrid>

                    <div className="flex gap-2 mb-6">
                        <Link
                            href="/dashboard/faculty?tab=papers"
                            className={`px-4 py-2 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all ${
                                showPaperReviews ? 'bg-blue-600 text-white' : 'bg-[#131b2e] text-slate-400 border border-slate-800'
                            }`}
                        >
                            Research Reviews ({pendingPapers.length})
                        </Link>
                        {canReviewAchievements && (
                            <Link
                                href="/dashboard/faculty?tab=reviews"
                                className={`px-4 py-2 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all ${
                                    !showPaperReviews ? 'bg-blue-600 text-white' : 'bg-[#131b2e] text-slate-400 border border-slate-800'
                                }`}
                            >
                                Achievement Reviews ({pendingAchievements.length})
                            </Link>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8 mb-8">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                    {showPaperReviews ? 'Pending Papers' : 'Pending Achievements'} ({queue.length})
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => fetchDashboardData(user)}
                                    className="p-2 hover:bg-slate-800 rounded-[8px] transition-all text-slate-400 text-xs font-bold"
                                >
                                    Refresh
                                </button>
                            </div>

                            {queue.length === 0 ? (
                                <div className="p-12 text-center bg-[#131b2e] rounded-[16px] border border-dashed border-slate-700">
                                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Queue Clear</p>
                                </div>
                            ) : showPaperReviews ? (
                                queue.map((p: any) => (
                                    <button
                                        key={p._id}
                                        type="button"
                                        onClick={() => openReview(p)}
                                        className={`w-full text-left p-4 rounded-[12px] border transition-all ${
                                            selectedPaper?._id === p._id
                                                ? 'bg-blue-600 border-blue-500 text-white'
                                                : 'bg-[#131b2e] border-slate-800 hover:border-blue-500 text-slate-200'
                                        }`}
                                    >
                                        <p className="font-bold text-sm line-clamp-2 mb-2">{p.title}</p>
                                        <span className="text-[10px] font-bold uppercase opacity-70">{p.type}</span>
                                    </button>
                                ))
                            ) : (
                                queue.map((a: any) => (
                                    <button
                                        key={a._id}
                                        type="button"
                                        onClick={() => openAchievementReview(a)}
                                        className={`w-full text-left p-4 rounded-[12px] border transition-all ${
                                            selectedAchievement?._id === a._id
                                                ? 'bg-blue-600 border-blue-500 text-white'
                                                : 'bg-[#131b2e] border-slate-800 hover:border-blue-500 text-slate-200'
                                        }`}
                                    >
                                        <p className="font-bold text-sm line-clamp-2 mb-1">{a.achievementTitle}</p>
                                        <p className="text-[10px] opacity-70">{a.studentName} · {a.category}</p>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="lg:col-span-8">
                            {selectedPaper && showPaperReviews ? (
                                <div className="bg-[#131b2e] rounded-[16px] border border-slate-800 overflow-hidden flex flex-col min-h-[640px]">
                                    <div className="p-5 border-b border-slate-800 flex justify-between items-start gap-4 bg-slate-900/40">
                                        <div>
                                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold uppercase">Paper Review</span>
                                            <h2 className="text-lg font-bold text-white mt-2">{selectedPaper.title}</h2>
                                            <p className="text-xs text-slate-400 mt-1">By {selectedPaper.submittedBy?.fullName}</p>
                                        </div>
                                        <a href={formatPdfUrl(selectedPaper.pdfUrl)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white rounded-[8px] text-xs font-bold shrink-0">
                                            Open PDF ↗
                                        </a>
                                    </div>

                                    <div className="flex-1 bg-slate-950 relative min-h-[360px]">
                                        {!pdfViewed ? (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <button type="button" onClick={() => setPdfViewed(true)} className="px-8 py-3 bg-blue-600 text-white rounded-[12px] text-xs font-bold uppercase">
                                                    Initialize Review
                                                </button>
                                            </div>
                                        ) : (
                                            <object data={formatPdfUrl(selectedPaper.pdfUrl)} type="application/pdf" className="w-full h-full min-h-[360px]">
                                                <iframe src={formatPdfUrl(selectedPaper.pdfUrl)} className="w-full h-full min-h-[360px]" title="Paper PDF" />
                                            </object>
                                        )}
                                    </div>

                                    <div className="p-5 border-t border-slate-800 space-y-3 bg-slate-900/40">
                                        <textarea
                                            className="w-full bg-slate-900 border border-slate-800 rounded-[12px] p-3 text-white text-sm h-20 outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Review remarks..."
                                            value={comments}
                                            onChange={(e) => setComments(e.target.value)}
                                        />
                                        <div className="flex gap-2 flex-wrap">
                                            <button type="button" onClick={() => handlePaperAction('approve')} disabled={!pdfViewed || actionLoading} className="flex-1 py-3 bg-emerald-600 text-white rounded-[8px] text-xs font-bold uppercase disabled:opacity-30">
                                                ✓ Approve
                                            </button>
                                            <button type="button" onClick={() => handlePaperAction('request_revision')} disabled={actionLoading} className="px-4 py-3 bg-amber-500 text-white rounded-[8px] text-xs font-bold uppercase">
                                                ↺ Revise
                                            </button>
                                            <button type="button" onClick={() => handlePaperAction('reject')} disabled={actionLoading} className="px-4 py-3 bg-red-600 text-white rounded-[8px] text-xs font-bold uppercase">
                                                ✗ Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : selectedAchievement && !showPaperReviews ? (
                                <div className="bg-[#131b2e] rounded-[16px] border border-slate-800 p-6 min-h-[640px] flex flex-col">
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold uppercase w-fit">Achievement Review</span>
                                    <h2 className="text-xl font-bold text-white mt-3">{selectedAchievement.achievementTitle}</h2>
                                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                        <div><span className="text-slate-500">Student</span><p className="text-white font-semibold">{selectedAchievement.studentName}</p></div>
                                        <div><span className="text-slate-500">USN</span><p className="text-white font-semibold">{selectedAchievement.usn}</p></div>
                                        <div><span className="text-slate-500">Category</span><p className="text-white font-semibold">{selectedAchievement.category}</p></div>
                                        <div><span className="text-slate-500">Date</span><p className="text-white font-semibold">{new Date(selectedAchievement.achievementDate).toLocaleDateString()}</p></div>
                                    </div>
                                    <p className="text-slate-300 mt-4 flex-1">{selectedAchievement.description}</p>
                                    {selectedAchievement.certificateLink && (
                                        <a href={selectedAchievement.certificateLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm font-semibold mt-2">
                                            View certificate evidence ↗
                                        </a>
                                    )}
                                    <textarea
                                        className="w-full mt-4 bg-slate-900 border border-slate-800 rounded-[12px] p-3 text-white text-sm h-20 outline-none"
                                        placeholder="Rejection reason (required if rejecting)..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <div className="flex gap-2 mt-4">
                                        <button type="button" onClick={() => handleAchievementAction('approve')} disabled={actionLoading} className="flex-1 py-3 bg-emerald-600 text-white rounded-[8px] text-xs font-bold uppercase">
                                            ✓ Approve
                                        </button>
                                        <button type="button" onClick={() => handleAchievementAction('reject')} disabled={actionLoading} className="flex-1 py-3 bg-red-600 text-white rounded-[8px] text-xs font-bold uppercase">
                                            ✗ Reject
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 bg-[#131b2e] rounded-[16px] border border-dashed border-slate-700 text-center">
                                    <h3 className="text-base font-bold text-slate-500 uppercase tracking-widest">Select an item from the queue</h3>
                                    <p className="text-slate-600 mt-2 text-sm">Review evidence, add remarks, and approve or reject in one screen.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ActivityFeed items={notifications} onMarkRead={markNotificationRead} title="Recent Activity" />
                        <QuickActions
                            actions={[
                                { label: 'Browse Events', href: '/events', icon: '📅' },
                                { label: 'Department Reports', href: '/admin/report', icon: '📄' },
                            ]}
                        />
                    </div>
                </>
            )}
        </DashboardShell>
    );
}
