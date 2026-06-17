import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import DashboardShell from '../../components/dashboard/DashboardShell';
import DataTable, { type DataTableColumn } from '../../components/dashboard/DataTable';
import { useToast } from '../../lib/useToast';
import { getRoleNavigation } from '../../lib/navigation';

type UserRow = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId?: { _id: string; name: string } | null;
};

export default function Users() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ role: '', departmentId: '' });
    const [saving, setSaving] = useState(false);
    const { toast, showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, deptsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/departments')
            ]);
            setUsers(usersRes.data);
            setDepartments(deptsRes.data);
        } catch {
            showToast('Failed to load users.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (user: UserRow) => {
        setEditingUser(user._id);
        setEditForm({
            role: user.role,
            departmentId: user.departmentId?._id || ''
        });
    };

    const handleSave = async (userId: string) => {
        setSaving(true);
        try {
            await api.patch(`/admin/user/${userId}`, editForm);
            setEditingUser(null);
            showToast('User updated successfully.', 'success');
            fetchData();
        } catch {
            showToast('Failed to update user.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const roleBadge = (role: string) => {
        const styles: Record<string, string> = {
            admin: 'bg-purple-950/40 text-purple-400 border-purple-900/40',
            faculty: 'bg-blue-950/40 text-blue-400 border-blue-900/40',
            hod: 'bg-indigo-950/40 text-indigo-400 border-indigo-900/40',
            student: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40',
        };
        return styles[role] || 'bg-slate-800 text-slate-300 border-slate-700';
    };

    const columns: DataTableColumn<UserRow>[] = [
        {
            key: 'fullName',
            label: 'Name',
            sortable: true,
            exportValue: (row) => row.fullName,
            render: (user) => (
                <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-black shrink-0">
                        {user.fullName[0]}
                    </div>
                    <div>
                        <p className="font-bold text-white">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            sortable: true,
            exportValue: (row) => row.role,
            render: (user) =>
                editingUser === user._id ? (
                    <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-[8px] text-sm font-semibold text-white px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="hod">HOD</option>
                        <option value="committee_member">Committee</option>
                        <option value="admin">Admin</option>
                    </select>
                ) : (
                    <span className={`px-3 py-1 rounded-[8px] text-[10px] font-bold uppercase border ${roleBadge(user.role)}`}>
                        {user.role}
                    </span>
                ),
        },
        {
            key: 'department',
            label: 'Department',
            sortable: true,
            exportValue: (row) => row.departmentId?.name || 'Unassigned',
            render: (user) =>
                editingUser === user._id ? (
                    <select
                        value={editForm.departmentId}
                        onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-[8px] text-sm font-semibold text-white px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
                    >
                        <option value="">No Department</option>
                        {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                    </select>
                ) : user.departmentId ? (
                    <span className="text-sm font-semibold text-slate-300">{user.departmentId.name}</span>
                ) : (
                    <span className="text-xs text-slate-500 italic">Unassigned</span>
                ),
        },
        {
            key: 'email',
            label: 'Email',
            sortable: true,
            defaultVisible: false,
            exportValue: (row) => row.email,
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (user) =>
                editingUser === user._id ? (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleSave(user._id)}
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-[8px] text-xs font-bold uppercase disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Confirm'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditingUser(null)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-[8px] text-xs font-bold uppercase"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => handleEdit(user)}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 text-blue-400 rounded-[8px] text-xs font-bold uppercase hover:bg-blue-600 hover:text-white transition-all"
                    >
                        Modify
                    </button>
                ),
        },
    ];

    const roleFilterOptions = [
        { value: 'student', label: 'Student' },
        { value: 'faculty', label: 'Faculty' },
        { value: 'hod', label: 'HOD' },
        { value: 'committee_member', label: 'Committee' },
        { value: 'admin', label: 'Admin' },
    ];

    return (
        <DashboardShell
            role="admin"
            toast={toast}
            sidebarItems={getRoleNavigation('admin')}
            activeHref="/admin/users"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <span className="px-3 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Admin
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3 italic uppercase">
                        User <span className="text-blue-400">Management</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm font-medium">
                        Manage institutional roles and departmental assignments
                    </p>
                </div>
                <Link
                    href="/dashboard/admin"
                    className="px-5 py-3 bg-[#131b2e] border border-slate-800 rounded-[12px] text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500 transition-all"
                >
                    ← Dashboard
                </Link>
            </div>

            <DataTable
                data={users}
                columns={columns}
                loading={loading}
                searchPlaceholder="Search by name or email..."
                getSearchText={(row) => `${row.fullName} ${row.email} ${row.role}`}
                filters={[
                    {
                        key: 'role',
                        label: 'Roles',
                        options: roleFilterOptions,
                    },
                ]}
                pageSize={10}
                emptyMessage="No users found"
                exportFilename="institutional_users"
                rowKey={(row) => row._id}
            />
        </DashboardShell>
    );
}
