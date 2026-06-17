import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api from '../../lib/api';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getHodNavigation } from '../../lib/navigation';
import ActivityFeed, { type ActivityItem } from '../../components/dashboard/ActivityFeed';
import dynamic from 'next/dynamic';

const HodAnalyticsCharts = dynamic(() => import('../../components/dashboard/HodAnalyticsCharts'), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
      <div className="h-56 sm:h-64 bg-[#131b2e] border border-slate-800 rounded-[16px] animate-pulse" />
      <div className="h-56 sm:h-64 bg-[#131b2e] border border-slate-800 rounded-[16px] animate-pulse" />
    </div>
  ),
});

export default function HodDashboard() {
    const [user, setUser] = useState<any>(null);
    const [department, setDepartment] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    // Data lists
    const [pendingPapers, setPendingPapers] = useState<any[]>([]);
    const [pendingAchievements, setPendingAchievements] = useState<any[]>([]);
    const [departmentStudents, setDepartmentStudents] = useState<any[]>([]);
    const [departmentFaculty, setDepartmentFaculty] = useState<any[]>([]);
    const [departmentPapers, setDepartmentPapers] = useState<any[]>([]);
    const [departmentAchievements, setDepartmentAchievements] = useState<any[]>([]);

    // Table search/filter/sort/pagination states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Review Actions State
    const [selectedPaper, setSelectedPaper] = useState<any>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
    const [comments, setComments] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [pdfViewed, setPdfViewed] = useState(false);

    const [notifications, setNotifications] = useState<ActivityItem[]>([]);

    // Custom Toast state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const router = useRouter();

    const goToTab = (tab: string) => {
        router.push({ pathname: '/dashboard/hod', query: { tab } }, undefined, { shallow: true });
    };

    useEffect(() => {
        const tab = (router.query.tab as string) || 'dashboard';
        setActiveTab(tab);
    }, [router.query.tab]);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const formatPdfUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const host = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
        return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) return;
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'hod') return;
        setUser(parsedUser);
        fetchInitialData(parsedUser);
    }, []);

    const fetchInitialData = async (currentUser: any) => {
        try {
            setLoading(true);
            
            // 1. Fetch Department Info
            if (currentUser.departmentId) {
                const deptRes = await api.get('/departments');
                const matchedDept = deptRes.data.find((d: any) => d._id === currentUser.departmentId);
                setDepartment(matchedDept);
            }

            // 2. Fetch pending reviews (papers and achievements)
            const [papersRes, achievementsRes, notifRes] = await Promise.all([
                api.get('/papers/pending').catch(() => ({ data: [] })),
                api.get('/achievements?status=pending').catch(() => ({ data: [] })),
                api.get('/notifications').catch(() => ({ data: [] })),
            ]);

            setNotifications(notifRes.data);

            setPendingPapers(papersRes.data);
            
            // Filter achievements matching this HOD's department code
            if (currentUser.departmentId) {
                const deptRes = await api.get('/departments');
                const matchedDept = deptRes.data.find((d: any) => d._id === currentUser.departmentId);
                if (matchedDept) {
                    const filteredAchs = (achievementsRes.data.data || achievementsRes.data || []).filter(
                        (a: any) => a.department === matchedDept.code
                    );
                    setPendingAchievements(filteredAchs);
                } else {
                    setPendingAchievements(achievementsRes.data.data || achievementsRes.data || []);
                }
            } else {
                setPendingAchievements(achievementsRes.data.data || achievementsRes.data || []);
            }

            // 3. Fetch Department details (Faculty, Students, all approved papers, and achievements)
            if (currentUser.departmentId) {
                const [facultyRes, allPapersRes, allAchsRes] = await Promise.all([
                    api.get(`/departments/${currentUser.departmentId}/faculty`).catch(() => ({ data: [] })),
                    api.get('/papers').catch(() => ({ data: [] })),
                    api.get('/achievements?status=approved').catch(() => ({ data: { data: [] } }))
                ]);

                setDepartmentFaculty(facultyRes.data);
                
                const filteredDeptPapers = allPapersRes.data.filter(
                    (p: any) => p.departmentId?._id === currentUser.departmentId
                );
                setDepartmentPapers(filteredDeptPapers);

                const deptRes = await api.get('/departments');
                const matchedDept = deptRes.data.find((d: any) => d._id === currentUser.departmentId);
                if (matchedDept) {
                    const filteredDeptAchs = (allAchsRes.data.data || allAchsRes.data || []).filter(
                        (a: any) => a.department === matchedDept.code
                    );
                    setDepartmentAchievements(filteredDeptAchs);
                }
            }
        } catch (err) {
            console.error('Failed to load HOD data', err);
            showToast('Error syncing departmental data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Review Paper Action
    const handlePaperAction = async (action: 'approve' | 'reject' | 'request_revision') => {
        if (!selectedPaper) return;
        if (action === 'approve' && !pdfViewed) {
            showToast('You must view the PDF before approving.', 'error');
            return;
        }

        setActionLoading(true);
        try {
            await api.put(`/papers/${selectedPaper._id}/status`, {
                action,
                comments
            });
            showToast(`Paper ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'sent back for revision'} successfully!`, 'success');
            setSelectedPaper(null);
            setComments('');
            fetchInitialData(user);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Review Achievement Action
    const handleAchievementAction = async (status: 'approve' | 'reject') => {
        if (!selectedAchievement) return;
        if (status === 'reject' && !rejectionReason) {
            showToast('Please provide a rejection reason.', 'error');
            return;
        }

        setActionLoading(true);
        try {
            if (status === 'approve') {
                await api.put(`/achievements/${selectedAchievement._id}/approve`);
                showToast('Achievement approved successfully!', 'success');
            } else {
                await api.put(`/achievements/${selectedAchievement._id}/reject`, { rejectionReason });
            }
            setSelectedAchievement(null);
            setRejectionReason('');
            fetchInitialData(user);
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // CSV Exporter
    const exportCSV = (data: any[], filename: string) => {
        if (!data || !data.length) {
            showToast('No data available to export', 'error');
            return;
        }
        const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
        const csvRows: string[] = [];
        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV Exported successfully!', 'success');
    };

    if (!user) return null;

    // Filtered lists for the HOD
    const filteredPapers = departmentPapers.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const sortedPapers = [...filteredPapers].sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedPapers.length / itemsPerPage);
    const paginatedPapers = sortedPapers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Mock/Derived metrics
    const stats = {
        pendingRequests: pendingPapers.length + pendingAchievements.length,
        totalPublications: departmentPapers.length,
        activeFaculty: departmentFaculty.length,
        approvedAchs: departmentAchievements.length,
    };

    // Charts data
    const publicationTrend = [
        { month: 'Jan', papers: 3 },
        { month: 'Feb', papers: 5 },
        { month: 'Mar', papers: 8 },
        { month: 'Apr', papers: 4 },
        { month: 'May', papers: stats.totalPublications || 6 }
    ];

    const achievementSpread = [
        { name: 'Hackathons', count: 12 },
        { name: 'Certifications', count: 18 },
        { name: 'Internships', count: stats.approvedAchs || 10 },
        { name: 'Community', count: 5 }
    ];

    const sidebarItems = getHodNavigation(stats.pendingRequests);

    return (
        <DashboardShell role="hod" toast={toast} sidebarItems={sidebarItems} activeHref={router.asPath}>
                {/* Hero Header */}
                <div className="bg-gradient-to-br from-blue-900/60 to-indigo-950/80 border border-slate-800 rounded-[24px] p-10 shadow-2xl relative overflow-hidden mb-10">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
                            HOD Control Panel
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-3 mb-2 uppercase italic">
                            Department of <span className="text-blue-400">{department ? department.name : 'Institutional Sciences'}</span>
                        </h1>
                        <p className="text-slate-400 font-medium max-w-2xl text-sm leading-relaxed">
                            Welcome, {user.fullName}. Monitor departmental achievements, perform protocol reviews, and analyze student analytics.
                        </p>
                    </div>
                </div>

                        {loading ? (
                            <div className="space-y-6">
                                <div className="h-40 bg-[#131b2e] rounded-[16px] animate-pulse"></div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="h-32 bg-[#131b2e] rounded-[16px] animate-pulse"></div>
                                    <div className="h-32 bg-[#131b2e] rounded-[16px] animate-pulse"></div>
                                    <div className="h-32 bg-[#131b2e] rounded-[16px] animate-pulse"></div>
                                </div>
                            </div>
                        ) : activeTab === 'dashboard' && (
                            /* ─── DASHBOARD TAB ─── */
                            <div className="space-y-10">
                                {/* Summary Metric Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Pending Reviews', value: stats.pendingRequests, color: 'text-amber-400', desc: 'Awaiting action' },
                                        { label: 'Publications', value: stats.totalPublications, color: 'text-blue-400', desc: 'Approved works' },
                                        { label: 'Active Faculty', value: stats.activeFaculty, color: 'text-emerald-400', desc: 'In department' },
                                        { label: 'Approved Achievements', value: stats.approvedAchs, color: 'text-purple-400', desc: 'Verified badges' }
                                    ].map((metric, i) => (
                                        <div key={i} className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-sm relative overflow-hidden">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{metric.label}</p>
                                            <p className={`text-3xl font-black ${metric.color}`}>{metric.value}</p>
                                            <p className="text-[11px] text-slate-400 mt-1">{metric.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <HodAnalyticsCharts publicationTrend={publicationTrend} achievementSpread={achievementSpread} />

                                {/* Quick Actions */}
                                <div className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-md">
                                    <h3 className="text-base font-bold text-white mb-4 uppercase tracking-tight">Quick Action Center</h3>
                                    <div className="flex flex-wrap gap-4">
                                        <button onClick={() => goToTab('approvals')} className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all">
                                            Open Approval Queue ({stats.pendingRequests})
                                        </button>
                                        <button onClick={() => exportCSV(departmentPapers, 'department_research')} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all border border-slate-700">
                                            Export Publications Log
                                        </button>
                                        <button onClick={() => exportCSV(departmentFaculty, 'department_faculty')} className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all border border-slate-700">
                                            Export Faculty Roster
                                        </button>
                                    </div>
                                </div>

                                <ActivityFeed
                                    items={notifications}
                                    title="Recent Activity"
                                    emptyMessage="No departmental notifications"
                                    onMarkRead={async (id) => {
                                        try {
                                            await api.patch(`/notifications/${id}/read`);
                                            setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
                                        } catch {
                                            showToast('Could not update notification.', 'error');
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === 'approvals' && (
                            /* ─── APPROVALS QUEUE TAB ─── */
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Queue: Papers */}
                                    <div className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-md space-y-4">
                                        <h3 className="text-base font-bold text-white uppercase tracking-tight border-b border-slate-800 pb-3">Research Papers ({pendingPapers.length})</h3>
                                        {pendingPapers.length === 0 ? (
                                            <p className="text-xs text-slate-500 font-bold uppercase py-10 text-center">No research pending review</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {pendingPapers.map(p => (
                                                    <button
                                                        key={p._id}
                                                        onClick={() => { setSelectedPaper(p); setPdfViewed(false); setSelectedAchievement(null); }}
                                                        className={`w-full text-left p-4 rounded-[12px] border transition-all ${
                                                            selectedPaper?._id === p._id
                                                                ? 'bg-blue-600 border-blue-500 text-white'
                                                                : 'bg-slate-900/40 border-slate-800 hover:border-blue-500 text-slate-300'
                                                        }`}
                                                    >
                                                        <h4 className="text-sm font-bold line-clamp-1">{p.title}</h4>
                                                        <div className="flex justify-between items-center mt-2 text-[10px] opacity-70">
                                                            <span>By {p.submittedBy?.fullName}</span>
                                                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Queue: Achievements */}
                                    <div className="bg-[#131b2e] border border-slate-800/60 p-6 rounded-[16px] shadow-md space-y-4">
                                        <h3 className="text-base font-bold text-white uppercase tracking-tight border-b border-slate-800 pb-3">Student Achievements ({pendingAchievements.length})</h3>
                                        {pendingAchievements.length === 0 ? (
                                            <p className="text-xs text-slate-500 font-bold uppercase py-10 text-center">No achievements pending review</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {pendingAchievements.map(a => (
                                                    <button
                                                        key={a._id}
                                                        onClick={() => { setSelectedAchievement(a); setSelectedPaper(null); }}
                                                        className={`w-full text-left p-4 rounded-[12px] border transition-all ${
                                                            selectedAchievement?._id === a._id
                                                                ? 'bg-blue-600 border-blue-500 text-white'
                                                                : 'bg-slate-900/40 border-slate-800 hover:border-blue-500 text-slate-300'
                                                        }`}
                                                    >
                                                        <h4 className="text-sm font-bold line-clamp-1">{a.achievementTitle}</h4>
                                                        <p className="text-xs text-blue-400 mt-1 font-semibold">{a.category}</p>
                                                        <div className="flex justify-between items-center mt-2 text-[10px] opacity-70">
                                                            <span>{a.studentName} ({a.usn})</span>
                                                            <span>{new Date(a.achievementDate).toLocaleDateString()}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Console Workspace */}
                                {selectedPaper && (
                                    <div className="bg-[#131b2e] border border-slate-800/60 rounded-[16px] overflow-hidden flex flex-col h-[700px]">
                                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                                            <div>
                                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold uppercase">Awaiting Action</span>
                                                <h3 className="text-lg font-bold text-white mt-1">{selectedPaper.title}</h3>
                                                <p className="text-xs text-slate-400 font-semibold mt-1">Submitted by: {selectedPaper.submittedBy?.fullName}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <a href={formatPdfUrl(selectedPaper.pdfUrl)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] text-xs font-bold transition-all">
                                                    Open PDF ↗
                                                </a>
                                                <button onClick={() => setSelectedPaper(null)} className="p-2 text-slate-500 hover:text-white transition-all">
                                                    ✕
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 bg-slate-950 relative">
                                            {!pdfViewed ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">View document to enable approval</p>
                                                    <button onClick={() => setPdfViewed(true)} className="px-6 py-3 bg-blue-600 text-white rounded-[8px] font-bold text-xs uppercase tracking-wider transition-all">
                                                        Initialize Document Review
                                                    </button>
                                                </div>
                                            ) : (
                                                <iframe src={formatPdfUrl(selectedPaper.pdfUrl)} className="w-full h-full border-none"></iframe>
                                            )}
                                        </div>

                                        <div className="p-6 bg-slate-900/40 border-t border-slate-800 space-y-4">
                                            <textarea
                                                className="w-full bg-slate-900 border border-slate-800 rounded-[12px] p-4 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="Enter review remarks/feedback..."
                                                value={comments}
                                                onChange={e => setComments(e.target.value)}
                                            ></textarea>
                                            <div className="flex gap-3">
                                                <button onClick={() => handlePaperAction('approve')} disabled={!pdfViewed || actionLoading} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[8px] text-xs uppercase tracking-widest disabled:opacity-20 transition-all">
                                                    Approve Paper
                                                </button>
                                                <button onClick={() => handlePaperAction('request_revision')} disabled={actionLoading} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-[8px] text-xs uppercase tracking-widest transition-all">
                                                    Request Revision
                                                </button>
                                                <button onClick={() => handlePaperAction('reject')} disabled={actionLoading} className="px-6 py-3 bg-red-600 hover:bg-red-750 text-white font-bold rounded-[8px] text-xs uppercase tracking-widest transition-all">
                                                    Reject Paper
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedAchievement && (
                                    <div className="bg-[#131b2e] border border-slate-800/60 rounded-[16px] p-6 space-y-6">
                                        <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                                            <div>
                                                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-bold uppercase tracking-wider">{selectedAchievement.category}</span>
                                                <h3 className="text-xl font-bold text-white mt-2">{selectedAchievement.achievementTitle}</h3>
                                                <p className="text-xs text-slate-400 mt-1 font-semibold">Student: {selectedAchievement.studentName} ({selectedAchievement.usn})</p>
                                            </div>
                                            <button onClick={() => setSelectedAchievement(null)} className="text-slate-500 hover:text-white transition-all">✕</button>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
                                                <p className="text-sm text-slate-300 leading-relaxed font-medium">{selectedAchievement.description}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Achievement Date</h4>
                                                <p className="text-sm text-slate-300 font-semibold">{new Date(selectedAchievement.achievementDate).toLocaleDateString()}</p>
                                            </div>
                                            {selectedAchievement.certificateLink && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Certificate Proof</h4>
                                                    <a href={selectedAchievement.certificateLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline">
                                                        View Submitted Proof File ↗
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-800 pt-4 space-y-4">
                                            <input
                                                type="text"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-[8px] px-4 py-3 text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="Provide reason if rejecting..."
                                                value={rejectionReason}
                                                onChange={e => setRejectionReason(e.target.value)}
                                            />
                                            <div className="flex gap-4">
                                                <button onClick={() => handleAchievementAction('approve')} disabled={actionLoading} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[8px] text-xs uppercase tracking-widest transition-all">
                                                    Approve Achievement
                                                </button>
                                                <button onClick={() => handleAchievementAction('reject')} disabled={actionLoading} className="px-6 py-3 bg-red-600 hover:bg-red-750 text-white font-bold rounded-[8px] text-xs uppercase tracking-widest transition-all">
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'faculty' && (
                            /* ─── FACULTY PERFORMANCE TAB ─── */
                            <div className="bg-[#131b2e] border border-slate-800/60 p-8 rounded-[16px] shadow-md space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Faculty Roster</h3>
                                        <p className="text-xs text-slate-400 font-semibold mt-1">Review faculty members and their profiles.</p>
                                    </div>
                                    <button onClick={() => exportCSV(departmentFaculty, 'department_faculty')} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[8px] text-xs font-bold border border-slate-700 transition-all">
                                        Export Roster
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                                <th className="py-4 px-4">Faculty Name</th>
                                                <th className="py-4 px-4">Institutional Email</th>
                                                <th className="py-4 px-4">Role Designation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40 text-sm">
                                            {departmentFaculty.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="py-8 text-center text-xs text-slate-500 font-bold uppercase">No faculty mapped to department</td>
                                                </tr>
                                            ) : (
                                                departmentFaculty.map((f, i) => (
                                                    <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                                        <td className="py-4 px-4 font-bold text-white">{f.fullName}</td>
                                                        <td className="py-4 px-4 text-slate-300 font-medium">{f.email}</td>
                                                        <td className="py-4 px-4">
                                                            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                                {f.role}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'research' && (
                            /* ─── RESEARCH ANALYTICS TAB ─── */
                            <div className="space-y-6">
                                <div className="bg-[#131b2e] border border-slate-800/60 p-8 rounded-[16px] shadow-md space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Research Publications Directory</h3>
                                            <p className="text-xs text-slate-400 font-semibold mt-1">Review department publication history and statuses.</p>
                                        </div>
                                        <button onClick={() => exportCSV(departmentPapers, 'department_research')} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[8px] text-xs font-bold border border-slate-700 transition-all">
                                            Export Publications
                                        </button>
                                    </div>

                                    {/* Filters & Controls */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-[12px] border border-slate-800">
                                        <input
                                            type="text"
                                            className="bg-slate-950 border border-slate-800 rounded-[8px] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Search publication..."
                                            value={searchQuery}
                                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                        />
                                        <select
                                            className="bg-slate-950 border border-slate-800 rounded-[8px] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                            value={statusFilter}
                                            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="approved">Approved</option>
                                            <option value="pending_faculty">Pending Faculty</option>
                                            <option value="pending_admin">Pending Admin</option>
                                            <option value="revision_requested">Revision Requested</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <select
                                            className="bg-slate-950 border border-slate-800 rounded-[8px] px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                                            value={sortBy}
                                            onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                        </select>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                                    <th className="py-4 px-4">Publication Title</th>
                                                    <th className="py-4 px-4">Type</th>
                                                    <th className="py-4 px-4">Author(s)</th>
                                                    <th className="py-4 px-4">Submission Date</th>
                                                    <th className="py-4 px-4">Workflow Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/40 text-sm">
                                                {paginatedPapers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-bold uppercase">No matching publications found</td>
                                                    </tr>
                                                ) : (
                                                    paginatedPapers.map((paper, i) => (
                                                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                                            <td className="py-4 px-4 font-bold text-white leading-snug max-w-xs truncate">{paper.title}</td>
                                                            <td className="py-4 px-4 text-slate-300 font-semibold text-xs uppercase">{paper.type}</td>
                                                            <td className="py-4 px-4 text-slate-300 font-medium">
                                                                {paper.authors ? paper.authors.join(', ') : 'Student Submitter'}
                                                            </td>
                                                            <td className="py-4 px-4 text-slate-400 font-medium">{new Date(paper.createdAt).toLocaleDateString()}</td>
                                                            <td className="py-4 px-4">
                                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                                    paper.status === 'approved' 
                                                                        ? 'bg-emerald-950/40 text-emerald-450 border-emerald-900/50' 
                                                                        : paper.status === 'rejected' 
                                                                            ? 'bg-red-950/40 text-red-450 border-red-900/50' 
                                                                            : 'bg-amber-950/40 text-amber-455 border-amber-900/50'
                                                                }`}>
                                                                    {paper.status.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination footer */}
                                    {totalPages > 1 && (
                                        <div className="flex justify-between items-center border-t border-slate-800 pt-4">
                                            <span className="text-xs text-slate-500 font-semibold">Page {currentPage} of {totalPages}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs hover:bg-slate-800 disabled:opacity-30 transition-all font-bold"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs hover:bg-slate-800 disabled:opacity-30 transition-all font-bold"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'achievements' && (
                            /* ─── STUDENT ACHIEVEMENTS TAB ─── */
                            <div className="bg-[#131b2e] border border-slate-800/60 p-8 rounded-[16px] shadow-md space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Approved Student Achievements</h3>
                                        <p className="text-xs text-slate-400 font-semibold mt-1 font-medium">Verify registered student milestones and awards.</p>
                                    </div>
                                    <button onClick={() => exportCSV(departmentAchievements, 'student_achievements')} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-[8px] text-xs font-bold border border-slate-700 transition-all">
                                        Export CSV
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                                <th className="py-4 px-4">Student Name</th>
                                                <th className="py-4 px-4">USN</th>
                                                <th className="py-4 px-4">Milestone Title</th>
                                                <th className="py-4 px-4">Category</th>
                                                <th className="py-4 px-4">Date Approved</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40 text-sm">
                                            {departmentAchievements.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="py-8 text-center text-xs text-slate-500 font-bold uppercase">No verified student achievements recorded</td>
                                                </tr>
                                            ) : (
                                                departmentAchievements.map((ach, i) => (
                                                    <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                                                        <td className="py-4 px-4 font-bold text-white">{ach.studentName}</td>
                                                        <td className="py-4 px-4 text-slate-300 font-mono text-xs">{ach.usn}</td>
                                                        <td className="py-4 px-4 text-slate-300 font-medium">{ach.achievementTitle}</td>
                                                        <td className="py-4 px-4">
                                                            <span className="px-2 py-0.5 bg-blue-900/30 text-blue-300 border border-blue-800/40 rounded text-[10px] font-bold uppercase">
                                                                {ach.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-4 text-slate-400 font-medium">{new Date(ach.updatedAt || ach.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reports' && (
                            /* ─── REPORTS GENERATOR TAB ─── */
                            <div className="bg-[#131b2e] border border-slate-800/60 p-8 rounded-[16px] shadow-md space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">Institutional Reports Dashboard</h3>
                                    <p className="text-xs text-slate-400 font-semibold mt-1">Generate complete tabular records for accreditation bodies.</p>
                                </div>

                                <div className="p-8 border border-slate-850 rounded-[12px] bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-white">Annual Accredited Departmental Report</h4>
                                        <p className="text-xs text-slate-400 font-semibold max-w-md">Compile department metrics, approved research publications, student achievements list, and faculty performance roster.</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const combined = [
                                                ...departmentPapers.map(p => ({ category: 'Research Paper', title: p.title, details: p.type, creator: p.submittedBy?.fullName, date: p.createdAt })),
                                                ...departmentAchievements.map(a => ({ category: 'Student Achievement', title: a.achievementTitle, details: a.category, creator: a.studentName, date: a.achievementDate }))
                                            ];
                                            exportCSV(combined, 'department_annual_report');
                                        }}
                                        className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] font-bold text-xs uppercase tracking-wider transition-all"
                                    >
                                        Compile & Download CSV
                                    </button>
                                </div>
                            </div>
                        )}
        </DashboardShell>
    );
}
