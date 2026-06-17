import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';
import Navbar from '../components/Navbar';
import DataTable, { type DataTableColumn } from '../components/dashboard/DataTable';

type PaperRow = {
  _id: string;
  title: string;
  type: string;
  year: number | string;
  abstract?: string;
  status?: string;
  pdfUrl?: string;
  readsCount?: number;
  citationsCount?: number;
  submittedBy?: { fullName?: string };
  departmentId?: { name?: string };
  createdAt?: string;
};

export default function BrowsePapersPage() {
    const [papers, setPapers] = useState<PaperRow[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        keyword: '',
        department: '',
        year: '',
        type: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDepartments();
        fetchPapers();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data);
        } catch {
            console.error('Failed to fetch departments');
        }
    };

    const fetchPapers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.keyword) params.append('keyword', filters.keyword);
            if (filters.department) params.append('department', filters.department);
            if (filters.year) params.append('year', filters.year);
            if (filters.type) params.append('type', filters.type);

            const res = await api.get(`/papers/search?${params.toString()}`);
            setPapers(res.data);
        } catch {
            console.error('Failed to fetch papers');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPapers();
    };

    const handleDownload = (fileUrl: string) => {
        if (fileUrl) window.open(fileUrl, '_blank');
    };

    const columns: DataTableColumn<PaperRow>[] = [
        {
            key: 'title',
            label: 'Title',
            sortable: true,
            exportValue: (row) => row.title,
            render: (paper) => (
                <Link href={`/paper/${paper._id}`} className="font-bold text-white hover:text-blue-400 transition-colors line-clamp-2 max-w-md">
                    {paper.title}
                </Link>
            ),
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            exportValue: (row) => row.type,
            render: (paper) => (
                <span className="px-2 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded-[8px] text-[10px] font-bold uppercase">
                    {paper.type}
                </span>
            ),
        },
        {
            key: 'year',
            label: 'Year',
            sortable: true,
            exportValue: (row) => String(row.year ?? ''),
        },
        {
            key: 'author',
            label: 'Author',
            sortable: true,
            exportValue: (row) => row.submittedBy?.fullName || 'Anonymous',
            render: (paper) => (
                <span className="text-sm font-semibold text-slate-300">
                    {paper.submittedBy?.fullName || 'Anonymous'}
                </span>
            ),
        },
        {
            key: 'department',
            label: 'Department',
            sortable: true,
            exportValue: (row) => row.departmentId?.name || '—',
            render: (paper) => (
                <span className="text-sm text-slate-400">{paper.departmentId?.name || '—'}</span>
            ),
        },
        {
            key: 'readsCount',
            label: 'Reads',
            sortable: true,
            defaultVisible: false,
            exportValue: (row) => row.readsCount ?? 0,
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (paper) => (
                <div className="flex gap-2">
                    <Link
                        href={`/paper/${paper._id}`}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-blue-400 rounded-[8px] text-[10px] font-bold uppercase hover:bg-blue-600 hover:text-white transition-all"
                    >
                        View
                    </Link>
                    {paper.pdfUrl && (
                        <button
                            type="button"
                            onClick={() => handleDownload(paper.pdfUrl!)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-[8px] text-[10px] font-bold uppercase hover:text-white transition-all"
                        >
                            PDF
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const typeOptions = [
        { value: 'Journal', label: 'Journal' },
        { value: 'Conference', label: 'Conference' },
        { value: 'Research Paper', label: 'Research Paper' },
        { value: 'Thesis', label: 'Thesis' },
        { value: 'Patent', label: 'Patent' },
    ];

    return (
        <div className="min-h-screen bg-[#0b0f19] pb-20">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40">
                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2 italic uppercase">
                        Research <span className="text-blue-400">Explorer</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Search and browse approved scholarly works from the institutional repository
                    </p>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="bg-[#131b2e] border border-slate-800 rounded-[16px] p-4 sm:p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4"
                >
                    <div className="lg:col-span-4">
                        <input
                            type="text"
                            placeholder="Search title, author, keywords..."
                            value={filters.keyword}
                            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-[12px] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-[12px] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept: any) => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <select
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-[12px] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Years</option>
                            {[2025, 2024, 2023, 2022, 2021].map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <select
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-[12px] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            {typeOptions.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="lg:col-span-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] font-bold text-xs uppercase tracking-wider transition-all py-3"
                    >
                        Search Repository
                    </button>
                </form>

                <DataTable
                    data={papers}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Filter results..."
                    getSearchText={(row) =>
                        `${row.title} ${row.submittedBy?.fullName || ''} ${row.departmentId?.name || ''} ${row.type} ${row.abstract || ''}`
                    }
                    filters={[
                        {
                            key: 'type',
                            label: 'Types',
                            options: typeOptions,
                        },
                    ]}
                    pageSize={10}
                    emptyMessage="No papers match your search"
                    exportFilename="research_papers"
                    rowKey={(row) => row._id}
                />
            </div>
        </div>
    );
}
