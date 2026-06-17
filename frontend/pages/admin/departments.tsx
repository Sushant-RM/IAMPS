import { useState, useEffect } from 'react';
import api from '../../lib/api';
import Link from 'next/link';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { useToast } from '../../lib/useToast';
import { getRoleNavigation } from '../../lib/navigation';

export default function DepartmentsManagement() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        code: '',
        description: '',
        hod: '',
        establishedYear: 2000
    });
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const { toast, showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [deptRes, userRes] = await Promise.all([
                api.get('/departments'),
                api.get('/admin/users')
            ]);
            setDepartments(deptRes.data);
            setFaculty(userRes.data.filter((u: any) => u.role === 'faculty' || u.role === 'hod'));
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const wasEditing = isEditing;
        try {
            if (wasEditing) {
                await api.put(`/departments/${formData._id}`, formData);
            } else {
                await api.post('/departments', formData);
            }
            setIsEditing(false);
            setFormData({ _id: '', name: '', code: '', description: '', hod: '', establishedYear: 2000 });
            showToast(wasEditing ? 'Department updated.' : 'Department created.', 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Operation failed', 'error');
        }
    };

    const handleEdit = (dept: any) => {
        setIsEditing(true);
        setFormData({
            _id: dept._id,
            name: dept.name,
            code: dept.code,
            description: dept.description || '',
            hod: dept.hod?._id || '',
            establishedYear: dept.establishedYear || 2000
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/departments/${id}`);
            setDeleteTarget(null);
            showToast('Department deleted.', 'success');
            fetchData();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to delete department', 'error');
        }
    };

    return (
        <DashboardShell
            role="admin"
            toast={toast}
            sidebarItems={getRoleNavigation('admin')}
            activeHref="/admin/departments"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 italic">
                            Institutional <span className="text-blue-600">Wings</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Configure academic divisions and assign leadership.</p>
                    </div>
                    <Link href="/dashboard/admin" className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        &larr; Return to Command Center
                    </Link>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Management Console */}
                    <div className="lg:col-span-4">
                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[40px] border border-white/20 dark:border-slate-800/30 shadow-2xl sticky top-44">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 tracking-tight uppercase italic">
                                {isEditing ? 'Update' : 'Initiate'} <span className="text-blue-600">Wing</span>
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Computer Science"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Code</label>
                                        <input
                                            type="text"
                                            placeholder="CSE"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Est.</label>
                                        <input
                                            type="number"
                                            value={formData.establishedYear}
                                            onChange={e => setFormData({ ...formData, establishedYear: parseInt(e.target.value) })}
                                            className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Unit Head (HOD)</label>
                                    <select
                                        value={formData.hod}
                                        onChange={e => setFormData({ ...formData, hod: e.target.value })}
                                        className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 border-none rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="">Select Scholarship Lead</option>
                                        {faculty.map(f => (
                                            <option key={f._id} value={f._id}>{f.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20">
                                    {isEditing ? 'Confirm Update' : 'Expand Ecosystem'}
                                </button>
                                {isEditing && (
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditing(false); setFormData({ _id: '', name: '', code: '', description: '', hod: '', establishedYear: 2000 }); }}
                                        className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        Cancel Protocol
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Registry List */}
                    <div className="lg:col-span-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                                <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Registry...</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {departments.map((dept) => (
                                    <div key={dept._id} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[40px] border border-white/20 dark:border-slate-800/30 shadow-sm flex items-center justify-between group transition-all hover:shadow-xl">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:scale-110 transition-transform">
                                                {dept.code}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{dept.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Wing</span>
                                                    <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                                    <span className="text-[10px] font-bold text-slate-400">Head: {dept.hod?.fullName || 'Not Assigned'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleEdit(dept)}
                                                className="p-4 bg-slate-100 dark:bg-slate-800/50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            {deleteTarget === dept._id ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(dept._id)}
                                                        className="px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(null)}
                                                        className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold uppercase"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(dept._id)}
                                                    className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-900/30 rounded-2xl hover:bg-red-600 hover:text-white transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
        </DashboardShell>
    );
}
