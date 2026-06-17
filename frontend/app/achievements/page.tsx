'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import Navbar from '../../components/Navbar';
import DataTable, { type DataTableColumn } from '../../components/dashboard/DataTable';
import Toast from '../../components/dashboard/Toast';
import { useToast } from '../../lib/useToast';

type AchievementRow = {
  _id: string;
  achievementTitle: string;
  studentName: string;
  usn: string;
  category: string;
  department: string;
  status: string;
  description: string;
  achievementDate: string;
  createdAt: string;
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/achievements');
      setAchievements(response.data.data || []);
    } catch {
      showToast('Failed to load achievements.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/achievements/${id}`);
      setAchievements((prev) => prev.filter((a) => a._id !== id));
      setDeleteTarget(null);
      showToast('Achievement deleted.', 'success');
    } catch {
      showToast('Failed to delete achievement.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40',
      pending: 'bg-amber-950/40 text-amber-400 border-amber-900/40',
      rejected: 'bg-red-950/40 text-red-400 border-red-900/40',
    };
    return styles[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const columns: DataTableColumn<AchievementRow>[] = [
    {
      key: 'achievementTitle',
      label: 'Achievement',
      sortable: true,
      exportValue: (row) => row.achievementTitle,
      render: (row) => (
        <div>
          <Link href={`/achievements/${row._id}`} className="font-bold text-white hover:text-blue-400 transition-colors">
            {row.achievementTitle}
          </Link>
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'studentName',
      label: 'Student',
      sortable: true,
      exportValue: (row) => `${row.studentName} (${row.usn})`,
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-200">{row.studentName}</p>
          <p className="text-xs text-slate-500 font-mono">{row.usn}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      exportValue: (row) => row.category,
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      exportValue: (row) => row.department,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      exportValue: (row) => row.status,
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase border ${statusBadge(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'achievementDate',
      label: 'Date',
      sortable: true,
      exportValue: (row) => new Date(row.achievementDate).toLocaleDateString(),
      render: (row) => (
        <span className="text-sm text-slate-400">
          {new Date(row.achievementDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/achievements/${row._id}`}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-[8px] text-[10px] font-bold uppercase"
          >
            View
          </Link>
          <Link
            href={`/achievements/${row._id}/edit`}
            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-[8px] text-[10px] font-bold uppercase border border-slate-700"
          >
            Edit
          </Link>
          {deleteTarget === row._id ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleDelete(row._id)}
                disabled={deleting}
                className="px-3 py-1.5 bg-red-600 text-white rounded-[8px] text-[10px] font-bold uppercase disabled:opacity-50"
              >
                {deleting ? '...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-[8px] text-[10px] font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDeleteTarget(row._id)}
              className="px-3 py-1.5 bg-red-950/30 text-red-400 border border-red-900/40 rounded-[8px] text-[10px] font-bold uppercase"
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] pb-20">
      <Navbar />
      <Toast toast={toast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <span className="px-3 py-1 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Milestones
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3 italic uppercase">
              Student <span className="text-blue-400">Achievements</span>
            </h1>
          </div>
          <Link
            href="/achievements/create"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] text-xs font-bold uppercase tracking-widest transition-all"
          >
            + Add Achievement
          </Link>
        </div>

        <DataTable
          data={achievements}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search achievements, students, USN..."
          getSearchText={(row) =>
            `${row.achievementTitle} ${row.studentName} ${row.usn} ${row.category} ${row.department} ${row.description}`
          }
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ],
            },
            {
              key: 'category',
              label: 'Categories',
              options: [
                { value: 'Academic', label: 'Academic' },
                { value: 'Sports', label: 'Sports' },
                { value: 'Cultural', label: 'Cultural' },
                { value: 'Technical', label: 'Technical' },
                { value: 'Research', label: 'Research' },
                { value: 'Social Service', label: 'Social Service' },
                { value: 'Other', label: 'Other' },
              ],
            },
            {
              key: 'department',
              label: 'Departments',
              options: [
                { value: 'CSE', label: 'CSE' },
                { value: 'ECE', label: 'ECE' },
                { value: 'ME', label: 'ME' },
                { value: 'CE', label: 'CE' },
                { value: 'EEE', label: 'EEE' },
                { value: 'IT', label: 'IT' },
              ],
            },
          ]}
          pageSize={10}
          emptyMessage="No achievements found"
          exportFilename="student_achievements"
          rowKey={(row) => row._id}
        />
      </div>
    </div>
  );
}
