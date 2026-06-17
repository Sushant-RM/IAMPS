import { useState, useEffect } from 'react';
import api from '../lib/api';

interface Paper {
    _id: string;
    title: string;
    abstract: string;
    authors: string[];
    departmentId: { name: string };
    year: number;
    type: string;
    pdfUrl: string;
}

interface Department {
    _id: string;
    name: string;
}

export default function PapersSearch() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);

    // Filters
    const [q, setQ] = useState('');
    const [dept, setDept] = useState('');
    const [year, setYear] = useState('');
    const [type, setType] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDepartments();
        handleSearch(); // Initial load
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments'); // Assuming this exists, if not we might need to create it or mock
            setDepartments(res.data);
        } catch (err: any) {
            // If /departments doesn't exist, we just won't show options
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q) params.append('q', q);
            if (dept) params.append('dept', dept);
            if (year) params.append('year', year);
            if (type) params.append('type', type);

            const res = await api.get(`/search/papers?${params.toString()}`);
            setPapers(res.data);
        } catch (err: any) {
            console.error('Search failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Search Papers</h1>

                {/* Filters */}
                <form onSubmit={handleSearch} className="bg-white p-6 rounded shadow mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            placeholder="Search title, abstract, author..."
                            className="w-full border rounded p-2"
                            value={q}
                            onChange={e => setQ(e.target.value)}
                        />
                    </div>
                    <div>
                        <select className="w-full border rounded p-2" value={dept} onChange={e => setDept(e.target.value)}>
                            <option value="">All Departments</option>
                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <input
                            type="number"
                            placeholder="Year"
                            className="w-full border rounded p-2"
                            value={year}
                            onChange={e => setYear(e.target.value)}
                        />
                    </div>
                    <div>
                        <select className="w-full border rounded p-2" value={type} onChange={e => setType(e.target.value)}>
                            <option value="">All Types</option>
                            <option value="research_paper">Research Paper</option>
                            <option value="journal">Journal</option>
                            <option value="conference">Conference</option>
                        </select>
                    </div>
                    <div className="md:col-span-5 flex justify-end">
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                            Search
                        </button>
                    </div>
                </form>

                {/* Results */}
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : (
                    <div className="grid gap-6">
                        {papers.map(paper => (
                            <div key={paper._id} className="bg-white p-6 rounded shadow hover:shadow-md transition">
                                <h2 className="text-xl font-bold text-blue-700 mb-2">{paper.title}</h2>
                                <p className="text-sm text-gray-600 mb-2">
                                    {paper.authors.join(', ')} • {paper.year} • {paper.departmentId?.name}
                                </p>
                                <p className="text-gray-700 mb-4 line-clamp-2">{paper.abstract}</p>
                                <div className="flex justify-between items-center">
                                    <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                                        {paper.type.replace('_', ' ')}
                                    </span>
                                    <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        View PDF
                                    </a>
                                </div>
                            </div>
                        ))}
                        {papers.length === 0 && !loading && (
                            <p className="text-center text-gray-500">No papers found matching your criteria.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
